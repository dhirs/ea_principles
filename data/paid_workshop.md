# Paid Workshop — 5 blocks

5-hour paid workshop on building enforceable AI architecture principles. Maven-style, sold to senior AI architects and technical leaders moving AI past prototype into regulated production. 500-student scale possible.

## Revised workshop strategy — 2026-06-10 (supersedes the block agenda below as the *delivered* structure)

The five-block design further down is now a **content reservoir** (prioritisation inputs, Platform-vs-Project sheet, enforcement patterns, hands-on authoring). The **delivered agenda and framing** is the three parts below.

**Scope boundary — state up front.** The workshop does NOT teach how to identify principles or derive standards. Assume a catalogue of standards + sized blueprints already exists (BAU work). The workshop *consumes* that catalogue. AWS GenAI Lens is positioned as a **source that feeds the Standards layer** — not a peer of principles/standards, and not re-derived in the room.

**New catalogue artefact — RI Blueprint (L1) vs RI Build (L2):**

- **RI Blueprint (L1)** — a *sized sketch* of a reference implementation: enough detail to estimate effort/complexity, but NOT a code-level build. Produced continuously in BAU, lives in the catalogue, does NOT enter the sprint.
- **RI Build (L2)** — the full, code-level reference implementation (artefacts, repo paths, CI gates). This is what a sprint produces.
- This resolves the prioritisation chicken-and-egg: you can't rank without effort estimates, and the blueprint is where the estimate comes from. **Prioritisation runs after blueprints exist.**

**EA operating pipeline:** Principles → Standards → RI Blueprint → Prioritisation → RI Build. Catalogue/BAU = Principles + Standards + RI Blueprint (continuous). **Quarterly sprint = RI Build only.** Prioritisation is the **gate** between them and sets the fixed quarterly build agenda. Each in-scope build runs as a **funded mini-project** — its own budget, named owner, RACI chart.

**The three parts:**

1. **Why principles matter** — three scenarios (Legal/PII, CX/drift, Cost/token) + AWS GenAI Lens deep-dive (how the Lens is structured & read). ~45–60 min.
2. **The prioritization framework** — ranks sized blueprints into the quarter's build agenda. The ranking *method* is paid IP — keep it out of marketing/intro material (titles only). ~60–90 min.
3. **One build, end to end** — pull one prioritised blueprint and build it into a full enforceable RI, live: Open the blueprint → Build out → Govern → Ship. The hands-on core; weight the most time here (~2–2.5 hr).

**Parked — NOT in the agenda:** a possible Part 4 on common build challenges + org structures (who leads, core team, supporting team, RACI/governance). Decision: only worth a full part if backed by real war stories + a concrete org example; otherwise fold challenges into Part 3 live and close with a short org-structure segment. Left out of the current agenda per user.

**Terminology fix:** "enforceable principle" is wrong — a principle is the abstract *why* and is NOT enforceable on its own; the enforceable artefact is the **standard** (and its RI). Use "what it takes to make a principle enforceable" or "enforceable standard," never "enforceable principle."

**Free intro funnel.** A free ~45-min intro session feeds the paid workshop. Its job: prove the problem + show ONE worked example, then sell. Bridge/CTA slide built — *"This Session Was the Why. The Workshop Is the How."* — listing the three workshop parts (titles only), the outcome ("a working enforceable RI in your own repo"), price ($500), date (e.g. July 10), and a sign-up CTA. The deprecated project-vs-enterprise failure-modes framing has been dropped from the intro.

**Diagram assets (repo root):** `ea-catalogue-pipeline-v2.svg` (Principles→Standards→RI Blueprint→Prioritize→RI Build), `workshop_three_part.svg` (the 3-part agenda), `workshop-bridge-slide.html` (free→paid CTA).

## What students walk out with

Five concrete artefacts, each populated for a workload they actually own:

1. **The reference-implementation schema template** — editable, every field marked load-bearing vs convention. Drop into Confluence and start authoring against it.
2. **A five-pattern enforcement cheatsheet** — CI-gated repo artefact / centralised SDK / drift monitor / ARB evidence pack / config-as-code path constraint. Classify any new best practice in 30 seconds.
3. **Populated prioritisation worksheet** for their own workload — eight business-context inputs filled in, ten candidate principles scored, defensible tier-1 list.
4. **Populated Platform-vs-Project Decision Sheet** — six-dimension scoring per tier-1 principle. Ends the recurring ARB fight over central vs local ownership. Feeds platform-team budget asks and project-team CI checklists.
5. **One fully-authored reference implementation** — student's chosen principle, schema'd, enforcement pattern, tier call, peer-reviewed in the room, repo-ready.

**Single-sentence sell:** *"You arrive with principles. You leave with reference implementations, a method to make more, and a defensible call on who owns each."*

## Foundational requirement — the workload manifest (mention up front)

Before any principle's gate can fire, the workload repo must contain a valid `manifest.yaml` at root declaring `workloads: [{ name, pattern, code_path, eval_path }, ...]`. The eval runner's first action on every PR is to load this file. No manifest = CI fails immediately, no other gate runs.

What this solves:

- **Routing pattern-specific gates.** The catalogue has dozens of principles each with `applicability` keyed by pattern. Without a manifest, the runner doesn't know which pattern(s) apply, so it can't decide which gates to fire.
- **Mixed-pattern monorepos.** Real repos often contain agent + RAG + classical-ML components in one place. Each needs its own pattern-specific gates against its own paths. The manifest's `workloads` list expresses this.
- **Catching mis-classification at PR time.** A team can't quietly ship agentic work disguised as "just an LLM." Pattern declaration is the first thing checked.
- **Single source of truth for portfolio tooling.** ARB dashboards, prioritisation tools, the principles UI — all read pattern from here.

Mention this in Block 1 as a precondition for everything else. It's the universal floor before the schema discussion lands. Without it, a 500-project org has no mechanical way to route gates to the right code.

## Pedagogical thread

Schema (what) → Patterns (filled-in shapes) → Prioritisation (which, in what order) → Centralisation (who owns each) → Authoring (do it for yours).

The connective tissue: every principle has an `ownership.tier`. The schema teaches you to encode it. The case studies show principles at different tiers in action. The Decision Sheet is how you defend the tier choice. Say that out loud at the start and again at the end.

## Block structure

### Block 1 — Anatomy of an enforceable principle (60 min)

**Goal:** by the end, every student can look at a "principle" in their own company and tell you whether it's actually enforceable or just an aspiration.

**Activities:**
- **Teach (~40 min):** walk the schema field by field, marking load-bearing (statement, gates, validator, evidence, ownership.tier) vs convention (impact_level, change_history shape). Show one worked example (GO1B1-01).
- **Self-audit (~10 min, solo):** each student takes one of their company's existing principles and circles what's missing compared to the schema. Most find their company's principle is just a `statement` with no gates, no validator, no evidence. That's the conversion moment.

**Key distinction reinforced:** principle ≠ reference implementation. The principle is the textual best practice (your company likely has these). The reference implementation is the schema'd artefact with gates and evidence that makes the principle bite.

**Scaling at 500:** lecture is one-to-many. Self-audit is solo against a worksheet — no facilitator-per-table.

### Block 2 — Five enforcement patterns through five case studies (75 min)

**Goal:** students leave able to classify any new best practice into one of five enforcement shapes.

**Method:** walk five filled-in reference implementations, each illustrating a different enforcement pattern. For each, ~2 min of principle context on screen, then 10–15 min deep walk of the reference implementation (paths, schema, CI workflow, branch protection setup, failure scenario showing what happens without it).

**The five patterns:**
1. CI-gated repo artefact (GO1B1-01 — eval harness)
2. Centralised SDK / vendor consolidation
3. Drift monitor with cadence + baseline (GO1B1-04)
4. Pre-deploy ARB evidence pack (RAI / fairness sign-off)
5. Config-as-code path constraint (data residency / tenant isolation)

**Optional 10-min exercise at the end:** students pick a 6th best practice (or one from their own org) and classify it into one of the five shapes. Pattern recognition, not authoring.

### Block 3 — Prioritisation (60 min)

**Goal:** turn a 50-principle backlog into a defensible day-one tier-1 cut. Two students from different industries should arrive at different tier-1 lists, both defensible.

**Teach the method (~30 min):**
- **Eight business-context inputs:** industry/regulatory exposure, use-case criticality (customer-facing vs internal), AI patterns in portfolio, deployment scale, existing engineering maturity, recent scars (incident-driven priority jumps), team capacity, time horizon.
- **Five scoring axes:** failure impact, failure frequency, foundational flag (binary), pattern breadth, effort given current maturity (inverted).
- **Tier-1 cut:** high impact + foundational + broad coverage + bounded effort.

**Calibration (~10 min):** score ~10 AWS GenAI Lens BPs together as a group.

**Exercise (~20 min):** students fill in their workload's eight context inputs and score ~10 candidate principles. Output: their tier-1 list.

### Block 4 — Centralisation (45 min)

**Goal:** for each tier-1 principle, decide platform-team-owned vs project-local. End the recurring ARB fight.

**The Platform-vs-Project Decision Sheet:**
- Three benefit dimensions: reuse_breadth, specialist_skill_required, portfolio_visibility_value
- Three cost dimensions: platform_build_and_maintain_cost, coordination_drag, context_fit_loss
- 0–3 scoring per dimension
- Delta rule: benefit_sum − cost_sum ≥ 2 → centralise; ≤ 0 → project-local; grey-zone (=1) → default project-local
- Hard veto: any `enterprise_qualification_rule` firing in the taxonomy overrides the rubric

**Calibration:** 3–4 worked examples (eval-runner library = centralise; per-project scenarios = project-local; central dashboard = centralise; brand-voice scorer = grey-zone).

**Exercise:** students score each of their tier-1 principles. Output: filled-in sheet with platform-team budget items and project-team checklist items separated.

### Block 5 — Hands-on: author one reference implementation (75 min)

**Goal:** student leaves with one fully-authored reference implementation, peer-reviewed, repo-ready.

**Activity:** student picks one principle from their tier-1 list. Authors the reference implementation against the schema using AWS GenAI Lens taxonomy as the working framework (substitute their own taxonomy later if their org has one — the schema doesn't care).

**Peer review:** breakouts of 4–5 students, each reviewing one other's draft against a tight rubric. At 500 students that's 100 breakout groups.

**Important caveat for the workshop:** they use *your* schema and *your* taxonomy. They bring their own *principle* (the best practice they want to make enforceable). Inventing taxonomy is a separate, much bigger exercise — not a 75-min slot.

## 500-student scaling notes

- Blocks 1–4 scale fine: lecture + solo worksheet, no facilitator-per-table needed.
- Block 5 is the hard one. Needs structured peer-review breakouts of 4–5 students each with a tight self-grading rubric. Optional async follow-up: students submit their reference implementation for facilitator review post-day.

## Responsible AI in the workshop

Skip a dedicated RAI block. Mention RAI in one slide as "exists, separate AWS lens at the URL, deeper treatment than the GenAI Lens, here's how it slots into your schema via the `concerns` cross-cut tag if you need it." The workshop sells enforceable principles + prioritisation + central/local; RAI is a separate course.

If asked: the method for applying RAI to a principle is two questions — (1) which lifecycle stages does this principle's gate fire at? (2) at those stages, do the gates mechanically enforce any of the 10 RAI dimensions? Tag only the cells where both are true. A tag without a matching gate is theatre.

## References

- The PDF draft of the workshop deck (Datawhistl branded) — *Why Enterprise AI Agents Fail Beyond The Demo*.
- `principles.json` — the source catalogue. Walk principles from here in Block 2.
- `ai_principles_server/agentflow/ri/<principle_id>/README.md` — reference implementations. Each Block 2 case study is one of these.
- `centralisation_value_rubric_draft.json` — the centralisation rubric (rename to Platform-vs-Project Decision Sheet for the workshop audience).
- `workshop_three_artefacts.md` — earlier design notes; this file supersedes.
