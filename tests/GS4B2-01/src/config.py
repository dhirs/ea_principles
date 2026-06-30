"""Loads the declared guardrail config (guardrails/input.yaml)."""
from pathlib import Path
import yaml

_ROOT = Path(__file__).resolve().parents[1]
_CONFIG_PATH = _ROOT / "guardrails" / "input.yaml"


def load_config(path: Path = _CONFIG_PATH) -> dict:
    with open(path) as f:
        cfg = yaml.safe_load(f)
    # Minimal contract check — mirrors the standard's declaration-completeness lint.
    for key in ("input_filters", "limits", "on_trip"):
        if not cfg.get(key):
            raise ValueError(f"input.yaml missing required key: {key}")
    for lim in ("max_prompt_tokens", "rate_limit_per_min"):
        if cfg["limits"].get(lim) is None:
            raise ValueError(f"input.yaml limits.{lim} must be non-null")
    return cfg
