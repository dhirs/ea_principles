"""Review a customer's design against a standard.

The standard's *gates* (the blocking acceptance criteria) live in the catalogue
and are the checklist a design must satisfy. The per-section *rubrics* (the judge
prompts + calibration under data/sections/) are the moat — they are read here,
server-side, and NEVER returned. We expose only dimension NAMES + the threshold
and, when an LLM judge is configured, the resulting verdict + justification.
"""

from __future__ import annotations

import json
import os
import re
from functools import lru_cache
from pathlib import Path
from typing import Any

from . import catalogue


def _sections_dir() -> Path:
    return catalogue._default_data_dir() / "sections"


@lru_cache(maxsize=32)
def _load_rubric(section: str) -> dict[str, Any] | None:
    path = _sections_dir() / section / "rubric.json"
    if not path.exists():
        return None
    with path.open(encoding="utf-8") as fh:
        return json.load(fh)


def _dimension_names(rubric: dict[str, Any]) -> list[str]:
    """Extract dimension names from the (private) system_addendum without
    returning the calibration text itself."""
    text = rubric.get("system_addendum") or ""
    # Dimensions are written as "N. name — ..." in the addendum.
    names = re.findall(r"^\s*\d+\.\s+([a-z][a-z0-9_]+)\b", text, flags=re.MULTILINE)
    # Dedupe, preserve order.
    seen: list[str] = []
    for n in names:
        if n not in seen:
            seen.append(n)
    return seen


def _threshold(rubric: dict[str, Any]) -> str | None:
    purpose = rubric.get("purpose") or ""
    m = re.search(r"threshold\s*=\s*([^.]+)", purpose, flags=re.IGNORECASE)
    return m.group(1).strip() if m else None


def _find_standard(standard_id: str) -> dict[str, Any] | None:
    sid = (standard_id or "").strip()
    bare = re.sub(r"^(ST-|PR-)", "", sid)
    for std in catalogue._standards():
        if std.get("standard_id") == sid or std.get("standard_id") == f"ST-{bare}":
            return std
    return None


def list_rubric_dimensions(section: str) -> dict[str, Any]:
    """Return the scoring frame for a section: dimension names + threshold.

    Deliberately excludes the calibration / judge prompt (the IP).
    """
    rubric = _load_rubric(section)
    if rubric is None:
        return {
            "error": f"No rubric for section '{section}'.",
            "valid_sections": _available_sections(),
        }
    return {
        "section": section,
        "version": rubric.get("version"),
        "dimensions": _dimension_names(rubric),
        "threshold": _threshold(rubric),
        "note": "Calibration and judge prompt are server-side and not exposed.",
    }


def _available_sections() -> list[str]:
    d = _sections_dir()
    if not d.exists():
        return []
    return sorted(p.name for p in d.iterdir() if (p / "rubric.json").exists())


def _llm_review(standard: dict[str, Any], design: str) -> dict[str, Any] | None:
    """Optional automated judge. Runs only if AEGIS_ANTHROPIC_API_KEY is set.

    Uses the standard's gates + (private) rubric server-side as the judge prompt.
    Returns the verdict/justification only — the prompt never leaves the server.
    Returns None if no key is configured or the call fails.
    """
    api_key = os.environ.get("AEGIS_ANTHROPIC_API_KEY")
    if not api_key:
        return None
    try:  # pragma: no cover - exercised only when a key + network exist
        import urllib.request

        gates = standard.get("gates") or []
        gate_text = "\n".join(
            f"- {g.get('check')}" for g in gates if isinstance(g, dict) and g.get("check")
        )
        statement = (standard.get("statement") or {}).get("title", "")
        system = (
            "You are an AI architecture review board judge. Decide whether the "
            "submitted design satisfies the standard's blocking gates. Reply with "
            "strict JSON: {\"verdict\":\"pass|fail|partial\",\"per_gate\":["
            "{\"gate\":str,\"met\":bool,\"reason\":str}],\"summary\":str}."
        )
        user = (
            f"STANDARD: {statement}\n\nBLOCKING GATES:\n{gate_text}\n\n"
            f"SUBMITTED DESIGN:\n{design}"
        )
        body = json.dumps({
            "model": os.environ.get("AEGIS_JUDGE_MODEL", "claude-sonnet-4-6"),
            "max_tokens": 1024,
            "system": system,
            "messages": [{"role": "user", "content": user}],
        }).encode()
        req = urllib.request.Request(
            "https://api.anthropic.com/v1/messages",
            data=body,
            headers={
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
        )
        with urllib.request.urlopen(req, timeout=60) as resp:
            payload = json.load(resp)
        text = "".join(b.get("text", "") for b in payload.get("content", []))
        return {"engine": "llm_judge", "result": json.loads(text)}
    except Exception as exc:  # noqa: BLE001
        return {"engine": "llm_judge", "error": f"judge unavailable: {exc}"}


def review_against_standard(standard_id: str, design: str) -> dict[str, Any]:
    """Review a design against a standard's blocking gates.

    Returns a gate-by-gate checklist the design must satisfy. If an LLM judge is
    configured (AEGIS_ANTHROPIC_API_KEY), also returns an automated verdict.
    The rubric internals are never returned.
    """
    std = _find_standard(standard_id)
    if std is None:
        return {"error": f"Standard '{standard_id}' not found."}

    gates = std.get("gates") or []
    checkpoints = [
        {
            "point": g.get("point"),
            "blocking": bool(g.get("blocking")),
            "requirement": g.get("check"),
        }
        for g in gates
        if isinstance(g, dict)
    ]

    out: dict[str, Any] = {
        "standard_id": std.get("standard_id"),
        "title": (std.get("statement") or {}).get("title"),
        "blocking_gate_count": sum(1 for c in checkpoints if c["blocking"]),
        "checkpoints": checkpoints,
        "scoring_frame": list_rubric_dimensions("gates"),
    }

    judged = _llm_review(std, design or "")
    if judged is not None:
        out["automated_review"] = judged
    else:
        out["automated_review"] = {
            "engine": "none",
            "note": "Set AEGIS_ANTHROPIC_API_KEY to enable automated pass/fail scoring. "
                    "Without it, use the checkpoints above as the manual review checklist.",
        }
    return out
