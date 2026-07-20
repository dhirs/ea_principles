# Stage 6 — People / Contacts (Agent Brief)

Instructions for an agentic AI running Stage 6. Context: `methodology.md` (Stage 6). This is an **independent pipeline** — the **Contact pipeline**. Stages 1–5 are all about *companies* (build the account universe, score its fit and intent). Stage 6 is the first stage about *people*: it finds the marketing decision-makers to talk to at each qualified account, stores them as leads, and — critically — records **why** each person is in the pipeline. It does **not** touch the build pipeline (1–3) or the scoring pipelines (4–5).

To build it the first time, follow `stage6_BUILD.md` (one-time runbook). This doc is the durable contract for *running* it thereafter.

## Scope

Stage 6 does three things, in order:

1. **Acquire** — find people at `apollo_company_universe` accounts whose title matches the ICP's buyer (`stage6_target_titles.json`), via Apollo People Search. Store every person verbatim in `apollo_people_raw` (the durable people superset).
2. **Reveal & promote** — unlock email/phone for the chosen contacts (capped, by seniority) and promote them into `leads` with the same `data->apollo` shape the table already uses.
3. **Attribute** — write a `lead_provenance` row recording *why* each promoted person is a lead (`title_match_universe`), alongside any pre-existing reason (`maven_workshop`).

**Input:** rows in `apollo_company_universe` (Supabase project `thnxknvcahqktpbpqvbg`) — key `apollo_org_id`, plus `domain`. The target buyer definition is `stage6_target_titles.json` (versioned data, not code — regenerate when the ICP changes).

## The two faces — search finds *who*, reveal unlocks *how to reach them*

Same principle as Stage 4's technology probe: a durable source has a cheap *search* face and a paid *lookup* face, and they don't carry the same data.

| | People Search (`apollo_mixed_people_api_search`) | People Match / reveal (`apollo_people_match` / `bulk_match`) |
|---|---|---|
| Finds people by title/seniority/org? | **Yes** — server-side filter | n/a (you already have the id) |
| Returns a usable email/phone? | no — locked or guessed (`email_status`, `extrapolated_email_confidence`) | **yes** — the unlocked contact |
| Cost | 1 credit / page (100 people) | ~1 credit / contact revealed |

So **search to enumerate** (cheap — measure the yield for free), then **reveal only the contacts you decide to pursue** (capped per company, prioritised by seniority). Never reveal the whole search result blindly — a full sweep is ~2,983 orgs and would exhaust the cycle's credits (see `stage6_target_titles.json` → `_reveal_policy`). Confirm total credit cost before revealing.

## Method

### Step 1 — Search: who at our accounts holds a target title

One People-search per batch of org ids (Apollo caps `organization_ids` per request — batch ~100 and paginate). Robust net = seniority + department; `person_titles` refines. **Verify the exact Apollo parameter names against the live MCP/API schema before spending** — do not assume a documented field is populated (this is how Stage 4's "enrichment has no technographics" surfaced).

```json
{
  "organization_ids": [ "<up to ~100 apollo_org_id from apollo_company_universe>" ],
  "person_seniorities": ["c_suite", "vp", "head", "director"],
  "person_titles": [ "...from stage6_target_titles.json.person_titles..." ],
  "person_department_or_subdepartments": ["marketing"],
  "contact_email_status": ["verified", "guessed"],
  "per_page": 100
}
```

Save each page to `apollo_people/<date>/page-N.json` + `breadcrumbs.json` (Stage 2 discipline — the breadcrumbs are the only record of what you actually queried). Upsert every returned person into `apollo_people_raw` on `apollo_person_id`, stamping `apollo_org_id` and the `search_query` that surfaced them. **Email is locked at this point** — that is expected; nothing is a lead yet.

### Step 2 — Select: cap per company, prioritise by seniority

The search may return many people per account. Reveal is the expensive step, so choose which to pursue *before* spending:

- Group `apollo_people_raw` rows by `apollo_org_id`.
- Rank within each account by `_reveal_policy.seniority_priority` (c_suite → head → vp → director).
- Keep the top `max_contacts_per_company` (default 3). Log what you dropped — never silently cap coverage.

### Step 3 — Reveal: unlock email/phone (credits)

For the selected people, call `apollo_people_match` / `bulk_match` (batch). Confirm the credit cost first (contacts × ~1 credit). Write the returned record to `apollo_people_raw.revealed_payload` + `last_revealed` as a **PATCH** — never overwrite `payload` (a merge-duplicates upsert takes the insert path and trips `NOT NULL payload`; this is the exact bug caught on the Stage 4 enrichment bank). A person whose email comes back `unavailable` stays in raw, unpromoted — record it, don't fake an email.

### Step 4 — Promote to `leads`

For each revealed person **with a real email**, upsert into `leads` (key `email`). Match the existing lead shape exactly — `seg` is a generated column that reads `data->apollo->title`, so the person object must live under `data.apollo`:

| `leads` column / path | Source (People / match record) |
|---|---|
| `email` (conflict key) | revealed `email` |
| `fname` / `lname` | `first_name` / `last_name` |
| `domain` | employer `primary_domain`, else email domain |
| `data->>email` | `email` |
| `data->>first_name` / `last_name` | `first_name` / `last_name` |
| `data->>company` | organization `name` |
| `data->>source` | `'apollo_people_search'` |
| `data->>signup_date` | the search/reveal date (`YYYY-MM-DD`) |
| `data->apollo` | the **full person object** verbatim — `title`, `seniority`, `departments`, `functions`, `organization_id`, `email_status`, `employment_history`, … (identical shape to the 65 already-enriched leads) |

Upsert on `email`. Use `Prefer: resolution=merge-duplicates` **only if** you intend an Apollo record to overwrite a thinner existing one; otherwise `ignore-duplicates` preserves a richer maven-sourced row. Decide per run and say which in `README.md`.

**This is the first population that links people to the universe.** Today 0 leads join `apollo_company_universe` — the maven attendees work at different companies. Every Stage 6 lead carries `data->apollo->organization_id = apollo_company_universe.apollo_org_id`, closing that gap.

### Step 5 — Attribute: write `lead_provenance` (the WHY)

For each promoted lead, upsert one `title_match_universe` provenance row — see *The provenance register* below. This is not optional bookkeeping; it is the answer to the question this stage exists to make answerable.

## The provenance register — why a person is a lead

Before Stage 6 there was **no single field for why a lead became a lead.** The reason was scattered: workshop attendance lived in `maven_attendance` (a relationship, not a field), a per-lead `data->source` string, and the *account's* reason sat in `apollo_company_scores.signals`. Nothing recorded, per person, *why we are talking to them* — and nothing could hold two reasons at once.

`lead_provenance` is that field, built as a register (concept: `methodology.md` → *Where lead provenance lives*). One row per **(lead, reason-type)**; the `evidence` jsonb explains it. DDL + write contract: `stage6_migration.sql`.

Two seed reason-types:

- **`maven_workshop`** — the lead attended a Maven workshop. Back-filled once from `maven_attendance` (all ~1,473 current leads); `evidence = {events[], attended, sources}`.
- **`title_match_universe`** — the lead holds a target marketing title at a qualified account. Written by Stage 6 at promotion; `evidence = {apollo_org_id, company, title, seniority, matched_title}`, `source = 'apollo_people_search'`, `source_version = stage6_target_titles.json._version`.

**A person can carry both rows — and that is the point.** A CMO who *also* attended a workshop is your strongest opportunity; keyed per `source_type`, neither reason overwrites the other (exactly why `apollo_company_scores` keys per `score_type`). Future reasons — `intent_surge` (rolled up from Stage 5), `inbound`, `referral` — are new rows, no schema change.

> **"Opportunity" as a formal CRM stage is not in this DB.** `leads` has no stage/status column and there is no opportunity object here. If a sales-stage pipeline is wanted, it lives in HubSpot (separate). `lead_provenance` answers *why this person is in our pipeline at all* — the provenance question — not *what stage the deal is in*.

## Tables

Both created by `stage6_migration.sql`:

- **`apollo_people_raw`** — raw people superset, key `apollo_person_id`. Mirror of `apollo_company_raw`. `payload` = search row (locked email), `revealed_payload` = match record (unlocked), `search_query` = per-row provenance. Upsert on `apollo_person_id`; reveal PATCHes `revealed_payload` only.
- **`lead_provenance`** — the why-register, key `(email, source_type)`. Mirror of `apollo_intent_signals`. FK to `leads(email)` cascades — a deleted lead takes its provenance with it.

`leads` itself is unchanged — no new columns. People land in it via the existing `data->apollo` shape; `seg` classifies them automatically.

## Store layout — `apollo_people/<date>/`

Date-partitioned point-in-time snapshot of every searched person (the full superset), mirroring `apollo_companies/<date>/`:

- `page-N.json` — raw People-search captures, 100 people/page, all fields verbatim.
- `breadcrumbs.json` — the filters Apollo applied. Persist it — without it the snapshot records the results but not the query.

Not the promotion source — promotion reads `apollo_people_raw`, not these files.

## Cadence & ops

- **On demand**, re-run to refresh contacts or extend to new accounts. The searches are idempotent (upsert on `apollo_person_id`); reveals are not free, so re-reveal only when a contact's data is stale.
- **Credit discipline** is the whole game here: search is cheap, reveal is per-contact. Cap per company, prioritise by seniority, confirm the reveal cost before spending, and record credits in `README.md`.
- **Verify email deliverability, don't trust it** — `email_status='guessed'` and low `extrapolated_email_confidence` mean Apollo inferred the address. Promote them if you like, but keep the confidence in `data->apollo` so outreach can weight it.
- Report honestly in `README.md`: search yield, per-account contact counts, how many revealed vs `unavailable`, credits spent, anything reconstructed or capped. **Never hide a cap or a data-quality problem.**
