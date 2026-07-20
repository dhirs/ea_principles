#!/usr/bin/env python3
"""Stage 6 — People search: enumerate marketing buyers at fit-scored accounts.

The CHEAP face. Search enumerates people by title/seniority at an account but returns
a LOCKED email; reveal (stage6_reveal.py) unlocks it at ~1 credit/contact. So this
script spends ~1 credit per page of 100 people and banks everyone it sees — the
durable superset, so a later promotion decision never re-spends credits.

Scope: accounts carrying a Stage-4 `fit` row (>=1 target CDP/MAP), not the whole
universe — 1,425 of 2,983.

FIELD-NAME FINDING (2026-07-20, verified against the live schema): Apollo's people
search has NO person-department filter. `person_department_or_subdepartments` — named
in stage6_people.md and stage6_BUILD.md — does not exist under that or any other name.
`organization_department_or_subdepartment_counts` filters the EMPLOYER's department
headcount, not the person's. So "marketing department" is expressible only as a title
match. That is a constraint of the API, not a choice.

Usage: python3 stage6_collect.py [--dry-run] [--limit N] [--date YYYY-MM-DD]
Writes: apollo_people/<date>/page-N.json + breadcrumbs.json, and upserts apollo_people_raw.
Key: APOLLO_API_KEY in .env — never echoed.
"""
import json
import sys
import time
import urllib.request
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from intent_adaptors.db import load_env, rest  # noqa: E402

HERE = Path(__file__).parent
# mixed_people/search is DEPRECATED for API callers (422 with a pointer to this one).
URL = "https://api.apollo.io/api/v1/mixed_people/api_search"
PRODUCT = "cdp-selection"
ORG_BATCH = 100          # Apollo caps organization_ids per request
PER_PAGE = 100           # 1 credit per page

# The buyer net. Titles are the ONLY way to express "marketing" here (see module docstring).
FILTERS = {
    "person_seniorities": ["vp", "director", "head"],
    "person_titles": ["marketing"],
}


def load_key():
    for line in (HERE / ".env").read_text().splitlines():
        if line.startswith("APOLLO_API_KEY="):
            return line.split("=", 1)[1].strip().strip('"').strip("'")
    sys.exit("APOLLO_API_KEY not found in .env")


def search(org_ids, key, page=1):
    body = dict(FILTERS, organization_ids=org_ids, per_page=PER_PAGE, page=page)
    req = urllib.request.Request(
        URL,
        data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json",
                 "Cache-Control": "no-cache",
                 "accept": "application/json",
                 "X-Api-Key": key},
    )
    with urllib.request.urlopen(req, timeout=90) as r:
        return json.load(r)


def fit_accounts(env, limit=None):
    """Accounts with a Stage-4 fit row — the >=1-technology set — as [(org_id, name)].

    The name is needed because api_search returns organization.name but NOT
    organization.id (see resolve_org).
    """
    out, offset = [], 0
    while True:
        page = rest(env, "apollo_company_scores"
                    "?select=apollo_org_id,apollo_company_universe(company)"
                    f"&product=eq.{PRODUCT}&score_type=eq.fit"
                    f"&limit=1000&offset={offset}")
        if not page:
            break
        out.extend((r["apollo_org_id"],
                    (r.get("apollo_company_universe") or {}).get("company") or "")
                   for r in page)
        offset += 1000
        if limit and len(out) >= limit:
            return out[:limit]
    return out


_SUFFIXES = ("inc", "llc", "ltd", "corp", "corporation", "co", "company",
             "limited", "plc", "lp", "llp", "gmbh", "sa", "nv", "ag")


def norm(name):
    """Normalise a company name for matching: lowercase, drop punctuation + suffix."""
    s = "".join(c if c.isalnum() or c.isspace() else " " for c in (name or "").lower())
    parts = [p for p in s.split() if p and p not in ("the",)]
    while parts and parts[-1] in _SUFFIXES:
        parts.pop()
    return " ".join(parts)


def resolve_org(person, name_index):
    """Map a person to apollo_org_id via employer NAME, scoped to their own batch.

    api_search omits organization.id, so the id cannot be read off the payload. But
    the batch's 100 candidate orgs are known, so the match is against 100 names, not
    the whole universe — narrow enough to be reliable. Unresolved rows are kept with
    a null apollo_org_id (raw is a superset) and reported, never silently dropped.
    """
    return name_index.get(norm((person.get("organization") or {}).get("name")))


def upsert_people(env, rows):
    """Upsert on apollo_person_id. payload = the search record verbatim."""
    for i in range(0, len(rows), 100):
        rest(env, "apollo_people_raw?on_conflict=apollo_person_id", method="POST",
             body=rows[i:i + 100],
             prefer="resolution=merge-duplicates,return=minimal")


def main():
    dry = "--dry-run" in sys.argv
    limit = None
    run_date = date.today().isoformat()
    for i, a in enumerate(sys.argv):
        if a == "--limit":
            limit = int(sys.argv[i + 1])
        if a == "--date":
            run_date = sys.argv[i + 1]

    env = load_env()
    key = load_key()
    out_dir = HERE / "apollo_people" / run_date
    out_dir.mkdir(parents=True, exist_ok=True)

    accounts = fit_accounts(env, limit)
    batches = [accounts[i:i + ORG_BATCH] for i in range(0, len(accounts), ORG_BATCH)]
    print(f"{len(accounts)} fit-scored accounts | {len(batches)} org batches")

    # Cost probe: per_page=1 on batch 1, then project. Never sweep blind.
    probe = search([o for o, _ in batches[0]], key, page=1)
    per_batch = probe["total_entries"]
    projected = per_batch * len(batches)
    print(f"probe: {per_batch} people in batch 1 → ~{projected} people, "
          f"~{-(-projected // PER_PAGE)} pages (~1 credit/page)")
    if dry:
        print("dry-run — no sweep, no writes")
        return

    page_no = total_people = unresolved = 0
    for bi, batch in enumerate(batches, 1):
        org_ids = [o for o, _ in batch]
        name_index = {norm(n): o for o, n in batch if n}
        page, seen = 1, 0
        while True:
            d = search(org_ids, key, page=page)
            people = d.get("people", [])
            if not people:
                break
            page_no += 1
            (out_dir / f"page-{page_no}.json").write_text(json.dumps(d))

            rows = []
            for p in people:
                org_id = resolve_org(p, name_index)
                if org_id is None:
                    unresolved += 1
                rows.append({
                    "apollo_person_id": p["id"],
                    "apollo_org_id": org_id,
                    "payload": p,
                    "search_query": dict(FILTERS, org_batch=bi,
                                         org_ids_in_batch=len(org_ids)),
                })
            upsert_people(env, rows)
            seen += len(people)
            total_people += len(people)

            print(f"batch {bi}/{len(batches)} page {page} +{len(people)} "
                  f"({seen}/{d['total_entries']} in batch, {total_people} total)")
            if seen >= d["total_entries"] or len(people) < PER_PAGE:
                break
            page += 1
            time.sleep(0.4)
        time.sleep(0.4)

    # The query is not echoed back by this endpoint, so persist what we sent.
    (out_dir / "breadcrumbs.json").write_text(json.dumps({
        "endpoint": URL, "filters": FILTERS, "per_page": PER_PAGE,
        "scope": f"{len(accounts)} accounts with a {PRODUCT} fit score",
        "org_batches": len(batches), "run_date": run_date,
    }, indent=1))
    print(f"done — {total_people} people, {page_no} pages (~{page_no} credits), "
          f"{unresolved} unresolved employer")


if __name__ == "__main__":
    main()
