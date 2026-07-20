#!/usr/bin/env python3
"""Stage 6 — reveal: unlock email/phone for selected people. THE CREDIT STEP.

1 credit per matched person, 0 for a miss. Selection is by title group (see GROUPS)
over apollo_people_raw, restricted to rows Apollo says carry an email
(payload->has_email) — a row without one returns no match and is not worth sending.

Writes the match record to apollo_people_raw.revealed_payload via **PATCH**. Never an
upsert: a merge-duplicates upsert takes the insert path and trips NOT NULL payload
(the exact bug caught on the Stage 4 enrichment bank).

Usage:
  python3 stage6_reveal.py                 # dry-run: prints the plan and cost, spends nothing
  python3 stage6_reveal.py --confirm       # spends credits
  python3 stage6_reveal.py --limit N       # cap the number revealed (test runs)
Key: APOLLO_API_KEY in .env — never echoed.
"""
import json
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from intent_adaptors.db import load_env, rest  # noqa: E402

HERE = Path(__file__).parent
URL = "https://api.apollo.io/api/v1/people/bulk_match"
BATCH = 10  # Apollo hard cap per bulk_match request

# Title groups, in the order they are tested — first match wins. Mirrors the SQL used
# to size the run. Groups in TARGET are revealed; everything else is left locked.
GROUPS = [
    ("marketing_ops",   r"marketing (ops|operations|technology|automation)|martech|marketing systems"),
    ("product_mktg",    r"product marketing"),
    ("comms_brand",     r"communicat|brand|content|public relations|events"),
    ("sales_hybrid",    r"sales"),
    ("digital_growth",  r"digital|growth|performance|demand gen|lifecycle|crm|ecommerce|e-commerce"),
    ("generic_mktg",    r"marketing"),
]
# Product marketing excluded 2026-07-20 (Dheeraj): not the CDP buyer.
TARGET = {"marketing_ops", "digital_growth", "generic_mktg", "comms_brand", "sales_hybrid"}


def classify(title):
    t = title or ""
    for name, pat in GROUPS:
        if re.search(pat, t, re.I):
            return name
    return "other"


def load_key():
    for line in (HERE / ".env").read_text().splitlines():
        if line.startswith("APOLLO_API_KEY="):
            return line.split("=", 1)[1].strip().strip('"').strip("'")
    sys.exit("APOLLO_API_KEY not found in .env")


def fetch_candidates(env):
    """Unrevealed people with an email on file, as [(person_id, title)]."""
    out, offset = [], 0
    while True:
        page = rest(env, "apollo_people_raw?select=apollo_person_id,payload"
                    f"&revealed_payload=is.null&limit=1000&offset={offset}")
        if not page:
            break
        for r in page:
            p = r["payload"]
            if p.get("has_email"):
                out.append((r["apollo_person_id"], p.get("title")))
        offset += 1000
    return out


def bulk_match(ids, key):
    body = {"details": [{"id": i} for i in ids]}
    req = urllib.request.Request(
        URL,
        data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json",
                 "Cache-Control": "no-cache",
                 "accept": "application/json",
                 "X-Api-Key": key},
    )
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.load(r)


def patch_revealed(env, person_id, record):
    """PATCH revealed_payload + last_revealed only — payload is never touched."""
    rest(env, f"apollo_people_raw?apollo_person_id=eq.{person_id}", method="PATCH",
         body={"revealed_payload": record, "last_revealed": "now()"},
         prefer="return=minimal")


def main():
    confirm = "--confirm" in sys.argv
    limit = None
    for i, a in enumerate(sys.argv):
        if a == "--limit":
            limit = int(sys.argv[i + 1])

    env = load_env()
    key = load_key()

    cands = fetch_candidates(env)
    by_group = {}
    for pid, title in cands:
        by_group.setdefault(classify(title), []).append(pid)

    selected = [pid for g, ids in sorted(by_group.items()) if g in TARGET for pid in ids]
    if limit:
        selected = selected[:limit]

    print("candidates with an email on file, by title group:")
    for g in sorted(by_group):
        mark = "REVEAL" if g in TARGET else "skip  "
        print(f"  {mark}  {g:16s} {len(by_group[g]):5d}")
    print(f"\n{len(selected)} people to reveal → up to {len(selected)} credits "
          f"(1/match, 0 for a miss)")

    if not confirm:
        print("\ndry-run — nothing spent. Re-run with --confirm to reveal.")
        return

    matched = missed = failed = 0
    for i in range(0, len(selected), BATCH):
        chunk = selected[i:i + BATCH]
        try:
            d = bulk_match(chunk, key)
        except urllib.error.HTTPError as e:
            failed += len(chunk)
            print(f"  batch {i // BATCH + 1}: HTTP {e.code} {e.read()[:160]!r}")
            time.sleep(2)
            continue
        for pid, rec in zip(chunk, d.get("matches") or []):
            if rec and rec.get("email"):
                patch_revealed(env, pid, rec)
                matched += 1
            else:
                # Record the miss so it is never re-sent; costs nothing to store.
                patch_revealed(env, pid, {"_no_match": True, "raw": rec})
                missed += 1
        done = i + len(chunk)
        print(f"  {done}/{len(selected)} — matched {matched}, no-email {missed}, "
              f"failed {failed}")
        time.sleep(0.4)

    print(f"\ndone — {matched} revealed (~{matched} credits), {missed} no email, "
          f"{failed} request failures")


if __name__ == "__main__":
    main()
