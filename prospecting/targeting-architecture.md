# Two-Layer Targeting Architecture

Core design principle of the outbound engine: **qualification and timing are separate problems.** Layer 1 answers "who could ever buy." Layer 2 answers "who is warm right now." Never collapse the two into one query — Layer 1 fills the database, Layer 2 fills the week.

## Layer 1 — Firmographic Universe (static)

Pure qualification. No timing signals. Built once, refreshed quarterly.

**Filters:**

| Criterion | Value | Notes |
|---|---|---|
| Revenue | $50–100M | Proxy when revenue filter unavailable: 201–1,000 employees |
| Geography | USA + Canada (HQ) | Expand later |
| Marketing operation | Meaningful marketing dept headcount | Use as signal when available |
| Industry | OPTIONAL narrowing filter, not the entry point | Can sell into any vertical |

**Current beachhead (optional industry filter):**

- Industrial manufacturing — NAICS 333, 335, 326
- Durable-goods wholesale/distribution — NAICS 423 (dealer-channel data chaos is a strong fit)

**Exclusions:** trade associations, nonprofits, subsidiaries of giants, media companies.

**Output:** named-account list ("the universe"), ~100–300 accounts, stored as spreadsheet/CRM table.

## Layer 2 — Intent Overlay (dynamic)

A weekly re-ranking of the Layer 1 universe — never a new list. Signals, strongest first:

1. **Active job postings** — marketing operations, CRM manager, marketing technology, customer data analyst, demand gen ops
2. **New CMO / VP Marketing** — < 6 months in role
3. **Headcount growth** — fast growth breaks data architecture
4. **Recent funding**

**Output:** Monday brief — "these N accounts lit up this week, here's why, here's who to contact."

## Refresh cadence

| Layer | Cadence | Trigger |
|---|---|---|
| Layer 1 | Quarterly | Manual rebuild/prune |
| Layer 2 | Weekly | Scheduled Monday scan |

## Working rules

1. Vague segments return garbage — always translate ICP into precise filters (NAICS, headcount, geo) and confirm before searching.
2. Test one page, show hit rate (~10–15% qualified expected), prune filters, then scale.
3. Apollo free plan: revenue/tech-stack filters locked; revenue IS returned in results — query broad, prune to $50–100M from returned data. Each search costs 1 credit; confirm spend before searching.
4. Flag data quality problems; never hide them.
