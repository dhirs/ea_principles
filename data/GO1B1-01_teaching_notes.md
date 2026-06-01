# GO1B1-01 — Teaching notes

Detailed instructor reference for walking GO1B1-01 in the workshop. Mirrors the 6 sections of the production reference implementation at `ai_principles_server/agentflow/ri/GO1B1-01/README.md`, with worked examples, anticipated student questions, and failure-mode framing.

---

## Setup before showing the slide

Anchor the audience with the failure scenario they recognise.

> A major retailer ships a Returns Triage Agent — reads free-text return forms, decides AUTO_APPROVE / HUMAN_REVIEW / REJECT. Live 6 months. The original architect hand-validated 50+ real return forms in a Jupyter notebook before each release. The notebook never got committed. The architect leaves. Next release ships with green CI. Three weeks later: customers complain about legitimate returns being rejected; Finance flags a surge in unexpected refunds. The team investigates for two weeks, patches it, ships. A week later another regression surfaces the same way. They are always chasing yesterday's incident.

That's the failure GO1B1-01 prevents. Hold this scenario in everyone's head — every section below ties back to "what specifically prevents this."

---

## Section 1 — principle_id

**On the slide:** "GO1B1-01 — Maintain a versioned ground-truth evaluation harness for agent decisions in the workload repository."

**What to emphasise:**
- The principle is a *rule*, not an implementation. It says what must hold, not how to do it.
- Reference implementation is separate. The principle is one paragraph in `principles.json`; the reference implementation is this whole document.
- Anchored to AWS GENOPS01-BP01 implementation step 1 ("Create a ground truth dataset"). AWS gives the heading; we give the contract.

**Anticipated student question:** *"Why do we need our own principle if AWS already has a best practice?"*
Answer: AWS says "have a ground truth dataset." It does not say where it lives, who validates it, when it gates, or how you prove it. Our principle fills those slots. Without them, AWS's heading is a goal not a rule.

---

## Section 2 — tier_outcome

**On the slide:** "tier_outcome: recommended_centralise → ownership.tier: enterprise. D1=no, D2=3."

**What to emphasise:**
- Tier is decided by the rubric, not by gut feel. Two dimensions: D1 (legal exposure veto) and D2 (repeatability cost).
- For GO1B1-01: no regulator mandates a harness format, so D1=no. But the runner, diff tool, CI template, manifest validator, scenario-schema validator all repeat as **weeks of platform engineering per project** if local — so D2=3. Net: enterprise tier.
- Tier here means "central team builds and maintains the enforcement infrastructure." It does NOT mean ARB has to click evidence URLs. Validation stays project_architect self-attestation with mechanical evidence — the two axes are decoupled.

**Anticipated student question:** *"If the validator stays project, what does enterprise tier actually change?"*
Answer: who builds and maintains the tooling. Enterprise tier means the platform team owns eval-core / CLI / templates. Project team consumes those, doesn't rebuild them. Without this distinction, 100 projects each build their own runner — that's the failure mode the tier rubric prevents.

**Anticipated student question:** *"What if our org doesn't have a platform team?"*
Answer: then enterprise-tier principles are aspirational until you have one. In practice the first 1–2 mature AI projects often staff the platform team via secondments — they build eval-core as a side-effect of their own work, then donate it. That's a legitimate path; just record it explicitly.

---

## Section 3 — central_team

**On the slide:** "Central team builds: eval-core library, CLI, schemas, CI templates, adversarial library, dashboard. Operates: semver, patches, on-call. Owns: `<platform-repo>/eval-core/` and similar."

**What to emphasise:**

The platform team's deliverables fall into three buckets:

1. **The runner and grading engine (`eval-core`).** This is the executable that loads scenarios, invokes the project's adapter, grades the output. Pure platform infrastructure — every project would write this if left local. Weeks of work. Versioned package.

2. **The schemas and validators.** `manifest.yaml` schema (workload routing), scenario file JSON schema (input + expected_decision + expected_evidence_trace), runner config schema. These are the *contract* between platform and project. If a project deviates from the schemas, the runner refuses to start — that's how you enforce consistency across projects without per-project review.

3. **The reusable CI workflow templates.** GitHub Actions / GitLab CI snippets the project includes with `uses: <org>/eval-workflows/...`. Project doesn't write CI plumbing; they include one line. Centralising this also catches CI drift — if the central template advances, every project picks it up on next major bump.

**Operations** is the part students underestimate. A central library isn't a one-off build; it's an ongoing commitment — patches, security updates, schema migrations, on-call when CI breaks across projects. Budget for it. Without operations, the central platform decays and projects fork their own runner anyway — exactly what you wanted to prevent.

**Optional bonus deliverable: the central adversarial library.** A platform-team-curated inventory of jailbreak templates, prompt-injection patterns, edge cases — kept in `eval-core/scenarios/adversarial/`. Project scenarios reference IDs from it. This lets you set a coverage gate ("every project must reference ≥N adversarial templates") without each project re-inventing what adversarial means.

**Anticipated student question:** *"What if our central library is wrong for our project's domain?"*
Answer: the central library is shared adversarial *patterns*, not domain-specific scenarios. A jailbreak attempt looks similar whether you're triaging returns or approving loans. The domain content is local; the patterns are central. If a pattern doesn't fit, contribute back — that's how the central library improves.

---

## Section 4 — project_team

**On the slide:** "Project team configures: manifest, adapter, config, CI workflow, branch protection. Populates: scenarios, data. Consumes via: pip install eval-core, CI template uses:, central adversarial IDs."

**What to emphasise:**

The project team's job is much smaller than the central team's. Three buckets:

1. **Configures (one-time setup, then rare touches).** `manifest.yaml` declares what the workload is (pattern + paths). `eval/adapter.py` is the only project-specific code — a tiny function that knows how to invoke the agent (whether that's an in-process Python call, a Lambda invoke, a Step Function execution). `eval/config.yaml` points the runner at the adapter. `.github/workflows/eval.yml` includes the central CI template. **Branch protection** is the bit teams forget — the CI check has to be marked *required*, otherwise the gate is advisory and a developer can merge red. This is the difference between a real gate and a fake one.

2. **Populates (the ongoing work).** Scenarios. The expensive, human-curated, domain-specific content. Each scenario is `input + expected_decision + expected_evidence_trace`. Authored by a domain expert plus the architect. Grows with every customer-reported regression. The principle doesn't mandate a count — start with 10, grow.

3. **Consumes via standard package management.** `pip install eval-core` is one line. The CI template is one `uses:` line. No bespoke integration code on the project side.

**The split is the point.** Without it, every project re-invents the runner. With it, every project's *content* is unique and its *infrastructure* is shared. That's the leverage.

**Anticipated student question:** *"Can a project bypass the central runner if it has special needs?"*
Answer: yes, but it costs them. They lose the diff tool, the dashboard, future schema migrations, and any central library coverage gates. The escape hatch exists but the gravity is toward consumption. Most "special needs" turn out to be missing features in eval-core; contribute back rather than fork.

**Anticipated student question:** *"What goes in `eval/adapter.py` if the agent is in another language?"*
Answer: the adapter is whatever shells out to your agent. Python is the lingua franca for eval-core, but the adapter can `subprocess.run(...)` a Go binary, hit a local HTTP endpoint, or invoke a deployed Lambda. As long as it returns the contracted dict shape, the runner doesn't care what's behind it.

---

## Section 5 — interface_contract

**On the slide:** show the four schemas (adapter signature, manifest, scenario file, runner config) side by side, with semver policy and grading semantics underneath.

**What to emphasise:**

The interface contract is the *only* thing platform and project teams negotiate over. Everything else is independent.

**Adapter signature** is the single most important contract. It defines the project's escape hatch — as long as `run_scenario(input_payload: dict) -> dict` returns the right shape, the project can do *anything* internally to get there. Step Function, Lambda, in-process call, REST API, gRPC — all hidden behind the function call.

**Manifest schema** is the routing table. The runner's first action: load and validate this. No manifest = CI fails immediately, no other gate runs. Mixed-pattern monorepos declare multiple sub-workloads; the runner fires pattern-specific gates against each.

**Scenario file schema** is the testing contract. Three required fields (`input`, `expected_decision`, `expected_evidence_trace`) plus metadata (`scenario_id`, `tags`). The `expected_evidence_trace` is the bit most teams miss — it grades the agent's *reasoning path*, not just its output. An agent that produces the right decision for the wrong reason is a silent regression; the trace catches it.

**Runner config schema** is small but matters — it tells the runner which adapter to use, which environment, what timeout. Two adapters per project is the mature pattern (in-process for PR-time speed; staging for nightly end-to-end).

**Versioning policy.** `eval-core` is semver. Projects pin major. N-1 supported. When the platform team ships a breaking change, projects have a quarter to migrate. This is what stops platform team velocity from breaking project teams.

**Grading semantics** — the precise rules for what counts as a passing scenario. Decision match with acceptable_alternatives (so the harness doesn't fail on minor defensible variation). Evidence trace substring match against must_consult / must_apply_rules / must_not_invoke. Hard failures are adapter raises, timeouts, malformed output.

**Anticipated student question:** *"What if our agent's reasoning trace is a giant blob of JSON, not a clean list?"*
Answer: grading does substring match against the serialised trace by default. Works for most cases. For complex traces — multi-turn agent reasoning, tool-call sequences — eval-core supports an LLM-as-judge grader plugged in via config. That's GO1B1-03's territory (metrics encapsulation).

**Anticipated student question:** *"Who owns the schema if a project needs a new field?"*
Answer: schema changes are platform-team decisions. Projects propose via PR; platform team reviews. If a field is truly project-bespoke, it goes in a `project_extensions` block that the central runner ignores — keeps the contract clean. Schema evolution follows semver.

---

## Section 6 — acceptance_criteria

**On the slide:** the 7-item checklist verbatim.

**What to emphasise:**

These are the items the project architect ticks off when self-attesting GO1B1-01 is satisfied. **Each is mechanically verifiable** — no judgement calls. CI logs and repo URLs are the evidence.

Walk each item briefly:

1. **`manifest.yaml` exists and validates.** This is the foundational gate from the manifest decision. No manifest = no further evaluation. Period.

2. **At least one sub-workload declares `pattern: agentic`.** GO1B1-01's applicability is agentic-only. If the project doesn't run an agentic workload, this principle simply doesn't apply — and that's fine. The acceptance criterion makes the applicability check explicit rather than implicit.

3. **`eval/scenarios/` has ≥10 scenario files validating against the schema.** Ten is the minimum to have meaningful coverage; the principle expects this to grow. Each must parse — a malformed scenario silently skipped would defeat the gate.

4. **`eval/adapter.py` exists and is referenced by `eval/config.yaml`.** Without this the runner has nothing to call.

5. **CI workflow exists and invokes `eval-core run`.** Not just a workflow file — one that actually executes the harness.

6. **CI job is a required status check.** This is the bit that bites. Without branch protection wiring, the CI gate is advisory — a developer can merge red. The principle explicitly excludes advisory runs (called out in GO1B1-01 v1.1.0). If this isn't ticked, the principle is not satisfied, full stop.

7. **Latest `eval-core run` exits 0 on the integration branch.** Snapshot proof the gate is currently passing. Stale failing CI = principle not satisfied even if everything else is in place.

**Anticipated student question:** *"What if we have legacy scenarios that fail and can't be fixed yet?"*
Answer: tag them with `quarantine: true` in the scenario file. Eval-core supports a quarantine list — quarantined scenarios run but their failures don't block the gate. They become technical debt visible in the dashboard. Quarantine has a TTL; after 90 days quarantined scenarios fail blocking. Forces the team to fix or delete.

**Anticipated student question:** *"What if ARB doesn't trust project self-attestation?"*
Answer: ARB doesn't have to. The taxonomy says enterprise-tier with `audit_mode: self_attestation_with_mechanical_evidence` means ARB *spot-checks* ~10% per quarter via the dashboard. The mechanical evidence (CI logs, repo URLs) is auditable; ARB only inspects when the dashboard flags an anomaly. This federates the audit work — PAs are the first line, ARB is the safety net.

---

## Walk-through of the failure scenario WITH the principle in place

Worth showing at the end to close the loop.

> Same retailer. Same Returns Triage Agent. The original architect leaves. But this time GO1B1-01 is in place and satisfied.
>
> A successor developer opens a PR to fix a bug. They change `src/agent/returns_triage/`. CI fires. The eval-core runner loads the manifest (returns_triage is `pattern: agentic`), looks up the agentic principles, fires GO1B1-01's gate against `eval/returns_triage/scenarios/`. The harness runs all 47 committed scenarios. Three of them fail because the bug-fix changed a code path that affected scenarios it shouldn't have. **CI is red. Merge is blocked.**
>
> The developer reads the failures. Two are real regressions — they fix the underlying bug differently. One is a scenario that needs updating because the policy actually did change. They update the scenario, link to the policy change in the PR description. CI goes green. Merge proceeds.
>
> Three weeks later: nothing happens. No customer complaints. No Finance escalation. No investigation. The scenario library grew by one. The codebase is now smarter than it was. Each release leaves it smarter still.

**The architect's tacit knowledge survived their departure** because the principle forced it into the repo as a first-class artefact. The successor team inherited a discipline they could run, not a notebook they couldn't reproduce.

---

## Common pushback to anticipate

**"This sounds like a lot of central team investment."**
Yes. Estimate honestly: eval-core is roughly 2–3 person-months for v1, then a part-time owner ongoing. That investment serves N projects — by project 5 it's break-even; by project 20 it's massive leverage. The alternative (every project rebuilds) costs N × person-weeks.

**"What about projects that aren't agentic?"**
Different principles apply. RAG projects follow a RAG-equivalent harness principle (not yet authored in the catalogue — `UNMAPPED` in `lens_mapping.md` for now). LLM-only projects follow an LLM-only equivalent. The manifest's `pattern` field routes gates correctly. GO1B1-01 specifically doesn't fire on non-agentic workloads.

**"This feels heavyweight for a small team."**
The minimum viable is 10 scenarios + an in-process adapter + a one-line CI workflow + branch protection. That's a day's work once eval-core exists. The weight is in *building* eval-core (platform team's job, once for the whole org) — not in *consuming* it (project team's job, every project).

**"How does this interact with the other GO1B1 siblings?"**
GO1B1-01 establishes the harness. GO1B1-02 stratifies it. GO1B1-03 encapsulates the metrics. GO1B1-04 monitors drift post-deploy. GO1B1-05 refreshes the harness on a cadence. They compose — same `eval/` folder, different files, different gates. Together they close the loop from authoring through production. GO1B1-01 is the foundation; nothing downstream works without it.

---

## What to skip if running short

If Block 2 timing gets tight:
- Skip the central adversarial library (mention it exists, move on).
- Skip the staging adapter (mention there are two flavours, focus on in-process).
- Skip the quarantine mechanism (only comes up if a student asks).

Keep no matter what:
- The failure scenario at the start.
- The platform-vs-project split (sections 3 and 4).
- The branch-protection point in acceptance criterion 6.
- The "with the principle in place" walk-through at the end.

Those four points carry the lesson. Everything else is depth for questions.
