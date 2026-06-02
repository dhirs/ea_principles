"""Phase 1 — step promotion (BP-walking).

For one AWS implementation step, decide promote vs not_promote. Same three-op
discipline as a per-principle section (generate -> rubric -> revise, bounded
retries) but with step_promotion's own placeholder set, so it reuses the prompt
primitives directly rather than the per-principle subgraph (whose placeholders
differ). A ratified result means the decision is well-justified; `decision` says
which way it went.
"""
from __future__ import annotations

from dataclasses import dataclass, field

from . import composer, config
from .llm_client import LLMClient
from .prompt_loader import load_section_prompt
from .rubric import evaluate_rubric
from .validator import ContractError, parse_and_validate, parse_json

SECTION = "step_promotion"


@dataclass
class Step:
    bp_code: str
    step_number: int
    step_title: str
    step_verbatim: str
    bp_title: str = ""
    bp_implementation_guidance: str = ""
    pillar: str = ""
    focus_area: str = ""
    sibling_decisions: list = field(default_factory=list)
    adjacent_scope_candidates: list = field(default_factory=list)


@dataclass
class StepDecision:
    decision: str            # 'promote' | 'not_promote'
    rationale: str
    draft: dict
    ratified: bool
    scores: dict
    retry_count: int


def _placeholders(step: Step, *, draft: dict | None = None, scores: dict | None = None) -> dict[str, str]:
    ph = {
        "bp_code": step.bp_code,
        "bp_title": step.bp_title,
        "bp_implementation_guidance": step.bp_implementation_guidance,
        "pillar": step.pillar,
        "focus_area": step.focus_area,
        "step_number": step.step_number,
        "step_title": step.step_title,
        "step_verbatim_text": step.step_verbatim,
        "sibling_decisions": step.sibling_decisions,
        "adjacent_scope_candidates": step.adjacent_scope_candidates,
    }
    if draft:
        ip = draft.get("if_promote") or {}
        inp = draft.get("if_not_promote") or {}
        ph.update(
            candidate_decision=draft.get("decision", ""),
            candidate_rationale=draft.get("rationale", ""),
            candidate_artefact=ip.get("candidate_artefact", ""),
            candidate_gate_shape=ip.get("candidate_gate_shape", ""),
            non_promotion_reason=inp.get("non_promotion_reason", ""),
            absorbing_principle_id=inp.get("absorbing_principle_id", ""),
            cross_pillar_target=inp.get("cross_pillar_target", ""),
        )
    if scores:
        for dim, entry in scores.items():
            if isinstance(entry, dict):
                ph[f"score_{dim}"] = entry.get("score", "")
                ph[f"justification_{dim}"] = entry.get("justification", "")
    return {k: composer._stringify(v) for k, v in ph.items()}


def _contract(op: str) -> dict:
    return load_section_prompt(SECTION, op).get("output_contract", {})


def _call(llm: LLMClient, op: str, model: str, ph: dict) -> str:
    system = composer.compose_system_prompt(SECTION, op)
    user = composer.fill_user_template(SECTION, op, ph)
    return llm.complete(model, system, user, config.MAX_TOKENS)


def promote_step(step: Step, llm: LLMClient) -> StepDecision:
    """Run generate -> rubric -> (revise -> rubric)* with bounded retries."""
    max_retries = config.max_retries_for(SECTION)

    raw = _call(llm, "generate", config.GENERATE_MODEL, _placeholders(step))
    try:
        draft = parse_and_validate(raw, _contract("generate"))
    except ContractError:
        draft = {"decision": "not_promote", "rationale": "unparseable generate", "_raw": raw}

    retry_count = 0
    scores: dict = {}
    while True:
        try:
            scores = parse_json(_call(llm, "rubric", config.RUBRIC_MODEL, _placeholders(step, draft=draft)))
        except ContractError:
            scores = {"well_formed": {"score": 0, "justification": "rubric unparseable"}}
        verdict = evaluate_rubric(scores)
        if verdict.ratified:
            return StepDecision(draft.get("decision", "not_promote"), draft.get("rationale", ""), draft, True, scores, retry_count)
        if retry_count >= max_retries:
            return StepDecision(draft.get("decision", "not_promote"), draft.get("rationale", ""), draft, False, scores, retry_count)
        retry_count += 1
        raw = _call(llm, "revise", config.REVISE_MODEL, _placeholders(step, draft=draft, scores=scores))
        try:
            draft = parse_and_validate(raw, _contract("revise"))
        except ContractError:
            draft = {**draft, "_raw": raw}


def walk_bp(steps: list[Step], llm: LLMClient) -> dict[int, StepDecision]:
    """Run promote_step across every step in a BP; key by step number."""
    return {step.step_number: promote_step(step, llm) for step in steps}
