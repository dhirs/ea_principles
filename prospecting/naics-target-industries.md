# NAICS Categories Ranked by CDP-Service Fit

Ranking logic: a CDP architecture selection service fits companies whose customer data is fragmented across channels they don't fully control — dealer networks, distributors, franchises, D2C + retail mixes, loyalty programs. The more indirect the route to customer, the worse the data chaos, the better the fit.

## Tier 1 — Beachhead (dealer/distributor-channel data chaos)

| NAICS | Industry | Why |
|---|---|---|
| 333 | Machinery manufacturing | Sells through dealers; no direct view of end customer; warranty/service data siloed |
| 335 | Electrical equipment & appliances | Same channel structure; growing D2C ambition collides with channel data |
| 326 | Plastics & rubber products | Mid-market dense; B2B2B with distributor blindness |
| 423 | Merchant wholesalers, durable goods | Sits between manufacturers and buyers — data chaos on both sides |

## Tier 2 — Strong fit (same pain, adjacent verticals)

| NAICS | Industry | Why |
|---|---|---|
| 424 | Merchant wholesalers, nondurable goods | Same as 423 for consumables/CPG |
| 336 | Transportation equipment (RVs, boats, powersports, trailers) | Classic dealer-network blindness; high-value units, warranty data |
| 337 | Furniture & related products | Dealer/showroom channel + emerging D2C |
| 311 / 312 | Food & beverage manufacturing | Retail + D2C + loyalty; heavy promo data fragmentation |
| 3256 | Soap, cleaning & personal care (under 325) | High marketing intensity, D2C + retail mix |
| 339 | Miscellaneous mfg (medical devices, sporting goods) | Multi-channel, regulated data in medical |

## Tier 3 — Opportunistic (customer-data heavy, more CDP-mature competition)

| NAICS | Industry | Why |
|---|---|---|
| 441 | Motor vehicle & parts dealers | Dealer groups consolidating; DMS/CRM sprawl |
| 444 | Building material & garden dealers | Pro + retail dual audience |
| 524 | Insurance carriers & agencies | Policy/claims/marketing silos; heavy buyers of data infra |
| 721 / 722 | Hotels, restaurant chains | Loyalty-driven; franchise data fragmentation |
| 713 | Amusement, gambling & recreation | Loyalty + high-frequency transaction data |
| 812 | Personal services (franchise chains) | Franchisee-owned customer data problem |

## Standing exclusions (use as `not_organization_naics_codes`)

| NAICS | Excludes |
|---|---|
| 813 | Trade associations, nonprofits, religious/civic orgs |
| 51 (or 512/513/516) | Media, publishing, broadcasting |
| 61 | Education |
| 92 | Public administration |

## Usage

- Layer 1 universe entry point: Tier 1 only (333, 335, 326, 423).
- Tier 2 = expansion set once Tier 1 is worked; Tier 3 = opportunistic / inbound qualification only.
- Exclusions apply to every query regardless of tier.
- Verify against official definitions at census.gov/naics when a company looks misclassified.
