"""Catalogue loader + applicability logic.

The catalogue (`principles.json`) is the product IP. It is read here, server-side,
and NEVER returned wholesale. Tools expose only derived conclusions
(which standards apply, their gates, a summary) — not the rubric internals.
"""

from __future__ import annotations

import json
import os
from functools import lru_cache
from pathlib import Path
from typing import Any

# Recognised serving paradigms (keys in each standard's `applicability` block).
PARADIGMS = ("llm", "rag", "agentic", "ml")

# Criticality values, ordered.
CRITICALITY_ORDER = {"mandatory": 2, "nice_to_have": 1}


def _default_data_dir() -> Path:
    """Locate the canonical catalogue data dir.

    Override with AEGIS_DATA_DIR. Defaults to the repo's `data/` folder
    (../../data relative to this file: aegis/backend/aegis -> repo root/data).
    """
    env = os.environ.get("AEGIS_DATA_DIR")
    if env:
        return Path(env).expanduser().resolve()
    return (Path(__file__).resolve().parents[3] / "data").resolve()


def _catalogue_path() -> Path:
    return _default_data_dir() / "principles.json"


@lru_cache(maxsize=1)
def _load_raw() -> dict[str, Any]:
    path = _catalogue_path()
    if not path.exists():
        raise FileNotFoundError(
            f"Catalogue not found at {path}. Set AEGIS_DATA_DIR to the dir "
            "containing principles.json."
        )
    with path.open(encoding="utf-8") as fh:
        return json.load(fh)


def _standards() -> list[dict[str, Any]]:
    raw = _load_raw()
    # S3 top-level key migrated principles -> standards; support both.
    return raw.get("standards") or raw.get("principles") or []


def catalogue_meta() -> dict[str, Any]:
    raw = _load_raw()
    meta = dict(raw.get("meta") or {})
    meta["standard_count"] = len(_standards())
    return meta


def _gate_summary(std: dict[str, Any]) -> dict[str, Any]:
    gates = std.get("gates") or []
    if not isinstance(gates, list):
        gates = []
    blocking = sum(1 for g in gates if isinstance(g, dict) and g.get("blocking"))
    points = sorted(
        {g.get("point") for g in gates if isinstance(g, dict) and g.get("point")}
    )
    return {"total": len(gates), "blocking": blocking, "points": points}


def _derive(std: dict[str, Any], matched_on: list[str]) -> dict[str, Any]:
    """Return ONLY a derived, safe-to-ship view of a standard.

    Deliberately excludes rubric internals, full problem/solution prose, and
    explain_prompt — those stay server-side. The customer gets the verdict and
    enough to act, not the engine.
    """
    statement = std.get("statement") or {}
    applicability = std.get("applicability") or {}
    return {
        "standard_id": std.get("standard_id"),
        "principle_id": std.get("principle_id"),
        "title": statement.get("title"),
        "u_principle": std.get("u_principle"),
        "pillar": std.get("pillar"),
        "focus_area": std.get("focus_area"),
        "impact_level": std.get("impact_level"),
        "matched_on": matched_on,
        "criticality": {
            p: applicability.get(p) for p in matched_on if applicability.get(p)
        },
        "gates": _gate_summary(std),
    }


def get_applicable_standards(
    paradigms: list[str],
    include_nice_to_have: bool = True,
) -> dict[str, Any]:
    """Return the standards that apply to a project of the given paradigm(s).

    A standard applies if ANY requested paradigm is `mandatory` in its
    applicability block (or `nice_to_have`, when include_nice_to_have is True).

    Example: an Agentic RAG project -> paradigms=["agentic", "rag"].
    """
    requested = [p.strip().lower() for p in paradigms if p and p.strip()]
    unknown = [p for p in requested if p not in PARADIGMS]
    requested = [p for p in requested if p in PARADIGMS]
    if not requested:
        return {
            "error": "No valid paradigms supplied.",
            "valid_paradigms": list(PARADIGMS),
            "unknown_supplied": unknown,
        }

    allowed = {"mandatory"}
    if include_nice_to_have:
        allowed.add("nice_to_have")

    matches: list[dict[str, Any]] = []
    for std in _standards():
        applicability = std.get("applicability") or {}
        matched_on = [
            p for p in requested if applicability.get(p) in allowed
        ]
        if matched_on:
            matches.append(_derive(std, matched_on))

    # Sort: mandatory-anywhere first, then by pillar, then id.
    def _sort_key(m: dict[str, Any]):
        is_mandatory = any(c == "mandatory" for c in m["criticality"].values())
        return (0 if is_mandatory else 1, m.get("pillar") or "", m.get("standard_id") or "")

    matches.sort(key=_sort_key)

    # Group by pillar for a readable view.
    by_pillar: dict[str, list[dict[str, Any]]] = {}
    for m in matches:
        by_pillar.setdefault(m.get("pillar") or "Unassigned", []).append(m)

    return {
        "query": {
            "paradigms": requested,
            "include_nice_to_have": include_nice_to_have,
            "unknown_ignored": unknown,
        },
        "summary": {
            "applicable_count": len(matches),
            "catalogue_total": len(_standards()),
            "mandatory_count": sum(
                1
                for m in matches
                if any(c == "mandatory" for c in m["criticality"].values())
            ),
            "pillars": sorted(by_pillar.keys()),
        },
        "by_pillar": by_pillar,
        "standards": matches,
    }
