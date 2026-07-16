# Continuation prompt — Apollo universe build

Paste this to resume:

---

Continue my prospecting universe build. Context:

**State (as of 2026-07-03):**
- Skill `universe-builder` installed folder-scoped at `prospecting/.claude/skills/universe-builder/` (Part 1: service→top-10 NAICS with user confirmation; Part 2: Apollo search→prune→store). Read its SKILL.md and references/apollo-notes.md first.
- Confirmed query for my CDP-selection service: NAICS 333, 335, 326, 423 + US/Canada + 201–1,000 employees + excluded NAICS 813, 51, 61, 92. Total matches: 3,249. Test page hit rate 16% (revenue $50–100M band, independent companies only).
- Storage pipeline (S3 dropped) — THREE sinks, different contents:
  1. Raw JSON (local, EVERYTHING): `prospecting/apollo_companies/<date>/page-N.json`, all fields verbatim, append-only.
  2. CSV (local, EVERYTHING): `prospecting/apollo_companies/<date>/universe_all_<date>.csv` — every company incl. qualified/flagged/dropped, with `status` + `reason` columns. Human-review artifact.
  3. Supabase `apollo_company_universe` (project id thnxknvcahqktpbpqvbg) = **QUALIFIED ROWS ONLY**. Never insert flagged or dropped rows — the DB is the clean target list, not the audit trail. Each row: `raw_file` → source page, `products` jsonb → `{"cdp-selection": {"status":"qualified","reason":"...","matched_naics":"333","added":"<date>"}}`. Upsert on `apollo_org_id` with ON CONFLICT DO NOTHING.
- After each insert of qualified rows, backfill the denormalized NAICS text columns on `apollo_company_universe` from `apollo_naics` (codes are static): `matched_naics_title`, `matched_naics_sector` (from `products->'cdp-selection'->>'matched_naics'`), `naics_titles` (text[] aligned to `naics[]` via `unnest ... with ordinality`), and the 10 hierarchy columns decomposing `matched_naics` into 5 levels (`sector_code`/`sector_title`, `subsector_code`/`subsector_title`, `industry_group_code`/`industry_group_title`, `naics_industry_code`/`naics_industry_title`, `national_industry_code`/`national_industry_title` — derive each level code by prefix length, LEFT JOIN `apollo_naics` for titles). Reference table `apollo_naics` = full 2022 NAICS + 4 legacy 2017 codes; see `naics_reference/README.md`.
- DB state as of 2026-07-03: 35 qualified rows (pages 1–3, all in $50–100M band, no subsidiaries). Earlier run had wrongly inserted all 300 with status tags; the 219 non-qualified rows were deleted and the table is now qualified-only. NOTE: the skill's own SKILL.md "Deliver" step is out of date (says "write survivors to a spreadsheet", doesn't specify DB=qualified-only or the CSV sink) — follow THIS prompt's three-sink rule, not that line, until the skill file is updated via Settings > Capabilities.
- Prune rules: revenue outside $50–100M → dropped (0.0 = unknown → flagged); subsidiary (`owned_by_organization`) → flagged/dropped; missing NAICS → verify manually; foreign HQ → dropped; junk (staffing/media/directories) → dropped.
- Credits: free plan, 75/month, 3 remaining, cycle resets 2026-07-17. Full sweep needs 33 credits at 100/page.

**Pending action (awaiting credit reset 2026-07-17):** pages 1–3 done (300 fetched, 35 qualified in DB). Resume at **page 4** — run pages 4–33 (~2,949 companies, 30 credits) using the same approved filter set. Same three-sink rule: raw JSON + everything-CSV local, qualified-only → Supabase (ON CONFLICT DO NOTHING). Re-confirm the exact filter set and credit cost before spending.

**Rules — non-negotiable:**
- Confirm before EVERY credit spend with exact filter set shown; a modified/retried query needs fresh approval.
- Never use `revenue_range` filter (locked on my plan, errors).
- Show real hit rates, flag data quality problems, no summaries of what you "would" do.
- Don't touch `.env` except AWS/Supabase vars if needed; never echo values.

**Later:** people search (2–3 buyers per hot account), Layer 2 weekly signal scan (job postings, new CMO, headcount growth, funding) as re-rank of universe, Monday brief, outreach drafts. See `targeting-architecture.md`, `stage1_output.md`, `naics-target-industries.md` in this folder.
