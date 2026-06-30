"""The input-guardrail wrapper — orchestrates Layer 0/1/2 in order with short-circuit.

This is the routed path every user-influenced model call must go through. The unguarded
path in app.py exists only to demonstrate the failure this wrapper prevents.
"""
import time
from dataclasses import dataclass

from .config import load_config
from .layers import layer0_limits, layer1_patterns, layer2_judge


@dataclass
class ScreenResult:
    tripped: bool
    layer: str | None        # which layer tripped
    reason: str | None
    latencies_ms: dict       # per-layer latency, for the cost argument


def screen(user_input: str, caller_id: str = "anon", cfg: dict | None = None) -> ScreenResult:
    """Run the layers cheapest-surest first; stop at the first trip."""
    cfg = cfg or load_config()
    lat: dict[str, float] = {}

    t = time.perf_counter()
    tripped, reason = layer0_limits.check(user_input, caller_id, cfg["limits"])
    lat["layer0"] = (time.perf_counter() - t) * 1000
    if tripped:
        return ScreenResult(True, "layer0", reason, lat)

    t = time.perf_counter()
    tripped, reason = layer1_patterns.check(user_input)
    lat["layer1"] = (time.perf_counter() - t) * 1000
    if tripped:
        return ScreenResult(True, "layer1", reason, lat)

    if cfg.get("layer2_judge", {}).get("enabled"):
        t = time.perf_counter()
        tripped, reason = layer2_judge.check(user_input, cfg["layer2_judge"]["threshold"])
        lat["layer2"] = (time.perf_counter() - t) * 1000
        if tripped:
            return ScreenResult(True, "layer2", reason, lat)

    return ScreenResult(False, None, None, lat)
