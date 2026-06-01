# Maven Lightning Session — Slide Deck Work-in-Progress

This file captures the drafted slide content for the Maven session "Why Enterprise AI Agents Fail Beyond The Demo" (tagline: "And how AI Architecture Principles Come To Your Rescue"). The deck has been used as a pressure test for the principles catalogue — many of the architectural decisions logged in `decisions.md` emerged directly from drafting these slides.

When resuming work, read this file alongside `taxonomy.json`, `principles.json`, `decisions.md`, and `lens_mapping.md`.

---

## Deck context

- **Title:** Why Enterprise AI Agents Fail Beyond The Demo
- **Tagline:** And how AI Architecture Principles Come To Your Rescue
- **Length:** 45 minutes, 20 slides
- **Audience:** Senior AI Developers, Architects, Project Managers, Programme Managers running multiple AI projects (not just one)
- **Tool:** Gamma (slide deck builder, accepts markdown)

## Deck structure

**Part 1 — Intro (slides 1–3)** — DONE prior to this session
Title; what this session is about / who it's for; what you'll leave with / why this matters.

**Part 2 — Diagnosis (slides 4–5)** — DONE prior to this session
- Slide 4: What Failure Looks Like — FTSE 100 retailer composite. Five named failure symptoms.
- Slide 5: Why This Happens — Two root causes: (1) no AI architecture principles, (2) person-dependent delivery.

**Part 3 — Solution framing (slides 6–9)** — DONE prior to this session
- Slide 6: The Fix — Enterprise-wide principles + governance to enforce them.
- Slide 7: What Already Exists — Cloud framework review (AWS, Azure, GCP, Databricks WAFs).
- Slide 8: How the Catalogue is Organised — Five pillars / fifteen focus areas. AWS-aligned, vendor-neutral.
- Slide 9: Anatomy of a Principle — Two zones. Zone 1 (table stakes, also in WAF): ID + Name, Pillar + Focus Area, Failure mode, The rule. Zone 2 (what makes it actionable, NOT in WAF): Enforcement points, Automation hooks, Evidence required, Applicability.

**Part 4 — Principle In Depth (slides 10–17)** — IN PROGRESS
Originally planned to feature PRIN_004 (Centralised Prompt Catalogue). **Switched mid-drafting to PRIN_007 — Production-Realistic Agent Testing** because it gave a cleaner contrast with the AWS GenAI Lens (GENOPS01-BP01) and tied directly back to symptom 1 from slide 4 ("8 projects stuck in UAT" / "Quality lived in the original architect's head").

**Closing (slides 18–20)** — OUT OF SCOPE for the current work.

---

## Symptom-to-principle mapping (worked out for the deck)

| Slide 4 symptom | Pin |
|---|---|
| 1 — 8 projects stuck in UAT | Project-level slice → PRIN_007 (production-realistic testing); enterprise-level slice → catalogue's existence (meta) |
| 2 — Every incident investigation from scratch | PRIN_009 (evidence-based decisioning) + traceability principles in P13 |
| 3 — 12 AI tooling contracts | PRIN_002 / P52 — purely portfolio-level by nature |
| 4 — Headcount up 4x | Aggregate consequence — no single principle pin |
| 5 — ARB reviewing blind | Catalogue's existence (meta) |

Symptoms 2 and 3 are concrete violations of specific principles. Symptoms 1, 4, 5 are mostly meta-failures justifying the catalogue's existence. Symptom 1 has both a project-level slice (PRIN_007) and a meta-level slice (catalogue itself).

---

## DRAFTED SLIDE CONTENT

### Slide 10 — Life Without a Principle (final iteration)

```
LIFE WITHOUT A PRINCIPLE
PRIN_007 — Production-Realistic Agent Testing

THE AGENT

The retailer processes ~2,000 returns/day across web and store.
Each one is a customer-submitted form: order ID, item, reason
for returning, condition described in the customer's own words.

Today: a call-centre human opens each form, looks up the order,
checks customer history, applies the policy, decides what to do.
Slow, expensive, ~15 FTE.

The Returns Triage Agent replaces that human for the
straightforward cases. It reads the form, pulls the order, checks
payment status and prior returns, sees whether the item was on
clearance, applies policy, produces a decision:

   AUTO_APPROVE   →  refund the card automatically
   HUMAN_REVIEW   →  escalate, something unusual
   REJECT         →  clear policy violation (e.g. final-sale item)

Live for 6 months in production. Built by one architect.

THE ISSUES — code changes cause retrospective failures

  Every code change causes failures that surface days or weeks
  after release, not at CI, not in UAT.

  - New developer ships a fix; CI green; code review approved
  - Three days later: a customer complains a legitimate return
    was rejected. Or Finance flags an unexpected over-refund.
    Or Risk asks "why did the agent decide X?" — nobody can answer.
  - Investigate. Patch. Ship. A week later, an unrelated failure
    surfaces. Same pattern. The team is always chasing yesterday's
    incident.

  Root cause: The architect's test harness — 50 real production
  return forms validated by hand — was never committed to the
  codebase. It left with them. The team's CI tests only cover
  happy paths; PR review can't catch production-realistic
  regressions.

THE PRINCIPLE THAT WOULD HAVE PREVENTED THIS

  PRIN_007 — Production-Realistic Agent Testing.

  Production scenarios are first-class versioned artefacts in
  the repo. The harness gates every PR and every prod deploy.
  Every new prod failure becomes a new scenario, committed and
  reviewed, gating all future releases.
```

**Notes on slide 10:**
- The "user-facing symptom" framing came from the user pushing back on early drafts. The key distinction is *symptom* (code changes cause retrospective failures) vs *cause* (tests on a laptop, not in CI). Lead with the symptom; the cause is a one-line follow-up.
- The "guardrails vs scenarios vs test data" distinction (see Key Concepts below) is implicit in this slide — explicit in slide 11.

### AWS-vs-PRIN_007 contrast (positioned within or after slide 10)

```
AWS GenAI Lens — GENOPS01-BP01, verbatim:

The entire content of this best practice, in one sentence:
build a curated ground-truth dataset of prompts and responses,
develop a testing harness that automatically runs models
against it as new versions become available, and track
performance across tests and metrics.

→ This is advice, not specification.
   No WHERE. No WHO. No WHEN. No proof of HOW.
   An architect cannot build to it. ARB cannot audit it.
   It satisfies a heading in a framework, not an engineering team.

PRIN_007 — written for architects to develop to:

  ┌──────────────────┬────────────────────────────────────────┐
  │ WHERE scenarios  │ <repo>/tests/production_scenarios/     │
  │ live             │ Committed code artefacts.              │
  │                  │ NOT GUIs. NOT notebooks. NOT laptops.  │
  ├──────────────────┼────────────────────────────────────────┤
  │ WHO can run them │ Any engineer with repo access.         │
  │                  │ pytest tests/production_scenarios/     │
  ├──────────────────┼────────────────────────────────────────┤
  │ WHEN they gate   │ Every PR into the integration branch.  │
  │                  │ Both checks configured as REQUIRED     │
  │                  │ status checks — advisory CI does not   │
  │                  │ satisfy the gate.                      │
  ├──────────────────┼────────────────────────────────────────┤
  │ HOW coverage     │ Every prod incident → new scenario     │
  │ grows            │ Code change without scenario → ADR     │
  │                  │ or merge blocked                       │
  ├──────────────────┼────────────────────────────────────────┤
  │ WHAT proves it   │ The passing CI run on the merge        │
  │ works            │ commit IS the proof — both checks are  │
  │                  │ non-bypassable via branch protection.  │
  │                  │ Project-tier principle: PA self-       │
  │                  │ attests at release. No separate audit  │
  │                  │ artefact list — the gate is the proof. │
  └──────────────────┴────────────────────────────────────────┘

AWS gives a heading. PRIN_007 gives a contract architects can
build to and a build system can enforce.
```

### Full PRIN_007 anatomy slide (Gamma-formatted markdown)

```markdown
# PRIN_007 — Production-Realistic Agent Testing

## Classification
- principle_id: PRIN_007
- pillar: P1 — Operational Excellence
- focus_area: P11 — Model Performance Evaluation
- impact_level: High

## AWS Mapping
- Lens: AWS Well-Architected Generative AI Lens
- Pillar: GENOPS — Operational Excellence
- Focus Area: Model performance evaluation
- Question: GENOPS01 — How do you achieve and verify consistent model output quality?
- Best Practice: GENOPS01-BP01 — Periodically evaluate functional performance

## Ownership
- tier: project
- validator: project_architect
- audit_mode: self_attestation_with_mechanical_evidence
- arb_role: dashboard_and_spot_check

## Statement
AI agent testing must include production-realistic conditions — edge cases, data variations, system integration scenarios — codified as versioned test artefacts in the workload repository, runnable by any team member with repo access, gated by automated CI.

## Gates (one gate at pre_merge, two-part check, both required status checks)
| Part | Check | Blocking |
|---|---|---|
| EXECUTION | Harness runs against every scenario in `tests/production_scenarios/` and all pass; folder must contain ≥N files | Yes |
| COVERAGE | If any file under `src/agent/` changed in the PR, then `tests/production_scenarios/` must also change — OR a linked ADR under `docs/adrs/` justifies the omission | Yes |

Both parts must be configured as **required status checks** on the integration branch (typically `develop` in git-flow, `main` in trunk-based) via branch protection. An advisory CI run that "passes" but isn't enforced as required does not satisfy this gate.

## Evidence
Empty. PRIN_007 is a project-tier principle: the CI gate above IS the proof. There is no external validator routinely clicking URLs — the build system is the validator. `artefacts: []`, `review_mode: "automated_only"`, `sign_off: "binary"`. The Coverage-exception ADR ledger under `docs/adrs/` is reviewed by the Project Architect at release self-attestation; ARB sees it only via aggregate dashboard or ~10% quarterly spot-check.
```

---

## Key concepts and framings developed during slide drafting

These framings emerged from iterative slide work and ended up improving the principle's specification itself. The slide drafting was a forcing function for catalogue clarity.

1. **"AWS gives a heading; PRIN_007 gives a contract"** — the catalogue's USP in one sentence.

2. **"You can pass the AWS checklist and still hit this failure"** — the FTSE retailer architect satisfied GENOPS01-BP01 (had a harness, ground truth data, evaluated periodically) and the failure happened anyway because GENOPS01-BP01 doesn't specify durability or transferability constraints. This is the sharpest argument for why the catalogue exists.

3. **WHERE / WHO / WHEN / HOW mnemonic** — the four things AWS leaves unspecified that our principles fill in. Audience-friendly recall structure. Use this whenever explaining the catalogue to a non-technical audience.

4. **"Code changes cause retrospective failures"** — the user-facing symptom framing, distinct from the engineering cause. This is the right way to introduce the failure on a slide (what the team experiences) before naming the cause (testing setup not in CI/CD).

5. **Guardrails vs Scenarios vs Test Data** — three different things, not one:
   - **Runtime guardrails** — validation rules inside the agent code (e.g. `if item.is_clearance: route_to(HUMAN_REVIEW)`). These ARE in the repo. They survive when the architect leaves (sort of — successor team inherits rules but not the rationale).
   - **Test scenarios** — descriptions of what should be tested for. The architect's tacit knowledge: "when X happens, agent must Y."
   - **Test data** — actual payloads. The architect's collected production return forms.
   The original PRIN_007 wording collapsed all three into "guardrails." The slide work forced the distinction. Scenarios + test data must be in the repo; guardrails are separate.

6. **Two-part gate (execution + coverage)** — the simplification (one gate, presence-only check) missed the coverage failure mode (new code without new scenario). The two-part gate at `pre_merge` is the smallest defensible version. EXECUTION = harness passes. COVERAGE = if agent code changed, scenarios changed too (or ADR justifies).

7. **Spell-checker as the simplest analogy** — when explaining to a non-engineering audience: you wrote a spell-checker, tested it with 50 misspellings on your laptop, never committed the tests; new dev makes a change, ships, "occured" no longer flagged. Same shape as the agent failure. Use this when the audience seems lost in the agentic vocabulary.

8. **Decoded AWS BP codes** — `GENOPS01-BP01` reads as: Operations pillar → Question 1 (Model performance evaluation) → Best Practice 1 (Periodically evaluate functional performance). Useful for the slide audience to understand the AWS structure.

---

## Slide-by-slide TODO

- **Slide 10 (Life Without a Principle / PRIN_007)** — Drafted. Iterated multiple times with user feedback. Current version captures agent setup → user-facing failure → root cause → the principle. **Final sign-off pending.**
- **Slide 11 (The Rule / PRIN_007 as concrete spec)** — Partially drafted (WHERE / WHO / WHEN / HOW table). May need refinement.
- **Slide 12 (Before — broken pattern, retail code snippet)** — Not yet drafted. Per original plan: short Python snippet showing scattered/uncommitted tests.
- **Slide 13 (After — principle applied)** — Not yet drafted. Per original plan: side-by-side diff against slide 12.
- **Slide 14 (Enforcement Points)** — Not yet drafted. Per original plan: Developer / ARB / Code levels. Per the current schema, this collapses into gates (PR-level CI) and evidence (ARB-clickable artefacts).
- **Slide 15 (Automation Hooks)** — Not yet drafted. Named, specific tooling (no fabricated vendor names).
- **Slide 16 (Evidence & Applicability)** — Not yet drafted. Should reference the 4 evidence artefacts + maturity/criticality applicability matrix.
- **Slide 17 (Zoom Out: Compound Effect)** — Not yet drafted. Should callback to slide 4's five symptoms and show portfolio-level effect.

---

## Notes on positioning

The slide deck has been an extremely effective pressure test for the principles catalogue. Every time the slide content struggled, the underlying principle had a gap. The slide drafting work drove:

- The Lens-as-universe model (see `decisions.md`)
- The `aws_mapping` field added to the schema (v1.3)
- The `enforcement` → `ownership` / `gates` / `evidence` split (v1.2)
- The two-part gate refinement (v1.3 simplification + correction)
- The four-artefact evidence model (replacing the original seven)

**Recommended pattern:** continue using the slide deck as a forcing function for catalogue clarity. If a slide is hard to explain, the underlying principle is incomplete.
