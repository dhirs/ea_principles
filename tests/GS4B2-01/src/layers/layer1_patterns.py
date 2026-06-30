"""Layer 1 — deterministic pattern / keyword filter.

Stand-in for a managed engine (AWS Bedrock Guardrails / Azure AI Content Safety). Cheap,
low-latency, near-deterministic at fixed config. First content line.

TODO (Claude Code): behind this same `check()` interface, swap in a real managed engine
(Bedrock ApplyGuardrail / Azure Content Safety) read from .env; keep the pattern list as
the offline fallback.
"""
import re

# Seed patterns — EXPAND these. Cover the four injection classes.
_PATTERNS = [
    r"ignore (all |your )?(previous|prior|above) instructions",
    r"disregard (your |the )?(rules|instructions|guidelines)",
    r"forget (everything|your instructions|the (current )?user)",
    r"print (the )?(text above|your (system )?prompt|everything above)",
    r"reveal (your |the )?(system )?prompt",
    r"what (are|were) your (original |initial )?instructions",
    r"you are now",
    r"(act|pretend) as if",
    r"developer mode",
]
_COMPILED = [re.compile(p, re.IGNORECASE) for p in _PATTERNS]


def check(user_input: str) -> tuple[bool, str | None]:
    """Return (tripped, matched_pattern)."""
    for rx in _COMPILED:
        if rx.search(user_input):
            return True, f"pattern:{rx.pattern}"
    return False, None
