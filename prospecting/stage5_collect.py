#!/usr/bin/env python3
"""Stage 5 — collector runner (collect → apollo_intent_signals ledger).

Source-agnostic (ADR §4): for each ENABLED adaptor in the registry, collect over the
accounts in apollo_company_universe and upsert normalized SignalRecords into the ledger.
Writes ONLY apollo_intent_signals — never apollo_company_scores (that is stage5_score.py).

Collection failure != zero (ADR): an adaptor emits a row only on a real observation;
a silent account is handled by the scorer's denominator, never a fake value_norm=0.

Apollo calls cost credits — use --limit to sample and --dry-run to fetch+normalize
without writing. Shadow mode = an adaptor enabled at weight 0 (collects, scores nothing).

Usage:
  python3 stage5_collect.py --dry-run            # fetch+normalize a sample, no writes
  python3 stage5_collect.py --limit 50           # collect over 50 accounts, write ledger
  python3 stage5_collect.py                       # full run over the universe
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))  # make intent_adaptors importable

from intent_adaptors import config
from intent_adaptors.db import fetch_fit_accounts, load_env, rest
from intent_adaptors.registry import build_registry

LEDGER = "apollo_intent_signals"
BATCH = 100


def parse_limit(argv: list[str]) -> int | None:
    if "--limit" in argv:
        return int(argv[argv.index("--limit") + 1])
    return None


def upsert_ledger(env, rows):
    for i in range(0, len(rows), BATCH):
        rest(env, f"{LEDGER}?on_conflict=apollo_org_id,signal_type",
             method="POST", body=rows[i:i + BATCH],
             prefer="resolution=merge-duplicates,return=minimal")
        print(f"  upserted {min(i + BATCH, len(rows))}/{len(rows)}")


def main():
    argv = sys.argv[1:]
    dry = "--dry-run" in argv
    limit = parse_limit(argv)
    # run_id: caller may pass --run-id; else a fixed sentinel (Date.now unavailable-safe,
    # and the ledger PK already de-dupes per account+type, so it need not be unique).
    run_id = argv[argv.index("--run-id") + 1] if "--run-id" in argv else "manual"

    env = load_env()
    # Scope to fit-scored accounts only (run >=1 target CDP/MAP) — NOT the whole
    # universe. Intent collection costs credits and is only meaningful where fit
    # already holds (~167 vs ~2,983). Run Stage 4 before Stage 5.
    accounts = fetch_fit_accounts(env, config.PRODUCT, limit=limit)
    print(f"fit-scored accounts to collect over: {len(accounts)}"
          f"{' (limited)' if limit else ''}")
    if not accounts:
        print("no fit-scored accounts — run Stage 4 (stage4_score.py) first")
        return

    registry = build_registry(env)
    window = {"lookback_days": None, "run_id": run_id}

    total_rows = []
    for a in registry:
        if not a.enabled:
            print(f"[skip] {a.signal_type}: disabled (shadow/off)")
            continue
        print(f"[collect] {a.signal_type} (source={a.source}) …")
        recs = a.collect(accounts, window)
        rows = [r.to_row() for r in recs]
        print(f"  emitted {len(rows)} row(s) "
              f"(of {len(accounts)} accounts — absence is normal, not zero)")
        total_rows.extend(rows)

    if dry:
        import json
        print(json.dumps(total_rows[:3], indent=1, default=str))
        print(f"dry-run: would upsert {len(total_rows)} ledger row(s)")
        return

    if not total_rows:
        print("no observations — nothing to upsert (expected until Apollo's weekly "
              "refresh populates surge values)")
        return
    upsert_ledger(env, total_rows)
    print(f"done — {len(total_rows)} row(s) into {LEDGER}")


if __name__ == "__main__":
    main()
