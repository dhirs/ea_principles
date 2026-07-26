#!/usr/bin/env python3
"""Stage 6 (list variant) — promote list contacts -> `leads` + `lead_provenance`. No credits.

Mirrors stage6_promote.py. Source = apollo_people_raw rows banked from a contacts list
(search_query.source = 'apollo_contacts_list') that carry a verified email in
revealed_payload (the list already unlocked it — no reveal step ran). Writes:

  leads            — upsert on email, DEFAULT resolution=ignore-duplicates so a richer
                     maven-sourced row is never flattened by an Apollo record. The full
                     contact/person object lives under data.apollo (seg reads
                     data->apollo->title). --overwrite-leads switches to merge-duplicates.
  lead_provenance  — one 'martech_uk_list' row per lead (WHY it's a lead). A lead can also
                     carry 'maven_workshop' — both coexist (keyed per source_type).

Contacts whose revealed_payload has no email (email_status='unavailable') are left banked,
unpromoted — never faked.

Usage:
  python3 stage6_list_promote.py --label <id>              # dry-run: counts only
  python3 stage6_list_promote.py --label <id> --apply [--overwrite-leads]
"""
import json
import sys
from datetime import date, datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from intent_adaptors.db import load_env, rest  # noqa: E402

HERE = Path(__file__).parent
LISTS = {"6a630b795233df000c384c95": {"name": "Martech UK", "run": "stage6-list-martech-uk-1",
                                      "ver": "martech-uk-v1"},
         "6a614d087f78c900143b450c": {"name": "Martech Consultants — South Africa",
                                      "run": "stage6-list-martech-sa-1", "ver": "martech-sa-v1"}}


def arg(flag, default=None):
    return sys.argv[sys.argv.index(flag) + 1] if flag in sys.argv else default


def fetch_list_people(env, label):
    """apollo_people_raw rows for this list carrying a real revealed email."""
    out, offset = [], 0
    while True:
        page = rest(env, "apollo_people_raw?select=apollo_person_id,apollo_org_id,"
                    "revealed_payload,search_query"
                    f"&search_query->>label_id=eq.{label}"
                    f"&revealed_payload=not.is.null&limit=1000&offset={offset}")
        if not page:
            break
        out.extend(r for r in page
                   if (r.get("revealed_payload") or {}).get("email"))
        offset += 1000
    return out


def fetch_company_names(env):
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
            "source": {"name": "martech-uk-list", "type": "apollo_contacts_list"},
            "signup_date": today,
            "apollo": p,          # full contact/person object — seg reads apollo->title
        },
    }


def build_provenance(row, names, label, label_name, run_id, ver, run_date):
    p = row["revealed_payload"]
    org = p.get("organization") or {}
    org_id = row.get("apollo_org_id")
    return {
        "email": p["email"],
        "source_type": "martech_uk_list",
        "source": "apollo_contacts_list",
        "evidence": {
            "label_id": label, "label_name": label_name,
            "apollo_org_id": org_id,
            "company": names.get(org_id) or org.get("name"),
            "title": p.get("title"),
            "seniority": p.get("seniority"),
            "apollo_person_id": row["apollo_person_id"],
        },
        # when the reason became true: the contact's created_at, else the run date
        "observed_at": p.get("created_at") or run_date,
        "source_version": ver,
        "run_id": run_id,
    }


def chunked(rows, n=100):
    for i in range(0, len(rows), n):
        yield rows[i:i + n]


def main():
    apply = "--apply" in sys.argv
    overwrite = "--overwrite-leads" in sys.argv
    label = arg("--label")
    if not label:
        sys.exit("usage: stage6_list_promote.py --label <id> [--apply] [--overwrite-leads]")
    meta = LISTS.get(label, {})
    label_name = meta.get("name", label)
    run_id = meta.get("run", "stage6-list-1")
    ver = meta.get("ver", "list-v1")
    run_date = arg("--date", date.today().isoformat())
    today = datetime.now(timezone.utc).isoformat()

    env = load_env()
    rows = fetch_list_people(env, label)
    names = fetch_company_names(env)

    existing, offset = set(), 0
    while True:
        page = rest(env, f"leads?select=email&limit=1000&offset={offset}")
        if not page:
            break
        existing.update(r["email"] for r in page)
        offset += 1000

    leads = [build_lead(r, today) for r in rows]
    prov = [build_provenance(r, names, label, label_name, run_id, ver, run_date)
            for r in rows]
    new = [l for l in leads if l["email"] not in existing]
    dupes = len(leads) - len(new)

    print(f'list "{label_name}": {len(rows)} contacts with a verified email')
    print(f"  {len(new)} new leads, {dupes} already in leads "
          f"({'overwrite' if overwrite else 'ignore-duplicates'})")
    print(f"  {len(prov)} martech_uk_list provenance rows")
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
