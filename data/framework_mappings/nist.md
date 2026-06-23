# NIST AI RMF — mapping methodology

> A **planned cross-reference** to the NIST AI Risk Management Framework. **Scaffolding only — not yet populated on any standard.**

| | |
|---|---|
| **Framework key** | `nist` |
| **Role** | cross-reference (informational, no enforcement) — planned |
| **Status** | **scaffolded (not populated)** |
| **Standards mapped** | 0 / 24 |
| **Convention in `taxonomy.json`** | none yet |
| **Last reviewed** | 2026-06-23 |

## WHY we map to it

NIST AI RMF is a widely-adopted, US-originated risk-management framework (Govern / Map / Measure / Manage functions). It is named throughout the schema as an anticipated cross-reference (`taxonomy.json` `vendor_neutrality_note`), and **NIST AI RMF Govern** is specifically earmarked as a tier-3 source for the future `u_principle` / values-layer anchoring pass (decisions.md). It adds a risk-management lens distinct from the EU AI Act (legal) and AIGP (competency).

## HOW we map

**Not yet defined.** When NIST is populated, this section must define its `framework_specific_reference_fields` (likely category / subcategory — NIST AI RMF uses function → category → subcategory), add a `nist_convention` note to `taxonomy.json`, and follow the same derivation rule as every other framework (a standard earns a reference only where its gate discharges the obligation).

## STATUS — what's mapped

**Zero standards.** NIST was never filled in — it was **not** removed. Do not mistake the empty state for dead code.

**Important — live scaffolding in the app.** The web app already carries NIST scaffolding that must be **kept**:

- `app/api/index/route.ts` extracts `framework_mappings.nist.references[].{category,subcategory}`;
- `lib/principles/PrinciplesContext.tsx` builds NIST category/subcategory filter state;
- `components/layout/sidebar/NistCategoryFilter.tsx` + `NistSubCategoryFilter.tsx` are mounted in `Sidebar.tsx` and **cascade** (subcategory scoped to the chosen category).

These render empty today because no standard carries `framework_mappings.nist`. They are intentional forward-scaffolding, not dead code — **do not delete them.**

## Open items

- Define NIST field shape + `nist_convention` in `taxonomy.json`.
- Author NIST references on the standards where the AI RMF subcategory genuinely fits.
- The sidebar filters already exist; they will populate automatically once data is authored.
