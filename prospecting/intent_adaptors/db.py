"""PostgREST/urllib helpers — same connection approach as stage2_load.py / stage4_score.py.

SUPABASE_URL + SUPABASE_KEY from prospecting/.env; /rest/v1; merge-duplicates upserts.
No psycopg2 — Stage 5 v1 has no SQL join, so nothing justifies diverging from the
existing stage scripts' style.
"""
from __future__ import annotations

import json
import sys
import urllib.request
from pathlib import Path
from typing import Any

ENV_PATH = Path(__file__).resolve().parent.parent / ".env"


def load_env(path: Path = ENV_PATH) -> dict[str, str]:
    """Minimal .env reader — no external deps, no echoing of secrets."""
    env: dict[str, str] = {}
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        env[k.strip()] = v.strip().strip('"').strip("'")
    return env


def rest(env: dict[str, str], path: str, method: str = "GET",
         body: Any = None, prefer: str | None = None) -> Any:
    """One PostgREST call. Raises urllib.error.HTTPError on non-2xx."""
    url = f"{env['SUPABASE_URL'].rstrip('/')}/rest/v1/{path}"
    key = env["SUPABASE_KEY"]
    h = {"apikey": key, "Authorization": f"Bearer {key}",
         "Content-Type": "application/json"}
    if prefer:
        h["Prefer"] = prefer
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, headers=h, method=method)
    with urllib.request.urlopen(req, timeout=60) as r:
        raw = r.read()
        return json.loads(raw) if raw else None


def fetch_universe(env: dict[str, str], limit: int | None = None) -> list[dict]:
    """All apollo_company_universe accounts as [{apollo_org_id, domain}], paged 1000s."""
    out: list[dict] = []
    offset = 0
    while True:
        page = rest(env, "apollo_company_universe?select=apollo_org_id,domain"
                    f"&limit=1000&offset={offset}")
        if not page:
            break
        out.extend(page)
        offset += 1000
        if limit and len(out) >= limit:
            return out[:limit]
    return out


def fetch_fit_accounts(env: dict[str, str], product: str,
                       limit: int | None = None) -> list[dict]:
    """Accounts that already have a Stage-4 fit score → [{apollo_org_id, domain}].

    Intent is only worth (paid) collection on accounts that already show technology
    fit — i.e. run >=1 target CDP/MAP, which is exactly the set carrying a
    score_type='fit' row. That is ~167 of the ~2,983 universe: an ~18x credit saving
    over collecting the whole universe. Domain comes from the embedded universe row
    (the scores table has no domain of its own).
    """
    out: list[dict] = []
    offset = 0
    while True:
        page = rest(env, "apollo_company_scores"
                    "?select=apollo_org_id,apollo_company_universe(domain)"
                    f"&product=eq.{product}&score_type=eq.fit"
                    f"&limit=1000&offset={offset}")
        if not page:
            break
        for r in page:
            uni = r.get("apollo_company_universe") or {}
            out.append({"apollo_org_id": r["apollo_org_id"],
                        "domain": uni.get("domain")})
        offset += 1000
        if limit and len(out) >= limit:
            return out[:limit]
    return out
