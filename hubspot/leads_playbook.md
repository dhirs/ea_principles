# Leads Playbook — single source of truth

Everything needed to work the Maven lead base: where the data lives, how to reach it, how segmentation
works, the recurring import pipeline, the email tool (Brevo), and the per-segment messaging. Read this
first in any new chat. (Supersedes the lead-pipeline notes scattered in `hubspot.md`, which now only
covers the HubSpot CRM push scripts.)

---

## 1. Supabase — how to connect

The lead data lives in Supabase Postgres.

- **Preferred: the Supabase MCP** (connector UUID `11ca66fc-1e98-49d5-ab9b-7cb4672a8f10`). If its tools
  aren't loaded, connect it from Settings → Connectors, then load via ToolSearch. Tools: `list_projects`,
  `list_tables`, `execute_sql`, `apply_migration`, etc.
- **Project id:** `thnxknvcahqktpbpqvbg`  (`dhirs's Project`, region ap-south-1). Pass this as `project_id`.
- **Run SQL:** `execute_sql({ project_id: "thnxknvcahqktpbpqvbg", query: "..." })`. Use `apply_migration`
  for DDL.
- **REST fallback (scripts / the CRM UI):** `SUPABASE_URL` + `SUPABASE_KEY` (secret) from the **repo-root
  `.env`** (`../../.env`). PostgREST base `…/rest/v1/leads`. The agent sandbox CANNOT reach Supabase
  directly (egress blocked + IPv6-only DB host) — so from the sandbox use the **MCP**, or run REST scripts
  on the user's machine.

## 2. The `leads` table (`public.leads`)

```
email       text  primary key            -- stable key; 1:1 with the email-tool subscriber
fname       text                          -- import maps from leads.json first_name
lname       text                          -- import maps from leads.json last_name
domain      text                          -- email domain (import-derived)
data        jsonb                         -- the ENTIRE flat leads.json record incl. the apollo blob
seg         text  GENERATED (read-only)   -- title-inferred bucket, override-aware (see §3)
seg_override text (editable, nullable)    -- manual seniority override; null = use auto
updated_at  timestamptz default now()
```

**Enriched vs cold gotcha:** un-enriched rows store `apollo: null` as **JSON null**, so
`data->'apollo' is not null` matches every row. Key off a sub-field that only exists on a real match:
`data->'apollo'->>'id'` (enriched = not null). Cold leads have `seg = null`.

Useful JSON paths: `data->'apollo'->>'title'`, `data->'apollo'->>'seniority'` (Apollo's own — unreliable),
`data->'apollo'->'organization'->>'name'`, `…->>'estimated_num_employees'`, `…->>'industry'`,
`data->'source'->>'type'`, `data->'source'->>'name'`, `data->>'signup_date'`.

## 3. Segmentation logic — title-inferred, override-aware

**Do not trust Apollo's `seniority` field** (it tags "…Transformation Leadership" and "vCIO" as `entry`).
Seniority is inferred from the **job-title string** into Senior / Mid / Entry / Unknown, and a manual
override wins when set. This lives in the DB as a generated column, so every future import auto-classifies.

Rules (priority order):
- **Senior** — true leaders only: chief/CxO, founder, co-founder, owner, president, partner, VP / vice
  president, managing director, director, vCIO, "leadership", executive.
- **Mid** — manager, **head** (Head of X = Mid, by decision), lead, principal, staff, senior/sr, "III/II"
  (i.e. senior individual contributors).
- **Entry** — everyone else (specialist, analyst, engineer, architect, advisor, IC…).
- **Unknown** — Apollo-matched but blank title.

The column definition (already applied):
```sql
seg_override text check (seg_override in ('Senior','Mid','Entry','Unknown'));  -- editable, null = auto
seg text generated always as (
  coalesce(
    seg_override,
    case
      when (data->'apollo'->>'title') is null or btrim(data->'apollo'->>'title')='' then
        case when data->'apollo'->>'id' is not null then 'Unknown' else null end
      when (data->'apollo'->>'title') ~* '\m(chief|c[etopmdfsi]o|founder|owner|president|partner|vp|vice president|managing director|director|vcio|leadership|executive)\M' then 'Senior'
      when (data->'apollo'->>'title') ~* '\m(manager|head|lead|principal|staff|senior|sr|ii+)\M' then 'Mid'
      else 'Entry'
    end
  )
) stored;
```

**Change seniority manually:**
```sql
update public.leads set seg_override='Senior' where email='x@y.com';   -- force
update public.leads set seg_override=null     where email='x@y.com';   -- revert to auto
```
`seg` updates instantly (it's `coalesce(override, auto)`). Filter a segment with `where seg='Senior'`.
Editing options: Supabase Table Editor, SQL via MCP, or the CRM UI dropdown (writes `seg_override`).

## 4. Recurring pipeline — run for EVERY new Maven download

1. **Export** sign-ups from Maven → CSV like `hs.csv` (`Name,Email,Date Added,Source`). `Name` is usually blank.
2. **Derive** names + company locally (email local-part → name; domain → company; gmail/personal → blank company).
3. **Enrich** the corporate subset via the **Apollo MCP** (`apollo_people_bulk_match`, ≤10/call, key by
   email). Skip role-accounts (`info@`) and personal domains. 1 credit/match, 0 for misses; free tier =
   75 credits/cycle. Large results persist to `.claude/.../tool-results/*.json` — parse those, re-key by `email`.
4. **Build flat `leads.json`** — `{ email, first_name, last_name, company, apollo:{}|null, source:{type,name}, signup_date }`.
   Keep it FLAT; `import_leads.mjs` derives `fname/lname/domain` and wraps the whole record into `data`.
   Do NOT pre-wrap with `fname/lname/domain/data` keys (it double-nests and hides `apollo.organization`).
5. **Import:** `node hubspot/import_leads.mjs` → upserts by email into Supabase. `seg` auto-computes — no
   manual classification step.
6. **Sync the relevant segment to Brevo** and send (see §6–7).

`source` is a two-node object — `type` (channel/event class) + `name` (specific funnel) — plus
`signup_date`. Current batch: `{type:"maven_lightning_session", name:"production-ready-enterprise-ai-architecture"}`.

## 5. Apollo enrichment data (what's in `data.apollo`)

33 person fields + a 41-field `organization` node + `employment_history`. Person: title, headline,
seniority, departments, functions, city/state/country, linkedin_url, email_status. Org: name, primary_domain,
industry, estimated_num_employees, organization_revenue, founded_year, headcount growth, sic/naics, keywords.

## 6. Email tool — Brevo (NOT MailerLite)

- **Why Brevo:** the DNS authentication (SPF / DKIM / DMARC) for `datawhistl.com` is **already set up in
  Brevo**. DKIM/SPF are **provider-specific** — they authorize Brevo, not MailerLite — so switching tools
  means redoing DNS for zero benefit. Brevo also has segmentation, automation/drips, and an MCP.
- **Brevo MCP** connector UUID `01a9fda6-bd91-4f02-af05-d8e4c3f4f556`. Connect it from Settings → Connectors.
- **Free tier:** unlimited contacts, ~300 emails/day (confirm current number). Good fit for 1,211 contacts
  (no contact cap); 300/day is fine for per-segment sends.
- **Send from `…@datawhistl.com`**, never a gmail address (can't be authenticated → spam/reject).
- **Groups vs segments:** a *group/list* = a manual bucket; a *segment* = a live filter on contact fields.
  Plan: one list, push `seg`, `title`, `company` as **contact attributes**, then send to a `seg = Senior`
  segment (or a Senior list).
- **Source-of-truth split:** Supabase owns enrichment + `seg`; **Brevo owns email status — opens, clicks,
  and especially unsubscribes.** Pull unsubscribes back so we never email someone who opted out (legal).
- **List hygiene:** drop dead addresses (`gmail.con` typos, role accounts) before import; bounces hurt reputation.

## 7. Per-segment messaging

Different angle per bucket:
- **Senior** (decision-makers / architects / practice leads) — strategic: "your demos work, nothing
  enforces production-readiness across the portfolio — that's an architecture + operating-model problem."
  Plant the private/corporate-cohort seed. Email copy below.
- **Mid** (managers / heads / senior ICs) — implementation & enforcement: how to actually stand up the
  gates, harness, ARB in their team.
- **Entry** (ICs / specialists) — career: "your coding is being commoditised — move up to architect" → the
  SA Accelerator hook.

### Senior email (pre-session nurture; reframe if the session already ran)

> **Subject:** The reason enterprise AI dies after the demo
>
> Hi {{first_name}},
>
> You signed up for the session on production-ready enterprise AI architecture — so you've probably already
> lived this: the demo works, the pilot ships, and then it quietly breaks in ways nobody's measuring.
>
> At your level the interesting problem isn't the model. It's that across a portfolio of AI projects,
> *nothing enforces* what "production-ready" means — grounding, guardrails, eval, cost control. Every team
> rebuilds it, or skips it, and you find out at the incident review.
>
> In the session I'll show the maturity curve most enterprises are actually on, and where the gap to
> governed, auditable AI really sits. The hands-on workshop on **July 2** is where we build the system to
> close it — the standards catalogue, the ARB review model, and the enforcement-maturity ladder you can
> take back to your own teams.
>
> If you're thinking about this for a group rather than yourself, reply and I'll tell you about the private
> cohort option.
>
> See you there,
> Dheeraj

## 8. Current state (2026-06-17)

1,211 leads · 65 Apollo-enriched · `seg` split (incl. 4 manual overrides): **Senior 25 · Mid 23 · Entry 13
· Unknown 4 · cold (null) 1,146**.

Off-ICP names sitting in Senior to prune before sending: **Eli Mather** (VP Outreach, 3-person trail
nonprofit), **Michael Allon** (President, a fertility clinic), **Richard Jessup** ("Owner" at Intuit — data
error). Set their `seg_override='Entry'` or exclude them from the Brevo push.
