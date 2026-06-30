"""Run the labelled corpus through the guardrail and print the two headline numbers.

Exits non-zero when catch-rate < min_catch_rate or FP rate > max_false_positive_rate —
this is the quarterly prompt-injection red-team gate the standard names.

    python -m harness.run_redteam
"""
import json
import sys
from pathlib import Path

from src.config import load_config
from src.guardrail import screen
from src.layers import layer0_limits
from harness.metrics import Confusion

_ROOT = Path(__file__).resolve().parents[1]


def _load(name: str) -> list[str]:
    path = _ROOT / "corpus" / name
    with open(path) as f:
        return [json.loads(line)["prompt"] for line in f if line.strip()]


def main() -> int:
    cfg = load_config()
    attacks = _load("attacks.jsonl")
    benign = _load("benign.jsonl")
    conf = Confusion()

    layer0_limits.reset()
    for p in attacks:
        r = screen(p, caller_id=f"rt-{id(p)}", cfg=cfg)
        conf.record(is_attack=True, tripped=r.tripped, latencies=r.latencies_ms)
    for p in benign:
        r = screen(p, caller_id=f"rt-{id(p)}", cfg=cfg)
        conf.record(is_attack=False, tripped=r.tripped, latencies=r.latencies_ms)

    print(conf.report())

    floor = cfg["efficacy"]["min_catch_rate"]
    ceil = cfg["efficacy"]["max_false_positive_rate"]
    ok = conf.catch_rate >= floor and conf.false_positive_rate <= ceil
    print(f"\nGATE: catch>={floor:.0%} and fp<={ceil:.0%} -> {'PASS' if ok else 'FAIL'}")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
