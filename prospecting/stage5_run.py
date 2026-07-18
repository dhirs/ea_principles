#!/usr/bin/env python3
"""Stage 5 — weekly entrypoint: collect → score, idempotent.

Runs the two halves in order (ADR §2 keeps them separate so a re-score never re-burns
credits):
  1. stage5_collect.py — enabled adaptors → apollo_intent_signals ledger
  2. stage5_score.py   — ledger → apollo_company_scores (score_type='intent')

Idempotent: both halves upsert on their natural keys, so re-running overwrites its own
rows and never duplicates. Because signals decay (scored from observed_at at score time),
each run reflects the current window.

Flags pass through to the collector (Apollo spend): --dry-run, --limit N, --run-id X.
The scorer is free math and always runs live unless --dry-run.

Usage:
  python3 stage5_run.py --dry-run          # both halves dry
  python3 stage5_run.py --limit 50         # collect 50 accounts, then score
  python3 stage5_run.py                     # full weekly run
"""
import sys

import stage5_collect
import stage5_score


def main():
    print("=== Stage 5 — collect ===")
    stage5_collect.main()
    print("\n=== Stage 5 — score ===")
    stage5_score.main()


if __name__ == "__main__":
    main()
