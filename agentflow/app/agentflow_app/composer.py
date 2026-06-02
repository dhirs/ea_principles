"""Prompt composition: system-prompt assembly + user-template filling.

system prompt = system_prompts/<op>.system_base + "\n\n" + sections/<section>/<op>.system_addendum
user prompt   = sections/<section>/<op>.user_template, with {{placeholders}} filled.
"""
from __future__ import annotations

import re
from typing import Any

from .prompt_loader import load_section_prompt, load_system_prompt

_PLACEHOLDER = re.compile(r"{{\s*([a-zA-Z0-9_.]+)\s*}}")


def compose_system_prompt(section: str, op: str) -> str:
    base = load_system_prompt(op)["system_base"]
    addendum = load_section_prompt(section, op).get("system_addendum", "")
    return f"{base}\n\n{addendum}".strip()


def _stringify(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, (list, tuple)):
        return "\n".join(f"- {_stringify(v)}" for v in value)
    if isinstance(value, dict):
        return "\n".join(f"{k}: {_stringify(v)}" for k, v in value.items())
    return str(value)


def build_placeholders(
    inputs: dict,
    *,
    draft: dict | None = None,
    rubric_scores: dict | None = None,
) -> dict[str, str]:
    """Flatten pipeline state into the {{placeholder}} names used by templates.

    `inputs` carries: principle_id, pillar, focus_area, sibling_statements (list),
    and aws_anchor (dict with bp_code/bp_title/step_number/step_title/
    step_verbatim/pillar/question).
    """
    anchor = inputs.get("aws_anchor", {}) or {}
    ph: dict[str, Any] = {
        "principle_id": inputs.get("principle_id", ""),
        "pillar": inputs.get("pillar", ""),
        "focus_area": inputs.get("focus_area", ""),
        "sibling_statements": inputs.get("sibling_statements", []),
        "aws_bp": anchor.get("bp_code") or anchor.get("bp_title", ""),
        "aws_pillar": anchor.get("pillar", inputs.get("pillar", "")),
        "aws_question": anchor.get("question", ""),
        "aws_step_number": anchor.get("step_number", ""),
        "aws_step_title": anchor.get("step_title", ""),
        "aws_step_verbatim": anchor.get("step_verbatim", ""),
    }

    # rubric/revise score the current draft -> expose its title/description.
    if draft:
        ph["candidate_title"] = draft.get("title", "")
        ph["candidate_description"] = draft.get("description", "")

    # revise needs the failing per-dimension scores + justifications flattened.
    if rubric_scores:
        for dim, entry in rubric_scores.items():
            if isinstance(entry, dict):
                ph[f"score_{dim}"] = entry.get("score", "")
                ph[f"justification_{dim}"] = entry.get("justification", "")

    return {k: _stringify(v) for k, v in ph.items()}


def fill_user_template(section: str, op: str, placeholders: dict[str, str]) -> str:
    template = load_section_prompt(section, op)["user_template"]
    return _PLACEHOLDER.sub(lambda m: placeholders.get(m.group(1), ""), template)
