"""Shared SignalAdaptor contract + the normalized SignalRecord (ADR §4, §3).

Every adaptor, whatever its source, returns the identical SignalRecord shape. All
source-specific work (an Apollo call, a SQL query, a social API) stays inside the
adaptor; everything downstream — the collector, the ledger, the scorer — is source-blind.

Division of labour (ADR §5): the adaptor owns value_norm (native magnitude → 0..1
semantic strength, saturated so no signal runs away) and observed_at. The scorer owns
weight, half-life and aggregation — it applies decay at scoring time, so the ledger
stays a factual record and the score stays recomputable without re-collecting.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class SignalRecord:
    """One normalized observation → one apollo_intent_signals row.

    Guarantees (enforced in __post_init__): value_norm in [0,1]; observed_at set;
    a row exists ONLY for a real observation (ADR: collection failure != zero — an
    adaptor emits nothing rather than a fake value_norm=0).
    """
    apollo_org_id: str
    signal_type: str          # stable id, e.g. 'bombora_surge'
    source: str               # 'bombora' | 'apollo' | 'internal_db' ...
    value_norm: float         # 0..1 semantic strength — the adaptor's job
    observed_at: str          # ISO-8601 timestamptz — drives the scorer's decay
    adaptor_version: str
    value_raw: float | None = None    # native magnitude — audit only
    confidence: float | None = None   # 0..1 coverage/reliability (not folded into v1 score)
    evidence: dict[str, Any] = field(default_factory=dict)
    run_id: str | None = None

    def __post_init__(self) -> None:
        if not (0.0 <= float(self.value_norm) <= 1.0):
            raise ValueError(
                f"value_norm out of range for {self.signal_type}/{self.apollo_org_id}: "
                f"{self.value_norm}"
            )
        if self.confidence is not None and not (0.0 <= float(self.confidence) <= 1.0):
            raise ValueError(f"confidence out of range: {self.confidence}")
        if not self.observed_at:
            raise ValueError("observed_at is required (drives decay)")

    def to_row(self) -> dict[str, Any]:
        """Ledger row for PostgREST upsert (keys == apollo_intent_signals columns)."""
        return {
            "apollo_org_id": self.apollo_org_id,
            "signal_type": self.signal_type,
            "source": self.source,
            "value_raw": self.value_raw,
            "value_norm": self.value_norm,
            "confidence": self.confidence,
            "observed_at": self.observed_at,
            "evidence": self.evidence,
            "adaptor_version": self.adaptor_version,
            "run_id": self.run_id,
        }


class SignalAdaptor:
    """Base class every adaptor subclasses (ADR §4).

    Subclass contract:
      - class attrs: signal_type, source, version
      - enabled + weight/half-life etc. come from config, injected at construction
      - collect(accounts, window) -> list[SignalRecord]
          accounts: list of {"apollo_org_id", "domain"} from apollo_company_universe
          window:   {"lookback_days": int, "run_id": str} — vestigial for snapshot
                    signals like bombora (see apollo_bombora/README.md), meaningful for
                    time-ranged ones like job postings.
        guarantees: value_norm in [0,1]; observed_at set; a row only on a real
        observation. Owns nothing about weight/decay/composite.
    """
    signal_type: str
    source: str
    version: str

    def __init__(self, cfg: dict[str, Any]):
        self.cfg = cfg
        self.enabled: bool = bool(cfg.get("enabled", False))

    def collect(self, accounts: list[dict], window: dict) -> list[SignalRecord]:
        raise NotImplementedError
