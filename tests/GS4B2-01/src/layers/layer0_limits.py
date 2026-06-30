"""Layer 0 — deterministic size + rate limits. Cheapest, surest. Runs first.

Catches the brute-force / cost-inflation vector before any pattern match or inference.
"""
import time
from collections import defaultdict

# In-memory per-caller request timestamps. (A real impl uses a shared store / Redis.)
_calls: dict[str, list[float]] = defaultdict(list)


def _count_tokens(text: str) -> int:
    """Approximate token count. TODO (Claude Code): swap in tiktoken for accuracy."""
    return max(1, len(text) // 4)


def check(user_input: str, caller_id: str, limits: dict) -> tuple[bool, str | None]:
    """Return (tripped, reason). tripped=True means reject."""
    if _count_tokens(user_input) > limits["max_prompt_tokens"]:
        return True, "max_prompt_tokens exceeded"

    now = time.time()
    window = [t for t in _calls[caller_id] if now - t < 60]
    window.append(now)
    _calls[caller_id] = window
    if len(window) > limits["rate_limit_per_min"]:
        return True, "rate_limit_per_min exceeded"

    return False, None


def reset():
    """Clear rate state — used by tests."""
    _calls.clear()
