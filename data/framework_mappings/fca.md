# FCA Handbook (SYSC / PRIN, under FSMA 2000) — mapping methodology

> A **proposed cross-reference** to the UK Financial Conduct Authority's rulebook — which enforceable systems-and-controls obligation (and the higher Principle it serves) each standard's gate helps a regulated firm discharge. **Methodology agreed; not yet populated on any standard.**

| | |
|---|---|
| **Framework key** | `fca` (proposed) |
| **Role** | cross-reference (informational, no enforcement) |
| **Status** | **proposed (not populated)** |
| **Standards mapped** | 0 / 24 |
| **Convention in `taxonomy.json`** | not yet authored (`fca_convention` proposed below) |
| **Mapped against** | FCA Handbook (live), SYSC + PRIN, as at 2026-06-28 |
| **Last reviewed** | 2026-06-28 |

## WHY we map to it

The FCA Handbook is the rulebook for UK-authorised financial-services firms, made under the **Financial Services and Markets Act 2000 (FSMA)**. It is the binding conduct-and-controls regime a firm like AVIA operates under, and it adds coverage neither AWS (architecture anchor), EU AI Act (system risk/safety), nor GDPR (personal data) provides: **operational systems-and-controls obligations and a retail-customer outcomes duty**, enforced on the firm regardless of whether AI is involved.

Two structural points shape every FCA mapping:

- **It is not one statute with Articles.** The Handbook is organised into **sourcebooks** (3-letter modules) → chapters → sections → individual provisions, each carrying a **status letter** — `R` (Rule, binding), `G` (Guidance), `E` (Evidential), `D` (Direction). A reference must name the provision *and* its letter, because the letter is what tells you whether it is a hard obligation. Reference format: `SYSC 4.1.1R`.
- **It is principles-based, not prescriptive.** The two sourcebooks that matter for this catalogue:
  - **SYSC** — *Senior Management Arrangements, Systems and Controls.* The detailed, enforceable "how a firm must be run internally" rules: governance, risk management, internal controls, outsourcing, record-keeping, operational resilience. This is where a standard's **gate** maps — to a specific enforceable provision.
  - **PRIN** — *Principles for Businesses.* 12 high-level, independently-enforceable Principles (Principle 12 = the Consumer Duty). These are the **"why"** layer; the FCA can and does enforce on a Principle alone where no narrower rule fits.

**SYSC→PRIN is not an FCA-given lookup.** SYSC was created to put detail behind the Principles (esp. Principle 3), so the lineage is real and by design, but the FCA publishes no definitive SYSC→PRIN crosswalk. The link is an **authored judgement** the firm asserts and must be able to defend — treat it like any other `unverified` mapping, not a fixed fact.

**FCA vs the other layers.** EU AI Act governs the AI *system's* risk; GDPR governs *personal-data* processing; FCA governs the *regulated firm's* conduct and operational controls. The same engineering gate can discharge an obligation in more than one — e.g. the GS5B1-01 pre-execution action check is EU AI Act Art 14 (human oversight) **and** FCA `SYSC 4.1.1R` (internal control over a consequential automated action). Mapping FCA names the second regulator's requirement the identical control already satisfies.

## HOW we map

**Proposed field shape** (`framework_specific_reference_fields.fca`):

- `sourcebook` — the Handbook module, e.g. `"SYSC"`, `"PRIN"`.
- `provision` — the cited provision with its status letter, e.g. `"SYSC 4.1.1R"`. For a Principle, `"PRIN 2.1.1R"` (or the Principle number in `prin_principle`).
- `status_letter` — `R` / `G` / `E` / `D`, surfaced explicitly so a reader sees at a glance whether the obligation is binding.
- `prin_principle` — the higher Principle the provision serves (e.g. `"Principle 3 — adequate risk-management systems"`, `"Principle 12 — Consumer Duty"`). This is the asserted SYSC→PRIN link; it is a judgement, not an FCA crosswalk.

`risk_tier` does not apply (FCA is not risk-tiered like the EU AI Act). No `control_ref` — there is no GenAI-distinctive control taxonomy on the FCA side; do not invent one.

**The derivation rule.** A standard earns an FCA reference only if its **gate actually provides evidence the firm discharges an enforceable SYSC provision** — not because the standard is topically about controls. FCA is principles-based and outcomes-focused, so the honest test is: *would this gate stand as evidence to the regulator that the named control exists and operates?* If yes, map it. If the standard's gate has no firm-level control obligation behind it (much of the GENCOST cost family, the GR reliability internals), it earns **no** reference. Forcing one is the topic-drift failure the catalogue guards against.

**PRIMARY vs CROSS-REFERENCE vs `na`.** Same convention as EU AI Act / GDPR: exactly one PRIMARY per standard — the enforceable provision the gate most directly evidences, named in `note`, with its `prin_principle` — and the rest CROSS-REFERENCE (partial coverage) or `na` (considered and excluded). AWS stays the anchor. For a genuinely conduct-only outcome with no narrower rule (a harmful response to a retail customer), the PRIMARY is **PRIN 12 (Consumer Duty)** itself, because there is no SYSC rule that fits.

**`mapping_state`:** new mappings author as **`unverified`** — asserted, pending a side-by-side read against the Handbook provision text. (Provision numbers below are real Handbook references but must be confirmed against the live Handbook before authoring.)

### Zone → SYSC structure (the placement spine)

Using the Component Boundary Model (`guardrail.md`), the enforceable provisions cluster predictably by zone:

- **Zone 1 — Ingress.** `SYSC 4.1.1R` (robust governance + internal control mechanisms) for input screening (GS4B2-01) and entitlement-scoped retrieval (GS1B3-01); `SYSC 6.1` / `6.3` (compliance + financial-crime systems) where a control screens what a user can reach.
- **Zone 2 — Process & act.** `SYSC 8.1` (**outsourcing / third-party reliance**) — a foundation-model API call is reliance on a third party; plus `SYSC 4.1.1R` + `SYSC 7.1` (risk control) for the agent action gate (GS5B1-01) and spend limits (GC5B1-01). The human-oversight limb of the action gate also engages **SM&CR** firm accountability.
- **Zone 3 — Pre-delivery gate.** `SYSC 4.1.1R` for the output control (GS2B1-01), but the PRIMARY is **PRIN 12 (Consumer Duty)** — no narrower SYSC rule covers "do not hand a retail customer a harmful answer."
- **Cross-cutting band.** `SYSC 9.1` (orderly record-keeping) for observability + trace governance (GO3B2-01/02); `SYSC 15A` (operational resilience) for drift/health monitoring (GO1B1-04).

**Worked example — GS5B1-01** ("Check a consequential action before it happens, not after"). Its gate forces a `confirm`/`policy` check before any `write`-class agent action (move money, send a message, delete data) runs.

```json
"fca": {
  "references": [
    {
      "sourcebook": "SYSC",
      "provision": "SYSC 4.1.1R",
      "status_letter": "R",
      "prin_principle": "Principle 3 — adequate risk-management systems",
      "mapping_state": "unverified",
      "last_checked": "2026-06-28",
      "note": "PRIMARY. The pre-execution check is an internal control mechanism over a high-risk, externally-visible automated action; the gate is the mechanical evidence the control exists and is wired into the action path. Serves Principle 3 (and Principle 12 where the action affects a retail customer). The gate proves the checkpoint exists; it does not prove a given action is correctly classified as consequential (a per-action judgement). Not yet read side-by-side against the SYSC 4.1 text."
    },
    {
      "sourcebook": "SYSC",
      "provision": "SYSC 8.1.1R",
      "status_letter": "R",
      "prin_principle": "Principle 3 — adequate risk-management systems",
      "mapping_state": "unverified",
      "last_checked": "2026-06-28",
      "note": "CROSS-REFERENCE. The consequential action is taken via a third-party foundation model, so outsourcing systems-and-controls apply to the path. Outsourcing governance is not the obligation this gate primarily discharges — internal control over the action (SYSC 4.1.1R) is."
    }
  ]
}
```

This is the same gate already carrying EU AI Act Art 14 (human oversight): identical engineering control, second regulator's obligation named.

## STATUS — what's mapped

**Zero standards** (proposed only). Candidate set when authored (each pending a read of its actual `statement` + `gates` to confirm a firm-level control obligation sits behind the gate):

- **Zone 2 action control:** `GS5B1-01` (`SYSC 4.1.1R` — cleanest), `GC5B1-01` (`SYSC 7.1`).
- **Zone 1 ingress:** `GS4B2-01`, `GS1B3-01`, `GS1B3-02` (`SYSC 4.1.1R`; `SYSC 6.3` where financial-crime relevant).
- **Zone 3 output:** `GS2B1-01` (PRIMARY **PRIN 12 — Consumer Duty**; `SYSC 4.1.1R` cross-ref).
- **Cross-cutting band:** `GO3B2-01`/`GO3B2-02` (`SYSC 9.1` record-keeping), `GO1B1-04` (`SYSC 15A` operational resilience).

## Open items

- **Confirm every provision number against the live FCA Handbook** before authoring any reference (all proposed here are `unverified`). The Handbook updates continuously — record the exact "Mapped against" date when populating.
- Author the `fca_convention` + `framework_specific_reference_fields.fca` in `taxonomy.json`, and add the shape to `sections/framework_mappings/generate.json`, before populating data (README steps 3–4).
- **Confirm the firm only operates SYSC where it is in scope** — SYSC application varies by firm type (the Handbook's application provisions decide which SYSC chapters bind AVIA). The mapping asserts the *control*; whether a given SYSC chapter applies to AVIA is a firm-specific determination, not ours to assert.
- **Expected gaps to log, not force:** SM&CR individual accountability, threshold conditions (COND), and product-governance (PROD) obligations may be discharged by *no* current standard — record as future-standard candidates rather than mapping them onto unrelated standards.
- The SYSC→PRIN link on every reference is an **authored judgement**; flag it as such in review and never present it as an FCA-published crosswalk.
- FCA mappings are **not** surfaced as a sidebar filter (open UI work, same as AIGP / EU AI Act).
