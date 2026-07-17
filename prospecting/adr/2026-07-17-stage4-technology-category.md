# ADR — Stage 4 fit: match on individual technology *name*, not category

- **Status:** Accepted — **revised 2026-07-17: reversed from category-match to technology-name match** (see *Revision: why this flipped*).
- **Date:** 2026-07-17
- **Scope:** The CDP/MAP detection field inside **Area 1 (Technology Landscape)** of `2026-07-17-stage4-fit-areas.md`. This ADR settles *how* Area 1 detects a target technology on a record. Area 1's scoring weights and areas 2+ remain out of scope.
- **Context source:** Apollo Organization Enrichment (`organizations_enrich` / `organizations_bulk_enrich`). Reference data: `supported_technologies.csv` (Apollo's supported-technologies export — the authoritative name→category map, 10,514 technologies across 80 categories). Concept: `methodology.md` (Stage 4). Implementation: `stage4_fit.md`. Target sets: `stage4_target_technologies.json`. Store: `apollo_company_scores`.

## Revision: why this flipped

This ADR originally decided **"score on `category`, never on vendor identity."** That decision is **reversed.** We now match on **individual technology name** against a curated target set. The reversal is not a refinement — the original rule cannot be implemented, because the category taxonomy it depended on does not contain the concept we score.

The trigger was pulling Apollo's actual supported-technologies list (`supported_technologies.csv`) and inspecting the taxonomy the original ADR had flagged as unverified. It is worse than "unverified" — it is unusable for this signal:

- **There is no "Customer Data Platform" category.** Apollo has exactly **80** technology categories; none of them is CDP. The core Stage 4 signal — *does this account run a CDP* — has no category to test against. It is not a spelling question; the concept does not exist as a category.
- **CDPs are smeared across eight unrelated categories.** Segment, RudderStack, Amperity, Blueconic, Simon Data and Tealium Customer Data Hub sit in **Data Management Platform**; mParticle in **Other**; Lytics and Snowplow in **Analytics and Tracking**; Treasure Data in **Business Intelligence**; Blueshift and Insider in **Marketing Automation**; Twilio Segment and Adobe Experience Platform in **ERP**; Tealium in **Tag Management**; and the one product literally named **"Salesforce Customer Data Platform (CDP)"** is filed under **Customer Relationship Management**. No predicate over `category` gathers this set.
- **The same vendor splits by alias across categories.** *Segment* is a Data Management Platform but *Twilio Segment* is ERP. *Tealium* is Tag Management but *Tealium Customer Data Hub* is a Data Management Platform. A category rule would score two records for the same company differently.
- **The nearest category fails both ways at once.** "Data Management Platform" (116 technologies) is a junk drawer: it holds real CDPs, actual ad-DMPs (Adobe Audience Manager, Oracle BlueKai, Nielsen DMP, Lotame), data warehouses (Snowflake), ETL/integration (Airbyte, Stitch, Hightouch, Informatica), consent tools (OneTrust, TrustArc), and data brokers (Acxiom, LiveRamp, Epsilon). Matching it is both **impure** (Snowflake is not a CDP) and **incomplete** (it misses mParticle, Lytics, Treasure Data, and Tealium's main record).
- **Categories are too coarse to be signals anyway.** "Marketing Automation" is 464 technologies; "Analytics and Tracking" is 514 and holds Databricks, Salesforce CRM, and Google Analytics side by side. And *data warehouse* is undetectable as a category at all — Snowflake lands in DMP, Databricks in Analytics, BigQuery and Redshift are absent entirely.

The original ADR's objection to vendor matching — *"a hand-maintained vendor list is a silent-failure machine that rots"* — was correct, and it is the reason we do not hand-type a list. But it is fully answered by sourcing the target names from `supported_technologies.csv`: the list is Apollo's own, spelled exactly as Apollo emits, and refreshes when the export is re-downloaded. The rot objection killed *hand-typed* lists, not *name matching*.

## Problem

Stage 4's core fit signal is *does this account run a CDP or a MAP*. Apollo returns detected technologies in two shapes on the enrichment response:

- `current_technologies[]` — `{uid, name, category}` per tool.
- `technology_names[]` — the `name` values, flattened.

We need a rule over these that reliably answers "CDP present / MAP present" for a specific ICP.

## Decision

**Match on technology `name`, against a curated, per-ICP target set. Never on `category`.**

```
matched = { t for t in record.technology_names
            if normalize(t) in TARGET_NAMES }         # exact, case-insensitive, trimmed
hit     = len(matched) > 0
fit_area1_score = len(matched)                          # more distinct matches → higher
```

- **`TARGET_NAMES` is supplied by the ICP-definition stage**, not global. Stage 4 takes the relevant-technology set as an input and only checks presence. Different clients, different sets.
- **Every target string must exist verbatim in `supported_technologies.csv`.** The ICP stage selects from — or validates against — that column. A string not in the CSV silently matches nothing; validation at definition time is the guard that keeps the silent-failure mode out.
- **Match is normalized** (case-folded, trimmed) but not fuzzy. Apollo's own strings are the vocabulary; no synonym guessing.

### Target set for this ICP (owner: Dheeraj)

Requirement: *all companies running **any CDP** OR **any MAP**.* Defined in `stage4_target_technologies.json`.

- **CDP (33 technologies)** — curated by hand, because no category captures them. Assembled by pulling every genuine CDP out of the eight categories they scatter across, then validating each string verbatim against the CSV. Includes the aliases (`Segment` **and** `Twilio Segment`; `Tealium Customer Data Hub`). A handful are borderline/composable (Hightouch, Snowplow, Optimove, Netcore Cloud, Cooladata, Sitecore Engagement Cloud) and are trivially trimmed.
- **MAP (466 technologies)** — the full membership of Apollo's **Marketing Automation** category (464), derived from the CSV, plus two known miscategorised strays (`Braze` → Analytics, `Emarsys` → Email Marketing). The Marketing Automation category is coherent enough to use as an enumeration *source*; note this is the CSV's category column used at **build time** to list candidate names, not the record's category field used at **score time**. Email-marketing/ESP tools (Klaviyo, Customer.io) are deliberately excluded as not-a-MAP; adjustable.

### Query

```
QUALIFY record  ⟺  (matched ∩ CDP) ≠ ∅  OR  (matched ∩ MAP) ≠ ∅
```

i.e. keep any company running at least one CDP or at least one MAP. `fit_area1_score` (count of distinct matches) still ranks the survivors, so a company on Segment + Marketo outranks one on Marketo alone.

## Consequences

- **Detection no longer depends on Apollo's taxonomy being coherent** — which it is not. It depends only on the technology *name*, which is stable and which we store.
- **`TARGET_NAMES` is data, not code.** New CDP entrants are added by editing `stage4_target_technologies.json`; re-scoring any already-enriched account costs **0 credits** because its `technology_names[]` is stored (below).
- **`supported_technologies.csv` becomes repo reference data.** The MAP set is regenerated from its category column on each refresh; the CDP set is re-validated against it. A re-download picks up Apollo's additions.
- **The CDP set carries a curation judgement.** Where a category rule was objective-but-wrong, a name list is subjective-but-right: someone decided what counts as a CDP. That decision is visible and reviewable in the JSON, which is the correct place for it.
- Warehouse and CRM sub-signals of Area 1 remain undecided; they inherit the same name-match mechanism when specified.

## Retained from the original decision

**Capture `technology_names[]` in full, verbatim, unfiltered** into each score row's `signals` — every tool the account runs, not just the matches. This survives the reversal unchanged and is now load-bearing: it is exactly what the name match runs against, and it is what makes a changed `TARGET_NAMES` re-scorable from stored data instead of re-billed. This is the Stage 2 raw-superset principle applied to signals: keep everything the call returned; filter at scoring time, not capture time.
