"""Threshold computation over rubric scores.

The rubric LLM returns per-dimension {score, justification}. The pass/fail rule
lives here, not in the prompt. V1: every dimension must score >= RUBRIC_MIN_SCORE.
"""
from __future__ import annotations

from dataclasses import dataclass, field

from . import config


@dataclass
class RubricVerdict:
    verdict: str  # 'ratify' | 'fail'
    fail_dimensions: list[str] = field(default_factory=list)
    scores: dict = field(default_factory=dict)

    @property
    def ratified(self) -> bool:
        return self.verdict == "ratify"


def evaluate_rubric(scores: dict, min_score: int = config.RUBRIC_MIN_SCORE) -> RubricVerdict:
    fails: list[str] = []
    for dim, entry in scores.items():
        value = entry.get("score") if isinstance(entry, dict) else entry
        try:
            numeric = int(value)
        except (TypeError, ValueError):
            fails.append(dim)  # unscored / malformed dimension fails closed
            continue
        if numeric < min_score:
            fails.append(dim)
    return RubricVerdict(
        verdict="ratify" if not fails else "fail",
        fail_dimensions=fails,
        scores=scores,
    )
