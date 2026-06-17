-- leads table: one row per contact, keyed by email.
-- The full leads.json record is stored verbatim in `data` (JSONB);
-- email / fname / lname / domain are denormalised out for cheap querying.
-- Paste into the Supabase dashboard SQL editor once.

create table if not exists public.leads (
  email      text primary key,
  fname      text,
  lname      text,
  domain     text,
  data       jsonb       not null,
  updated_at timestamptz not null default now()
);

create index if not exists leads_domain_idx on public.leads (domain);
create index if not exists leads_data_gin   on public.leads using gin (data);
