# Workshop redesign — three artefacts students must leave with

A student needs three things to build a reference implementation at their own company:

1. A **schema** they can adapt to their environment.
2. A **prioritisation method** to pick which principles matter, given 50+ candidates across GenAI / ML / Responsible AI.
3. A **centralisation decision** for each prioritised principle, so the central team and project teams know who owns what.

Each must be a takeaway *artefact*, not a concept. By the end of the day every student should hold three populated artefacts for at least one of their real workloads.

---

## Artefact 1 — The Principle Schema (adaptable)

**What the student leaves with:**
- The reference schema in editable form (JSON or YAML).
- Every field annotated **load-bearing** vs **convention** — so they know what they can rename or drop without breaking enforceability.
- One completed worked example (GO1B1-01 or similar) they can copy-paste and adapt.
- A short **fit-to-org checklist** — five questions like:
  - Does your schema have a way to mark a CI check as *required* (not advisory)?
  - Does it support both project-tier and enterprise-tier evidence shapes?
  - Does it allow more than one validator (e.g. you have multiple ARBs by domain)?
  - Does it cover the full lifecycle gates your org uses (pre-merge, pre-deploy, release, quarterly)?
  - Does it capture pattern-criticality (mandatory for Agentic, nice-to-have for RAG)?

**Why it matters:** most orgs already have a "principles document" — it's almost always all `statement` and no `gates`, no `validator`, no `evidence`. Once a student audits their own doc against this schema, the gap is undeniable. That's the conversion moment.

**Workshop delivery:** Block 1 walks the schema field-by-field, marks load-bearing vs convention, then has students score *one of their own org's existing principles* against the schema in 5 minutes. They find the gap. Hands-on, not slide-walk.

---

## Artefact 2 — The Prioritisation Worksheet

**What the student leaves with:**
- A scoring sheet that takes any candidate principle and outputs **tier-1 (do now) / tier-2 (do at scale) / wait / never**.
- ~20 AWS GenAI Lens best practices pre-scored as worked examples, so the student sees the method calibrated.
- Blank slots populated with the principles relevant to *their own* workload, scored during the workshop.

**Suggested scoring axes (5):**
- **Failure impact** — regulatory / customer-facing / internal-only / cosmetic (0–3).
- **Failure frequency** — every release / monthly / rare edge case (0–3).
- **Foundational?** — does anything else depend on this being in place? (binary, but acts as a tiebreaker — foundational principles are always tier-1).
- **Pattern breadth** — applies to all patterns the org runs / one pattern only (0–3).
- **Effort to enforce** — one-line CI gate / quarter of platform work / multi-team programme (0–3, inverted).

Tier-1 = high impact + foundational + broad coverage + bounded effort. Anything missing one of these slips to tier-2 or below.

**Why it matters:** "all principles matter" is the failure mode. The PDF's `applicability` + `maturity_level` fields are a start, but they're per-principle attributes — they don't produce a *ranking*. The worksheet does. It converts a 50-principle backlog into a defensible 8-principle day-one cut.

**Workshop delivery:** Block 3. Walk the scoring sheet, score 20 BPs together to calibrate, then students score their own workload's top candidates. They leave with a tier-1 list they can defend to their ARB.

---

## Artefact 3 — The Centralisation Decision Sheet

**What the student leaves with:**
- A one-page sheet — six dimensions (three benefit, three cost), each 0–3, a delta rule producing **centralise / project-local / grey-zone-default-project**.
- The sheet pre-applied to 3–4 worked examples (eval-runner library, centralised LLM SDK, drift monitor, brand-voice scorer) so the scoring is calibrated.
- The sheet populated by the student for each of their tier-1 principles from Artefact 2.

**Why it matters:** every ARB has the same fight three times — "should eval / SDK / security be central or project?" — and resolves it by political pull, not analysis. The sheet ends that fight. It also feeds budget and headcount planning: every principle marked *centralise* is a line item the platform team owns; every *project-local* one is a developer expectation.

**Position in the workshop:** Block 4. Not a separate concept; a continuation of prioritisation. Once students have their tier-1 list, the next question is *who owns each*. Same exercise, one extra axis.

**Naming note:** call it the **Platform-vs-Project Decision Sheet** in the workshop, not "centralisation_value rubric." First name describes the pain it solves; second is internal jargon.

---

## How the three artefacts compose

The schema tells you **what** an enforceable principle looks like.
The prioritisation worksheet tells you **which ones** to author first and in what order.
The centralisation sheet tells you **who owns each**.

Together they give the central team a budget request ("we own these 4 principles, here's the platform investment") and give project teams a checklist ("we must comply with these 6, here's the CI wiring").

Without all three, you get one of three predictable failure modes:
- Schema only → principles document with no enforcement plan.
- Schema + prioritisation, no centralisation → projects re-build the same thing 50 times.
- Schema + centralisation, no prioritisation → platform team builds for everything and ships nothing.

---

## Suggested 5-hour workshop structure

| Block | Time | Output |
|---|---|---|
| 1. Anatomy of an enforceable principle | 60 min | Schema template + gap-audit of student's own existing principle |
| 2. Five enforcement patterns through five case studies | 75 min | Pattern recognition cheatsheet (CI gate, centralised SDK, drift monitor, ARB evidence pack, config-as-code) |
| 3. Prioritisation — which, in what order | 60 min | Filled prioritisation worksheet — student's tier-1 list |
| 4. Centralisation — who owns each | 45 min | Filled platform-vs-project decision sheet for the tier-1 list |
| 5. Hands-on — author one principle end-to-end | 75 min | One drafted principle, with enforcement pattern and ownership tier, peer-reviewed |

Total: 5h 15m.

**The single sentence to sell the day:**

> *"You leave with three filled-in artefacts for a workload you actually own — a schema, a prioritised list, and a tier decision for each — that you can put on your ARB chair's desk Monday morning."*

That's the takeaway worth paying for. The five case studies are scaffolding for the artefacts, not the point of the day.

---

## Reframing Block 2 — five patterns, not five industries

Your current Block 2 ("five industries, five case studies") is the weakest link, and you flagged it. The reason: students pattern-match the industry, not the principle. Five healthcare/retail/fintech cases blur into one.

Stronger framing: **five enforcement patterns**, each illustrated by one principle, each shown with one industry case. The industry is the wrapper; the pattern is the learning.

Suggested five:

1. **CI-gated repo artefact** — versioned harness committed to repo, required status check (GO1B1-01, retailer returns triage)
2. **Centralised SDK / vendor consolidation** — every model call goes through one library (cross-project vendor sprawl example, fintech)
3. **Drift monitor with cadence + baseline** — scheduled re-evaluation against a versioned baseline (claims-triage agent, insurer)
4. **Pre-deploy ARB evidence pack** — enterprise-tier validator clicks artefact URLs at a gate (responsible-AI fairness sign-off, healthcare)
5. **Config-as-code path constraint** — architectural rule enforced by build-system path inspection (data-residency or tenant-isolation, public-sector)

Same number of case studies, but the takeaway compounds: students leave able to **classify** any new best practice they encounter into one of five enforcement shapes.
