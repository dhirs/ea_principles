# Prospecting — CDP-selection service

**START HERE.** This is both the entry point to `prospecting/` and the live operational state — the only source of truth for *what has actually happened*. Every other doc here is written as work-to-do and says nothing about whether it ran.

**Where everything is:**

| Need | File |
|---|---|
| What the stages do, and why | `methodology.md` (concept only) |
| How to run a stage | `stage1_requirements.md` → `stage2_acquire.md` → `stage3_qualify.md` → `stage4_fit.md` → `stage5_intent.md` |
| The ICP inputs (sectors + firmographics) | `stage1_output.md` |
| Raw sweep archive | `apollo_companies/<date>/page-N.json` |
| NAICS reference table build | `naics_reference/README.md` |
| Secrets (Apollo + Supabase keys) — **never echo** | `.env` |

**Data:** Supabase project `thnxknvcahqktpbpqvbg` — `apollo_company_raw` (superset, 3,816) → `apollo_company_universe` (qualified, 3,029) + static `apollo_naics` reference.

**Confirmed query — two parts, both native Apollo:**

*Part 1 — base firmographics:* target NAICS sectors from `stage1_output.md` (11, 21, 22, 23, 31–33, 44–45, 48–49, 51, 52, 53, 54, 56, 61, 62, 71, 72) + US/Canada HQ + 201–1,000 employees + revenue $50–100M.

*Part 2 — advanced native filters:* marketing department headcount 5–20 (`master_marketing` min 5 max 20). (Technology moved to Stage 4 — weekly fit/propensity scoring.)

*Exclusions:* none. (The old 813/51/61/92 list was a leftover from the pre-sector CDP setup and conflicted with the new targets — dropped.)

**Universe size:** 3,816 companies / 39 pages (`pagination.total_entries`, measured 2026-07-16).

**US/Canada filter — VERIFIED 2026-07-17 (2 credits).** Apollo's company-search returns *no location fields*, so no stored row proves its own HQ country; the check is done at the query level instead. Re-running the documented query returned **3,815** (vs 3,816 recorded — one day's drift); dropping `organization_locations` returned **7,948**. The filter more than halves the set, so it was demonstrably active during the sweep. Two further confirmations: the response's **`breadcrumbs`** array echoes every applied filter back (incl. "Company Locations: United States / Canada"), and the unfiltered control's top hit was Computrabajo (LatAm job board, UK phone) — absent from our set.
- **`breadcrumbs` is the audit trail we were missing.** The saved `page-*.json` files hold only `pagination` + `organizations`, so the snapshot does *not* record what was queried. Any future sweep should persist `breadcrumbs` alongside the pages.

**Store:** raw Apollo records → Supabase table `apollo_company_raw` (one row/company: `id`, `apollo_org_id`, `payload` jsonb, `last_refresh`; upsert on `apollo_org_id`, DB trigger stamps `last_refresh`). Base account set → `apollo_company_universe` after Stage 3. Project `thnxknvcahqktpbpqvbg`.

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

**State (2026-07-17): agencies pruned — universe now 3,029 → 2,996.** Decision: *agencies are not targets.* The 49 pending rows split three ways, so the delete was scoped, not blanket:
- **33 true agencies dropped** — advertising/PR/experiential/promo (Publicis Hawkeye, TANK Worldwide, BIMM, Boathouse, Harrison/Star, MONO, SalesHive, EWI Worldwide, Cornerstone Government Affairs …), all NAICS `5418x`.
- **3 kept — SaaS misfiled under Advertising Agencies by Apollo:** Sendoso (gifting platform), NextRoll (AdRoll/RollWorks adtech), Lob (direct-mail API). Software companies with their own customer data; the NAICS code is wrong, not the account. Reason field records the review.
- **13 still pending — media/entertainment production (NAICS `5121x`), not agencies:** VFX/animation studios (Rodeo FX, Zoic, Psyop, SMUGGLER), game studios (That's No Moon, Vigor), a cinema chain (GQT Movies). The agency decision does not cover these; they need their own call. Find with `products->'cdp-selection'->>'reason' like 'media/entertainment%'`.

**Open items from Stage 3:**
- **13 media/entertainment production rows pending review** — see above. Studios serving other studios are arguably B2B service firms (out of scope), while the cinema chain and game studios are consumer brands with real customer data (arguably prime targets). Decide per sub-type, not per NAICS code.
- **11 rows have a null `matched_naics_title`** — legacy *2017* NAICS codes Apollo still returns that are absent from `apollo_naics` (511210 Software Publishers → 2022's 513210; 442110 Furniture Stores → 449110; 443142, 446110, 441310, 451110, 453910, 448310). Sector is 100% backfilled; 32 rows lack subsector/industry-group titles for the same reason. Fix by adding the 2017 codes to `apollo_naics` (its comment says `naics_year=2017` marks exactly this case).
- **`hq_location` and `employee_range` are not real data.** Apollo's company-search response carries no location or headcount fields (verified: payload keys are id/name/domain/revenue/naics/growth/phone/urls only). `employee_range` is hardcoded to the query bucket `'201-1000'`; `hq_location` is null. Populating either needs a per-org enrich call (~1 credit each) — see the TODO comment on the `hq_location` column.
- **Gotcha for any future NAICS backfill:** sector codes in `apollo_naics` are *ranges* (`31-33`, `44-45`, `48-49`), so `left(code,2)` does NOT join for manufacturing/retail/transport — 619 rows silently missed sector on the first pass. Use `apollo_naics.sector_code`/`sector_title` from the matched row instead of deriving by prefix.

**Next:** **Stage 4** — weekly fit/propensity scoring over the 3,029 qualified accounts (`stage4_fit.md`); technology filters live here, not Stage 2. Writes `propensity_score` / `propensity_scored_at` back to `apollo_company_universe`.

## Files — `apollo_companies/`

Date-partitioned Stage 2 store (`apollo_companies/<date>/`). Holds every swept company — the full superset, including flagged/dropped — as a point-in-time snapshot:

- `page-N.json` — raw Apollo captures, 100 companies/page, all fields verbatim (incl. headcount growth 6/12/24m, intent signals, `owned_by_organization`, revenue).
- `universe_all_<date>.csv` — everything-CSV: every company with `status` + `reason` + growth columns. Audit / human-review artifact.
- `insert_batch_*.sql`, `build_sql.py` — generated SQL + script that loaded the qualified subset into Supabase.

**Not the Stage 3 source.** Stage 3 re-ranks the *qualified* accounts only, which live in the Supabase `apollo_company_universe` table — not this directory. The raw JSON carries a stale snapshot of one signal (headcount growth); the other Stage 3 signals (job postings, new CMO, funding) need fresh weekly pulls.
