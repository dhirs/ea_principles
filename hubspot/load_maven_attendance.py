#!/usr/bin/env python3
"""Import the Maven lightning-lesson signups/attendance CSV into Supabase.

Three tables, all via the PostgREST URL (never psql):
  1. maven_events      — one row per distinct lesson (title+url). Reused if present.
  2. leads             — new emails only (ignore-duplicates => apollo enrichment preserved).
  3. maven_attendance  — one row per (event, lead), upserted on the unique key.
"""
import os, sys, json, csv, urllib.request, urllib.error, re
from datetime import datetime
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
CSV  = REPO / "uploads" / "lightning_lesson_signups_and_performance_2026-07-01T11_37_39.1318963-04_00.csv"


def env():
    e = {}
    for line in (REPO / ".env").read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        e[k.strip()] = v.strip()
    url = e["SUPABASE_URL"].rstrip("/")
    if not url.startswith("http"):
        url = "https://" + url
    return url, e["SUPABASE_KEY"]


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def parse_date(s):
    s = (s or "").strip()
    if not s:
        return None
    return datetime.strptime(s, "%b %d, %Y").date().isoformat()  # "Jun 30, 2026" -> 2026-06-30


def req(method, url, key, path, body=None, extra_headers=None):
    h = {"apikey": key, "Authorization": "Bearer " + key,
         "Content-Type": "application/json", "Content-Profile": "public"}
    if extra_headers:
        h.update(extra_headers)
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(url + path, data=data, headers=h, method=method)
    with urllib.request.urlopen(r, timeout=90) as resp:
        return resp.status, json.loads(resp.read() or b"[]")


def ensure_events(url, key, lessons):
    """lessons: set of (title, event_url). Returns {event_url: id}."""
    _, existing = req("GET", url, key, "/rest/v1/maven_events?select=id,event_url")
    by_url = {e["event_url"]: e["id"] for e in existing}
    to_create = [{"event_name": t, "event_url": u} for (t, u) in lessons if u not in by_url]
    if to_create:
        _, created = req("POST", url, key, "/rest/v1/maven_events", to_create,
                         {"Prefer": "return=representation"})
        for e in created:
            by_url[e["event_url"]] = e["id"]
        print(f"created {len(created)} new event(s)")
    else:
        print("all events already present")
    return by_url


def main():
    url, key = env()
    reader = list(csv.DictReader(CSV.open(encoding="utf-8-sig")))
    print(f"CSV rows: {len(reader)}")

    lessons = {(r["Lesson Title"].strip(), r["Lesson URL"].strip()) for r in reader}
    event_id = ensure_events(url, key, lessons)

    # --- dedupe leads by email (keep earliest signup) ---
    leads = {}
    for r in reader:
        em = (r["Email"] or "").strip().lower()
        if not em or "@" not in em:
            continue
        d = parse_date(r["Signup Date"])
        if em not in leads or (d and d < leads[em]["_d"]):
            leads[em] = {"_d": d or "9999", "title": r["Lesson Title"].strip(),
                         "src": r["Source"].strip()}
    lead_rows = [{
        "email": em, "fname": None, "lname": None, "domain": em.split("@", 1)[1],
        "data": {"email": em, "apollo": None,
                 "source": {"name": slug(v["title"]), "type": "maven_lightning_session",
                            "channel": v["src"]},
                 "company": "", "first_name": "", "last_name": "",
                 "signup_date": None if v["_d"] == "9999" else v["_d"]},
    } for em, v in leads.items()]

    inserted = 0
    for i in range(0, len(lead_rows), 500):
        _, body = req("POST", url, key, "/rest/v1/leads?on_conflict=email", lead_rows[i:i+500],
                      {"Prefer": "resolution=ignore-duplicates,return=representation"})
        inserted += len(body)
    print(f"leads: {len(lead_rows)} unique; newly-inserted {inserted}; already-existed {len(lead_rows)-inserted}")

    # --- dedupe attendance by (event, email); prefer an attended=1 row ---
    att = {}
    for r in reader:
        em = (r["Email"] or "").strip().lower()
        if not em or "@" not in em:
            continue
        eid = event_id[r["Lesson URL"].strip()]
        k = (eid, em)
        attended = r["Attended"].strip() == "1"
        row = {"event_id": eid, "lead_email": em,
               "signup_date": parse_date(r["Signup Date"]),
               "source": r["Source"].strip() or None,
               "attended": attended,
               "attended_live": r["Attended live"].strip().lower() == "yes"}
        if k not in att or (attended and not att[k]["attended"]):
            att[k] = row
    att_rows = list(att.values())

    n = 0
    for i in range(0, len(att_rows), 500):
        _, body = req("POST", url, key,
                      "/rest/v1/maven_attendance?on_conflict=event_id,lead_email", att_rows[i:i+500],
                      {"Prefer": "resolution=merge-duplicates,return=representation"})
        n += len(body)
    print(f"attendance: {len(att_rows)} rows upserted ({n} returned)")


if __name__ == "__main__":
    try:
        main()
    except urllib.error.HTTPError as e:
        print("HTTP", e.code, e.read().decode()[:800], file=sys.stderr)
        sys.exit(1)
