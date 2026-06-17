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
Apollo returns a `seniority` enum (entry/senior/manager/head/director/vp/c_suite/owner/founder). We collapse
to **three buckets**:
- **Entry** ← `entry`
- **Mid** ← `manager`, `head`
- **Senior** ← everything above (vp, director, c_suite, owner, founder, senior)

Current matched split: **Senior 26 · Mid 19 · Entry 16 · unclassified 4**. The Senior+Mid (~45) are the
decision-maker tier — the buyers for the paid architecture workshop. Entry/ICs map to the SA Accelerator hook.
NOTE: this 3-bucket scheme is a first cut; richer segmentation (seniority × company size × `functions` ×
buyer-fit score) is the intended next step and the reason for the flexible data model below.

## Intended data model (Supabase / Postgres, JSONB)
Own the data + segmentation locally; MailerLite is only the send layer. Schema-flexible via JSONB:
```sql
create table leads (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,            -- stable key, 1:1 with the MailerLite subscriber
  created_at timestamptz default now(),
  unsubscribed boolean default false,    -- compliance: NEVER bury this in JSON
  segment text,                          -- computed verdict pushed to the send tool
  data jsonb default '{}'::jsonb         -- the whole Apollo blob + any future fields
);
create index idx_leads_data on leads using gin (data);
```
Query JSONB with `data->>'key'` / containment `data @> '{...}'`; segments = SQL views over `data`.
Promote a field to a real column once it stabilises. `leads.json` already matches this shape.

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
1,211 Maven leads → names/company derived locally → 65 enriched via Apollo (Senior 26 / Mid 19 / Entry 16) →
master in `leads.json` (root fields + full `apollo` node) → next: Supabase load + richer segments + MailerLite drips.
