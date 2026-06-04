# Principle Prioritization Tool

A free, self-contained workshop tool for any org that wants to take a published catalogue of AI architecture principles and produce its own per-org prioritization — which principles to adopt this quarter, which to defer, which to skip.

This tool is **not part of the catalogue**. The catalogue tells you what production-ready AI architecture looks like. This tool tells you what to do about it given your specific context.

---

## Why this exists

Frameworks like AWS Generative AI Lens, NIST AI RMF, ISO 42001, and the AIGP body of knowledge teach you to assess AI **systems** for risk. None of them teach you how to prioritize the **controls** that prevent the risks. The community gap, in one sentence: risk awareness ≠ control prioritization.

Most orgs end up doing this implicitly — "what's loudest this quarter?" — which produces inconsistent adoption, retrofit pain, and a portfolio of half-implemented principles. This tool replaces the implicit "loudest wins" with a four-axis assessment grounded in the cost of **not** implementing each principle.

---

## The four-axis assessment

Each principle is scored against four axes. Each axis asks the same question, framed for loss aversion: **"what does it cost the org if we do NOT implement this principle?"**

Asking "what's the value of implementing it?" instead invites optimism and double-counting. Asking what breaks if you skip it produces sharper, more honest scores.

### Axis 1 — Legal Risk Exposure

The regulatory, compliance, and litigation cost the org carries by NOT having this principle in place.

| Score | Anchor |
|---|---|
| 1 | No regulatory hook. Not adopting is purely an internal choice. |
| 2 | Soft compliance signal (industry guidance, internal policy, customer questionnaires). Not yet enforceable. |
| 3 | Mapped to a real regulation (GDPR, CCPA, SOX, NIST AI RMF, ISO 42001) but enforcement is rare or remote in your jurisdiction. |
| 4 | Direct regulatory mapping in scope, audit findings likely if a regulator inspects. Material fines possible. |
| 5 | Hard regulatory requirement that applies to you (EU AI Act Annex III for a high-risk system, SR 11-7 for a regulated bank, HIPAA for PHI handling). **Veto: any axis at 5 classifies the principle CRITICAL regardless of other scores.** |

### Axis 2 — Cost

The direct financial and operational cost the org absorbs by NOT having this principle in place — wasted spend, duplicated build effort, incident-response hours, manual reconciliation.

| Score | Anchor |
|---|---|
| 1 | Negligible cost. Skipping costs less than implementing. |
| 2 | Modest recurring cost (a few engineer-days per quarter) the org currently absorbs. |
| 3 | Significant cost (one engineer-week per month, or 5-figure annual spend), already visible in budgets. |
| 4 | Material cost (multi-week recurring engineering toil, or 6-figure annual spend) that finance can quote. |
| 5 | Strategic cost (engineering capacity routinely diverted, 7-figure spend or revenue loss). **Veto.** |

### Axis 3 — Customer Experience

The external impact on users, customers, or downstream consumers of the AI system if the principle is NOT in place — latency, hallucination rate, incident frequency, trust erosion.

| Score | Anchor |
|---|---|
| 1 | Internal-only. No customer-visible effect. |
| 2 | Minor customer impact in edge cases (occasional confusing output, rare latency spike). |
| 3 | Routine customer impact (regular complaints, measurable retention friction, support ticket volume). |
| 4 | Material customer impact (named in surveys, churn signal, NPS hit, public reputational risk). |
| 5 | Severe customer impact (safety risk, mass incident, brand-damaging headline territory). **Veto.** |

### Axis 4 — Org Readiness

The internal capacity cost — what the org loses by not having the org structures, skills, and operating model the principle enables. This axis flips direction: a HIGH score means **the org is not ready to operate without this principle**, i.e., NOT adopting it leaves a structural gap the org cannot work around.

| Score | Anchor |
|---|---|
| 1 | Org operates fine without it. No structural gap. |
| 2 | Mild gap. Teams work around it informally. |
| 3 | Operational friction. Cross-team coordination breaks down regularly without the principle's enforcement. |
| 4 | Structural blockage. The org cannot scale to its next stage (next project, next team, next region) without this principle in place. |
| 5 | Existential gap. The org has already publicly committed to a roadmap (regulator, board, customer) that requires this principle and cannot meet without it. **Veto.** |

---

## Scoring rules

1. Score each principle against each of the four axes on the 1–5 scale. Use the anchor descriptions verbatim — do not invent new shades of meaning.
2. **Veto rule:** any single axis at 5 classifies the principle CRITICAL. Stop scoring; the principle is locked in.
3. If no veto fires, compute the **weighted total** using the org's weights (see below). The classification follows the weighted total:
   - Weighted total ≥ 4.0 → **CRITICAL**
   - Weighted total 3.0–3.9 → **HIGH**
   - Weighted total 2.0–2.9 → **MEDIUM**
   - Weighted total < 2.0 → **LOW**
4. Rank principles within each band by weighted total (highest first). Within ties, use the principle's `prerequisites` field to break — a principle that unlocks others ranks above an isolated one.

---

## Per-org weighting

Default weights are equal (25% each). Adjust for context:

| Org context | Legal | Cost | CX | Org Readiness | Reasoning |
|---|---|---|---|---|---|
| Regulated finance / health | **45%** | 20% | 15% | 20% | Regulator-driven; compliance dominates. |
| B2C consumer product | 15% | 20% | **45%** | 20% | CX failures translate directly to churn and brand. |
| Early-stage startup | 10% | **40%** | 20% | 30% | Burn rate dominates; can't afford controls that don't pay for themselves quickly. |
| Mature enterprise scaling AI | 20% | 25% | 25% | **30%** | Org-structure gaps are the binding constraint, not money. |
| Default (uncertain) | 25% | 25% | 25% | 25% | Equal weights until you have evidence to shift. |

Document the chosen weights and the rationale in your prioritization catalog. The weights are an explicit per-org judgment — they should be revisited annually.

---

## Worked example — applied to GO3B2-01 (Centralised Observability SDK for AI Workloads)

Imagine a mid-size B2B SaaS company with 3 AI workloads in production and a 3-engineer platform team. Not in a regulated industry; processes some customer PII (support tickets, account data). Uses the default 25/25/25/25 weights.

| Axis | Score | Justification |
|---|---|---|
| Legal Risk Exposure | 3 | GDPR / CCPA exposure on PII leakage into traces, but no hard EU AI Act Annex III mapping. Real but not catastrophic in scope. |
| Cost | 4 | Three teams already on three different backends; finance spends ~2 weeks per quarter reconciling observability invoices; one incident took 4 hours that would have been 15 minutes with cross-team trace correlation. Material cost, finance can quote it. |
| Customer Experience | 2 | The principle is internal-facing. Incidents are slower to resolve without it, which has some indirect CX effect, but no direct customer-visible degradation. |
| Org Readiness | 4 | The 3-engineer platform team exists and can ship the thin version. Without the principle, the org cannot onboard the 4th and 5th AI workload (planned this year) without compounding the fragmentation — that's a structural blockage on the planned roadmap. |

No veto triggered (no axis at 5).

Weighted total = (3 × 0.25) + (4 × 0.25) + (2 × 0.25) + (4 × 0.25) = **3.25 → HIGH**.

Comparison: for the same principle at a regulated bank (Legal 45% / Cost 20% / CX 15% / Org Readiness 20%), the legal score would likely move to 4 (regulator could find them for PII in traces under SR 11-7-adjacent guidance), giving (4 × 0.45) + (4 × 0.20) + (2 × 0.15) + (4 × 0.20) = **3.70 → HIGH**, ranked higher within the band. For a B2C consumer product (15/20/45/20), the CX score might stay at 2 and the total drops to (3 × 0.15) + (4 × 0.20) + (2 × 0.45) + (4 × 0.20) = **2.95 → MEDIUM** — the bank prioritizes it; the consumer product defers.

Same principle, three different priorities, all defensible from the same rubric.

---

## Output — your prioritization catalog

The deliverable is a table with one row per principle in the source catalogue. Recommended columns:

| Principle ID | Title | Legal | Cost | CX | Org Readiness | Weighted Total | Classification | Rank Within Band | Notes |
|---|---|---|---|---|---|---|---|---|---|
| GO3B2-01 | Centralised Observability SDK | 3 | 4 | 2 | 4 | 3.25 | HIGH | 2 | Unlocks GENOPS04 lifecycle automation; ship Q3. |
| ... | ... | ... | ... | ... | ... | ... | ... | ... | ... |

Header rows in the catalog should also capture:

- **Assessed on:** YYYY-Q# — timestamp the assessment.
- **Org context summary:** 1–2 sentences naming the regulatory posture, scale, and team capacity that drove the weights.
- **Weights used:** the four axis weights with rationale.
- **Re-assessment cadence:** when this catalog is next re-run (recommended: quarterly for the first year, annually thereafter).

---

## Re-assessment

The four axes are not equally stable over time:

- **Legal Risk Exposure** changes when new regulations land (EU AI Act enforcement, sector-specific guidance). Re-score when a relevant regulation is announced or revised.
- **Cost** changes as the org's workload portfolio grows. A cost-3 principle becomes cost-5 once you have 10 workloads instead of 3.
- **Customer Experience** changes as the product evolves. A previously-internal AI feature shipped to end users moves the CX score sharply up.
- **Org Readiness** changes as the org hires, restructures, or makes platform investments. A structural gap can close in a quarter.

Recommended cadence: full re-assessment quarterly during the first year of catalogue adoption, annually thereafter. Always re-assess immediately after a regulatory change, a material headcount change, or a strategic roadmap commitment.

---

## Template — copy into your planning doc

```yaml
prioritization_catalog:
  assessed_on: "2026-Q3"
  org_context: "Mid-size B2B SaaS, 3 AI workloads in production, 3-engineer platform team, processes PII via support tickets, no high-risk EU AI Act systems."
  weights:
    legal: 0.25
    cost: 0.25
    customer_experience: 0.25
    org_readiness: 0.25
    rationale: "Defaults retained — no evidence yet to shift weights. Will reassess after Q4 audit."
  next_reassessment: "2026-Q4"
  principles:
    - principle_id: "GO3B2-01"
      title: "Centralised Observability SDK for AI Workloads"
      scores:
        legal: 3
        cost: 4
        customer_experience: 2
        org_readiness: 4
      veto_triggered: null
      weighted_total: 3.25
      classification: "HIGH"
      rank_within_band: 2
      notes: "Unlocks lifecycle automation principle. Ship the thin Python+1-backend version Q3, expand Q4."
    - principle_id: "<next>"
      # ...
```

---

## What this tool does NOT do

Be honest about scope:

- **It does not score the principle's intrinsic criticality.** A principle's catalogue-level metadata (impact_level, applicability, maturity_level, ownership.tier) describes what the principle is. This tool describes what it's worth to you.
- **It does not replace a regulatory risk assessment.** EU AI Act conformity assessments, NIST AI RMF profiles, ISO 42001 audits, and AIGP-domain risk reviews still need to happen. This tool helps you decide which controls to adopt first; it does not certify that you've assessed your AI systems for risk.
- **It does not produce a roadmap.** Once you have a ranked catalog, you still need to sequence the work against dependencies (`prerequisites` / `enables` on each principle) and against your team's available capacity per quarter.
- **It does not lock in forever.** Re-assessment is mandatory. A prioritization catalog that has not been revisited in 12 months is stale by definition.

If your org is in scope of a regulator that mandates a specific risk framework, that framework comes first. This tool is for orgs that have done the risk awareness work and need help with the next question: which control do we build this quarter?
