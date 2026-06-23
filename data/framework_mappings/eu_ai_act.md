# EU AI Act (Reg. 2024/1689) — mapping methodology

> A **cross-reference** to the EU AI Act — which legal obligation each standard's gate helps discharge.

| | |
|---|---|
| **Framework key** | `eu_ai_act` |
| **Role** | cross-reference (informational, no enforcement) |
| **Status** | populated (partial — Security pillar + GO1B1-01) |
| **Standards mapped** | 7 / 24 |
| **Convention in `taxonomy.json`** | `framework_mappings_spec.eu_ai_act_convention` |
| **Source analysis** | `paid_workshop.md` (the 2026-06-13 system-level-controls funnel); decisions.md 2026-06-14 |
| **Last reviewed** | 2026-06-23 |

## WHY we map to it

The EU AI Act is the EU's binding regulation on AI systems. We cross-reference it so a standard can show which **legal obligation** its engineering gate helps satisfy. It governs the AI system's risk and safety — a different layer from AWS (architecture anchor) and from GDPR (personal-data processing).

Three layers were deliberately separated when this framework was added (decisions.md 2026-06-14):

- **the Act** — the *what* (legal obligation);
- **our standard** — the *how* + proof it works (engineering control + gate, EA-owned);
- **ISO 42001** — proof it's *governed* (management-system wrapper, governance-owned).

ISO 42001 is therefore **not** a framework key — it is a governance wrapper, not a control a standard concretises.

## HOW we map

**Field shape** (`framework_specific_reference_fields.eu_ai_act`): `article`, `risk_tier`, `control_ref`. `control_ref` ties the reference to the **eight GenAI-distinctive system-level controls** derived in the 2026-06-13 funnel; a generic (non-GenAI-distinctive) obligation maps to an article with `control_ref: null`.

**The derivation rule.** A standard earns a reference where its gate discharges (fully or partly) an Act obligation. Org/documentation-level obligations (Art 11 tech docs, Art 17 QMS, Art 43/47/48 conformity, Art 49 registration) were dropped by the funnel — they are not system-level engineering controls.

**PRIMARY vs CROSS-REFERENCE vs `na`.** Exactly one PRIMARY per standard (the obligation the gate actually discharges, named in `note`); others are CROSS-REFERENCE (coverage contribution) or `na` (control considered and excluded — e.g. GS6B1-01 records Art 53 GPAI as `na` because it binds GPAI providers, not deployers).

**`mapping_state`:** all current references are **`unverified`** — asserted from the funnel, pending a side-by-side read against the article text.

**Worked example.** **GS5B1-01** → **PRIMARY Art 14** (Human oversight), Control #7 — the pre-execution check forcing route-to-human on irreversible actions concretises human oversight of agentic action. **CROSS-REFERENCE Art 12** (Record-keeping) — the check emits a decision record contributing to logging, but logging is not the obligation its gate discharges.

## STATUS — what's mapped

7 standards: `GO1B1-01` (Art 15 accuracy), `GS1B3-01`, `GS1B3-02`, `GS2B1-01`, `GS4B2-01`, `GS5B1-01`, `GS6B1-01`. (Earlier shorthand "Security standards" is slightly off — GO1B1-01, an Operational Excellence standard, also carries an Art 15 reference.)

## Open items

- **Verify** all 7 mappings against the Reg. 2024/1689 article text (currently all `unverified`).
- **Other pillars unmapped** — GENOPS/GENCOST standards may map to Art 9 (risk MS) / Art 15 (accuracy); not yet done.
- GS2B1-01's gate spans controls #3 and #4 — candidate for splitting into separate accuracy and content-safety standards.
- EU AI Act mappings are **not yet surfaced as a sidebar filter** in the app (open UI work).
