-- Stage 5 — apollo_intent_signals ledger (ADR 2026-07-18-stage5-intent-scoring §3)
--
-- The source-neutral signal ledger. Every intent adaptor — Apollo or not — upserts
-- the SAME row shape here; the composite scorer (stage5_score.py) is the only reader
-- that writes apollo_company_scores. Adaptors NEVER write the scores register.
--
-- PK (apollo_org_id, signal_type): one latest row per account per signal type, so a
-- re-collect overwrites rather than accumulates. Re-weighting re-reads this ledger and
-- never re-burns credits (ADR §2).
--
-- FK to apollo_company_universe mirrors apollo_company_scores: an account dropped from
-- the universe takes its signals with it.
--
-- Apply: via Supabase apply_migration (project thnxknvcahqktpbpqvbg), or psql on
-- SUPABASE_DB_URL. Idempotent (create table if not exists).

create table if not exists apollo_intent_signals (
  apollo_org_id   text        not null references apollo_company_universe(apollo_org_id) on delete cascade,
  signal_type     text        not null,                                  -- 'bombora_surge' | future types
  source          text        not null,                                  -- 'bombora' | 'apollo' | 'internal_db' ...
  value_raw       numeric,                                               -- native magnitude — audit only
  value_norm      numeric     not null check (value_norm between 0 and 1), -- 0..1 semantic strength (adaptor's job)
  confidence      numeric     check (confidence between 0 and 1),        -- 0..1 coverage/reliability (not folded into v1 score)
  observed_at     timestamptz not null,                                  -- when the behaviour happened → drives decay
  evidence        jsonb       not null default '{}'::jsonb,              -- explainable detail (topic, strength, raw fields)
  adaptor_version text        not null,
  collected_at    timestamptz not null default now(),
  run_id          text,
  primary key (apollo_org_id, signal_type)
);

-- Scoring reads the ledger by signal_type within a lookback window on observed_at.
create index if not exists apollo_intent_signals_type_observed_idx
  on apollo_intent_signals (signal_type, observed_at);
