"""Reference implementation lookup.

Returns the step-by-step RI for a standard: the central-team vs project-team
split (Builds/Operates/Owns vs Configures/Populates/Consumes), the interface
contract (incl. YAML), and acceptance criteria. This is the most common project
question — "what do WE do vs what does the platform team do?"

The RI markdown lives at data/ri/<bare_id>/README.md. RI dirs use the BARE id
(GS2B1-01) while the catalogue uses the prefixed standard_id (ST-GS2B1-01); we
strip a leading ST-/PR- before resolving.
"""

from __future__ import annotations

import re
from functools import lru_cache
from pathlib import Path
from typing import Any

from . import catalogue

_ID_RE = re.compile(r"^[A-Za-z0-9_-]+$")
# A top-level RI section heading: "## 3. central_team" -> ("3", "central_team")
_SECTION_RE = re.compile(r"^##\s+(?:(\d+)\.\s+)?(.+?)\s*$", re.MULTILINE)


def _ri_dir() -> Path:
    return catalogue._default_data_dir() / "ri"


def _bare_id(standard_id: str) -> str:
    return re.sub(r"^(ST-|PR-)", "", (standard_id or "").strip())


@lru_cache(maxsize=64)
def _read_ri(bare: str) -> str | None:
    path = _ri_dir() / bare / "README.md"
    if not path.exists():
        return None
    return path.read_text(encoding="utf-8")


def _parse_sections(md: str) -> dict[str, str]:
    """Split the RI markdown into { normalised_section_name: body }."""
    sections: dict[str, str] = {}
    matches = list(_SECTION_RE.finditer(md))
    for i, m in enumerate(matches):
        name = m.group(2).strip().lower().replace(" ", "_")
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(md)
        sections[name] = md[start:end].strip()
    return sections


def get_reference_implementation(standard_id: str) -> dict[str, Any]:
    """Return the step-by-step reference implementation for a standard.

    Returns the central-team responsibilities (Builds / Operates / Owns), the
    project-team responsibilities (Configures / Populates / Consumes), the
    interface contract (including YAML config), and the acceptance criteria —
    both as structured sections and as the full markdown.
    """
    bare = _bare_id(standard_id)
    if not _ID_RE.match(bare):
        return {"error": f"Invalid standard_id '{standard_id}'."}

    md = _read_ri(bare)
    if md is None:
        return {
            "error": f"No reference implementation found for '{standard_id}'.",
            "hint": "RIs are keyed by the bare id, e.g. GS2B1-01.",
        }

    sections = _parse_sections(md)

    # Title from the catalogue so it stays in sync.
    title = None
    for std in catalogue._standards():
        if std.get("standard_id") in (f"ST-{bare}", bare):
            title = (std.get("statement") or {}).get("title")
            break

    return {
        "standard_id": f"ST-{bare}",
        "title": title,
        "tier_outcome": sections.get("tier_outcome"),
        "central_team": sections.get("central_team"),
        "project_team": sections.get("project_team"),
        "interface_contract": sections.get("interface_contract"),
        "acceptance_criteria": sections.get("acceptance_criteria"),
        "sections_available": sorted(sections.keys()),
        "raw_markdown": md,
    }
