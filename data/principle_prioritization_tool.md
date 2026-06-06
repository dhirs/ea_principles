# Principle Prioritization Tool

A free, self-contained workshop tool for any org that wants to take a published catalogue of AI architecture principles and produce its own per-org prioritization — which principles to adopt first, which to defer, which to skip.

This tool is **not part of the catalogue**. The catalogue tells you what production-ready AI architecture looks like. This tool tells you what to do about it given your specific context.

---

## Why this exists

Frameworks like AWS Generative AI Lens, NIST AI RMF, ISO 42001, and the AIGP body of knowledge teach you to assess AI **systems** for risk. None of them teach you how to prioritize the **controls** that prevent the risks. The community gap, in one sentence: risk awareness ≠ control prioritization.

Most orgs end up doing this implicitly — "what's loudest this quarter?" — which produces inconsistent adoption, retrofit pain, and a portfolio of half-implemented principles. This tool replaces the implicit "loudest wins" with a strict priority ladder grounded in the cost of **not** implementing each principle.

---

## The priority ladder (lexicographic, not weighted)

Each principle is scored on four axes. Every axis asks the same question, framed for loss aversion: **"what does it cost the org if we do NOT implement this principle?"** Asking "what's the value of implementing it?" instead invites optimism and double-counting. Asking what breaks if you skip it produces sharper, more honest scores.

The four axes are **not blended into a weighted average.** They are a strict hierarchy. Higher rungs always outrank lower rungs, and no amount of a lower axis can compensate for a higher one:

```
  Rung 1   Legal / Compliance Risk   ALWAYS first
  Rung 2   Customer Experience       next
  Rung 3   Org Readiness             next
  Rung 4   Cost                      last
```

To order two principles, compare them on **Legal first**. The higher Legal score wins outright — nothing below it can pull the lower one ahead. Only when Legal *ties* do you look at Customer Experience. Only when CX ties do you look at Org Readiness. Cost is the final tiebreaker and **never promotes a principle above a higher rung** — it only orders principles that are already tied on Legal, CX, and Org Readiness.

Formally: rank by the tuple `(Legal, CX, Org Readiness, Cost)` in descending order, compared left to right; the first axis on which they disagree decides.

Two consequences this ladder forces, by design:

- **Any principle with real legal/compliance exposure outranks every principle without it** — regardless of cost, complexity, or how cheap the legal one is to build.
- **A pure cost principle can never reach the top.** A large Cost score cannot lift a principle past anything carrying Legal or CX weight.

---

## The four axes

Score each principle 1–5 on every axis using the anchors verbatim — do not invent new shades of meaning. The anchors are ordered to match the ladder (Legal, CX, Org Readiness, Cost).

### Axis 1 — Legal / Compliance Risk Exposure *(rung 1)*

The regulatory, compliance, and litigation cost the org carries by NOT having this principle in place.

| Score | Anchor |
|---|---|
| 1 | No regulatory hook. Not adopting is purely an internal choice. |
| 2 | Soft compliance signal (industry guidance, internal policy, customer questionnaires). Not yet enforceable. |
| 3 | Mapped to a real regulation (GDPR, CCPA, SOX, NIST AI RMF, ISO 42001) but enforcement is rare or remote in your jurisdiction. |
| 4 | Direct regulatory mapping in scope, audit findings likely if a regulator inspects. Material fines possible. |
| 5 | Hard regulatory requirement that applies to you (EU AI Act Annex III for a high-risk system, SR 11-7 for a regulated bank, HIPAA for PHI handling). |

### Axis 2 — Customer Experience *(rung 2)*

The external impact on users, customers, or downstream consumers of the AI system if the principle is NOT in place — latency, hallucination rate, incident frequency, trust erosion.

| Score | Anchor |
|---|---|
| 1 | Internal-only. No customer-visible effect. |
| 2 | Minor customer impact in edge cases (occasional confusing output, rare latency spike). |
| 3 | Routine customer impact (regular complaints, measurable retention friction, support ticket volume). |
| 4 | Material customer impact (named in surveys, churn signal, NPS hit, public reputational risk). |
| 5 | Severe customer impact (safety risk, mass incident, brand-damaging headline territory). |

### Axis 3 — Org Readiness *(rung 3)*

The internal capacity cost — what the org loses by not having the org structures, skills, and operating model the principle enables. A HIGH score means **the org is not ready to operate without this principle**: not adopting it leaves a structural gap the org cannot work around.

| Score | Anchor |
|---|---|
| 1 | Org operates fine without it. No structural gap. |
| 2 | Mild gap. Teams work around it informally. |
| 3 | Operational friction. Cross-team coordination breaks down regularly without the principle's enforcement. |
| 4 | Structural blockage. The org cannot scale to its next stage (next project, next team, next region) without this principle in place. |
| 5 | Existential gap. The org has already publicly committed to a roadmap (regulator, board, customer) that requires this principle and cannot meet it without it. |

### Axis 4 — Cost *(rung 4)*

The direct financial and operational cost the org absorbs by NOT having this principle in place — wasted spend, duplicated build effort, incident-response hours, manual reconciliation.

| Score | Anchor |
|---|---|
| 1 | Negligible cost. Skipping costs less than implementing. |
| 2 | Modest recurring cost (a few engineer-days per quarter) the org currently absorbs. |
| 3 | Significant cost (one engineer-week per month, or 5-figure annual spend), already visible in budgets. |
| 4 | Material cost (multi-week recurring engineering toil, or 6-figure annual spend) that finance can quote. |
| 5 | Strategic cost (engineering capacity routinely diverted, 7-figure spend or revenue loss). |

---

## The evidence rule

A score is not a judgment — it is a claim that must be backed by a named, quotable artifact. The burden of proof rises with the number:

- **1–2** may be qualitative — anecdote, a support thread, "we think."
- **3** needs a real but soft figure — something visible in a budget line or a ticket count.
- **4–5** require a hard, sourced number a third party would sign off on. A Legal 5 means an actual regulation in scope and a named clause or letter, not "regulators might care." A Cost 5 means finance can point at the invoice line. **No artifact → you cannot write a 4 or 5.**

Anti-gaming: **set the 4 and 5 thresholds before you score, per axis, as concrete org numbers** (e.g. "Cost 5 = ≥ \$1M/yr of quantified, addressable waste"). Agree the line first, then go measure. You do not get to look at the measurement and decide afterwards where the line was.

Default when evidence is thin: **take the lower score.** Innocent until evidenced.

---

## Ordering rules

1. Score each principle 1–5 on all four axes, evidenced per the rule above.
2. Rank by the tuple `(Legal, CX, Org Readiness, Cost)` descending, compared left to right. The first axis on which two principles disagree decides their order. This is the strict priority order.
3. **Dependency inheritance.** A high-ranked principle that hard-depends on a lower-ranked one does not wait, and the prerequisite is not demoted. The prerequisite **inherits the rank of the most important principle that needs it** and is hoisted to immediately precede it. Critical work gets built regardless of its prerequisites' own scores — you absorb the prerequisites into its delivery. Soft dependencies are not hoisted; a principle ships without them.
4. The catalogue's `dependencies` field carries the hard/soft edges. Walk the ranked list top-down; for each item, pull any unbuilt **hard** prerequisites in front of it, tagged with that item's rank.

The order is universal — the ladder (Legal > CX > Org Readiness > Cost) does not get re-weighted per org. What differs per org is the *evidenced scores*, not the ranking of the axes.

---

## Worked example — applied to the catalogue

A mid-size B2B SaaS company, 3 AI workloads in production, processes customer PII via support tickets, no high-risk EU AI Act systems.

**GO3B2-02 (govern read access + retention on observability traces).** Intrinsic `impact_level` is High, but that is not its priority — its priority comes from the axes. The traces carry PII, so GDPR/CCPA access-and-retention obligations apply directly → **Legal 4** (sourced: the PII inventory shows ticket data flows into traces; counsel confirms retention scope). CX 1 (internal-facing), Org 3, Cost 2. Tuple `(4,1,3,2)`. No other principle scores Legal 4, so it ranks **first** — even though its CX is the lowest possible and it is only a `scaling`-tier principle.

GO3B2-02 hard-depends on **GO3B2-01** (the observability SDK that emits the traces). GO3B2-01's own tuple is `(3,3,4,3)` — it would rank lower on its own. But it is the hard prerequisite of the top principle, so it **inherits rank 1** and builds immediately before GO3B2-02.

Contrast: **GC3B3-01 (prompt caching).** Suppose the org is bleeding on inference. The temptation is to call this critical. But Cost is rung 4. Even a sourced Cost 5 (finance quotes \$1.2M/yr of cacheable waste) cannot lift it past anything with Legal or CX weight. Its tuple is `(1,2,2,4)` — Legal 1, CX 2 — so it lands at the **bottom** of the build order, alongside the other pure-cost principles. The cost bleed is real, but under this ladder cost never jumps the queue. That is the rule working as intended, not against you.

Same four scores, one strict order, no weighting knob to argue over.

---

## Output — your prioritization catalog

The deliverable is a table with one row per principle, sorted in build order. Recommended columns:

| Rank | Principle ID | Title | Legal | CX | Org | Cost | Inherited? | Notes |
|---|---|---|---|---|---|---|---|---|
| 0 | GO3B2-01 | Centralised Observability SDK | 3 | 3 | 4 | 3 | yes — hard prereq of GO3B2-02 | Build first to unblock rank-1 legal item. |
| 1 | GO3B2-02 | Govern trace access + retention | 4 | 1 | 3 | 2 | no | Legal-4: PII in traces. Top priority. |
| … | … | … | … | … | … | … | … | … |

Header rows in the catalog should also capture:

- **Assessed on:** YYYY-Q# — timestamp the assessment.
- **Org context summary:** 1–2 sentences naming the regulatory posture, scale, and team capacity.
- **Thresholds used:** the pre-agreed org-specific numbers for the 4 and 5 anchors on each axis.
- **Re-assessment cadence:** when this catalog is next re-run (recommended: quarterly for the first year, annually thereafter).

---

## Re-assessment

The four axes are not equally stable over time:

- **Legal** changes when new regulations land (EU AI Act enforcement, sector-specific guidance). Re-score when a relevant regulation is announced or revised — and remember a Legal move reshuffles the whole order, because it is rung 1.
- **Customer Experience** changes as the product evolves. A previously-internal AI feature shipped to end users moves the CX score sharply up.
- **Org Readiness** changes as the org hires, restructures, or makes platform investments. A structural gap can close in a quarter.
- **Cost** changes as the workload portfolio grows — but a rising Cost score only re-orders principles already tied on the three rungs above it.

Recommended cadence: full re-assessment quarterly during the first year of catalogue adoption, annually thereafter. Always re-assess immediately after a regulatory change, a material headcount change, or a strategic roadmap commitment.

---

## Template — copy into your planning doc

```yaml
prioritization_catalog:
  assessed_on: "2026-Q3"
  org_context: "Mid-size B2B SaaS, 3 AI workloads in production, processes PII via support tickets, no high-risk EU AI Act systems."
  ladder: ["legal", "customer_experience", "org_readiness", "cost"]  # fixed order, not re-weighted
  thresholds:
    legal_5: "Hard regulation in scope with a named clause/letter."
    cost_5: ">= $1M/yr quantified, addressable waste (finance-sourced)."
  next_reassessment: "2026-Q4"
  principles:
    - rank: 0
      principle_id: "GO3B2-01"
      title: "Centralised Observability SDK for AI Workloads"
      scores: { legal: 3, customer_experience: 3, org_readiness: 4, cost: 3 }
      inherited_from: "GO3B2-02"   # hoisted as hard prereq
      notes: "Build first to unblock the rank-1 legal item."
    - rank: 1
      principle_id: "GO3B2-02"
      title: "Govern read access and retention on AI observability traces"
      scores: { legal: 4, customer_experience: 1, org_readiness: 3, cost: 2 }
      inherited_from: null
      notes: "Legal-4: PII in traces under GDPR/CCPA. Top of the build order."
    - rank: 2
      principle_id: "<next>"
      # ...
```

---

## What this tool does NOT do

- **It does not score the principle's intrinsic criticality.** A principle's catalogue metadata (`impact_level`, `applicability`, `maturity_level`, `ownership.tier`) describes what the principle *is*. This tool describes what it is *worth to you*, and in what order to build it.
- **It does not replace a regulatory risk assessment.** EU AI Act conformity assessments, NIST AI RMF profiles, ISO 42001 audits, and AIGP-domain reviews still need to happen. This tool decides build order; it does not certify your systems are risk-assessed.
- **It does not let you re-weight the ladder.** The axis order (Legal > CX > Org Readiness > Cost) is fixed. Per-org judgment lives in the *evidenced scores*, not in the ranking of the axes.
- **It does not lock in forever.** Re-assessment is mandatory. A prioritization catalog not revisited in 12 months is stale by definition.

If your org is in scope of a regulator that mandates a specific risk framework, that framework comes first. This tool is for orgs that have done the risk-awareness work and need help with the next question: which control do we build first?
