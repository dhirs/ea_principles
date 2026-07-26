#!/usr/bin/env python3
"""Stage 6 (list variant) — technology (CDP/MAP) attribution for list companies. CREDIT GATE A.

Enrichment carries NO technographics on this plan (stage4_bank_enrichment.py), so which
CDP/MAP a company runs is recovered from the SEARCH endpoint, exactly like Stage 4
(stage4_uid_probe.py). The ONLY difference: Stage 4 scopes each uid probe by the ICP
firmographic block; here we scope by the list companies' `organization_ids` (cap 100/req).

Cost: ~1 credit per search page that returns >=1 hit, 0 for a uid/batch with no matches.
Worst case = |uids| * ceil(new_companies / 100). Real spend is far lower (most uid x batch
combos return nothing). --dry-run prints the exact worst case; --confirm spends.

PARAM VERIFICATION (Stage 4's lesson — a wrong filter key is accepted silently): the first
live probe asserts every returned org id is within our scoped set. If organization_ids were
ignored, results would include out-of-scope orgs → the run ABORTS before spending further.

Modes:
  --dry-run            batches + worst-case credit estimate, no spend        (default)
  --confirm            run the probes (SPENDS credits), write probe files
  --score              invert probe files -> apollo_company_scores (FREE, no Apollo call)
Usage: python3 stage6_list_technologies.py --label <id> [--date ...] [--confirm | --score]
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
from stage4_score import slug, UID_OVERRIDES  # reuse Stage 4's uid->name rule  # noqa: E402

HERE = Path(__file__).parent
URL = "https://api.apollo.io/api/v1/mixed_companies/search"
PRODUCT = "cdp-selection"
RULES_VERSION = "area1-list-v1"
METHOD = "search_probe"
ORG_BATCH = 100          # Apollo caps organization_ids per request
PER_PAGE = 100

LISTS = {"6a630b795233df000c384c95": {"slug": "martech-uk"},
         "6a614d087f78c900143b450c": {"slug": "martech-consultants-sa"}}


def arg(flag, default=None):
    return sys.argv[sys.argv.index(flag) + 1] if flag in sys.argv else default


def load_key():
    for line in (HERE / ".env").read_text().splitlines():
        if line.startswith("APOLLO_API_KEY="):
            return line.split("=", 1)[1].strip().strip('"').strip("'")
    sys.exit("APOLLO_API_KEY not found in .env")


def targets():
    t = json.loads((HERE / "stage4_target_technologies.json").read_text())
    uids = list(t["cdp"]["uids_confident"]) + list(t["map"]["uids_confident"])
    names = {}
    for grp in ("cdp", "map"):
        names.update({slug(n): n for n in t[grp]["names"]})
    names.update(UID_OVERRIDES)
    missing = [u for u in uids if u not in names]
    if missing:
        sys.exit(f"no display name for uid(s): {missing} — fix before scoring")
    return uids, names


def list_org_ids(env, label):
    """Org ids of THIS list's companies (tagged rows), from the universe."""
    ids, offset = [], 0
    while True:
        page = rest(env, "apollo_company_universe?select=apollo_org_id"
                    f"&products=cs.{{\"martech-uk-list\":{{\"label_id\":\"{label}\"}}}}"
                    f"&limit=1000&offset={offset}")
        if not page:
            break
        ids += [r["apollo_org_id"] for r in page]
        offset += 1000
    return ids


def probe(uid, org_ids, key, page=1):
    body = {"organization_ids": org_ids,
            "currently_using_any_of_technology_uids": [uid],
            "per_page": PER_PAGE, "page": page}
    req = urllib.request.Request(
        URL, data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json", "Cache-Control": "no-cache",
                 "accept": "application/json", "X-Api-Key": key})
    with urllib.request.urlopen(req, timeout=90) as r:
        return json.load(r)


def do_score(env, out_dir):
    uids, names = targets()
    hits = {}
    for f in sorted((out_dir).glob("*.json")):
        d = json.loads(f.read_text())
        for oid in d["ids"]:
            hits.setdefault(oid, []).append(d["uid"])
    print(f"companies with >=1 target tech: {len(hits)}")

    universe = set(list_org_ids_all(env))
    scored = {k: v for k, v in hits.items() if k in universe}
    print(f"to score: {len(scored)} | skipped (not in universe): {len(hits)-len(scored)}")

    rows = [{
        "apollo_org_id": oid, "product": PRODUCT, "score_type": "fit",
        "score": len(set(us)),
        "signals": {"matched_uids": sorted(set(us)),
                    "matched_names": sorted({names[u] for u in us}),
                    "method": METHOD},
        "rules_version": RULES_VERSION,
    } for oid, us in sorted(scored.items())]
    for i in range(0, len(rows), 100):
        rest(env, "apollo_company_scores?on_conflict=apollo_org_id,product,score_type",
             method="POST", body=rows[i:i + 100],
             prefer="resolution=merge-duplicates,return=minimal")
        print(f"  upserted {min(i+100, len(rows))}/{len(rows)}")
    print(f"done — {len(rows)} fit rows written")


def list_org_ids_all(env):
    ids, offset = [], 0
    while True:
        page = rest(env, "apollo_company_universe?select=apollo_org_id"
                    f"&limit=1000&offset={offset}")
        if not page:
            break
        ids += [r["apollo_org_id"] for r in page]
        offset += 1000
    return ids


def main():
    confirm = "--confirm" in sys.argv
    score = "--score" in sys.argv
    label = arg("--label")
    if not label:
        sys.exit("usage: stage6_list_technologies.py --label <id> [--confirm | --score]")
    slug_ = LISTS.get(label, {}).get("slug", label)
    run_date = arg("--date", date.today().isoformat())
    out_dir = HERE / "apollo_companies" / f"{run_date}-{slug_}" / "uid_probes"

    env = load_env()
    if score:
        do_score(env, out_dir)
        return

    uids, _ = targets()
    org_ids = list_org_ids(env, label)
    batches = [org_ids[i:i + ORG_BATCH] for i in range(0, len(org_ids), ORG_BATCH)]
    worst = len(uids) * len(batches)
    print(f"{len(org_ids)} list companies | {len(batches)} org batches | "
          f"{len(uids)} target techs (33 CDP + 20 MAP)")
    print(f"worst-case: {len(uids)} techs x {len(batches)} batches = {worst} search pages "
          f"→ up to {worst} credits (0 for a tech/batch with no hits — real spend far lower)")

    if not confirm:
        print("\ndry-run — no spend. Re-run with --confirm to probe, then --score to write.")
        return

    key = load_key()
    out_dir.mkdir(parents=True, exist_ok=True)
    scoped = set(org_ids)
    done = {p.stem for p in out_dir.glob("*.json")}
    todo = [u for u in uids if u not in done]
    print(f"{len(done)} already probed | {len(todo)} to run")

    spent = verified = 0
    for i, uid in enumerate(todo, 1):
        ids, total = [], 0
        for bi, batch in enumerate(batches, 1):
            d = probe(uid, batch, key)
            page_total = d["pagination"]["total_entries"]
            got = [o["id"] for o in d.get("organizations", [])]
            # paginate a batch if >100 hit (rare — batch is <=100 orgs, so total<=100)
            for pg in range(2, d["pagination"]["total_pages"] + 1):
                got += [o["id"] for o in probe(uid, batch, key, page=pg)
                        .get("organizations", [])]
            # PARAM VERIFICATION on the very first live response with hits:
            if not verified and got:
                stray = [o for o in got if o not in scoped]
                if stray:
                    sys.exit(f"ABORT: organization_ids appears IGNORED — {len(stray)} "
                             f"returned org(s) are outside our scoped set (e.g. {stray[0]}). "
                             f"Wrong filter key; no more spend. Verify the param name.")
                verified = 1
                print("  ✓ organization_ids verified — hits are within scope")
            if page_total > 0:
                spent += d["pagination"]["total_pages"]
            ids += [o for o in got if o in scoped]
            time.sleep(0.3)
        rec = {"uid": uid, "total": len(set(ids)), "ids": sorted(set(ids)),
               "batches": len(batches)}
        (out_dir / f"{uid}.json").write_text(json.dumps(rec))
        print(f"[{i}/{len(todo)}] {uid:42s} hits={len(set(ids)):4d} (credits so far ~{spent})")

    print(f"\ndone — probes written to {out_dir} (~{spent} credits). "
          f"Now: python3 stage6_list_technologies.py --label {label} --score")


if __name__ == "__main__":
    main()
