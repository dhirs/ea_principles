# GDPR (Reg. 2016/679) — mapping methodology

> A **proposed cross-reference** to the EU General Data Protection Regulation — which personal-data obligation each standard's gate helps discharge. **Methodology agreed; not yet populated on any standard.**

| | |
|---|---|
| **Framework key** | `gdpr` (proposed) |
| **Role** | cross-reference (informational, no enforcement) |
| **Status** | **proposed (not populated)** |
| **Standards mapped** | 0 / 24 |
| **Convention in `taxonomy.json`** | not yet authored (`gdpr_convention` proposed below) |
| **Last reviewed** | 2026-06-23 |

## WHY we map to it

GDPR is the EU's personal-data protection law. It governs **personal-data processing whether or not AI is involved** — a different layer from the EU AI Act (system risk/safety). GDPR carries obligations the Act does not: lawful basis, right to erasure (Art 17), data-subject access requests, storage limitation, and Art 22 automated-decision rights. So it adds genuine coverage and earns a key. (ICO/GDPR is also named in the decisions.md tier-2 regulator list for the future `u_principle` anchoring pass.)

## HOW we map

**Proposed field shape** (`framework_specific_reference_fields.gdpr`): `article` + `principle` (the Article 5 data-protection principle the reference touches: lawfulness / purpose limitation / data minimisation / accuracy / storage limitation / integrity & confidentiality / accountability). `risk_tier` does not apply; no `control_ref` unless a GDPR-specific control taxonomy is later derived (do not invent one).

**The derivation rule.** A standard earns a GDPR reference only if its **gate actually discharges a GDPR obligation** — not because it is topically about data. Because GDPR is about personal data, the honest map is **small**: standards whose gates have no personal-data processing (the GO1B1 eval family, the GENCOST cost family, the GR reliability family) get **no** reference. Forcing one there is the topic-drift failure the catalogue guards against.

**PRIMARY vs CROSS-REFERENCE vs `na`.** Same convention as EU AI Act: one PRIMARY (named in `note`), rest CROSS-REFERENCE or `na`. AWS stays the anchor.

**`mapping_state`:** new mappings author as **`unverified`** — asserted, pending a side-by-side read against the article text.

**Worked example — GS5B1-01** ("Check a consequential action before it happens, not after"). Its gate forces a `confirm`/`policy` check before any `write` tool (delete data, move money, send a message) runs.

```json
"gdpr": {
  "references": [
    {
      "article": "Article 22 — Automated individual decision-making, including profiling",
      "principle": "accountability",
      "mapping_state": "unverified",
      "last_checked": "2026-06-23",
      "note": "PRIMARY. When a consequential agent action is a solely-automated decision producing legal or similarly significant effects on a data subject, the pre-execution gate's forced route-to-human (confirm) is the Art 22(3) right-to-human-intervention safeguard. The gate proves the checkpoint exists and is wired; it does not prove a given action is in Art 22 scope (a per-action legal determination). Not yet read side-by-side against Art 22 text."
    },
    {
      "article": "Article 32 — Security of processing",
      "principle": "integrity and confidentiality",
      "mapping_state": "unverified",
      "last_checked": "2026-06-23",
      "note": "CROSS-REFERENCE. Gating write/delete tools that touch personal data (manifest scope + write-class + policy gate) is a security-of-processing control. Security is not the obligation this gate primarily discharges — Art 22 is."
    }
  ]
}
```

## STATUS — what's mapped

**Zero standards** (proposed only). Candidate set when authored (each pending a read of its actual `statement` + `gates` to confirm personal-data contact): `GS5B1-01` (Art 22 — cleanest), `GS1B3-01`/`GS1B3-02` (Art 5(1)(f)/Art 32), `GS6B1-01` (Art 5 lawful basis/minimisation of training data), `GO3B2-02` (Art 5(1)(e) storage limitation + erasure of traces), and `GS2B1-01`/`GS4B2-01` *only if* they screen PII.

## Open items

- **Expected gaps to log, not force:** right to erasure (Art 17), lawful basis, DSAR fulfilment may be discharged by *no* current standard — record as future-standard candidates rather than mapping them onto unrelated standards.
- Author the `gdpr_convention` + `framework_specific_reference_fields.gdpr` in `taxonomy.json` before populating data.
- Confirm the candidate standards' gates actually touch personal data before authoring references.
