"""Static configuration: paths, model choices, loop bounds, threshold rule."""
from __future__ import annotations

from pathlib import Path

# repo root = .../ai_principles_server ; data lives at <root>/data
REPO_ROOT = Path(__file__).resolve().parents[3]
DATA_DIR = REPO_ROOT / "data"
SECTIONS_DIR = DATA_DIR / "sections"
SYSTEM_PROMPTS_DIR = DATA_DIR / "system_prompts"
PRINCIPLES_JSON = DATA_DIR / "principles.json"

# Pipeline order of the LLM-authored sections (deterministic nodes run after).
# Mirrors data/pipeline.md. NOTE: serving_paradigm has no prompt files yet, so it
# is intentionally absent until data/sections/serving_paradigm/ exists.
# TEMP: pipeline completes after `statement` only. Re-add the rest to author full principles.
SECTION_ORDER = [
    "statement",
    # "problem",
    # "solution",
    # "gates",
    # "applicability",
    # "impact_level",
    # "maturity_level",
    # "focus_area",
    # "framework_mappings",
    # "tier",
    # "explain_prompt",
]

# Bounded revise loop.
MAX_RETRIES = 3
PER_SECTION_MAX_RETRIES: dict[str, int] = {}  # e.g. {"gates": 4}

# V1 rubric threshold: every dimension must score >= this value.
RUBRIC_MIN_SCORE = 2

# Model selection per op. Routed to a provider by name prefix in llm_client
# (gpt* -> OpenAI, claude* -> Anthropic). Defaults to OpenAI (live OPENAI_API_KEY).
GENERATE_MODEL = "gpt-5"
REVISE_MODEL = "gpt-5"
RUBRIC_MODEL = "gpt-5"

# gpt-5 reasoning tokens count against this, so keep it generous to avoid truncation.
MAX_TOKENS = 16000


def max_retries_for(section: str) -> int:
    return PER_SECTION_MAX_RETRIES.get(section, MAX_RETRIES)
