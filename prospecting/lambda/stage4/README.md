# apollo_stage_4 — Stage 4 fit scoring (Lambda)

Runs the Stage 4 technology-fit scoring (Area 1, the whole fit model — see
`../../stage4_fit.md`) on AWS Lambda. Ports `stage4_uid_probe.py` + `stage4_score.py`
into one handler, reading the target-technology list from **S3** instead of the local
file.

## What it does (per invocation)
1. Reads `stage4_target_technologies.json` from S3 (`S3_BUCKET_NAME` / `TECH_S3_KEY`).
2. For each target uid (CDP + MAP), searches Apollo with the Stage 1 firmographics and
   collects the org ids running it — **1 credit per uid that returns ≥1 match**.
3. Intersects with `apollo_company_universe` (the `apollo_company_scores` FK requires it).
4. `score = count of distinct target technologies the company runs`.
5. Upserts one `score_type='fit'` row per company into `apollo_company_scores`
   (`on_conflict=apollo_org_id,product,score_type`, merge-duplicates — idempotent).

## No layer
Apollo + Supabase are called over `urllib` (stdlib); S3 via `boto3` (preinstalled in the
Lambda runtime). The handler imports **nothing third-party**, so `apollo_stage_4` runs
with **no Lambda layer** — nothing is packaged, no existing layer is duplicated.

## Config — environment variables
| Var | Purpose | Example |
|---|---|---|
| `APOLLO_API_KEY` | Apollo search | — |
| `SUPABASE_URL` | PostgREST base | `https://thnxknvcahqktpbpqvbg.supabase.co` |
| `SUPABASE_KEY` | service key | — |
| `S3_BUCKET_NAME` | list bucket | `datawhistl` |
| `TECH_S3_KEY` | list key | `companies/technologies/stage4_target_technologies.json` |
| `PRODUCT` | scores namespace | `cdp-selection` |
| `RULES_VERSION` | rule-set tag | `area1-v2` (CDP+MAP; `area1-v1` was CDP-only) |

## Event overrides (optional)
```json
{ "blocks": ["map"], "dry_run": true, "max_uids": 2 }
```
- **`blocks`** — which target blocks to probe. Default (omitted) = **both** (`cdp` + `map`).
  Accepts `"cdp"`, `"map"`, `"both"`/`"all"`, or a list like `["map"]`. Use this to run
  one block when the other was scored recently (e.g. CDP yesterday → run `["map"]` today).
- **`dry_run`** — do everything but the upsert.
- **`max_uids`** — probe only the first N uids (cheap smoke test).

### Partial runs merge, they don't overwrite
The fit score is **one combined count** per company (`score = |distinct CDP+MAP matched|`),
upserted on `(apollo_org_id, product, score_type)`. So a `["map"]`-only run does **not**
wipe existing CDP matches: for each company it hits, it reads the current fit row and
**preserves the other block's uids**, then unions today's fresh matches. A company with a
CDP score but no MAP hit today is left untouched. `signals.matched_blocks` (aligned with
`matched_uids`) records which block each match came from. Running **both** blocks
overwrites cleanly (nothing to preserve).

## Deploy / update
- Function: `apollo_stage_4`, runtime python3.12, handler `lambda_function.lambda_handler`,
  role `lambda-execution-role`, timeout 900s, memory 512MB, **no layers**.
- Redeploy code: `deploy.sh` (zips `lambda_function.py`, create-or-update the function).
- Reads AWS creds + env values from `../../.env`.

## Run it — `invoke.sh`
Synchronous invoker (reads AWS creds from `../../.env`, prints the JSON result):
```bash
./invoke.sh                       # full run: both blocks, live
./invoke.sh --blocks map          # MAP only (merges, preserves CDP)
./invoke.sh --blocks cdp          # CDP only
./invoke.sh --dry-run             # no upsert
./invoke.sh --blocks map --max-uids 3 --dry-run   # cheap smoke test
```

## Cadence
Weekly, like the local Stage 4. A full run probes 53 uids (33 CDP + 20 MAP); credits ≈
number of uids with any in-universe presence. Confirm scale before scheduling.
