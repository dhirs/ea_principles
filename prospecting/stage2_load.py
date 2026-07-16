#!/usr/bin/env python3
"""
Stage 2 loader — page-N.json  ->  Supabase apollo_company_raw

Fetch (Apollo mixed_companies/search) is done separately via the Apollo MCP,
which saves each raw response to apollo_companies/<date>/page-N.json. This
script is the *load* half: it reads those pages and upserts every organization
verbatim into the apollo_company_raw table over PostgREST (idempotent on
apollo_org_id; the DB trigger stamps last_refresh).

No qualifying, no field mapping — the whole Apollo org object goes into
payload. Stage 3 (separate SQL) filters raw -> apollo_company_universe.

Usage:
  python3 stage2_load.py                 # newest dir under apollo_companies/
  python3 stage2_load.py <dir>           # a specific apollo_companies/<date>/
  python3 stage2_load.py <dir> --dry-run # parse + count, no writes
"""
import glob
import json
import os
import sys
import urllib.error
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
STORE = os.path.join(HERE, "apollo_companies")
BATCH = 100  # rows per PostgREST POST


def load_env(path):
    """Minimal .env reader — no external deps, no echoing of secrets."""
    env = {}
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, _, v = line.partition("=")
            env[k.strip()] = v.strip()
    return env


def newest_date_dir():
    dirs = sorted(d for d in glob.glob(os.path.join(STORE, "*")) if os.path.isdir(d))
    if not dirs:
        sys.exit(f"no date dirs under {STORE}")
    return dirs[-1]


def rows_from_page(path):
    """Extract [{apollo_org_id, payload}] from one page-N.json."""
    with open(path) as f:
        data = json.load(f)
    orgs = data.get("organizations") or []
    rows = []
    for o in orgs:
        oid = o.get("id")
        if not oid:
            continue  # skip malformed record, don't crash the batch
        rows.append({"apollo_org_id": oid, "payload": o})
    return rows


def upsert(base_url, key, rows):
    """POST a batch to PostgREST with upsert-on-conflict semantics."""
    url = f"{base_url}/rest/v1/apollo_company_raw?on_conflict=apollo_org_id"
    body = json.dumps(rows).encode()
    req = urllib.request.Request(url, data=body, method="POST")
    req.add_header("apikey", key)
    req.add_header("Authorization", f"Bearer {key}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", "resolution=merge-duplicates,return=minimal")
    with urllib.request.urlopen(req) as resp:
        return resp.status


def main():
    argv = [a for a in sys.argv[1:]]
    dry = "--dry-run" in argv
    argv = [a for a in argv if not a.startswith("--")]
    target = argv[0] if argv else newest_date_dir()
    if not os.path.isdir(target):
        sys.exit(f"not a directory: {target}")

    env = load_env(os.path.join(HERE, ".env"))
    base_url = env.get("SUPABASE_URL", "").rstrip("/")
    key = env.get("SUPABASE_KEY", "")
    if not dry and (not base_url or not key):
        sys.exit("SUPABASE_URL / SUPABASE_KEY missing from .env")

    pages = sorted(glob.glob(os.path.join(target, "page-*.json")))
    if not pages:
        sys.exit(f"no page-*.json in {target}")

    all_rows, seen = [], set()
    for p in pages:
        rows = rows_from_page(p)
        for r in rows:
            if r["apollo_org_id"] in seen:
                continue  # dedupe across pages before sending
            seen.add(r["apollo_org_id"])
            all_rows.append(r)
        print(f"  {os.path.basename(p)}: {len(rows)} orgs")

    print(f"\n{len(pages)} pages, {len(all_rows)} unique orgs")
    if dry:
        print("dry-run — no writes")
        return

    sent = 0
    for i in range(0, len(all_rows), BATCH):
        chunk = all_rows[i : i + BATCH]
        try:
            upsert(base_url, key, chunk)
            sent += len(chunk)
            print(f"  upserted {sent}/{len(all_rows)}")
        except urllib.error.HTTPError as e:
            sys.exit(f"HTTP {e.code} on batch @ {i}: {e.read().decode()[:300]}")
    print(f"\ndone — {sent} rows upserted into apollo_company_raw")


if __name__ == "__main__":
    main()
