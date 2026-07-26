#!/usr/bin/env python3
"""Stage 6 (list variant) — collect an Apollo CONTACTS LIST → snapshot + apollo_people_raw.

Unlike stage6_collect.py (People SEARCH — locked emails, 1 credit/page), this reads a
saved CONTACTS LIST. Reading your OWN contacts is FREE and each contact already carries
a **verified email** and a full `organization` object. So there is no reveal step: we
bank the contact record as BOTH `payload` and `revealed_payload`, letting stage6_list_
promote.py read the email from `revealed_payload` exactly like Stage 6 — zero credits.

Reusable across lists via --label: "Martech UK" (6a630b795233df000c384c95, ~1000) and
"Martech Consultants — South Africa" (6a614d087f78c900143b450c, ~59) both work.

Usage:
  python3 stage6_list_collect.py --label <id> [--name "..."] [--slug ...] [--dry-run] [--date YYYY-MM-DD]
Writes: apollo_people/<date>-<slug>/page-N.json + breadcrumbs.json; upserts apollo_people_raw.
Key: APOLLO_API_KEY in .env — never echoed. Reading own contacts costs 0 credits.
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
URL = "https://api.apollo.io/api/v1/contacts/search"
PER_PAGE = 100

# Known lists (label id -> display name + dir slug). --label may be any of these or a raw id.
LISTS = {
    "6a630b795233df000c384c95": {"name": "Martech UK", "slug": "martech-uk"},
    "6a614d087f78c900143b450c": {"name": "Martech Consultants — South Africa",
                                 "slug": "martech-consultants-sa"},
}


def load_key():
    for line in (HERE / ".env").read_text().splitlines():
        if line.startswith("APOLLO_API_KEY="):
            return line.split("=", 1)[1].strip().strip('"').strip("'")
    sys.exit("APOLLO_API_KEY not found in .env")


def search(label, key, page=1, per_page=PER_PAGE):
    body = {"contact_label_ids": [label], "per_page": per_page, "page": page}
    req = urllib.request.Request(
        URL, data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json", "Cache-Control": "no-cache",
                 "accept": "application/json", "X-Api-Key": key})
    with urllib.request.urlopen(req, timeout=90) as r:
        return json.load(r)


def build_row(contact, label, label_name, now):
    """One apollo_people_raw row. payload == revealed_payload == the full contact record
    (it already carries a verified email + organization). last_revealed stamped so promote
    treats it as revealed with zero credits."""
    return {
        "apollo_person_id": contact["person_id"],
        "apollo_org_id": (contact.get("organization") or {}).get("id")
                         or contact.get("organization_id"),
        "payload": contact,
        "revealed_payload": contact,
        "last_revealed": now,
        "search_query": {"source": "apollo_contacts_list",
                         "label_id": label, "label_name": label_name},
    }


def upsert_people(env, rows):
    """Upsert on apollo_person_id. merge-duplicates so a re-run refreshes payload +
    revealed_payload from the list (these ARE the verified records, not a locked search)."""
    for i in range(0, len(rows), 100):
        rest(env, "apollo_people_raw?on_conflict=apollo_person_id", method="POST",
             body=rows[i:i + 100],
             prefer="resolution=merge-duplicates,return=minimal")


def arg(flag, default=None):
    return sys.argv[sys.argv.index(flag) + 1] if flag in sys.argv else default


def main():
    dry = "--dry-run" in sys.argv
    label = arg("--label")
    if not label:
        sys.exit("usage: stage6_list_collect.py --label <id> [--name ...] [--slug ...] "
                 "[--dry-run] [--date YYYY-MM-DD]")
    meta = LISTS.get(label, {})
    label_name = arg("--name", meta.get("name", label))
    slug = arg("--slug", meta.get("slug", label))
    run_date = arg("--date", date.today().isoformat())

    env = load_env()
    key = load_key()
    now = f"{run_date}T00:00:00Z"
    out_dir = HERE / "apollo_people" / f"{run_date}-{slug}"

    # Free probe: page 1, per_page 1 → total_entries. No credit cost (own contacts).
    probe = search(label, key, page=1, per_page=1)
    total = probe["pagination"]["total_entries"]
    pages = -(-total // PER_PAGE)
    print(f'list "{label_name}" ({label}): {total} contacts → {pages} pages of {PER_PAGE} '
          f"(reading own contacts = 0 credits)")
    if dry:
        print(f"dry-run — would snapshot to apollo_people/{run_date}-{slug}/ and upsert "
              f"~{total} apollo_people_raw rows. No writes.")
        return

    out_dir.mkdir(parents=True, exist_ok=True)
    banked = no_person = no_org = 0
    for page in range(1, pages + 1):
        d = search(label, key, page=page)
        contacts = d.get("contacts", [])
        if not contacts:
            break
        (out_dir / f"page-{page}.json").write_text(json.dumps(d))
        rows = []
        for c in contacts:
            if not c.get("person_id"):
                no_person += 1
                continue
            if not ((c.get("organization") or {}).get("id") or c.get("organization_id")):
                no_org += 1
            rows.append(build_row(c, label, label_name, now))
        upsert_people(env, rows)
        banked += len(rows)
        print(f"page {page}/{pages} +{len(rows)} ({banked}/{total} banked)")
        time.sleep(0.3)

    (out_dir / "breadcrumbs.json").write_text(json.dumps({
        "endpoint": URL, "modality": "contacts",
        "label_id": label, "label_name": label_name,
        "filters": {"contact_label_ids": [label]}, "per_page": PER_PAGE,
        "total_entries": total, "pages": pages, "run_date": run_date,
        "note": "own-contacts read — 0 credits; email verified + organization inline, "
                "so payload==revealed_payload and no reveal step is needed.",
    }, indent=1))
    print(f"done — {banked} contacts banked, {no_person} skipped (no person_id), "
          f"{no_org} with null org")


if __name__ == "__main__":
    main()
