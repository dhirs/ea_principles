# ADR — Custom taxonomy: a curated business-model label per company, scoped to a NAICS subsector

- **Status:** Accepted
- **Date:** 2026-08-10
- **Scope:** How we label what a company *actually does* when NAICS cannot express it, and how that label reaches the CRM Companies page as a filter. Governs the `company_category` / `company_category_assignment` tables and the `company_custom_taxonomy` view. Does **not** change `apollo_company_universe` (owned by this pipeline) or the five NAICS dropdowns.
- **Context source:** NAICS 2022 hierarchy as denormalised onto `apollo_company_universe` (`sector_title` … `national_industry_title`), sourced from Apollo `naics_codes`. Consumer: `hubspot/ui/app/companies/page.tsx`.

## Problem

We needed to answer "which companies in our universe are private equity firms". NAICS cannot answer it, and no amount of drilling down fixes that:

- **There is no private-equity code in NAICS, at any level.** Sector 52 (Finance and Insurance) splits into five subsectors — 521 monetary authorities, 522 credit intermediation, 523 securities/investments, 524 insurance, 525 funds and trusts. A buyout firm, a VC fund, a hedge fund, an RIA and a stockbroker all "intermediate or manage investments", so all five land in **523**.
- **The 6-digit level is no better, and got worse.** `523940 Portfolio Management and Investment Advice` holds Coller Capital and a suburban wealth adviser side by side. The 2022 revision *merged* the old 523920 (portfolio management) and 523930 (investment advice) into that one code — granularity went down, not up.
- **525 looks right and isn't.** It classifies the *fund vehicle* as a legal entity, not the firm managing it. Apollo profiles the operating company (`thomabravo.com`), so a PE firm is always the manager → 523.
- **Apollo often truncates the code.** 25 of the 84 rows in subsector 523 stop at bare `5231` with no 6-digit detail, so Thoma Bravo and Sequoia read as "Securities and Commodity Contracts Intermediation and Brokerage". Same firm type, different code depth — the dropdown splits identical businesses across levels.
- **There is no other field to fall back on.** `apollo_company_raw.payload` carries `naics_codes` and `sic_codes` and nothing else descriptive — no `industry`, no `keywords`. Confirmed by enumerating the payload keys across all 3,816 rows.

Net: of the 84 companies in subsector 523, roughly 17 are genuinely PE/VC/private capital. The other 67 are wealth managers, M&A advisors, brokerages, fund administrators and exchanges. No query over the NAICS columns separates them.

## Decision

**Add a curated taxonomy layer beside the NAICS hierarchy, with its vocabulary scoped per subsector.**

Two tables and a view:

```
company_category               -- the vocabulary
  (id, subsector_code, label, slug, sort_order)   unique (subsector_code, slug)

company_category_assignment    -- the labelling
  (apollo_org_id PK, category_id, source, note, updated_at)

company_custom_taxonomy        -- what the UI reads
  = assignment ⋈ category → (apollo_org_id, subsector_code, slug, label, source)
```

Four properties this buys:

1. **Per-subsector vocabulary.** Each subsector owns its own list of identifiers. 523 gets PE/VC, Wealth & Asset Management, IB Advisory, and so on; another subsector gets whatever its own domain needs. Adding a subsector is an `insert`, never a schema or code change — the UI renders whatever vocabulary exists for the selected subsector.
2. **One primary label per company** (`apollo_org_id` is the PK). A company is one kind of business; a single label keeps the dropdown an unambiguous filter and keeps counts equal to result rows.
3. **Provenance on every row.** `source` is `manual | rule | llm`, so a hand-made call is always distinguishable from a generated one, and a later automated pass can never silently overwrite curation.
4. **Zero coupling to the pipeline.** `apollo_company_universe` is rebuilt by prospecting stages; writing labels onto it would lose them. Assignments live in their own table keyed by `apollo_org_id`, with `on delete cascade` so a dropped org drops its label.

**In the UI:** one new dropdown, **Custom Taxonomy**, rendered after Subsector on the Companies page. It is empty until a subsector is selected, then lists that subsector's identifiers with company counts, faceted against the other active filters exactly like the NAICS levels.

**Seeded vocabulary for 523** (the eight buckets the PE question actually needed):

| slug | label | n |
|---|---|---|
| `pe` | Private equity / buyout & private capital | 11 |
| `vc` | Venture capital & growth | 6 |
| `asset_wealth` | Asset & wealth management | 31 |
| `hedge_credit` | Hedge fund / credit | 3 |
| `ib_advisory` | M&A / investment banking advisory | 8 |
| `fintech_trading` | Brokerage, trading & fintech platforms | 11 |
| `funds_infra` | Funds infrastructure, admin & data | 8 |
| `market_infra` | Market infrastructure & regulators | 3 |
| `other` | Other | 3 |

**`pe` / `vc` were one bucket until 2026-08-10.** The seed shipped a merged
`pe_vc` (17); splitting it was the first real exercise of the vocabulary, and it
cost one `insert` plus one `update` — no schema change and no code change, which is
the property the per-subsector design was chosen for. The dividing line: **control /
buyout and closed-end private capital** (including real assets and infrastructure)
vs **minority stakes in young or scaling companies**. Firms that genuinely do both —
Insight Partners runs venture *and* buyouts — expose the single-label limit recorded
under Consequences; they take the label matching the majority of their activity.

## Consequences

- **Classification is human judgement, and is recorded as such.** The 523 seed was assigned by reading company names and domains, not derived from any field. `source='manual'` says so. Two calls in it are arguable — Newable (SME lending *and* growth investment) and Gresham House (alternative asset manager rather than a classic buyout house).
- **Coverage starts tiny.** 84 of 2,983 companies are labelled. Everything else is uncategorised and the filter simply won't offer options for those subsectors until a vocabulary and assignments exist.
- **Scaling past hand-labelling needs a generated pass.** An LLM classification over `company + domain + naics_titles`, written as `source='llm'` with the manual rows left untouched, is the intended route. Not built here.
- **One label means genuine dual-nature firms lose information.** Accepted for now. The migration to multi-label is mechanical: drop the PK to a surrogate key, add `is_primary`, add a partial unique index on `(apollo_org_id, taxonomy) where is_primary`. Nothing in the UI or the view assumes single-label beyond the count arithmetic.
- **A second taxonomy axis (ownership type, ICP tier) is not supported** without adding a `taxonomy` column to `company_category`. Deliberately deferred — one axis is what the question needed.

## Considered and not chosen

- **A boolean `is_pe` column on `apollo_company_universe`.** Answers exactly one question, gets wiped by the next pipeline rebuild, and invites a new column per question.
- **Enrich the 84 via Apollo to read `keywords` (~84 credits).** Apollo's own keyword strings are inconsistent as a controlled vocabulary — a firm can carry "private equity", "venture capital" and "asset management" at once — so it produces evidence for a judgement, not the judgement. Still worth doing as *input* to a generated pass; it is not a substitute for the taxonomy.
- **Load the retired 2017 NAICS codes to deepen the hierarchy.** Worth doing on its own merits (see Trap 2 in `stage3_qualify.md` — 32 companies drop out below Sector because of it), but it cannot help here: the missing distinction does not exist at any depth of NAICS.
- **Keyword rules over the company name** (`~* 'capital|ventures|equity|partners'`). Tested across all 2,983 rows: overwhelmingly false positives — Capital on Tap (payments), Legacy Partners (residential letting), Volga Partners (software), Aria Care Partners (dental) — while missing Barings, Molten Ventures and Fengate. Unusable as a classifier.
