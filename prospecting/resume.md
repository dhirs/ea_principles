# Resume — Stage 2 sweep (CDP-selection service)

Live operational state. Methodology lives in `methodology.md`; the industry universe in `stage1_output.md`.

**Confirmed query — two parts, both native Apollo:**

*Part 1 — base firmographics:* target NAICS sectors from `stage1_output.md` (11, 21, 22, 23, 31–33, 44–45, 48–49, 51, 52, 53, 54, 56, 61, 62, 71, 72) + US/Canada HQ + 201–1,000 employees + revenue $50–100M.

*Part 2 — advanced native filters:* marketing department headcount 5–20 (`master_marketing` min 5 max 20). (Technology moved to Stage 4 — weekly fit/propensity scoring.)

*Exclusions:* none. (The old 813/51/61/92 list was a leftover from the pre-sector CDP setup and conflicted with the new targets — dropped.)

**Universe size:** 3,816 companies / 39 pages (`pagination.total_entries`, measured 2026-07-16).

**Store:** raw Apollo records → Supabase table `apollo_company_raw` (one row/company: `id`, `apollo_org_id`, `payload` jsonb, `last_refresh`; upsert on `apollo_org_id`, DB trigger stamps `last_refresh`). Base account set → `apollo_company_universe` after Stage 3. Project `thnxknvcahqktpbpqvbg`.

**Credits:** paid plan, ~2,500 lead credits, cycle 2026-07-16 → 2026-08-16. No budget constraint.

**State (2026-07-16): Stage 2 DONE.** Full 16-sector sweep pulled (39 pages, 40 credits) via the Apollo MCP → `apollo_companies/2026-07-16/page-1..39.json` → loaded with `stage2_load.py` into `apollo_company_raw` (**3,816 rows**, all distinct). Pages 1–38 verbatim; page-39 (last 16 orgs) reconstructed from an inline response — Stage 2/3 fields kept, cosmetic fields (logo/twitter) dropped; re-fetchable for 1 credit. The 35 old rows in `apollo_company_universe` are from the superseded 4-code query — stale; Stage 3 will repopulate.

**Data preview for Stage 3:** 692 rows have a parent org (`owned_by_organization_id` → subsidiary drops), 86 have null domain (→ flag), avg revenue $72.3M (in-band).

**Next:** run **Stage 3** — manual SQL over `apollo_company_raw` → `apollo_company_universe` per `stage2_stage3_handoff.md` (subsidiary/junk/primary-business screens, then field-map + NAICS backfill). Free, no credits.

## Files — `apollo_companies/`

Date-partitioned Stage 2 store (`apollo_companies/<date>/`). Holds every swept company — the full superset, including flagged/dropped — as a point-in-time snapshot:

- `page-N.json` — raw Apollo captures, 100 companies/page, all fields verbatim (incl. headcount growth 6/12/24m, intent signals, `owned_by_organization`, revenue).
- `universe_all_<date>.csv` — everything-CSV: every company with `status` + `reason` + growth columns. Audit / human-review artifact.
- `insert_batch_*.sql`, `build_sql.py` — generated SQL + script that loaded the qualified subset into Supabase.

**Not the Stage 3 source.** Stage 3 re-ranks the *qualified* accounts only, which live in the Supabase `apollo_company_universe` table — not this directory. The raw JSON carries a stale snapshot of one signal (headcount growth); the other Stage 3 signals (job postings, new CMO, funding) need fresh weekly pulls.
