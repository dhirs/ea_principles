"""The generic three-node section subgraph: generate -> rubric -> revise.

One factory builds the subgraph for ANY section by name — the only thing that
varies is which prompt JSON files get loaded. The compiled graph is named after
the section so it shows up distinctly in LangSmith. The interesting logic is in
the edges (threshold routing + bounded retry), not the nodes.
"""
from __future__ import annotations

from typing import Any, TypedDict

from langgraph.graph import END, START, StateGraph

from . import composer, config
from .llm_client import LLMClient
from .prompt_loader import load_section_prompt
from .rubric import evaluate_rubric
from .validator import ContractError, parse_and_validate, parse_json


class SectionGraphState(TypedDict, total=False):
    section: str
    inputs: dict           # placeholder sources (principle_id, aws_anchor, ...)
    draft: dict | None
    rubric_scores: dict | None
    verdict: str | None    # 'ratify' | 'fail'
    fail_dimensions: list
    well_formed_fail: bool  # set when parse/validate failed -> force revise
    retry_count: int
    status: str            # 'ratified' | 'hard_failed'


def _output_contract(section: str, op: str) -> dict:
    return load_section_prompt(section, op).get("output_contract", {})


def build_section_subgraph(section: str, llm: LLMClient):
    max_retries = config.max_retries_for(section)

    def generate_node(state: SectionGraphState) -> dict:
        system = composer.compose_system_prompt(section, "generate")
        ph = composer.build_placeholders(state["inputs"])
        user = composer.fill_user_template(section, "generate", ph)
        raw = llm.complete(config.GENERATE_MODEL, system, user, config.MAX_TOKENS)
        try:
            draft = parse_and_validate(raw, _output_contract(section, "generate"))
            return {"draft": draft, "well_formed_fail": False}
        except ContractError:
            return {"draft": {"_raw": raw}, "well_formed_fail": True}

    def rubric_node(state: SectionGraphState) -> dict:
        if state.get("well_formed_fail"):
            # synthetic dimension failure — skip the LLM, go straight to revise
            return {
                "rubric_scores": {"well_formed": {"score": 0, "justification": "unparseable / contract violation"}},
                "verdict": "fail",
                "fail_dimensions": ["well_formed"],
            }
        system = composer.compose_system_prompt(section, "rubric")
        ph = composer.build_placeholders(state["inputs"], draft=state["draft"])
        user = composer.fill_user_template(section, "rubric", ph)
        raw = llm.complete(config.RUBRIC_MODEL, system, user, config.MAX_TOKENS)
        try:
            scores = parse_json(raw)
        except ContractError:
            return {
                "rubric_scores": {"well_formed": {"score": 0, "justification": "rubric output unparseable"}},
                "verdict": "fail",
                "fail_dimensions": ["well_formed"],
            }
        v = evaluate_rubric(scores)
        return {"rubric_scores": scores, "verdict": v.verdict, "fail_dimensions": v.fail_dimensions}

    def revise_node(state: SectionGraphState) -> dict:
        system = composer.compose_system_prompt(section, "revise")
        ph = composer.build_placeholders(
            state["inputs"], draft=state["draft"], rubric_scores=state["rubric_scores"]
        )
        user = composer.fill_user_template(section, "revise", ph)
        raw = llm.complete(config.REVISE_MODEL, system, user, config.MAX_TOKENS)
        retry = state.get("retry_count", 0) + 1
        try:
            draft = parse_and_validate(raw, _output_contract(section, "revise"))
            return {"draft": draft, "retry_count": retry, "well_formed_fail": False}
        except ContractError:
            return {"draft": {"_raw": raw}, "retry_count": retry, "well_formed_fail": True}

    def after_rubric(state: SectionGraphState) -> str:
        if state.get("verdict") == "ratify":
            return "ratify"
        if state.get("retry_count", 0) >= max_retries:
            return "hard_fail"
        return "revise"

    g = StateGraph(SectionGraphState)
    g.add_node("generate", generate_node)
    g.add_node("rubric", rubric_node)
    g.add_node("revise", revise_node)

    g.add_edge(START, "generate")
    g.add_edge("generate", "rubric")
    g.add_conditional_edges(
        "rubric",
        after_rubric,
        {"ratify": END, "revise": "revise", "hard_fail": END},
    )
    g.add_edge("revise", "rubric")

    compiled = g.compile()
    compiled.name = section  # distinct node in LangSmith traces
    return compiled


def run_section(section: str, llm: LLMClient, inputs: dict, *, config_overrides: dict | None = None) -> SectionGraphState:
    """Invoke a section subgraph and label the run for LangSmith."""
    graph = build_section_subgraph(section, llm)
    run_config: dict[str, Any] = {
        "run_name": f"{inputs.get('principle_id','?')}:{section}",
        "tags": [section, inputs.get("principle_id", "?"), "author"],
        "metadata": {"section": section, "principle_id": inputs.get("principle_id", "?")},
    }
    if config_overrides:
        run_config.update(config_overrides)
    result = graph.invoke(
        {"section": section, "inputs": inputs, "retry_count": 0}, config=run_config
    )
    result["status"] = "ratified" if result.get("verdict") == "ratify" else "hard_failed"
    return result
