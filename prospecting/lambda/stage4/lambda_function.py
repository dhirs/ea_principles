"""apollo_stage_4 — Stage 4 fit scoring as a Lambda.

Ports prospecting/stage4_uid_probe.py + stage4_score.py into one handler. Does exactly
what the local scripts do, but reads the target-technology list from S3 instead of the
local file and keeps everything in memory (no uid_probes/*.json):

  1. read stage4_target_technologies.json from S3 (bucket + key from env)
  2. for each target uid (CDP + MAP), search Apollo with the Stage 1 firmographics and
     collect the org ids that run it  (1 credit per uid that returns >=1 match)
  3. intersect with apollo_company_universe (the scores FK requires it)
  4. score = count of distinct target technologies each company runs
  5. upsert one score_type='fit' row per company into apollo_company_scores

No third-party packages: Apollo + Supabase are called over urllib (stdlib), S3 via boto3
(preinstalled in the Lambda runtime). So this function needs NO layer.

Secrets/config come from Lambda environment variables (same convention as the other
Supabase lambdas): APOLLO_API_KEY, SUPABASE_URL, SUPABASE_KEY, S3_BUCKET_NAME,
TECH_S3_KEY, PRODUCT, RULES_VERSION.

Event overrides (all optional): {"dry_run": true, "max_uids": N}. dry_run does everything
but the final upsert; max_uids probes only the first N uids (cheap smoke test).
"""
import json
import os
import re
import time
import urllib.request

import boto3

APOLLO_URL = "https://api.apollo.io/api/v1/mixed_companies/search"

# Stage 1 firmographics — identical to stage4_uid_probe.py BASE, so each probe is scoped
# to our universe shape.
BASE_QUERY = {
    "organization_naics_codes": ["11", "21", "22", "23", "31", "32", "33", "44", "45",
                                 "48", "49", "51", "52", "53", "54", "56", "61", "62",
                                 "71", "72"],
    "organization_locations": ["United States", "Canada"],
    "organization_num_employees_ranges": ["201,500", "501,1000"],
    "revenue_range": {"min": 50000000, "max": 100000000},
    "organization_department_or_subdepartment_counts": {
        "master_marketing": {"min": 5, "max": 20}
    },
    "per_page": 100,
}

# The one irregular slug the display-name rule can't produce (stage4_score.py).
UID_OVERRIDES = {"adobe_realtime_cdp": "Adobe Real-Time CDP"}

MAX_PAGES = 25          # per-uid safety cap (2,500 orgs); log if a uid would exceed it
BATCH = 100             # rows per PostgREST upsert


def _env(name, default=None, required=False):
    v = os.environ.get(name, default)
    if required and not v:
        raise RuntimeError(f"missing required env var: {name}")
    return v


# --- name/uid helpers (ported verbatim from stage4_score.py) -----------------
def _slug(name):
    s = name.lower().replace("&", "and")
    s = re.sub(r"[().,/#+\-]", " ", s)
    return re.sub(r"\s+", " ", s).strip().replace(" ", "_")


def _uid_name_map(block):
    m = {_slug(n): n for n in block["names"]}
    m.update(UID_OVERRIDES)
    return m


# --- block selection ---------------------------------------------------------
VALID_BLOCKS = {"cdp", "map"}


def _parse_blocks(raw):
    """Which target blocks to probe. Default (None) = both. Accepts 'cdp'|'map'|
    'both'|'all', or a list like ['map']."""
    if raw is None:
        return set(VALID_BLOCKS)
    if isinstance(raw, str):
        if raw.lower() in ("both", "all", "*"):
            return set(VALID_BLOCKS)
        raw = [raw]
    out = {str(b).lower() for b in raw}
    bad = out - VALID_BLOCKS
    if bad:
        raise ValueError(f"unknown block(s) {sorted(bad)}; valid: cdp, map")
    return out or set(VALID_BLOCKS)


# --- S3 ----------------------------------------------------------------------
def _load_targets(bucket, key, blocks):
    """Return (uids_to_probe, uid2name, uid2block).

    Classification (uid2name/uid2block) is built from BOTH blocks regardless of which
    are probed, so a partial run can recognise and preserve the other block's existing
    matches. Only the SELECTED blocks' uids are probed.
    """
    obj = boto3.client("s3").get_object(Bucket=bucket, Key=key)
    data = json.loads(obj["Body"].read())
    uid2name, uid2block, probe, seen = {}, {}, [], set()
    for block_name in ("cdp", "map"):
        block = data.get(block_name) or {}
        uid2name.update(_uid_name_map(block))      # slug(name)==uid invariant
        for u in block.get("uids_confident", []):
            uid2block[u] = block_name
            if block_name in blocks and u not in seen:
                seen.add(u)
                probe.append(u)
    return probe, uid2name, uid2block


def _fetch_existing_matched(base_url, key, product, org_ids):
    """{apollo_org_id: [matched_uids]} for existing fit rows — to merge on partial runs."""
    out = {}
    for i in range(0, len(org_ids), 100):
        chunk = ",".join(org_ids[i:i + 100])
        rows = _rest(base_url, key,
                     f"apollo_company_scores?select=apollo_org_id,signals"
                     f"&product=eq.{product}&score_type=eq.fit&apollo_org_id=in.({chunk})")
        for r in rows or []:
            out[r["apollo_org_id"]] = (r.get("signals") or {}).get("matched_uids", [])
    return out


# --- Apollo ------------------------------------------------------------------
def _apollo_search(api_key, uid, page):
    body = dict(BASE_QUERY, currently_using_any_of_technology_uids=[uid], page=page)
    req = urllib.request.Request(
        APOLLO_URL, data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json", "Cache-Control": "no-cache",
                 "accept": "application/json", "X-Api-Key": api_key})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def _probe_uid(api_key, uid):
    """All org ids running `uid` within the Stage 1 shape (paginated).

    Returns (total, ids, truncated, pages_charged). Apollo charges 1 credit per page of
    100, and 0 for a no-match uid — so pages_charged = pages fetched when total>0, else 0.
    """
    first = _apollo_search(api_key, uid, 1)
    total = first["pagination"]["total_entries"]
    ids = [o["id"] for o in first["organizations"]]
    total_pages = first["pagination"]["total_pages"]
    pages = min(total_pages, MAX_PAGES)
    for pg in range(2, pages + 1):
        ids += [o["id"] for o in _apollo_search(api_key, uid, pg)["organizations"]]
        time.sleep(0.3)
    pages_charged = pages if total > 0 else 0
    return total, ids, total_pages > MAX_PAGES, pages_charged


# --- Supabase (PostgREST over urllib) ----------------------------------------
def _rest(base_url, key, path, method="GET", body=None, prefer=None):
    url = f"{base_url.rstrip('/')}/rest/v1/{path}"
    h = {"apikey": key, "Authorization": f"Bearer {key}",
         "Content-Type": "application/json"}
    if prefer:
        h["Prefer"] = prefer
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, headers=h, method=method)
    with urllib.request.urlopen(req, timeout=60) as r:
        raw = r.read()
        return json.loads(raw) if raw else None


def _fetch_universe_ids(base_url, key):
    ids, offset = set(), 0
    while True:
        page = _rest(base_url, key,
                     f"apollo_company_universe?select=apollo_org_id&limit=1000&offset={offset}")
        if not page:
            break
        ids |= {r["apollo_org_id"] for r in page}
        offset += 1000
    return ids


# --- handler -----------------------------------------------------------------
def lambda_handler(event, context):
    event = event or {}
    dry_run = bool(event.get("dry_run"))
    max_uids = event.get("max_uids")
    blocks = _parse_blocks(event.get("blocks"))     # default both; ['map'] / 'cdp' etc.

    api_key = _env("APOLLO_API_KEY", required=True)
    supabase_url = _env("SUPABASE_URL", required=True)
    supabase_key = _env("SUPABASE_KEY", required=True)
    bucket = _env("S3_BUCKET_NAME", "datawhistl")
    tech_key = _env("TECH_S3_KEY", "companies/technologies/stage4_target_technologies.json")
    product = _env("PRODUCT", "cdp-selection")
    rules_version = _env("RULES_VERSION", "area1-v2")  # v2 = CDP + MAP (v1 was CDP-only)

    uids, uid2name, uid2block = _load_targets(bucket, tech_key, blocks)
    if max_uids:
        uids = uids[: int(max_uids)]
    other_blocks = VALID_BLOCKS - blocks             # preserved on a partial run
    print(f"blocks={sorted(blocks)} | targets: {len(uids)} uids | product={product} "
          f"rules_version={rules_version} dry_run={dry_run}")

    # 2 — probe each uid
    hits, credits, truncated_uids = {}, 0, []
    for i, uid in enumerate(uids, 1):
        total, ids, truncated, pages_charged = _probe_uid(api_key, uid)
        credits += pages_charged
        if truncated:
            truncated_uids.append(uid)
        for oid in ids:
            hits.setdefault(oid, set()).add(uid)
        print(f"[{i}/{len(uids)}] {uid:44s} total={total:5d} ids={len(ids):5d} "
              f"credits={pages_charged}")
        time.sleep(0.3)

    # 3 — keep only universe members (scores FK)
    universe = _fetch_universe_ids(supabase_url, supabase_key)
    scored = {oid: us for oid, us in hits.items() if oid in universe}
    print(f"companies with >=1 target tech: {len(hits)} | in universe: {len(scored)} | "
          f"skipped (not in universe): {len(hits) - len(scored)} | est. credits: {credits}")

    # 3b — MERGE: on a partial run, preserve the other block's existing matches so a
    # map-only run never wipes yesterday's cdp scores (the fit row is one combined count).
    existing = {}
    if other_blocks and scored:
        existing = _fetch_existing_matched(supabase_url, supabase_key, product,
                                           list(scored))
    merged = 0

    # 4 — build score rows (matched_uids/_names/_blocks kept positionally aligned)
    rows = []
    for oid, todays in sorted(scored.items()):
        preserved = {u for u in existing.get(oid, []) if uid2block.get(u) in other_blocks}
        if preserved:
            merged += 1
        final = sorted(set(todays) | preserved)
        rows.append({
            "apollo_org_id": oid,
            "product": product,
            "score_type": "fit",
            "score": len(final),
            "signals": {"matched_uids": final,
                        "matched_names": [uid2name.get(u, u) for u in final],
                        "matched_blocks": [uid2block.get(u) for u in final],
                        "method": "search_probe"},
            "rules_version": rules_version,
        })

    result = {
        "blocks": sorted(blocks),
        "targets_probed": len(uids),
        "companies_matched": len(hits),
        "scored_in_universe": len(scored),
        "merged_with_existing": merged,
        "est_credits": credits,
        "truncated_uids": truncated_uids,
        "dry_run": dry_run,
    }

    if dry_run:
        print("dry-run — not upserting")
        result["sample"] = rows[:3]
        return result

    # 5 — upsert
    for i in range(0, len(rows), BATCH):
        _rest(supabase_url, supabase_key,
              "apollo_company_scores?on_conflict=apollo_org_id,product,score_type",
              method="POST", body=rows[i:i + BATCH],
              prefer="resolution=merge-duplicates,return=minimal")
        print(f"  upserted {min(i + BATCH, len(rows))}/{len(rows)}")
    result["rows_upserted"] = len(rows)
    print("done")
    return result
