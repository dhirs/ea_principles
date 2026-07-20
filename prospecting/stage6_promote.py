#!/usr/bin/env python3
"""Stage 6 — promote: revealed people -> `leads` + `lead_provenance`. No credits.

Reads apollo_people_raw rows carrying a revealed email and writes two things:

  leads            — the person, in the table's existing shape. The FULL revealed
                     record goes under data.apollo because `seg` is a GENERATED column
                     reading data->apollo->title; put it anywhere else and seg is null.
  lead_provenance  — one 'title_match_universe' row per lead: WHY this person is in
                     the pipeline. A lead already carrying 'maven_workshop' keeps it
                     and gains this one — the dual reason is the point, so provenance
                     is keyed (email, source_type) and neither row overwrites the other.

Upsert policy on `leads` is IGNORE-duplicates by default: an existing maven-sourced row
is richer (it has real workshop history) and must not be flattened by an Apollo record.
Provenance is written either way, so a pre-existing lead still gains its title-match
reason. --overwrite-leads switches to merge-duplicates if you deliberately want the
Apollo record to win.

Usage:
  python3 stage6_promote.py              # dry-run: counts only, no writes
  python3 stage6_promote.py --apply
  python3 stage6_promote.py --apply --overwrite-leads
"""
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from intent_adaptors.db import load_env, rest  # noqa: E402

HERE = Path(__file__).parent
RUN_ID = "stage6-promote-1"
TITLES_VERSION = json.loads(
    (HERE / "stage6_target_titles.json").read_text()).get("_version", "titles-v1")


def fetch_revealed(env):
    """apollo_people_raw rows with a real revealed email."""
    out, offset = [], 0
    while True:
        page = rest(env, "apollo_people_raw?select=apollo_person_id,apollo_org_id,"
                    "payload,revealed_payload&revealed_payload=not.is.null"
                    f"&limit=1000&offset={offset}")
        if not page:
            break
        out.extend(r for r in page if (r.get("revealed_payload") or {}).get("email"))
        offset += 1000
    return out


def fetch_company_names(env):
    """apollo_org_id -> universe company name, for provenance evidence."""
    names, offset = {}, 0
    while True:
        page = rest(env, "apollo_company_universe?select=apollo_org_id,company"
                    f"&limit=1000&offset={offset}")
        if not page:
            break
        names.update({r["apollo_org_id"]: r["company"] for r in page})
        offset += 1000
    return names


def build_lead(row, today):
    p = row["revealed_payload"]
    org = p.get("organization") or {}
    email = p["email"]
    domain = org.get("primary_domain") or email.split("@", 1)[-1]
    return {
        "email": email,
        "fname": p.get("first_name"),
        "lname": p.get("last_name"),
        "domain": domain,
        "data": {
            "email": email,
            "first_name": p.get("first_name"),
            "last_name": p.get("last_name"),
            "company": org.get("name"),
            # data.source is an OBJECT in this table (matching the maven rows), not the
            # bare string stage6_people.md specifies. Follow the table, not the doc.
            "source": {"name": "stage6-title-match", "type": "apollo_people_search"},
            "signup_date": today,
            "apollo": p,
        },
    }


def build_provenance(row, company_names, today):
    p = row["revealed_payload"]
    org = p.get("organization") or {}
    org_id = row.get("apollo_org_id")
    return {
        "email": p["email"],
        "source_type": "title_match_universe",
        "source": "apollo_people_search",
        "evidence": {
            "apollo_org_id": org_id,
            "company": company_names.get(org_id) or org.get("name"),
            "title": p.get("title"),
            "seniority": p.get("seniority"),
            "matched_title": "marketing",
            "apollo_person_id": row["apollo_person_id"],
        },
        "observed_at": today,
        "source_version": TITLES_VERSION,
        "run_id": RUN_ID,
    }


def chunked(rows, n=100):
    for i in range(0, len(rows), n):
        yield rows[i:i + n]


def main():
    apply = "--apply" in sys.argv
    overwrite = "--overwrite-leads" in sys.argv
    env = load_env()
    today = datetime.now(timezone.utc).isoformat()

    rows = fetch_revealed(env)
    names = fetch_company_names(env)

    existing = set()
    offset = 0
    while True:
        page = rest(env, f"leads?select=email&limit=1000&offset={offset}")
        if not page:
            break
        existing.update(r["email"] for r in page)
        offset += 1000

    leads = [build_lead(r, today) for r in rows]
    prov = [build_provenance(r, names, today) for r in rows]
    new = [l for l in leads if l["email"] not in existing]
    dupes = len(leads) - len(new)

    print(f"{len(rows)} revealed people")
    print(f"  {len(new)} new leads, {dupes} already in leads "
          f"({'overwrite' if overwrite else 'ignore-duplicates'})")
    print(f"  {len(prov)} title_match_universe provenance rows")
    if not apply:
        print("\ndry-run — no writes. Re-run with --apply.")
        return

    pref = ("resolution=merge-duplicates" if overwrite
            else "resolution=ignore-duplicates") + ",return=minimal"
    for c in chunked(leads):
        rest(env, "leads?on_conflict=email", method="POST", body=c, prefer=pref)
    print(f"leads written ({pref.split(',')[0]})")

    # Provenance AFTER leads: the FK requires the lead row to exist.
    for c in chunked(prov):
        rest(env, "lead_provenance?on_conflict=email,source_type", method="POST",
             body=c, prefer="resolution=merge-duplicates,return=minimal")
    print("provenance written")


if __name__ == "__main__":
    main()
