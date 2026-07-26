#!/usr/bin/env python3
"""Stage 6 (list variant) — resolve/extend apollo_company_universe for a contacts list.

The contact records banked by stage6_list_collect.py carry a full `organization` object
(id, name, primary_domain, linkedin_url, naics_codes) — so company identity + taxonomy
come FREE, no company-search credits. This inserts the list's NEW employers into the
universe, TAGGED so they're distinguishable from ICP-swept rows and prunable by one delete.

DECISION (owner-confirmed 2026-07-26): insert ALL list companies — the chosen contact is
the qualifier, so we deliberately do NOT apply the Stage-3 off-target-NAICS / junk / sub
drop-screens. Companies that Stage 3 WOULD have dropped are still inserted, and surfaced
in the report (--dry-run prints them). matched_naics = first NAICS code present (so every
company gets a sector), not first-in-target-set.

Firmographics (revenue / employee_range / growth / hq_location) are LEFT NULL — the contact
payload doesn't carry them, and fabricating a value reads as real data forever (stage3_
qualify.md). Optional Gate B (organizations_bulk_enrich) can backfill them later; skipped.

After inserting, run the NAICS backfill: stage6_list_naics_backfill.sql (denormalises the
10 hierarchy columns from apollo_naics, Traps 1/2 honoured), scoped to list rows.

Usage:
  python3 stage6_list_companies.py --label <id> [--date YYYY-MM-DD] [--dry-run]
Writes: apollo_company_universe rows (on conflict apollo_org_id do nothing). Free.
"""
import json
import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from intent_adaptors.db import load_env, rest  # noqa: E402

HERE = Path(__file__).parent

LISTS = {
    "6a630b795233df000c384c95": {"name": "Martech UK", "slug": "martech-uk"},
    "6a614d087f78c900143b450c": {"name": "Martech Consultants — South Africa",
                                 "slug": "martech-consultants-sa"},
}

# Stage 1 CDP-selection target sectors (2-digit) — the set Stage 3 keeps. Used ONLY to
# REPORT which list companies Stage 3 would have dropped; we insert them regardless.
TARGET_SECTORS = {"11", "21", "22", "23", "31", "32", "33", "44", "45", "48", "49",
                  "51", "52", "53", "54", "56", "61", "62", "71", "72"}


def arg(flag, default=None):
    return sys.argv[sys.argv.index(flag) + 1] if flag in sys.argv else default


def fetch_list_orgs(env, label):
    """Distinct employers on this list → {org_id: organization object}. The org object is
    read off payload (verbatim contact record); first non-empty one per org id wins."""
    orgs, offset = {}, 0
    while True:
        page = rest(env, "apollo_people_raw?select=apollo_org_id,payload"
                    f"&search_query->>label_id=eq.{label}&limit=1000&offset={offset}")
        if not page:
            break
        for r in page:
            oid = r.get("apollo_org_id")
            org = (r.get("payload") or {}).get("organization") or {}
            if oid and oid not in orgs and org:
                orgs[oid] = org
        offset += 1000
    return orgs


def fetch_universe_ids(env):
    ids, offset = set(), 0
    while True:
        page = rest(env, "apollo_company_universe?select=apollo_org_id"
                    f"&limit=1000&offset={offset}")
        if not page:
            break
        ids |= {r["apollo_org_id"] for r in page}
        offset += 1000
    return ids


def matched_naics(codes):
    """First NAICS code present (we insert all list companies regardless of sector)."""
    for c in (codes or []):
        if c:
            return c
    return None


def build_row(oid, org, label, label_name, run_date, raw_file):
    codes = org.get("naics_codes") or []
    mn = matched_naics(codes)
    return {
        "apollo_org_id": oid,
        "company": org.get("name") or "(unknown)",
        "domain": org.get("primary_domain"),
        "linkedin_url": org.get("linkedin_url"),
        "naics": codes or None,
        # revenue / employee_range / growth_* / hq_location left null (not in payload).
        "products": {"martech-uk-list": {
            "status": "sourced", "source": "apollo_contacts_list",
            "label_id": label, "label_name": label_name,
            "matched_naics": mn, "added": run_date}},
        "raw_file": raw_file,
    }


def insert_universe(env, rows):
    """on conflict apollo_org_id do nothing — never flatten an existing ICP row."""
    for i in range(0, len(rows), 100):
        rest(env, "apollo_company_universe?on_conflict=apollo_org_id", method="POST",
             body=rows[i:i + 100],
             prefer="resolution=ignore-duplicates,return=minimal")


def main():
    dry = "--dry-run" in sys.argv
    label = arg("--label")
    if not label:
        sys.exit("usage: stage6_list_companies.py --label <id> [--date ...] [--dry-run]")
    meta = LISTS.get(label, {})
    label_name = meta.get("name", label)
    slug = meta.get("slug", label)
    run_date = arg("--date", date.today().isoformat())
    raw_file = f"apollo_people/{run_date}-{slug}/"

    env = load_env()
    orgs = fetch_list_orgs(env, label)
    universe = fetch_universe_ids(env)
    new_ids = [oid for oid in orgs if oid not in universe]
    already = len(orgs) - len(new_ids)

    rows = [build_row(oid, orgs[oid], label, label_name, run_date, raw_file)
            for oid in new_ids]

    no_naics = [r for r in rows if not r["products"]["martech-uk-list"]["matched_naics"]]
    would_drop = [r for r in rows
                  if r["products"]["martech-uk-list"]["matched_naics"]
                  and r["products"]["martech-uk-list"]["matched_naics"][:2] not in TARGET_SECTORS]

    print(f'list "{label_name}": {len(orgs)} distinct companies | '
          f"{already} already in universe | {len(new_ids)} NEW to insert")
    print(f"  {len(no_naics)} of the new have NO naics code (matched_naics null → null taxonomy)")
    print(f"  {len(would_drop)} of the new are OFF the CDP target sectors "
          f"(Stage 3 would have DROPPED these — we keep them, tagged):")
    from collections import Counter
    for sec, n in Counter(r["products"]["martech-uk-list"]["matched_naics"][:2]
                          for r in would_drop).most_common(12):
        print(f"      sector {sec}: {n}")

    if dry:
        print("\n--- sample new universe row ---")
        print(json.dumps(rows[0], indent=1, default=str) if rows else "(none)")
        print(f"\ndry-run — would insert {len(rows)} rows (on conflict do nothing), "
              f"then run stage6_list_naics_backfill.sql. No writes.")
        return

    insert_universe(env, rows)
    print(f"\ninserted {len(rows)} companies (on conflict do nothing). "
          f"NOW run: stage6_list_naics_backfill.sql (scoped to list rows).")


if __name__ == "__main__":
    main()
