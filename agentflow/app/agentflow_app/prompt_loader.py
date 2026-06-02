"""Cached loaders for the prompt JSON files under data/."""
from __future__ import annotations

import json
from functools import cache

from . import config


@cache
def load_system_prompt(op: str) -> dict:
    """Load data/system_prompts/<op>.json (op in {generate, rubric, revise})."""
    path = config.SYSTEM_PROMPTS_DIR / f"{op}.json"
    return json.loads(path.read_text())


@cache
def load_section_prompt(section: str, op: str) -> dict:
    """Load data/sections/<section>/<op>.json."""
    path = config.SECTIONS_DIR / section / f"{op}.json"
    return json.loads(path.read_text())
