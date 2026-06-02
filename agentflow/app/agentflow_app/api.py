"""Programmatic entry point: author a principle from an anchor dict.

`author_principle` runs step-promotion + (if promoted) the per-principle pipeline
+ catalogue write, and returns a structured result. It's decorated with LangSmith
`@traceable`, so the whole flow — step_promotion, every section, finalize — nests
under ONE trace tree per call (named `author:<principle_id>`) instead of separate
fragments. This is also the function external callers (e.g. an HTTP wrapper, or
Claude Code) should invoke to trigger the pipeline.
"""
from __future__ import annotations

import json

from langsmith import traceable

from . import config
from .llm_client import LLMClient
from .persistence import update_lens_mapping, write_to_catalogue
from .pipeline import run_pipeline
from .step_promotion import Step


def next_principle_id(bp_code: str) -> str:
    target = config.PRINCIPLES_JSON
    n = 0
    if target.exists():
        cat = json.loads(target.read_text())
        n = sum(1 for p in cat.get("principles", []) if str(p.get("principle_id", "")).startswith(bp_code))
    return f"{bp_code}-{n + 1:02d}"


@traceable(name="author", run_type="chain")
def author_principle(anchor: dict, *, llm: LLMClient, checkpointer=None, write_real: bool = False) -> dict:
    """Step-promote one step; if it promotes, author the full principle.

    Returns: {decision, ratified, principle_id?, status, section_status?}.
    """
    from .step_promotion import promote_step  # local import keeps trace nesting clean

    step = Step(
        bp_code=anchor.get("bp_code", ""),
        step_number=anchor.get("step_number", 1),
        step_title=anchor.get("step_title", ""),
        step_verbatim=anchor.get("step_verbatim", ""),
        bp_title=anchor.get("bp_title", ""),
        bp_implementation_guidance=anchor.get("bp_implementation_guidance", ""),
        pillar=anchor.get("pillar", ""),
        focus_area=anchor.get("focus_area", ""),
    )
    decision = promote_step(step, llm)
    result: dict = {"decision": decision.decision, "ratified": decision.ratified}
    update_lens_mapping(
        step.bp_code, step.step_number,
        "promoted_to_principle" if decision.decision == "promote" else "not_promoted",
        decision.rationale[:120],
    )
    if decision.decision != "promote":
        result["status"] = "not_promoted"
        return result

    pid = anchor.get("principle_id") or next_principle_id(anchor.get("bp_code", "PRIN"))
    result["principle_id"] = pid
    final = run_pipeline(
        pid, anchor, llm=llm, checkpointer=checkpointer,
        pillar=anchor.get("pillar", ""), focus_area=anchor.get("focus_area", ""),
        sibling_sections=anchor.get("sibling_sections", {}),
    )
    result["section_status"] = final.get("section_status", {})
    if final.get("status") == "completed":
        write_to_catalogue(final, target=config.PRINCIPLES_JSON if write_real else None)
        result["status"] = "completed"
    else:
        result["status"] = "awaiting_human"
    return result
