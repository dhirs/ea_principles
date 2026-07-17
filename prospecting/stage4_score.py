#!/usr/bin/env python3
"""Stage 4 — Area 1 scoring for the cdp-selection product.

Reads the per-uid probe files (stage4_uid_probe.py), inverts them to per-company CDP
lists, keeps only companies in apollo_company_universe (apollo_company_scores has an FK
to it), and upserts one score_type='fit' row each.

    score   = number of distinct target CDPs the company runs (Area 1 = |matched|)
    signals = {matched_uids, matched_names, method}

Upsert is on (apollo_org_id, product, score_type) with resolution=merge-duplicates —
NOT the ignore-duplicates used for leads: the weekly run must overwrite its own row.

Usage: python3 stage4_score.py [--dry-run]
"""
import json
import re
import sys
import urllib.request
from pathlib import Path

HERE = Path(__file__).parent
PROBES = HERE / "apollo_companies" / "2026-07-17-cdp" / "uid_probes"
PRODUCT = "cdp-selection"
RULES_VERSION = "area1-v1"
# Enrichment carries no technographics on this plan, so CDP attribution comes from
# per-uid search probes instead. Recorded on every row so the score is reviewable.
METHOD = "search_probe"


# cdp.uids_confident and cdp.names are NOT positionally aligned — pairing them by
# index mislabels every score. Rebuild the map with the file's own _uid_rule
# ("display name lowercased, whitespace->underscore"), which resolves 32/33.
# The exception is the hyphen case the rule itself flags as irregular.
UID_OVERRIDES = {"adobe_realtime_cdp": "Adobe Real-Time CDP"}


def slug(name):
    s = name.lower().replace("&", "and")
    s = re.sub(r"[().,/#+\-]", " ", s)
    return re.sub(r"\s+", " ", s).strip().replace(" ", "_")


def uid_name_map(cdp):
    m = {slug(n): n for n in cdp["names"]}
    m.update(UID_OVERRIDES)
    missing = [u for u in cdp["uids_confident"] if u not in m]
    if missing:
        sys.exit(f"no name for uid(s): {missing} — fix UID_OVERRIDES before scoring")
    return m


def env(name):
    for line in (HERE / ".env").read_text().splitlines():
        if line.startswith(name + "="):
            return line.split("=", 1)[1].strip().strip('"').strip("'")
    sys.exit(f"{name} not found in .env")


def rest(path, method="GET", body=None, prefer=None):
    url = f"{env('SUPABASE_URL')}/rest/v1/{path}"
    key = env("SUPABASE_KEY")
    h = {"apikey": key, "Authorization": f"Bearer {key}",
         "Content-Type": "application/json"}
    if prefer:
        h["Prefer"] = prefer
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, headers=h, method=method)
    with urllib.request.urlopen(req, timeout=60) as r:
        raw = r.read()
        return json.loads(raw) if raw else None


def main():
    dry = "--dry-run" in sys.argv

    cdp = json.loads((HERE / "stage4_target_technologies.json").read_text())["cdp"]
    uid2name = uid_name_map(cdp)

    # invert probes -> {org_id: [uid, ...]}
    hits = {}
    for f in sorted(PROBES.glob("*.json")):
        d = json.loads(f.read_text())
        for oid in d["ids"]:
            hits.setdefault(oid, []).append(d["uid"])
    print(f"companies with >=1 CDP: {len(hits)}")

    # keep only universe members — the scores FK requires it
    universe, offset = set(), 0
    while True:
        page = rest("apollo_company_universe?select=apollo_org_id"
                    f"&limit=1000&offset={offset}")
        if not page:
            break
        universe |= {r["apollo_org_id"] for r in page}
        offset += 1000
    print(f"universe rows: {len(universe)}")

    scored = {k: v for k, v in hits.items() if k in universe}
    print(f"to score: {len(scored)} | skipped (not in universe): "
          f"{len(hits) - len(scored)}")

    rows = [{
        "apollo_org_id": oid,
        "product": PRODUCT,
        "score_type": "fit",
        "score": len(uids),
        "signals": {"matched_uids": sorted(uids),
                    "matched_names": sorted(uid2name[u] for u in uids),
                    "method": METHOD},
        "rules_version": RULES_VERSION,
    } for oid, uids in sorted(scored.items())]

    if dry:
        print(json.dumps(rows[:3], indent=1))
        print(f"dry-run: would upsert {len(rows)} rows")
        return

    for i in range(0, len(rows), 100):
        rest("apollo_company_scores?on_conflict=apollo_org_id,product,score_type",
             method="POST", body=rows[i:i + 100],
             prefer="resolution=merge-duplicates,return=minimal")
        print(f"  upserted {min(i + 100, len(rows))}/{len(rows)}")
    print("done")


if __name__ == "__main__":
    main()
