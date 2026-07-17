#!/usr/bin/env python3
"""Stage 4 — per-uid technology probe.

Apollo enrichment carries NO technographic fields on this plan (verified 2026-07-17:
no current_technologies, no technology_names). So Area 1 attribution — *which* CDP a
company runs — cannot come from enrichment. It is recovered from the search endpoint,
which filters on technology server-side: run the same firmographic query once per uid
and record which org ids come back.

Cost: 1 credit per uid that returns >=1 result, 0 credits for a uid with no matches.

Usage: python3 stage4_uid_probe.py [--dry-run]
Writes: apollo_companies/2026-07-17-cdp/uid_probes/<uid>.json  ({uid, total, ids})
Key: APOLLO_API_KEY in .env — never echoed.
"""
import json
import os
import sys
import time
import urllib.request
from pathlib import Path

HERE = Path(__file__).parent
OUT = HERE / "apollo_companies" / "2026-07-17-cdp" / "uid_probes"
URL = "https://api.apollo.io/api/v1/mixed_companies/search"

# The Stage 2 firmographic block — identical to the discover query, so each uid probe
# is scoped to exactly our universe shape (see README.md "Confirmed query").
BASE = {
    "organization_naics_codes": ["11","21","22","23","31","32","33","44","45","48",
                                 "49","51","52","53","54","56","61","62","71","72"],
    "organization_locations": ["United States", "Canada"],
    "organization_num_employees_ranges": ["201,500", "501,1000"],
    "revenue_range": {"min": 50000000, "max": 100000000},
    "organization_department_or_subdepartment_counts": {
        "master_marketing": {"min": 5, "max": 20}
    },
    "per_page": 100,
}


def load_key():
    for line in (HERE / ".env").read_text().splitlines():
        if line.startswith("APOLLO_API_KEY="):
            return line.split("=", 1)[1].strip().strip('"').strip("'")
    sys.exit("APOLLO_API_KEY not found in .env")


def probe(uid, key, page=1):
    body = dict(BASE, currently_using_any_of_technology_uids=[uid], page=page)
    req = urllib.request.Request(
        URL,
        data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json",
                 "Cache-Control": "no-cache",
                 "accept": "application/json",
                 "X-Api-Key": key},
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def main():
    dry = "--dry-run" in sys.argv
    key = load_key()
    OUT.mkdir(parents=True, exist_ok=True)

    targets = json.loads((HERE / "stage4_target_technologies.json").read_text())
    uids = targets["cdp"]["uids_confident"]

    done = {p.stem for p in OUT.glob("*.json")}
    todo = [u for u in uids if u not in done]
    print(f"{len(uids)} uids | {len(done)} already probed | {len(todo)} to run")
    if dry:
        print("dry-run:", todo)
        return

    for i, uid in enumerate(todo, 1):
        d = probe(uid, key)
        total = d["pagination"]["total_entries"]
        ids = [o["id"] for o in d["organizations"]]
        # >100 matches would need pagination; flag rather than silently truncate.
        truncated = total > len(ids)
        if truncated:
            for pg in range(2, d["pagination"]["total_pages"] + 1):
                ids += [o["id"] for o in probe(uid, key, page=pg)["organizations"]]
        rec = {"uid": uid, "total": total, "ids": ids}
        (OUT / f"{uid}.json").write_text(json.dumps(rec))
        print(f"[{i}/{len(todo)}] {uid:42s} total={total:4d} ids={len(ids):4d}")
        time.sleep(0.4)  # be polite to the API

    print("done")


if __name__ == "__main__":
    main()
