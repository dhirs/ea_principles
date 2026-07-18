# Intent Adaptor — `apollo_bombora` (Bombora buyer-intent surge)

Reference adaptor for Stage 5. **Every intent adaptor follows this folder layout and this README structure** (see `methodology.md` → *Intent adaptors*). Architecture and the shared contract: `adr/2026-07-18-stage5-intent-scoring.md`.

- **`signal_type`:** `bombora_surge`
- **`source`:** `bombora` (read from Apollo's org-level intent fields)
- **Contract:** implements `SignalAdaptor` — `collect(accounts, window) -> list[SignalRecord]` (ADR §4)
- **Phase:** v1
- **Status (2026-07-18):** field surface live (`show_intent=true`, fields present); surge values populate on Apollo's **weekly** refresh, so the adaptor emits nothing until then, then lights up on its own.

## What it measures

Whether an account is **currently surging** on one of our configured ICP intent topics, and **how strongly**. This is Apollo's own "buying intent" signal (Bombora/LeadSift topic surge), not a proxy.

## Inputs

| Input | Role | Notes |
|---|---|---|
| **Account list** (primary) | *what to check* | `apollo_org_id` + `domain` rows passed in by the collector runner as `accounts`. **Scoped to fit-scored accounts** — those already carrying a Stage-4 `score_type='fit'` row (run ≥1 target CDP/MAP), ~167 of ~2,983, not the whole universe. Intent collection costs credits and is only meaningful where fit already holds, so Stage 4 must run first. The adaptor is source-neutral to this — the runner picks the set. |
| **ICP topic list** | *filter / label* | The Step-1 topics (`apollo_bombora_topics`, ranked, activated up to plan cap). Used to confirm the returned `intent_signal_account` is one of *ours* and to label evidence. **Not** sent to Apollo at query time — topics are configured in Apollo's account settings; Apollo returns surge relative to them. |
| **Config** | *normalization* | `intent_strength` → `value_norm` map (e.g. low→0.33, medium→0.66, high→1.0); any confidence rule. |
| **Apollo API key** | *source client* | From `.env` (`APOLLO_API_KEY`). |
| `window` | *vestigial here* | Intent is a current rolling snapshot, not a time-range query — unlike job postings. |

## Source call

Per account, call Apollo `mixed_companies_search` (`q_organization_domains_list`, batched by domain — 1 credit/page of 100) and read four fields off the org object. **Use search, not enrich:** verified live 2026-07-18 the four intent fields are present on the *search* payload (`show_intent=true`) but absent/false on `organizations/bulk_enrich` — intent is a search-surfaced signal on this plan.

- `show_intent` — gate: is intent surfaced for this account
- `has_intent_signal_account` — is it **currently surging**
- `intent_strength` — how strongly (the level)
- `intent_signal_account` — **which topic** it is surging on

## Logic

For each account: fetch → require `show_intent` **and** `has_intent_signal_account` **and** `intent_signal_account` ∈ ICP topics → **emit one `SignalRecord`**. Otherwise **emit nothing** (ADR rule: *collection failure ≠ zero* — absence is handled by the scorer's denominator, never a fake `value_norm=0` row).

## Output — `SignalRecord` → `apollo_intent_signals` ledger

| Field | Value |
|---|---|
| `apollo_org_id` | the account |
| `signal_type` | `bombora_surge` |
| `source` | `bombora` |
| `value_raw` | native `intent_strength` |
| `value_norm` | 0–1 from the strength map |
| `confidence` | 0–1 (topic-match / completeness) |
| `observed_at` | **collection/refresh date** — see caveat |
| `evidence` | jsonb: `{topic, strength, raw fields}` |
| `adaptor_version`, `collected_at`, `run_id` | provenance |

The adaptor **never** writes `apollo_company_scores` — only the composite scorer does.

## `observed_at` caveat

Apollo intent is a weekly rolling snapshot with **no per-account "surge started on date X" timestamp**. So `observed_at` is set to the collection date (the refresh it was pulled on), which makes the scorer's recency decay **coarser** here than for timestamped signals like job postings. Note this in code so nobody assumes the decay is precise.

## Config keys used

`bombora_surge.strength_map`, `bombora_surge.half_life_days`, `bombora_surge.weight` (weight is read by the scorer, not this adaptor), `bombora_surge.enabled`.

## References

- `adr/2026-07-18-stage5-intent-scoring.md` — adaptor contract, ledger schema, composite formula, roadmap.
- `stage5_intent.md` — buyer-intent field mapping + Step-1 topic selection.
- `apollo_bombora_topics` (Supabase) — the topic taxonomy the ICP topics come from.
