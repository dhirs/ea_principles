"""Per-principle orchestrator — a single flat LangGraph.

Each section contributes three nodes directly to ONE graph: ``<section>_generate
-> <section>_rubric -> <section>_revise`` (with a bounded revise loop). No nested
sub-graph per section, so the LangSmith trace is one clean tree:
``author -> graph -> statement_generate -> statement_rubric -> ...`` instead of a
node that wraps a whole separate sub-graph.

Nodes operate on the shared ``PrincipleGraphState``: the rubric node, on ratify,
writes the draft into ``locked[section]`` and marks ``section_status[section]``;
on exhausting retries it marks the section ``hard_failed``. Compiled with a
checkpointer and run with ``thread_id = principle_id`` for resumable runs.
"""
from __future__ import annotations

from typing import Any, TypedDict

from langgraph.graph import END, START, StateGraph

from . import composer, config
from .llm_client import LLMClient
from .prompt_loader import load_section_prompt
from .rubric import evaluate_rubric
from .validator import ContractError, parse_and_validate, parse_json


class PrincipleGraphState(TypedDict, total=False):
    principle_id: str
    pillar: str
    focus_area: str
    aws_anchor: dict
    sibling_sections: dict
    locked: dict             # section -> ratified draft
    section_status: dict     # section -> 'ratified' | 'hard_failed'
    # transient per-section working fields:
    draft: dict | None
    rubric_scores: dict | None
    verdict: str | None
    fail_dimensions: list
    well_formed_fail: bool
    retry_count: int
    status: str


def _contract(section: str, op: str) -> dict:
    return load_section_prompt(section, op).get("output_contract", {})


def _section_inputs(state: PrincipleGraphState, section: str) -> dict:
    return {
        "principle_id": state["principle_id"],
        "pillar": state.get("pillar", ""),
        "focus_area": state.get("focus_area", ""),
        "aws_anchor": state.get("aws_anchor", {}),
        "sibling_statements": state.get("sibling_sections", {}).get(section, []),
    }


def _add_section(g: StateGraph, section: str, llm: LLMClient, target_next) -> str:
    """Add <section>_generate/_rubric/_revise to the graph. Returns the entry node."""
    gen, rub, rev = f"{section}_generate", f"{section}_rubric", f"{section}_revise"
    max_retries = config.max_retries_for(section)

    def generate_node(state: PrincipleGraphState) -> dict:
        inp = _section_inputs(state, section)
        system = composer.compose_system_prompt(section, "generate")
        user = composer.fill_user_template(section, "generate", composer.build_placeholders(inp))
        raw = llm.complete(
            config.GENERATE_MODEL, system, user, config.MAX_TOKENS,
            contract=_contract(section, "generate"), schema_name=f"{section}_generate",
            run_name=f"{section}:generate", trace_metadata={"section": section, "op": "generate", "principle_id": state["principle_id"]},
        )
        try:
            return {"draft": parse_and_validate(raw, _contract(section, "generate")), "well_formed_fail": False, "retry_count": 0}
        except ContractError:
            return {"draft": {"_raw": raw}, "well_formed_fail": True, "retry_count": 0}

    def rubric_node(state: PrincipleGraphState) -> dict:
        if state.get("well_formed_fail"):
            scores = {"well_formed": {"score": 0, "justification": "unparseable / contract violation"}}
        else:
            inp = _section_inputs(state, section)
            system = composer.compose_system_prompt(section, "rubric")
            user = composer.fill_user_template(section, "rubric", composer.build_placeholders(inp, draft=state["draft"]))
            raw = llm.complete(
                config.RUBRIC_MODEL, system, user, config.MAX_TOKENS,
                contract=_contract(section, "rubric"), schema_name=f"{section}_rubric",
                run_name=f"{section}:rubric", trace_metadata={"section": section, "op": "rubric", "principle_id": state["principle_id"]},
            )
            try:
                scores = parse_json(raw)
            except ContractError:
                scores = {"well_formed": {"score": 0, "justification": "rubric output unparseable"}}
        v = evaluate_rubric(scores)
        update: dict[str, Any] = {"rubric_scores": scores, "verdict": v.verdict, "fail_dimensions": v.fail_dimensions}
        if v.verdict == "ratify":
            update["locked"] = {**state.get("locked", {}), section: state["draft"]}
            update["section_status"] = {**state.get("section_status", {}), section: "ratified"}
        elif state.get("retry_count", 0) >= max_retries:
            update["section_status"] = {**state.get("section_status", {}), section: "hard_failed"}
        return update

    def revise_node(state: PrincipleGraphState) -> dict:
        inp = _section_inputs(state, section)
        system = composer.compose_system_prompt(section, "revise")
        user = composer.fill_user_template(section, "revise", composer.build_placeholders(inp, draft=state["draft"], rubric_scores=state["rubric_scores"]))
        raw = llm.complete(
            config.REVISE_MODEL, system, user, config.MAX_TOKENS,
            contract=_contract(section, "revise"), schema_name=f"{section}_revise",
            run_name=f"{section}:revise", trace_metadata={"section": section, "op": "revise", "principle_id": state["principle_id"]},
        )
        retry = state.get("retry_count", 0) + 1
        try:
            return {"draft": parse_and_validate(raw, _contract(section, "revise")), "well_formed_fail": False, "retry_count": retry}
        except ContractError:
            return {"draft": {"_raw": raw}, "well_formed_fail": True, "retry_count": retry}

    def after_rubric(state: PrincipleGraphState) -> str:
        if state.get("verdict") == "ratify":
            return "next"
        if state.get("retry_count", 0) >= max_retries:
            return "next"  # give up on this section (marked hard_failed); keep going
        return "revise"

    g.add_node(gen, generate_node)
    g.add_node(rub, rubric_node)
    g.add_node(rev, revise_node)
    g.add_edge(gen, rub)
    g.add_conditional_edges(rub, after_rubric, {"next": target_next, "revise": rev})
    g.add_edge(rev, rub)
    return gen


def build_pipeline_graph(llm: LLMClient, *, sections: list[str] | None = None, checkpointer=None):
    sections = sections or config.SECTION_ORDER
    g = StateGraph(PrincipleGraphState)
    gen_names = [f"{s}_generate" for s in sections]
    for i, section in enumerate(sections):
        target = gen_names[i + 1] if i + 1 < len(sections) else END
        _add_section(g, section, llm, target)
    g.add_edge(START, gen_names[0])
    compiled = g.compile(checkpointer=checkpointer)
    compiled.name = "agentflow-principle"
    return compiled


def run_pipeline(
    principle_id: str,
    aws_anchor: dict,
    *,
    llm: LLMClient,
    checkpointer=None,
    pillar: str = "",
    focus_area: str = "",
    sibling_sections: dict | None = None,
    sections: list[str] | None = None,
) -> dict:
    graph = build_pipeline_graph(llm, sections=sections, checkpointer=checkpointer)
    run_config = {
        "configurable": {"thread_id": principle_id},
        "run_name": f"author:{principle_id}",
        "tags": [principle_id, "author"],
        "metadata": {"principle_id": principle_id},
    }
    final = graph.invoke(
        {
            "principle_id": principle_id,
            "aws_anchor": aws_anchor,
            "pillar": pillar,
            "focus_area": focus_area,
            "sibling_sections": sibling_sections or {},
            "locked": {},
            "section_status": {},
        },
        config=run_config,
    )
    ss = final.get("section_status", {})
    final["status"] = "awaiting_human" if any(v == "hard_failed" for v in ss.values()) else "completed"
    return final
