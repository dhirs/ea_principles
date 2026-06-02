"""Deterministic fill nodes — computed from upstream state + convention.

These are plain functions, NOT LLM subgraphs. They run after the LLM-authored
sections are locked. Kept intentionally simple/defensive; refine as the schema
firms up.
"""
from __future__ import annotations

from datetime import date


def assign_pillar_and_focus_area(aws_anchor: dict) -> tuple[str, str]:
    return aws_anchor.get("pillar", ""), aws_anchor.get("focus_area", "")


def ownership_fill(tier_draft: dict | None) -> dict:
    """validator / audit_mode / arb_role from the tier outcome (see pipeline.md)."""
    tier = (tier_draft or {}).get("tier") or (tier_draft or {}).get("outcome") or "local"
    if tier in ("mandatory_centralise", "enterprise"):
        validator = (tier_draft or {}).get("validator", "specialist")
        audit_mode = "central_review_at_gate"
    else:
        validator = "project_architect"
        audit_mode = "self_attestation_with_mechanical_evidence"
    return {
        "tier": tier,
        "validator": validator,
        "audit_mode": audit_mode,
        "arb_role": "dashboard_and_spot_check",
    }


def evidence_from_audit(audit_mode: str) -> dict:
    if audit_mode == "central_review_at_gate":
        return {"artefacts": [], "review_mode": "central", "sign_off": "gated", "_requires_artefacts": True}
    return {"artefacts": [], "review_mode": "automated_only", "sign_off": "binary"}


def change_history_initial(author: str = "agentflow") -> list[dict]:
    return [
        {
            "version": "1.0.0",
            "date": date.today().isoformat(),
            "author": author,
            "summary": "Initial authoring.",
        }
    ]
