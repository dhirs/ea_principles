#!/usr/bin/env python3
"""Stage 5 — composite scorer. The ONLY writer of apollo_company_scores (score_type='intent').

Reads the apollo_intent_signals ledger (free math, no credits) and computes one intent
score per account (ADR §6):

    decay_i        = 0.5 ** (age_days_i / half_life_i)          # age from observed_at
    contribution_i = weight_i * value_norm_i * decay_i
    intent_score   = round( 100 * Σ contribution_i / Σ weight_i )   # Σ weight over ENABLED types

Dividing by TOTAL ENABLED weight (not present-signal weight) means absence lowers the
score (ADR decision — do not relitigate). confidence is stored per signal in the ledger
but NOT folded into the number in v1. Per-signal contributions go into the score row's
`signals` jsonb so any score is explainable after the fact.

Only the latest ledger row per (account, signal_type) exists (PK), within LOOKBACK_DAYS.
Scores accounts that have >=1 observation; an account with no signals gets NO row (we
store positive evidence only — same discipline as Stage 4's scoreless accounts).

Upsert on (apollo_org_id, product, score_type) with merge-duplicates — the run overwrites
its own row, so re-running is idempotent and never duplicates.

Usage:
  python3 stage5_score.py --dry-run     # compute + print distributions, no writes
  python3 stage5_score.py               # score the ledger, upsert apollo_company_scores
"""
import sys
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote

sys.path.insert(0, str(Path(__file__).resolve().parent))

from intent_adaptors import config
from intent_adaptors.db import load_env, rest
from intent_adaptors.registry import enabled_weight_total

SCORES = "apollo_company_scores"
LEDGER = "apollo_intent_signals"
BATCH = 100


def fetch_ledger(env, cutoff_iso: str) -> list[dict]:
    """Latest ledger rows within the lookback window, enabled signal types only."""
    enabled = [t for t, s in config.SIGNALS.items() if s.get("enabled")]
    if not enabled:
        return []
    in_list = ",".join(enabled)
    cutoff = quote(cutoff_iso, safe="")  # encode '+' offset etc. for the query string
    out, offset = [], 0
    while True:
        page = rest(env, f"{LEDGER}?select=*"
                    f"&signal_type=in.({in_list})"
                    f"&observed_at=gte.{cutoff}"
                    f"&limit=1000&offset={offset}")
        if not page:
            break
        out.extend(page)
        offset += 1000
    return out


def score_account(rows: list[dict], now: datetime, denom: float) -> tuple[float, dict]:
    """Composite for one account's ledger rows → (intent_score, signals jsonb)."""
    contributions = {}
    total = 0.0
    for r in rows:
        st = r["signal_type"]
        cfg = config.SIGNALS[st]
        half_life = cfg["half_life_days"]
        weight = cfg["weight"]
        observed = datetime.fromisoformat(r["observed_at"])
        age_days = max(0.0, (now - observed).total_seconds() / 86400.0)
        decay = 0.5 ** (age_days / half_life)
        value_norm = float(r["value_norm"])
        contribution = weight * value_norm * decay
        total += contribution
        contributions[st] = {
            "value_norm": round(value_norm, 4),
            "decay": round(decay, 4),
            "weight": weight,
            "half_life_days": half_life,
            "age_days": round(age_days, 2),
            "contribution": round(contribution, 4),
            "observed_at": r["observed_at"],
            "evidence": r.get("evidence") or {},
        }
    intent_score = round(100.0 * total / denom) if denom else 0
    intent_score = max(0, min(100, intent_score))  # clamp to the table's 0..100 check
    signals = {
        "contributions": contributions,
        "enabled_weight_total": denom,
        "rules_version": config.RULES_VERSION,
    }
    return intent_score, signals


def main():
    dry = "--dry-run" in sys.argv
    env = load_env()
    now = datetime.now(timezone.utc)
    cutoff = now.timestamp() - config.LOOKBACK_DAYS * 86400
    cutoff_iso = datetime.fromtimestamp(cutoff, tz=timezone.utc).isoformat()
    denom = enabled_weight_total()

    ledger = fetch_ledger(env, cutoff_iso)
    print(f"ledger rows in lookback ({config.LOOKBACK_DAYS}d): {len(ledger)} | "
          f"enabled-weight denominator: {denom}")

    by_org = defaultdict(list)
    for r in ledger:
        by_org[r["apollo_org_id"]].append(r)

    rows, dist = [], []
    for oid, org_rows in sorted(by_org.items()):
        score, signals = score_account(org_rows, now, denom)
        dist.append(score)
        rows.append({
            "apollo_org_id": oid,
            "product": config.PRODUCT,
            "score_type": "intent",
            "score": score,
            "signals": signals,
            "rules_version": config.RULES_VERSION,
        })

    print(f"accounts scored: {len(rows)}")
    if dist:
        dist.sort()
        print(f"intent_score distribution: min={dist[0]} "
              f"median={dist[len(dist)//2]} max={dist[-1]}")

    if dry:
        import json
        print(json.dumps(rows[:2], indent=1, default=str))
        print(f"dry-run: would upsert {len(rows)} intent row(s)")
        return

    if not rows:
        print("no ledger signals in window — nothing to score "
              "(expected until surge values populate)")
        return
    for i in range(0, len(rows), BATCH):
        rest(env, f"{SCORES}?on_conflict=apollo_org_id,product,score_type",
             method="POST", body=rows[i:i + BATCH],
             prefer="resolution=merge-duplicates,return=minimal")
        print(f"  upserted {min(i + BATCH, len(rows))}/{len(rows)}")
    print(f"done — {len(rows)} intent row(s) into {SCORES}")


if __name__ == "__main__":
    main()
