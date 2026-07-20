# Stage 6 — BUILD (one-time runbook for Claude Code)

**Purpose:** stand up the People / Contacts pipeline from nothing. Run this **once**. After it, `stage6_people.md` is the durable contract for *running* the stage; this file is scaffolding and can be treated as done.

**You are building three things:** (1) two DB tables + a maven backfill, (2) three re-runnable scripts (`collect` → `reveal` → `promote`), (3) a verified first run. Do them in order; each step has an acceptance check — do not proceed on a red check.

## 0. Preconditions

- Repo: `prospecting/`. Secrets in `.env` (**never echo**): `APOLLO_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (or `SUPABASE_DB_URL`). Confirm the exact key names in `.env` and reuse the loader the Stage 5 scripts use (`intent_adaptors/db.py` → `load_env`, `rest`).
- Supabase project: `thnxknvcahqktpbpqvbg`.
- Read first: `stage6_people.md` (the contract), `stage6_target_titles.json` (the buyer definition), `stage4_fit.md` (the search-vs-lookup pattern you are re-using), `stage2_load.py` + `stage5_collect.py` (the script conventions to copy).
- **Confirm the Apollo People-search parameter names against the live MCP/API schema before any spend.** `apollo_mixed_people_api_search` field names (`organization_ids`, `person_seniorities`, `person_titles`, `person_department_or_subdepartments`, `contact_email_status`) must be checked, not assumed — a wrong key is accepted silently and returns nothing (same failure mode as Stage 2's department keys).

## 1. Apply the migration

Apply `stage6_migration.sql` (creates `apollo_people_raw` + `lead_provenance`, enables RLS, back-fills maven provenance). Use Supabase `apply_migration` (project `thnxknvcahqktpbpqvbg`) or `psql "$SUPABASE_DB_URL" -f stage6_migration.sql`.

**Acceptance:**
```sql
select count(*) from apollo_people_raw;                                   -- 0 (empty, ready)
select count(*) from lead_provenance where source_type='maven_workshop'; -- ~1473, one per maven lead
select count(distinct email) from lead_provenance;                       -- == the maven count
-- every provenance row points at a real lead (FK guarantees it, but confirm 0 orphans):
select count(*) from lead_provenance p
  where not exists (select 1 from leads l where l.email = p.email);       -- 0
```
If the maven count is materially below the number of distinct `maven_attendance.lead_email`, investigate before continuing — a lead row may be missing for an attendance email.

## 2. `stage6_collect.py` — search & bank people (mirror `stage2_load.py` + `stage5_collect.py`)

Reads `apollo_org_id`s from `apollo_company_universe`, runs Apollo People Search in batches, writes page captures **and** upserts `apollo_people_raw`. Reads keys from `.env`. Flags: `--dry-run` (fetch+normalise, no writes/credits beyond the probe), `--limit N` (sample N accounts), `--date <YYYY-MM-DD>`.

Logic:
1. `SELECT apollo_org_id FROM apollo_company_universe` (optionally `--limit`).
2. Batch org ids (~100/req). For each batch, POST People Search with the filters from `stage6_target_titles.json` (`person_seniorities`, `person_titles`, `person_department_or_subdepartments`, `contact_email_status`), `per_page:100`, paginate.
3. **Probe cost first** — `per_page:1` on batch 1 to read `pagination.total_entries`; print the projected page count/credits and the per-account yield **before** the full sweep.
4. Save each page → `apollo_people/<date>/page-N.json`; save the applied `breadcrumbs` → `apollo_people/<date>/breadcrumbs.json`.
5. Upsert each person → `apollo_people_raw` on `apollo_person_id` (batch 100) with `Prefer: resolution=merge-duplicates,return=minimal`, `on_conflict=apollo_person_id`. Set `apollo_org_id`, `payload` (the person row verbatim), `search_query` (the filter set), `last_refresh=now()`.

**Acceptance:** `select count(*), count(distinct apollo_org_id) from apollo_people_raw;` — non-zero, and every `apollo_org_id` is in the universe:
```sql
select count(*) from apollo_people_raw r
  where r.apollo_org_id is not null
    and not exists (select 1 from apollo_company_universe u where u.apollo_org_id = r.apollo_org_id); -- 0
```

## 3. `stage6_reveal.py` — select, cap, unlock (credits)

Selects contacts per `_reveal_policy`, reveals them, PATCHes `revealed_payload`. **This is the credit step — gate it.**

Logic:
1. Pull unrevealed `apollo_people_raw` rows (`revealed_payload is null`), group by `apollo_org_id`.
2. Rank each group by `_reveal_policy.seniority_priority`; keep top `max_contacts_per_company` (default 3). Log the count dropped per account.
3. **Print total contacts to reveal and projected credits; require an explicit `--confirm` flag to spend.** No `--confirm` → dry-run that only prints the plan.
4. Reveal via `apollo_people_match` / `bulk_match` (batch).
5. **PATCH** `apollo_people_raw` (`revealed_payload`, `last_revealed=now()`) on `apollo_person_id` — never touch `payload`. Rows returning `email_status='unavailable'` / no email: leave `revealed_payload` recording the miss, do not promote.

**Acceptance:** `select count(*) filter (where revealed_payload is not null) as revealed, count(*) filter (where last_revealed is not null) as stamped from apollo_people_raw;` — matches the confirmed reveal count; `payload` is unchanged (spot-check one row's `payload` still equals its pre-reveal search record).

## 4. `stage6_promote.py` — leads + provenance

Promotes revealed contacts with a real email into `leads`, then writes `title_match_universe` provenance. Reads `stage6_target_titles.json._version` for `source_version`.

Logic:
1. Pull `apollo_people_raw` rows with a revealed email not yet in `leads`.
2. Build each `leads` row per the *Step 4* field map in `stage6_people.md` — the full person object under `data.apollo`, plus `data.{email,first_name,last_name,company,source='apollo_people_search',signup_date}`, and `fname/lname/domain`. Upsert on `email` (choose `merge-duplicates` vs `ignore-duplicates` deliberately — see the doc; default `ignore-duplicates` to protect richer maven rows, log the choice).
3. For each promoted lead, upsert `lead_provenance` on `(email, source_type)` with `Prefer: resolution=merge-duplicates`, `on_conflict=email,source_type`: `source_type='title_match_universe'`, `source='apollo_people_search'`, `evidence={apollo_org_id, company, title, seniority, matched_title}`, `observed_at=<search date>`, `source_version=<titles _version>`, `run_id`.

**Acceptance:**
```sql
-- new leads now link to the universe (was 0 before Stage 6):
select count(*) from leads l
  where (l.data->'apollo'->>'organization_id') in (select apollo_org_id from apollo_company_universe);   -- > 0
-- every title_match provenance points at a real lead and a real org:
select count(*) from lead_provenance p
  where p.source_type='title_match_universe'
    and (not exists (select 1 from leads l where l.email=p.email)
      or (p.evidence->>'apollo_org_id') not in (select apollo_org_id from apollo_company_universe));       -- 0
-- the dual-reason leads (workshop AND title match) — your hottest opportunities:
select count(*) from (
  select email from lead_provenance group by email having count(distinct source_type) > 1
) x;
```

## 5. Record state

Append a dated entry to `README.md` (see its format): universe accounts searched, people banked, contacts revealed vs unavailable, leads promoted, credits spent, and the dual-reason count. Note any account where the per-company cap dropped contacts. Flag any page reconstructed rather than captured verbatim.

## Guardrails (repo conventions — do not violate)

- **Raw is the durable superset** — never delete from `apollo_people_raw` to fix a promotion mistake; re-run promote instead.
- **Reveal is the only expensive call** — search and DB work are cheap; always confirm reveal cost before `--confirm`.
- **PATCH revealed_payload, never overwrite payload** (NOT NULL trip — the Stage 4 enrichment-bank bug).
- **Provenance is per reason-type** — never collapse `maven_workshop` and `title_match_universe` into one row; that erases the dual-reason signal.
- **Verify Apollo field names live before spending** — an unrecognised filter key returns nothing silently.
- **Idempotent everything** — every script re-runnable; `create ... if not exists`, upserts, `--dry-run` defaults on the spend step.
