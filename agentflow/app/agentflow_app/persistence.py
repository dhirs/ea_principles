"""Assemble the final principle and write it to the catalogue (atomically).

Catalogue shape: data/principles.json is {"meta": {...}, "principles": [ ... ]}.
By default we write to a SCRATCH file (principles_authored.json) so a run can
never corrupt the real catalogue; pass target=config.PRINCIPLES_JSON explicitly
to write the real thing. Writes are atomic (tmp file + os.replace) and the result
is re-parsed before the rename.
"""
from __future__ import annotations

import json
import os
from datetime import date
from pathlib import Path

from . import config

DEFAULT_TARGET = config.DATA_DIR / "principles_authored.json"
DEFAULT_LEDGER = config.DATA_DIR / "lens_mapping_authored.md"


def build_principle(state: dict) -> dict:
    """Merge locked sections + deterministic metadata into one principle object."""
    locked = state.get("locked", {})
    md = state.get("metadata", {})
    principle: dict = {"principle_id": state["principle_id"]}
    principle.update(locked)  # statement, problem, solution, ... (each a section draft)
    if md.get("pillar"):
        principle["pillar"] = md["pillar"]
    if md.get("focus_area"):
        principle["focus_area"] = md["focus_area"]
    for key in ("ownership", "evidence", "change_history"):
        if md.get(key) is not None:
            principle[key] = md[key]
    return principle


def _atomic_write_json(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(data, indent=2, ensure_ascii=False))
    json.loads(tmp.read_text())  # validate it parses before committing
    os.replace(tmp, path)


def write_to_catalogue(state: dict, *, target: Path | None = None) -> dict:
    """Append (or replace by principle_id) the principle into the catalogue."""
    target = target or DEFAULT_TARGET
    principle = build_principle(state)

    if target.exists():
        catalogue = json.loads(target.read_text())
    else:
        catalogue = {"meta": {"generated_by": "agentflow"}, "principles": []}
    catalogue.setdefault("principles", [])

    pid = principle["principle_id"]
    existing = [i for i, p in enumerate(catalogue["principles"]) if p.get("principle_id") == pid]
    if existing:
        catalogue["principles"][existing[0]] = principle  # idempotent re-author
    else:
        catalogue["principles"].append(principle)

    _atomic_write_json(target, catalogue)
    return principle


def update_lens_mapping(
    bp_code: str,
    step_number: int,
    outcome: str,          # 'promoted_to_principle' | 'not_promoted'
    detail: str = "",
    *,
    target: Path | None = None,
) -> None:
    """Append a ledger line recording the step's promotion outcome."""
    target = target or DEFAULT_LEDGER
    target.parent.mkdir(parents=True, exist_ok=True)
    line = f"- {date.today().isoformat()} | {bp_code} step {step_number} | {outcome}: {detail}\n"
    with target.open("a") as fh:
        fh.write(line)
