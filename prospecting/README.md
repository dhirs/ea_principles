# Prospecting — CDP-selection service

**START HERE.** This is both the entry point to `prospecting/` and the live operational state — the only source of truth for *what has actually happened*. Every other doc here is written as work-to-do and says nothing about whether it ran.

**Where everything is:**

| Need | File |
|---|---|
| What the stages do, and why | `methodology.md` (concept only) |
| How to run a stage | `stage1_requirements.md` → `stage2_acquire.md` → `stage3_qualify.md` → `stage4_fit.md` → `stage5_intent.md` |
| The ICP inputs (sectors + firmographics) | `stage1_output.md` |
| Why a choice was made (dated decision records) | `adr/<date>-<topic>.md` |
| Raw sweep archive | `apollo_companies/<date>/page-N.json` |
| NAICS reference table build | `naics_reference/README.md` |
| Secrets (Apollo + Supabase keys) — **never echo** | `.env` |

**Data:** Supabase project `thnxknvcahqktpbpqvbg` — `apollo_company_raw` (superset, 3,816) → `apollo_company_universe` (**2,983 live targets**) → `apollo_company_scores` (1,425 Stage 4 `fit` scores [CDP + MAP]; Stage 5 `intent` empty pending Apollo surge refresh) + `apollo_intent_signals` (Stage 5 ledger, empty) + static `apollo_naics` reference.

**Confirmed query — two parts, both native Apollo:**

*Part 1 — base firmographics:* target NAICS sectors from `stage1_output.md` (11, 21, 22, 23, 31–33, 44–45, 48–49, 51, 52, 53, 54, 56, 61, 62, 71, 72) + US/Canada HQ + 201–1,000 employees + revenue $50–100M.

*Part 2 — advanced native filters:* marketing department headcount 5–20 (`master_marketing` min 5 max 20). (Technology moved to Stage 4 — weekly fit/propensity scoring.)

*Exclusions:* none. (The old 813/51/61/92 list was a leftover from the pre-sector CDP setup and conflicted with the new targets — dropped.)

**Universe size:** 3,816 companies / 39 pages (`pagination.total_entries`, measured 2026-07-16).

**US/Canada filter — VERIFIED 2026-07-17 (2 credits).** Apollo's company-search returns *no location fields*, so no stored row proves its own HQ country; the check is done at the query level instead. Re-running the documented query returned **3,815** (vs 3,816 recorded — one day's drift); dropping `organization_locations` returned **7,948**. The filter more than halves the set, so it was demonstrably active during the sweep. Two further confirmations: the response's **`breadcrumbs`** array echoes every applied filter back (incl. "Company Locations: United States / Canada"), and the unfiltered control's top hit was Computrabajo (LatAm job board, UK phone) — absent from our set.
- **`breadcrumbs` is the audit trail we were missing.** The saved `page-*.json` files hold only `pagination` + `organizations`, so the snapshot does *not* record what was queried. Any future sweep should persist `breadcrumbs` alongside the pages.

**Store:** raw Apollo records → Supabase table `apollo_company_raw` (one row/company: `id`, `apollo_org_id`, `payload` jsonb [thin Stage 2 search row], `last_refresh`; **+ Stage 4 columns added 2026-07-17:** `enriched_payload` jsonb [full enrich record], `last_enriched` timestamptz, `enrichment_query` jsonb [discover filters that surfaced the row]; upsert on `apollo_org_id`). Base account set → `apollo_company_universe` after Stage 3. Project `thnxknvcahqktpbpqvbg`.

**Credits:** paid plan, ~2,500 lead credits, cycle 2026-07-16 → 2026-08-16. No budget constraint.

**State (2026-07-16): Stage 2 DONE.** Full 16-sector sweep pulled (39 pages, 40 credits) via the Apollo MCP → `apollo_companies/2026-07-16/page-1..39.json` → loaded with `stage2_load.py` into `apollo_company_raw` (**3,816 rows**, all distinct). Pages 1–38 verbatim; page-39 (last 16 orgs) reconstructed from an inline response — Stage 2/3 fields kept, cosmetic fields (logo/twitter) dropped; re-fetchable for 1 credit.

**State (2026-07-17): Stage 3 DONE.** The 35 stale rows from the superseded 4-code query were deleted, then `apollo_company_raw` (3,816) was screened into `apollo_company_universe` (**3,029 qualified**, all distinct, 0 orphans, 0 out-of-band). Pure SQL, no credits. Attrition:

| Screen | Rows | Disposition |
|---|---|---|
| Subsidiary (`owned_by_organization_id` non-null) | 692 | dropped |
| Null `primary_domain` | 54 | dropped (flag) |
| Junk — staffing (NAICS 5613) | 39 | dropped |
| Brand-giant, null parent — Toshiba America Electronic Components ($79M) | 1 | dropped (flag) |
| Revenue out of band — Zegin ($16M) | 1 | dropped (flag) |
| **Qualified** | **3,029** | inserted |

Every raw row carried ≥1 in-target-sector NAICS code, so the missing/ambiguous-NAICS screen caught nothing. Brand-giant name screen also hit *Sharp Decisions* and *Kellogg Community College* — both false positives, kept.

**State (2026-07-17): agency + media prune DONE — universe 3,029 → 2,983.** Decisions: *agencies are not targets*, and *media/entertainment production is not either*. The 49-row pending bucket resolved three ways — **nothing is left pending review.**
- **33 true agencies dropped** — advertising/PR/experiential/promo (Publicis Hawkeye, TANK Worldwide, BIMM, Boathouse, Harrison/Star, MONO, SalesHive, EWI Worldwide, Cornerstone Government Affairs …), all NAICS `5418x`.
- **13 media/entertainment production dropped** (NAICS `5121x`) — VFX/animation studios (Rodeo FX, Zoic, Psyop, SMUGGLER), game studios (That's No Moon, Vigor), a cinema chain (GQT Movies).
- **3 kept — SaaS misfiled under Advertising Agencies by Apollo:** Sendoso (gifting platform), NextRoll (AdRoll/RollWorks adtech), Lob (direct-mail API). Software companies with their own customer data; the NAICS code is wrong, not the account. Their `reason` field records the review.

All 46 remain in `apollo_company_raw`, so any of this is reversible by re-running Stage 3 — no credits.
- **11 rows have a null `matched_naics_title`** — legacy *2017* NAICS codes Apollo still returns that are absent from `apollo_naics` (511210 Software Publishers → 2022's 513210; 442110 Furniture Stores → 449110; 443142, 446110, 441310, 451110, 453910, 448310). Sector is 100% backfilled; 32 rows lack subsector/industry-group titles for the same reason. Fix by adding the 2017 codes to `apollo_naics` (its comment says `naics_year=2017` marks exactly this case).
- **`hq_location` and `employee_range` are not real data.** Apollo's company-search response carries no location or headcount fields (verified: payload keys are id/name/domain/revenue/naics/growth/phone/urls only). `employee_range` is hardcoded to the query bucket `'201-1000'`; `hq_location` is null. Populating either needs a per-org enrich call (~1 credit each) — see the TODO comment on the `hq_location` column.
- **Gotcha for any future NAICS backfill:** sector codes in `apollo_naics` are *ranges* (`31-33`, `44-45`, `48-49`), so `left(code,2)` does NOT join for manufacturing/retail/transport — 619 rows silently missed sector on the first pass. Use `apollo_naics.sector_code`/`sector_title` from the matched row instead of deriving by prefix.

**State (2026-07-17): scores table CREATED — `apollo_company_scores`, empty, ready for Stage 4.** Scores live in their own table, **not** as columns on `apollo_company_universe`: one row per **account + product + score_type** (`id`, `apollo_org_id` FK, `product`, `score_type`, `score`, `signals` jsonb, `rules_version`, `scored_at`; unique on the triple). Why, in short — a score is only meaningful per service (same namespacing as `universe.products`); Stages 4 and 5 run on different cadences and must not share a row; and a score without its `signals` + `rules_version` can't be reviewed or explained when it moves. Rationale in `methodology.md` (*Where scores live*), DDL + write contract in `stage4_fit.md` (*Output*). Current-state by design — **no history/trend rows**; each run overwrites its own row.
- **Verified on creation** (test rows inserted then deleted, table now empty): upsert overwrites rather than duplicating; `fit` + `intent` coexist on one account; FK rejects an unknown org id; check rejects score 150.
- **Writer must use `Prefer: resolution=merge-duplicates`** with `on_conflict=apollo_org_id,product,score_type` — *not* the `ignore-duplicates` convention used for leads. Overwriting is the point; ignore-duplicates would pin the first score forever.

**State (2026-07-17): Stage 4 fit method REDESIGNED — technology-name match + discover→enrich→cache. Not yet run.** The original plan (score on Apollo's technology *category*) was **reversed** after pulling Apollo's real taxonomy (`supported_technologies.csv`, 10,514 technologies × 80 categories): there is **no "Customer Data Platform" category**, CDPs scatter across 8 unrelated categories (Segment→Data Management Platform, mParticle→Other, "Salesforce Customer Data Platform (CDP)"→CRM), and "Data Management Platform" is a junk drawer (real CDPs + Snowflake + OneTrust + Acxiom). So Area 1 now matches on **individual technology name/uid**, never category. Reasoning: `adr/2026-07-17-stage4-technology-category.md` (revised, Accepted).
- **Target set — `stage4_target_technologies.json`.** 33 CDP names (this ICP wants *any* CDP) + 20 MAP, each validated verbatim against the CSV. The 33 CDP names were curated by me from the CSV and **accepted by Dheeraj as-is** (incl. borderline: Hightouch, Snowplow, Optimove, Netcore Cloud, Cooladata, Sitecore Engagement Cloud, Adobe Experience Platform). **MAP curated 2026-07-18 to 20 named platforms** — Brevo, Mailchimp, Pardot + the major MAPs (HubSpot, Marketo, Eloqua, SFMC, ActiveCampaign, Braze, Iterable, Keap, Klaviyo, Customer.IO, Emarsys, Dotdigital, Drip, Omnisend, SharpSpring, SALESmanago, Sailthru) — down from the 466-entry "Marketing Automation" category dump; all 20 uids verified live (Act-On dropped, uid unresolved).
- **uid rule established — 1 credit, adobe.com probe.** Apollo's technology `uid` = display-name slugified (`Adobe Marketo Engage`→`adobe_marketo_engage`), so the search filter is *generated* from the CSV, not guessed. ~93% clean; punctuation cases hand-fixed. All 33 CDP uids resolved; **18 obscure long-tail MAP uids** still flagged `uids_needs_review`.
- **Method — SUPERSEDED at run time.** This entry proposed *discover → enrich → count tools in `technology_names`*. That failed: enrichment returns **no technographics on this plan**, so scoring moved to per-uid search probes. See the **RUN** entry below and `stage4_fit.md` → *CRITICAL* for the corrected flow.
- **Executed 2026-07-17** — see the RUN entry below (167 scores, ~29 credits).
- **Open thread:** MAP not yet probed — the 20 curated MAP uids sit in `stage4_target_technologies.json` but only the 33 CDP uids have been run. See the 2026-07-18 redefinition entry below.

**State (2026-07-17): Stage 4 Area 1 RUN — 167 CDP fit scores written. ~29 credits.** The discover→enrich→score plan **broke on contact** and was re-engineered mid-run; the method doc (`stage4_fit.md`) now reflects what actually works. What happened:
- **Discover (4 credits):** the OR query (33 CDP uids + Stage 2 firmographics) → **216 companies** run at least one CDP. Pages banked in `apollo_companies/2026-07-17-cdp/` (page-3 reconstructed from an inline response — Stage 2/3 fields kept, cosmetics dropped, re-fetchable for 1 credit). Intersect with `apollo_company_universe`: **167 in-universe** (Stage-3 qualified), 48 already-rejected, 1 brand-new — only the 167 are scorable (scores FK).
- **THE BLOCKER — enrichment carries no technographics on this plan.** Enriched a 10-company test batch (10 credits) and the payloads had **no `technology_names`, no `current_technologies`** — the field the whole "enrich→count tools" plan depended on simply isn't returned. Verified across all 10. So enrichment **cannot score technology** here.
- **The fix — attribute by per-uid search probe (~15 credits).** Only the *search* filter can prove a technology, so ran the search **once per CDP uid** (`stage4_uid_probe.py`, reads `APOLLO_API_KEY` from `.env`). **13 of 33 uids have any presence** in this ICP (Lytics 94, Segment 72, Snowplow 20, Twilio Segment 19, Salesforce CDP 15, Tealium 9, Adobe RT-CDP 7, Adobe Experience Platform 6, Exponea/Hightouch/RudderStack 3, Blueshift 2, Blueconic 1); the other 20 return 0. The 13 reconcile exactly to the 216 OR-query total.
- **Score (0 credits, `stage4_score.py`):** `score = count of distinct CDPs the company runs`. Of 167: **139 run 1 CDP, 27 run 2, 1 runs 5.** Each row carries `signals={matched_uids, matched_names, method:"search_probe"}`, `rules_version='area1-v1'`. The other 2,816 universe rows are **scoreless by design** (no enrichment = no positive evidence to store a 0 against).
- **Enrichment banked for later (`stage4_bank_enrichment.py`):** 9 of the 10 test records written to `apollo_company_raw.enriched_payload` (+`last_enriched`,`enrichment_query`); `payload` untouched. The 10th skipped — **domain drift**: Apollo resolved `ag.state.mn.us` to a different entity (`state.mn.us`), an id not in our set. These 9 carry real headcount/dept-size/funding — banked for the then-planned areas 2/3, **dropped 2026-07-18** (see the redefinition entry below), so this data is now vestigial. **No technographics.**
- **Two bugs caught before they shipped:** (1) `cdp.uids_confident` and `cdp.names` in the JSON are **not** positionally aligned — a `zip()` mislabelled every score (Segment→"Lytics"); fixed via the file's slug rule. (2) enrichment bank must **PATCH not upsert** — a merge-duplicates upsert takes the insert path and trips `NOT NULL payload`.
- **Scripts added:** `stage4_uid_probe.py`, `stage4_score.py`, `stage4_bank_enrichment.py` — all read keys from `.env`, all re-runnable.

**State (2026-07-18): Stage 4 now runs on LAMBDA + MAP scored.** The scoring moved from the local `stageX_*.py` scripts to the **`apollo_stage_4`** Lambda (`prospecting/lambda/stage4/` — `lambda_function.py`, `deploy.sh`, `README.md`). It reads the target list from **S3** (`s3://datawhistl/companies/technologies/stage4_target_technologies.json`, synced by `stage4_upload_technologies.py`), probes Apollo, intersects the universe, and upserts `fit` scores — same logic as the scripts, one handler, **no Lambda layer** (stdlib `urllib` + preinstalled `boto3`; reuses the `lambda-execution-role`). Selectable blocks via the event: `{}` = both, `{"blocks":["map"]}` / `["cdp"]` = one; **partial runs merge, not overwrite** (a map-only run preserves existing CDP matches — the fit row is one combined count). The local scripts remain as the dev origin.
- **MAP RUN 2026-07-18 (38 credits).** Ran `{"blocks":["map"]}` over the 20 curated MAP uids: **1,362** universe companies scored on MAP, **104** merged with their existing CDP rows, **1,258** new MAP-only. Fit rows **167 → 1,425**. All 167 CDP scores intact (verified: 104 merged to `area1-v2`, 63 untouched at `area1-v1`). Max score = 10 distinct techs. The CRM Apollo-Technologies filter reflects MAP within ~5 min (view over these rows).

**State (2026-07-18): Stage 4 REDEFINED — Area 1 (technology) only.** The five-area fit model is **dropped, not deferred**: technology is treated as a strong-enough proxy for the other dimensions (an account that runs a CDP/MAP has shown the need, means and capability). So the fit score = the technology match, full stop. `adr/2026-07-17-stage4-fit-areas.md` is **Superseded**; `stage4_fit.md` rewritten to Area 1 only; the enrichment / People-search / non-Apollo paths and the `enriched_payload` banking are out (columns + `stage4_bank_enrichment.py` now vestigial). Rationale in `stage4_fit.md` → *Scope*.

**Next:** the one remaining Stage-4 task is to **score the MAP set** the same way as CDP — probe the 20 MAP uids in `stage4_target_technologies.json` (only CDP has been run), intersect with the universe, extend the count. Then Stage 5 intent. Reminder: `apollo_company_scores.score` is constrained 0–100 — the technology count (small integers) fits comfortably.

> **The Supabase UI caps display at 1,000 rows** (PostgREST `max-rows`). Seeing "1000" in the table editor is a *pagination limit*, not the row count — always confirm with `select count(*)`.

## Files — `apollo_companies/`

Date-partitioned Stage 2 store (`apollo_companies/<date>/`). Holds every swept company — the full superset, including flagged/dropped — as a point-in-time snapshot:

- `page-N.json` — raw Apollo captures, 100 companies/page, all fields verbatim (incl. headcount growth 6/12/24m, intent signals, `owned_by_organization`, revenue).
- `universe_all_<date>.csv` — everything-CSV: every company with `status` + `reason` + growth columns. Audit / human-review artifact.
- `insert_batch_*.sql`, `build_sql.py` — generated SQL + script that loaded the qualified subset into Supabase.

**Not the Stage 3 source.** Stage 3 re-ranks the *qualified* accounts only, which live in the Supabase `apollo_company_universe` table — not this directory. The raw JSON carries a stale snapshot of one signal (headcount growth); the other Stage 3 signals (job postings, new CMO, funding) need fresh weekly pulls.
