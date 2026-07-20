-- Stage 6 — People / Contacts: apollo_people_raw + lead_provenance
--
-- Two tables, two jobs, both mirroring existing repo conventions:
--
--  apollo_people_raw  — the raw PEOPLE sink. Mirror of apollo_company_raw: one row per
--    Apollo person, the full People-search record verbatim, upsert on apollo_person_id.
--    The durable superset — it keeps EVERYONE surfaced (incl. contacts never revealed or
--    promoted), so a promotion mistake never costs credits to re-fetch. The search payload
--    carries a LOCKED email; reveal (people_match) writes revealed_payload. A person is
--    promoted to `leads` only once a real email exists (leads PK = email).
--
--  lead_provenance    — the "WHY is this a lead / opportunity" register. Mirror of
--    apollo_intent_signals: one row per (lead, reason-type); an evidence jsonb explains it.
--    This is the field that did NOT exist before — the answer to "why did this become a
--    lead." maven_attendance is one feeder (source_type='maven_workshop'); a title match on
--    a qualified account is another (source_type='title_match_universe'). A person can carry
--    BOTH rows at once — that combination is the strongest opportunity, so neither row
--    overwrites the other (the same reason apollo_company_scores keys per score_type).
--
-- Apply: via Supabase apply_migration (project thnxknvcahqktpbpqvbg) or psql on
-- SUPABASE_DB_URL. Idempotent (create table if not exists). RLS is enabled to match every
-- other table in this schema; writers use the service-role key from .env (bypasses RLS).
-- If anon/authenticated read access is ever needed, add policies mirroring
-- apollo_company_scores.

-- 1. Raw people sink -----------------------------------------------------------
create table if not exists apollo_people_raw (
  id               bigint generated always as identity primary key,
  apollo_person_id text not null unique,
  apollo_org_id    text,                       -- employer; joins apollo_company_universe.apollo_org_id. NOT an FK — raw is a superset and may hold people at non-universe orgs.
  payload          jsonb not null,             -- People-SEARCH record, verbatim (email LOCKED / guessed).
  last_refresh     timestamptz not null default now(),
  revealed_payload jsonb,                       -- people_match record, verbatim (email + phone UNLOCKED). Null until revealed.
  last_revealed    timestamptz,                 -- when reveal last ran for this person.
  search_query     jsonb                        -- the People-search filter set that surfaced this row (per-row provenance, cf. Stage 2 breadcrumbs).
);

alter table apollo_people_raw enable row level security;

create index if not exists apollo_people_raw_org_idx
  on apollo_people_raw (apollo_org_id);

-- Write contract (search):  upsert on apollo_person_id, refresh payload + last_refresh:
--   insert into apollo_people_raw (apollo_person_id, apollo_org_id, payload, search_query, last_refresh)
--   values ($1, $2, $3, $4, now())
--   on conflict (apollo_person_id)
--   do update set payload       = excluded.payload,
--                 apollo_org_id = excluded.apollo_org_id,
--                 search_query  = excluded.search_query,
--                 last_refresh  = now();
-- Write contract (reveal):  PATCH revealed_payload + last_revealed ONLY — never overwrite
--   payload (same rule as Stage 4's enrichment bank: a merge-duplicates upsert takes the
--   insert path and trips NOT NULL payload).

-- 2. Lead provenance register --------------------------------------------------
create table if not exists lead_provenance (
  email          text        not null references leads(email) on delete cascade,
  source_type    text        not null,                        -- 'maven_workshop' | 'title_match_universe' | future
  source         text        not null,                        -- specific origin: 'workshop_list_join' | 'apollo_people_search' ...
  evidence       jsonb       not null default '{}'::jsonb,    -- explainable detail: {events[], attended} or {apollo_org_id, company, title, seniority, matched_title}
  confidence     numeric     check (confidence between 0 and 1),
  observed_at    timestamptz not null,                        -- when the reason became true: signup_date, or the search date
  source_version text        not null,                        -- rule/target-list version that produced this row (cf. rules_version)
  collected_at   timestamptz not null default now(),
  run_id         text,
  primary key (email, source_type)
);

alter table lead_provenance enable row level security;

create index if not exists lead_provenance_type_idx
  on lead_provenance (source_type);

-- Write contract:  upsert on (email, source_type) over PostgREST with
--   Prefer: resolution=merge-duplicates and on_conflict=email,source_type — overwriting the
--   latest reason of each type (NOT ignore-duplicates). One person, many reason-types, many
--   rows; multiple instances of the SAME type (e.g. two workshops) collapse into evidence.

-- 3. Backfill existing maven provenance (idempotent, re-runnable) ---------------
-- Every current lead came in via a Maven workshop, so seed maven_workshop provenance from
-- maven_attendance. Collapse each lead's attendance rows into ONE row; the individual
-- events live in evidence.events[]. This makes "why is this a lead" answerable for the whole
-- existing population the moment it runs.
insert into lead_provenance (email, source_type, source, evidence, observed_at, source_version, run_id)
select
  a.lead_email,
  'maven_workshop',
  min(a.source),
  jsonb_build_object(
    'events',        jsonb_agg(distinct a.event_id),
    'attended',      bool_or(coalesce(a.attended, false)),
    'attended_live', bool_or(coalesce(a.attended_live, false)),
    'sources',       jsonb_agg(distinct a.source)
  ),
  coalesce(min(a.signup_date)::timestamptz, min(a.created_at)),
  'maven-backfill-v1',
  'maven_backfill'
from maven_attendance a
join leads l on l.email = a.lead_email
group by a.lead_email
on conflict (email, source_type)
do update set evidence    = excluded.evidence,
              source      = excluded.source,
              observed_at = excluded.observed_at;
