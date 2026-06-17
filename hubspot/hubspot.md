# HubSpot — how we push records

How contact records get into our HubSpot account (`datawhistl.com`, account `243427883`).
All scripts live in `hubspot/` and talk to the HubSpot CRM v3 REST API directly with `fetch`.

## Auth
- Every script reads `HUBSPOT_TOKEN` from the repo-root **`.env`** (`/Users/ULTRA7/backup/codebase/ai_principles_server/.env`).
- It is a HubSpot **private-app access token** (`pat-...`) with `contacts.read` / `contacts.write` scope.
- `.env` is gitignored — never commit it. The canonical copy of the token also lives in the
  `maven-webhook-capture` Lambda config (`aws lambda get-function-configuration
  --function-name maven-webhook-capture --region ap-south-1`), per `GATEWAY.md`.
- If `.env` is missing/empty the scripts fail with `ENOENT` — repopulate it before running.

## Core mechanism: upsert by email
Records are **upserted by `email`**, so re-running never creates duplicates:

- Endpoint: `POST https://api.hubapi.com/crm/v3/objects/contacts/batch/upsert`
- Body: `{ inputs: [ { idProperty: "email", id: <email>, properties: {...} }, ... ] }`
- Batches of **100** inputs per request (the API max).
- Each batch is **atomic** — one bad row (e.g. invalid email) 400s the whole batch.
  The script catches that, then retries the batch **row-by-row** so good rows still land
  and only the truly bad ones are reported as failures.

## Bulk sign-up import — `hubspot/import_maven_signups.mjs`
Primary path for importing a list of sign-ups (e.g. `hs.csv`).

```bash
node hubspot/import_maven_signups.mjs <path-to-csv>
```

Input file columns (header row auto-detected and skipped):

```
Name,Email,Date Added,Source
```

Field mapping:

| Source column | HubSpot property |
|---|---|
| `Email` | `email` (upsert key, lowercased) |
| `Name` → first token | `firstname` |
| `Name` → remaining tokens | `lastname` |
| `Source` | `maven_event` |
| `"<Date Added>  <Source>"` | `maven_activity_log` (history line) |
| (constant) | `maven_interest = ai_enterprise_architecture` |
| (constant) | `maven_contact_type = student` |

Behavior:
- Dedupes by lowercased email before sending (last occurrence wins).
- Skips rows whose email fails `^[^@\s]+@[^@\s]+\.[^@\s]+$` and reports them.
- Prints a summary: `created`, `updated`, `failed`, `skipped`, plus the reason for each failure.
- **Idempotent** — fix bad rows in the CSV and re-run; existing contacts are just updated.

### Known limitation
The CSV is split on `,` naively, so **quoted names containing commas**
(e.g. `"Olya Kollen, PMP, PhD"`) misalign and get skipped. Fix by removing the
inner commas in the `Name` column, or pre-clean the CSV, then re-run.

## Other scripts in `hubspot/`
- `list_contacts.mjs` — read-only; paginates all contacts and prints `id / email / name`. Use to verify an import.
- `add_sample_contacts.mjs` — seed a few test contacts.
- `delete_all_contacts.mjs` — **destructive**; wipes contacts. Use only in a throwaway account.
- `import_companies.mjs` / `fix_duplicate_companies.mjs` — company-object import + dedupe (same auth/upsert pattern).

## Verifying an import
```bash
node hubspot/list_contacts.mjs | head
```
Or search in the app: `https://app.hubspot.com/contacts/243427883`.

---

# Lead enrichment & segmentation pipeline

Context for the work that turns the raw Maven sign-up list into a segmented, enriched lead base.
HubSpot is one possible destination, but the current plan favours **MailerLite** for outbound (see below);
HubSpot remains the CRM-of-record via the upsert scripts above.

## The files (all in `hubspot/`)
- `hs.csv` — the raw Maven export. Columns `Name,Email,Date Added,Source`. **`Name` is almost always blank**
  (Maven only captures a name if the person typed it), so names must be derived. ~1,211 leads, mostly the
  "Lightning Lesson live sign-up" source.
- `leads_enriched.csv` / `leads_enriched.xlsx` — first pass: names parsed from the email local-part, company
  derived from the email **domain**. A `Confidence` column flags name-guess quality (high/medium/low/given).
- `leads_enriched_apollo.xlsx` — the Apollo-matched subset, flat view (Title, Segment, Company, Industry,
  Employees, Location, LinkedIn, Headline), segment-coloured.
- `leads.json` — **the master**, all 1,211 records. Shape: root `{ email, first_name, last_name, company }`
  + an `apollo` node holding the full Apollo match object (33 person fields + a 42-field `organization` node
  + `employment_history`), or `apollo: null` when unmatched. This is the JSONB-ready shape for Supabase.

## Step 1 — derive names & company from the email (free, local)
- **Name**: parse the local-part — `john.smith@…` → John / Smith. Handles (`thegreatcell`, `aravindk102`)
  are low-confidence; flagged, not trusted.
- **Company**: from the **domain only**, and only for corporate domains. `@myalfred.com` → Myalfred.
  **Personal domains (gmail/yahoo/outlook/icloud/proton…) yield NO company** — there is nothing in the
  address to derive, so company is left blank. Do not fabricate it.
- Of 1,211 leads: ~**140 corporate** (company derivable), ~**1,071 gmail/personal** (blank).

## Step 2 — enrich via Apollo MCP (job title, seniority, org data)
Person-level data (title, seniority, company size, LinkedIn, etc.) is **not** in the email — it needs an
enrichment provider. We use the **Apollo.io MCP** (connector UUID `fc98e82c-2130-4932-bd95-935f9ffe8534`).

- Tool: `apollo_people_bulk_match` — **max 10 people per call**, key by `email` (best match signal).
- **Credits**: 1 credit per *match*, 0 for misses. Free tier = **75 lead credits / cycle** (resets monthly;
  current cycle ends 2026-07-17). Check balance with `apollo_usage_stats_credit_usage_stats`.
- The tool **persists large results to files** (token-limit overflow). They land in the session's
  `.claude/projects/.../tool-results/*.json|.txt`. Parse those files — the full payload is there even when
  the chat preview is truncated. Each match carries an `email` field, so re-key matches back to leads by email.
- **Match rate ~50%**: of 135 enrichable corporate leads queried, **65 matched** (~66 credits spent). Misses
  are mostly solo/vanity domains (`brian.codes`, `danaem.com`) and universities Apollo doesn't index as employers.
- **Don't waste credits on gmail handles** — personal emails match poorly and are low-value.

### Fields Apollo returns (kept whole in `leads.json` → `apollo`)
Person: name parts, `title`, `headline`, `seniority`, `departments`, `functions`, full address, `email`,
`email_status`, social URLs, `employment_history`. Organization: `industry`, `estimated_num_employees`,
`organization_revenue`, `founded_year`, headcount growth (6/12/24-mo), domain, SIC/NAICS, `keywords`, etc.

## Step 3 — segmentation
**Do NOT trust Apollo's `seniority` field** — it misclassifies often (it tagged "Enterprise Digital &
Automation Transformation Leadership" and "vCIO | AI Strategy" as `entry`). Infer seniority from the
**job title string** instead, into three buckets. Confirmed bucket rules (2026-06-17):
- **Senior** — true leaders / budget owners only: Chief/CxO, Founder, Co-founder, Owner, President,
  Partner, VP / Vice President, Director (incl. Senior/Managing Director), vCIO, "Leadership", Executive.
- **Mid** — managers, **Heads** (Head of X = Mid, per decision), Leads, Principals, and **senior ICs**
  (Senior/Staff/Principal Architect, "Engineer III") — skilled but not budget owners.
- **Entry** — everyone else: ICs and specialists (AI Engineer, Cloud Architect, Analyst, Specialist).
- **Unknown** — Apollo-matched but blank title.

This logic lives in the DB as a **stored generated column** (see below) so it auto-applies to every
future import — never re-run by hand. Current enriched split: **Senior 22 · Mid 26 · Entry 13 · Unknown 4**
(1,146 cold leads have `seg` = null until enriched).

## Data model (Supabase / Postgres) — AS BUILT
Project `thnxknvcahqktpbpqvbg` (`dhirs's Project`, ap-south-1). Connect via the **Supabase MCP**
(connector UUID `11ca66fc-1e98-49d5-ab9b-7cb4672a8f10`) — the sandbox can't reach Supabase directly
(egress blocked; DB host is IPv6-only), so the MCP is the only live path. The CRM UI + scripts use the
REST API with `SUPABASE_URL` + `SUPABASE_KEY` from repo-root `.env`.

Live `public.leads` table:
```
email       text  primary key          -- stable key, 1:1 with MailerLite subscriber
fname       text                        -- import maps from leads.json first_name
lname       text                        -- import maps from leads.json last_name
domain      text                        -- email domain (import-derived)
data        jsonb                       -- the ENTIRE flat leads.json record incl. apollo blob
seg         text  GENERATED ALWAYS …    -- title-inferred Senior/Mid/Entry/Unknown (auto)
updated_at  timestamptz default now()
```

The `seg` generated column (auto-computes on every insert/update — this is what makes re-classification
free for future imports):
```sql
alter table public.leads add column seg text generated always as (
  case
    when (data->'apollo'->>'title') is null or btrim(data->'apollo'->>'title')='' then
      case when data->'apollo'->>'id' is not null then 'Unknown' else null end
    when (data->'apollo'->>'title') ~* '\m(chief|c[etopmdfsi]o|founder|owner|president|partner|vp|vice president|managing director|director|vcio|leadership|executive)\M' then 'Senior'
    when (data->'apollo'->>'title') ~* '\m(manager|head|lead|principal|staff|senior|sr|ii+)\M' then 'Mid'
    else 'Entry'
  end
) stored;
```
Cold (un-enriched) leads have `seg = null`. Query a segment with `select * from leads where seg='Senior'`.

**Enriched-vs-cold gotcha (from the CRM UI):** un-enriched rows store `apollo: null` as **JSON null**, so
`data->apollo=not.is.null` matches every row. Key off a sub-field that only exists on real matches:
`data->'apollo'->>'id'` (enriched = not null).

## `leads.json` shape — keep it FLAT
`import_leads.mjs` expects a flat array and wraps the whole record into `data` itself, deriving the columns:
```json
{ "email": "...", "first_name": "...", "last_name": "...", "company": "...", "apollo": { ... }|null,
  "source": { "type": "maven_lightning_session", "name": "production-ready-enterprise-ai-architecture" },
  "signup_date": "2026-06-17T08:11:..." }
```
`source` is a two-node object (`type` = channel/event class, `name` = the specific event/funnel) +
`signup_date` (when). Carries provenance per lead. Lands in `data` on import — query with
`data->'source'->>'type'` and `data->'source'->>'name'`. Future batches set a different `source` so
cohorts/funnels are distinguishable. (All current 1,211 = the one Lightning Lesson.)
Do **not** pre-wrap it with `fname`/`lname`/`domain`/`data` keys — the importer does that mapping
(`fname ← first_name`, `domain ← email domain`, `data ← whole record`). Pre-wrapping double-nests the
blob and hides `apollo.organization` from the UI. (Learned the hard way 2026-06-17.)

## Recurring pipeline — run this for EVERY new Maven download
1. **Export** the new sign-ups from Maven → a CSV like `hs.csv` (`Name,Email,Date Added,Source`).
2. **Derive names + company** locally (email local-part → name; domain → company; gmail/personal → blank).
   Produces the first-pass `leads_enriched.csv`.
3. **Enrich the corporate subset via Apollo MCP** (`apollo_people_bulk_match`, ≤10/call, key by email).
   Skip role-accounts (`info@`) and personal domains. 1 credit/match; free tier = 75/cycle. Persisted
   results land in `.claude/.../tool-results/*.json` — parse them, key matches back by `email`.
4. **Build flat `leads.json`** (`email, first_name, last_name, company, apollo`), apollo = full match or null.
5. **Import**: `node hubspot/import_leads.mjs` → upserts by email into Supabase. `seg` auto-computes; no
   manual classification step.
6. **(Optional) sync segments to MailerLite** for the drips.

So the only per-batch work is steps 1–5; seniority/segmentation is handled by the generated column.
Richer future segmentation (seniority × company size × `functions` × buyer-fit score) = extend the
`seg` expression or add more generated columns.

## Outbound plan — MailerLite (preferred over HubSpot marketing & Kit)
- **Why MailerLite**: automation/drips included on the **free** tier (HubSpot gates real workflows behind
  Pro ~$800/mo; Kit has no automation on free). Cheaper at every tier. Has an **official MCP**
  (connector UUID `5807a545-cd93-4e71-bb21-f3727bf34df1`, ~45 tools) so segments can be pushed directly,
  no CSV upload.
- **Groups vs Segments**: a *group* = a manual bucket you add people to; a *segment* = a live filter over
  subscriber fields. Plan: one list, push `title/company/seniority` as **custom fields**, build segments
  that filter on them (self-maintaining as new leads arrive).
- **Source-of-truth split**: the Supabase/local store owns enrichment + segmentation; **MailerLite owns
  email status — opens, clicks, and especially unsubscribes.** Sync is two-way: segments push out,
  engagement + unsubscribes pull back, or we risk emailing someone who opted out (a legal problem).
- **Caps**: MailerLite free = 1,000 subscribers. We have ~1,211 → prune the low-confidence gmail handles
  to the best ~1,000 before import.

## One-line status
1,211 Maven leads in Supabase `public.leads` → 65 Apollo-enriched → title-inferred `seg` generated column
(**Senior 22 · Mid 26 · Entry 13 · Unknown 4**; cold = null) → next: MailerLite drips per segment.
