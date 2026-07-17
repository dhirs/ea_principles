# ADR — Stage 4 fit: the five areas fit is assessed in

- **Status:** Accepted
- **Date:** 2026-07-17
- **Scope:** The *structure* of the fit model — which areas we look in, and the data points in each. Not the rules, not the weights, not the field-level detail. Each area's fields get their own record.
- **Service:** CDP-selection. The areas are service-specific; the method of picking them is not.
- **Context:** `methodology.md` (Stage 4). Implementation: `stage4_fit.md`. Area 1 detail: `2026-07-17-stage4-technology-category.md`.

## Problem

Stage 4 was drifting into "which Apollo fields are available" — a vendor's schema deciding what fit means. That is backwards. The source should be chosen to answer the question; the question should not be trimmed to fit the source. Several real fit signals (M&A, leadership change, channel footprint) are not in Apollo at all, and would have been silently dropped by a field-first approach.

## Decision

Fit is assessed in **five areas**. Each carries 2–3 data points. Apollo is one source among several — deliberately.

| # | Area | Data points | Source |
|---|---|---|---|
| 1 | **Technology Landscape** — what they run | CDP/MAP category present; CRM category; data warehouse (Snowflake/BigQuery/Databricks); stack breadth (count of martech tools) | Apollo `category` |
| 2 | **Customer-Data Estate** — the actual pain | Channel/touchpoint count (ecommerce + retail + app); brand/domain fragmentation; B2C vs B2B model | Mostly non-Apollo — site, app stores, `retail_location_count` |
| 3 | **Organisational Capability** — can they run it | Marketing dept headcount; IT/data dept headcount; martech/data-role seniority present (CDO, Head of Martech) | Apollo `departmental_head_count` + People search |
| 4 | **Financial Capacity** — can they fund it | Total funding + latest stage; funding recency; public vs private | Apollo funding fields |
| 5 | **Structural Change** — slow triggers | Acquisitions *made by* them (integration = data fragmentation); leadership change (new CMO/CDO); rebrand/replatform | Non-Apollo — Crunchbase, news |

**Area 2 is load-bearing.** It is the only area that measures *need*. Areas 1, 3 and 4 all measure *capacity* — they tell you an account could buy, not that it should. A fit model built only from what Apollo hands over would be all capacity and no need, and would score a well-funded company with one channel and no data problem as a strong target. It isn't one.

**Every area is durable.** Each data point is true today and almost certainly true next week — the Stage 4 test. Nothing here decays on a 30-day window; that is Stage 5's business and it stays out (`methodology.md` — never mix cadences).

## Why these five

They are the four conditions a CDP purchase actually requires, plus the trigger:

- **Need** (2) — a fragmented customer estate is the problem a CDP solves. No fragmentation, no purchase, however rich the account.
- **Means** (4) — capital to fund it.
- **Capability** (3) — a marketing/data function large enough to run it. A CDP with nobody to operate it does not get bought twice.
- **Readiness** (1) — an existing MAP/CRM/warehouse is what a CDP plugs into. It also reads both ways: already running a CDP is a displacement play, not a greenfield one, and the rules must be free to score those differently.
- **Trigger** (5) — the slow event that makes the need urgent. An acquisition *creates* the second customer database; a new CMO is the person who signs.

## Consequences

- **Apollo alone cannot produce the fit score.** Areas 2 and 5 need other sources; area 3's seniority check needs People search, not company enrichment. Sizing the Apollo enrichment run is therefore not the same as sizing Stage 4.
- **Area 5 has a known gap.** Apollo tracks who owns whom, not timestamped acquirer events (`stage4_fit.md`). Crunchbase or a news API, or the area degrades to leadership change only.
- Rules and weights are still open. Nothing here says a CDP hit is worth 40 points.
- The five areas are the agreed frame for every subsequent Stage 4 record. A proposed field that belongs to no area is out of scope by default.

## Considered and not chosen

**Regulatory Exposure** — consent and first-party-data urgency by sector (healthcare, finance). Cheap, since it is derivable from the NAICS codes already on every row. Held as area 6, not dropped: it is a real driver, but it is a proxy for need that area 2 measures directly. Promote it if area 2's non-Apollo sourcing proves expensive.
