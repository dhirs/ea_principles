# {Framework name} — mapping methodology

> One sentence: what this framework is and our relationship to it.

| | |
|---|---|
| **Framework key** | `xxx` (the key under `framework_mappings` in `principles.json`) |
| **Role** | primary anchor **/** cross-reference (informational, no enforcement) |
| **Status** | populated **/** scaffolded (not populated) **/** proposed |
| **Standards mapped** | N / {catalogue size} |
| **Convention in `taxonomy.json`** | `framework_mappings_spec.xxx_convention` (or "none yet") |
| **Last reviewed** | YYYY-MM-DD |

## WHY we map to it

- What the framework is (issuing body, what it governs).
- What coverage it adds **beyond AWS and the other frameworks** — if it adds nothing distinct, it should not be a key.
- Its "layer" — legal obligation / professional competency / governance wrapper — and how that differs from its neighbours. (Governance wrappers like ISO 42001 are deliberately *not* keys; they prove a control is governed, they are not a control a standard concretises.)

## HOW we map

- **Field shape.** The framework-specific structural fields on each reference object (the common fields `mapping_state` / `last_checked` / `note` are the same for every framework). Mirror the declarations in `taxonomy.json` → `framework_specific_reference_fields.xxx`.
- **The derivation rule — the test for earning a reference.** A standard earns a reference only if its **gate actually discharges the obligation** — not because the two are topically related. State the test plainly.
- **PRIMARY vs CROSS-REFERENCE vs `na`.** Exactly one PRIMARY per standard (the obligation the gate discharges, named in the `note`); the rest are CROSS-REFERENCE (partial coverage) or `na` (considered and excluded).
- **`mapping_state` policy.** When is a reference `verified` vs `unverified`.
- **Worked example.** One real standard, showing the reasoning end to end.

## STATUS — what's mapped

- The standards carrying this key, each with its PRIMARY reference.
- **Known gaps** — obligations in this framework that *no* current standard discharges. These are documented gaps / future-standard candidates, **not** something to force onto an unrelated standard.

## Open items

- …
