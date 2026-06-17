#!/usr/bin/env python3
"""
Inspect and load leads into the Supabase `leads` table — run LOCALLY (your box has
network access; the agent sandbox does not). Uses the repo-root .env, same as agentflow:
  SUPABASE_URL, SUPABASE_KEY   (REST / PostgREST path — direct DB is IPv6-only)

Usage:
  python3 hubspot/load_leads_supabase.py --inspect          # show table columns + row count
  python3 hubspot/load_leads_supabase.py --load             # upsert all of hubspot/leads.json
  python3 hubspot/load_leads_supabase.py --load --limit 50  # upsert first 50 (test)

Assumes the table has columns: email (unique), first_name, last_name, company, data (jsonb).
If your column names differ, edit COLMAP below.
"""
import os, sys, json, urllib.request, urllib.error
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
LEADS = Path(__file__).resolve().parent / "leads.json"

# root-field -> your table column name. Apollo blob goes into the jsonb column.
COLMAP = {
    "email": "email",
    "first_name": "first_name",
    "last_name": "last_name",
    "company": "company",
    "apollo": "data",          # <-- jsonb column; rename if yours differs
}
UPSERT_KEY = "email"

def env():
    e = {}
    for line in (REPO / ".env").read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("="); e[k.strip()] = v.strip()
    url = e["SUPABASE_URL"].rstrip("/")
    if not url.startswith("http"): url = "https://" + url
    return url, e["SUPABASE_KEY"]

def req(url, key, path, method="GET", body=None, extra=None):
    h = {"apikey": key, "Authorization": "Bearer " + key, "Content-Type": "application/json"}
    if extra: h.update(extra)
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(url + path, data=data, headers=h, method=method)
    with urllib.request.urlopen(r, timeout=30) as resp:
        return resp.status, resp.headers, resp.read()

def inspect(url, key):
    st, _, body = req(url, key, "/rest/v1/leads?select=*&limit=1")
    rows = json.loads(body)
    if rows:
        print("leads columns:")
        for k, v in rows[0].items():
            kind = "jsonb/array" if isinstance(v, (dict, list)) else type(v).__name__
            print(f"  - {k}: {kind}")
    else:
        print("leads table reachable but EMPTY.")
    _, h, _ = req(url, key, "/rest/v1/leads?select=email", extra={"Prefer": "count=exact", "Range": "0-0"})
    print("row count:", h.get("Content-Range"))

def load(url, key, limit=None):
    leads = json.loads(LEADS.read_text())
    if limit: leads = leads[:limit]
    rows = []
    for l in leads:
        row = {}
        for src, col in COLMAP.items():
            row[col] = l.get(src)
        rows.append(row)
    # PostgREST upsert in batches of 500
    sent = 0
    for i in range(0, len(rows), 500):
        chunk = rows[i:i+500]
        st, _, body = req(url, key, "/rest/v1/leads",
                          method="POST", body=chunk,
                          extra={"Prefer": f"resolution=merge-duplicates,return=minimal",
                                 "Content-Profile": "public"})
        sent += len(chunk)
        print(f"  upserted {sent}/{len(rows)} (HTTP {st})")
    print("done.")

if __name__ == "__main__":
    url, key = env()
    args = sys.argv[1:]
    try:
        if "--inspect" in args:
            inspect(url, key)
        elif "--load" in args:
            lim = None
            if "--limit" in args:
                lim = int(args[args.index("--limit") + 1])
            load(url, key, lim)
        else:
            print(__doc__)
    except urllib.error.HTTPError as e:
        print("HTTP", e.code, e.read().decode()[:500])
        sys.exit(1)
