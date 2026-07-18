"""Versioned Stage 5 intent config — the ONE place weights/half-lives/etc. live (ADR §6).

Re-tuning happens here under a new RULES_VERSION; a re-score reads the existing ledger,
spends no credits, and old scores stay reproducible. Everything the scorer needs to turn
ledger rows into a number is here; everything an adaptor needs to normalize is here too.

v1 is bombora_surge only. Future signals (apollo_job_postings, event_attendance,
web_visitors, news_events) are added as new SIGNALS keys — new class + registry line +
weight — with no schema change (ADR §8). Not-yet-built signals sit enabled: False so
the scorer's denominator (Σ enabled weight) counts only what actually collects.
"""

PRODUCT = "cdp-selection"          # scores namespace — same key as apollo_company_universe.products
RULES_VERSION = "intent-v1"        # tracked separately from Stage 4's fit rules_version
LOOKBACK_DAYS = 90                 # scorer ignores ledger rows older than this (observed_at)

# The Step-1 ICP intent topics (stage5_intent.md → Topic selection, run 2026-07-18).
# Apollo returns intent_signal_account as a topic NAME string; the adaptor confirms the
# surging topic is one of ours before emitting. Names must match Apollo's exactly.
ICP_INTENT_TOPICS = [
    "Customer Data Platform",
    "Marketing Automation",
    "Marketing Automation Tools",
    "Customer Data Management",
    "Customer Data Integration",
]

# Per-signal config. weight/half_life_days are read by the SCORER; the rest by the adaptor.
SIGNALS: dict[str, dict] = {
    "bombora_surge": {
        "enabled": True,
        "weight": 1.0,            # sole v1 signal — weight cancels in the composite (see stage5_score.py)
        "half_life_days": 30,     # coarse: observed_at is the weekly-refresh collection date, not a surge start
        # Apollo intent_strength level → value_norm. Prior; calibrate against outcomes later.
        "strength_map": {"low": 0.33, "medium": 0.66, "high": 1.0},
        "icp_topics": ICP_INTENT_TOPICS,
    },
}
