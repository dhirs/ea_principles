#!/usr/bin/env python3
"""Stage 4 — bank the enriched payloads into apollo_company_raw.

The 10 test-batch enrichment records (organizations_bulk_enrich, 2026-07-17) carry the
full company record: estimated_num_employees, departmental_head_count, funding, address,
short_description. Enrichment on this plan returns NO technographics, so these are for
areas 2/3 later, not Area 1 scoring.

Writes, per matched org, into the existing enrichment columns (upsert on apollo_org_id,
merge-duplicates — leaves the Stage 2 `payload` column untouched):
    enriched_payload  = full record, verbatim
    last_enriched     = now()
    enrichment_query  = the discover filter that surfaced the row

Source: the saved tool-result JSON from the bulk-enrich call.
Usage: python3 stage4_bank_enrichment.py [--dry-run]
"""
import json
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).parent
ENRICH_FILE = ("/Users/ULTRA7/.claude/projects/"
               "-Users-ULTRA7-backup-codebase-ai-principles-server/"
               "5ebb1e15-6cd1-4087-822e-a59a561da5d6/tool-results/"
               "toolu_01WyeyGHnn2WXHSqRbTG3v7q.json")

# The discover filter that surfaced these orgs — banked as provenance on each row.
ENRICHMENT_QUERY = {
    "organization_naics_codes": ["11","21","22","23","31","32","33","44","45","48",
                                 "49","51","52","53","54","56","61","62","71","72"],
    "organization_locations": ["United States", "Canada"],
    "organization_num_employees_ranges": ["201,500", "501,1000"],
    "revenue_range": {"min": 50000000, "max": 100000000},
    "organization_department_or_subdepartment_counts":
        {"master_marketing": {"min": 5, "max": 20}},
    "currently_using_any_of_technology_uids": "cdp.uids_confident (33)",
    "_endpoint": "organizations_bulk_enrich",
    "_run": "2026-07-17-cdp",
}


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
    now = datetime.now(timezone.utc).isoformat()

    payload = json.loads(json.load(open(ENRICH_FILE))[0]["text"])
    orgs = payload["organizations"]
    print(f"enriched records in file: {len(orgs)}")

    ids = [o["id"] for o in orgs]
    existing = {r["apollo_org_id"] for r in
                rest("apollo_company_raw?select=apollo_org_id"
                     f"&apollo_org_id=in.({','.join(ids)})")}
    # Apollo can resolve a requested domain to a DIFFERENT entity (domain drift):
    # ag.state.mn.us -> "Minnesota Dept of Health" (state.mn.us), a new id not in our
    # swept set. Banking it would create an orphan raw row (and raw.payload is NOT
    # NULL). Only UPDATE rows that already exist; skip drifted records.
    drifted = [o["id"] for o in orgs if o["id"] not in existing]
    if drifted:
        print(f"SKIP {len(drifted)} domain-drifted record(s) not in raw: {drifted}")

    rows = [{
        "apollo_org_id": o["id"],
        "enriched_payload": o,
        "last_enriched": now,
        "enrichment_query": ENRICHMENT_QUERY,
    } for o in orgs if o["id"] in existing]

    if dry:
        for r in rows:
            o = r["enriched_payload"]
            dept = o.get("departmental_head_count") or {}
            print(f"  {o['id']}  {o.get('primary_domain'):26s} "
                  f"emp={o.get('estimated_num_employees')}  depts={len(dept)}")
        print(f"dry-run: would PATCH {len(rows)} existing rows (payload untouched)")
        return

    # PATCH (update-only), one row at a time: these ids already exist in raw, so we
    # never insert — the NOT NULL `payload` stays whatever Stage 2 wrote. An upsert
    # would take the insert path when no conflict fires and trip that constraint.
    for r in rows:
        oid = r.pop("apollo_org_id")
        rest(f"apollo_company_raw?apollo_org_id=eq.{oid}", method="PATCH", body=r,
             prefer="return=minimal")
        print(f"  patched {oid}  {r['enriched_payload'].get('primary_domain')}")
    print(f"banked {len(rows)} enriched payloads")


if __name__ == "__main__":
    main()
