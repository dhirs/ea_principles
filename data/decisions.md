# Decisions Log

Append-only journal of decisions about the AI architecture principles catalogue.

When starting a new session, read this file alongside `taxonomy.json`, `principles.json`, `lens_mapping.md`, and `slides.md` to pick up context.

Entries are dated. Newest entry at the top.

---

## 2026-06-23 (latest) — AIGP mappings audited + re-based on official BoK v2.1 (17 verified, 7 cleared)

### Context

The `aigp` mappings were placed by "subject-matter proximity" and, on inspection, used **incorrect competency labels** — a half-remembered version of the retired 7-domain AIGP structure. The official IAPP AIGP Body of Knowledge is now **v2.1 (effective 2026-02-02), 4 domains**. Pulled the real competency definitions (IAPP BoK + Oliver Patel's competency breakdown) and re-based every mapping.

### Decision — re-tag against real competencies via the "IS how we do X" test

A standard earns an `aigp` reference only if its enforced mechanism IS a concrete way of delivering the competency (not "same topic, roughly"). Result across 24 standards:

- **17 tagged + verified.** III.B (data in training/testing): GO1B1-01/02/05, GS6B1-01, GS1B3-02. III.C (release/monitoring/maintenance): GO1B1-04, GO1B1-06, GO3B2-01. IV.C (deployment & use): GO3B2-02, GC5B1-01, GS1B3-01, GS2B1-01, GS4B2-01, GS5B1-01. I.C (lifecycle policy): GO3B1-01. IV.A (deploy decision): GC1B1-01. IV.B (assess system): GO1B1-03.
- **7 cleared — no natural fit** (AIGP has no cost/FinOps or reliability-engineering competency): GC2B2-01, GC3B1-01, GC3B2-01, GC3B3-01, GC4B1-01, GR3B1-01, GR3B2-01. Cleared, not force-fitted (user directive: "do not push the mapping if one does not exist naturally").
- All surviving refs flipped `unverified → verified`; each standard got a version bump + change_history entry.
- Note: GO1B1-04 previously had **no** aigp ref — now III.C. So "tagged" count rose by the add and fell by the 7 removals: 23→17.

### Refresh / keeping-current

Added a **"Keeping mappings current"** procedure to `data/framework_mappings/README.md` (per-framework, driven by each doc's new **"Mapped against"** + **"Last reviewed"** anchors). `aigp.md` now records *Mapped against: BoK v2.1*. Recommended shape for a future `/refresh`: a guided per-framework re-check (drift detect + judgement-assisted re-audit), with a cheap quarterly scheduled task doing only version-drift detection autonomously. Not built this session.

### Artefacts

- `data/principles.json` — 17 `aigp` blocks rewritten (verified) + 7 removed; per-standard version bumps + change_history; parses clean, 24 standards, format_version unchanged (1.13 — no schema change, `aigp` field shape unchanged).
- `data/taxonomy.json` — `framework_mappings_spec.aigp_convention` authored (was the one populated framework with no convention).
- `data/framework_mappings/aigp.md` — corrected competency labels, examples, STATUS, refresh anchor; `README.md` — refresh procedure.

### Open items

- AIGP not yet surfaced as a sidebar filter (open UI work).
- Re-audit on the next BoK release.

---

## 2026-06-23 — Per-framework mapping docs: new `data/framework_mappings/` architecture

### Context

Framework-mapping rationale was fragmented: AWS had a proper home (`lens_mapping.md` + `taxonomy.json` spec), EU AI Act was half-documented (convention key in `taxonomy.json` + scattered reasoning in `decisions.md`/`paid_workshop.md`), AIGP had only inline `note`s and no convention entry, and NIST had nothing but app scaffolding. Nothing in `CLAUDE.md` pointed to any of it. With more frameworks planned (GDPR, FCA, …), this needed a consistent structure before it got worse.

### Decision — one doc per framework + a registry + a single CLAUDE.md signpost

- New folder **`data/framework_mappings/`** with one markdown per framework (WHY / HOW / STATUS), a `_TEMPLATE.md`, and a `README.md` registry + **"How to add a new framework"** procedure.
- Backfilled the real state: `aws.md` (anchor, 24/24), `aigp.md` (cross-ref, 23/24, missing GO1B1-04, all unverified), `eu_ai_act.md` (cross-ref, 7/24 = 6 Security + GO1B1-01, all unverified), `nist.md` (scaffolded, 0/24 — app filters kept as forward-scaffolding), `gdpr.md` (proposed, 0/24, methodology + GS5B1-01 worked example).
- `CLAUDE.md` gains a single pointer to the folder; the README procedure is designed so adding a framework needs **no CLAUDE.md edit** (new `<key>.md` + a registry row).
- Division of labour kept: `framework_mappings/` = human WHY/HOW; `taxonomy.json` `framework_mappings_spec` = machine-readable field shapes/conventions; `lens_mapping.md` = per-AWS-BP ledger.
- **The one rule recorded across all docs:** a standard earns a reference only when its *gate actually discharges* the obligation — never by topical relation; un-discharged obligations are logged as future-standard candidates, not forced onto unrelated standards.

### Scope / non-changes

- **Docs only — no `principles.json` data changed.** No GDPR/NIST references authored; no versions bumped; `format_version` unchanged (1.13). GDPR and NIST remain unpopulated by design pending their own authoring passes.
- Earlier doc shorthand "eu_ai_act = Security standards" corrected: GO1B1-01 (Operational Excellence) also carries an Art 15 reference → 7 total.

### Open items

- Author `aigp_convention` (+ the missing GO1B1-04 aigp ref); define `gdpr`/`nist` field shapes + conventions in `taxonomy.json` when those passes happen.
- Surface AIGP / EU AI Act sidebar filters (open UI work).

---

## 2026-06-22 — GENREL03-BP02 → GR3B2-01 promoted (agent run deadline); GENREL03 CLOSED; catalogue at 24

### Context

Unparked GENREL03-BP02 "Implement timeout mechanisms on agentic workflows" (parked 2026-06-15 during the GR3B1-01 walk, "do BP01 only"). AWS risk High. genrel03.html verified 2026-06-15; live BP step page not re-fetched this session (web_fetch timed out, no Chrome) — steps reconstructed, confirm on a verification pass.

### HALT — standalone vs fold-in, and the idempotency tangle (user-driven)

The user drove the whole decision. Four resolved points:

1. **Standalone vs fold into GC5B1-01.** The wall-clock deadline could be a 4th limit dimension on GC5B1-01 (same run-config artefact, same harness, same lint shape). User directed **standalone (GR3B2-01)**: the failure is genuinely distinct (an I/O hang, not a runaway loop), and Reliability owning its own timeout standard reads cleaner than burying a reliability failure in a cost-framed principle. Shared artefact + harness recorded as a soft GC5B1-01 dependency.
2. **The distinct failure (user asked it be framed before deciding):** GC5B1-01 caps iterations/steps/tokens; that cap is structurally blind to an agent idle on an unresponsive tool because no steps or tokens accrue while it waits. A wall-clock deadline fires regardless. This is the hang no run-length cap can catch.
3. **Idempotency.** User pressed: a run timing out at tool 10 has already fired tools 1-9; a naive retry re-fires their side effects. Timeout alone is unsafe. **Scope decision (user accepted "Option 1"):** keep GR3B2-01 narrow — deadline + graceful termination + DLQ, safe-termination defaulting to **no auto-retry**. Tool-call idempotency is split out as a **separate, not-yet-authored standard** (GR3B1-01's retries need it too); when it lands, the safe-termination lint relaxes to "retry allowed only if all tool calls are idempotent".
4. **Artefact location.** User asked where the client declares this. NOT the prompt YAML (GO3B1-01 is per-template — wrong granularity); it lives in the **agent run config**, the same artefact GC5B1-01's caps use. Per-tool timeouts on each tool binding.

### Decision — promote → GR3B2-01

24th standard; second under GENREL03 (focus area P31); the reliability twin of GC5B1-01. Contract (Option A — declared-and-routed): `wall_clock_deadline` + per-tool `timeout` + `on_timeout` (`terminate`/`dead_letter`) declared in the agent run config; the central agent harness `run(...)` applies the deadline by construction, terminates + cleans up + routes to DLQ on expiry; three pre-merge lints (declaration completeness, safe-termination, routed-execution AST) + a quarterly timeout-effectiveness review over GO3B2-01 telemetry. step_promotion **3/3/3/3**. **Enforcement limit** (enforcement_limits.md): the lints prove the deadline is declared + applied + un-bypassed + retry-safe by declaration — NOT that it fires under live load, is right-sized, or that cleanup is clean (the "wired-in, not runtime behaviour" limit, same as GC3B2-01). Distinctions: GC5B1-01 = run LENGTH cap (blind to I/O hang); GR3B1-01 = recover a call that RETURNS an error (this fires when nothing returns); base-WAF REL05-BP05 = per-call timeout (cannot bound a model-chosen run that never returns). impact_level High (matches AWS risk High — a hung run exhausts the worker pool → outage). Also absorbs GENCOST05-BP01 step 3's deferred tool/Lambda timeout residue.

### GENREL03 CLOSED

BP01 → GR3B1-01, BP02 → GR3B2-01. Catalogue at **24 standards** (9 GENOPS + 7 GENCOST + 6 GENSEC + **2 GENREL**).

### Files touched

`data/principles.json` (GR3B2-01 appended after GR3B1-01; parses OK, count 24; schema-presence checked — field set identical to GR3B1-01, all 20 universal keys), `data/ri/GR3B2-01/README.md` (new, Option A), `data/enforcement_limits.md` (GR3B2-01 worked case), `data/lens_mapping.md` (BP02 row flipped parked→promoted + GENREL03 closed), `data/authored/GENREL03-BP02.md` (promote entry on top, parked entry retained for history) + index row moved to top, `agentflow/app/anchor.json` (completed), this entry. format_version unchanged (no schema change).

### Open items

- A future **tool-call idempotency standard** would let GR3B2-01's safe-termination lint permit idempotent-run retries.
- AWS BP step page reconstructed — verify GENREL03-BP02's numbered steps from the live page / a connected browser; AIGP IV.C unverified.
- JSON parse OK in-session; S3 re-upload (ea/principles.json) + frontend build for the live app.
- GENREL pillar continues: GENREL04 (prompt management) next, then GENREL05 (distributed availability), GENREL06 (distributed compute).

---

## 2026-06-22 — GENREL02-BP01 not_promoted; GENREL02 CLOSED

GENREL02 "Network reliability" ships one BP — GENREL02-BP01 "Implement redundant network connections among model endpoints and supporting infrastructure" (focus area + BP title via search; live page not fetchable, mapping_state unverified). **not_promoted (user-directed)** at the HALT: it's the GenAI relabel of base-WAF **REL02-BP02** (multi-AZ, PrivateLink, redundant Direct Connect/VPN, BGP) — generic network redundancy, a vendor menu, no commitable repo artefact or CI gate, fully absorbed by base-WAF REL02 (the shape that closed most of GENPERF). The one adjacent angle — private connectivity to model endpoints to keep inference off the public internet — is a **security** concern for a GENSEC walk, not a reliability principle here. **No ADR** (no AI-specific recommendation; guidance is "follow base-WAF REL02"). step_promotion **3/3/3/3 → not_promote**. Files: `data/lens_mapping.md` (GENREL02 section), `data/authored/GENREL02-BP01.md` + index row, `agentflow/app/anchor.json`, this entry. No `principles.json` change — catalogue stays at **23 standards**. GENREL continues: GENREL03-BP02 (parked timeouts) next.

---

## 2026-06-22 — GENREL01-BP01 not_promoted → ADR; GENREL01 CLOSED; GENREL pillar walk resumed

### Context

Resumed the GENREL pillar (last touched 2026-06-15 with GR3B1-01). Goal for the session: complete GENREL. Walked GENREL01 "Manage throughput quotas" first — the documented next candidate and the flagged home for GENOPS02-BP03's deferred provider-quota slice. Focus area + BP title confirmed via search; live BP page not fetchable (web_fetch timed out repeatedly, no Chrome browser connected) so the verbatim is reconstructed and **mapping_state is unverified**. GENREL01 ships one BP per search enumeration (GENREL01-BP01); confirm the count on a verification pass.

### HALT — the enforceability fight (user-driven)

Problem: foundation-model APIs cap requests/tokens per minute; on Bedrock that quota is **per account/region**, shared across every workload, so one workload's spike throttles the rest (multiple keys in one account do NOT split it — Bedrock quotas are account-scoped, not key-scoped). The user pressed hard on enforceability, same shape as the GC3B2-01 walk. We worked through three designs: (1) a **client-side rate limiter** — rejected, it runs per process so N instances each capped at X sum to N·X and never protect a *shared* quota, and it isn't FIFO/fair across clients; (2) a **central rate-limiting gateway** with global token-bucket state — rejected as a parallel backend the org won't build, and per-client quota allocation is operational/political, not architectural; (3) the user's own proposal — **per-project accounts/keys** for isolated quota + clean per-project billing — accepted as the realistic answer, but it resolves to **generic multi-account landing-zone governance (base-WAF)**, not an AI-specific principle.

### Decision — not_promote (user-directed)

Once account isolation + provisioned throughput do the work, nothing distinct and enforceable survives. Absorption: throttling recovery (429 retry+backoff) → **GR3B1-01**; cross-region balancing → **GENREL05-BP01** (walked later); provisioned-vs-on-demand = a buy decision adjacent to **GC2B2-01**; generic autoscaling → base-WAF REL + GENSUS01-BP01 (Sustainability, out of scope). step_promotion **3/3/3/3 → not_promote** (the rubric scores whether the *decision* holds up; a well-reasoned not_promote scores high).

### Deliverable — an ADR (new pattern)

Instead of a principle, captured the recommendation we give projects as an ADR at **`data/adr/GENREL01-throughput-quotas.md`** (new `data/adr/` folder — first time a not_promote produces an ADR as its deliverable). Five points: isolate by default (own account/key per project → own quota + per-project bill); reserve capacity for critical steady traffic (Bedrock Provisioned Throughput / committed tiers), bursty stays on-demand; each project stays under its own ceiling via rate limit + GR3B1-01 backoff; no central gateway / no quota pooling; central team ships a *standard* (declare provider + capacity mode + rate-limit config through the shared SDK) not a backend, monitoring rides GO3B2-01. This also resolves the deferred **GENOPS02-BP03** provider-quota slice — it lands here and likewise needs no new gate.

### Files touched

`data/adr/GENREL01-throughput-quotas.md` (new), `data/lens_mapping.md` (GENREL01 section + pillar header), `data/lens_mapping_authored.md` (prepended entry, then SPLIT — see below), `agentflow/app/anchor.json` (not_promote/closed), this entry. No change to `principles.json` — catalogue stays at **23 standards**. format_version unchanged.

### Ledger split (2026-06-22)

`lens_mapping_authored.md` had grown to 59 entries / ~108 KB — too big for a single read (over the 25k-token tool limit). Split it: a dedicated index at **`data/lens_mapping_authored_index.md`** (Key | Date | Outcome | File, newest first) + one file per decision at **`data/authored/<KEY>.md`** (keyed by BP code; two collisions suffixed `__2`). Content-preserving — every `- 20…` entry line appears verbatim in exactly one chunk (diff-verified). Old monolith replaced with a pointer stub; verbatim backup at `data/lens_mapping_authored.backup-20260622.md`. **New authoring process:** write the full entry to `data/authored/<KEY>.md` + prepend a row to the index (replaces "prepend to lens_mapping_authored.md"). Stray empty `data/lens_mapping_authored.new` still present (bash `rm` blocked on mount; truncated to 0 bytes).

### Open items

- **mapping_state UNVERIFIED** on GENREL01 — confirm BP's numbered steps + confirm BP01 is the only BP from the live page (fetch timed out; retry from a connected browser or the user's terminal).
- Stray empty file `data/lens_mapping_authored.new` left by the prepend (bash `rm`/`mv` blocked on this mount — `Operation not permitted`); truncated to 0 bytes, user can delete it.
- GENREL pillar continues: GENREL02 (network reliability) next, then GENREL03-BP02 (parked timeouts), GENREL04 (prompt management), GENREL05 (distributed availability), GENREL06 (distributed compute).

---

## 2026-06-16 — GENCOST03-BP02 → GC3B2-01 promoted (output token cap); GENCOST03 CLOSED (prompt-cost triad)

### Context

Picked up GENCOST03-BP02 "Control model response length" — flagged as the most likely remaining promote candidate when GENOPS closed. The output-side mirror of GC3B1-01 (input footprint). Direct web_fetch of docs.aws.amazon.com timed out repeatedly this session; BP title + the GENCOST03 question stem are confirmed (question verified 2026-06-05 during the BP01/BP03 walks), but the live page's numbered implementation steps could not be fetched — so the BP mandate is reconstructed from search + established scope (max_tokens, stop sequences, concise-output prompt instructions), and the AWS mapping_state is recorded **unverified** pending a step-page pass.

### HALT — the enforceability fight

Presented the candidate ("Cap what every response can cost, not just every prompt") plus the absorption counter (GO3B1-01 already carries a `runtime_token_budget.output` field). The user pressed hard, twice, on one question: **how does a CI gate check response length?** The honest answer — **it can't; the response does not exist at build time** — became the design. My initial phrasing ("AST-checks that every model call passes max_tokens ≤ ceiling") was loose and I corrected it: you cannot statically evaluate a runtime parameter value in general. What CI *can* prove is that the cap is **declared, applied by the SDK, and un-bypassed**. The model honours `max_tokens` at runtime; actual length lives in telemetry (GO3B2-01), not the gate. User directed **PROMOTE** on that basis.

### Decision — promote → GC3B2-01

23rd standard; output-side mirror of GC3B1-01; fourth GENCOST principle. Anchored whole-BP. step_promotion **3/3/3/3**.

Contract (Option A — declared-and-bound, manifest-derivable): every template declares a real `runtime_token_budget.output` (GO3B1-01's blank-by-default field); the central SDK applies it as the call's `max_tokens` by construction; a declaration lint fails an absent/zero ceiling; an AST no-bypass lint (extending GO3B1-01's no-inline routing lint) fails any call site passing its own output-cap parameter that bypasses the registered ceiling (variable override fails outright; literal override allowed only when ≤ ceiling); a budget-inflation governance lint requires a recorded rationale to raise a ceiling. Options B (declared stop_sequences) + C (runtime alarm on GO3B2-01's output-token signal) documented as additive alternative RIs; RI + gates built on Option A.

**Enforcement limit (the distinguishing point from GC3B1-01, whose input footprint IS statically computable):** the gate proves declared + applied + un-bypassed, NOT that the model halts at the cap under live load, NOT that the ceiling is appropriate. This is the purest "wired-in, not runtime behaviour" limit in the catalogue — appended to enforcement_limits.md. Runtime length → Option C; ceiling appropriateness → Gate 2 inflation review.

Per-section rubric scores: statement 3/2/3/2/3 (abstract should/ought register; artefact + mechanism live in gates); problem 3/3/3/3/3/3 (every example an output-cost failure the model-selection/hosting gates + GO3B1-01's existence-only check all miss); solution 3/3/3/3/3/2 (Option A artefacts named with paths + gate points; B/C explicitly optional; enforcement limit stated in-line); gates 3/3/3/3/3/3 (two pre_merge required-status-check gates — declaration + no-bypass routing, and budget-inflation governance). tier D1=no / D2=2 (declaration + AST + governance lints in the central llm-sdk suite; thinner than GC3B1-01 — no new tokenizer computation, just extends the no-inline AST lint with one parameter) → recommended_centralise → enterprise. maturity scaling (sits on GO3B1-01's scaling-tier registry). serving_paradigm all four mandatory (response length drives cost under per-token billing AND self-hosted compute). impact Medium. applicability { llm/rag/agentic mandatory, ml nice_to_have }. dependencies [{ GO3B1-01 hard }]. references TWO real (Bedrock inference-parameters max_tokens doc; Stackviv max-tokens/stop-sequences) — lighter than the sibling's five, flagged. AIGP III.B unverified. explain_prompt compiled with the uncapped-output cost failure shape. RI at data/ri/GC3B2-01/README.md.

### GENCOST03 CLOSED — prompt-cost triad

BP01 → GC3B1-01 (input footprint), BP02 → GC3B2-01 (output cap), BP03 → GC3B3-01 (cache reuse), BP04 → not_promoted (vendor tag micro-optimisation). The Cost-aware prompting focus area (P52) now yields the full prompt-cost triad. Catalogue at **23 standards** (9 GENOPS + 7 GENCOST + 6 GENSEC + 1 GENREL).

### Files touched

`data/principles.json` (GC3B2-01 inserted after GC3B1-01 at index 12; parses OK, count 23; schema-presence checked — all fields match GC3B1-01 and the full prior union, no missing/extra), `data/ri/GC3B2-01/README.md` (Option A), `data/lens_mapping.md` (BP02 row + GENCOST03 narrative + closure), `data/lens_mapping_authored.md` (prepended entry), `data/enforcement_limits.md` (GC3B2-01 worked case), `agentflow/app/anchor.json` (completed), this entry. format_version unchanged (1.13 — no schema change).

### Open items

- **mapping_state UNVERIFIED** on GC3B2-01's AWS reference — confirm the BP's numbered implementation steps from the live page (fetch timed out this session) and promote to verified.
- references light (2 vs sibling's 5) — enrich with named-company output-cost cases.
- JSON parse run in-session (OK). S3 re-upload (ea/principles.json) + frontend build for the live app.
- Remaining unwalked (excl. Sustainability): **GENREL pillar** — GENREL01 (throughput quotas; also the home for GENOPS02-BP03's provider-quota slice) / GENREL02 / GENREL04 / GENREL05 / GENREL06; GENREL03-BP02 (parked). GENOPS, GENSEC, GENPERF, GENCOST all fully walked.
- AIGP III.B sweep across the cost family.

---

## 2026-06-16 — GENOPS05-BP01 not_promoted; GENOPS05 + the entire GENOPS pillar CLOSED (9 standards)

### Context

Enumerated and walked GENOPS05 "Model customization" — the last open GENOPS focus area. Verified via search (genops05.html); direct web_fetch still timing out this session.

### Enumeration

GENOPS05 question: "How do you determine when to execute generative AI model customization?" Ships **exactly one BP** — GENOPS05-BP01 "Learn when to customize models." (No GENOPS05-BP02; the model-customization cost/efficiency angle lives in the Sustainability pillar as GENSUS01-BP02 "Use efficient model customization services," out of the current scope.)

### AWS verbatim (BP01)

Prioritize prompt engineering and RAG before model customization. Begin with prompt engineering, progress to RAG, then fine-tuning, then custom models — escalating only as task specificity, data availability, and resource constraints demand. Avoid expensive customization when a cheaper technique suffices.

### HALT discussion

Presented a candidate promote ("Exhaust the cheap options before you train" — justify in a recorded decision why prompt-eng + RAG are insufficient before fine-tuning) plus the absorption tension. User directed **not_promote**.

### Decision — not_promote (whole BP)

Scored against `data/sections/step_promotion/rubric.json`: **3/3/3/3 → not_promote**. This is decision-process advice — the same shape not_promoted at GENCOST01-BP01 step 1, GENCOST02-BP01/02 steps 1–2, and the GENCOST03/04/05 step-1 observation inputs: no commitable artefact, no CI-gateable check. The substance is rationale-content for a decision record, and **GC1B1-01** (the model-selection ADR) is the natural home — "why we are / aren't customizing" is one more axis of the same selection decision. Adjacent owned pieces: **GO1B1-06** (model-change gate, if a custom model ships) and **GS6B1-01** (training-data purification, once customization happens). The faint promote pulse — a justify-before-you-train ADR gate conditional on a training path — collapses into GC1B1-01's record (a standalone "training-path ⇒ ADR exists" check is thin ceremony, the GENCOST01-BP01-step-1 failure shape).

Per-dimension: has_enforceable_artefact 3 (decision-process advice; candidate justify-ADR absorbed by GC1B1-01); architecturally_distinct 3 (GC1B1-01 + GO1B1-06 + GS6B1-01 named); in_bp_scope 3 (native GENOPS05; cost/efficiency twin GENSUS01-BP02 sits in Sustainability, out of scope); not_vendor_menu 3 (Bedrock/SageMaker customization mentioned, but the core is methodology — "prefer cheaper techniques first" is advice not a mandate).

### GENOPS PILLAR FULLY WALKED + CLOSED — 9 standards

- **GENOPS01** (Model performance evaluation) → GO1B1-01..06 (6 standards; BP02 not_promoted).
- **GENOPS02** (Monitor operational health) → CLOSED, 0 (BP01/02/03 all absorbed by the GO3B2 observability family / GO1B1-04 drift / GR3B1-01-resilience + base-WAF).
- **GENOPS03** (Observability) → GO3B1-01 + GO3B2-01 + GO3B2-02 (3 standards).
- **GENOPS04** (Automate lifecycle) → CLOSED, 0 (generic IaC + GenAIOps umbrella).
- **GENOPS05** (Model customization) → CLOSED, 0 (decision-process advice).

Operational Excellence yields its enforceable GenAI architecture entirely through the eval (GO1B1), prompt-registry (GO3B1), and observability (GO3B2) families; its monitoring, lifecycle-automation, and customization-decision questions resolve to those families + base-WAF discipline. Two full pillars now closed this session (GENPERF, GENOPS) plus GENSEC earlier; catalogue stands at 22 standards (9 GENOPS + 6 GENCOST + 6 GENSEC + 1 GENREL).

### Files touched

`data/lens_mapping.md` (GENOPS05 section rebuilt — question + single-BP list verified, BP01 walked, focus area + GENOPS pillar marked CLOSED), `data/lens_mapping_authored.md` (prepended entry), `agentflow/app/anchor.json` (BP01 not_promoted), this entry. No `principles.json` edit, no RI.

### Open items

- **GENOPS fully walked.** Remaining unwalked (excluding Sustainability): **GENCOST03-BP02** (output-length sibling — most likely remaining promote candidate); **GENREL pillar** — GENREL03-BP02 (parked) + GENREL01 (throughput quotas — now also the home for GENOPS02-BP03's provider-quota slice) / GENREL02 / GENREL04 / GENREL05 / GENREL06.
- AIGP III.B sweep; JSON-parse / frontend-build verifications. (No principles.json change this session.)

---

## 2026-06-16 — GENOPS02-BP03 not_promoted; GENOPS02 focus area CLOSED (3 BPs, zero principles)

### Context

Closed the GENOPS02 walk with BP03 "Implement rate limiting and throttling to mitigate the risk of system overload" (live AWS title expanded from "Implement solutions to…"). Verbatim confirmed via search (genops02-bp03.html); direct web_fetch still timing out this session.

### AWS verbatim (BP03)

Throttling mechanisms + Amazon API Gateway rate limiting to control request volume; exponential backoff with jitter for transient errors; AWS SDK for JavaScript built-in retry; retry logic with idempotent operations where possible; AWS Step Functions for complex retry workflows; circuit breaker patterns to fail fast on repeated failures; CloudWatch observability for continuous monitoring. Key context: "the level of parallelism may be constrained by the source system's capacity" — respect downstream limits.

### HALT discussion

Presented a candidate promote ("Stay within the limits of what you and your model provider can absorb") plus the absorption + cross-pillar tension. User directed **not_promote**.

### Decision — not_promote (whole BP)

Scored against `data/sections/step_promotion/rubric.json`: **3/3/3/3 → not_promote**. Classic resilience engineering, already placed:

- **retries / exponential backoff / circuit breakers / idempotent operations → GR3B1-01** (the first Reliability standard, authored 2026-06-15 — its recovery contract specifies exactly these, incl. an idempotency key for side-effecting retries). This BP's retry half IS that contract.
- **generic throttling / API Gateway rate limiting / Step Functions retry orchestration → base-WAF Reliability (REL05** client throttle/backoff/retry).
- the one GenAI-distinct slice — respecting **model-provider TPM/RPM throughput quotas** under parallelism — has a dedicated, still-unwalked home at **GENREL01 (Manage throughput quotas)**, where it should anchor, not under a GENOPS Ops-monitoring focus area.

Per-dimension: has_enforceable_artefact 3 (retry/backoff/CB artefact owned by GR3B1-01; generic throttling has no GenAI-distinct artefact; provider-quota slice cross-pillar); architecturally_distinct 3 (GR3B1-01 + base-WAF REL05 + GENREL01 named); in_bp_scope 3 (substance is Reliability, cross-pillar to GENREL01 + GR3B1-01 — not Operational Excellence monitoring); not_vendor_menu 3 (API Gateway / Step Functions / SDK retry / CloudWatch menu; surviving generic rule is base-WAF REL05).

### GENOPS02 CLOSED — 3 BPs, ZERO principles

- BP01 (monitor all layers) → not_promoted/absorbed (GO3B2-01/02 emission + base-WAF OPS04-BP02).
- BP02 (monitor FM metrics) → not_promoted/absorbed (GO1B1-04 drift + GO3B2-01 telemetry + GENCOST + GENSEC03 security-monitoring).
- BP03 (rate limiting + throttling) → not_promoted/absorbed+cross-pillar (GR3B1-01 retry/backoff/CB + base-WAF REL05 + GENREL01 throughput quotas).

The operational-health question yields no GenAI-distinct enforceable architecture beyond what the GO3B2 observability family, GO1B1-04 drift, and the GR3B1-01 / GENREL resilience family already own — the same monitoring-BP result as GENSEC01-BP04 / GENSEC03-BP01. GENOPS now stands: GENOPS01 (6 standards), GENOPS02 (closed, 0), GENOPS03 (3 standards), GENOPS04 (closed, 0), GENOPS05 (Model customization — not yet enumerated, next).

### Files touched

`data/lens_mapping.md` (BP03 row walked + GENOPS02 CLOSED summary), `data/lens_mapping_authored.md` (prepended entry), `agentflow/app/anchor.json` (BP03 not_promoted), this entry. No `principles.json` edit, no RI.

### Open items

- **GENOPS05 (Model customization)** — needs BP enumeration from AWS docs; next. Expect overlap with GO1B1-06 (model-change gate) + GS6B1-01 (training-data purification).
- Other unwalked: GENCOST03-BP02; GENREL pillar (GENREL03-BP02 parked + GENREL01/02/04/05/06).
- AIGP III.B sweep; JSON-parse / frontend-build verifications. (No principles.json change this session.)

---

## 2026-06-16 — GENOPS02-BP02 not_promoted (absorbed by GO1B1-04 + GO3B2-01 + GENCOST); GENOPS02 two-thirds walked

### Context

Continued the GENOPS02 walk. BP02 "Monitor foundation model metrics" — the model-layer counterpart to BP01's all-layers monitoring. Verbatim confirmed via search (genops02-bp02.html); direct web_fetch still timing out this session.

### AWS verbatim (BP02)

"Set up continuous monitoring and alerting for foundation models for performance, security, and cost-efficiency... rapid identification and resolution of issues like data drift, model degradation, and security threats." Steps: (1) EventBridge for automated responses to state-change events; (2) Bedrock model-invocation logging — track InputTokenCount, OutputTokenCount, InvocationThrottles; (3) SageMaker AI Model Monitor; (4) dashboards. Desired outcome: real-time FM-performance visibility, early anomaly/degradation detection, integrated with existing observability.

### HALT discussion

Presented a candidate promote ("Watch the model's own signals — tokens, throttles, latency, drift — not just the app around it") plus the absorption tension. User directed **not_promote**.

### Decision — not_promote (whole BP)

Scored against `data/sections/step_promotion/rubric.json`: **3/3/3/3 → not_promote**. Every named concern maps to an existing owner:

- **data drift / model degradation → GO1B1-04** (the drift monitor — per-dimension metrics, deployment-anchored baselines, cadence, thresholds, alert routing). This is the exact concern, already concretised.
- **token / invocation / throttle telemetry → GO3B2-01** (one-channel emission contract) + the **GENCOST** family for the cost lens.
- **security threats → GENSEC03-BP01** territory (already not_promoted as a monitoring umbrella).

Per-dimension: has_enforceable_artefact 3 (candidate model-metric-emission/alert artefact is delivered by GO3B2-01 + GO1B1-04 — nothing new survives extraction); architecturally_distinct 3 (GO1B1-04 / GO3B2-01 / GENCOST / GENSEC03 named as owners); in_bp_scope 3 (native GENOPS02, substance lives in GENOPS01's GO1B1-04 + GENOPS03's GO3B2-01); not_vendor_menu 3 (EventBridge / Bedrock invocation logging / SageMaker Model Monitor / CloudWatch menu; the surviving generic rule is base-WAF **OPS08** analyze workload metrics). The only candidate-distinct slice — a mandate that *model-layer* signals specifically be emitted — is GO3B2-01's emission contract restated.

Reinforces the standing position: across pillars, every "monitor X" BP resolves to the GO3B2 observability family (emission + governance) and/or GO1B1-04 (drift) plus base-WAF telemetry. GENOPS02 is yielding the same result as the GENSEC monitoring BPs.

### Files touched

`data/lens_mapping.md` (BP02 row walked; BP03 marked "next"), `data/lens_mapping_authored.md` (prepended entry), `agentflow/app/anchor.json` (BP02 not_promoted), this entry. No `principles.json` edit, no RI.

### Open items

- **GENOPS02 — 1 BP left:** BP03 (Implement solutions to mitigate the risk of system overload) — expected to lean toward GENREL (throughput/overload) + base-WAF resilience; next.
- GENOPS05 (Model customization) still needs enumeration.
- Other unwalked: GENCOST03-BP02; GENREL pillar (GENREL03-BP02 parked + GENREL01/02/04/05/06).
- AIGP III.B sweep; JSON-parse / frontend-build verifications. (No principles.json change this session.)

---

## 2026-06-16 — GENOPS02-BP01 not_promoted (absorbed by GO3B2 family + base-WAF OPS04-BP02); first GENOPS02 walk

### Context

Opened GENOPS02 ("Monitor and manage operational health" — "How do you monitor and manage the operational health of your applications?", 3 BPs, all previously UNMAPPED). Walked BP01 "Monitor all application layers." Direct web_fetch of docs.aws.amazon.com kept timing out this session; verbatim confirmed via search extraction (genops02-bp01.html).

### AWS verbatim (BP01)

"Implement comprehensive monitoring and logging across all layers of your generative AI application to maintain operational health, provide reliability, and optimize performance." The service layer may interact with a prompt catalog, a vector store, or guardrails before the model; complex workloads navigate a knowledge graph, run a prompt flow, or initiate an agent — each layer requires proactive monitoring and application telemetry. Monitor invocation counts, latency, token usage, error rates, throttling; CloudWatch alarms on thresholds + dashboards; request-flow tracing via X-Ray or Bedrock Agent tracing; managed services (Bedrock / Q Business / OpenSearch Serverless) facilitate much of it via CloudWatch + CloudTrail. **AWS Resources cross-reference base-WAF OPS04-BP02 (Implement application telemetry).**

### HALT discussion

Presented a candidate promote ("Emit telemetry from every layer of the request path — no silent layer": every stage — service, prompt fetch, retrieval, guardrail, model call, tool/agent step — emits a span on the shared observability channel) plus the absorption tension. User directed **not_promote / absorbed**.

### Decision — not_promote (whole BP)

Scored against `data/sections/step_promotion/rubric.json`: **3/3/3/3 → not_promote**.

- **has_enforceable_artefact (3):** the only candidate enforceable artefact — a per-layer *coverage gate* (assert no declared layer is uninstrumented) — is already delivered by GO3B2-01's single-channel emission contract; nothing CI-gateable survives extraction distinct from it.
- **architecturally_distinct (3):** the GenAI-distinct per-layer tracing is owned by **GO3B2-01** ("Make every AI workload observable through one consistent channel" — emits on every model call / tool / retrieval, per-agent) + **GO3B2-02** (trace access/retention governance). "Monitor all layers" is GO3B2-01's emission contract restated under an Ops-monitoring heading.
- **in_bp_scope (3):** native to GENOPS02, but the substance lives one focus area over in GENOPS03's observability family (the GO3B2 home).
- **not_vendor_menu (3):** Bedrock / Q / OpenSearch / CloudWatch / CloudTrail / X-Ray menu; the surviving generic rule (telemetry at each layer) is base-WAF **OPS04-BP02**, not a GenAI-distinct mandate.

This mirrors the GENSEC01-BP04 and GENSEC03-BP01 shape: monitoring BPs whose GenAI-distinct telemetry slice is already owned by the GO3B2 family while the generic logging/alarms/dashboards belong to the base WAF. The catalogue's standing position holds — observability is concretised once (GO3B2-01/02), and every "monitor X" BP across pillars resolves to that plus base-WAF telemetry.

### Files touched

`data/lens_mapping.md` (GENOPS02-BP01 row walked; BP02 marked "next"), `data/lens_mapping_authored.md` (prepended entry), `agentflow/app/anchor.json` (not_promoted), this entry. No `principles.json` edit, no RI.

### Open items

- **GENOPS02 still open:** BP02 (Monitor foundation model metrics — next), BP03 (mitigate system overload — likely cross-refs GENREL). GENOPS05 (Model customization) still needs enumeration.
- Other unwalked: GENCOST03-BP02; GENREL pillar (GENREL03-BP02 parked + GENREL01/02/04/05/06).
- AIGP III.B sweep; JSON-parse / frontend-build verifications. (No principles.json change this session.)

---

## 2026-06-16 — GENPERF04-BP01 not_promoted; GENPERF pillar fully walked + CLOSED (zero principles)

### Context

GENPERF was already effectively closed (GENPERF01/02/03 all closed; GENPERF04-BP02 not_promoted/absorbed into GC4B1-01), with one residual open item: **GENPERF04-BP01** left UNMAPPED and flagged "same-shape, formal sweep to fully close." User directed: close GENPERF — confirm the not_promote and move on (no promote pressure-test).

### What was done

Verified the live AWS BP. Title correction: the mapping carried "Test vector **embeddings** for latency and relevant performance"; the live page (genperf04-bp01.html) reads "Test vector **store features** for latency and relevant performance." Verbatim re-fetched 2026-06-16 (via search — direct web_fetch of docs.aws.amazon.com timed out repeatedly this session; substance confirmed from search extraction). Four technique slices: (1) ANN algorithm selection (LSH / HNSW / IVF / PQ — accuracy/speed/memory/scalability trade-offs, benchmark on your dataset); (2) hierarchical index organization; (3) embedding/chunking strategy (fixed-size / hierarchical / semantic); (4) query processing (query expansion, fuzzy → semantic similarity). Risk Medium.

### Decision — not_promote (whole BP)

Scored against `data/sections/step_promotion/rubric.json`: **3/3/3/3 → not_promote** (passes the rubric as a correctly-reasoned non-promotion).

- **has_enforceable_artefact (3):** experiment-and-pick / benchmarking advice; no commitable pre-merge artefact survives extraction.
- **architecturally_distinct (3):** the latency/relevance-testing substance overlaps the GO1B1 eval-harness family; the vector-store dimension + quality-floor slice is already owned by GC4B1-01 (cost) and the sibling GENPERF04-BP02; chunking quality-testing is the same shape not_promoted at GENCOST04-BP01 steps 3/4.
- **in_bp_scope (3):** native to GENPERF04 (vector-store performance); correctly placed.
- **not_vendor_menu (3):** notable variant — this is a generic *technique* menu (standard ANN algorithms, not AWS-vendor services), but the same conclusion holds: nothing architectural survives extraction as a CI-gateable mandate.

This was the last open GENPERF BP. **GENPERF04 focus area CLOSED; the entire Performance Efficiency pillar is now FULLY WALKED + CLOSED — ZERO principles** (GENPERF01: 2 BPs; GENPERF02: 3 BPs; GENPERF03: 1 BP; GENPERF04: 2 BPs — all not_promoted). Standing interpretation reaffirmed: every GENPERF BP resolves to base-WAF infra discipline (PERF05 / ML-lens MLPER), a performance-framed restatement of an already-authored GENOPS eval (GO1B1) / observability (GO3B2) / GENCOST principle (GC1B1-01, GC4B1-01, GO1B1-06), or a technique/vendor menu. A clean worked-example result, paralleling GENOPS04 — the catalogue is honest about where a pillar yields no distinct GenAI architecture.

### Files touched

`data/lens_mapping.md` (GENPERF04 section rebuilt — BP01 row walked + title corrected, focus area + pillar marked CLOSED; the earlier GENPERF-closed note updated off "BP01 still UNMAPPED"), `data/lens_mapping_authored.md` (prepended whole-BP not_promote entry), `agentflow/app/anchor.json` (status not_promoted), this entry. No `principles.json` edit, no RI (nothing promoted).

### Open items

- Remaining unwalked: **GENOPS02** (3 BPs); **GENOPS05**; **GENCOST03-BP02** (output-length sibling — most likely remaining promote candidate); **GENREL** pillar (GENREL03-BP02 parked + GENREL01/02/04/05/06).
- AIGP III.B sweep; JSON-parse verify `data/principles.json` from terminal; frontend build verifications. (No principles.json change this session, so no new parse risk introduced.)

---

## 2026-06-15 — GENREL03-BP01 → GR3B1-01 promoted; first Reliability standard; GENREL pillar opened; BP02 parked

### Context

Session traced the "reason about reliability and cost like a Staff engineer" best practice (handle non-determinism, retries, latency, token cost as first-class constraints) onto the catalogue. Coverage audit of all 21 standards: **token cost** fully covered (GC3 family); **non-determinism** covered only as an eval/drift discipline (GO1B1 family), not in its runtime face; **retries** and **latency** unwalked. Mapped the gaps to the AWS GenAI Lens: the runtime face of non-determinism ("Inconsistent model performance — variations in output for similar inputs", named under the Reliability pillar's common challenges) and retries both land in **GENREL03 — Prompt remediation and recovery actions**, collapsing two of the four concerns into one walk. User directed: walk GENREL03, author BP01 only, park BP02.

### Decisions

- **GR3B1-01 promoted** (ST-GR3B1-01 / PR-GR3B1-01) — *Recover gracefully when a model call goes wrong*. 22nd standard; **first Reliability standard**; opens pillar **P3 — Reliability** and focus area **P31 — Prompt Remediation & Recovery**. Anchored whole-BP (implementation_step null): BP steps 1-2 (error classification + recovery mechanisms — retries/backoff/fallback/circuit-breaker) are the concretised core; step 3 monitoring rides GO3B2-01's emit channel; step 4 is continuous-improvement process advice with no commitable artefact. step_promotion 3/3/3/3 hand-applied.
- **The runtime face of non-determinism finally has a home.** The GO1B1 family handles non-determinism as eval/drift (prove behaviour, watch for drift); GR3B1-01 handles it at the request path — validate the (non-deterministic) response against an expected shape and recover. AWS's own "classify responses as actionable or not ... to reduce non-determinism" is the GenAI-distinct slice that survives base-WAF REL05-BP01 (generic graceful degradation): a normal API returns a typed contract or an error; an LLM returns plausible garbage.
- **Structured-output / JSON mode does NOT make this redundant** (raised at the HALT). Strict provider modes satisfy the *validate* step where available but do not cover transient failures, truncation, refusals, empty retrieval, or semantic wrongness — the contract still owns those.
- **Sibling distinction:** GS2B1-01 checks output SAFETY (not structural usability/recovery); GC5B1-01 caps agent RUN LENGTH (not single-call failure). The recover-from-a-bad-call face was unowned.
- **Contract.** Per-call recovery spec (`output_schema` + `retry` + `fallback`, convention `prompts/<name>/recovery.yaml`) + central wrapper (`call_model` on the central LLM SDK, GO3B1-01's substrate) + two pre_merge lints (declaration completeness; routed-execution AST — the GO3B1-01 no-inline pattern on the call plane) + quarterly recovery-effectiveness review over GO3B2-01-emitted fallback/parse-failure/retry telemetry. Enforcement limit appended to enforcement_limits.md (lints prove declared+routed, not that the fallback is appropriate or the schema correct).
- **Tier enterprise** via D1=no / D2=3 — this is literally the tier rubric's own "Centralised LLM SDK and key vault" calibration example (call wrapper, retry engine, idempotency plumbing, fallback executor, routed-execution lint, telemetry hooks). validator project_architect; audit_mode self_attestation_with_mechanical_evidence; arb_role dashboard_and_spot_check.
- **Fields:** applicability { llm, rag, agentic } all mandatory (ml omitted — classical ML inference returns no free-form non-deterministic content that fails to parse); serving_paradigm all four (recovery lives in the call layer); maturity_level foundational (pays off at project #1; core enforcement is a per-PR repo-local lint; central SDK is a soft dep); impact_level Medium (matches AWS BP risk; broken/halted request or silent gap, workload-scoped); dependencies GO3B1-01 soft + GO3B2-01 soft; references Air Canada chatbot + the AWS BP page; aigp IV.C provisional/unverified; eu_ai_act omitted (Security-only so far).
- **GENREL03-BP02 PARKED — not authored, not formally not_promoted** (user-directed BP01 only). Timeouts on agentic workflows overlap GC5B1-01 on a different axis (wall-clock vs iterations) and risk base-WAF absorption (cross-refs REL05-BP05 client timeouts); GENCOST05-BP01 step 3's deferred tool/Lambda timeouts also land here. Revisit on the full GENREL walk.

### Artefacts

- `data/principles.json` — GR3B1-01 merged (22nd node; schema-presence check passed: full field parity with prior siblings incl. evidence + framework_mappings.aigp; eu_ai_act intentionally omitted). Parses clean in-sandbox.
- `data/ri/GR3B1-01/README.md` — RI authored (Option A, GS-family template).
- `data/lens_mapping.md` — GENREL pillar section opened (six focus areas enumerated from reliability.html); GENREL03 table added (BP01 → GR3B1-01 promoted, BP02 parked).
- `data/enforcement_limits.md` — GR3B1-01 worked case added (existence/shape-not-correctness on the call plane).
- `agentflow/app/anchor.json` — GENREL03-BP01 completed/promoted.

### Open items

- **JSON parse from terminal** — verify `python3 -c "import json; json.load(open('data/principles.json'))"` from the WSL mount (sandbox parse passed, but confirm on the live path before pushing).
- **S3 re-upload** — push `ea/principles.json` so the live app sees the 22nd standard.
- **Frontend** — P3 — Reliability and P31 — Prompt Remediation & Recovery are new free-text pillar/focus_area values; confirm the runtime renders them (`npm run build` from `s3-json-viewer/`).
- **AIGP IV.C** unverified — may belong under a dedicated reliability/operational-resilience competency.
- ~~`lens_mapping_authored.md` absent~~ **RESOLVED same session** — the file does exist in `data/` (an earlier `find` missed it due to a mount-timing issue); the GR3B1-01 promote entry and the GENREL03-BP02 parked entry have now been prepended to it. No action needed.
- **GENREL pillar** — only GENREL03 walked; GENREL01 (throughput quotas), GENREL02 (network), GENREL04 (prompt management — likely the reliability twin of GO3B1-01), GENREL05/06 (distributed availability/compute), and the parked GENREL03-BP02 remain.

---

## 2026-06-14 — EU AI Act folded into framework_mappings as a new cross-reference framework; all six Security standards mapped

### Context

Walkthrough session on the Security pillar's framework_mappings. Working ST-GS1B3-01 back against yesterday's EU AI Act analysis (the 2026-06-13 "EU AI Act enterprise architecture" session, captured in `paid_workshop/part_2.md`) raised the question of which system-level Act control each standard satisfies. That session's funnel had already dropped the org/documentation-level obligations (Art 11 tech docs, Art 17 QMS, Art 43/47/48 conformity, Art 49 registration) and kept the system-level ones, filtered to eight GenAI-distinctive controls. A long clarification thread separated three layers that had been getting collapsed: the **Act** (the *what* — legal obligation), the **standard** (the *how* + proof it works — engineering control + gate, EA-owned), and **ISO 42001** (proof it's *governed* — management-system wrapper, Governance-owned). 42001 is deliberately NOT a control source and gets no framework_mappings key.

### Decisions

- **`eu_ai_act` added as a new framework key under `framework_mappings`** — same pattern as the AIGP fold-in (decisions.md 2026-05-?? / taxonomy framework_mappings_spec). Structural fields declared in `taxonomy.json` framework_specific_reference_fields.eu_ai_act: `article`, `risk_tier`, `control_ref`. Common fields (mapping_state/last_checked/note) unchanged. AWS remains the sole primary anchor; EU AI Act is a cross-reference by convention. New `eu_ai_act_convention` note added to the spec (primary-vs-cross-reference rule, control_ref ties to the eight, ISO 42001 explicitly excluded as a key).
- **All six Security standards mapped (mapping_state: unverified):** GS1B3-01 → Art 10 / Control #6 primary (+Art 15 confidentiality cross-ref); GS1B3-02 → Art 10 / #6 primary (ingestion side); GS2B1-01 → Art 15 robustness / #4 primary (+Art 15 accuracy / #3 cross-ref; #4 has no dedicated article, rides Art 15); GS4B2-01 → Art 15 cybersecurity / #2 primary (clean single fit); GS5B1-01 → Art 14 / #7 primary (+Art 12 / #8 logging cross-ref); GS6B1-01 → Art 10 + Art 15 (poisoning), control_ref null + Art 53 GPAI #5 as `na`.
- **GS6B1-01 flagged as outside the eight.** By the funnel's Gate-3 litmus ("would this control exist for a logistic regression?" → yes) training-data examination is generic ML data governance, not a GenAI-distinctive control. Mapped to Art 10/15 with control_ref null and an explicit note; Art 53 GPAI recorded as `na` (binds GPAI providers, not a deployer/customiser).
- **mapping_state is unverified across the board** — asserted from the funnel, NOT yet read side-by-side against the article text. Open item: a verification pass against Reg. 2024/1689 article text to promote to verified.
- **Each touched standard bumped MINOR** (x.y.z → x.(y+1).0) with a change_history entry recording the mapping and its provisional state.

### Artefacts

- `data/principles.json` — eu_ai_act blocks on GS1B3-01, GS1B3-02, GS2B1-01, GS4B2-01, GS5B1-01, GS6B1-01; versions bumped; change_history entries added. Parses clean.
- `data/taxonomy.json` — eu_ai_act framework_specific_reference_fields + eu_ai_act_convention note. Parses clean.
- `paid_workshop/part_2.md` — new "Three layers: the Act vs our standard vs ISO 42001" section (table + ST-GS1B3-01 worked example).

### Open items

- **Verify the six EU AI Act mappings** against Reg. 2024/1689 article text (currently all unverified). Single focused pass.
- **Other pillars unmapped** — only Security standards carry eu_ai_act so far. GENOPS/GENCOST standards may map to Art 9 (risk-MS) / Art 15 (accuracy) etc.; not yet done.
- **GS2B1-01 gate spans #3 and #4** — candidate for splitting into separate accuracy and content-safety standards when formalised.

---

## 2026-06-10 — GENSEC01-BP03 step 3 → GS1B3-02 promoted; PII deferral closed; first one-BP-two-standards case

### Context

Re-read GENSEC01-BP03 verbatim at the user's prompt ("why did we not take this?"). The BP WAS taken (GS1B3-01, step 4, 2026-06-07) — but the re-read corrected an in-session error: the step-3 PII-removal deferral had been framed earlier today as having "no Lens home" because GENSEC lacks a data-protection focus area. Wrong — step 3 itself is the anchor. User directed promote-and-complete (HALT waived; the deferral had been discussed twice in-session).

### Decisions

- **GS1B3-02 promoted** (ST-GS1B3-02 / PR-GS1B3-02) — *Never ingest what the model should never process*. 21st standard; sixth Security standard; focus area P21 — Endpoint Security (same as sibling, mirrors the AWS question area). step_promotion 3/3/3/3 hand-applied.
- **First one-BP-two-standards case:** GS1B3-01 (step 4) governs WHO retrieves — the read gate; GS1B3-02 (step 3) governs WHAT enters the store — the write gate. Access control cannot compensate for over-ingestion: a correctly ACL'd store still leaks PII to everyone authorized on the containing document. Distinct principle_ids retained (different whys: access vs minimisation); the v1.13 many-standards-per-principle model exercised in ID space.
- **Contract:** sanitisation manifest `ingestion/sanitisation/config.yaml` (data-card-derived exclusion classes — PII, credentials, prohibited, out-of-remit per AWS's customer-service example; per-class detector/action (mask/drop/human_review)/threshold; audit destination; waivers) + sanitisation stage wired AHEAD of the store on every ingestion path (writes only through the central ingestion SDK, the write-side sibling of GS1B3-01's retrieval SDK; detectors before embedding, then ACL labelling — first whether, then who) + three pre_merge lints (declaration completeness / data-card coverage / routed-ingestion AST lint, so a later-added nightly sync cannot bypass) + quarterly seeded-PII audit on GO1B1-01's harness. Enforcement limit appended to enforcement_limits.md (lints prove declared/covered/wired/logged, not detector recall — a vacuous detector passes).
- **Scope boundaries:** GS6B1-01 is the training-corpus twin (clean-before-the-model at the other entry point); GS2B1-01's output PII filter is a backstop, not a substitute.
- **Fields:** applicability { rag mandatory, agentic mandatory } (no model-accessible store = not applicable by omission); serving_paradigm all four; maturity foundational; impact High; ownership enterprise / project_architect / self_attestation_with_mechanical_evidence / dashboard_and_spot_check; dependencies GS1B3-01 soft + GO1B1-01 soft; references OWASP LLM02:2025 + Wiz/Microsoft 38TB; AIGP IV.C provisional — flagged as the family's strongest candidate to move under a privacy/data-governance competency.
- **not_prompted.json** — the deferred GENSEC01-BP03 step-3 entry removed (no longer a deferral).

### Artefacts

- `data/principles.json` — GS1B3-02 merged (21st node; schema-presence check passed).
- `data/ri/GS1B3-02/README.md` — RI authored (Option A, GS-family template).
- `data/lens_mapping.md` — BP03 row updated (deferral → promoted), GENSEC01 closure line updated (2 promoted), GENSEC06 pillar-closure note updated (residue resolved); `data/lens_mapping_authored.md` — top entry appended.
- `data/enforcement_limits.md` — GS1B3-02 worked case prepended; `agentflow/app/anchor.json` — completed/promoted; `data/not_prompted.json` — deferred entry removed.

### Open items (this change)

- JSON parse from terminal: `data/principles.json` + `data/not_prompted.json` (sandbox cannot reach the WSL mount).
- S3 re-upload for the live app; frontend renders P21 already (existing focus area).
- AIGP side-by-side review.
- **Security pillar now has ZERO open items** — GENSEC01–06 closed, 6 standards (GS1B3-01, GS1B3-02, GS2B1-01, GS4B2-01, GS5B1-01, GS6B1-01), no deferrals. Remaining unwalked elsewhere: GENOPS02 (3 BPs), GENOPS05, GENCOST03-BP02, GENREL pillar, GENPERF04-BP01 formal sweep.

---

## 2026-06-10 — GENSEC06-BP01 → GS6B1-01 promoted; GENSEC pillar fully walked; not_prompted.json ledger added

### Context

Walked GENSEC06 (Data poisoning), the last unwalked Security focus area. Verified from AWS docs (gensec06.html + gensec06-bp01.html, 2026-06-10): single BP — "Implement data purification filters for model training workflows", risk High, 6 steps. Standard authoring workflow: anchor loaded, statement drafted, HALT presented (candidate statement, problem sketch, four discussion points: mandate concentrated in steps 2+3; narrow-applicability tension vs the GENOPS04-BP02/GENPERF03-BP01 not_promotes; sibling check incl. the GENSEC01-BP03 PII deferral; enforcement honesty). User directed promote-and-complete end to end.

### Decisions

- **GS6B1-01 promoted** (ST-GS6B1-01 / PR-GS6B1-01) — *Never train a model on data no one has examined*. 20th standard; fifth Security principle; new focus area **P25 — Training Data Integrity**. Whole-BP anchor (mandate in the implementation guidance; steps 2+3 the core, 1/5 absorbed, 4/6 consider-advice absorbed as filter options). step_promotion 3/3/3/3 hand-applied. The LEARNING-side member of the guardrail family — input (GS4B2-01), retrieval (GS1B3-01), output (GS2B1-01), action (GS5B1-01), learning (this); the only face irreversible by rollback.
- **Contract:** purification manifest `training/purification/config.yaml` (policy-derived categories per AWS step 2; per-category filter/threshold/on_flag; audit destination; explicit waivers) + purification stage wired ahead of the job (job consumes purified output only — incl. managed-API fine-tunes via gating wrapper; per-run audit record with dataset hash) + three pre_merge required-status-check lints (declaration completeness / policy coverage / source coupling + audit-hash matching) + quarterly seeded-poison audit on GO1B1-01's harness. Enforcement limit appended to enforcement_limits.md (lints prove declared/covered/wired/logged, not that filters catch poison — a vacuous filter passes).
- **Applicability resolution:** all four patterns mandatory; the obligation binds the training/customization path and no-training-path workloads satisfy vacuously (the GS5B1-01 no-action-surface shape). The fine-tuning-is-not-an-applicability-key schema wrinkle flagged at HALT was resolved without a schema change.
- **Kept separate:** the GENSEC01-BP03 step-3 PII-removal deferral (retrieval corpus ≠ training corpus) — confirmed by the full pillar walk that GENSEC has no data-protection focus area, so it remains an extension candidate with no Lens anchor. Post-training toxicity eval absorbed by GO1B1 family; training-env isolation left to base-WAF.
- **GENSEC pillar CLOSED:** GENSEC01–06 all walked; 5 promoted (GS1B3-01, GS2B1-01, GS4B2-01, GS5B1-01, GS6B1-01), the rest not_promoted with receipts.
- **New ledger file `data/not_prompted.json`** (same session, earlier): flat HTML-renderable JSON of all 36 walked-but-rejected BP/step decisions (pillar, focus_area, bp, step, title, status not_promoted/deferred/intentionally_unmapped, plain-text reason, absorbed_by). Compiled from lens_mapping.md.
- **Methodology discussion (same session, recorded):** the catalogue's principles layer (`u_value`/`u_principle`) currently has NO source — standards trace to the Lens via lens_mapping.md, principles were back-derived in-session and have no provenance an ARB could inspect. Agreed direction: keep the layer but treat current u_principles as provisional/unanchored; future anchoring pass against (tier 1) org values / responsible-AI policy, (tier 2) regulators (EU AI Act obligations, FCA/ICO), (tier 3) frameworks (NIST AI RMF Govern, OECD, ISO/IEC 42001); record provenance in a principle_source field or a principle_mapping.md sibling. Principles deferred ≠ excluded: they carry waiver arbitration, novel-situation guidance, standards-conflict tiebreak, and executive endorsement.

### Artefacts

- `data/principles.json` — GS6B1-01 merged (20th node; all v1.13 fields present, schema-presence check passed against GS5B1-01).
- `data/ri/GS6B1-01/README.md` — RI authored (Option A; matches the GS-family template).
- `data/lens_mapping.md` — GENSEC06 section rewritten (verified, walked, CLOSED + pillar-closure note); `data/lens_mapping_authored.md` — top entry appended.
- `data/enforcement_limits.md` — GS6B1-01 worked case prepended; `agentflow/app/anchor.json` — completed/promoted.
- `data/not_prompted.json` — new.

### Open items (this change)

- **JSON parse not run in-session** (sandbox cannot reach the WSL mount) — run `python3 -c "import json; json.load(open('data/principles.json'))"` and the same for `data/not_prompted.json` from a terminal before pushing.
- Frontend: P25 — Training Data Integrity is a new free-text focus_area — confirm rendering; the S3 object must be re-uploaded for the live app to see GS6B1-01.
- AIGP IV.C side-by-side review (GS6B1-01 flagged: may belong under a data-governance competency).
- Principles-layer anchoring pass (tier 1–3 sources above) — not started.
- Remaining unwalked: GENOPS02 (3 BPs), GENOPS05, GENCOST03-BP02, GENREL pillar, GENPERF04-BP01 formal sweep.

---

## 2026-06-10 — Paid workshop re-cut to three parts; RI Blueprint (L1) vs RI Build (L2); prioritisation as the gate

### Context

Working the Maven workshop strategy off the free-intro deck (*Why Enterprise AI Agents Fail Beyond The Demo*). Resolved where the AWS GenAI Lens sits, how to scope the paid workshop, and a chicken-and-egg in prioritisation.

### Decisions

- **Paid 5-hr workshop ($500) re-cut** from the 5-block design into a **3-part agenda**: (1) Why principles matter + GenAI Lens deep-dive; (2) the prioritization framework; (3) one build end-to-end, live. The 5-block detail is retained as a content reservoir in `paid_workshop.md` (new 2026-06-10 section at the top supersedes the block agenda as the *delivered* structure).
- **New catalogue artefact: RI Blueprint (L1) vs RI Build (L2).** Blueprint = a sized sketch (enough to estimate effort, not a code build), produced in BAU, catalogue-resident, NOT in the sprint. Build = the full code-level RI a sprint produces.
- **EA pipeline:** Principles → Standards → RI Blueprint → Prioritisation → RI Build. BAU = principles + standards + blueprint (continuous); **quarterly sprint = RI Build only**; prioritisation is the **gate** that sets the quarter's agenda. Each build = a funded mini-project (budget, owner, RACI). Fixes the prioritise-without-estimates chicken-and-egg (the estimate comes from the blueprint).
- **Scope boundary:** workshop does NOT teach identifying principles / deriving standards; assumes the catalogue exists; **AWS GenAI Lens is a source feeding Standards**, not re-derived in the room.
- **Terminology:** drop "enforceable principle" — principles aren't enforceable on their own; the enforceable artefact is the **standard** (and its RI).
- **Part 4** (common build challenges + org structures) considered and **left OUT** of the agenda (parked; only revive with real war stories + a concrete org chart).
- Dropped the deprecated **project/enterprise failure-modes framing** from the free-intro CTA slide.

### Artefacts

- Repo-root diagram/CTA assets: `ea-catalogue-pipeline-v2.svg`, `workshop_three_part.svg`, `workshop-bridge-slide.html`.
- `paid_workshop.md` — added the 2026-06-10 strategy section.

### Open items (this change)

- None blocking. If Part 4 is revived it needs real war stories + a concrete org example. Catalogue/data-model open items from the 2026-06-09 entries below still stand independently.

---

## 2026-06-09 — Each node is a STANDARD: `principles` → `standards`, dual `standard_id` / `principle_id`

### Context

Continuing the layering work. With `u_value` / `u_principle` (aspirational), `statement` (abstract rule), and `gates` (enforcement) all in place, the remaining mismatch was the node identity: each node was still called a "principle" and keyed by `principle_id` (GO1B1-01), even though the node is really the enforceable STANDARD. The user reframed: the node is a standard; the principle is what it ladders up to; and one principle should be able to carry several standards.

### Decision — data files only (user-chosen scope)

- Root array `principles` → `standards`; file `principles.json` → `standards.json`.
- Each node gains a `standard_id` (its own id, `ST-<bp_code>-NN`, e.g. ST-GO1B1-01) at the same level as `principle_id`, and the existing `principle_id` value is re-prefixed to `PR-<bp_code>-NN` (e.g. PR-GO1B1-01). This makes principle→standard one-to-many; the catalogue is currently 1:1.
- Internal cross-references were LEFT BARE this pass (user-chosen): dependencies[].principle_id values, data/ri/<id>/ folder names, lens_mapping, and historical change_history / explain_prompt text still say `GO1B1-01`. They are now dangling and need a reconciliation pass.
- The s3-json-viewer app and the S3 object (`ea/principles.json`) were NOT touched.

### What changed

- **`principles.json`** (content) — root key → `standards`; all 19 nodes got `standard_id` (ST-) + re-prefixed `principle_id` (PR-); `format_version` → 1.13 with a meta note.
- **`principle_schema.json`** — added `standard_id` field; updated `principle_id` field (PR- format, laddering, dangling-ref caveat).
- **`taxonomy.json`** — added `standard_id` to the field list; added `conventions.standard_id_format`; appended a v1.13 note to `conventions.principle_id_format`.

### Open items (this change)

- **FILE RENAME NOT DONE in-session** — the sandbox blocks shell/file-move ops on the workspace UNC path, so `principles.json` was content-converted in place but NOT physically renamed. Run `mv data/principles.json data/standards.json` (or rename in your file explorer) to finish. The file content is already on the `standards` shape.
- JSON-parse verification still cannot run in-session — run `python3 -c "import json; json.load(open('data/standards.json'))"` (after the rename) from a terminal.
- **Dangling references** — dependencies[].principle_id (bare `GO1B1-01`), data/ri/<id>/ folder names, lens_mapping, governance.json related_principle fields, classstrategy.md: decide whether to re-point them at `ST-` (standard) or `PR-` (principle) ids, and whether to rename the dependency field key `principle_id`→`standard_id`. Until then they don't resolve to any node's id.
- **App / S3** — s3-json-viewer reads the `principles` root + bare ids and the S3 key `ea/principles.json`; the live site will break against the new shape until the frontend, env/key, and the S3 object are updated. Out of scope per the chosen "data files only".
- The earlier u_value/u_principle and altitude-split open items still stand (frontend rendering, explain_prompt restating old titles, optional rubric extension).

---

## 2026-06-09 — Added `u_value` + `u_principle`: the aspirational value layer above the abstract rule

### Context

Follow-on from the altitude-split entry below. Discussion clarified that the rewritten `statement` titles, while abstract, were still phrased as directives ("Check a consequential action before it happens") — they state the rule, not the *why*. A true principle in the corporate-value sense names a value and an aspirational commitment (the worked reference: "Fairness — We are committed to building AI systems that promote equal opportunity…"). The user wanted that aspirational why-layer captured explicitly, distinct from the abstract rule.

### Decision

Two new optional root fields on every principle, sitting ABOVE `statement`:

- **`u_value`** — the short value name the principle ladders up to (Fairness, Safety, Privacy, Confidentiality, Accountable Agency, Responsible Stewardship, …). Human-facing; deliberately may be shared across principles.
- **`u_principle`** — the aspirational, why-first principle statement: the reason the rule exists, stated without naming any artefact, gate, or enforcement (e.g. GS5B1-01 "Acting in the world is irreversible, so nothing consequential happens on the model's say-so alone").

Full three-layer model per node now: `u_value` / `u_principle` (aspirational why) → `statement` (abstract rule) → `gates` (the standard / enforcement). The `standard` root field discussed earlier was NOT added this pass — the existing `statement` + `gates` already carry the rule and its enforcement; revisit if a separate prescriptive `standard.title` is still wanted.

### What changed

- **`principles.json`** — `u_value` + `u_principle` added to all 19 nodes (phrasings approved interactively, deliberately non-formulaic — no shared "We are committed to…" stem). `format_version` bumped to 1.12 with a meta note.
- **`principle_schema.json`** — both fields defined (optional, string) after `principle_id`; `statement` field description updated to "abstract rule" and to point up at `u_value`/`u_principle`.
- **`taxonomy.json`** — both fields added to the field list; `statement` field description updated to the three-layer framing.

### Open items

- `principles.json` JSON-parse verification still cannot run in-session (sandbox blocks the workspace UNC path) — run `python3 -c "import json; json.load(open('data/principles.json'))"` from a terminal before pushing.
- Frontend (`s3-json-viewer`) not yet updated — `u_value` / `u_principle` will currently render as a raw-JSON fall-through tab (humanised "U Value" / "U Principle") via the resilience pattern, not crash. Surface them properly in the header / statement area when convenient.
- No `change_history` bump was added to the 19 nodes for THIS field addition (the abstraction pass already added a 2026-06-09 entry each) — decide whether to add a second per-node entry recording u_value/u_principle, or let the meta note + this log entry stand.
- Statement rubric not extended to score `u_principle` for why-ness / `u_value` for value-shape — add a check if these fields are to be authored by the pipeline later.
- `standard` root field deferred (see Decision).

---

## 2026-06-09 — Principle/standard altitude split: statements rewritten to abstract register, gates are the standard

### Context

A walkthrough of the principle-vs-standard distinction surfaced that the catalogue's `statement` titles were written at **standard altitude**, not principle altitude. They were imperative, mechanism-named directives ("Cap every prompt template at a declared token budget and fail builds whose token footprint exceeds it", "Route every model call through a registered, versioned prompt template via the central SDK") — must/shall register, naming the artefact and the CI check. By the working definition reached in discussion: a **principle** is the durable why (should/ought, survives a tool change); a **standard** is the concrete, datable, must/named-artefact spec that proves the principle is met. The old titles were standards wearing principle clothing. The old statement rubric actively enforced this — its `is_prescriptive` dimension scored abstract noun-phrase titles as FAIL and rewarded imperative mechanism-naming.

### Decision — rewrite statements to the abstract principle; keep gates as the standard

The user chose (over the non-breaking "add a principle line above each" alternative) to **rewrite all statements to abstract register**, accepting that this is the breaking option and forces the rubric/taxonomy/CLAUDE.md framing to move with it.

Within a principle there are now two explicit altitudes: `statement` = the abstract principle (durable why, names the failure, no mechanism); `gates` = the standard (named artefacts, paths, thresholds, CI checks — the built-against enforcement). No information is lost: the artefact/enforcement detail the statements used to carry already lives in `gates` and `solution.approach`.

### What changed

- **All 19 `statement` titles + descriptions in `principles.json`** rewritten to should/ought register, mechanism-naming stripped. E.g. "Maintain a versioned ground-truth evaluation harness…" → "Prove an agent still behaves before you ship a change to it"; "Give every agent a hard stop" → "Give every agent a limit it cannot run past"; "Put every consequential agent action through a gate before it runs" → "Check a consequential action before it happens, not after". `gates`, `solution`, `problem`, `framework_mappings`, and all other sections are UNCHANGED.
- **`sections/statement/rubric.json` → v2.** `is_prescriptive` replaced by `is_abstract_principle` (mechanism-naming now FAILS); `derives_from_aws_verbatim` relaxed to `derives_from_aws_intent` (verbatim term-mapping now lives in gates, so the abstract statement need only carry the step's intent); `names_artefact_and_enforcement` replaced by `names_failure_not_mechanism`. Calibration examples and output_contract keys updated; threshold rule (all ≥ 2) unchanged.
- **`taxonomy.json`** — `statement` field description rewritten (abstract principle, not "built against"); `gates` field description now names it the standard layer.
- **`data/CLAUDE.md`** — statement-authoring note updated to the new altitude rule; new altitude paragraph added to the "What the catalogue is — the layers" section.

### Open items

- `principles.json` JSON-parse verification could not be run in-session (sandbox blocks the workspace UNC path) — run `python3 -c "import json; json.load(open('data/principles.json'))"` from terminal to confirm clean parse. This is now the ONLY blocking verification gap; the edit volume this pass (19 statements + 19 current_version bumps + 19 appended change entries + rubric/taxonomy/CLAUDE.md) makes the terminal parse-check worth running before push.
- DONE — `change_history` bumps added for all 19 principles: each got a PATCH bump (current_version .Z+1) and an appended 2026-06-09 entry recording the abstraction; scope/enforcement unchanged so PATCH (not MINOR) was used.
- DONE — all 19 reference implementations under `data/ri/` had their line-4 title reference updated to the new abstract title (mechanism prose after the title left intact, since the RI is the standard/implementation layer).
- NOT done (deliberately deferred) — each principle's `explain_prompt.system` still restates the prior prescriptive title and recaps the old mandate language under "THE PRINCIPLE". Left unchanged this pass (19 long compiled prompts; rewriting them is a separate, higher-risk task). Each new change_history entry flags this inline. Decide whether to recompile explain_prompts to the abstract title later.
- Prior open items stand (GS5B1-01 JSON-parse verify + P24 frontend render; GENSEC06; GENOPS02 / GENOPS05; GENCOST03-BP02; GENREL; AIGP sweeps; GO3B1-01 context-boundary template-lint follow-up).

---

## 2026-06-08 — Framing correction: classify by functional-vs-NFR (the remit), not blast radius; tier is the deploy-location axis

### Context

Working through the Maven workshop failure slides (PII in trace logs, model drift via a floating `-latest` alias, an ungated agent action) surfaced that the "project-level vs enterprise-level" labelling on the slides — anchored on **blast radius / impact** — does not hold. "Blast radius" describes consequence reach, which comes apart from the question the catalogue actually answers. A GDPR PII leak is contained to one workload's bucket (looks project-level) yet carries enterprise-scale consequences (corporate fine) and warrants an enterprise-tier control. Blast radius is the wrong anchor.

The cleaner anchor, surfaced by the user: **functional vs non-functional.** A project owns its functional requirements — it specs them, unit-tests them, and won't ship them broken. What projects systematically do NOT test is the cross-cutting NFRs (observability, model-version discipline, input/output guardrails, action authorization, retrieval authorization, cost). Those — identical across every workload and neglected until audit/incident time — are the scaffolding the enterprise architecture function owns. That is the entire remit of this catalogue.

### Decision — two clarifications, no principle or rubric mechanics change

1. **Remit anchor = functional vs non-functional.** The catalogue is a set of enforceable AI NFRs. Functional correctness is the project's job and is deliberately out of scope; the principles already encode this in their scope boundaries — GS2B1-01 punts backend-correctness to app-side business logic, GS5B1-01 gates the action rather than the model's reasoning. Use functional-vs-NFR to decide whether something is a principle at all.

2. **Tier = deploy-location axis, subordinate to the remit.** `ownership.tier` (project vs enterprise) answers only *where* an NFR's enforcement is built — an in-repo lint the project runs, or a central platform service — per the tier rubric (D1 legal exposure / D2 repeatability). It does NOT classify the failure's severity or blast radius and must never be used as an impact label.

**Deprecated:** "blast radius" / "project-level vs enterprise-level impact" as a failure classifier. It conflates consequence reach with both the remit and the tier axes.

### What changes / does not change

- **No change** to any principle in `principles.json` (all 19 are already NFRs by construction), to the tier-rubric mechanics, or to any scope boundary. The reframe validates the existing work rather than altering it.
- **Added** the framing to `data/CLAUDE.md` (new "What the catalogue is — the layers" section) and a clarifying sentence to the CLAUDE.md tier paragraph. The section makes the model three layers: (1) **remit** — functional vs NFR (is it a principle at all); (2) **tier** — project vs enterprise (where the enforcement is built); (3) **priority** — what order an adopting org builds them, via the existing per-org Principle Prioritization Tool (`principle_prioritization_tool.md`), the strict lexicographic ladder **Legal/Compliance > Customer Experience > Cost**. Layers 1–2 are catalogue-intrinsic; layer 3 is a downstream per-org tool, not catalogue metadata.

**Org Readiness dropped from the ladder (2026-06-08).** The prioritization ladder was reduced from four axes to three (Legal > CX > Cost). "Org Readiness" was removed: as used it conflated (a) cost-to-adopt / dev-behaviour-change, which is near-universal across EA principles and is a feasibility input not a cost-of-absence one, and (b) operational toil, which reduces to Cost. The residual sliver (strategic enablement — can't reach a committed roadmap/market) was too thin to justify a rung. The three surviving axes are three distinct harm-bearers of absence: regulator (Legal), customer (CX), the business's money (Cost). Cost-to-build / adoption effort now lives only in `ownership.tier` + `maturity_level` (feasibility/sequencing), never on the ladder. `principle_prioritization_tool.md` rewritten accordingly.
- Workshop material is being reframed by the user at their end (drop the blast-radius slides; re-anchor on functional-vs-NFR).

### Open items

- Optional: mirror the two-axis note into `taxonomy.json` conventions next time that file is edited.
- Prior open items stand (GS5B1-01 JSON-parse verify + P24 frontend render; GENSEC06; GENOPS02 / GENOPS05; GENCOST03-BP02; GENREL; AIGP sweeps; GO3B1-01 context-boundary template-lint follow-up).

---

## 2026-06-08 — GENSEC05-BP01 (Implement least privilege access and permissions boundaries for agentic workflows) PROMOTED → GS5B1-01 (agent action gate); GENSEC05 CLOSED; catalogue now 19

### Context

Walked GENSEC05 — the OWASP "excessive agency" focus area. AWS verbatim fetched 2026-06-08 (gensec05.html + gensec05-bp01.html). Question: *"How do you avoid excessive agency for models?"* Excessive agency is an OWASP Top-10 LLM threat, typically introduced through agentic architectures: an agent takes actions beyond its intended purpose — not malicious, an unintended consequence of automation, the agent having little knowledge beyond the prompt of what is permitted. GENSEC05 ships exactly ONE BP. GENSEC05-BP01 (risk **High**) has 4 steps: (1) review org IAM guidelines / SCPs for least-privileged roles; (2) scoped IAM policy for agent roles (resource ARNs, VPC conditions); (3) attach policy to an agent-assumable role, permission boundaries, trust-policy conditions; (4) **implement user confirmation for agent actions.** Steps 1-3 are generic IAM (AWS Resources cross-ref SEC02-BP01/02/06 + SEC03-BP01/02 — the same base-WAF BPs that drove the GENSEC01-BP01 not_promote); step 4 + the excessive-agency framing is the GenAI-distinct slice.

### Decision — PROMOTE → GS5B1-01

**GS5B1-01 — "Put every consequential agent action through a gate before it runs."** 19th principle (9 GENOPS + 6 GENCOST + 4 GENSEC: GS1B3-01, GS2B1-01, GS4B2-01, GS5B1-01); fourth Security focus area, new **P24 — Agentic Action Control** (mirrors AWS GENSEC05 "Excessive agency", named for the control not the risk). Anchored whole-BP (implementation_step null) — steps 1-3 are generic IAM, the mandate lives in the implementation guidance + step 4. step_promotion **3/3/3/3**.

**THE ACTION-side member of the Security guardrail family.** GS4B2-01 screens INPUT, GS2B1-01 screens OUTPUT, GS1B3-01 governs RETRIEVAL (read), GS5B1-01 governs what the agent DOES (write) — the fourth and last face of the agent surface, the only one that changes the world, unowned by any sibling.

**Mechanism:** every agent declares a tool manifest (per tool `scope` + `class` read/write + a `gate` for writes); the agent loop executes tools only through a central wrapper (`run_tool`) that builds the toolbelt from the manifest (reachable = declared) and runs a write tool's gate before executing. Gate has two forms — `confirm` (human-in-loop) or `policy:<name>` (deterministic, unattended), policies standardised to a uniform `(ctx) -> bool` signature. Three pre_merge required-status-check lints: declaration completeness; routed-execution AST lint (GO3B1-01 no-inline pattern, action plane); consequential-implies-gated (incl. unattended-write-needs-policy). Plus a quarterly agent red-team + blast-radius review.

**Decisions worked out in the extended HALT** (the user pressed on the normal agent paradigm — tool selection by description, where the agent sits in a chatbot request flow, what is enforceable, how it standardises, what the project must do, and how it holds for triggered/batch agents with no human loop): (1) **PROMOTE not not_promote** — unlike GENSEC01-BP01 (pure generic IAM), this carries a GenAI-distinct slice. Description-based tool selection is the model REASONING (soft, probabilistic, manipulable); the principle adds the AUTHORIZATION layer (a hard boundary on what is reachable and what fires without a check). The two are different layers; conflating them is the failure. (2) **Scope = the OWASP triad** (excessive functionality + permissions + autonomy): the manifest caps functionality, the per-tool execution role caps permissions, the write-gate caps autonomy. (3) **IAM half (steps 1-3) not re-linted** — it becomes the ENFORCEMENT behind the manifest's `scope` (the per-tool least-privilege execution role), depended on rather than reinvented; the manifest is the GenAI-distinct declaration layer on top. (4) **Gate two forms** so the principle holds for non-interactive agents: the consequential-implies-gated lint fails an unattended write gated only by `confirm`, forcing a policy gate — this resolved the user's strongest challenge. (5) **Policy signature standardised** to `(ctx) -> bool` (single context object, not unpacked tool args) so the dispatcher + lint + red-team treat all policies uniformly; logic project-local. (6) **Enforcement limit** (data/enforcement_limits.md): the lints prove consequential tools are DECLARED, ROUTED, and wired to a GATE — they cannot prove the `class` is HONEST (a write mislabeled read passes) or the `scope` MINIMAL (an over-broad role passes). Efficacy → quarterly agent red-team + blast-radius review (adversarial action corpus through the gated agent, escape-rate vs threshold + classification/scope honesty review, reusing GO1B1-01's harness).

Other fields: applicability { agentic } ONLY (no action surface without tools; a non-agentic LLM/RAG workload that calls tools IS agentic by the catalogue taxonomy — same agentic-only shape as GO1B1-01/02); serving_paradigm all four (the gate lives in the agent loop, not the serving infra); maturity **foundational** (per-PR repo-local lint, no deployed substrate, pays off at project #1 — the maturity rubric's FAIL example forbids labelling a repo-local lint "scaling"; the central agent SDK is a soft dependency since a standalone wrapper also satisfies the contract); impact **High** (matches AWS; the cited Replit incident wiped production data for 1,200+ companies during an explicit freeze); dependencies [{ GO3B1-01 soft }, { GO1B1-01 soft }]; references 2 real (Replit production-DB deletion — Fortune Jul 2025; OWASP LLM08:2025 Excessive Agency — the definition AWS itself cites); AIGP IV.C provisional unverified; ownership enterprise (D1 no-borderline / D2=3 central agent SDK) / project_architect / self_attestation_with_mechanical_evidence / dashboard_and_spot_check. Legacy PRIN_008 (Agent Security Framework) formally ruled out — historical-only, broad framing, not this specific action-authorization contract. RI at data/ri/GS5B1-01/README.md (Option A).

**GENSEC05 focus area CLOSED — 1 BP, promoted (GS5B1-01).**

### Tracking files updated

`principles.json` (GS5B1-01 appended; catalogue 18 → 19), `data/ri/GS5B1-01/README.md` (new), `lens_mapping.md` (GENSEC05 section converted to step-level ledger + CLOSED), `lens_mapping_authored.md` (prepended promote entry), `agentflow/app/anchor.json` (promoted), this entry.

### Open items

- **JSON parse not run in-session** (sandbox cannot reach the WSL mount) — verify `python3 -c "import json; json.load(open('data/principles.json'))"` from a terminal before pushing.
- **Frontend** — `P24 — Agentic Action Control` is a new free-text focus_area; `npm run build` from `s3-json-viewer/` to confirm rendering.
- AIGP IV.C unverified (same provisional placement as GS2B1-01 / GS4B2-01).
- GENSEC06 (Data poisoning) remains the last GENSEC focus area to walk.
- Prior open items stand (GENOPS02 / GENOPS05; GENCOST03-BP02; GENREL; AIGP sweeps; GO3B1-01 context-boundary template-lint follow-up from GS4B2-01).

---

## 2026-06-07 — GENSEC04-BP02 (Sanitize and validate user inputs) PROMOTED → GS4B2-01 (input guardrail); catalogue now 18

### Context

Revisited GENSEC04-BP02 — the input-side prompt-injection defence that was not_promoted (user-deferred "ignore") earlier the same day. User directed authoring this session ("lets do BP02"). AWS verbatim re-confirmed 2026-06-07 (risk **High**): user input is open/unstructured → prompt-injection risk; add an abstraction layer between input and model that validates/sanitizes (keyword scan / guardrails solution / LLM-as-a-judge), put context boundaries in prompt templates, set character/token size limits + request rate limits. Steps 1–3 are a Bedrock Guardrails console walkthrough; steps 4–5 carry the architectural content.

### Decision — PROMOTE → GS4B2-01

**GS4B2-01 — "Put every user input through a guardrail before it reaches the model."** 18th principle (9 GENOPS + 6 GENCOST + 3 GENSEC: GS2B1-01, GS1B3-01, GS4B2-01); third Security focus area, new **P23 — Prompt Security** (mirrors AWS GENSEC04 focus-area title). Anchored to the whole BP (implementation_step null) — steps 1–3 are vendor-console; the mandate lives in the implementation guidance + steps 4–5. step_promotion **3/3/3/3**.

**The INPUT-side mirror of GS2B1-01 (output side).** Together they give full input+output guardrail coverage. Distinct/unowned: runtime INPUT screening. GS2B1-01 inspects the model's response, GO3B1-01 governs which template, GS1B3-01 governs retrieval, GO1B1 is pre-merge eval — none screen user-influenced input on its way into the model. Provider-neutral (Bedrock Guardrails / Guardrails.AI / NeMo / LLM-as-a-judge).

**Mechanism:** every user-influenced model-calling path declares an input-guardrail config (`input_filters` injection + prompt-extraction screening; `limits` max_prompt_tokens + per-caller rate_limit; `on_trip` block_and_replace / escalate) and routes user input through the input-guardrail wrapper on GO3B1-01's central LLM SDK. Three pre_merge required-status-check lints: declaration completeness; routed-input AST lint (no raw user input reaches a model call bypassing the guardrail — GO3B1-01 no-inline pattern, input side); limits-declared. Plus a quarterly prompt-injection red-team.

**Decisions worked out in the HALT (user said "suggest", then "finish full principle"):** (1) **Separate principle, not folded into GS2B1-01** — different AWS focus area (GENSEC04 vs GENSEC02), input/output guardrails declare different configs and gate independently, clean output→input mirror. (2) **Context-boundary split** — the untrusted-input delimiter in the template is a property of the registered template (GO3B1-01's turf), so its template-lint is a **GO3B1-01 follow-up**; GS4B2-01 requires the boundary and depends (soft) on GO3B1-01 rather than re-linting the template. (3) **Enforcement limit** (same as GS2B1-01, in data/enforcement_limits.md): the lints prove the input guardrail is WIRED IN, limits DECLARED, and input ROUTED — not that it CATCHES a given injection (recall is runtime; weakest-setting guardrail passes the build). Efficacy → quarterly injection red-team (AWS step 2's curated injection list, reusing GO1B1-01's harness).

Other fields: applicability { llm, rag, agentic } mandatory (ml omitted — no FM prompt; agentic has most surface — injection can hijack a tool call); serving_paradigm all four; maturity foundational (injection is day-1 risk — DPD / Bing-Sydney incidents were early single-bot deployments; gate reads the repo); impact High; dependencies [{ GO3B1-01 soft }, { GO1B1-01 soft }]; references 2 real (DPD chatbot Jan 2024 "disregard your rules"; Bing/Sydney Feb 2023 "ignore previous instructions" → system-prompt leak); AIGP IV.C provisional unverified; ownership enterprise (D1 no-borderline / D2=3) / project_architect / self_attestation_with_mechanical_evidence / dashboard_and_spot_check. RI at data/ri/GS4B2-01/README.md (Option A).

**GENSEC04 focus area — 1 of 2 BPs promoted** (BP01 not_promoted → GO3B1-01 + generic IAM; BP02 → GS4B2-01).

### Tracking files updated

`principles.json` (GS4B2-01 appended; catalogue 17 → 18), `data/ri/GS4B2-01/README.md` (new), `lens_mapping.md` (BP02 row flipped to promoted + GENSEC04 count note), `lens_mapping_authored.md` (prepended promote entry; superseding note on the earlier deferral), `agentflow/app/anchor.json` (promoted), this entry.

### Open items

- **JSON parse not run in-session** (sandbox cannot reach the WSL mount) — verify `python3 -c "import json; json.load(open('data/principles.json'))"` from a terminal before pushing.
- **Frontend** — `P23 — Prompt Security` is a new free-text focus_area; `npm run build` from `s3-json-viewer/` to confirm rendering.
- **GO3B1-01 template-lint follow-up** — add the untrusted-input context-boundary delimiter check to GO3B1-01's template registry (the boundary GS4B2-01 depends on).
- AIGP IV.C unverified (same provisional placement as GS2B1-01).
- GENSEC05 (Excessive agency), GENSEC06 (Data poisoning) remain to walk.
- Prior open items stand (GENOPS02 / GENOPS05; GENCOST03-BP02; GENREL; AIGP sweeps; BP04 end-user-attribution slice as a GO3B2-01 field).

---

## 2026-06-07 — GENSEC04-BP02 (Sanitize and validate user inputs) not_promoted (user-deferred); GENSEC04 CLOSED [SUPERSEDED — revisited and PROMOTED → GS4B2-01, see latest entry above]

### Context

Walked GENSEC04-BP02 ("Sanitize and validate user inputs to foundation models", AWS risk **High**, verbatim fetched 2026-06-07) — the input-side prompt-injection defence deferred from GS2B1-01. BP mandate: an abstraction layer that validates/sanitizes user input before it reaches the model (injection detection via keywords / guardrail / LLM-as-a-judge), context boundaries delimiting untrusted input in the template, and size/rate limits.

### Decision

**not_promoted — user directed ("ignore").** It was presented as a legitimate promote candidate (sibling to GS2B1-01, input side: route every user-influenced prompt through an input-validation guardrail before the model; delimit untrusted input via context boundaries in the GO3B1-01 template; size/rate limits; enforce via the wrap-route-lint pattern, efficacy via red-team). The user chose not to author it this session. Recorded as a **deferred-by-choice** candidate, not a structural not_promote: the substance is real and GenAI-distinct (prompt injection is LLM-specific) — it is the GS2B1-01 guardrail mechanism applied to the input direction — and can be authored later as a separate sibling (mirroring AWS's GENSEC02-output / GENSEC04-input split) or folded into GS2B1-01 as an input+output guardrail. No new principle; **catalogue stays at 17.**

**GENSEC04 focus area CLOSED** — BP01 (secure prompt catalog) not_promoted (owned by GO3B1-01 + generic IAM); BP02 (sanitize/validate inputs) not_promoted (user-deferred input-guardrail candidate).

### Tracking files updated

`lens_mapping_authored.md` (prepended), `lens_mapping.md` (BP02 row + GENSEC04 closed note), `agentflow/app/anchor.json` (not_promoted), this entry.

### Open items

- **GENSEC04-BP02 is a live deferred candidate** — author later as an input-side sibling to GS2B1-01, or fold both into one guardrail principle. The strongest unbuilt GENSEC promote on the table.
- GENSEC05 (Excessive agency), GENSEC06 (Data poisoning) remain to walk.
- Prior open items stand (JSON-parse / frontend-build; GENOPS02 / GENOPS05; GENCOST03-BP02; GENREL; AIGP sweeps; BP04 end-user-attribution slice as a GO3B2-01 field).

---

## 2026-06-07 — GENSEC04-BP01 (Implement a secure prompt catalog) not_promoted

### Context

Walked GENSEC04-BP01 ("Implement a secure prompt catalog", AWS risk **Medium**, verbatim fetched 2026-06-07). GENSEC04 ("How do you secure system and user prompts?", focus area "Prompt security") ships two BPs; BP01 here, BP02 (sanitize/validate inputs) next.

### Decision

**not_promoted — user directed.** The catalog itself (centralized, versioned prompt storage routed for reuse) is **already owned by GO3B1-01** (Route every model call through a registered, versioned prompt template via the central SDK). The only thing BP01 adds is the "secure" wrapper — IAM least-privilege on prompt actions (`CreatePromptVersion`, `GetPrompt`), separation-of-duties roles — which is generic IAM access control (base WAF, the same GENSEC01-BP01 shape already not_promoted) applied to the registry, plus the access-governance pattern GO3B2-02 established. Steps are a Bedrock Prompt Management vendor walkthrough. Nothing GenAI-distinct and unowned survives. step_promotion would fail `architecturally_distinct` (GO3B1-01 owns the catalog) + `not_vendor_menu`. No new principle; **catalogue stays at 17.**

### Tracking files updated

`lens_mapping_authored.md` (prepended), `lens_mapping.md` (GENSEC04 section started — BP01 row), `agentflow/app/anchor.json` (moved to BP02), this entry.

### Open items

- **GENSEC04-BP02 (Sanitize and validate user inputs) walk in progress** — the input-side prompt-injection defence deferred from GS2B1-01; likely a real promote candidate (sibling to GS2B1-01, input side).
- Prior open items stand (JSON-parse / frontend-build; GENSEC05/06; GENOPS02 / GENOPS05; GENCOST03-BP02; GENREL; AIGP sweeps).

---

## 2026-06-07 — GENSEC03-BP01 (control plane + data access monitoring) not_promoted; GENSEC03 CLOSED

### Context

Walked GENSEC03-BP01 ("Implement control plane and data access monitoring to generative AI services and foundation models", AWS risk **High**, verbatim fetched 2026-06-07, 6 step-groups). GENSEC03 ("How do you monitor and audit events associated with your generative AI workloads?", focus area "Event monitoring") ships exactly one BP; this walk closes the focus area.

### Decision

**not_promoted — user directed.** A broad monitoring umbrella (six step-groups: performance, quality/accuracy, security, cost, audit trail, compliance monitoring) implemented via CloudTrail (control + data events) and CloudWatch. Three reasons: (1) **generic control-plane/data-plane monitoring** owned by the base WAF — AWS cross-references SEC04-BP01 (detect/investigate events via app+service logging); (2) **vendor menu** (CloudTrail management/data events, CloudWatch, SageMaker Lakehouse, Q in QuickSight); (3) **umbrella whose sub-concerns are each already owned** — telemetry/audit trail → GO3B2-01/02, eval/quality → GO1B1, cost → the GENCOST family / GO3B2, and it overlaps the access-monitoring BP just not_promoted (GENSEC01-BP04) plus the security-monitoring slice partly covered by GS1B3-01. The "monitor for prompt injection / data leakage" lines are detection signals that ride GO3B2's trace stream, not a distinct enforceable artefact. step_promotion would fail `architecturally_distinct` (base WAF + GO3B2/GO1B1 own it) + `not_vendor_menu`. No new principle; **catalogue stays at 17. GENSEC03 CLOSED** (one BP, not_promoted).

### Tracking files updated

`lens_mapping_authored.md` (prepended), `lens_mapping.md` (GENSEC03 section + closed note), `agentflow/app/anchor.json` (not_promoted), this entry.

### Open items

- GENSEC03 closed. Remaining GENSEC: **GENSEC04 (Prompt security — owns the input-side prompt-injection defence deferred from GS2B1-01; likely a real promote candidate)**, GENSEC05 (Excessive agency), GENSEC06 (Data poisoning).
- Prior open items stand (JSON-parse / frontend-build verifications; GENOPS02 / GENOPS05; GENCOST03-BP02; GENREL; AIGP sweeps; BP04 end-user-attribution slice as a GO3B2-01 `end_user_id` field).

---

## 2026-06-07 — GENSEC02-BP01 PROMOTED → GS2B1-01 (guardrail on every model response); GENSEC02 CLOSED; catalogue now 17

### Context

Walked GENSEC02-BP01 ("Implement guardrails to mitigate harmful or incorrect model responses", AWS risk **High**, verbatim fetched 2026-06-07). GENSEC02 ("How do you stop GenAI applications from generating harmful, biased, or factually incorrect responses?") ships exactly one BP; this walk closes the focus area. User directed PROMOTE after an interactive HALT that worked out scope and enforcement.

### Decision — PROMOTE → GS2B1-01

**GS2B1-01 — "Put every model response through a guardrail."** 17th principle (9 GENOPS + 6 GENCOST + 2 GENSEC); second Security principle; new focus area `P22 — Response Validation`. Anchored to the whole BP (implementation_step null) — BP01's two numbered steps are pure vendor-console walkthroughs (Bedrock Guardrails console; Q Business console); the mandate (guardrail + declared fallback) is in the implementation guidance. step_promotion 3/3/3/3.

**Distinct/unowned:** runtime OUTPUT validation. GO1B1 is pre-merge eval, GO3B2 observability, GO3B1 input prompts, GS1B3-01 retrieval input — none inspect the model's response on its way out. Provider-neutral (Bedrock Guardrails / Guardrails.AI / NeMo).

**Mechanism:** every model-calling path declares a guardrail config (`output_filters` content/toxicity/denied-topics/PII; `grounding` on for RAG; `on_trip` fallback) and routes the response through the guardrail wrapper on GO3B1-01's central LLM SDK. Three pre_merge required-status-check lints: declaration completeness; routed-output AST lint (no raw response returned bypassing the guardrail — GO3B1-01 no-inline pattern, output side); grounding-required-for-RAG. Plus a quarterly guardrail-efficacy red-team.

**Scope boundaries (user-driven in the HALT):** (1) content/safety + grounding-against-retrieved-context only; **backend-correctness verification is OUT of scope** — the user pressed this with a retail marketing-offer example (an agent inventing a plausible-but-fake discount code a content guardrail waves through); that's app-side business-logic verification, a different mechanism. (2) RAG grounding checks faithfulness to the RETRIEVED context, not the live backend (raised when the user noted LLM responses are intertwined with backend data). (3) Input-side prompt-injection defence deferred to a future GENSEC04 (Prompt security) walk.

**Enforcement limit (the session through-line):** the lints prove the guardrail is WIRED IN + fallback DECLARED + RAG grounding ON — not that it CATCHES bad output (recall is runtime; a guardrail on its weakest setting passes the build). Efficacy → quarterly red-team (adversarial fixtures through the guardrail, trip-rate vs threshold, reusing GO1B1-01's harness). Recorded in data/enforcement_limits.md.

Other fields: applicability { llm, rag, agentic } mandatory (ml omitted — no FM output); serving_paradigm all four; maturity foundational (harmful/binding output is day-1 risk — Air Canada / Chevy incidents were early single-bot deployments; gate reads the repo, no deployed substrate; GO3B1-01 substrate is a SOFT dep because a direct ApplyGuardrail call also satisfies it); impact High; dependencies [{ GO3B1-01 soft }, { GO1B1-01 soft }]; references 2 real (Air Canada tribunal liability; Chevy $1 Tahoe); AIGP IV.C provisional unverified; ownership enterprise (D1=no borderline / D2=3) / project_architect / self_attestation_with_mechanical_evidence / dashboard_and_spot_check. RI at data/ri/GS2B1-01/README.md (Option A).

**GENSEC02 focus area CLOSED** — one BP, promoted.

### Tracking files updated

`principles.json` (GS2B1-01 appended; catalogue 16 → 17), `data/ri/GS2B1-01/README.md` (new), `lens_mapping.md` (GENSEC02 section), `lens_mapping_authored.md` (prepended promote entry), `agentflow/app/anchor.json` (promoted), this entry.

### Open items

- **JSON parse not run in-session** (sandbox cannot reach the WSL mount) — verify `python3 -c "import json; json.load(open('data/principles.json'))"` from a terminal before pushing.
- **Frontend** — `P22 — Response Validation` is a new free-text focus_area; `npm run build` from `s3-json-viewer/` to confirm rendering.
- **GENSEC04 (Prompt security) owns input-side prompt-injection defence** — referenced as the home for the input half deliberately left out of GS2B1-01.
- GENSEC03 (Event monitoring) / GENSEC05 (Excessive agency) / GENSEC06 (Data poisoning) remain to walk.
- The BP04 end-user-attribution slice still pending as a recommended GO3B2-01 `end_user_id` payload field.
- Prior open items stand (GENCOST03-BP02; GENOPS02 / GENOPS05; GENREL; AIGP sweeps).

---

## 2026-06-07 — GENSEC01-BP04 (Implement access monitoring) not_promoted; GENSEC01 focus area CLOSED (1 promoted, 3 not_promoted)

### Context

Walked GENSEC01-BP04 ("Implement access monitoring to generative AI services and foundation models", AWS risk **High**, verbatim fetched 2026-06-07, 5 steps). Last open BP in GENSEC01. BP mandate: monitor access to GenAI services/FMs to catch unintended/unauthorized use — CloudTrail API logging, Bedrock model-invocation logging, Q activity capture, CloudWatch alarms / Security Hub on suspicious activity, centralized S3 log retention, plus a traceability line (log the GenAI app name + end-user per request; per-agent logging for agentic; architect workloads with application identities).

### Decision

**not_promoted — user directed the call.** Decomposes cleanly into three already-owned buckets: (1) **generic access logging + alerting** (CloudTrail API logging, CloudWatch alarms on suspicious activity, Security Hub, centralized S3 retention) is base-WAF security monitoring — AWS cross-references SEC03-BP08 — the same generic infra discipline behind BP02's not_promote; (2) **vendor menu** — steps 1–4 are Bedrock invocation logging / Q Developer activity capture / Q Business log delivery / SageMaker endpoint logging; (3) the **GenAI-distinct telemetry slice** (emit a trace for every model call / tool invocation / retrieval, per-agent logging) is already owned by **GO3B2-01** (observability emission contract) + **GO3B2-02** (govern read access on those traces) — GS1B3-01 already emits its retrieval-authorization decisions through GO3B2-01, so promoting BP04 would re-author the observability family under a security label. The one piece GO3B2-01 does not explicitly carry — **end-user attribution** ("log the end-user making the request," not just project/app) — is a thin extension (a recommended `end_user_id` field on GO3B2-01's emit payload), absorbed rather than promoted (same shape as GENPERF02-BP02's inference-params slice absorbed into GO3B1-01). step_promotion would fail `architecturally_distinct` (GO3B2 family + base WAF own it) + `not_vendor_menu` (steps 1–4). No new principle; **catalogue stays at 16.**

**GENSEC01 focus area CLOSED** — BP01 (least-priv IAM to endpoints) not_promoted, BP02 (private network) not_promoted, BP03 (data-store access) → **GS1B3-01** promoted, BP04 (access monitoring) not_promoted. One promote, three not_promoted; the Security pillar's endpoint-security question yields exactly the RAG retrieval-authorization principle, with the rest being generic base-WAF IAM/network/logging discipline.

### Tracking files updated

`lens_mapping_authored.md` (prepended), `lens_mapping.md` (GENSEC01-BP04 row + focus-area closed note), `agentflow/app/anchor.json` (moved to GENSEC02-BP01), this entry.

### Open items

- **GENSEC02-BP01 (Implement guardrails to mitigate harmful or incorrect model responses) walk in progress** — GENSEC02 ("How do you stop GenAI applications from generating harmful, biased, or factually incorrect responses?") ships exactly ONE BP; verified from gensec02.html. This is a meaty GenAI-distinct guardrails/output-validation BP — likely a real promote candidate.
- The end-user-attribution slice from BP04 noted as a recommended GO3B2-01 payload field (`end_user_id`) — apply on the next GO3B2-01 edit, not authored as its own principle.
- Prior open items still stand (GENSEC03/04/05/06 walks; GENCOST03-BP02; GENOPS02 / GENOPS05; GENREL; JSON-parse / frontend-build verifications; AIGP sweeps).

---

## 2026-06-07 — GENSEC01-BP03 PROMOTED → GS1B3-01 (RAG retrieval-time access control); first Security principle; catalogue now 16; new enforcement_limits.md doc

### Context

Walked GENSEC01-BP03 ("Implement least privilege access permissions for foundation models accessing data stores", AWS risk **High**, verbatim fetched 2026-06-07, 6 steps). After GENSEC01-BP01 and BP02 both not_promoted (generic base-WAF IAM/network), BP03 surfaced the first genuinely GenAI-distinct, sibling-unowned slice in the Security pillar: **retrieval-time authorization**. The user directed PROMOTE after an interactive HALT in which the enforcement mechanism was worked out and its honest limit was nailed down.

### Decision — PROMOTE → GS1B3-01

**GS1B3-01 — "Never retrieve what the user isn't allowed to see."** 16th principle (9 GENOPS + 6 GENCOST + 1 GENSEC); first Security-pillar principle; first under GENSEC. New pillar string `P2 — Security` and new focus area `P21 — Endpoint Security` (mirrors AWS GENSEC01 verified focus-area title; question stem "How do you manage access to generative AI endpoints?" verified from gensec01.html).

Anchors AWS step 4 (least-privilege access policies with resource identifiers granting explicit access to specific data in the vector store), absorbs step 1 (classify data → the acl label) and step 2 (role-based store access), and operationalises the BP's metadata-filtering implementation-guidance line. Steps 5 (curated-prompt access testing = GO1B1 harness pointed at security) and 6 (training-data governance = minority self-train, cross-touches data-poisoning) not_promoted; step 3's PII-removal half is a future GENSEC data-protection concern, distinct from its acl-labelling half used here. step_promotion 3/3/3/3.

**Why distinct (the promote argument):** retrieval-time per-query authorization is unowned by any sibling and is GenAI-specific because only RAG has a retrieval step. IAM gates whether the *app* can reach the store, not which *chunks* a given end-user's query surfaces; model-layer classification acts after retrieval; GO3B2-02 governs trace read access, GO1B1-06 is model versioning, GO3B1-01 is the prompt registry. When documents are embedded they lose their source-system permissions, so a shared store with an unfiltered top-k hands users chunks they could never have read directly (OWASP LLM cross-tenant / broken access control for RAG).

**The mechanism (and its honest limit — user-emphasised):** documents carry an `acl` label at ingestion; all retrieval routes through a central retrieval SDK that derives the caller's entitlements from the IdP and applies a pre-filter (the workload passes identity, never the filter — closing the over-broad-filter dodge); a pre-merge AST lint bans direct store-client calls against multi-tenant stores (the GO3B1-01 no-inline pattern). **The lint enforces the plumbing, not correctness:** it proves retrieval is identity-scoped and labels are present, but cannot prove a label is *correct* — a document mislabelled `public` is served faithfully to everyone. Correct labels remain a developer-discipline responsibility, so the principle pairs the mechanical gates with a **quarterly security label-audit** (the named human control). This is the first principle to state that boundary explicitly.

**Ownership — two firsts:** first **D1=yes** principle (cross-tenant/PII data access = direct legal/regulatory exposure → mandatory_centralise → tier enterprise); first to use **audit_mode central_review_at_gate** with a populated `evidence` block and validator `enterprise_security`, because the residual label-correctness gap is a security-owned human review, not pure self-attestation.

Other fields: applicability { rag, agentic } mandatory (llm/ml omitted — no retrieval step); serving_paradigm all four (store+identity property, model-serving-independent); maturity scaling (shared-store-mixed-authorization emerges multi-tenant; central retrieval SDK is platform substrate like GO3B2-01/02); impact High (matches AWS); dependencies [{ GO3B2-01: soft }] (retrieval-auth decisions emit through the observability SDK); references 3 real links (ragaboutit Permission Layer Problem, we45 RAG leaking data, Kiteworks zero-trust RAG); AIGP IV.C primary + III.A secondary, unverified. Solution Option A (labelled-and-routed) mandated; Option B (source-system permission mirroring) documented as additive RI. RI at data/ri/GS1B3-01/README.md (Option A).

### New cross-cutting doc — enforcement_limits.md

At the user's request, created `data/enforcement_limits.md` recording the recurring catalogue theme that **a static gate enforces plumbing, not correctness — without developer discipline the system fails anyway.** Catalogues the boundary across GS1B3-01 (label correctness), GC5B1-01 (wired-in not runtime), GC2B2-01 / GC4B1-01 (declared not real), GO3B1-01 / GO1B1-06 (route not wisdom), and the `audit_mode` field. Includes the authoring rule: gate what's mechanically gateable, name the residual gap in solution.approach/statement.description, and back real-exposure gaps with a periodic human review + central_review_at_gate rather than false confidence. GS1B3-01 references it.

### Tracking files updated

`principles.json` (GS1B3-01 appended; catalogue 15 → 16), `data/ri/GS1B3-01/README.md` (new), `data/enforcement_limits.md` (new), `lens_mapping.md` (GENSEC01-BP03 row → promoted + GENSEC01 status), `lens_mapping_authored.md` (prepended promote entry), `agentflow/app/anchor.json` (promoted), this entry.

### Open items

- **JSON parse not run in-session** — the sandbox cannot reach the WSL mount; verify `python3 -c "import json; json.load(open('data/principles.json'))"` from a terminal before pushing.
- **Frontend** — `P2 — Security` pillar and `P21 — Endpoint Security` focus_area are new free-text strings; confirm the runtime renders them (free-text, so no registry change expected); `npm run build` from `s3-json-viewer/` if in doubt.
- **GENSEC01-BP04 (access monitoring) still UNMAPPED** — walk to close GENSEC01.
- AIGP IV.C / III.A for GS1B3-01 unverified — promote after side-by-side review.
- Prior open items still stand (GENCOST03-BP02; GENOPS02 / GENOPS05; GENPERF04-BP01 sweep; GENREL walk; AIGP III.B sweep).

---

## 2026-06-07 — GENSEC01-BP02 (Implement private network communication) not_promoted

### Context

Walked GENSEC01-BP02 ("Implement private network communication between foundation models and applications", AWS risk **High**, verbatim fetched 2026-06-07, 3 steps). BP mandate: put a scoped-down data perimeter on FM endpoints — AWS PrivateLink / VPC endpoints so apps reach Bedrock/Q/SageMaker without the public internet; self-hosted endpoints in private VPCs with security groups/subnets; FMs reach supporting infra (vector stores, agent tools) privately too.

### Decision

**not_promoted — user directed the call after a HALT.** Cleanest not_promote of the GENSEC batch so far: pure network security (PrivateLink, VPC endpoints, private subnets, security groups), owned by the base WAF Security pillar — AWS cross-references SEC05-BP01/02 (network protection). The three steps are generic VPC-endpoint setup (pick VPC → pick service → configure endpoint policy + security groups) identical for any AWS service, with no GenAI-specific mechanism. The only GenAI-flavoured line ("make sure the FM reaches its vector store / agent tools privately too") is generic network perimeter applied to whatever infra a RAG/agent app uses — no GenAI-distinct enforceable artefact, nothing a sibling needs. step_promotion would fail `architecturally_distinct` (generic network security) + `has_enforceable_artefact` (no GenAI-specific commitable artefact distinct from base-WAF network config). No new principle; **catalogue stays at 15.**

### Tracking files updated

`lens_mapping_authored.md` (prepended), `lens_mapping.md` (GENSEC01-BP02 row flipped), `agentflow/app/anchor.json` (moved to BP03), this entry.

### Open items

- GENSEC01-BP03 (least-priv to data stores) walk in progress — flagged as the strongest GENSEC01 promote candidate (RAG retrieval-time identity-scoped access control is GenAI-distinct and sibling-unowned); BP04 (access monitoring) UNMAPPED.
- Prior open items still stand (GENCOST03-BP02; GENOPS02 / GENOPS05; GENPERF04-BP01 sweep; GENREL; JSON-parse / frontend-build verifications; AIGP III.B sweep).

---

## 2026-06-07 — GENSEC01-BP01 (Grant least privilege access to FM endpoints) not_promoted; first GENSEC walk

### Context

Started the Security pillar. GENSEC01 question stem verified from gensec01.html: "How do you manage access to generative AI endpoints?" (focus area "Endpoint security"; 4 BPs). Walked GENSEC01-BP01 ("Grant least privilege access to foundation model endpoints", AWS risk **High**, verbatim fetched 2026-06-07, 4 steps). BP mandate: scope FM-endpoint access to least-privilege IAM roles with permission boundaries / trust-policy conditions / session durations; at the org layer use SCPs/RCPs to block models the org has not approved.

### Decision

**not_promoted — user directed the call after an interactive HALT in which the promote case was built and then collapsed by the user.** The promote candidate constructed: an identity-layer "approved-models + least-privilege endpoint" principle (declare approved FM-endpoint ARNs in `security/model-access.yaml` + an org SCP/RCP denying `bedrock:InvokeModel` on non-approved ARNs + a pre-merge lint on the workload IaC for ARN-scoped permissions / permission boundary / SCP existence), pitched as **defense-in-depth distinct from GO1B1-06** on the theory that GO1B1-06 is build-time/code while this is runtime/identity, catching shadow-model calls that bypass the code path.

**The user collapsed the distinctness:** GO3B1-01's no-inline-call AST lint (the pattern GO1B1-06 inherits) is designed to scan code for *direct* model calls (e.g. a raw `boto3 ... invoke_model`), so an in-repo direct call is already caught — the "shadow-model hole" only survives for code that never goes through CI at all (console/CLI, a laptop notebook on a shared role, an ungated repo, a third-party SaaS using an account credential). That residual is "lock down the account so stray identities can't reach a model endpoint" = generic base-WAF SEC03 IAM hygiene, not GenAI-distinct architecture. AWS's own Resources confirm the generic ownership — five base WAF Security-pillar cross-refs (SEC02-BP01/02/06, SEC03-BP01/02). Steps 1–3 are textbook IAM (custom policy on ARNs, role + permission boundary, trust policy); step 4 is Q Developer subscription vendor-specifics. The only GenAI-distinct slice — approved-models enforcement — is already owned by GO1B1-06 at the layer that matters (the code path the lint covers). step_promotion would fail `architecturally_distinct` (generic IAM + GO1B1-06 overlap) + `not_vendor_menu` (Bedrock/SageMaker/Q IAM specifics).

No new principle; **catalogue stays at 15.** First GENSEC BP walked → not_promoted. GENSEC01-BP02 (private network comms) now walking.

### Note for the GENSEC pillar going forward

The Security pillar's BPs lean heavily on generic base-WAF Security-pillar discipline (SEC02/03 identity+permissions, SEC05 network) applied to a model endpoint. The bar to clear for a GENSEC promote: a GenAI-distinct, enforceable artefact that the base WAF Security pillar does NOT already own and that an existing catalogue sibling (GO1B1-06 approved-models, GO3B1-01/GO3B2-01 SDK/observability, GO3B2-02 trace access) does NOT already cover. Watch for this pattern repeating across GENSEC01-BP02/03/04.

### Tracking files updated

`lens_mapping_authored.md` (prepended whole-BP not_promote entry), `lens_mapping.md` (GENSEC01-BP01 row flipped, stale PRIN_003 mapping removed), `agentflow/app/anchor.json` (moved to BP02), this entry.

### Open items

- GENSEC01-BP02 (private network comms) walk in progress; BP03 (least-priv to data stores), BP04 (access monitoring) still UNMAPPED.
- Prior open items still stand (GENCOST03-BP02 output-length sibling; GENOPS02 / GENOPS05 walks; GENPERF04-BP01 sweep; GENREL walk; JSON-parse / frontend-build verifications; AIGP III.B sweep).

---

## 2026-06-07 — GENOPS04-BP02 (Implement GenAIOps) not_promoted; GENOPS04 focus area CLOSED at zero principles

### Context

Walked GENOPS04-BP02 ("Implement GenAIOps to optimize the application lifecycle", AWS risk **High**, verbatim fetched 2026-06-07, 5 steps). Second and last BP in GENOPS04. BP mandate: implement GenAIOps — automate development/deployment/management of models, with CI/CD for training, tuning, and deploying foundation models; split into operationalizing FM consumption (DevOps for RAG/agent apps) and operationalizing FM training/tuning (FMOps/LLMOps). Five SageMaker-centric steps: SageMaker Pipelines → MLflow tracking → Git + SageMaker Model Registry → CloudWatch monitoring → feedback-loop/retraining.

### Decision

**not_promoted — user directed the call after an interactive HALT.** Two compounding grounds:

1. **Umbrella BP whose constituent concerns are each already owned.** AWS itself names the "common concerns" as CI/CD, prompt management, artifact versioning, model upgrades, evaluation, and monitoring — every one already concretised by an existing sibling: prompt management → GO3B1-01; model versioning/upgrades → GO1B1-06; evaluation → the GO1B1-01..05 family; monitoring → GO3B2-01/02; CI/CD → base WAF (+ BP01, not_promoted same session); the step-5 feedback loop → GENOPS01-BP02 (not_promoted same session). A restatement of catalogue-owned concerns, not new architecture.

2. **The uniquely-here FMOps/LLMOps training-pipeline half is a vendor menu and narrow.** SageMaker Pipelines / SageMaker-managed MLflow / Model Registry / Clarify / Code* services — and it only bites for the minority who train or fine-tune their own foundation models; the dominant consume-a-managed-API RAG/agent pattern has no training pipeline to operationalize. Cross-references base WAF OPS again (OPS05-BP01/07/10).

step_promotion would fail `architecturally_distinct` (umbrella of already-owned siblings) + `not_vendor_menu` (SageMaker/MLflow/Code* tree). High AWS risk did not rescue it.

No new principle; **catalogue stays at 15.** **GENOPS04 focus area CLOSED — zero principles** (BP01 generic IaC owned by base WAF; BP02 GenAIOps umbrella owned by existing siblings + FMOps vendor menu). Both BPs are High risk yet neither yields GenAI-distinct enforceable architecture beyond what the catalogue + base WAF already mandate — a clean "worked example" result like the GENPERF pillar.

### Tracking files updated

`lens_mapping_authored.md` (prepended whole-BP not_promote entry), `lens_mapping.md` (GENOPS04-BP02 row flipped + focus-area closed note), `agentflow/app/anchor.json` (status not_promoted → GENOPS04 closed), this entry.

### Open items

- GENOPS04 fully closed (0 principles). Remaining GENOPS focus areas: GENOPS02 (Monitor and manage operational health, 3 BPs, all UNMAPPED) and GENOPS05 (Model customization, TODO — BPs not yet enumerated).
- Prior open items still stand (GENCOST03-BP02 output-length sibling — most likely remaining promote candidate; GENPERF04-BP01 sweep; the GENREL walk; JSON-parse / frontend-build verifications; AIGP III.B sweep).

---

## 2026-06-07 — GENOPS04-BP01 (Automate GenAI app lifecycle with IaC) not_promoted

### Context

Walked GENOPS04-BP01 ("Automate generative AI application lifecycle with infrastructure as code (IaC)", AWS risk **High**, verbatim fetched 2026-06-07, 7 steps). GENOPS04 ("How do you automate the lifecycle management of your generative AI workloads?", focus area "Automate lifecycle management") was entirely unwalked. BP mandate: define the workload's infrastructure as version-controlled IaC, deployed through CI/CD across dev/test/prod with governance and audit.

### Decision

**not_promoted — user directed the call after an interactive HALT.** Decisive ground: **not GenAI-distinct — generic IaC/DevOps discipline owned by the base Well-Architected Framework.** The giveaway is AWS's own Resources section, which cross-references **five base WAF Operational Excellence BPs** — OPS05-BP01 (version control), OPS05-BP08 (multi-env), OPS05-BP10 (CI/CD), OPS06-BP03 (deployment management), OPS06-BP04 (automated testing + rollback). The seven steps confirm it: step 1 = IaC tool-selection advice + vendor menu (CDK/CloudFormation/Terraform); step 2/3/5 = textbook IaC (define resources, Git, multi-env with parameterised templates); step 4 = CI/CD vendor menu (CodePipeline/Jenkins); step 6 = governance vendor menu (AWS Config/Service Catalog); step 7 = audit-process advice. The only GenAI veneer is "template a Bedrock resource" and "HyperPod recipes for training clusters" — not a distinct architecture.

The GenAI-distinct slice worth naming — "your model catalog, prompt registry, and eval infra must be IaC, not click-ops" — is **already owned by siblings**: GO3B1-01 (prompt registry as code), GO1B1-06 (model catalog as code), and GC2B2-01 (already parses the workload's IaC for right-sizing). So even the distinct slice is taken. step_promotion would fail `architecturally_distinct` (generic infra + redundant with siblings) + `not_vendor_menu` (steps 1/4/6). High AWS risk did not rescue it.

Also cleared the stale provisional mapping: lens_mapping had "possibly PRIN_005 (Context Lifecycle Management)" against BP01 — a mis-fit (PRIN_005 is context lifecycle, not infra IaC); removed.

No new principle; **catalogue stays at 15.** GENOPS04-BP02 (GenAIOps) now walking.

### Tracking files updated

`lens_mapping_authored.md` (prepended whole-BP not_promote entry), `lens_mapping.md` (GENOPS04 section rebuilt — BP01 not_promoted, stale PRIN_005 mapping removed), `agentflow/app/anchor.json` (moved to BP02), this entry.

### Open items

- GENOPS04-BP02 (Implement GenAIOps) walk in progress.
- Prior open items still stand (GENCOST03-BP02 output-length sibling; GENPERF04-BP01 sweep; the GENREL walk; JSON-parse / frontend-build verifications; AIGP III.B sweep).

---

## 2026-06-07 — GENOPS01-BP02 (Collect and monitor user feedback) not_promoted; GENOPS01 focus area CLOSED

### Context

Walked GENOPS01-BP02 ("Collect and monitor user feedback", AWS risk **High**, verbatim fetched 2026-06-07, 4 steps). The last open BP in GENOPS01 (BP01 closed long ago → GO1B1-01..06). BP mandate: supplement ground-truth evaluation with direct user feedback (thumbs up/down), store it, review on a cadence, act on it. Desired outcome: surface FM degradation as it happens **without** ground truth data.

### Decision

**not_promoted — user directed the call after an interactive HALT.** Step shape: steps 1–2 are pure vendor menus (step 1 = Amazon Q Business PutFeedback/DynamoDB/conversation-logging tree; step 2 = Amazon Bedrock S3/Lambda/EventBridge tree) — the cleanest `not_vendor_menu` failure; step 3 (establish a regular review process) is cadence/review-process advice, the same shape not_promoted at GENOPS03-BP01 step 5 and deferred at GENCOST01-BP01 step 4 (portfolio-scale cadence enforcement exceeds catalogue depth); step 4 (implement and test improvements + A/B testing) is absorbed by the GO1B1 eval family.

The one honest promote candidate — a **feedback-as-telemetry** contract (declare a feedback signal + wire it through GO3B2-01's `emit()` as a `user_feedback` event referencing the response `trace_id`, so a rising 👎 rate surfaces degradation with no golden dataset) — was constructed in full and **rejected by the user**. It rides GO3B2-01 as substrate (feedback is just another event type on the existing emission stream, so nothing architecturally distinct survives), and the only part the BP genuinely adds — the user-facing feedback-capture UX — is exactly the part no CI gate can prove (runtime/UX, not wired-in code). Strip the un-gateable UI and what's left is GO3B2-01 plus process advice. step_promotion would fail `not_vendor_menu` (steps 1–2) + `architecturally_distinct`/`has_enforceable_artefact` (the telemetry slice is GO3B2-01; the UX slice is ungateable). High AWS risk did not rescue it — risk severity is not architectural distinctness.

No new principle; **catalogue stays at 15.** **GENOPS01 focus area CLOSED** — BP01 → GO1B1-01..06; BP02 → not_promoted.

### Tracking files updated

`lens_mapping_authored.md` (prepended whole-BP not_promote entry), `lens_mapping.md` (GENOPS01-BP02 row flipped UNMAPPED → not_promoted + focus-area closed note), `agentflow/app/anchor.json` (status not_promoted → GENOPS01-BP02), this entry.

### Open items

- GENOPS01 fully closed; GENOPS02 (Monitor and manage operational health — 3 BPs) is the next GENOPS focus area, all UNMAPPED.
- Prior open items still stand (GENCOST03-BP02 output-length sibling — most likely remaining promote candidate; GENPERF04-BP01 formal sweep; the GENREL walk; JSON-parse / frontend-build verifications; AIGP III.B sweep).

---

## 2026-06-07 — GENPERF01 (Establish performance evaluation processes) walked; both BPs not_promoted; focus area closed; GENPERF pillar yields ZERO principles

### Context

Walked GENPERF01 ("How do you capture and improve the performance of your generative AI models in production?", focus area "Establish performance evaluation processes"; question verified from genperf01.html) — two BPs, verbatims fetched 2026-06-07: BP01 Define a ground truth data set of prompts and responses (Medium); BP02 Collect performance metrics from generative AI workloads (Medium).

### Decision

**Both not_promoted — user directed the sweep after an interactive HALT.**

- **BP01 (Define a ground truth data set) — not_promoted / absorbed by the GO1B1 family.** The verbatim describes a curated golden dataset of prompt–response pairs + a harness that auto-evaluates models — the exact artefact GO1B1-01 was authored from at GENOPS01-BP01, with GO1B1-02 (stratified sampling), GO1B1-03 (encapsulated metrics) and GO1B1-05 (refresh — the "living artifact" line) covering the rest. The old lens_mapping note hoped this was "performance/latency-focused, distinct from GENOPS01-BP01", but the text is task/response-quality evaluation over the same dataset, not latency. One golden dataset, evaluated for both functional correctness (GENOPS01) and performance-task quality (GENPERF01); nothing architecturally distinct survives.
- **BP02 (Collect performance metrics) — not_promoted / absorbed.** Decomposes into GO3B2-01 (report metrics/telemetry/logs + trace framework = the observability emission contract), the GO1B1 harness on a cadence + GO1B1-04 drift (response quality over time), generic infra observability the base WAF owns (CloudWatch alarms on latency/throughput; cross-refs PERF05-BP01/02/03/05 + six MLPER items), and process/vendor advice (remediation-in-AI-policy; OpenLLMetry/CloudWatch/fmeval/MLflow menu). The honest promote case — a latency/throughput "SLO-as-code wired to alerts" principle analogous to GO1B1-03's metric-as-code — was argued and rejected: it is the same alert-threshold substance not_promoted at GENPERF02-BP01, overlaps GO3B2-01, and latency SLOs + alarms are generic infra discipline (base WAF PERF05). Nothing GenAI-distinct survives.

No new principle; **catalogue stays at 15.** GENPERF01 focus area CLOSED.

### Pillar-level finding — GENPERF yields ZERO principles

With GENPERF01/02/03/04 all now walked (GENPERF04-BP01 left UNMAPPED but flagged same-shape), **the entire GENPERF performance pillar has produced no promoted principle.** Every BP resolved to one of three things: (1) generic infrastructure performance discipline already owned by the base Well-Architected framework (the BPs repeatedly cross-reference PERF05 and the ML lens MLPER) — load testing, metrics collection, alerting; (2) a performance-framed restatement of an already-authored principle from another pillar — GENPERF01 ground-truth/metrics = the GENOPS GO1B1 eval family + GO3B2 observability family; GENPERF02-BP03 model selection = GC1B1-01 + GO1B1-06; GENPERF04-BP02 vector size = GC4B1-01; or (3) a vendor menu (GENPERF03-BP01 managed-hosting; GENPERF02-BP02 inference-parameter tuning). The standing interpretation to carry forward: the GenAI *performance* pillar adds no enforceable architecture beyond what GENOPS evaluation + observability and GENCOST cost discipline already mandate, plus generic infra discipline the base WAF owns. This is a clean, defensible "worked example" result — the catalogue is honest about where a pillar does not yield distinct GenAI architecture.

### Tracking files updated

`lens_mapping_authored.md` (two BP not_promote entries + pillar note prepended), `lens_mapping.md` (GENPERF01 section rebuilt + closed + GENPERF pillar-closed note), `agentflow/app/anchor.json` (status not_promoted → GENPERF01 sweep), this entry.

### Open items

- **GENPERF04-BP01 (Test vector embeddings for latency and relevant performance) left UNMAPPED** — flagged same-shape (process/testing); can be formally swept to fully close GENPERF if a tidy 100%-walked pillar is wanted.
- Prior open items still stand (GENCOST03-BP02 output-length sibling — the most likely remaining promote candidate; the GENREL walk; JSON-parse / frontend-build verifications; AIGP III.B sweep).

---

## 2026-06-07 — GENPERF02 (Maintaining model performance) walked; all three BPs not_promoted; focus area closed

### Context

Walked GENPERF02 ("How do you verify your generative AI workload maintains acceptable performance levels?", focus area "Maintaining model performance"; question verified from genperf02.html) — three BPs, all verbatims fetched 2026-06-07: BP01 Load test model endpoints (Medium); BP02 Optimize inference parameters to improve response quality (Low); BP03 Select and customize the appropriate model for your use case (Medium).

### Decision

**All three not_promoted — user directed the sweep after an interactive HALT in which BP01's carve-out case was explicitly argued and rejected.**

- **BP01 (Load test model endpoints) — not_promoted.** Decisive ground: not GenAI-distinct. Load testing for a capacity baseline + alert thresholds is generic performance engineering already owned by the base WAF (cross-references `PERF05-BP04` + four `MLPER` ML-lens items), with only a thin GenAI veneer (golden prompt dataset; prompt-caching/batch remediation). Supporting: the promote-able core decomposes into observability (GO3B2 family, the SLO/alert half) + the GO1B1 eval harness and the still-UNMAPPED GENPERF01-BP01 (golden-dataset half), leaving a thin pre_deploy, process-shaped test whose only gate ("a load_test_result.yaml exists and is fresh") is low-signal and gameable next to the GO3B1-01 AST lint / GC4B1-01 deployed-vs-declared parser. Serving-paradigm narrowness (self_hosted_* / api_provisioned only; managed-API consumers can't load-test a provider-owned endpoint) was discounted on its own — GC2B2-01 is also self-hosting-only and promoted — but compounds the generic-discipline problem. step_promotion would fail architecturally_distinct + has_enforceable_artefact. Recorded flip condition: a heavily self-hosting audience could justify a GenAI-flavoured load-test principle as a deliberate worked example; not the default and not taken.
- **BP02 (Optimize inference parameters) — not_promoted / sliver absorbed into GO3B1-01.** Hyperparameter tuning (temperature/top-p/top-k; high-low search, Newtonian halving, LLM-as-a-judge) is Low-risk experimentation/technique advice with no committable artefact. The only durable slice — "pin/declare inference params per template, no inline/unset generation params" — is a natural field on GO3B1-01's prompt-template manifest, not a standalone principle.
- **BP03 (Select and customize the appropriate model) — not_promoted / absorbed.** The performance-framed twin of GC1B1-01 (its "AI usage document" IS the model-selection ADR), riding the GO1B1 eval-harness family (test against ground truth) + GO1B1-06 (re-test on new-model availability); routing/fine-tuning/continuous-pre-training/distillation are a vendor/technique menu. Nothing architecturally distinct survives for the performance pillar.

No new principle; **catalogue stays at 15.** GENPERF02 focus area CLOSED.

### Tracking files updated

`lens_mapping_authored.md` (three BP not_promote entries prepended), `lens_mapping.md` (GENPERF02 section rebuilt + closed), `agentflow/app/anchor.json` (status not_promoted → GENPERF02 sweep), this entry.

### GENPERF pillar status after today

GENPERF01 (ground truth + performance metrics) — BP01/BP02 still UNMAPPED. GENPERF02 (maintaining model performance) — CLOSED, 3/3 not_promoted. GENPERF03 (high-performance compute) — CLOSED, 1/1 not_promoted (vendor menu). GENPERF04 (vector store optimization) — BP01 UNMAPPED; BP02 not_promoted/absorbed into GC4B1-01. **No GENPERF principle has promoted to date** — the performance pillar's BPs keep landing as either generic infra discipline (base WAF) or performance-framed twins of already-authored GENOPS/GENCOST principles.

### Open items

- **GENPERF01 (BP01 define ground truth for performance; BP02 collect performance metrics) still UNMAPPED** — the most likely remaining GENPERF promote candidates (a performance-metrics-as-code / latency-SLO principle distinct from the functional GO1B1 family), if any. Worth a walk to decide whether GENPERF yields any principle or closes empty.
- **GENPERF04-BP01 still UNMAPPED** (latency/relevance testing, process-shaped).
- Prior open items still stand (GENCOST03-BP02 output-length sibling; the GENREL walk; JSON-parse / frontend-build verifications; AIGP III.B sweep).

---

## 2026-06-07 — GENPERF03-BP01 (Use managed solutions for hosting/customization/data access) not_promoted; GENPERF03 focus area closed

### Context

Walked GENPERF03-BP01 ("Use managed solutions for model hosting, customization, and data access where appropriate", AWS risk **Medium**, verbatim fetched 2026-06-07). GENPERF03 ("How do you optimize computational resources required for high-performance distributed computation tasks?", focus area "Optimize consumption of high-performance compute") ships exactly one BP, so this walk closes the focus area. The BP's mandate stripped of branding: use managed solutions for hosting/customization/training rather than carrying undifferentiated operational overhead, choosing by the level of control needed. Six steps.

### Decision

**not_promoted — user directed the call after an interactive HALT.** Grounds: (1) **Vendor menu** — steps 2–5 are a service-selection tree (fully managed → Bedrock; more control → SageMaker endpoints; customization → managed workflows; training → SageMaker HyperPod EKS/Slurm); the cleanest `not_vendor_menu` failure walked to date. (2) **No enforceable artefact** — step 1 ("determine the level of control") is decision-process advice (à la GENCOST01-BP01 step 1 / GENPERF04-BP02 step 1); steps 2–5 carry no commitable pre-merge artefact; step 6 (data access via robust permissions + federated access) is GENSEC/IAM cross-pillar. (3) **Narrow GenAI relevance** — the BP only bites for the minority of GenAI teams self-hosting their inference model (Llama/Mistral on EC2+vLLM for cost-at-scale or data residency); the dominant RAG/agent pattern (managed generation API + API-or-local embeddings + vector DB) already satisfies "use managed hosting" by default. The user probed exactly this ("isn't this mostly for ML?" / "do most RAG systems use APIs or self-host?") and the discussion confirmed the generation LLM is overwhelmingly a managed API, embeddings split API/local, vector store mixed — so the managed-vs-self-managed hosting decision is a non-event for most GenAI workloads. Promote case (managed-by-default: declare hosting paradigm + require an ADR when self-managed chosen over an available managed option — GC1B1-01 ADR pattern for build-vs-buy) considered and rejected: near the existing `serving_paradigm` axis, operational-governance rather than architecture, no vendor-neutral anchor in the BP. step_promotion would fail not_vendor_menu (~1) + has_enforceable_artefact (~1). No new principle; **catalogue stays at 15.** GENPERF03 focus area CLOSED.

### Tracking files updated

`lens_mapping_authored.md` (prepended whole-BP not_promote entry), `lens_mapping.md` (GENPERF03 section added + closed; GENPERF02 section stubbed with verified question + 3 BPs pending), `agentflow/app/anchor.json` (status not_promoted → GENPERF03-BP01), this entry. **Next: GENPERF02 walk started** (question verified "How do you verify your generative AI workload maintains acceptable performance levels?"; BP01 Load test model endpoints / BP02 Optimize inference parameters / BP03 Select and customize the appropriate model).

### Open items

- **GENPERF02 walk in progress** — three BPs pending_review. BP01 (load test endpoints) is the most likely promote candidate; BP02 (inference parameters) likely tuning advice; BP03 (select/customize model) likely overlaps GC1B1-01 / GO1B1-06.
- **GENPERF04-BP01 still UNMAPPED** (latency/relevance testing, process-shaped).
- Prior open items still stand (GENCOST03-BP02 output-length sibling; the GENREL walk; JSON-parse / frontend-build verifications; AIGP III.B sweep).

---

## 2026-06-07 — GENPERF04-BP02 (Optimize vector sizes for your use case) not_promoted / absorbed into GC4B1-01; GENPERF04 focus-area title + question verified

### Context

Walked GENPERF04-BP02 ("Optimize vector sizes for your use case", AWS risk **Low**, verbatim fetched 2026-06-07) — the performance-side twin of the cost principle GC4B1-01. GENPERF04 focus-area title ("Vector store optimization") and question stem ("How do you improve the performance of data retrieval systems?") verified from genperf04.html; GENPERF04 ships exactly two BPs (BP01 Test vector embeddings for latency and relevant performance — UNMAPPED; BP02 this one). The BP is experiment-and-pick over three steps: identify the workload's most important performance KPI (accuracy/speed/memory/scalability); determine the vector options the embedding model supports and design experiments to test each (self-host via SageMaker if options insufficient); run the experiment and keep the most performant.

### Decision

**not_promoted — absorbed into GC4B1-01. User directed the call directly after the HALT discussion.** Two grounds:

1. **No enforceable artefact distinct from GC4B1-01's.** The only commitable, gateable thing in the BP is the declaration GC4B1-01 already mandates — `vectorstore/embedding.yaml` (embedding_model + vector_dimension + the measured retrieval-quality result that justified the chosen dimension), gated pre-merge. GENPERF04-BP02 wants that same declaration, framing the justifying number as a latency/accuracy KPI rather than a cost-vs-quality floor. The BP's steps are decision-process advice ("identify your KPI") + experimentation ("design experiments", "run them") with no standalone pre-merge artefact — the same shape as GC4B1-01's own steps 3/4, which were not_promoted for "no commitable pre-merge artefact distinct from the quality-floor number the declaration records" and explicitly earmarked as landing in GENPERF04. Substance landing here does not make it newly promotable.

2. **Architecturally redundant.** step_promotion would fail has_enforceable_artefact (~1) and architecturally_distinct (~1-2); in_bp_scope (3) and not_vendor_menu (~2-3, light SageMaker lean) do not rescue it. The promote case considered and rejected: GC4B1-01 carries a cost-framed smaller-is-better bias, while a latency/accuracy-critical workload optimizes a named KPI where the best size may not be the smallest — one could carve a performance principle gating the deployed dimension against a KPI experiment matrix (size → accuracy/latency/memory), but that experiment-matrix-as-artefact is exactly the process-shaped thing already judged ungateable, and the BP is Low risk.

**Absorption:** GC4B1-01's declaration is the home for the performance-KPI evidence — its `quality_floor`/`quality_result` should be read to cover the workload's named performance KPI, not only the cost-vs-quality floor (no edit forced on GC4B1-01 this session; recorded as the reading). No new principle; **catalogue stays at 15.**

### Tracking files updated

`lens_mapping_authored.md` (prepended whole-BP not_promote entry), `lens_mapping.md` (GENPERF04 section rebuilt — focus-area title + question verified, BP01/BP02 rows), `agentflow/app/anchor.json` (status not_promoted), this entry.

### Open items

- **GENPERF04-BP01 still UNMAPPED** — latency/relevance testing, process-shaped; likely the same absorb/not_promote shape as BP02. Walk to close the focus area.
- Prior open items still stand (GENCOST03-BP02 output-length sibling, open P52; the GENREL walk where GENCOST05-BP01 step 3's tool-timeout substance lands; the JSON-parse / frontend-build verifications from the GC5B1-01 entry; AIGP III.B verification sweep).

---

## 2026-06-06 — Authored GC5B1-01 (Give every agent a hard stop) from GENCOST05-BP01; first principle under GENCOST05; created focus area P54 — Cost-informed Agents; GENCOST05 focus area closed

### Context

Walked GENCOST05-BP01 ("Create stopping conditions to control long-running workflows", verbatim fetched 2026-06-06) — the only BP under GENCOST05, the "Cost-informed agents" focus area, never previously walked. Question stem verified from gencost05.html: "How do you optimize agent workflows for cost?". The BP directs teams to develop controls limiting agents from running for extended periods without stopping, so the maximum cost of an agent's runtime becomes predictable from the implemented stopping conditions. **AWS risk rating: High** — the first GENCOST BP above Medium. Three implementation steps (1 estimate the maximum runtime; 2 implement stopping conditions that let an agent run up to that maximum; 3 re-architect to facilitate stopping — tool timeouts, prompts handling timeout responses, token limits on model output).

The interactive HALT discussion (before scoring) resolved the substantive calls: anchor on step 2; absorb step 1 (the runtime estimate is the declaration's recorded `estimated_max`); and not_promote step 3 on the grounds that its tool/API-timeout + "prompts handle timeout responses" substance is reliability-error-handling (a future GENREL walk, cross-pillar) and its "token limits on model responses" sub-bullet is already GO3B1-01 (`max_tokens`) / GC3B1-01 (output budget) sibling territory. The user confirmed the one-principle outcome and the iteration-vs-token distinction before authoring proceeded.

### Decisions

1. **Authored GC5B1-01 — Give every agent a hard stop.** Anchored on GENCOST05-BP01 step 2 (Implement stopping conditions), absorbing step 1 as the declaration's `estimated_max` input. First principle under GENCOST05 / GenCost Q5; **15th principle** in the catalogue (9 GENOPS + 6 GENCOST). step_promotion rubric **3/3/3/3** (enforceable per-agent run-limits declaration + wired-in-consistency lint + relaxation-governance lint; architecturally distinct — the cost lever is the NUMBER OF STEPS and the DURATION of an agent run, which no sibling bounds: GO3B1-01 caps per-call `max_tokens`, GC3B1-01 caps a prompt's footprint, GC4B1-01 caps vector dimension; BP literally "Create stopping conditions…" under "Cost-informed agents"; the Bedrock timeout is one option among the explicit generic alternatives "prompt flow layer or software abstraction layer", so a vendor-neutral mandate survives). Step 1 absorbed; step 3 not_promoted (cross-pillar GENREL + GO3B1-01/GC3B1-01 sibling-absorbed). Merged into `principles.json` after GC4B1-01.

2. **New focus area P54 — Cost-informed Agents** created to mirror AWS GENCOST05's verified focus-area title (distinct from P41 / P51 / P52 / P53 under the one-focus-area-per-AWS-question mapping). GENCOST05 ships exactly one BP, so the focus area is closed by this single principle.

3. **Design — Option A (declared-and-wired, config/code-derivable) as the mandated spine.** Each agent commits `agent/run_limits.yaml` declaring `max_steps` + `max_wallclock_seconds` + `max_run_token_budget` + `on_limit` + `estimated_max` + `checked_on`. An `agent/stop_check` lint enforces at pre-merge: (1) declaration completeness; (2) wired-in consistency by parsing the agent's orchestration-framework construction (LangGraph `recursion_limit` / CrewAI `max_iter`+`max_execution_time` / Bedrock agent timeout / custom loop guard) so a declared-but-unbound limit fails; (3) ceiling-relaxation governance requiring a recorded cost rationale for any upward change. The gate enforces ceilings are declared and structurally wired in; it does NOT prove the agent halts under live load (runtime behaviour). **Option B (runtime circuit-breaker)** — a cost/step/duration meter that hard-stops a run on ceiling breach and emits the event to observability (GO3B2 territory) — documented as an additive alternative; RI and gates built on Option A only. Parallel to GC4B1-01's Option A/B and GC3B1-01's Option A/B/C treatment.

4. **Field calls.** impact_level **High** — matches the AWS BP's High rating (the first GENCOST principle above Medium; the cost siblings are all Medium) and the spike-shaped failure (a runaway agent burns large amounts fast; the BP's whole desired outcome is cost *predictability*). maturity_level **foundational** — the gate reads the agent's own construction code in-repo (no deployed artefact, baseline, or telemetry), so a single unbounded run can be catastrophic on the first production session; pays off at project #1, matching the GO1B1-01/02/03 per-PR-repo-local-lint pattern and the maturity rubric's "per-PR repo-local lint labelled scaling = FAIL" anchor; a principled outlier from the cost siblings GC4B1-01 (scaling) / GC2B2-01 (mature), which parse *deployed* resources. tier **enterprise** (D1=no / D2=2 → recommended_centralise; the framework-aware wired-in parser across LangGraph/CrewAI/Bedrock/custom + the two lints repeat across projects with maintenance, lighter than GC2B2-01's multi-cloud IaC parse). **applicability { agentic mandatory } ONLY** — llm/rag/ml omitted (no agent loop to bound on a single-shot call, a fixed RAG pipeline, or classical ML; parallel to GO1B1-01/GO1B1-05 agentic-only and GC4B1-01's narrow-by-omission precedent). serving_paradigm all four mandatory (a runaway loop bills regardless of serving paradigm). dependencies: [] standalone (GO3B1-01's per-call `max_tokens` is adjacent but not a substrate dependency — this bounds run length, not per-call output). references (v1.11): DEV Community/Waxell (four LangChain agents looping eleven days for ~$47,000; alerts-are-not-enforcement) + n1n.ai (~$48,000 in fourteen hours from one session) populated at authoring. AIGP III.B unverified. explain_prompt compiled with a setup_absence shape + a runaway-spike trigger emphasis (distinguishing it from GC4B1-01's slow-default-cost shape — the agent failure is a discrete, fast, potentially catastrophic loop).

5. **Statement title kept deliberately plain** — "Give every agent a hard stop", per the standing working-style rule in data/CLAUDE.md (plain spoken titles, no stacked clauses). Trades the statement rubric's `names_artefact_and_enforcement` down (hand-scored 1) in favour of the override; the artefact + enforcement are carried in `statement.description`.

6. **New authoring rule + frontend markdown rendering for statement / problem / solution descriptions.** Added a working-style rule to data/CLAUDE.md: `statement.description`, `problem.description`, and `solution.approach` must be broken into 2–4 short paragraphs (`\n\n`) with markdown `-` bullets for genuine enumerations, not a single wall-of-text paragraph. Frontend: `SolutionSection.tsx` already markdown-renders `approach` (react-markdown + remark-gfm + markdownComponents) and was the reference pattern; mirrored it into `StatementSection.tsx` (was a single plain `<p>`) and `ProblemSection.tsx` (was `whitespace-pre-wrap`) so both now render paragraphs and bullets. GC5B1-01's three sections reformatted in place as the first worked example (same uncommitted v1.0.0 — no version bump). Then, on user direction, the same paragraph+bullet reformat was applied across ALL 15 principles' `statement.description` / `problem.description` / `solution.approach` (42 sections total) — long single-paragraph descriptions broken into short paragraphs, with bullets for genuine enumerations (declared-field lists, lint-check lists, failure-mode lists, Option A/B/C alternatives). Content unchanged; no version bumps (formatting-only, same uncommitted pass). The renderer change is what makes the bullets display.

### Tracking files updated

`principles.json` (GC5B1-01 merged after GC4B1-01; statement/problem/solution descriptions reformatted into paragraphs+bullets), `data/ri/GC5B1-01/README.md` (new, Option A, GC4B1-01 template), `lens_mapping.md` (GENCOST05 section built out with the BP01 3-step decomposition + P54 note + focus-area closure), `lens_mapping_authored.md` (prepended step 2 promote + steps 1/3 not_promote), `agentflow/app/anchor.json` (status completed → GC5B1-01), `data/CLAUDE.md` (description-formatting authoring rule), `s3-json-viewer/components/principles/sections/StatementSection.tsx` + `ProblemSection.tsx` (markdown rendering), this entry.

### Catalogue count

The catalogue now holds **15** principles (was 14): 9 GENOPS + 6 GENCOST (GC1B1-01, GC2B2-01, GC3B1-01, GC3B3-01, GC4B1-01, **GC5B1-01**).

### Open items

- **JSON parse not run in-session** — the sandbox cannot reach the WSL mount. Verify before pushing: `python3 -c "import json; json.load(open('data/principles.json'))"`. Structural spot-checks in-session passed (GC5B1-01 inserted as a well-formed object after GC4B1-01; all v1.11 fields present: references, dependencies, serving_paradigm, applicability, framework_mappings, ownership, gates, change_history, explain_prompt).
- **Frontend** — P54 is a new focus_area string; confirm the runtime renders it with no registry change needed (focus_area is free-text, so it should). Run `npm run build` from `s3-json-viewer/` if in doubt.
- **AIGP III.B mapping_state unverified** on GC5B1-01 — promote to verified after a side-by-side review against the AIGP competency definition (same standing item as the other cost siblings).
- **GENREL not yet walked** — step 3's tool-timeout + "prompts handle timeout responses" substance lands there (cross-pillar reliability/error-handling); flagged as a future walk.
- Prior open items still stand (GENCOST03-BP02 output-length sibling; GENPERF04-BP02 vector-sizes performance side; `models/cache_minimums.yaml` maintenance; GC1B1-01 teeth gap; GC4B1-01's question-stem/parse verification from the prior entry).

---

## 2026-06-06 — Authored GC4B1-01 (Use the smallest embedding vector that still retrieves well) from GENCOST04-BP01; first principle under GENCOST04; created focus area P53 — Cost-informed Vector Stores; added a plain-title working-style rule to data/CLAUDE.md

### Context

Walked GENCOST04-BP01 ("Reduce vector length on embedded tokens", Medium risk, verbatim fetched 2026-06-06) — the first BP under the GENCOST04 focus area "Cost-informed vector stores", never previously walked. The BP directs teams to embed with a smaller vector dimension to cut vector-store storage/compute (and embedding-output tokens), deliberately trading against retrieval quality; some embedding models also offer compressed vector types. Four implementation steps (1 identify smallest supported dimension; 2 embed at smallest length; 3 latency/load test retrieval quality; 4 re-test with larger dimension / different chunking / different search algorithm).

The session was driven hard on plain language by the user (see the working-style decision below). The substantive promote/not_promote hinge discussed interactively before scoring: is "embedding model + its dimension" architecturally distinct from GC1B1-01's model-selection ADR, or just another cost dimension inside it? Resolved distinct: the cost lever is the vector store (storage / index / query), not generation inference; dimension is independent of model choice (Matryoshka/MRL truncatable-dimension models make it a free-standing knob — confirmed by a web search: Gemini Embedding 2 truncates 3,072 → 768/256 without significant retrieval drop, and dimension reduction cuts vector-search infra cost up to ~80%); and the choice is largely irreversible once the index is built (re-dimensioning means a full re-embed + re-index).

### Decisions

1. **Authored GC4B1-01 — Use the smallest embedding vector that still retrieves well.** Anchored on GENCOST04-BP01 implementation **step 2** (Embed data using the smallest vector length), absorbing step 1 (identify the smallest supported dimension) as the gate's recorded input. First principle under GENCOST04 / GenCost Q4; **14th principle** in the catalogue. step_promotion rubric **3/3/3/3** (enforceable declaration + consistency/governance gates; architecturally distinct from GC1B1-01 and disjoint from the P52 prompt-cost siblings; BP literally "Reduce vector length on embedded tokens" under "Cost-informed vector stores"; generic dimension mandate, compressed-vector-types aside stripped). Steps 3 and 4 not_promoted (retrieval-quality testing + chunking/search-algorithm tuning — process advice overlapping the GO1B1 eval-harness family and GENPERF04 Vector store optimization, no commitable pre-merge artefact distinct from the quality-floor number the declaration records). Merged into `principles.json` after GC3B3-01.

2. **New focus area P53 — Cost-informed Vector Stores** created to mirror AWS GENCOST04's verified focus-area title (distinct from P41 Model Selection & Right-sizing / P51 Inference Cost Optimization / P52 Cost-aware Prompting under the one-focus-area-per-AWS-question mapping).

3. **Design — Option A (declared-and-verified, config-derivable) as the mandated spine.** Each vector store commits `vectorstore/embedding.yaml` declaring `embedding_model` + `vector_dimension` + `quality_floor` + `quality_result` + `checked_on`. A `vectorstore/dimension_check` lint enforces at pre-merge: (1) declaration completeness; (2) deployed-index-vs-declared-dimension consistency by parsing the index IaC/config (Pinecone / pgvector / OpenSearch / Weaviate / Terraform adapters); (3) dimension-inflation governance requiring a recorded rationale for any upward change. The gate enforces that a quality number is RECORDED and the deployed dimension is real/stable; it does NOT re-run retrieval evaluation (that leans on a retrieval-eval harness — GENPERF04 territory). **Option B (measured-from-retrieval-eval)** documented as an additive alternative (gate the chosen dimension against the smallest clearing the quality_floor across a harness sweep); RI and gates built on Option A only. Parallel to GC3B1-01's Option A/B/C treatment and GC2B2-01's deployed-vs-declared consistency lint.

4. **Field calls.** tier enterprise (D1=no / D2=2 → recommended_centralise; the multi-backend index-config parser + governance lint is platform work, lighter than GC2B2-01's mature because it reads a single scalar — the index dimension). maturity_level scaling. **applicability { rag mandatory, agentic mandatory, ml nice_to_have } — llm deliberately OMITTED** because a pure LLM-only workload with no retrieval has no vector store; first cost principle to narrow applicability by omission (parallel to GC2B2-01 narrowing serving_paradigm). serving_paradigm all four mandatory (vector-store + embedding-output cost exist on every paradigm). impact Medium. dependencies: GC1B1-01 soft (embedding-model choice bounds the dimension range; gate operates independently) — parallel to GC2B2-01's soft dep on GC1B1-01. references (v1.11): Towards Data Science + MindStudio/Gemini Embedding 2 populated at authoring. AIGP III.B unverified (III.A "Govern Data" noted as a viable alternative anchor). explain_prompt compiled with setup_absence shape (default dimension never deliberately chosen; cost review makes it visible) + an irreversibility-lock-in nod.

5. **Statement title kept deliberately plain.** Title "Use the smallest embedding vector that still retrieves well" — a plain spoken sentence rather than the stacked-clause "Declare … and fail builds where …" form the GC3xxx siblings use. This was an explicit, emphatic user directive this session and is now a standing rule (next decision). It trades the statement rubric's `names_artefact_and_enforcement` dimension down (hand-scored 1) in favour of the override; the artefact + enforcement are carried in `statement.description` instead.

6. **Working-style rule added to data/CLAUDE.md.** New rule under "Keep responses SHORT": names, titles, and statements must be plain and short — say it the way you'd say it out loud, no stacked clauses, no "fail builds where… and… unless…" constructions, no flowery phrasing; "if a title needs commas to survive, it's wrong"; applies to principle titles too. Added after the user repeatedly flagged over-engineered principle titles.

### Tracking files updated

`principles.json` (GC4B1-01 merged after GC3B3-01), `data/ri/GC4B1-01/README.md` (new, Option A, GC3B1-01/GC3B3-01 template), `lens_mapping.md` (GENCOST04 section built out with the BP01 4-step decomposition + P53 note), `lens_mapping_authored.md` (prepended step 2 promote + steps 1/3/4 not_promote), `agentflow/app/anchor.json` (status completed → GC4B1-01), `data/CLAUDE.md` (plain-title rule), this entry.

### Catalogue count

The catalogue now holds **14** principles (was 13): 9 GENOPS + 5 GENCOST (GC1B1-01, GC2B2-01, GC3B1-01, GC3B3-01, **GC4B1-01**).

### Open items

- **JSON parse not run in-session** — the sandbox cannot reach the WSL mount. Verify before pushing: `python3 -c "import json; json.load(open('data/principles.json'))"`. Structural spot-checks in-session passed (GC4B1-01 inserted as a well-formed object after GC3B3-01; all v1.11 fields present: references, dependencies, serving_paradigm, applicability, framework_mappings, ownership, gates, change_history, explain_prompt).
- ~~GENCOST04 question stem approximated~~ **RESOLVED same session** — fetched gencost04.html; verified stem is "How do you optimize vector stores for cost?" GC4B1-01's `question` field corrected from the approximation to the verified text and marked verified.
- ~~GENCOST04 focus-area BP list not yet enumerated~~ **RESOLVED same session** — gencost04.html lists exactly ONE BP (BP01). GENCOST04 focus area is fully covered by GC4B1-01 and is CLOSED. Note: a vector-size BP also exists on the performance side at GENPERF04-BP02 (Optimize vector sizes for your use case) — the latency/accuracy analogue and a natural future GENPERF walk where the retrieval-quality testing not_promoted from BP01 steps 3/4 lands.
- **Frontend** — P53 is a new focus_area string; confirm the runtime renders it with no registry change needed (focus_area is a free-text field, so it should). Run `npm run build` from `s3-json-viewer/` if in doubt.
- Prior open items still stand (GENCOST03-BP02 output-length sibling; `models/cache_minimums.yaml` maintenance; GC1B1-01 teeth gap; the v1.11 references/frontend build check from the prior entry).

---

## 2026-06-06 — Schema v1.11: added `references` field (real-world evidence links) on every principle; populated GC3B1-01; built the runtime References tab

### Context

While refreshing GC3B1-01 (cap prompt templates at a declared token budget), the user asked whether the catalogue could capture real-world evidence that a principle's failure mode actually happens in industry — distinct from the synthetic, in-house `problem.examples`. A web search on GC3B1-01's failure (unenforced prompt-budget cost drift) surfaced multiple genuine write-ups: Adaline (a system prompt drifting 300→1,800 tokens over six months of edits), Opsmeter ("reliability stays green while token usage doubles"), ProjectDiscovery (named case — 20K-token agent system prompts, ~60M tokens per task), Cycles (prompt-regression as a standard cost-spike bucket; a 200x token-rate incident), Redis (token-bloat 10x cost jump). The catalogue had no structured slot to attach that evidence to the principle it validates.

### Decisions

1. **Schema v1.11 — new required root-level field `references`** on every principle. An array of `{ url, title, source, note, date }`. It is the external, citable counterpart to `problem.examples` (which are synthetic): examples teach the failure shape, references prove it happens. Empty array `[]` is the correct and expected state until matching evidence is found, and a reference must genuinely document THIS principle's failure mode, not generic topic-adjacent content. Field name `references` was chosen by the user over `examples` / `evidence` (both collide — with `problem.examples` and the existing top-level `evidence` field respectively). Bumped taxonomy.json `format_version` + `applies_to_principles_schema_version` to 1.11, principle_schema.json `schema_version` to 1.11, and principles.json meta `format_version` 1.9→1.11 (also backfilled the missing v1.10 dependencies meta note in principles.json). Added the field to both schema files, a `references_spec` block to each, a `conventions.references` block, and meta notes.

2. **Retrofitted `references` onto all 13 principles**, each with a MINOR change_history + current_version bump. GC3B1-01 was populated first with the five discovered links; the other twelve initially carried `[]`, then — in a follow-on pass the same session — a batch web-search sweep (results vetted by the user before insertion) populated **all twelve** with 1–2 evidence links each, so every principle now carries at least one real-world reference. GO1B1-03 (metric-as-code) is the one deliberately looser mapping, flagged as such in its own change_history. The empty-state change_history summaries were amended in place (same uncommitted v1.11 change) to describe the actual links rather than stacking a second same-day bump. Per-principle current_version bumps: GO1B1-01 1.7→1.8, GO1B1-02 1.5→1.6, GO1B1-03 2.2→2.3, GO1B1-04 1.2→1.3, GO1B1-05 1.2→1.3, GO1B1-06 1.1→1.2, GO3B1-01 1.1→1.2, GO3B2-01 1.1→1.2, GO3B2-02 1.1→1.2, GC1B1-01 1.2→1.3, GC2B2-01 1.1→1.2, GC3B1-01 1.1→1.2, GC3B3-01 1.0→1.1.

3. **Frontend.** Added `s3-json-viewer/components/principles/sections/ReferencesSection.tsx` (renders each reference as an external hyperlink + source badge + note + capture date) and registered it in `lib/principles/registry.tsx` as a "References" tab between Problem and Solution. The registry's existing `isEmptyNode` check means the tab shows only when `references` is non-empty — now on all 13 principles.

### Catalogue count correction

The catalogue holds **13** principles, not 14 — the "14" in the two 2026-06-05 entries is a miscount. GENCOST03 ships 4 BPs but BP02 and BP04 are not_promoted, so the GENCOST pillar has 4 principles (GC1B1-01, GC2B2-01, GC3B1-01, GC3B3-01); 9 GENOPS + 4 GENCOST = 13. Flagged for reconciliation of any downstream count references.

### Tracking files updated

`taxonomy.json` (version bumps + `references` field + `references_spec` + `conventions.references` + meta note), `principle_schema.json` (version + field + `references_spec`), `principles.json` (13 `references` fields + 13 change_history/current_version bumps + meta), `s3-json-viewer/components/principles/sections/ReferencesSection.tsx` (new), `s3-json-viewer/lib/principles/registry.tsx` (import + tab), this entry.

### Open items

- **JSON parse not run in-session** — the sandbox cannot reach the WSL mount (UNC rejected by the shell; Glob over the mount times out). Verify before pushing: `python3 -c "import json; json.load(open('data/principles.json')); json.load(open('data/taxonomy.json')); json.load(open('data/principle_schema.json'))"`. Structural spot-checks in-session passed (13 `references` fields, version sequence correct, GC3B1-01 5-object array and change-entry boundaries well-formed).
- **Frontend not type-checked/built in-session** (same mount limitation). Run `npm run build` from `s3-json-viewer/` to confirm the new tab compiles and renders.
- Catalogue-count "14→13" correction above to reconcile in any place that quotes the count.
- Prior open items still stand (GENCOST03-BP02 output-length sibling; `models/cache_minimums.yaml` maintenance; GC1B1-01 teeth gap).

---

## 2026-06-05 — GENCOST03-BP04 walked and not_promoted (no principle); GENCOST03 focus area closed

### Context

Walked the last BP under GENCOST03 / P52. BP04 ("Annotate user input to enable cost-aware content filtering", verbatim fetched 2026-06-05, 7 steps, risk Medium) directs wrapping only untrusted user spans in Bedrock `<amazon-bedrock-guardrails-guardContent_xyz>` tags (random per-request `tagSuffix`) so the **input content filter** scans the user span alone instead of the full assembled prompt (system + retrieval + history) — shrinking the moderation-pass token bill. AWS notes input tags are unsupported by the ApplyGuardrail API; filtering must be application-side.

### Decision

**not_promoted — no principle authored. User rejected it as a non-principle.** Reasoning developed in the walk: (1) the BP is essentially a Bedrock-specific tag mechanism; once stripped, the residual mandate ("scope the content filter to the untrusted input span") is a thin runtime prompt-assembly detail with no durable, CI-gateable artefact distinct from the existing P52 siblings (GC3B1-01 token size, GC3B3-01 cacheability). (2) The cost-vs-safety tension first raised dissolved: input content filters are span-local classifiers, so scanning the user span alone loses nothing for standard content-policy categories; relational checks (grounding/faithfulness) are a separate guardrail type input tagging doesn't affect. step_promotion not formally scored — the user made the call directly; rubric outcome would be not_promote on thin has_enforceable_artefact + not_vendor_menu. Steps 4–6 (minimalist response scheme + hard response-length cap) are output-side, deferred to BP02 / GC3B1-01's output budget.

**GENCOST03 closed:** BP01 → GC3B1-01; BP02 → UNMAPPED (open output-length sibling); BP03 → GC3B3-01; BP04 → not_promoted. Catalogue count unchanged at 14.

### Tracking files updated

`lens_mapping.md` (BP04 row + decomposition note → not_promoted; focus-area closure line), `lens_mapping_authored.md` (prepended BP04 not_promote entry), `agentflow/app/anchor.json` (status not_promoted), this entry.

### Open items

- **GENCOST03-BP02 (Control model response length)** remains the one open sibling under P52 — the output-side analogue of GC3B1-01 (declared `runtime_token_budget.output`, already capped via `max_tokens` by GO3B1-01). Natural next walk.
- Prior open items below still stand (JSON parse not run in-session; `models/cache_minimums.yaml` maintenance; GC1B1-01 teeth gap).

---

## 2026-06-05 — Added schema v1.10 `dependencies` field (retrofitted onto all 12 prior principles); authored GC3B3-01 (prompt caching) from GENCOST03-BP03; corrected the GENCOST03 Lens ledger (BP03/BP04 were missing)

### Context

Session opened on GC1B1-01. A critique surfaced and was worked through: GC1B1-01 (and the catalogue generally) concretises AWS outcome-BPs into *documentation + mechanical gate* because "did you pick the right-sized model / actually cache" is not CI-gateable; the catalogue trades enforcing the outcome for enforcing a falsifiable proxy. We then checked the live AWS Lens for GENCOST03 and found the ledger was stale — it listed only BP01/BP02, but the live page (fetched 2026-06-05) ships **four** BPs, with BP03 (prompt caching) and BP04 (cost-aware content filtering) missing. Question stem verified: "How do you engineer prompts to optimize cost?"

Two pieces of work followed: a schema addition (`dependencies`) the user requested while reasoning about how GC3B3-01 leans on GO3B1-01 + GC3B1-01, and the GC3B3-01 authoring itself.

### Decisions

1. **Schema v1.10 — new required root-level field `dependencies`** on every principle. An array of `{ principle_id, kind, reason }`; `kind` ∈ new `enums.dependency_kind` {hard, soft}. `hard` = the principle cannot be enforced/function without the dependency's substrate (e.g. GC3B1-01's budget gate has no `template_id` without GO3B1-01's registry); `soft` = composes with / is strengthened by but adoptable independently. Records DIRECT edges only (transitive closure recovered by walking the graph); directional, acyclic; `[]` for standalone foundational principles. Bumped `format_version` + `applies_to_principles_schema_version` to 1.10 in taxonomy.json and `schema_version` to 1.10 in principle_schema.json; added the field spec, the `dependency_kind` enum, a `conventions.dependencies` block, and a meta notes entry.

2. **Retrofitted `dependencies` onto all 12 prior principles** with a MINOR change_history entry + current_version bump on each. Map: GO1B1-01 []; GO1B1-02 → GO1B1-01 (hard); GO1B1-03 → GO1B1-01 (hard); GO1B1-04 → GO1B1-01 (hard) + GO1B1-02/03 (soft); GO1B1-05 → GO1B1-01 (hard) + GO1B1-04 (soft); GO1B1-06 → GO1B1-01 (hard) (the GO3B1-01 SDK-refusal mention is pattern reuse, not substrate, so omitted); GO3B1-01 []; GO3B2-01 []; GO3B2-02 → GO3B2-01 (hard); GC1B1-01 []; GC2B2-01 → GC1B1-01 (soft); GC3B1-01 → GO3B1-01 (hard).

3. **Authored GC3B3-01 — Mark the cacheable static prefix of every reused prompt template and fail builds that leave a cache-eligible template uncached or mis-declare its prefix size.** Anchored on GENCOST03-BP03 step 2 (enable caching / configure checkpoints), absorbing step 1 (identify opportunities) as the gate's eligibility computation. Fourth GENCOST principle; second under GENCOST03 / P52 (sibling to GC3B1-01). 14 principles in the catalogue now. dependencies: GO3B1-01 hard, GC3B1-01 soft.

4. **Design — the user's three-check shape, realised as manifest-derivable Option A.** Each template declares `cache.static_prefix_tokens` + a cache decision (checkpoint / opt_out). A `prompts/cache_check` lint: (check 1) requires the prefix-count declaration, fails if absent; (eligibility) requires templates whose declared prefix ≥ the model minimum in `models/cache_minimums.yaml` to be checkpointed or opted out; (check 2) recomputes the contiguous static prefix (body up to the first `{{variable}}`, model tokenizer) and fails on >10% variance — catching the silent-break (leading variable shrinks the prefix), the below-minimum false-positive, and the hand-written-fiction cases. (check 3) telemetry on actual size = optional **Option C** (runtime cache-hit-rate alarm via GO3B2-01's stream), documented as additive, not the spine — this is also where not_promoted step 3 (monitor caching metrics) lands. Step 4 (optimize/tune) not_promoted as process advice.

5. **The promote call resolved the "is caching even gateable?" question YES** — via Option A's manifest-derivable artefact. step_promotion 3/3/3/3. Distinct from GC3B1-01 (the load-bearing distinction): opposite cost lever — GC3B1-01 fails prompts whose footprint is too BIG; GC3B3-01 acts when a big prefix is STABLE and reused. Disjoint gates, same GO3B1-01 registry + tokenizer substrate.

6. **serving_paradigm departs from the cost siblings** — api_on_demand + api_provisioned mandatory, self_hosted_managed + self_hosted_unmanaged nice_to_have. Rationale: the reduced-cached-token-rate billing is a managed-API pricing feature; self-hosted prompt caching is a KV-cache recompute/latency win, not a per-token bill line. (GC3B1-01 is all-four-mandatory because token *length* drives cost on every paradigm; the *cached-rate* benefit does not.) impact Medium; applicability { llm/rag/agentic mandatory, ml nice_to_have }; maturity scaling (on GO3B1-01 substrate); tier enterprise (D1=no / D2=2). AIGP III.B unverified. explain_prompt setup_absence shape (caching never enabled) with a secondary silent-break nod.

7. **Lens ledger corrected.** `lens_mapping.md` GENCOST03 now lists all four BPs (BP03 → GC3B3-01; BP04 UNMAPPED); question stem marked verified 2026-06-05. `lens_mapping_authored.md` prepended with BP03 step 2 promotion + steps 1/3/4 not_promote records. `agentflow/app/anchor.json` marked completed.

### Open items

- **JSON parse not run in-session** — the sandbox cannot reach the workspace (UNC mount rejected by the shell, and `ls`/Glob over the WSL mount time out). Run `python3 -c "import json; json.load(open('data/principles.json')); json.load(open('data/taxonomy.json')); json.load(open('data/principle_schema.json'))"` from a terminal before pushing.
- **`models/cache_minimums.yaml`** per-model minimum-token thresholds must be maintained against provider docs (caching support + minimums shift as providers ship models). Platform-team-owned; flagged in the GC3B3-01 RI.
- **GENCOST03-BP04** (Annotate user input to enable cost-aware content filtering) remains UNMAPPED — natural next sibling under P52; not yet fetched in detail.
- **GC1B1-01 teeth gap** (from the opening critique) still stands: a stronger eval-evidence-backed model-right-sizing principle (the GC1B1-02 "periodic re-evaluation" slot) remains unauthored.

---

## 2026-06-04 — Authored GO1B1-06 (Pin every model call to an immutable, catalogued version and re-run the evaluation harness before any version change ships); fulfils the model-change gate earmarked from GENOPS01-BP01; surfaced a Lens gap (no AWS BP for model versioning)

### Context

While building customer-experience failure examples for the workshop decks, a strong project-level, in-scope example surfaced: a support chatbot whose foundation model silently moves underneath it — a provider rolls a floating `-latest` alias forward, deprecates a snapshot and auto-migrates, or a shared gateway swaps its default. The agent's code/prompts/tests are unchanged, so no PR opens, no per-PR or drift gate fires, infra dashboards stay green — and the first signal is a CSAT drop. We confirmed this is environmental (the model substrate moves, not the agent's internal design), so it's in scope for the catalogue, and asked which principle prevents it.

Anchor research on the live Lens: **there is no dedicated GenAI Lens BP for model versioning.** GENOPS03's question names "your models, prompts, and assets" and its description names "model versioning," but it ships only BP01 (prompt template management → GO3B1-01) and BP02 (tracing → GO3B2). The model-change re-evaluation directive lives in **GENOPS01-BP01's implementation guidance**: *"Run these evaluations when new candidate models are available, or when model customization techniques are applied."* (verbatim, fetched 2026-06-04). This is exactly the "future model-change gate" earmarked in GENOPS01-BP01 step 3's not_promoted note.

### Decisions

1. **Authored GO1B1-06 — Pin every model call to an immutable, catalogued version and re-run the evaluation harness before any version change ships.** Sixth principle in the GO1B1 eval family; inserted in `principles.json` between GO1B1-05 and GO3B1-01. 12 principles in the catalogue now.

2. **Anchor: GENOPS01-BP01 implementation-guidance directive, `implementation_step: null`.** Not a numbered step (the seven steps are already concretised by GO1B1-01..05); the model-change re-eval directive is BP-guidance-level. The verbatim is quoted in the framework_mappings note. The pin/catalog half is cross-referenced as the model-side twin of GO3B1-01 and to the Reliability "standardized catalogs for prompts and models" design principle.

3. **Scope: one principle.** Pinning + approved-model-catalog membership is the *enabling mechanism* (a change is undetectable on a floating alias); the re-evaluation gate is the principle. The runtime SDK refusal of un-pinned models (GO3B1-01 pattern applied to model identifiers) is carried in solution.approach as a runtime control, not a separate pre_merge gate — parallel to how GO3B1-01 framed its runtime refusal.

4. **Two pre_merge gates.** (1) Catalog-membership lint — every model reference (config, src, env defaults) must resolve to an exact catalogued version; floating aliases and un-catalogued ids fail. (2) Re-eval-on-change — any PR changing a pinned model identifier must re-run the GO1B1-01 harness and clear the baseline (or carry an ADR). Both required status checks. step_promotion 3/3/3/3; gates rubric 3/3/3/3/3/3.

5. **Distinct from GO1B1-04 (drift).** A model swap is a discrete step-change at one moment; GO1B1-04 watches gradual sub-threshold cumulative drift and its window-to-window threshold can miss a clean step entirely, and it has no per-PR trigger. GO1B1-06 gates the model identifier at its source.

6. **tier enterprise** (D1=no, borderline yes under regulated model-risk-management regimes → those workloads treat as mandatory_centralise; D2=3 — model catalog + membership lint + runtime-refusing SDK + re-eval gate wiring + rollback tooling). **maturity scaling** (needs the GO1B1-01 harness substrate + a deployed model; enforcement infra amortises at project #2). **serving_paradigm all four mandatory** (API workloads face provider roll-forwards/deprecations/gateway swaps; self-hosted still need re-eval-on-change when new weights deploy). **impact High** (silent customer-facing regression). **applicability { llm/rag/agentic mandatory, ml nice_to_have }**. **AIGP III.B** (model lifecycle) unverified — a deliberate shift from the GO1B1 family's III.A data-governance anchor, because this governs the model artefact's version lifecycle, not the ground-truth data.

7. **explain_prompt: setup_absence shape** (the pin + re-eval discipline was never built; a provider/gateway model change makes the absence visible) — distinguished from GO1B1-04's cumulative_drift shape because this is a discrete model-substitution event.

8. **Lens gap recorded.** No dedicated AWS BP for model versioning. Noted in `lens_mapping.md` (GENOPS01-BP01 guidance entry + a GENOPS03 gap note); the model-*registry* twin of GO3B1-01 (the full model analogue of the prompt registry) left as an open extension candidate.

9. **Tracking files updated.** `principles.json` (GO1B1-06 merged), RI at `data/ri/GO1B1-06/README.md` (GO1B1-04 template, pin+catalog+re-eval design), `lens_mapping.md` (GENOPS01-BP01 + GENOPS03 gap note), `lens_mapping_authored.md` (prepended), `agentflow/app/anchor.json` (completed).

### Open items

- **JSON parse not run in-session** — the sandbox cannot reach the workspace (UNC mount rejected by the shell), so `principles.json` was hand-edited without a parse check. Run `python3 -c "import json; json.load(open('data/principles.json'))"` from a terminal before pushing.
- **Model-registry extension** — a fuller model-side twin of GO3B1-01 (a model registry, not just pin+re-eval) may warrant its own principle; recorded as an extension candidate under GENOPS03 in `lens_mapping.md`.

---

## 2026-06-04 — Authored GC3B1-01 (Cap every prompt template at a declared token budget and fail builds whose token footprint exceeds it); resumed the paused GENCOST03-BP01 budget principle now that its GO3B1-01 substrate ships; first principle under GENCOST03; created focus area P52 — Cost-aware Prompting

### Context

GENCOST03-BP01 (Optimize prompt token length) was the budget principle paused on 2026-06-03 pending its substrate. With GO3B1-01 (template registry + `runtime_token_budget.input` field) now in place, the principle became authorable: the budget gate finally has an addressable `template_id` and a declared ceiling to bite on. Session opened by establishing what GO3B1-01 actually does with `runtime_token_budget` — answer: it hard-enforces the **output** budget (passed as `max_tokens` on the API call), gates only the **existence/shape** of the input budget (the field must be non-empty), and merely **measures and emits** an actual-vs-declared signal for the input side. The input ceiling is declared-but-toothless. That gap is exactly what GC3B1-01 fills.

A design discussion settled the measurement question (input footprint depends on runtime variable fills, so "what do we gate against" is a real choice). Three options were laid out: **A** declared-worst-case / manifest-derivable (scaffolding tokens + Σ variable `typical_max`, gated against `runtime_token_budget.input`); **B** measured from GO1B1 eval-harness fixtures; **C** runtime alarm on GO3B1-01's per-call signal. The user chose **A as the mandated spine, with B and C documented as additive alternative reference implementations** so adopters have options — the gates and RI are built on Option A only.

### Decisions

1. **Authored GC3B1-01 — Cap every prompt template at a declared token budget and fail builds whose token footprint exceeds it.** Appended to `data/principles.json` after GC2B2-01 (GC ordering GC1B1 < GC2B2 < GC3B1). 11 principles in the catalogue now. Anchored on AWS GENCOST03-BP01 implementation **step 2** ("Engineer the prompt to reduce the token count"), absorbing step 1 ("Identify a verbose prompt") — a template breaching its ceiling IS the identified verbose prompt, surfaced mechanically.

2. **Distinctness from GO3B1-01 is the load-bearing call.** GO3B1-01 mandates the budget field *exists*; GC3B1-01 makes the number a *binding ceiling enforced against computed footprint*. Different failure mode (silent token creep on the bill vs no addressable template at all), different focus area (P52 Cost-aware Prompting vs P13 Traceability), disjoint enforcement (footprint-vs-budget lint + budget-inflation governance lint vs registry-consistency / no-inline-call / version-floor lints). step_promotion rubric scored **3/3/3/3**.

3. **Option A as spine; B and C as additive alternatives in solution.approach and the RI.** Option A is fully pre-merge enforceable and manifest-derivable (no fixtures, no deployed baseline), reuses GO3B1-01's tokenizer integration and the per-variable `typical_max` ceilings already in the manifest, and matches AWS step 2's scope exactly. B (measured-from-fixtures) and C (runtime alarm) are documented as optional, explicitly not part of the mandated artefact set so gate coverage_completeness scopes to Option A. RI at `data/ri/GC3B1-01/README.md` built on Option A with B/C in a final "alternative implementations" section.

4. **Two pre_merge gates.** (1) Footprint-vs-budget: lint computes `scaffolding_tokens (model tokenizer, placeholders excluded) + Σ variable.typical_max` and fails when > `runtime_token_budget.input`, or when the budget is absent/zero. (2) Budget-inflation governance: any PR raising `runtime_token_budget.input` or a variable `typical_max` above its merge-base value must carry a recorded cost rationale (manifest `change_history` entry or linked ADR), closing the silent-widen-to-dodge loophole. Both required status checks on the integration branch. gates rubric 3/3/3/3/3/3.

5. **New focus area P52 — Cost-aware Prompting created**, mirroring AWS GENCOST03's verified focus-area title. Distinct from P51 — Inference Cost Optimization (GENCOST02 / GC2B2-01) and P41 — Model Selection & Right-sizing (GENCOST01 / GC1B1-01), per the focus_area rubric's one-area-per-AWS-question mapping. (Noted but not resolved: GC1B1-01's P41 code is a legacy numbering oddity under the P5 pillar; left as-is.)

6. **`serving_paradigm` all four mandatory** — unlike GC2B2-01 (self-hosting only). AWS GENCOST03-BP01 verbatim states prompt length drives cost in both managed per-token billing AND self-hosted/provisioned compute time, so the failure mode exists on every paradigm.

7. **`maturity_level: scaling`** — pays off at project #2 on GO3B1-01's registry substrate (itself scaling); a principle cannot pay off before its scaling-tier substrate is adopted, and the tokenizer-lint build is not first-project capability. depends_on_deployment = no (Option A is manifest-derivable), which is why scaling not mature. maturity rubric 3/3/3/3.

8. **`ownership.tier: enterprise`** via tier rubric D1=no (cost discipline, no legal exposure) / D2=2 (footprint lint + budget-governance lint with ongoing tokenizer maintenance, reused across projects; thinner than GO3B1-01's D2=3 because it extends GO3B1-01's tooling rather than building new) → recommended_centralise. validator project_architect, audit_mode self_attestation_with_mechanical_evidence, arb_role dashboard_and_spot_check parallel to GO3B1-01 / GC2B2-01.

9. **impact_level Medium** (AWS BP risk Medium; cost failures recoverable via trimming, parallel with GC1B1-01 / GC2B2-01). **applicability { llm/rag/agentic: mandatory, ml: nice_to_have }** matching the cost siblings. **AIGP III.B unverified** parallel to GC1B1-01 / GC2B2-01.

10. **explain_prompt compiled with `cumulative_drift` shape** — many locally-rational token additions across PRs and templates compounding into a portfolio cost regression no single review catches. Distinguished from GO3B1-01's `setup_absence` shape: here the registry and budget field DO exist; the failure is drift past a ceiling that was never enforced.

11. **Tracking files updated.** `lens_mapping.md` GENCOST03 section filled (BP01 ledger; BP02 left UNMAPPED as a natural future sibling — the output-side analogue gating `runtime_token_budget.output`). `lens_mapping_authored.md` prepended with 4 entries (step 2 promotion + steps 1/3/4 not_promote records). `agentflow/app/anchor.json` marked completed.

### Open items

- **JSON parse not run in-session.** The sandbox could not reach the workspace (UNC mount rejected by the shell), so `principles.json` was hand-edited without a parse check. Run `python3 -c "import json; json.load(open('data/principles.json'))"` from a terminal before pushing.
- **GENCOST03 question-stem wording** in GC3B1-01's `framework_mappings.aws.references[0].question` is approximated from the verified focus-area title pending a question-page verification pass; the BP title and step-2 `verbatim_text` are verified against the live AWS Lens page (fetched 2026-06-04).

---

## 2026-06-03 — Authored GO3B1-01 (Route every model call through a registered, versioned prompt template via the central SDK); first principle authored under GENOPS03-BP01; substrate for the paused GENCOST03-BP01 budget principle

### Context

GENCOST03-BP01 (Optimize prompt token length) was loaded into the walkthrough at the start of this session. Discussion surfaced the dependency: the budget principle needs `template_id` as the addressable key for budget enforcement, but without a prior principle mandating prompt registration there is no `template_id`. Walking back from the budget principle pointed at GENOPS03-BP01 (Implement prompt template management) as the substrate that must exist first. The walk pivoted: BP01 of GENOPS03 first, then come back to GENCOST03-BP01 once GO3B1-01 ships.

GENOPS03-BP01 was decomposed into its six implementation steps. Step 1 ("Set up Amazon Bedrock Prompt Management" — strip vendor → registered, versioned templates with variables) was the clear promote candidate, with step 4 ("Integrate prompts into applications — use Bedrock SDK") absorbed because the SDK call-signature contract is mechanically inseparable from the template registry. Steps 2/3/5/6 were non-promoted on absorbed-by-sibling / process-advice / mechanical-consequence grounds.

### Decisions

1. **Authored GO3B1-01 — Route every model call through a registered, versioned prompt template via the central SDK.** Merged into `data/principles.json` between GO1B1-05 and GO3B2-01 (correct pillar / BP-code ordering: GO1B1-* before GO3B1-* before GO3B2-*). Statement is imperative-form ("Route every model call..."), parallel to the catalogue's imperative pattern (GO1B1-01..05, GO3B2-02, GC1B1-01, GC2B2-01). 10 principles in the catalogue now (8 → 9 with GO3B2-02 yesterday; 9 → 10 with GO3B1-01 today).

2. **Step 4 absorbed into step 1's principle** rather than scored as a standalone not_promote with redundancy reason. Justification: the SDK call-signature contract (`(template_id, variables)`, refusing inline strings) is mechanically inseparable from the template registry — the gate from step 1 (every template_id in src/ resolves to a registry entry) only bites if step 4's call signature is enforced; without step 4, inline strings bypass the registry and the gate becomes voluntary. Same absorption shape as GO3B2-01 absorbing AWS step 2's emit-time PII pre-scrub into step 1.

3. **Step_promotion rubric scored 3/3/3/3** (`data/sections/step_promotion/rubric.json`). D1 has_enforceable_artefact: 3 (path-shaped `prompts/<template_id>.{md,j2}` + `prompts/manifest.yaml` + SDK call-signature contract; three pre_merge gates with content-shape checks). D2 architecturally_distinct: 3 (sibling GO3B2-01 named precisely with disjoint artefacts — GO3B2-01 owns observability emission contract, GO3B1-01 owns LLM call-signature contract; different failure modes, different gates). D3 in_bp_scope: 3 (BP question text literally names "prompts" — *"How do you maintain traceability for your models, prompts, and assets?"*; template-management is the BP's whole point). D4 not_vendor_menu: 3 (Amazon Bedrock Prompt Management + Bedrock SDK + Bedrock Flows stripped from steps 1, 3, 4, 6; generic mandate "every prompt is a registered, versioned template accessed via SDK contract" survives).

4. **Storage-neutral solution with two modes.** The principle mandates the registration contract (SDK refuses inline strings; templates are addressable by id; declared metadata required) but stays neutral on storage backend. **Mode A (file-based + manifest):** bodies at `prompts/<template_id>.{md,j2}`, metadata rows in `prompts/manifest.yaml`, git as version backend, CI lints walk files. **Mode B (hosted TMS):** bodies and metadata in a hosted prompt management service (Bedrock PM / Langfuse / PromptLayer / Humanloop / MLflow Prompt Registry — deferred to `framework_mappings` notes to avoid vendor-menu in the solution section), SDK fetches at build or runtime, CI lints query the service API for the same consistency checks. Mode choice is a workload-tier implementation decision; the principle's gate shapes parameterise over both modes. First catalogue principle with explicit storage-mode neutrality.

5. **Three pre_merge gates parallel to GO3B2-01/02.** (1) Lint walks `src/` for `sdk.generate(template_id=...)` calls; every template_id must resolve to a registry entry (Mode A: manifest row + body file; Mode B: TMS API record), and every registry row must declare non-empty required metadata (`id`, `version`, `body`, `variables`, `model`, `runtime_token_budget.input`, `runtime_token_budget.output`, `owner`, `status` ∈ {draft, active, deprecated, archived}). (2) AST-grep lint scans `src/` for direct provider-SDK invocations (`anthropic.Anthropic().messages.create`, `openai.OpenAI().responses.create`, Bedrock + Azure equivalents) outside the central LLM SDK package; allow-list at `prompts/prohibited_calls.yaml`. (3) Lint verifies workload pins central LLM SDK at version ≥ floor declared at `prompts/sdk_floor.txt`. All three configured as required status checks on the integration branch via branch protection.

6. **`maturity_level: scaling`** scored 3 on `adoption_trigger_portfolio_size` (v2 rubric). Justification: pays off at project #2 when the first downstream gate (token budgets, safety classification, prompt-drift monitoring) needs an addressable `template_id` to key on, OR when a second team's prompts must be discoverable across team boundaries. Thin enforcement (3 CI lints + SDK call-signature contract + manifest schema for Mode A or TMS adapter for Mode B) is shippable by a 1–3 engineer platform team without ARB. Foundational considered (substrate principle, retrofit pain severe) but rejected on parallel-with-substrate-sibling-GO3B2-01 grounds: at project #1 with one team and 5 prompts, in-module discipline is sufficient.

7. **`ownership.tier: enterprise`** via the tier rubric. D1=no borderline (prompts in regulated industries may embed policy / disclosure content, but dominant content is task framing; same hedge as GO3B2-01 used for PII / data-residency). D2=3 (central LLM SDK across multiple languages + tokenizer integration per provider + 3 CI lints + manifest schema + validator + optional TMS adapter set + observability hooks for budget overrun signals — weeks of platform engineering that would repeat per project if local). Outcome: `recommended_centralise` → enterprise. `validator: project_architect`, `audit_mode: self_attestation_with_mechanical_evidence`, `arb_role: dashboard_and_spot_check` — parallel to GO3B2-01/02 since D1 didn't fire.

8. **`impact_level: High`** parallel to GO3B2-01/02 and matching AWS's HIGH risk rating for GENOPS03-BP01. Worst-case problem examples (regulator archaeology, downstream gate collapse, manual rollback reconstruction) are High-shape consequences, not Critical safety events.

9. **`focus_area: P13 — Traceability`** (GENOPS03 → P13 direct map per focus_area rubric). Same focus area as siblings GO3B2-01/02.

10. **Framework mappings: AWS step 1 verbatim verified; AIGP IV.A primary / IV.B secondary unverified.** AWS note names four catalogue-specific concretisations AWS leaves unspecified: SDK call-signature contract; manifest metadata schema; storage-mode neutrality; no-inline-call AST lint. AIGP IV.A (Establish Governance Policies, Processes, and Standards) is the primary mapping because the registered template registry + SDK call-signature contract IS the governance standard for prompt content at the technical layer; IV.B (Monitoring) is the secondary mapping because the registry's addressable template_id is the substrate prompt-layer monitoring keys on.

11. **`explain_prompt` compiled with `setup_absence` failure shape** parallel to GO3B2-01 — registry was never built, prompts live inline, absence becomes visible at a triggering event (finance asks for portfolio-wide prompt-cost attribution, a model upgrade requires a prompt rewrite and rollback fails, a token-budget gate is mandated and cannot bite because there are no template_ids, a regulator asks for the exact prompt in production as of a specific date). Distinguished from GO3B2-02's `audit_time_discovery` shape (drift in existing controls) — for GO3B1-01 the controls were never in place from day 1.

12. **RI README written at `data/ri/GO3B1-01/README.md`** following the GO3B2-01 / GO3B2-02 template. The interface_contract specifies the SDK `generate()` signature, the manifest row schema for Mode A, the TMS config schema for Mode B, the prohibited-imports snippet, semver / version-floor / TMS approval SLA details. Acceptance criteria branched per mode (Mode A: manifest + body file existence; Mode B: tms_config + central allow-list reference).

13. **`lens_mapping.md` row 104 flipped** from "Possibly PRIN_014 or PRIN_017 — verify side-by-side" to GO3B1-01 reference + BP01 closure with steps 2/3/5/6 not_promoted reasons documented.

14. **`lens_mapping_authored.md` prepended** with 5 new top entries: step 1 promotion (GO3B1-01) plus four step-level not_promote scoring records (steps 2/3/5/6).

15. **`agentflow/app/anchor.json` marked completed** with `promoted_to_principle: "GO3B1-01"`.

### Why this is the right call

The substrate-first sequencing is the load-bearing decision. Walking GENCOST03-BP01 first (the original starting point) would have produced a budget principle whose gate (`prompts/budgets.yaml` keyed on `template_id`) cannot bite on workloads that have no `template_id` — i.e. the principle would have been unenforceable on every workload using inline-string prompts, which is most current workloads. The right ordering is: register the templates first (GO3B1-01); then layer budget enforcement on top (future GENCOST03-BP01). The user surfaced this dependency early; pivoting cost ~half a session and saved authoring a principle that would have collapsed on first application.

The two-mode storage neutrality (Mode A file-based + manifest vs Mode B hosted TMS) is the first time the catalogue has handled a "workload chooses one of two acceptable implementations" pattern in the solution section. Sibling principles (GO3B2-01/02, GC2B2-01) all prescribed a specific implementation. The mode-neutrality here reflects the real enterprise landscape — Stripe / Shopify build internal gateways (Mode A pattern); enterprises buy commercial TMS platforms (Mode B) like Bedrock Prompt Management, Langfuse, PromptLayer, Humanloop, MLflow Prompt Registry. Forcing one mode would have been catalogue-mandate exceeding AWS scope. The CI lint suite parameterises cleanly per mode (Mode A: walk files; Mode B: query TMS API), so the gate shape stays uniform.

The agentflow application is the cleanest reference implementation in the catalogue — agentflow's existing prompt architecture (`data/sections/<section>/<op>.json` files loaded via `prompt_loader.py`, composed via `composer.py`, dispatched via `llm_client.py`) is roughly half-compliant with GO3B1-01 already: the templates exist as addressable files, the composition is centralised, the SDK exists. The gaps are the SDK contract (currently accepts raw strings via `.complete(model, system, user)`), the absent manifest file, and the absent CI lints. The principle would close those gaps with maybe 200 lines of platform-team work.

### Files changed today (this entry)

- `data/principles.json` — GO3B1-01 inserted between GO1B1-05 and GO3B2-01 (line 689 onward). 10 principles in the catalogue now.
- `data/ri/GO3B1-01/README.md` — new file. RI matching the GO3B2-01 template, branched for Mode A vs Mode B.
- `data/lens_mapping.md` — row 104 flipped to GO3B1-01 reference + BP01 closure.
- `data/lens_mapping_authored.md` — five new top entries (step 1 promotion + steps 2/3/5/6 not_promote scoring records).
- `agentflow/app/anchor.json` — repointed to completed status with `promoted_to_principle: "GO3B1-01"`.
- `data/decisions.md` — this entry. `(latest)` marker moved off the prior 2026-06-02 GO3B2-02 entry.

NOT changed:
- `data/principles_authored.json` — downstream of `principles.json`, reconciles on next pass.
- `data/sections/gates/rubric.json` — open item: lifecycle_point_valid descriptor is stale per the 2026-05-31 tier-rubric redefinition (enterprise-tier siblings GO3B2-01/02 also gate at pre_merge); rubric should be updated in a separate rubric-revision session.
- `data/sections/serving_paradigm/rubric.json` — open item: rubric file does not exist; serving_paradigm scoring on GO3B1-01 was done informally; rubric should be authored to bring the section under the same rubric-applied discipline as the others.

### Open items added by this entry

- **Validate `data/principles.json` parses cleanly.** Shell sandbox is rejecting the UNC workspace path so the standard `python3 -c "import json; json.load(open('data/principles.json'))"` could not run from this session — same blocker as the 2026-06-02 GO3B2-02 session. Edit was structural-match against the existing GO1B1-05 / GO3B2-01 boundary, but worth a parse check from the user's terminal before pushing.
- **`data/sections/serving_paradigm/rubric.json` is missing** — surfaced during this session's section-by-section rubric scoring. GO3B1-01's serving_paradigm was scored informally (schema validity + parallel with siblings); the next principle authoring should author this rubric first.
- **`data/sections/gates/rubric.json` dimension 1 (`lifecycle_point_valid`) is stale** — predates the 2026-05-31 tier-rubric redefinition. Currently descriptor says enterprise-tier should gate at release/quarterly_review/annual_review, but every enterprise-tier sibling (GO3B2-01, GO3B2-02, GO3B1-01) gates at pre_merge because tier semantics are now centralisation-of-infrastructure not where-the-check-fires. Update the rubric or document the divergence as the operative pattern.
- **AIGP IV.A and IV.B mappings on GO3B1-01 are `unverified`.** Same status as every other AIGP mapping in the catalogue today.
- **Resume GENCOST03-BP01 (paused).** Now that GO3B1-01 is in place, the budget principle has `template_id` as its addressable key. The natural next BP walk is GENCOST03-BP01 — the principle that started this session's conversation. Joint authoring against BP01 + BP02 (input + output token budgets in one `prompts/budgets.yaml` file) remains the recommended structural call.
- **Retro-fix GO3B2-01's statement title to imperative form** (carried forward from yesterday's entry — still the catalogue's only noun-phrase outlier).

### Where this session paused

GO3B1-01 authored, merged, RI written, lens_mapping flipped, lens_mapping_authored top entries added, anchor marked complete, decisions.md entry logged. GENOPS03-BP01 closed. Principle count in catalogue: 9 → 10. The agentflow staging slot is ready for the next BP — natural candidate is GENCOST03-BP01 (the paused starting point of this session), which now has substrate support from GO3B1-01.

---

## 2026-06-02 — Authored GO3B2-02 (Govern read access and retention on AI observability traces through a centrally-owned policy); sibling to GO3B2-01 under P13 Traceability; closes GENOPS03-BP02

### Context

GENOPS03-BP02 step 1 was authored as GO3B2-01 yesterday (entry below). Today's session resumed against step 2 ("Secure trace data. Implement appropriate access controls to verify that only authorized personnel can view trace data. Be mindful of any sensitive information that might be included in traces and handle it according to your organization's security policies"). Step 2 contains two architecturally distinct slices: emission-time PII pre-scrub (already absorbed by GO3B2-01's central redactor + pii_scrub_applied header flag) and post-emission governance (read-side access control + retention keyed on compliance_tier + read-side audit logs). The open call was pillar placement for the remaining slice — sibling principle under P13 (Option A) or cross-pillar deferral to a future GENSEC P22 Data Protection / P21 IAM walk (Option B).

### Decisions

1. **Option A chosen — Authored GO3B2-02 as sibling to GO3B2-01 under P13 Traceability.** Decisive argument: compliance_tier is the seam field that flows from emit (set by GO3B2-01's central SDK) to read (the keying field used here by the central access policy and retention policy). A regulator walking the audit trail "show me who accessed PII-bearing trace X over the last 90 days and prove the trace was deleted within the retention window" needs to traverse emit→storage→access→deletion without crossing a pillar boundary. Splitting the GO3B2 pair across pillars would fragment that walk. Secondary signal: AWS itself nests step 2 inside GENOPS03-BP02 rather than within a GENSEC focus area — the AWS-source placement matches Option A. Option B was the right call to consider explicitly (the substance overlaps with generic data-protection / IAM patterns that GENSEC will surface), but the audit-trail argument wins on the sibling case.

2. **Promotion decision scored 3/3/3/3 against `data/sections/step_promotion/rubric.json`.** D1 has_enforceable_artefact: 3 (specific path-shaped central artefacts — `observability/access_policy.yaml`, `observability/retention_policy.yaml`, `observability/iam_managed_by_central.yaml`, `observability/policy_floor.txt`; project side declares `compliance_tier` in the existing `observability/config.yaml` from GO3B2-01; gates inspect content not existence). D2 architecturally_distinct: 3 (sibling to GO3B2-01 with disjoint artefacts — GO3B2-01 owns write path: SDK, header enrichment, emit-time PII scrub; GO3B2-02 owns read path: access policy, retention policy, IaC bypass lint, read-audit pipeline). D3 in_bp_scope: 3 (AWS placement honoured; trace data IS what this BP produces, so post-emission governance of those traces is BP-native). D4 not_vendor_menu: 3 (AWS verbatim is pure mandate language with no vendor service callouts to strip).

3. **Merged into `data/principles.json` between GO3B2-01 and GC1B1-01** (line 794 onward). 9 principles in the catalogue now. Statement is imperative-form ("Govern read access and retention...") — honours the statement rubric's parallel_form_with_siblings against the imperative pattern of GO1B1-01..05, GC2B2-01. GO3B2-01's noun-phrase title remains the catalogue's only outlier; not retro-fixed in this session. Five-example problem section drawn from retailer-shape failures: contractor offboarding miss across separate backend grants, retention drift across vendor defaults causing a GDPR DSAR finding, cross-team incident reconstruction blocked at backend boundary, read-side audit absent as a SOC2 deficiency, compliance_tier honoured at emit but ignored at storage.

4. **Three pre_merge gates.** (1) `observability/config.yaml` declares `compliance_tier ∈ {regulated, sensitive, standard}` AND the value matches the workload's tier in the central project registry. (2) Workload IaC scan blocks any project-local IAM grant on observability backend resources outside the central allow-list (`observability/iam_managed_by_central.yaml`). (3) Workload pins the central observability policy package at version ≥ floor (`observability/policy_floor.txt`). Parallel structure to GO3B2-01's three gates; the sibling pair uses the same gate-shape vocabulary (allow-list ban / required content / version floor).

5. **`maturity_level: scaling`** — scored 3 on `adoption_trigger_portfolio_size` per v2 rubric. Justification: pays off at project #2-3 when fragmented per-team access controls and retention drift first appear at multi-backend scale; the thin enforcement (3 lints + central policy YAMLs + lifecycle-rule IaC for 3-4 backends) is shippable by a 1-3 engineer security/platform team without ARB. Parallel to GO3B2-01's scaling call.

6. **`ownership.tier: enterprise`** via D1=no (borderline, same hedge as GO3B2-01: read-side governance on already-PII-scrubbed traces is one step removed from raw-PII exposure that GO3B2-01's emit-time scrub addresses) / D2=3 (access policy schema + retention policy with backend lifecycle rule generation for 4 backends + IaC bypass lint + read-audit pipeline + central security review workflow). `audit_mode: self_attestation_with_mechanical_evidence` and `arb_role: dashboard_and_spot_check` kept parallel to the broader catalogue's 9 principles. The tier rubric's normative claim "D1 fires → central_review_at_gate" was considered for the precedent-setting case but D1 honestly does not fire here — the regulator-inspected artefact is the central policy file itself (which the central security team owns), not each project's per-PR adherence (which is mechanically gated by CI).

7. **AIGP IV.C primary / IV.B secondary (unverified).** Inverse of GO3B2-01 (IV.B primary / IV.C secondary). The GO3B2 pair now covers IV.B (monitoring) and IV.C (access control + incident management) from both directions — the centralisation in GO3B2-01 gives IV.B its monitoring substrate; the access governance in GO3B2-02 gives IV.C its enforcement.

8. **RI README written at `data/ri/GO3B2-02/README.md`** following the GO1B1-01 / GO3B2-01 template. Interface contract specifies the `observability/config.yaml` extension (one new field — `compliance_tier`), the central `access_policy.yaml` schema with worked principals (role:sre-oncall, group:platform-observability, group:fraud-team-leads, user:alice@example.com), the `retention_policy.yaml` schema with backend overrides, the IAM-managed allow-list, lint output examples, and three SLAs (backend access addition: 1-week; compliance_tier reclassification: 1-week; incident-response role activation: minutes via security team on-call).

9. **`lens_mapping.md` row 105 updated** to append GO3B2-02 alongside GO3B2-01 and to declare BP02 closed. Steps 3–12 of BP02 were triaged 2026-06-01 — all either consumption advice (not_promote), vendor-menu (not_promote), or cross-pillar (defer to GENPERF / GENSEC / GENOPS02 walks); no further authoring needed under BP02.

10. **`agentflow/app/anchor.json` marked completed** with `promoted_to_principle: "GO3B2-02"`. GO3B2-02 closes the staging slot; the next BP walk should overwrite this file with its anchor.

### Why this is the right call

The audit-trail argument is the load-bearing claim. The GO3B2 pair now reads as one cohesive regulator-facing answer: GO3B2-01 says "every emit goes through the SDK that classifies and pre-scrubs"; GO3B2-02 says "every read of what's stored is governed by a central policy keyed on that same classification, and retention follows it automatically." A SOC2 / GDPR / HIPAA auditor walking the trail has two principles to inspect, both under P13, both keyed on `compliance_tier`, both owned by overlapping platform/security teams. Splitting into GENSEC would have required cross-referencing across pillar boundaries, and the regulator-facing failure mode of GO3B2-02 (broken access posture on trace data) is specifically about traces — which is a P13 concern, not a generic IAM concern.

The sibling-pair pattern was already implicit in the SKILL.md's "paired principles" guidance ("A mature catalogue often has paired principles — one operability, one governance — covering the same capability from different angles"). GO3B2-01 (operability — centralisation) + GO3B2-02 (governance — access + retention) is the first explicit pair in the rebuild catalogue under that pattern. The AIGP cross-direction mapping (IV.B primary on -01 + IV.C primary on -02) makes the pair visible from the AIGP-keyed view too.

Imperative-form statement on GO3B2-02 ("Govern read access and retention...") deliberately diverges from GO3B2-01's noun-phrase title ("Centralised Observability SDK for AI Workloads") to honour the statement rubric's parallel_form_with_siblings against the catalogue's broader imperative pattern. GO3B2-01 is now the catalogue's only noun-phrase outlier. Not retro-fixed in this session — that's a low-priority cleanup that does not affect the BP02 close.

### Files changed today (this entry)

- `data/principles.json` — GO3B2-02 inserted between GO3B2-01 and GC1B1-01 (lines 794 onward). 9 principles in the catalogue now.
- `data/ri/GO3B2-02/README.md` — new file. RI matching the GO1B1-01 / GO3B2-01 template, extended with access_policy + retention_policy + iam_managed_by_central schemas and three SLAs.
- `data/lens_mapping.md` — row 105 updated to append GO3B2-02 alongside GO3B2-01 and declare BP02 closed (steps 3–12 not_promoted via 2026-06-01 triage).
- `data/lens_mapping_authored.md` — top entry added: GENOPS03-BP02 step 2 → GO3B2-02 promotion with rubric scoring summary.
- `agentflow/app/anchor.json` — repointed to completed status with promoted_to_principle: GO3B2-02.
- `data/decisions.md` — this entry. `(latest)` marker moved off the prior 2026-06-02 GO3B2-01 entry.

NOT changed:
- `data/principles_authored.json` — downstream of `principles.json`, reconciles on next pass.
- GO3B2-01's noun-phrase title — retro-fix to imperative deferred (low-priority cosmetic).

### Open items added by this entry

- **Validate `data/principles.json` parses cleanly.** Shell sandbox is rejecting the UNC workspace path so the `python3 -c "import json; json.load(open('data/principles.json'))"` parse check could not run from this session. Edit was structural-match against the GO3B2-01 / GC1B1-01 boundary, but worth a parse check from the user's terminal before pushing.
- **AIGP IV.C and IV.B mappings on GO3B2-02 are `unverified`.** Same status as every other AIGP mapping in the catalogue today.
- **`explain_prompt` compiled on GO3B2-02 with `audit_time_discovery` failure shape** — accumulated access-control and retention drift surfacing at a discrete audit / DSAR / incident-reconstruction moment. Distinguished from GO3B2-01's `setup_absence` shape (SDK was never built) — for GO3B2-02 the read-side controls exist per-team but drift silently across team boundaries. (Initial pass deferred this in error; corrected after the user flagged the omission.)
- **Retro-fix GO3B2-01's statement title to imperative form.** Catalogue's only noun-phrase outlier under the statement rubric. Low priority; would require a PATCH bump.
- **Retro-score the 8 prior principles' maturity_level against v2 rubric's `adoption_trigger_portfolio_size` dimension.** Still open from yesterday; not blocked by GO3B2-02.

### Where this session paused

GO3B2-02 authored, merged, RI written, lens_mapping flipped, lens_mapping_authored top entry added, anchor marked complete. GENOPS03-BP02 closed (step 1 → GO3B2-01, step 2 → GO3B2-02, steps 3–12 not_promoted via prior triage). Principle count in catalogue: 8 → 9. The agentflow staging slot is ready for the next BP — candidates from lens_mapping.md include GENOPS03-BP01 (still flagged as "Possibly PRIN_014 or PRIN_017 — verify side-by-side") or stepping into GENOPS04 (lifecycle automation).

---

## 2026-06-02 — Authored GO3B2-01 (Centralised Observability SDK for AI Workloads); first principle under focus area P13 Traceability; first authored with the maturity_level rubric v2 in force

### Context

GENOPS03-BP02 (Enable tracing for agents and RAG workflows) was loaded into the agentflow anchor on 2026-06-02. lens_mapping.md row 105 flagged the BP as either mapping to PRIN_004 (Self-Documenting Data) or warranting an extension principle. Side-by-side review against PRIN_004 ruled out absorption: PRIN_004 is about data lineage / self-description of inputs and outputs, not about centralising the emission path. The architectural mandate behind BP02 is broader — a central SDK that owns the emission contract, header enrichment, backend adapters, PII pre-scrub, and cost attribution. That mandate is structurally the same shape as the catalogue's "Centralised LLM SDK and key vault" hypothetical in the tier rubric calibration corpus, but for observability instead of model access.

The principle was authored interactively in conversation rather than through the agentflow pipeline (the LangGraph composer at `app/` does not yet exist). Each section was hand-applied against its rubric where one existed.

### Decisions

1. **Authored GO3B2-01 — Centralised Observability SDK for AI Workloads.** Merged into `data/principles.json` between GO1B1-05 and GC1B1-01 (correct pillar order: GO* before GC*). Statement is a single noun-phrase title plus a three-sentence policy description mandating the SDK as the only emission path. Five-example problem section drawn from retailer-shape failures (fragmented backends without shared billing, PII bleed into CloudWatch from per-team redactors, recurring cost-attribution misses, broken cross-team trace correlation, schema drift across projects). Solution carries the header / payload split with a central adapter pattern and an escape-hatch `custom_payload` field opaque to central enrichment. Three pre_merge gates: direct-backend-call ban, mandatory header fields, SDK version floor.

2. **Framework mapping anchored against AWS BP02 verbatim step 1** (Collect and aggregate trace data) as the closest published-step match for the emission mandate; mapping_state: verified after web-fetch of the AWS docs page on 2026-06-02. AWS step 2 (Secure trace data) is absorbed into the principle via the central PII pre-scrub and access-controlled backend allow-list but not anchored separately. AIGP primary IV.B (Implement Ongoing Risk Assessments and Monitoring), secondary IV.C (Establish Security, Access Control, and Incident Management) — both unverified pending AIGP source review.

3. **`maturity_level: scaling`** — first principle scored under the maturity_level rubric v2 (see preceding entry). Adoption_trigger_portfolio_size = 3 with the justification "pays off at project #2–3 when fragmented backends, schema drift, and missing cost attribution first appear; thin enforcement shippable by 1–3 engineer platform team." Rejected `mature` after explicit deliberation — labelling a scaling-shaped principle mature reads as permission to defer past the point where retrofit cost dwarfs build cost.

4. **`ownership.tier: enterprise`** via the tier rubric (D1=no with PII / data-residency hedge, D2=3 for SDK across multiple languages + adapters + price table + PII scrub). Same shape as the rubric's "Centralised LLM SDK and key vault" calibration example. `validator: project_architect`, `audit_mode: self_attestation_with_mechanical_evidence`, `arb_role: dashboard_and_spot_check` — D1 did not fire, so no mandated central review gate.

5. **RI README written at `data/ri/GO3B2-01/README.md`** following the GO1B1-01 template (principle_id → tier_outcome → central_team Builds/Operates/Owns paths → project_team Configures/Populates/Consumes via → interface_contract → acceptance_criteria). The interface_contract specifies the SDK emit signature, the canonical event header (split into local-supplied mandatory fields and central-enriched fields), the payload contract with pattern-specific extensions, the allow-list snippet, and a **1-week backend-approval SLA** for new backends the team requests.

6. **`lens_mapping.md` row 105 flipped** from "Possibly **PRIN_004** (Self-Documenting Data) or extension — verify" to "**GO3B2-01** (Centralised Observability SDK for AI Workloads) — authored 2026-06-02 from step 1 anchor; PRIN_004 ruled out (self-documenting data is a different concern)".

7. **`agentflow/app/anchor.json` marked completed** with `promoted_to_principle: "GO3B2-01"` and converted to a brief staging-slot record for the next BP walk.

### Why this is the right call

The mandate's anchor point matters. Anchoring against AWS step 1 (Collect and aggregate trace data) rather than the catalogue's own step 2 framing keeps the framework_mapping verifiable against the actual AWS source. The catalogue's anchor.json contained a re-architected step 2 that does not exist in AWS's published numbering; using it as the framework_mapping anchor would have broken the verification path.

The mature-vs-scaling debate during authoring produced the maturity_level rubric v2 fix in the same session (see preceding entry). The fix paid for itself immediately: GO3B2-01's `scaling` call now has an explicit `adoption_trigger_portfolio_size = 3` justification anchored to the rubric, rather than author intuition. The rubric calibration corpus also picked up its first non-eval-harness mature example (the hypothetical cross-portfolio prompt-drift governance review) and its first FAIL anchor on the scaling-vs-mature boundary.

The header / payload split with a `custom_payload` escape-hatch directly addresses the four-mitigation finding from the cons analysis during authoring: it preserves the central canonical schema's value (cost attribution, PII pre-scrub, trace correlation) while letting projects ship workload-specific shapes without queuing behind central schema changes. Without that field, the principle would have inherited the LCD problem that kills most centralisation efforts.

### Files changed today (this entry)

- `data/principles.json` — GO3B2-01 inserted between GO1B1-05 and GC1B1-01 (lines 688 onward). 8 principles in the catalogue now.
- `data/ri/GO3B2-01/README.md` — new file. RI matching the GO1B1-01 template.
- `data/lens_mapping.md` — row 105 flipped.
- `agentflow/app/anchor.json` — repointed to completed status with promoted_to_principle reference.
- `data/decisions.md` — this entry. `(latest)` marker moved off the earlier 2026-06-02 maturity_level rubric entry.

NOT changed:
- `data/principles_authored.json` — the workshop-three-artefacts authored version is downstream of `principles.json` and will reconcile on the next pass.
- `data/lens_mapping_authored.md` — already carries the step-2 promoted_to_principle entries from the in-flight authoring runs; no flip needed.

### Open items added by this entry

- **Validate `data/principles.json` parses cleanly.** The session's shell sandbox is rejecting the workspace path (UNC paths error), so the standard `python3 -c "import json; json.load(open('data/principles.json'))"` could not run. The edit was structural-match against the existing GO1B1-05 / GC1B1-01 boundary, but worth a quick parse check from the user's terminal before pushing.
- **AIGP IV.B and IV.C mappings on GO3B2-01 are `unverified`.** Side-by-side review against the AIGP competency definitions needed to promote to `verified`. Same as every other AIGP mapping in the catalogue today; consistent gap, not a GO3B2-01-specific issue.
- **`explain_prompt` deferred on GO3B2-01.** Compiled prompt pair can be authored once the principle has lived in the catalogue for a beat. The `principles.json` entry omits the field (allowed by schema since it's optional).
- **Retro-score the 7 existing principles' maturity_level against the v2 rubric's new `adoption_trigger_portfolio_size` dimension.** Carried forward from the preceding entry; not blocked by GO3B2-01.

### Where this session paused

GO3B2-01 authored, merged, RI written, lens mapping flipped, anchor marked complete. Principle count in catalogue: 7 → 8. The agentflow staging slot (`agentflow/app/anchor.json`) is ready for the next BP — natural candidates are GENOPS03-BP01 (prompt template management, still flagged as "Possibly PRIN_014 or PRIN_017 — verify side-by-side" in lens_mapping row 104) or stepping forward into GENOPS04 (lifecycle automation).

---

## 2026-06-02 — `maturity_level` rubric v2: added `adoption_trigger_portfolio_size` dimension to distinguish scaling from mature

### Context

While authoring the centralised observability SDK principle for GENOPS03-BP02, the maturity_level call collapsed: scaling and mature both defensible. The v1 rubric (`data/sections/maturity_level/rubric.json`) had three dimensions — `value_in_enum`, `depends_on_deployment`, `parallel_with_siblings` — none of which actually distinguished scaling from mature. v1 also had no calibration example for `mature` at all; the only anchored examples (GO1B1-01..03 foundational, GO1B1-04 scaling) left the upper boundary unconstrained.

The hidden risk: labelling a scaling-shaped principle as `mature` reads to delivery orgs as permission to defer adoption — which is exactly when the retrofit cost gets locked in (same failure shape as the pre-tier-rubric era's default-to-project, which silently endorsed every team building its own tooling).

### Decisions

1. **Added fourth dimension `adoption_trigger_portfolio_size`** (0-3). Scores against the SKILL.md intent definitions: foundational = project #1 (skipping compounds debt); scaling = 2–5 projects or multiple teams; mature = 5+ projects with formal ARB and dedicated platform team. The justification field MUST name the portfolio threshold ("pays off at project #2 because the SDK header amortises across teams") rather than gesturing at maturity abstractly. Threshold remains "all four ≥ 2."

2. **Added a "DISTINGUISHING SCALING vs MATURE" guidance block** to the `system_addendum`. The practical cut: shippable by a 1–3 engineer platform team with no formal ARB AND pays off at project #2–3 → scaling. Requires a funded platform team PLUS formal governance gate AND pays off only at 5+ projects → mature.

3. **Added four calibration examples** in v2: the centralised observability SDK as PASS=scaling (walking the new dimension), a hypothetical cross-portfolio prompt-drift governance review as PASS=mature (anchoring the previously-empty mature boundary), and two FAIL examples — labelling the observability SDK as mature, and labelling a per-PR lint as scaling — bracketing the mature/scaling line in both directions.

4. **Version bumped v1 → v2; `last_updated` set to 2026-06-02.** The rubric's `history` field records the evolution.

### Why this is the right call

v1's three dimensions all measured surface properties — enum value, deployment dependency, sibling consistency — none of which capture the actual semantic of the foundational/scaling/mature spectrum: portfolio scale at which the principle pays off net-positive. v1 was structurally incapable of catching a scaling-vs-mature misjudgment because no dimension scored it. v2 lifts the missing axis into an explicit rubric input. Same fix shape as the 2026-05-31 tier rubric (D1+D2): when a decision's true driver is implicit, the rubric silently endorses whatever the author guesses. Make the driver a dimension.

### Files changed today (this entry)

- `data/sections/maturity_level/rubric.json` — v1 → v2. New dimension, new guidance block, four added calibration examples (one PASS=scaling, one PASS=mature, two FAIL examples).
- `data/decisions.md` — this entry. `(latest)` marker moved off the prior 2026-05-31 tier-rubric entry.

### Open items added by this entry

- **Retro-score the 7 existing principles against the new dimension.** GO1B1-01..05, GC1B1-01, GC2B2-01 — confirm their current `maturity_level` values still pass under v2. Likely all pass; flag in case any need revision.
- **Note for future principle authoring:** the centralised observability SDK principle (in flight, GO3B2-01 working ID) carries the first explicit v2-scored `maturity_level` — `scaling`, scored 3 on `adoption_trigger_portfolio_size` with the justification recorded in the rubric's third calibration example.

### Where this session paused

Rubric updated. Centralised observability SDK principle for GENOPS03-BP02 is mid-draft — statement, problem, solution agreed; `maturity_level: scaling` and `ownership.tier: enterprise` scored; `gates` section drafted next.

---

## 2026-05-31 — New tier rubric replaces the prior 4-rule qualification screen; `ownership.tier` semantics redefined to centralisation-of-enforcement (not validation); five existing principles reclassified project → enterprise under the new rubric

### Context

Late in the workshop-design session the user pushed back on the current `ownership.tier: project` value on GO1B1-01 (and by extension every catalogue principle). The objection: by tagging GO1B1-01 as project, the catalogue implicitly endorses every project building its own eval runner, diff tool, CI workflow templates, manifest schema validator, scenario-file schema validator — none of which should repeat per project. With 100+ projects in a real enterprise, that's hundreds of person-weeks of duplicated platform engineering.

The structural gap: the prior `ownership_spec.enterprise_qualification_rules` in `taxonomy.json` (4 binary triggers — multi-project blast radius, regulator in scope, specialist function owns underlying control, sign-off authority gap) does not have a clean dimension for **reuse cost**. "Multi-project blast radius" approximates it but is read as "failure spans projects" rather than "build cost duplicates across projects." All 7 existing principles failed all 4 binary triggers under that reading, so all 7 got tier: project — which is the wrong answer for principles whose enforcement infrastructure is genuinely centralisable.

The user's underlying principle, stated directly: "enforcement should be centralized if it requires building and maintaining anything repeatedly for every project — and where it involves legal risks, it must be centralized for sure." Two dimensions, clean decision rule.

### Decisions

1. **New tier rubric authored at `ai_principles_server/agentflow/sections/tier/rubric.json`.** Two dimensions: D1 (legal_exposure, binary veto) and D2 (repeatability_cost, 0-3 scored). Three outcomes: `mandatory_centralise` (D1=yes), `recommended_centralise` (D1=no, D2≥2), `local` (D1=no, D2≤1). Tie-breaker at D2=1 defaults to local — cheaper to centralise later than decentralise a poorly-scoped platform. The rubric file mirrors the existing `agentflow/sections/<section>/rubric.json` convention (version, last_updated, section, purpose, composes_with, system_addendum, output_contract, calibration_examples).

2. **`ownership.tier` semantics redefined.** Tier now reflects **centralisation of enforcement infrastructure**, not validation. `enterprise` means the platform team builds and maintains the libraries, runners, validators, CI workflow templates, lints, dashboards that make the principle hold mechanically. `project` means each project team builds its own. Validation is now an independent axis carried by `ownership.validator` and `ownership.audit_mode` — these can stay `project_architect` / `self_attestation_with_mechanical_evidence` on an enterprise-tier principle when the evidence is mechanical (CI logs, repo URLs, deployed-resource verification).

3. **Tier rubric outputs map to the existing two-value enum.** Both `mandatory_centralise` and `recommended_centralise` → `ownership.tier: enterprise`. `local` → `ownership.tier: project`. The three-outcome rubric versus two-value enum keeps the rubric expressive while the catalogue schema stays simple. If a future need arises to distinguish recommended from mandatory at the schema level, a sub-field can be added without breaking the tier enum.

4. **Tier reassessment matrix for the 7 existing principles applied:**

| Principle | D1 | D2 | Outcome | Tier (was → now) |
|---|---|---|---|---|
| GO1B1-01 | no | 3 (eval runner / diff tool / CI template / manifest validator — weeks) | recommended_centralise | project → **enterprise** |
| GO1B1-02 | no | 3 (strata validator / per-stratum threshold checker / coverage lint) | recommended_centralise | project → **enterprise** |
| GO1B1-03 | no | 2 (metric-encapsulation lint / runner-import contract) | recommended_centralise | project → **enterprise** |
| GO1B1-04 | no (borderline — MRM regs in regulated industries push D1 to yes) | 3 (drift infra / baseline schema / alert routing) | recommended_centralise | project → **enterprise** |
| GO1B1-05 | no | 1 (refresh log schema + small validator) | local | project (no change) |
| GC1B1-01 | no | 1 (ADR template + fill-in lint) | local | project (no change) |
| GC2B2-01 | no | 3 (IaC-vs-config lint with multi-cloud parser / deployed-alarm verification) | recommended_centralise | project → **enterprise** |

Five reclassifications (GO1B1-01, GO1B1-02, GO1B1-03, GO1B1-04, GC2B2-01); two unchanged (GO1B1-05, GC1B1-01).

5. **Validator and audit_mode left unchanged on all reclassified principles.** Each still has `validator: project_architect` and `audit_mode: self_attestation_with_mechanical_evidence`. The enterprise tier here means "platform team owns the runner / lint / template the project uses" — it does NOT mean "ARB clicks evidence URLs at a central gate." That stricter audit profile would only apply if D1 fires (regulator in scope), and none of the 5 reclassified principles trip D1 today.

6. **Prior `enterprise_qualification_rules` in `taxonomy.json` superseded.** The four binary triggers are now subsumed under the rubric (rule 1 'failure spans projects' ≈ D2 high; rule 2 'regulator in scope' = D1 veto; rule 3 'specialist function owns control' folds into D2; rule 4 'authority gap' folds into D1). The taxonomy.json update is pending — a follow-up PR will replace the 4-rule block with a pointer to the new tier rubric file.

### Why this is the right call

The old screen treated "is there a regulator?" and "does failure span projects?" as binary triggers, which collapsed gradients of reuse cost into all-or-nothing. A principle where every project rebuilds a small validator scored the same as one where every project rebuilds nothing — both got "project" because no single trigger fired. The new rubric makes the gradient explicit (D2 scored 0-3) and treats reuse cost as a first-class decision input, not an afterthought.

Decoupling `tier` from `validator` removes a long-standing semantic conflation. Previously `tier: project` was read as "PA self-attests AND the project builds the tooling" — those are two separate decisions. The new rubric only addresses the second; validation lives independently in `validator` + `audit_mode`. This unlocks the natural pattern "platform team builds the tooling, project architect self-attests using it" — common in mature engineering organisations.

The 5 reclassifications correctly surface the platform-team obligations that the prior screen hid. Under the new tier value, an enterprise reading the catalogue sees explicitly: "GO1B1-01 expects central tooling — platform team needs to budget for eval-core / diff / CI template / manifest validator." That's actionable information the prior tier value did not carry.

### Files changed today (this entry)

- `ai_principles_server/agentflow/sections/tier/rubric.json` — new file. Two-dimension tier rubric (D1 legal_exposure, D2 repeatability_cost), three outcomes mapped to two-value tier enum, calibration examples drawn from the 7 existing principles + 2 hypothetical future principles.
- `ai_principles/principles.json` — 5 principles reclassified `ownership.tier: project` → `ownership.tier: enterprise` (GO1B1-01, GO1B1-02, GO1B1-03, GO1B1-04, GC2B2-01). Validator and audit_mode unchanged. Change_history bumps **deferred** — they require a per-principle version increment that depends on each principle's current_version, and bundling the bumps with the upcoming `solution.approach` and `gates[*].check` trim (from the 2026-05-30 decision) plus the taxonomy.json qualification-rule replacement will land cleaner as one cohesive schema-bump PR.
- `ai_principles/decisions.md` — this entry. `(latest)` marker moved off the prior 2026-05-30 reference-implementation entry.

NOT changed (deferred to a follow-up PR for cohesive landing):
- `ai_principles/taxonomy.json` — `ownership_spec.enterprise_qualification_rules` replacement with a pointer to the new tier rubric is pending.
- `ai_principles/principles.json` change_history entries on the 5 reclassified principles — pending.
- `ai_principles/lens_mapping.md` — the GENOPS01-BP01 ledger entries describe each principle as "Project-tier" in their notes; those need updating to reflect the new tier for GO1B1-01..GO1B1-04. A pass over the markdown is pending; the catalogue itself (principles.json) is the source of truth, the markdown ledger is documentation.
- `ai_principles/CLAUDE.md` — adding a pointer to the tier rubric for hand-applied checks is pending the broader CLAUDE.md update batch.

### Open items added by this entry

- **Bump change_history on 5 reclassified principles (MINOR per principle).** GO1B1-01 (1.6.0 → 1.7.0), GO1B1-02, GO1B1-03, GO1B1-04, GC2B2-01. Each entry: tier reassigned project → enterprise under the new D1+D2 rubric; validator and audit_mode unchanged; reasoning per principle quoted from the calibration table in the rubric file.
- **Replace `taxonomy.json` `ownership_spec.enterprise_qualification_rules`** with a pointer to `agentflow/sections/tier/rubric.json`. Bump `format_version` and `applies_to_principles_schema_version` if the rubric counts as a schema-level change (probably MINOR for the catalogue schema).
- **Update `lens_mapping.md`** — the GENOPS01-BP01 ledger notes call out "Project-tier" on GO1B1-01..GO1B1-04. Update to "Enterprise-tier" for the 4 affected.
- **Add tier rubric to CLAUDE.md's hand-applied check list** alongside the statement rubric and step_promotion rubric.
- **Future principles' tier-field authoring goes through this rubric.** When the next principle is authored (e.g. completion of GC2B2-01 was the last; the next walk likely covers further GENCOST or GENSEC BPs), the tier field is no longer a default-to-project — the author runs D1 + D2 first and records the rubric outcome in the principle's change_history initial entry.

### Where this session paused

Tier rubric authored and 5 principles reclassified in the catalogue. The change_history bumps, taxonomy.json qualification-rule replacement, lens_mapping.md tier-note updates, and CLAUDE.md pointer addition are all queued as a cohesive follow-up PR — same batch as the pending solution/gates trim and `reference_implementation_url` schema field addition from the 2026-05-30 decision. Both decisions feed the same next-session PR.

---

## 2026-05-30 — Reference implementation introduced as a sibling artefact at `agentflow/ri/<principle_id>/README.md`; principle `solution` and `gates` to be trimmed of path/CI specifics; new optional schema field `reference_implementation_url` on each principle; GO1B1-01 reference implementation drafted as the first

### Context

Mid-workshop-design conversation. The user pushed back on a leak in GO1B1-01's `solution.approach` ("Commit the test harness to the workload repository at a known path (convention: `eval/`, with `eval/scenarios/` for labelled test cases and `eval/data/` for supporting input data). Wire the harness into the CI pipeline so it runs on every PR that changes agent code or configuration.") and the parallel leak in `gates[*].check` (the existence gate references `eval/scenarios/`, `eval/data/`; the tests-pass gate references `src/agent/`). All four are path-shaped implementation detail living inside fields that should be path-agnostic — a different adopter org might use `tests/eval/`, `harness/`, or any other convention, and the principle should dictate the rule, not the path.

The fix surfaced naturally from the workshop framing already in slide 8 of the deck (*"From Principles to Reference Implementations"*) — the principle is the rule; the reference implementation is the buildable spec. They are two different artefacts with two different owners, two different cadences, and two different audiences. Conflating them inside `principles.json` violates that split.

The reference implementation is platform-team-owned content (paths, scenario file shape, CI workflow YAML, grading mechanism, PII handling rules, adapter contract, bootstrap policy, authorship review process, minimum-acceptance checklist for self-attestation). It lives alongside `principles.json` in the catalogue repository, gets linked from the principle via a new optional field, and is consumed (not forked) by N project teams.

### Decisions

1. **New folder convention: each principle has an optional sibling reference implementation at `agentflow/ri/<principle_id>/README.md`.** The folder may also contain `templates/` (scenario JSON template, strata.yaml template), `ci-workflows/` (sample GitHub Actions / GitLab CI yaml), and `examples/` (industry-tailored worked examples). Single source of truth, platform-team-owned, project-team-consumed. Naming `agentflow/ri/` matches the existing `agentflow/sections/` convention for per-section rubrics; `ri` is short, queryable, unambiguous.

2. **Principle vs reference implementation responsibilities split.** Principle = the rule (terse, prose, path-free, durable). Reference implementation = the buildable spec (paths, schema, CI workflow, grading mechanism, PII handling, adapter contract, bootstrap policy, scenario authorship rules, minimum-acceptance checklist for self-attestation).

3. **`solution.approach` and `gates[*].check` must be trimmed of implementation specifics.** Specifically:
   - Solution loses the path convention (`eval/`, `eval/scenarios/`, `eval/data/`) and the CI-wiring sentence. Stays rule-shaped: *"A versioned, repo-resident, anyone-runnable test harness exists, with each entry capturing input + expected decision + expected evidence trace. Failure of the harness blocks migration to production."*
   - Gates lose path references (`eval/scenarios/`, `eval/data/`, `src/agent/`). Stays structural: *"The harness scenarios directory and supporting data directory (paths defined in the project's eval config) must exist and be non-empty"* / *"PRs that touch agent code must re-run the harness and pass."*
   - "Configured as a required status check on the integration branch (not advisory) via branch protection — advisory CI runs do not satisfy this gate" stays in the gate — that's structural enforcement, not implementation detail. Without it the gate is voided. This is the bit that carries the branch-protection bite now that the path detail is gone.

4. **New optional root-level schema field `reference_implementation_url` on each principle.** Points at the corresponding `agentflow/ri/<principle_id>/` location (relative path or git URL). Optional during the migration window — a principle without a reference implementation is still valid, just less buildable. The catalogue UI's principle page will render a "→ Reference Implementation" link when the field is populated. Schema-bump and `taxonomy.json` update deferred until the first batch of reference implementations is drafted so the migration lands in one cohesive PR rather than incrementally.

5. **GO1B1-01 reference implementation drafted as the first.** Location: `agentflow/ri/GO1B1-01/README.md`. Sections covered: directory layout (`eval/scenarios/`, `eval/data/`, `eval/adapter.py`, `eval/config.yaml`); scenario file JSON schema with worked returns-triage example; adapter contract with required `run_scenario(input_payload: dict) -> dict` signature and in-process vs end-to-end flavours; grading mechanism (decision match including acceptable_alternatives, evidence-trace substring match against must_consult / must_apply_rules / must_not_invoke, hard failures); CI workflow sample (GitHub Actions YAML) with the explicit branch-protection setup instruction calling out "GO1B1-01 v1.1.0 explicitly excludes advisory CI runs"; bootstrap-day-1 policy (start with 5–10 scenarios, expand to 30+ in first month, every customer-reported regression pinned as new scenario before patch ships); PII handling rules for production-derived scenarios; scenario authorship and review process (1 reviewer for adds, 2 for expected_decision modifications); cross-references to GO1B1-02 (stratification), GO1B1-03 (metrics encapsulation), GO1B1-04 (drift), GO1B1-05 (refresh); minimum-acceptance checklist for project-architect self-attestation.

### Why this is the right call

Path conventions and CI workflow specifics evolve at a different cadence than the underlying principle. The harness rule ("must exist, must be repo-resident, must capture input + decision + evidence trace, failure must block migration") is durable — it's been stable across schema versions 1.0.0 through 1.6.0. Whether the harness lives at `eval/`, `tests/eval/`, or `harness/` is taste, varies by org convention, and may change as tooling evolves. Conflating the two inside the principle pollutes the principle's change_history with implementation-taste tweaks and makes the durable rule harder to read.

Splitting also lets the reference implementation evolve at platform-team cadence (faster, more frequent updates as tooling, languages, CI systems, and adapter patterns mature) while the principle stays at architecture-review cadence (slower, more deliberate, ARB-touching). Two different artefacts, two different owners, two different review processes — exactly the federation `ownership_spec` already encodes for project-tier vs enterprise-tier validators.

The split also unblocks workshop pedagogy. The workshop walks five principles via their reference implementations in Block 2; the principle gives 2 minutes of context per case and the reference implementation gives 10–15 minutes of meat. Without the split, every principle's `solution` field would need to be either too thin to teach from or too bloated to read in `principles.json` — neither works. Two artefacts solves both.

The MAJOR-vs-MINOR-vs-PATCH call on GO1B1-01's eventual change_history entry for the trim is PATCH — the principle's rule and enforcement substance are unchanged; only descriptive cruft is being removed.

### Files changed today (this entry)

- `ai_principles_server/agentflow/ri/GO1B1-01/README.md` — new file. First reference implementation drafted (directory layout, scenario file JSON schema with worked example, adapter contract for in-process and end-to-end flavours, grading mechanism, GitHub Actions CI workflow with branch-protection setup, bootstrap policy, PII handling, scenario authorship and review process, cross-references to siblings, minimum-acceptance checklist).
- `ai_principles/decisions.md` — this entry. `(latest)` marker moved off the prior 2026-05-29 schema-v1.9 entry.

**Path correction note.** Initial drafts of the reference implementation were placed at two wrong locations before the correct path was confirmed: first at `ai_principles/reference_implementations/GO1B1-01/README.md` (before the `agentflow/ri/` convention was established), then at `ai_principles/agentflow/ri/GO1B1-01/README.md` (wrong root — `agentflow/` lives in `ai_principles_server/`, not `ai_principles/`). The correct location is `ai_principles_server/agentflow/ri/GO1B1-01/README.md`, alongside the existing `agentflow/sections/` per-section rubrics. Both wrong-location files are orphaned and need manual deletion.

NOT changed: `principles.json` (the trim of GO1B1-01's `solution.approach` and `gates[*].check` is pending — decision recorded here, principle edit not yet executed); `taxonomy.json` (the new optional `reference_implementation_url` field spec and the schema/format version bump are pending the trim); `CLAUDE.md`; `lens_mapping.md`; all other catalogue files.

### Open items

Carried unchanged from the prior 2026-05-29 schema-v1.9 entry — all open items there remain open (including GC2B2-01 authoring completion, AIGP cross-reference verification, future cross-paradigm principle authoring).

Added by this entry:

- **Trim GO1B1-01's `solution.approach` and `gates[*].check` in `principles.json`.** Solution: drop path conventions and CI-wiring sentence; leave the rule. Gates: drop path-specific references; keep the structural "required status check on the integration branch" constraint (without it the gate is voided). PATCH-level change_history entry; rationale: rule and enforcement substance unchanged, only descriptive cruft removed.
- **Add optional root-level field `reference_implementation_url` to the principle schema.** Update `taxonomy.json` `principle_schema.fields` with the new spec (string, optional, points at `agentflow/ri/<principle_id>/` or equivalent URL); bump schema and format versions; set GO1B1-01's value to `"agentflow/ri/GO1B1-01/"` once the field exists.
- **Backlog: draft reference implementations for the other six principles** (GO1B1-02, GO1B1-03, GO1B1-04, GO1B1-05, GC1B1-01, GC2B2-01). Each follows the GO1B1-01 template — directory layout, schema/file shapes specific to that principle's enforcement pattern, CI workflow sample, minimum-acceptance checklist. Workshop's Block 2 walks five of these; the fifth pick can wait.
- **Delete two orphaned drafts:** `ai_principles/reference_implementations/GO1B1-01/README.md` (created before the `agentflow/ri/` folder convention was confirmed) and `ai_principles/agentflow/ri/GO1B1-01/README.md` (wrong root — should be in `ai_principles_server/`, not `ai_principles/`). Both superseded by the correct location at `ai_principles_server/agentflow/ri/GO1B1-01/README.md`.
- **Workshop slide deck update.** Slide 8 ("From Principles to Reference Implementations") now carries operational weight — the reference implementation has a canonical folder convention and the principle gains a pointer field. Worth a sentence on the slide noting the folder path.

### Where this session paused

Reference implementation pattern decided and first artefact (GO1B1-01) drafted at the agreed `ai_principles_server/agentflow/ri/GO1B1-01/README.md` location. The principle's own trim (`solution.approach` and `gates[*].check`) and the schema field addition (`reference_implementation_url`) are the next mechanical steps; both deferred to a later session so the trim, the field addition, and the schema/format-version bump can land as one cohesive PR.

### Additional decision (same session) — workload `manifest.yaml` is the foundational precondition for all gate evaluation

Late in the session a structural gap surfaced: with the catalogue's principles keyed by `applicability` (pattern: agentic / rag / llm_only / ml), the eval runner has no mechanical way to know *which* pattern(s) a given workload repo contains. Without that knowledge it cannot decide which gates to fire on a PR. The example that surfaced it: a RAG project committing code to a monitored branch — the runner shouldn't fire GO1B1-01's gate (agentic-only) on it, but how does the runner know it's RAG?

**Decision:** every AI workload repo must contain a `manifest.yaml` at root. Shape:

```yaml
workloads:
  - name: <workload-name>
    pattern: agentic | rag | llm_only | ml
    code_path: <repo-relative path the workload owns>
    eval_path: <repo-relative path the workload's eval artefacts live at>
  ...
```

The eval runner's first action on any PR is to load and validate this file. Failure (missing, malformed, unknown pattern value, declared paths don't exist) blocks merge immediately — no pattern-specific gate runs. For each declared sub-workload, the runner then looks up the principles where `applicability[pattern] == "mandatory"` and fires those gates against the sub-workload's paths. A cross-cutting PR fires gates for each affected sub-workload independently.

**What the manifest solves:**

1. **Gate routing.** The runner can finally decide which gates apply to which code paths. Without the manifest the routing is undefined.
2. **Mixed-pattern monorepos.** Real-world repos often contain multiple AI components (agent + RAG + ML scorer) in one repo. The manifest's `workloads` list expresses this natively rather than forcing one repo per pattern.
3. **Mis-classification caught at PR time.** Pattern declaration is the first thing checked; a team cannot quietly ship agentic work as "just an LLM" to skip stricter gates.
4. **Portfolio tooling has a stable source of truth.** ARB dashboards, prioritisation tools, the centralisation rubric, the principles UI all need to know "what pattern is this workload." The manifest is canonical.
5. **Pre-condition for project-tier self-attestation.** Every project-tier principle's mechanical evidence depends on the manifest being valid.

**Files changed today (this additional decision):**

- `ai_principles_server/agentflow/ri/GO1B1-01/README.md` — new top-of-document section "FOUNDATIONAL REQUIREMENT — workload manifest" added before "What you're building". Documents the manifest shape, the first CI gate's checks, and how pattern-specific gates use the manifest for routing.
- `ai_principles/paid_workshop.md` — new "Foundational requirement — the workload manifest" section added before the pedagogical thread. Workshop will mention this in Block 1 as the universal floor.
- `ai_principles/decisions.md` — this additional decision.

**Open items added by this decision:**

- **Manifest as its own foundational principle.** This is shaped like a meta-principle (every workload must declare what it is) and probably deserves its own catalogue entry — call it something like `GO0BASE-01` or anchor it under a meta-catalogue pillar. Currently the requirement only lives in GO1B1-01's reference implementation, which is the wrong scope (it's universal, not GO1B1-01-specific).
- **Manifest schema spec.** The `manifest.yaml` schema needs to live somewhere canonical — likely `ai_principles_server/agentflow/manifest_schema.json` or similar. Currently the schema is only described prose-wise in the GO1B1-01 ref impl.
- **Eval-core manifest loader.** The shared `eval-core` library needs to expose the manifest loader and validator as its first executable step. Implementation work for the platform team.
- **Mention in CLAUDE.md.** Worth one line so the manifest's foundational status doesn't get rediscovered every session.

---

## 2026-05-29 — Schema v1.9: required root-level `serving_paradigm` field added across the catalogue; surfaced mid-walkthrough of GENCOST02-BP02 when the candidate GC2B2-01 principle (right-size hosting infrastructure) was discovered to be intrinsically self-hosting-only and `applicability` (keyed by AI pattern: llm/rag/agentic/ml) could not express the narrowing; field shape mirrors `applicability` v1.7 (criticality map); all six pre-existing principles retrofitted with the broad-shape value (mandatory across all four paradigms) since their disciplines are paradigm-agnostic

### Context

The session opened with GENCOST02 walkthrough — two BPs (GENCOST02-BP01 inference-paradigm balance, GENCOST02-BP02 resource-consumption optimisation). BP01 decomposition collapsed (initial draft missed that GC1B1-01 already covers hosting-paradigm choice in its model-selection ADR with `src/` PR-coupling — architecturally_distinct should have been 1, not 3; BP01 closes 0 promoted, all four steps absorbed by GC1B1-01).

BP02 decomposition: steps 1/2/3 not_promoted (decision-process / pre-condition / observation work products); step 4 (`Optimize the hosting infrastructure in accordance with the workload's demands, and select the most cost optimized infrastructure that meets performance requirements`) promoted as GC2B2-01.

Mid-authoring of GC2B2-01 the user pushed back on a documentation-discipline ADR shape ("you're just adding paperwork"). Re-reading the AWS verbatim showed the verbs are `Optimize` and `select` — operative, not declarative. The right principle shape is operational telemetry-as-code (right-sizing baseline + utilization alarms committed to `infra/monitoring/`) rather than an ADR. The principle was reshaped accordingly. Statement locked: "Right-size hosting infrastructure to the workload's demand profile and commit utilization alarms as code." Problem section authored and rubric-ratified.

Then the user surfaced the structural relevance question: the entire BP02 substance — right-sizing instances, scheduling shutdowns, Reserved Instances, quantization/LoRA — applies only to workloads that self-host a foundation model. For pure-API workloads (calling OpenAI, Anthropic, or Bedrock on-demand) there is no infrastructure to right-size. GC2B2-01 is intrinsically self-hosting-only.

The existing `applicability` map is keyed by AI pattern (llm/rag/agentic/ml) and could not express the serving-paradigm narrowing. The two filters are orthogonal: GC2B2-01 applies across llm + rag + agentic (applicability) AND only to self-hosted serving paradigms. The catalogue needed a new schema field.

### Decisions

1. **New required root-level field `serving_paradigm` added on every principle.** Shape: criticality map mirroring `applicability` v1.7 — keys drawn from a new `enums.serving_paradigm`, values drawn from the existing `enums.pattern_criticality`. Omit keys where the principle does not materially apply (absence means "not applicable to this paradigm"; `n/a` is not a value).

2. **Enum granularity: four values.** `api_on_demand` (pure pay-per-token managed inference — OpenAI, Anthropic, Bedrock on-demand, Azure OpenAI on-demand); `api_provisioned` (committed managed capacity — Bedrock Provisioned Throughput, Azure OpenAI PTUs, Vertex AI provisioned); `self_hosted_managed` (your model on managed infrastructure — SageMaker AI endpoints, Vertex AI endpoints, Azure ML managed online endpoints); `self_hosted_unmanaged` (your model on raw infrastructure — EC2 + vLLM, EKS / Slurm / HyperPod clusters, on-prem GPUs). Two-value enum (`api` / `self_hosted`) was considered and rejected because it collapses Bedrock Provisioned Throughput — where commitment sizing IS a right-sizing decision — into a category that loses the distinction. Four values map cleanly to AWS's hosting taxonomy as expressed in BP01's implementation guidance ("managed, serverless" vs "self-hosted"; "provisioned throughput" called out as its own paradigm).

3. **Field name: `serving_paradigm`.** AWS-aligned — the BP01 text uses "model serving paradigm" verbatim. The user's framing was "API or self-hosted"; both names point at the same axis; AWS-traceability tipped to `serving_paradigm` for catalogue consistency with the AWS Lens anchoring.

4. **Orthogonal to `applicability` and `maturity_level`, not a replacement.** `applicability` answers "for THIS AI pattern, how critical is this principle"; `serving_paradigm` answers "for THIS serving model, how critical is this principle"; `maturity_level` answers "at what org-maturity point should this be adopted." Together the three filters let an adopter narrow the catalogue to "mandatory principles for my pattern + my serving paradigm + my maturity tier."

5. **All six pre-existing principles retrofitted with the broad-shape value:** `{ api_on_demand: mandatory, api_provisioned: mandatory, self_hosted_managed: mandatory, self_hosted_unmanaged: mandatory }`. Rationale per principle:
   - GO1B1-01 (harness existence): the harness lives in the workload repository regardless of how the model is served.
   - GO1B1-02 (stratification): strata reflect agent decision-branches / tool-paths / persona segments / policy carve-outs — architectural properties of the workload, not properties of the serving paradigm.
   - GO1B1-03 (metric encapsulation): software-engineering hygiene on the eval code, not a property of the model's hosting layer.
   - GO1B1-04 (drift monitor): drift emerges against the baseline whether the model is API-served (vendor minor releases, prompt-shift effects) or self-hosted (data shift, traffic shift).
   - GO1B1-05 (harness refresh): production input drift surfaces from customer behaviour evolution and upstream data shift independent of the serving paradigm.
   - GC1B1-01 (model-selection ADR): the ADR captures the choice itself — including which serving paradigm — so it must exist regardless of paradigm. (Indeed, the serving-paradigm choice IS one of the prioritized cost dimensions the ADR's cost-aware rationale names.)
   Each principle got a MINOR change_history bump (1.5.2 → 1.6.0 for GO1B1-01; 1.3.2 → 1.4.0 for GO1B1-02; 2.0.2 → 2.1.0 for GO1B1-03; 1.0.2 → 1.1.0 for GO1B1-04; 1.0.0 → 1.1.0 for GO1B1-05 and GC1B1-01).

6. **`taxonomy.json` updated.** `format_version` 1.6 → 1.7; `applies_to_principles_schema_version` 1.8 → 1.9; `last_updated` 2026-05-29; new `meta.notes` entry describing the v1.9 addition; new field spec under `principle_schema.fields` (placed between `applicability` and `maturity_level`); new `enums.serving_paradigm`; new `conventions.choosing_serving_paradigm` block paralleling `conventions.choosing_pattern_criticality`.

7. **`principles.json` updated.** `meta.format_version` 1.8 → 1.9; new `meta.notes` entry; serving_paradigm field added on each of 6 principles between `applicability` and `maturity_level`; each principle's MINOR change_history entry appended.

8. **GC2B2-01 authoring resumes.** Statement locked; problem section ratified. The new principle will carry `serving_paradigm: { self_hosted_managed: "mandatory", self_hosted_unmanaged: "mandatory", api_provisioned: "nice_to_have" }` — omits api_on_demand (no infrastructure to right-size); api_provisioned listed as nice_to_have because commitment sizing IS a right-sizing decision but the provider handles the underlying instance optimisation. The classification will be filled in when the authoring loop reaches the classification fields.

### Why this is the right call

A schema field for the serving paradigm is structurally cleaner than narrowing every paradigm-sensitive principle's statement description ("for self-hosted workloads, …"). Description-level narrowing is unsearchable; an adopter cannot filter the catalogue by "what applies to my API-only workload" — they have to read every principle's prose. A structured filter solves it cleanly.

Four values rather than two is the right call for a worked-example catalogue that anchors to AWS — AWS's own BP01 implementation guidance distinguishes managed/serverless from self-hosted AND calls out provisioned throughput as its own paradigm. Mirroring that taxonomy keeps the catalogue's anchoring consistent.

Retrofitting all six existing principles with the broad-shape value (mandatory across all four paradigms) rather than leaving them silent is the right call because every existing principle's discipline is genuinely paradigm-agnostic; making the value explicit (rather than relying on omission to mean "applies everywhere") avoids a future ambiguity where a reader cannot tell "is this principle silent on serving_paradigm because it applies everywhere, or because nobody filled the field in?".

The MAJOR-vs-MINOR call on each principle's change_history is MINOR because the principle's rule, gates, ownership, and enforcement are unchanged — only a new orthogonal filter is added. A MAJOR bump would be appropriate if the principle's substance changed; here only metadata is added.

### Files changed today (this entry)

- `ai_principles/taxonomy.json` — format_version 1.6 → 1.7; applies_to_principles_schema_version 1.8 → 1.9; new meta.notes entry; new `serving_paradigm` field in principle_schema.fields; new enum; new conventions.choosing_serving_paradigm block.
- `ai_principles/principles.json` — meta.format_version 1.8 → 1.9; new meta.notes entry; serving_paradigm field added on all 6 principles; MINOR change_history entry appended on each.
- `ai_principles/decisions.md` — this entry. `(latest)` marker moved off the prior 2026-05-29 advanced_ai.json entry.

NOT changed: `CLAUDE.md`; `lens_mapping.md` (BP02 ledger update pending GC2B2-01 completion); `governance.json`; `advanced_ai.json`; the `ai_principles_server/agentflow/` section files (no rubric change implied by the schema addition); all other catalogue files. GC2B2-01 itself is not yet in principles.json — pending completion of the field-by-field authoring loop currently mid-flight (statement ratified, problem ratified; solution / gates / classification / framework_mappings / explain_prompt remain).

### Open items

Carried unchanged from the prior 2026-05-29 advanced_ai.json entry — all open items there remain open.

Added by this entry:

- **GC2B2-01 completion.** Statement and problem ratified; solution / gates / classification / framework_mappings / explain_prompt remain. The principle's `serving_paradigm` value will be `{ self_hosted_managed: "mandatory", self_hosted_unmanaged: "mandatory", api_provisioned: "nice_to_have" }` (api_on_demand omitted). After GC2B2-01 commits, `lens_mapping.md` needs the GENCOST02 section converted to step-level ledger format (parallel to GENCOST01-BP01's format) — both BP01 (0 promoted, all 4 absorbed by GC1B1-01) and BP02 (1 promoted, 3 absorbed).
- **AIGP cross-reference for GC2B2-01.** Likely III.B (Govern the AI Model Lifecycle — Design & Build), unverified pending side-by-side review.
- **Future cross-paradigm principle authoring.** When subsequent BPs surface principles with narrower serving_paradigm scopes (e.g. prompt-caching is API-relevant but not as relevant for self-hosted where you control the inference layer directly), the catalogue will start to populate non-uniform values across the enum. The current retrofit's uniform value across all six principles is a coincidence of these six being paradigm-agnostic disciplines — not a precedent that all principles will have the same value.

### Where this session paused

Schema v1.9 landed and the catalogue is at a consistent state — all 6 pre-existing principles carry the new field with explicit values, taxonomy.json and principles.json meta blocks reflect the schema bump. GC2B2-01 authoring resumes from solution / gates / classification per the field-by-field loop.

---

## 2026-05-29 — `advanced_ai.json` companion file created; captures mature-tier concerns deferred from the catalogue scope (currently the gateway-and-cost-attribution substrate ADV_001 and the continuous-re-evaluation discipline ADV_002 that depends on it); schema and convention specified

### Context

Following the GENCOST01-BP01 step 4 deferral (this morning's prior entry), the deferred substance needed a documented home outside the catalogue proper. The concern is real and valuable; it just exceeds the catalogue's current depth of treatment. Stashing it as decisions.md narrative would lose discoverability; leaving it implicit would make it invisible to next-session-me or future readers. Solution: a companion file `advanced_ai.json` analogous to `governance.json` (which captures governance questions surfaced by architecture principles).

### Decisions

1. **`advanced_ai.json` created at the catalogue root.** Lives alongside `principles.json`, `governance.json`, `taxonomy.json`. Holds an `entries` array — each entry follows the schema: `{ entry_id, title, raised_during, concern, failure_mode, why_mature_tier, prerequisites, what_it_requires_to_build, value_when_built, catalogue_cross_reference, status }`. Status enum: `documented_gap` (initial state), `under_review` (being actively evaluated for promotion or closure), `promoted_to_principle` (authored as a catalogue principle, cross-reference points to it), `closed` (evaluated and intentionally not pursued). Convention: ADV_NNN entry IDs.

2. **Purpose: deferred concerns that have real value at mature scale but exceed the catalogue's depth of treatment.** Three reasons an entry lands here rather than in `principles.json`: (a) assumes infrastructure the catalogue does not treat (gateway, registry, ARB dashboard); (b) only materialises once basic catalogue principles are in place across a portfolio; (c) whole-org or cross-workload concern rather than per-workload. Each entry documents what it would take to build, the value it returns, and any cross-references to catalogue or legacy principles.

3. **ADV_001 captured — Centralised LLM gateway with per-workload cost attribution.** The substrate for everything downstream. Solves the single-bill-no-attribution failure at enterprise scale. Cross-references legacy PRIN_003 (Centralized LLM SDK in `principles_old.json`) which covered the security side of the same architectural artefact; ADV_001 captures the cost-attribution side. Prerequisites, build-list, value-when-built all enumerated in the entry.

4. **ADV_002 captured — Continuous re-evaluation of model selection across the portfolio.** The discipline that was deferred from GC1B1-02 earlier today. Explicitly depends on ADV_001 (no per-workload cost telemetry → no cost-driven triggers → no automated review fire). Adopters needing the discipline have the GC1B1-02 small-scale sketch plus ADV_002 as the enterprise operationalisation.

5. **Dependency chains are a first-class feature of the file.** ADV_002's prerequisites list explicitly cites ADV_001 as a hard dependency. As more entries accumulate, the prerequisites chain will be part of why each is mature-tier — each upstream concern has to be solved before downstream concerns become meaningful. This is structural information adopters need to plan their adoption order.

6. **Convention going forward.** When future BP walkthroughs surface deferred concerns (steps that score promote under the step_promotion rubric but are deferred on meta-scope grounds, or principles too enterprise-tier to ship in the catalogue's current depth), capture them as `advanced_ai.json` entries with the standard schema. Keeps the catalogue narrow and the gaps visible.

### Why this is the right call

A worked-example catalogue that defers a real concern silently misleads adopters — they read the catalogue and assume what's not in it doesn't matter. Documenting the gap with build-list-and-value structure tells the adopter (a) the concern is real and the catalogue knows about it, (b) here is roughly what it would take to solve, (c) here is the value when solved, (d) here are the prerequisites in adoption order. That's the documentation discipline that distinguishes a worked example from a comprehensive standard.

The file's structure mirrors `governance.json`'s — small structured file with `meta` block plus `entries` array. Pattern is consistent across the catalogue's companion files.

### Files changed today (this entry)

- `ai_principles/advanced_ai.json` — new file at the catalogue root. Two initial entries (ADV_001 Centralised LLM gateway; ADV_002 Continuous re-evaluation of model selection).
- `ai_principles/decisions.md` — this entry. `(latest)` marker moved off the prior 2026-05-29 step 4 deferral entry.

NOT changed: `principles.json`; `taxonomy.json`; `CLAUDE.md`; `lens_mapping.md`; `governance.json`; all other catalogue files. Note: `taxonomy.json` does not yet declare a convention for `advanced_ai.json`. If the companion-file pattern hardens (file accumulates a third entry and the pattern is clearly load-bearing), worth adding a `conventions.advanced_ai_companion_file` block to taxonomy.json. For now the file is self-documenting via its `meta.description` and `meta.notes`.

### Open items

Carried unchanged from the prior 2026-05-29 step 4 deferral entry — all open items there remain open (orphan agentflow files; GC1B1-01.draft.json cleanup; AIGP sweep; LangGraph plumbing; GENOPS01-BP02 and GENOPS02-BP01 walkthroughs; GOV_001/GOV_002; etc.).

Added by this entry:

- **`taxonomy.json` `conventions.advanced_ai_companion_file` block.** Not yet authored. Worth adding once the file accumulates a third entry. For now the convention is self-evident from the file's own `meta`.
- **Cross-reference from `principles_old.json` PRIN_003 to `advanced_ai.json` ADV_001.** The legacy file's security framing complements the cost-attribution framing in ADV_001 — same architectural artefact, two value axes. A bidirectional cross-reference would help future readers find the related material. Not a blocker; not_promoted from current scope.
- **Promotion path for ADV_NNN entries.** The schema has `status: promoted_to_principle` as a value, but no convention yet for what triggers promotion (a future catalogue revision that grows depth-of-treatment enough to absorb the entry, an adopter contribution, the company's own infrastructure maturity reaching the prerequisites). Worth defining when the first promotion happens.

### Where this session paused

GENCOST01-BP01 closed (1 promoted, 3 non-promotions). `advanced_ai.json` created with 2 entries (ADV_001 gateway, ADV_002 continuous re-evaluation). Catalogue is at its most coherent state of the session: a worked example (GC1B1-01) plus a documented gap pattern (`advanced_ai.json`) that future BP walkthroughs can extend. Next session: next BP at user direction.

---

## 2026-05-29 — GENCOST01-BP01 step 4 (Continuously evaluate model selection) deferred from the catalogue scope; GC1B1-02 not authored; BP01 closes with 1 promoted (GC1B1-01) and 3 non-promotions (steps 1, 2 absorbed; step 4 deferred); deferral is a meta-level catalogue scope choice that overrides the step_promotion rubric (which would have scored step 4 as promote); rationale is enforcement-infrastructure-at-portfolio-scale exceeding the catalogue's current depth of treatment

### Context

After GC1B1-01 (step 3) was authored and merged into principles.json, the only remaining authoring step in GENCOST01-BP01 was step 4 — periodic re-evaluation of the model selection. The candidate principle (GC1B1-02) was decomposed and a draft solution sketch was explored.

Solution exploration surfaced the enforcement architecture the principle would require at portfolio scale to be meaningfully auditable:

- A central LLM gateway (LiteLLM / Helicone / Portkey / Bedrock or in-house) tagging every call with workload_id, model_id, input/output token counts.
- A workload registry holding current ADR, last_review_date, cost_mtd, declared budget ceiling, and named owner per workload.
- Automated trigger rules: cost-exceeded queries on the registry; model-release-feed subscription (Anthropic / OpenAI / Bedrock); cadence-elapsed scans; quality-degradation signal hooks.
- Ticketing routing — each `review_due` workload gets a ticket to its PA with SLA enforcement.
- ARB dashboard surfacing portfolio-wide trigger fire rates, SLA compliance, change-vs-stay ratios.

That is substantial platform-team infrastructure. The principle's small-scale form (a calendar reminder + a review-config.yaml + a review-log.yaml) is trivial to commit, but the gap between trivial-at-small-scale and audit-grade-at-portfolio-scale is where the catalogue would have to take a position. Shipping GC1B1-02 with project-tier ownership (PA self-attests) at the small-scale form would understate the enforcement work an enterprise adopter would actually need; shipping it with enterprise-tier ownership and the gateway+registry+dashboard stack as a precondition would assume infrastructure the catalogue does not currently treat.

Decision: defer step 4 from the catalogue, document the gap honestly.

### Decisions

1. **GENCOST01-BP01 step 4 deferred from the catalogue.** GC1B1-02 is not authored. Step 4 is recorded as not_promoted in lens_mapping.md with the deferral rationale.

2. **Step_promotion rubric mismatch — recorded honestly.** Under the V1 step_promotion rubric (authored earlier today), step 4 scores: `has_enforceable_artefact: 1` (the rubric's not_promote shapes — decision-process advice, absorbed-by-sibling, cross-pillar, vendor-menu — none of them fit because the artefact is commitable, the substance is distinct, and the AWS verbatim is a pure mandate; the rubric would route a not_promote rationale to revise on this dimension), `architecturally_distinct: 3`, `in_bp_scope: 3`, `not_vendor_menu: 3`. Under the all-dims-≥-2 threshold, this not_promote would FAIL and route to the revise node. We are deliberately overriding the rubric with a meta-level scope deferral, per the taxonomy.json convention: *"This catalogue is a worked example, not a comprehensive standard. Adopters are expected to inherit, override, or extend our decomposition decisions for their own context. A step we did not promote to a principle in our catalogue is a documented gap, not a prohibition."* The deferral is a catalogue-scope choice, not a rubric-grounded non-promotion. This is the first time the step_promotion rubric has been overridden on meta-scope grounds; if overrides become common, the rubric should grow an explicit `scope_deferred` outcome or the convention should formalise when override is acceptable.

3. **GENCOST01-BP01 closes with 1 promoted, 3 non-promotions.** Step 1 not_promoted (decision-process advice; absorbed by GC1B1-01 as requirements content). Step 2 not_promoted (intermediate shortlist; absorbed by GC1B1-01 as candidates-evaluated content). Step 3 promoted as GC1B1-01 (v1.0.0, authored earlier today). Step 4 deferred (this decision). The BP is closed.

4. **What an adopter needing continuous re-evaluation discipline can do.** Author their own principle following the GC1B1-02 sketch (cadence + triggers + named owner per cycle + audit-trail log). Or rely on existing operational reviews (quarterly cost reviews, model-risk reviews, platform-team cost governance). The catalogue documents the gap so adopters know it's there and what would be required to close it themselves.

5. **Next session moves to the next BP.** GENCOST01 has one BP (GENCOST01-BP01, now closed). Next focus area target is GENCOST02 (Generative AI pricing model) or a sibling focus area / pillar — user direction at session start.

### Why this is the right call

The catalogue's worked-example stance means deferral on meta-scope grounds is legitimate. A worked example that ships a principle requiring infrastructure the example does not treat is worse than a worked example that documents the gap honestly — the former misleads, the latter informs. Adopters who need the discipline have a roadmap (the GC1B1-02 sketch in this entry + the small-scale form we discussed: review-config.yaml + review-log.yaml + cadence + triggers + named owner) and can take the discipline as far as their platform supports.

The rubric mismatch is the cost of having a structured judge: the judge can't see meta-scope concerns. That's a feature, not a bug — the judge enforces consistency within the catalogue's chosen scope. Overrides need to be rare and documented; this is the first.

### Files changed today (this entry)

- `ai_principles/decisions.md` — this entry. `(latest)` marker moved off the prior 2026-05-29 step_promotion + GC1B1-01 entry.
- `ai_principles/lens_mapping.md` — GENCOST01-BP01 step 4 row flipped from "GC1B1-02 (pending authoring)" to "**not_promoted** — deferred from catalogue scope" with this entry's rationale referenced. Net line updated to reflect 1 promoted, 3 non-promotions.

NOT changed: `principles.json` (no GC1B1-02 to add or remove); `taxonomy.json`; `CLAUDE.md`; `governance.json`; all other catalogue files.

### Open items

Carried from the earlier 2026-05-29 step_promotion + GC1B1-01 entry — all open items from that entry remain open, with these updates:

- **GC1B1-02 authoring** — now CLOSED as deferred (not authored).
- **GENCOST01-BP01 walkthrough** — now CLOSED (1 promoted, 3 non-promotions).

Carried unchanged:

- **AIGP mapping_state sweep** — six unverified cross-references (GO1B1-01/02/03/05 III.A; GC1B1-01 III.B; GO1B1-04 has no AIGP).
- **GO1B1-01 / GO1B1-02 explain_prompt field-tests** — never run.
- **GOV_001 / GOV_002** — unresolved.
- **LangGraph plumbing** — pipeline node code still does not exist.
- **GENOPS01-BP02 walkthrough** — pending.
- **GENOPS02-BP01 walkthrough** — pending.
- **Bash sandbox blocked by WSL UNC mount.**
- **Orphan files at `ai_principles/agentflow/`** — manual cleanup still pending (`rm -rf ~/ai_principles/agentflow`).
- **`GC1B1-01.draft.json`** — manual cleanup still pending.
- **Pipeline's own model-selection decision record** — not authored, optional follow-up.
- **GC1B1-01 enforcement gap** — documentation-discipline only by user direction.
- **`taxonomy.json` `exemplar_principle` legacy reference** — still names "PRIN_001".
- **SKILL.md stale; sustainability pillar omitted; calibration weights deferred; statement.md → statement.py promotion** — unchanged.

Added by this entry:

- **Continuous re-evaluation discipline for model selection is a documented gap in the catalogue.** Captured in this entry and in lens_mapping.md GENCOST01-BP01 step 4 row. Adopters needing the discipline have the GC1B1-02 sketch as a roadmap.
- **Step_promotion rubric override semantics need consideration.** First override on meta-scope grounds; if overrides become common (e.g., subsequent BP walkthroughs surface similar scope-deferral calls), the rubric should grow an explicit `scope_deferred` outcome OR the convention should formalise when meta-override is acceptable. For now it's a single instance documented here.

### Where this session paused

GENCOST01-BP01 closed: 1 promoted (GC1B1-01 v1.0.0), 3 non-promotions (steps 1, 2 absorbed; step 4 deferred). Next session moves to a new BP — likely GENCOST02 or a sibling pillar at user direction.

---

## 2026-05-29 — step_promotion rubric authored at the canonical agentflow path (binary upstream-decision rubric, distinct from the per-field rubrics); GENCOST01-BP01 walkthrough yielded GC1B1-01 authored end-to-end and merged into principles.json (first principle in the GENCOST pillar, model-selection decision record); steps 1/2 absorbed, step 4 → GC1B1-02 pending; CLAUDE.md, taxonomy.json (1.5 → 1.6), and lens_mapping.md updated to declare the new convention and record the decomposition; mid-session wrong-directory confusion produced 24 orphan files at `ai_principles/agentflow/` that touched no canonical work and need manual cleanup

### Context

Session walked GENCOST01-BP01 end-to-end. First BP decomposed under the new step_promotion rubric. First principle authored in the catalogue's GENCOST pillar (GC1B1-01) — catalogue was 5 GO1B1 entries, now 6 with the first cross-pillar addition.

Mid-session there was a real-but-cheap directory confusion: a UNC-path glob false-negative led me to misdiagnose the canonical agentflow tree at `ai_principles_server/agentflow/` as missing on disk. I wrote 24 files into the wrong directory (`ai_principles/agentflow/`). The canonical agentflow at `ai_principles_server/agentflow/` was never overwritten or touched — the 24 files I wrote at the wrong path are orphan duplicates at a path the catalogue does not use; they conflict with nothing. After the user surfaced the directory separation, the actually-correct step_promotion triad was authored at the canonical location in the canonical style. The orphan files remain on disk pending manual cleanup (UNC-path delete tools all rejected programmatic removal).

The mistake cost time but no content. No prior-session work was lost.

### Decisions

1. **step_promotion rubric authored as the upstream-decision rubric.** Files at canonical path: `ai_principles_server/agentflow/sections/step_promotion/{generate,rubric,revise}.json`, written in canonical style (`version: "v1"`, `last_updated: "2026-05-29"`, `composes_with: "system_prompts/<op>.json"` — matching the existing convention used by the sibling section rubrics). Four dimensions: `has_enforceable_artefact` (the step concretises to a named artefact + a CI gate or evidence check), `architecturally_distinct` (substance is unique within the BP and not redundant with a sibling principle), `in_bp_scope` (substance belongs to this BP/pillar rather than elsewhere in the catalogue), `not_vendor_menu` (generic mandate rather than a list of vendor service options). All-dims-≥-2 threshold. **Binary outcome — promote or not_promote, no `merge` category.** If a not_promoted step's content is still architecturally relevant, the sibling principle that absorbs it carries the substance in its own statement / solution / gates content; that is a sibling-authoring choice, not a third structural outcome of the decomposition pass. Calibration corpus drawn from existing precedent: GO1B1-01 step 1 (promote, 3/3/3/3); GENOPS01-BP01 step 3 (not_promote — absorbed, 3/3/2/3); GENOPS02-BP01 step 7 (not_promote — cross-pillar, 2/2/3/1 → fail, revise required); GENCOST01-BP01 step 1 (not_promote — decision-process advice, 3/3/3/3); plus a hypothetical bad-promote counter-example (1/2/2/3 → fail).

2. **Architectural placement of the new rubric.** Sits ABOVE the per-field authoring rubrics in the pipeline — decides whether a principle exists at all, before any per-field authoring node fires. Distinct slot from `conventions.per_field_authoring_rubrics`. Co-located under `agentflow/sections/step_promotion/` for file-layout uniformity, though conceptually it is NOT a section of a principle but an upstream pipeline decision; if the agentflow tree is ever restructured (e.g. an `agentflow/pipeline_nodes/` peer to `agentflow/sections/`), step_promotion is the natural first inhabitant.

3. **GENCOST01-BP01 decomposition.** Four AWS implementation steps walked using the new step_promotion rubric (hand-applied):
   - Step 1 (Identify minimum performance requirements) → **not_promote**. Pure decision-process advice. The requirements end up as content INSIDE step 3's selection ADR.
   - Step 2 (Determine models meeting the bar) → **not_promote**. Intermediate shortlist absorbed by step 3's ADR.
   - Step 3 (Select the most cost-efficient model) → **promote** as GC1B1-01.
   - Step 4 (Continuously evaluate model selection) → **promote** as GC1B1-02 (pending authoring).
   Net: 2 promoted, 2 absorbed. First complete GENCOST BP decomposition.

4. **GC1B1-01 authored end-to-end and merged into principles.json.** First principle in the catalogue's GENCOST pillar. All 10 LLM-authored sections ratified against their V1 canonical rubrics (at `ai_principles_server/agentflow/sections/<section>/rubric.json`) with all dimensions ≥ 2 on first pass:
   - **statement** (5/5 dims): "Maintain a versioned model-selection decision record in the workload repository declaring requirements, candidate models, chosen model, and cost-aware rationale."
   - **problem** (6/6 dims): setup-absence failure shape — the choice lives in tribal knowledge; an exposure event (finance / audit / architect-leaving / cheaper-model-arriving) forces the gap into view; no reconstruction possible.
   - **solution** (6/6 dims): versioned decision record at `model-selection/decision.md` (or equivalent ADR location); two pre-merge CI gates (existence + content-completeness; model-change PR coupling).
   - **gates** (6/6 dims): two pre_merge gates with full branch-protection language.
   - Classification: focus_area P41 (Model Selection & Right-sizing); impact_level Medium (matches AWS BP rating; principled outlier from the GO1B1 family's High because cost-optimization failures recover via re-selection rather than producing customer regressions); applicability `{ llm/rag/agentic: mandatory, ml: nice_to_have }` (broad shape, parallels GO1B1-03); maturity_level foundational.
   - framework_mappings: AWS verified for GENCOST01-BP01 step 3 with verbatim_text; AIGP III.B (Govern the AI Model Lifecycle — Design & Build) unverified.
   - ownership: project tier. evidence: empty (CI is the proof). change_history: v1.0.0 initial.
   - explain_prompt compiled against setup_absence scaffold (same failure family as GO1B1-01).

5. **GC1B1-01 enforcement scope: documentation only — acknowledged.** The two gates enforce that the record exists with four content elements and that any model-change PR touches the record. They do NOT enforce that the code's actual model configuration matches what the record claims. A `chosen_model` lint that compares code vs record would close that gap and turn the principle from documentation-discipline into code-record-consistency enforcement. User direction: leave as documentation-discipline for now; revisit if a sibling principle or v1.1.0 strengthen is wanted later.

6. **GC1B1-02 walkthrough deferred.** Decomposition decided (cadence + triggers + named owner + audit-trail log; same refresh-discipline shape as GO1B1-05 vs GO1B1-01). Principle not yet authored. Same authoring loop pending.

7. **CLAUDE.md updated.** Appended a working rule alongside the existing statement-rubric rule: when manually deciding promote vs not_promote on an AWS implementation step during a BP walkthrough, run the call through `agentflow/sections/step_promotion/rubric.json` first. Binary outcome; hand-applied until the LangGraph pipeline is wired.

8. **taxonomy.json updated.** Document `format_version` bumped 1.5 → 1.6; `last_updated` to 2026-05-29; new `meta.notes` entry describing the v1.6 convention addition; new `conventions.step_promotion_rubric` block declaring the upstream-decision rubric as a sibling to `per_field_authoring_rubrics`. `applies_to_principles_schema_version` unchanged at 1.8 (convention addition, not a per-principle schema change).

9. **lens_mapping.md GENCOST section converted to step-level ledger format.** GENCOST01 focus area title + AWS question text verified 2026-05-29; GENCOST01-BP01 step table with the 4-step decomposition (steps 1/2 not_promoted with rationale; step 3 → GC1B1-01 v1.0.0 promoted; step 4 → GC1B1-02 pending). First complete GENCOST BP decomposition recorded.

10. **Mid-session wrong-directory confusion — recorded honestly.** During step_promotion authoring prep, my initial `agentflow/**` glob returned no results (UNC-path recursion failure). The follow-up recursive glob on `\\…\ai_principles\**\*` also failed to surface the agentflow tree. I misdiagnosed the agentflow as missing and bootstrapped 24 files into `ai_principles/agentflow/`. The user then surfaced that the canonical agentflow lives at `ai_principles_server/agentflow/` — a separate mounted folder. The 24 files I wrote are **orphan duplicates at a path the catalogue does not use; they touched no canonical work and conflict with nothing.** The canonical agentflow at `ai_principles_server/agentflow/` was verified intact: README.md + pipeline.md + system_prompts/×3 + 10 LLM-authored section dirs × 3 files = 35 files, plus the 3 step_promotion files I subsequently added at the canonical location. The orphan files remain on disk pending manual cleanup (`rm -rf ~/ai_principles/agentflow` from a WSL terminal; UNC-path delete tools all rejected programmatic removal).

### Why this happened (re: wrong-directory confusion)

The UNC-path glob false-negative was the proximate cause. The deeper failure was trusting a single negative tool result over the structural evidence — the prior session's journal entry explicitly described the agentflow tree as fully populated, and live cross-references in CLAUDE.md and taxonomy.json pointed at the same paths. When tooling and journal disagree, verify with multiple tools / paths before bootstrapping. The bootstrap was also too aggressive — even granting the misdiagnosis, the right minimum was the step_promotion triad alone (the actual ask), not 24 files across 8 directories.

One small upside: the mount system kept the two roots cleanly separated (`ai_principles/` and `ai_principles_server/` are distinct mounts). The misdirected writes went into the wrong directory but did not shadow the real one. No content was lost.

### Files changed today (this entry)

- `ai_principles_server/agentflow/sections/step_promotion/generate.json` — NEW (canonical style).
- `ai_principles_server/agentflow/sections/step_promotion/rubric.json` — NEW (canonical style).
- `ai_principles_server/agentflow/sections/step_promotion/revise.json` — NEW (canonical style).
- `ai_principles/principles.json` — GC1B1-01 appended after GO1B1-05. 6th principle in the catalogue; first in the GENCOST pillar.
- `ai_principles/CLAUDE.md` — appended step_promotion hand-apply working rule alongside the existing statement-rubric rule.
- `ai_principles/taxonomy.json` — `format_version` 1.5 → 1.6; `last_updated` 2026-05-29; new `meta.notes` entry for v1.6; new `conventions.step_promotion_rubric` block.
- `ai_principles/lens_mapping.md` — GENCOST01-BP01 section converted to step-level ledger format reflecting the 4-step decomposition.
- `ai_principles/decisions.md` — this entry (replaces an earlier version of the same (latest) entry that contained a fictional "21 files overwritten" narrative; corrected once the wrong-directory confusion was understood).
- `ai_principles/GC1B1-01.draft.json` — standalone draft file created during authoring as a scratchpad; redundant now that the principle is in principles.json; pending deletion.

Orphan (touched no canonical work; pending manual cleanup):

- `ai_principles/agentflow/` — 24 useless duplicate files at the wrong path. Glob can see them; programmatic delete blocked by UNC-path tooling. Manual delete: `rm -rf ~/ai_principles/agentflow` from a WSL terminal.

NOT touched: `ai_principles_server/agentflow/` outside of the new step_promotion directory; `principles_old.json`; `governance.json`; `classstrategy.md`; `slides.md`; `reusable.json`; `taxonomy.md`; `ai-architecture-principles/SKILL.md`.

### Open items

Carried from prior entries and still open:

- **GC1B1-02 authoring** — closes GENCOST01-BP01. Decomposition decided; authoring pending.
- **AIGP mapping_state sweep** — six unverified cross-references now (GO1B1-01/02/03/05 on III.A; GC1B1-01 on III.B; GO1B1-04 has no AIGP). Worth one review session against AIGP docs to promote.
- **GO1B1-01 / GO1B1-02 explain_prompt field-tests** — never run.
- **GOV_001 (drift threshold) / GOV_002 (scenario-label authorship)** — unresolved.
- **LangGraph plumbing** — pipeline node code, edge logic, state schema, bounded-loop counters still don't exist.
- **GENOPS01-BP02 walkthrough** — skipped this session in favour of jumping to GENCOST01. Pending.
- **GENOPS02-BP01 walkthrough** — flagged in earlier session prompt as a candidate; user pivoted to GENCOST01. Pending.
- **Bash sandbox blocked by WSL UNC mount.** Catalogue verification still falls back to Read + Glob.
- **Formal meta-prompt for explain_prompt compilation.** Unchanged.
- **Periodic baseline refresh for the rubrics themselves.** Unchanged.
- **`taxonomy.json` `exemplar_principle` legacy reference** — still names "PRIN_001"; historical narrative, left as-is.
- **SKILL.md stale; sustainability pillar omitted; calibration weights deferred; statement.md → statement.py promotion** — all unchanged.

Added by this entry:

- **GC1B1-01 enforcement gap** — principle is documentation-discipline only; doesn't catch code-record drift. A `chosen_model` lint plus a machine-readable chosen-model field would close the gap. Left open by user direction.
- **Orphan files at `ai_principles/agentflow/`** — 24 duplicates pending manual deletion. UNC-path delete tools blocked.
- **`GC1B1-01.draft.json`** at the catalogue root — pending deletion (redundant now that the principle is in principles.json).
- **Pipeline's own model-selection decision record** — applying GC1B1-01 to the agentflow pipeline itself. We discussed and confirmed the principle would catch the pipeline's current "Opus 4.7 everywhere" config as an undocumented selection (the same setup_absence shape the principle's problem section describes). Not authored. Optional follow-up.

### Where this session paused

GC1B1-01 merged into principles.json. step_promotion rubric at canonical path. CLAUDE.md, taxonomy.json, lens_mapping.md, decisions.md all updated. GC1B1-02 is next session's primary work; admin cleanup (delete orphans at `ai_principles/agentflow/`, delete `GC1B1-01.draft.json`) is small follow-up.

---

## 2026-05-29 — Maven lightning deck Part 3 authored end-to-end; "playbook" landed as implementation-layer terminology; paid workshop agenda settled at 4 items with marketing personalization as spine; no governance in paid workshop; marketing personalization domain gap surfaced with Path 2 fix planned; future 5-day deeper build course parked; industry-tailored failure-example skill scoped; GOV_002 captured

### Context

Whole-session focus was the Maven lightning deck (`Why Enterprise AI Agents Fail Beyond The Demo`, free 1-hour Zoom session on 22 Jun 2026, landing page https://maven.com/p/f029e1/why-enterprise-ai-agents-fail-beyond-the-demo) and its product-funnel decisions. Picked up from the 2026-05-27 classstrategy.md entry 0 (landing-page agenda, four learning outcomes) and entry 1 (architecture/implementation layering tension parked). The previous catalogue session had closed the GENOPS01-BP01 walkthrough with GO1B1-05 and the six new section rubrics under the new `agentflow/sections/` structure; no catalogue authoring took place on 2026-05-29. Files touched were all deck-side and product-side: classstrategy.md, governance.json, decisions.md.

The session covered: framing decisions for Parts 2 and 3 of the deck; the implementation-layer terminology choice; the architecture-vs-governance pivot worked example on Part 3; the agenda for the paid workshop slide; product-strategy questions about a deeper future course and a Cowork skill packaging; and the marketing personalization domain gap between the lightning's worked example (returns triage throughout) and the paid course's case study (marketing personalization).

### Decisions

1. **"Playbook" landed as the implementation-layer noun.** Closes the in-session wavering between "control" / "reference implementation" / "rule" / "rail" / "recipe" / "concretisation". The layering is now: AWS best practice → principle (the invariant / rule) → playbook (one concrete way for a team to enforce the principle — artefact + path + check). "Control" had two problems: collision with the landing page's "specific, enforceable production controls" framing (which uses control for the architectural side, not the governance side); and compliance-heavy connotation that doesn't fit a senior-architect audience. "Playbook" is operational, doesn't make senior architects feel audited, and matches how mature engineering orgs already talk about their enforcement layer. Convention recorded in classstrategy.md entry 2. No schema change: the rule still lives in `statement`, the playbook still lives in `solution.approach` + `gates`; this is deck-side framing only.

2. **Part 3 architecture/governance pivot landed in the deck.** The deck's Part 3 transition slide ("Governance — The Control Element") and pivot slide ("The playbook shipped. The agent still failed. Architecture closed. Control still open.") frame the second failure axis: the playbook artefact can be present, correct, and CI-enforced and the workload can still fail because nobody agreed who gets to change the artefact. The worked example is anchored to GO1B1-01 — who adds scenarios to `eval/scenarios/`, who edits expected_decision labels, how the change reaches production. Slide 17's two-column question/elaboration table carries the body. Governance is named as the second axis, not solved.

3. **Paid workshop agenda settled at 4 items.** The lightning's course-CTA slide lists: (a) anatomy of an enforceable principle — taxonomy + contract walked through one marketing personalization principle end-to-end; (b) five principles, five case studies — the load-bearing principles for a marketing personalization agent in production, each worked with a failure scenario; (c) a framework to pick yours — applicability + maturity_level applied to the attendee's workload; (d) author your first principle — hands-on slot against the statement rubric, with the attendee bringing their own BP, and the industry-tailored failure-example skill as the take-home asset. Ordering is concrete-first (workload → principles → framework → your turn) deliberately, not schema-first. Convention recorded in classstrategy.md entry 4.

4. **No governance in the paid workshop.** Narrow scope, deeper teaching. The course teaches the architecture half deeply; governance is named in the lightning as a second axis but is out-of-scope for the paid product. Lightning's CTA framing must not pitch the course as covering both. Governance treated as a future product, a sibling consulting engagement, or out-of-scope.

5. **Marketing personalization domain gap surfaced.** The entire completed lightning deck (slides 4, 9, 10, 11, 14, 15 in the 17-slide Datawhistl PDF) uses returns triage as the worked example. The paid course case study is marketing personalization. The funnel has a domain gap — attendees who watched the lightning have no personalization context when they buy the course. Three paths considered (full rationale in classstrategy.md entry 3). User chose Path 2: swap the Part 3 slide 17 table's worked example from returns-triage scenario-label governance to a marketing personalization governance scenario, plus a one-line bridge sentence at the top of the course CTA agenda. Returns triage carries Parts 1 and 2; personalization carries Part 3 and the CTA bridge. Pending implementation in the next deck pass.

6. **Future 5-day deeper build course parked as a separate product.** Idea: attendees actually build their own catalogue + the agentflow LangGraph pipeline, walk away with the artefacts. Stronger product than the marketing-personalization course in some ways (real take-home artefact, not just learning) but premature for current commitments. The agentflow LangGraph layer (node code, edge logic, state schema, bounded-loop counters) does not yet exist — only the prompt definitions under `agentflow/sections/` and `agentflow/system_prompts/` are in place. Only one BP has been walked through (GENOPS01-BP01, now complete with five promoted principles). No proof the pipeline scales to a second BP or a different pillar. Not in scope for the current deck or near-term course offering. Revisit after the LangGraph layer ships AND GENOPS01-BP02 (or a non-GENOPS BP) validates the pipeline.

7. **Industry-tailored failure-example skill scoped as workshop take-home.** A Cowork skill that takes industry + implementation_type as input, pulls the relevant principle's compiled `explain_prompt`, calls an LLM, returns JSON `{use_case_background, issue_detail}`. Essentially packages the runtime UI's Problem-tab Explain affordance as a Cowork-callable surface. The hard work (per-principle prompt compilation with failure-shape calibration) is already done by hand for GO1B1-01/02/03/04/05. Risk surface is small (illustrative output, not normative). Coverage gated by `explain_prompt` availability — all five current catalogue principles have one. Becomes item 4's take-home asset on the workshop agenda. Build deferred until after the lightning ships; not on the critical path. Important constraint: the skill must orchestrate per-principle prompts, NOT run one universal prompt with the principle as input — the universal-prompt route is the v1.x explain_prompt mistake that schema v1.8 was created to prevent (see the v1.8 entry from 2026-05-26).

8. **GOV_002 captured.** Slide 17's Part 3 worked example surfaced a real governance question on GO1B1-01 with the same shape as GOV_001's on GO1B1-04. The architecture mandates `eval/scenarios/` exists with structured entries (input + expected_decision + expected evidence trace); the architecture is silent on who can author or edit the `expected_decision` field — and the label IS the policy. Same architecture-says-nothing-about-who-can-change-the-policy-value pattern as the threshold-change question on the drift config. Captured as governance.json GOV_002. Status: open. Suggests the architecture-vs-governance gap is a structural property of every principle whose artefact contains a policy-laden field, not a one-off — worth a future scan of GO1B1-02 (per-stratum thresholds), GO1B1-03 (metric definitions encode evaluation philosophy), and GO1B1-05 (refresh cadence and per-cycle ownership) for sibling governance entries.

### Why these are the right calls

The "playbook" decision closes the in-session wavering that ate at least fifteen minutes of the session. Once "playbook" landed, every subsequent framing slotted in cleanly: the "From Principles to Playbook" section divider, the four-move enforcement-layer slide (after correction from three moves), the playbook-shipped pivot. The word does the work the catalogue needed a word to do — naming the implementation layer without confusing it with the principle's invariant or the governance's process.

The paid workshop's no-governance call is correct given the funnel intent. The marketing-personalization case study is a narrow, deep teaching surface; bolting governance onto it would either bloat the course or dilute it. Governance stays as a future thing — possibly a separate course, possibly a consulting engagement, possibly a sibling deliverable that complements the architecture-only product.

The 4-item workshop agenda earns its shape by ordering. Concrete-first (workload → principles → framework → your turn) honours how working architects engage with new material — they want to see it work on a recognisable workload, then learn the structure underneath. Schema-first ordering would have been technically equivalent and dramatically less compelling.

Path 2 on the marketing personalization gap is the minimum viable fix. Path 1 (CTA bridge only) leaves the case study domain absent from every actual slide. Path 3 (retool the lightning) rewrites work that lands well. Path 2 threads personalization into the lightning at the highest-leverage point — the Part 3 governance pivot — without disturbing Parts 1 and 2 where returns triage carries the narrative well.

The 5-day deeper course is parked correctly. Teaching a pipeline whose LangGraph layer isn't built would break the catalogue's own discipline ("don't ship without a structured judge"). Build first, validate on a second BP, then teach. The product idea is genuinely strong; the timing isn't.

The industry-tailored failure-example skill is the highest-leverage skill packaging the catalogue currently has. The IP is already compiled at authoring time (per-principle prompts); the runtime is small; the audience use case is sharp (attendees see their own industry's failure scenarios). Coverage is full across the current catalogue (all five principles have compiled explain_prompts).

### Files changed today (this entry)

- `decisions.md` — this entry. "(latest)" marker moved off the prior 2026-05-27 GO1B1-05 entry.
- `classstrategy.md` — three new entries appended: entry 2 ("playbook" terminology landed); entry 3 (marketing personalization domain gap and the Path 2 fix); entry 4 (paid workshop 4-item agenda, marketing personalization as spine, no governance, future 5-day course parked, industry-tailored skill as take-home asset).
- `governance.json` — GOV_002 appended (scenario-label authorship governance question on GO1B1-01, sibling shape to GOV_001's threshold-change question on GO1B1-04).

No catalogue files touched (`taxonomy.json`, `principles.json`, `lens_mapping.md`, `agentflow/sections/`, `agentflow/system_prompts/` all unchanged).

### Open items

Carried from prior entries and still open:

- **GENOPS01-BP02 walkthrough.** GENOPS01-BP01 is now complete (five principles: GO1B1-01/02/03/04/05; steps 3 and 5 not_promoted). GENOPS01-BP02 (Collect and monitor user feedback) is the next BP in the focus area. Walkthrough pending — likely 2-4 promoted principles.
- **LangGraph plumbing.** All 30 section files plus 3 system_prompts files exist as prompt definitions. The LangGraph node code, edge logic, state schema, and bounded-loop counters do not. Design captured in `agentflow/pipeline.md`. Required for the deeper 5-day build course and for the industry-tailored skill at scale.
- **Formal meta-prompt** for compiling explain_prompts remains hand-compiled.
- **AIGP mapping_state.** Five `unverified` cross-references across GO1B1-01 / 02 / 03 / 05 (all III.A) and the GO1B1-04 absence. Worth a single review session against AIGP III.A and III.B documentation to promote in one sweep.
- **GO1B1-01 / GO1B1-02 explain_prompt field-tests** not yet run.
- **GOV_001 unresolved.** Threshold-change governance question on GO1B1-04.
- **Bash sandbox blocked by WSL UNC mount.** Catalogue verification still falls back to Read + Grep.
- **Periodic baseline refresh for the rubrics themselves.** The rubrics + calibration_examples are agentflow's ground-truth harness. V1 rubrics calibrated on 5 principles will need refresh as the catalogue grows — same discipline GO1B1-05 mandates for workloads. Mechanism TBD once the LangGraph layer exists.
- **`taxonomy.json` `exemplar_principle` reference.** Still names "PRIN_001"; left as historical narrative but worth a follow-up scan for any remaining stale legacy references in live convention prose.
- **SKILL.md stale; sustainability pillar omission; calibration weights deferred; statement.md → statement.py promotion (JSON form is the interim before Python wrapping)** — all unchanged.

Added by this entry:

- **Part 3 marketing personalization swap.** Slide 17 table's worked example to be re-anchored from returns-triage scenario-label governance to a marketing personalization governance scenario. Pending next deck pass.
- **Course CTA bridge.** The course CTA slide needs explicit language bridging the lightning's returns-triage worked example to the personalization case study the course teaches. Pending next deck pass.
- **Datawhistl deck duplicate-slide cleanup.** Slides 12 and 13 in the completed 17-slide PDF are the three-move and four-move versions of the enforcement-layer slide; only the four-move version should ship.
- **GOV_002 unresolved.** Scenario-label authorship governance question on GO1B1-01. Status: open.
- **Backlog scan for sibling governance questions.** GO1B1-02 (per-stratum thresholds), GO1B1-03 (metric definitions), and GO1B1-05 (refresh cadence and per-cycle ownership) likely carry the same architecture-says-nothing-about-who-owns-the-value shape as GOV_001/002. Worth a deliberate scan once the deck pass closes.
- **Industry-tailored failure-example skill build.** Deferred until after lightning ships. Coverage is full across all five current principles.
- **Future 5-day deeper build course design.** Parked until the LangGraph layer ships and a second BP walkthrough proves the pipeline.

### Where this session paused

The Maven lightning deck is complete through Part 3 in the Datawhistl-versioned 17-slide PDF. Pending deck work: the marketing personalization swap on Slide 17, the course CTA bridge sentence, and the duplicate-slide cleanup.

The user signalled the next session moves OFF the deck and back ONTO the catalogue — explicitly into "other pillars and focus areas," meaning out of GENOPS01 / P11. Likely entry points, in order of context shift:

- **A sibling focus area in P1 (Operational Excellence).** P12 (Operational Health & Monitoring), P13 (Traceability), P14 (Lifecycle Automation), P15 (Model Customization). All `aws_alignment_status: verified`; safe to anchor against without a Lens-name verification pass.
- **A new pillar.** P2 Security, P3 Reliability, P4 Performance, P5 Cost. All focus area names (except P24 Prompt Security) carry `aws_alignment_status: needs_verification` — these need a Lens check before anchoring. Add a focus-area verification step to the prompt for any non-GENOPS pillar.
- **Continuing GENOPS01-BP02 in P11.** Lower context shift but contradicts the user's stated intent to broaden. Mention as an option but lead with the broader moves.

### Session-kickoff prompt template

The template the user will paste at the top of the next chat to restore session context. Captured here so next-session-me can find it without scrolling chat history:

```
Working on the principles catalogue at `\\wsl.localhost\ubuntu-24.04\home\dheeraj\ai_principles\`. Read these files first to pick up state: `CLAUDE.md`, `taxonomy.json`, `principles.json`, `lens_mapping.md`, `decisions.md`, `governance.json`, `classstrategy.md`. The catalogue currently holds GO1B1-01/02/03/04/05 — all anchored to GENOPS01-BP01 (now complete: steps 1/2/4/6/7 promoted, steps 3/5 not_promoted). The agentflow prompt layer under `agentflow/sections/<section>/{generate,rubric,revise}.json` + `agentflow/system_prompts/{generate,rubric,revise}.json` is fully populated for all ten LLM-authored sections; the LangGraph node code does not yet exist. Last session (2026-05-29) was deck-side, not catalogue-side; see the latest decisions.md entry for product-strategy context.

This session I want to walk through [BP code, e.g. GENOPS02-BP01 — Monitor all application layers, or GENSEC04-BP01 — something from a new pillar]. Fetch the live AWS Lens page first if needed. Then:

1. Propose which implementation steps to promote, merge, or not_promote — with rationale per step, recorded as a lens_mapping.md candidate update.
2. Wait for my sign-off on the decomposition before authoring any principle.
3. For each promoted step, author the principle against the schema in taxonomy.json. Hand-apply the rubrics under `agentflow/sections/<section>/rubric.json` on each LLM-authored section before committing to principles.json.

If the BP is in a non-GENOPS pillar (P2 Security / P3 Reliability / P4 Performance / P5 Cost): verify the focus-area name against the current AWS Lens before anchoring — most focus areas in those pillars carry `aws_alignment_status: needs_verification` in taxonomy.json. Update that field to `verified` (with last_checked date in taxonomy meta) if the verification passes.
```

---

## 2026-05-27 — GO1B1-05 authored end-to-end under the new `sections/` + `system_prompts/` structure; six new section rubrics authored alongside (the remaining nine deferred from the morning's migration entry); GENOPS01-BP01 walkthrough now complete

### Context

The morning's rubric structure migration (see the entry below) landed `sections/statement/` and the shared `system_prompts/` layer but deferred the nine other field rubrics, in keeping with the catalogue's stated stance of building each rubric as its authoring node is wired. Authoring GO1B1-05 (GENOPS01-BP01 step 7, refresh the ground truth dataset) required exercising every section's authoring path, which surfaced the remaining nine rubrics — six were authored today, three left genuinely deferred (the deterministic sections — principle_id, pillar, ownership, evidence, change_history — never get the triad because there is no judgment to evaluate).

GO1B1-05 closes the GENOPS01-BP01 walkthrough: steps 1, 2, 4, 6, 7 are now promoted to principles; steps 3 and 5 remain documented as not_promoted in lens_mapping.md. Five principles concretising one AWS BP — the catalogue's first complete BP-level worked example.

### Decisions

1. **GO1B1-05 authored end-to-end in the new structure.** Every LLM-authored section (statement, problem, solution, gates, focus_area, impact_level, applicability, maturity_level, framework_mappings, explain_prompt) was drafted in conversation, self-scored against the V1 rubric for that section, and locked before commit to principles.json. This is the first principle to use the new sections/ + system_prompts/ structure from the start rather than being retrofitted.

2. **Six new section rubrics authored.** sections/focus_area/, sections/impact_level/, sections/applicability/, sections/maturity_level/, sections/framework_mappings/, sections/explain_prompt/ — each with the generate / rubric / revise triad. Calibration corpus for each: GO1B1-01 / 02 / 03 / 04 sibling content. The catalogue now has 30 section files (10 LLM-authored sections × 3 files) plus 3 shared system_prompts/, matching the pipeline.md spec exactly.

3. **GO1B1-05's content choices — the architectural reasoning:**
   - **Statement** picked imperative 'Refresh' over AWS's 'Update' because refresh signals the cyclical discipline of keeping fresh against drift; update could mean any single edit. Passed all five statement rubric dimensions.
   - **Problem** uses cumulative-drift framing in the environment-shift sub-shape: harness static, production evolving around it. Examples include an explicit cross-reference to GO1B1-04 (drift monitor firing without refresh response) to sharpen the scope distinction.
   - **Solution** introduces `eval/refresh/config.yaml` (cadence + triggers + named owner per cycle) and `eval/refresh/log.yaml` (audit trail of refresh events). Two gates: existence + cadence enforcement, and drift-alert coupling.
   - **applicability** kept narrow at `{ 'agentic': 'mandatory' }` — paired with GO1B1-01's narrow scope, since refresh of a non-existent broader-pattern harness is meaningless. Sibling principles for RAG / LLM / ML will broaden together when those harness principles are authored.
   - **maturity_level** = foundational. Cadence declaration is day-1 even though the log is empty until the first refresh; skipping creates compounding debt. Different from GO1B1-04 (scaling) because drift needs a deployed baseline to fire against; refresh just needs a declared cadence.
   - **framework_mappings** verified for AWS step 7 with verbatim_text; AIGP III.A unverified — same anchor as GO1B1-01 / GO1B1-02.
   - **explain_prompt** uses the cumulative_drift / environment-shift scaffold (same family as GO1B1-04). Identity line, APPLICABILITY paragraph, JSON output contract, style invariants, discriminating-failure-mode discipline all present.

4. **GENOPS01-BP01 walkthrough complete.** Step 7 was the last `pending_review` row in the lens_mapping.md GENOPS01-BP01 table. All seven AWS implementation steps now have a status: 1 → GO1B1-01, 2 → GO1B1-02, 3 → not_promoted, 4 → GO1B1-03, 5 → not_promoted, 6 → GO1B1-04, 7 → GO1B1-05. Five principles per the step-level anchoring methodology — a worked example of the catalogue's first complete BP decomposition.

### Why this is the right call

Authoring GO1B1-05 end-to-end under the new structure validated the structure itself. The 30-file shape held up — each section's three files (generate / rubric / revise) gave a clear authoring path; the layered system_prompts/ composed cleanly with section addenda; the rubric self-scoring caught form issues at draft time (the initial 'workload-agnostic' applicability framing was caught by the parallel-with-siblings dimension before commit). The structure is now load-tested across all 10 LLM-authored sections, not just statement.

Authoring the six new rubrics alongside the principle rather than upfront stayed faithful to the catalogue's stated preference (accumulate dimensions as failures surface, don't be exhaustive upfront, avoid the universal-prompt mistake the catalogue learned from explain_prompt). Each new rubric was calibrated against the four existing sibling principles — real corpus, not invented examples. The six rubrics now cover every LLM-authored field; the deterministic fields stay deterministic.

Completing the GENOPS01-BP01 walkthrough gives the catalogue its first complete BP worked example. Five principles concretising one AWS BP, all in the same agent-decisioning family, with clear scope distinctions between them. This is the asset the deck / course can point to: not 'we have one principle', but 'here is how one AWS BP becomes a family of five enforceable contracts, each catching a distinct failure mode that simpler controls miss'.

### Files changed today (this entry)

- **Created** six new section rubric directories under `agentflow/sections/`: `focus_area/`, `impact_level/`, `applicability/`, `maturity_level/`, `framework_mappings/`, `explain_prompt/`. Each contains generate.json, rubric.json, revise.json. Calibration_examples in each rubric.json reference GO1B1-01 / 02 / 03 / 04 content.
- **Updated** `principles.json` — GO1B1-05 appended after GO1B1-04. Full content: classification, ownership, statement, problem (description + 4 examples), solution (approach + 5 key_benefits), 2 gates with branch-protection language, evidence blank, change_history v1.0.0, explain_prompt compiled for v1.0.0 against the cumulative_drift / environment-shift sub-shape.
- **Updated** `lens_mapping.md` — GENOPS01-BP01 table step 7 row flipped from `pending_review` to `promoted_to_principle: GO1B1-05 (v1.0.0)`. Closing comment notes the BP walkthrough is now complete: 1/2/4/6/7 promoted, 3/5 not_promoted.
- **decisions.md** — this entry. `(latest)` marker moved off the morning's rubric-migration entry.

### Open items

Carried from earlier 2026-05-27 entries and still open:

- **LangGraph plumbing.** All 30 section files + 3 system_prompts files now exist as prompt definitions. The LangGraph node code, edge logic, state schema, and bounded-loop counters still don't exist. Design captured in `agentflow/pipeline.md`. Building the LangGraph layer is the next agentflow milestone.
- **Formal meta-prompt** for compiling explain_prompts remains hand-compiled.
- **AIGP mapping_state** for GO1B1-01 / 02 / 03 / 05 all `unverified`; GO1B1-04 has no AIGP yet. Five `unverified` references await a side-by-side review against the AIGP III.A and III.B competency definitions.
- **GO1B1-01 / GO1B1-02 explain_prompt field-tests** not yet run. With GO1B1-05's prompt now in the catalogue, the field-test corpus grows.
- **GOV_001 unresolved.** Threshold-change governance question still open.
- **Bash sandbox blocked by WSL UNC mount.** Catalogue verification still falls back to Read + Grep.
- **SKILL.md stale; Datawhistl deck PRIN_007 mis-attribution (in progress — Part 2 rewrite mid-flight, deck now reflects up to current state via session work); sustainability pillar omission; calibration weights deferred; statement.md → statement.py promotion (JSON form is the interim before Python wrapping)** — all unchanged.

Added by this entry:

- **GENOPS01-BP02 walkthrough.** GENOPS01-BP01 is now complete. GENOPS01-BP02 (Collect and monitor user feedback) is the next BP in the focus area. Walkthrough pending — likely 2-4 promoted principles.
- **Periodic baseline refresh for the rubrics themselves.** The user surfaced the recursive observation during this session: the rubrics + calibration_examples ARE agentflow's ground-truth harness. As the catalogue grows, the V1 rubrics calibrated on 4 (now 5) principles will need refresh — same discipline GO1B1-05 mandates for workloads. Mechanism TBD; worth a follow-up entry once the LangGraph layer exists and we can measure rubric pass rates against the growing corpus.
- **Five `unverified` AIGP cross-references** are now a sweep-worthy chunk of work. Worth a single review session against AIGP III.A and III.B documentation to promote all five at once.

---

## 2026-05-27 — Rubric structure migrated from `agentflow/rubrics/statement.md` to the new `sections/` + `system_prompts/` layout; full path chosen over minimal; statement section migrated end-to-end; remaining nine field rubrics still deferred

### Context

The per-field authoring rubrics framework was introduced earlier today (see the rubric-framework entry below). The V1 statement rubric was first authored at `agentflow/rubrics/statement.md` — markdown, single file, the simplest possible initial home. Later in the day the better long-run structure was sketched: per-section `generate / rubric / revise` triads under `agentflow/sections/<section>/`, plus shared principle-level system fragments under `agentflow/system_prompts/{generate,rubric,revise}.json`. The structure makes explicit that authoring a field requires three operations (generate, judge, revise), not just judgment; and that the shared catalogue identity / vendor-neutrality / output-contract base belongs in one shared layer composed at runtime with each section-specific addendum, not duplicated 30+ times across section files.

That migration was carried as an open item until the conversation about authoring the next principle (GO1B1-05, GENOPS01-BP01 step 7 — refresh the ground-truth dataset) surfaced the next field rubric. Building `agentflow/sections/problem/{generate,rubric,revise}.json` in the new structure while leaving `statement` at the old markdown path would have produced a half-migrated state that's worse than either pole — every future reference would have to remember which section was where. Decision: migrate statement now, before authoring problem.

### Decisions

1. **Full migration over minimal.** Two paths were on the table: minimal (rebadge `statement.md` to `sections/statement/rubric.json`, defer everything else) or full (author all three section files + all three system_prompts files, update references, deprecate old folder). Full chosen. Rationale: the new structure isn't actually useful without the shared `system_prompts/` layer — generate and revise prompts need a shared identity / output-contract base to avoid 30+ duplications when the other nine sections come online. Minimal would have parked the same migration work under a different name.

2. **Three files per LLM-authored section.** `generate.json` (authoring prompt), `rubric.json` (judge prompt + dimensions + scoring scale + threshold + calibration), `revise.json` (failed-rubric revision prompt). Each file has its own `system_addendum`, `user_template`, and `output_contract`. Per `taxonomy.json` conventions.per_field_authoring_rubrics, there are ten LLM-authored fields and five deterministic ones — so the catalogue's full agentflow layer ends up with thirty section files plus three shared `system_prompts/` files (33 total when complete). Today only `sections/statement/` is authored; the remaining nine sections are deferred — each will be built when its LangGraph node comes online.

3. **Layered prompt composition.** Each section file declares `composes_with: system_prompts/<op>.json`. The runtime joins `system_prompts/<op>.system_base` with `sections/<section>/<op>.system_addendum` to form the full system prompt. The user_template lives at the section level (carries the dynamic placeholders — AWS step verbatim, sibling principles, candidate draft, rubric scores). Shared identity / catalogue context / output-contract base lives once at the principle level. This is the convention every future section file follows.

4. **Bounded revise loop.** The implied LangGraph node shape per section: `generate → rubric → (pass: hand off to next section's node | fail: revise → rubric → bounded loop → pass or hard fail)`. Loop bound is configured at the LangGraph layer, not in the prompt files — but the `revise.json` system prompt is explicit that each pass must move the score, not re-shuffle wording.

5. **Old `agentflow/rubrics/` folder deprecated then deleted.** The original `statement.md` and `README.md` were overwritten with deprecation pointers naming the new location, then the folder was deleted by the user once the live references in `taxonomy.json` and `ai_principles/CLAUDE.md` had been swept. No remaining live reference points at the old path.

### Why this is the right call

Half-migrated structures rot. Picking the full path now (six new files plus four reference updates) is more work upfront than the minimal path, but it locks the structure before the second section gets authored. The alternative — author `sections/problem/` while leaving `statement` at the old markdown path — would have created two competing conventions in the codebase, every cross-reference would have had to remember which side it was on, and the migration would have to be revisited the next time a section was added. Worse, the LangGraph implementation would have to handle both shapes.

The three-file-per-section triad is what's actually needed to author a field — generate / judge / revise — not just rubric. Naming it that way at the structure level (rather than leaving generate and revise as one-off scripts somewhere) ensures every section gets the same authoring discipline. The shared `system_prompts/` layer is what stops 33 future files from each carrying their own copy of "you are authoring for the AI Architecture Principles catalogue, vendor-neutral, AWS-anchored…".

The decision to defer the other nine sections (problem, solution, gates, explain_prompt, focus_area, impact_level, applicability, maturity_level, framework_mappings) is consistent with the catalogue's prior stance: accumulate dimensions as failures surface, don't be exhaustive upfront. Each section's V1 rubric should be authored against the four sibling principles already in the catalogue as calibration corpus — not invented from imagination. Authoring nine rubrics today would repeat the universal-prompt mistake the catalogue learned from `explain_prompt`.

### Files changed today (this entry)

- **Created** `agentflow/system_prompts/generate.json` — shared identity, catalogue context, vendor-neutral / AWS-anchored stance, base output-contract format. Composed with every section's `generate.json` at runtime.
- **Created** `agentflow/system_prompts/rubric.json` — shared judge posture, 0–3 scoring scale, all-dims-≥-2 threshold rule, base output-contract format for rubric judgments.
- **Created** `agentflow/system_prompts/revise.json` — shared revision posture, what-to-preserve-vs-change rules, loop discipline, base output-contract format.
- **Created** `agentflow/sections/statement/generate.json` — section-specific authoring guidance for `statement`, dimension reminders, common failure modes to avoid, user_template with placeholders for AWS step verbatim + sibling statements + principle metadata, output contract `{ title, description }`.
- **Created** `agentflow/sections/statement/rubric.json` — the V1 statement rubric in JSON form: five dimensions with per-tier descriptors (is_prescriptive, derives_from_aws_verbatim, names_artefact_and_enforcement, scope_match, parallel_form_with_siblings), judge prompt user_template, output contract per-dimension `{ score, justification }`, eight calibration examples drawn from the catalogue's PRIN_001 → GO1B1-04 history.
- **Created** `agentflow/sections/statement/revise.json` — section-specific revision guidance covering each of the five dimensions individually (what failed, how to fix), what to preserve from the failing draft, user_template carrying the failing draft plus the per-dimension scores and justifications, output contract identical to generate (drop-in replacement).
- **Deprecated then deleted** `agentflow/rubrics/statement.md` — overwritten with a pointer to `sections/statement/`; folder removed by user.
- **Deprecated then deleted** `agentflow/rubrics/README.md` — overwritten with a pointer to `sections/` and `system_prompts/`; folder removed by user.
- **Updated** `taxonomy.json` `conventions.per_field_authoring_rubrics` — references now point at `agentflow/sections/<section>/` and `agentflow/system_prompts/` instead of the old `agentflow/rubrics/` path. Notes the migration and that the original `statement.md` was migrated to `sections/statement/rubric.json` the same day.
- **Updated** `ai_principles/CLAUDE.md` — the hand-applied rubric rule now points at `agentflow/sections/statement/rubric.json` and refers to the LangGraph pipeline being wired (rather than the older "agentflow pipeline being built" framing).
- **decisions.md** — this entry. `(latest)` marker moved off the earlier rename entry.

### Open items

Carried from earlier 2026-05-27 entries and still open:

- **GENOPS01-BP01 step 7 walkthrough.** GO1B1-05's statement section is locked in this conversation (not yet committed to principles.json — per user preference, principles.json is updated only when all sections of a principle are complete). Remaining sections to author: problem, solution, gates, evidence, change_history, applicability, maturity_level, impact_level, framework_mappings, explain_prompt.
- **Nine remaining section rubrics.** `problem`, `solution`, `gates`, `explain_prompt`, `focus_area`, `impact_level`, `applicability`, `maturity_level`, `framework_mappings` — each needs `agentflow/sections/<section>/{generate,rubric,revise}.json` authored when the section comes into flight. Catalogue stance: build each as its LangGraph node is wired, calibrate against the existing sibling principles' content.
- **LangGraph plumbing.** The agentflow nodes themselves don't exist yet — the JSON files written today are prompt definitions that a LangGraph implementation will load. Building the LangGraph layer (node code, edge logic, state schema, bounded-loop counters) is the next agentflow milestone.
- **Formal meta-prompt** for compiling `explain_prompt`s remains hand-compiled.
- **AIGP mapping_state** for GO1B1-01 / GO1B1-02 / GO1B1-03 still `unverified`; GO1B1-04 has no AIGP yet.
- **GO1B1-01 / GO1B1-02 explain_prompt field-tests** not yet run.
- **GOV_001 unresolved.** Threshold-change governance question still open.
- **Bash sandbox blocked by WSL UNC mount.** Catalogue verification still falls back to Read + Grep.
- **SKILL.md stale; Datawhistl deck PRIN_007 mis-attribution (in progress — Part 2 rewrite mid-flight); sustainability pillar omission; calibration weights; statement.md → statement.py promotion (the JSON form authored today is the interim before Python wrapping)** — all unchanged.

Added by this entry:

- **The triad's calibration loop.** The V1 statement rubric was calibrated on four sibling principles (GO1B1-01..04). The same discipline applies to every future section rubric — author against the four-sibling corpus as calibration, not from imagination. Worth re-asserting when each new section's rubric.json is being drafted.
- **Section file consistency check.** Every new section directory must include all three files (generate, rubric, revise). A section with only rubric.json would silently bypass the generate / revise discipline. Worth scripting a check once a few more sections land.
- **LangGraph runtime design lives in `agentflow/pipeline.md`.** Created later in the same session as a running design doc for the LangGraph node shape, state schema, edge logic, prompt composition at runtime, full per-principle pipeline ordering, and open questions (loop bound, sibling section inputs, deterministic-section node shape, re-authoring entry point, hard-fail handling, cross-section validation). The prompt JSON files under `sections/` and `system_prompts/` are the *content* the pipeline loads; pipeline.md is the *runtime architecture* that loads them. Changes to the pipeline design happen in that file; decisions.md tracks the fact that pipeline.md is the live home but does not duplicate its contents.

---

## 2026-05-27 — Principle IDs renamed from `PRIN_NNN` to BP-anchored, sequential format `GO1B1-NN`; taxonomy doc format 1.4 → 1.5; live cross-references updated; historical references left under legacy IDs

### Context

Surfaced during the conversation about how to author the next principle (the upcoming step 7 — Regularly update the ground truth dataset). The question: "our principles are like PRIN_001 and so on, but there is nothing in it to say that they all belong to the same AWS best practice — how can we reflect that?" The data was always there — every principle's `framework_mappings.aws.references[0].best_practice` field carries the BP code — but recovering the BP-shaped view required reading every principle. The grouping wasn't visible at a glance.

Three options were considered: status quo with tooling (BP view stays in `lens_mapping.md`); a denormalised top-level handle field on the principle; or a hierarchical ID convention with the BP code baked into the ID itself. The user chose the third — most invasive, but the change is mechanical and the benefit (BP grouping visible in every reference, every diff, every audit trail line item) is permanent. Within the third option, two suffix schemes were initially weighed: step-mirroring (suffix mirrors AWS implementation step number, with gaps at not_promoted steps) or sequential counter (-01, -02, -03, -04 by order of promotion within the BP). Step-mirroring was the initial choice and the rename was executed against it, then reversed in the same session when the user pushed back on the gaps: "our principles must be consecutive". The catalogue committed to sequential.

### Decisions

1. **New `principle_id` format: `<bp_code>-NN`.** The `bp_code` is a 5-character compression of the AWS pillar / question / BP triple: two letters for the pillar (GO = GenOps, GS = GenSec, GR = GenRel, GP = GenPerf, GC = GenCost), one digit for the question number, the letter B as a marker, one digit for the BP number. Examples: GO1B1 = GENOPS01-BP01; GS4B2 = GENSEC04-BP02; GC5B1 = GENCOST05-BP01. The `NN` suffix is a two-digit sequential counter — the Nth principle promoted from that BP, in promotion order. IDs within a BP are consecutive (01, 02, 03, …) with no gaps regardless of which AWS implementation steps were not_promoted. The AWS step a principle concretises is recorded in `framework_mappings.aws.references[0].implementation_step.number`, not encoded in the suffix. Scales cleanly across the current AWS Lens — all five pillars have unique 2-letter codes, questions cap at single digits (GENOPS max Q5, GENSEC max Q6, GENCOST max Q5), and BPs per question top out around 4. Edge case: a Q10+ would push `bp_code` to 6 characters; unlikely in current Lens but documented.

2. **The four existing principles renamed sequentially.** PRIN_001 → GO1B1-01 (first promoted from GENOPS01-BP01; anchors AWS step 1, Create a ground truth dataset). PRIN_002 → GO1B1-02 (second; anchors step 2, Apply stratified sampling techniques). PRIN_003 → GO1B1-03 (third; anchors step 4, Define custom metrics — note the suffix is 03 not 04 because the catalogue uses sequential counting; the fact that step 3 was not_promoted does not create a gap in IDs). PRIN_004 → GO1B1-04 (fourth; anchors step 6, Monitor for performance drifts — same reason, no gap from the step 5 non-promotion). Each principle received a PATCH bump on `change_history.current_version` (1.5.1 → 1.5.2; 1.3.1 → 1.3.2; 2.0.1 → 2.0.2; 1.0.1 → 1.0.2). Each principle's `explain_prompt.system` identity line and APPLICABILITY paragraph were updated to quote the new ID; `explain_prompt.compiled_for_principle_version` bumped to mirror.

3. **Scope: live IDs only.** Append-only history (decisions.md prose, prior change_history summaries, prior decisions journal entries) was deliberately left under the legacy `PRIN_NNN` references. Rewriting those would have lost historical truth — an entry written when the ID was PRIN_001 documents what happened with that ID in force. Live cross-references that point at the principle today were updated: `lens_mapping.md` step-level table for GENOPS01-BP01; `governance.json` GOV_001 `related_principle` and `context`; `classstrategy.md` entry 1 (the architecture/implementation layering point now cites GO1B1-04 as worked example); `agentflow/rubrics/statement.md` calibration examples table and dimension descriptions; `agentflow/rubrics/README.md` motivation paragraph and the analogue cross-reference to GO1B1-03. The new entry block in each principle's change_history records the rename PATCH using the new ID, naming the old one for traceability.

4. **Taxonomy convention + format bump.** `taxonomy.json` document `format_version` 1.4 → 1.5 with a meta.notes entry summarising the change. `principle_schema.fields[].principle_id.format` updated from `"PRIN_NNN"` to `"<bp_code>-NN"`; description rewritten to specify the convention. New `conventions.principle_id_format` block added detailing the bp_code construction, the NN suffix semantics, the edge case for Q10+ pillars, and the scope-of-rename rule. `applies_to_principles_schema_version` stays at 1.8 — the principle_id field's type and required-ness are unchanged, only its documented format. `principles.json` `meta.format_version` stays at 1.8 for the same reason, with a meta.notes entry recording the rename.

5. **Lens_mapping versions refreshed in passing.** The GENOPS01-BP01 step table carried stale version numbers from before yesterday's retitle pass (PRIN_001 v1.5.0 instead of the actual v1.5.1; PRIN_002 v1.3.0 instead of v1.3.1; PRIN_003 v2.0.0 instead of v2.0.1). With the rename also bumping each to .x.2, the table was refreshed to current versions in the same edit rather than introducing a known-stale state. Step 6 was also flipped from `pending_review` to `promoted_to_principle: GO1B1-04` — that update had been on the carried-forward open-items list from earlier today.

### Why this is the right call

The grouping data was always present in `framework_mappings.aws.references[0].best_practice`, but invisible without a deliberate query. The denormalised-handle option (option 2 from the in-session discussion) would have added a field that duplicates data already in framework_mappings; the ID-replacement option puts the grouping where it is read most often — every reference, every git-blame line, every audit trail item. The cost is a one-time mechanical rename; the benefit accumulates with every reference made going forward.

Sequential counting beats step-mirroring on catalogue feel: consecutive IDs (01, 02, 03, 04) make a BP's principle set look ordered and contiguous, with no surprise gaps that demand explanation ("why is there no GO1B1-03?"). The AWS implementation step a principle concretises is already preserved in `framework_mappings.aws.references[0].implementation_step.number` — encoding it in the suffix would duplicate data that's already authoritative elsewhere. The trade-off is that the suffix carries no semantics about which AWS step is concretised; a reader recovering that mapping must look at the principle's framework_mappings. Acceptable cost — the principle ID is a stable identifier first and a documentation cue second.

Leaving append-only history under the legacy IDs is non-negotiable. A journal entry that says "PRIN_001 was authored against step 1" is documentation of what happened with the ID in force at that moment; rewriting it to "GO1B1-01 was authored against step 1" silently claims the ID was always GO1B1-01, which is false. The cost of a small inconsistency (legacy IDs in history, new IDs in live references) is much lower than the cost of false history.

### Files changed today (this entry)

- `taxonomy.json` — `format_version` 1.4 → 1.5; `last_updated` to 2026-05-27; new meta.notes entry for the v1.5 ID-format convention; `principle_schema.fields[].principle_id` format + description rewritten; new `conventions.principle_id_format` block added.
- `principles.json` — `meta.notes` entry appended documenting the rename. GO1B1-01 / GO1B1-02 / GO1B1-03 / GO1B1-04 (formerly PRIN_001 / PRIN_002 / PRIN_003 / PRIN_004) renamed: `principle_id` value updated; PATCH change_history entry appended on each; `change_history.current_version` bumped to .x.2; `explain_prompt.system` identity line and APPLICABILITY paragraph rewritten to quote the new ID; `explain_prompt.compiled_for_principle_version` bumped to mirror.
- `lens_mapping.md` — GENOPS01-BP01 step table rows 1, 2, 4 updated with new IDs and current versions (GO1B1-01 v1.5.2; GO1B1-02 v1.3.2; GO1B1-03 v2.0.2); step 5 row now references GO1B1-01 in its rationale (was PRIN_001); step 6 flipped from pending_review to promoted (GO1B1-04 v1.0.2); step 7 row now references GO1B1-01 in its rationale.
- `governance.json` — GOV_001 `related_principle` updated to GO1B1-04; `raised_during` and `context` references updated.
- `classstrategy.md` — entry 1's worked-example references updated from PRIN_004 to GO1B1-04.
- `agentflow/rubrics/statement.md` — "Why this rubric exists" paragraph rewritten with new IDs; two `is_prescriptive` / `scope_match` dimension example bullets updated; calibration examples table refreshed with new IDs and current versions.
- `agentflow/rubrics/README.md` — "Why this directory exists" paragraph rewritten with new IDs; "Related" cross-reference to GO1B1-03 (formerly PRIN_003) updated.
- `decisions.md` — this entry. "(latest)" marker moved off the earlier 2026-05-27 classstrategy entry.

### Open items

Carried from earlier 2026-05-27 entries and still open:

- **GENOPS01-BP01 walkthrough.** Step 7 (Regularly update the ground truth dataset) pending walkthrough — likely standalone. Will be GO1B1-05 under the sequential convention.
- **Formal meta-prompt.** Per-principle explain_prompts still hand-compiled.
- **AIGP mapping_state.** GO1B1-01 / GO1B1-02 / GO1B1-03 cross-references still `unverified`; GO1B1-04 has no AIGP yet.
- **PRIN_001 / PRIN_002 explain_prompt field-tests** (now GO1B1-01 / GO1B1-02) not yet run.
- **Nine deferred field rubrics.** `problem`, `solution`, `gates`, `explain_prompt`, `focus_area`, `impact_level`, `applicability`, `maturity_level`, `framework_mappings`.
- **Rubric structure migration.** From `agentflow/rubrics/statement.md` to `agentflow/sections/statement/{generate,rubric,revise}.json` + `agentflow/system_prompts/{generate,rubric,revise}.json`. Minimal vs full path still pending user choice.
- **GOV_001 unresolved.** Threshold-change governance question still open.
- **Bash sandbox blocked by WSL UNC mount.** Catalogue verification still falls back to Read + Grep.
- **SKILL.md stale; Datawhistl deck PRIN_007 mis-attribution; sustainability pillar omission; calibration weights; statement.md → statement.py promotion** — all unchanged.

Added by this entry:

- **`taxonomy.json` `exemplar_principle` reference.** Still names "PRIN_001" — but that line is historical context about the v1.5 rebuild and the planned re-anchoring; arguably append-only-style narrative. Left under legacy ID for now. Worth a follow-up scan for any remaining stale legacy references in live convention prose.
- **Future GENOPS01-BP01 step 7 principle ID.** Under the sequential convention, the next promoted principle from this BP will be GO1B1-05 (regardless of which AWS step it anchors to). Step 7 (Regularly update the ground truth dataset) is the only remaining `pending_review` step in the BP.

---

## 2026-05-27 — `classstrategy.md` created as a running deck-points file; first point captures the architecture / implementation layering tension parked from earlier today

### Context

Today's architecture vs implementation positioning discussion (during PRIN_004 `solution.approach` drafting) surfaced a point that is directly load-bearing for the class deck Dheeraj is preparing. The catalogue-side question — whether to split invariant from implementation in the schema, three options A/B/C — is parked for now; PRIN_004 continues under the current schema. But the conceptual point itself should not be lost.

### Decisions

1. **`classstrategy.md` created at the catalogue root.** Running file capturing points and tensions surfaced during principle authoring that should make it into the class deck. Each entry names the point, why it matters for the senior-architect audience, a worked example from the catalogue, and a sketch for how it might land as a slide.

2. **First point captured.** The architecture / implementation layering tension — two failure modes (too abstract vs too prescriptive), the invariant + reference-implementation framing, PRIN_004 as the worked example, three options for evolving the catalogue schema (parked).

3. **Convention going forward.** When a tension or framing point surfaces during authoring that is deck-worthy but not immediately actionable in the catalogue, append it to `classstrategy.md` at the point of surfacing. Same discipline as `governance.json` for governance questions: capture the concern, do not lose it, do not pollute the architecture principles with it.

### Files changed today (this entry)

- `classstrategy.md` — new file at the catalogue root.
- `decisions.md` — this entry. "(latest)" marker moved off the architecture / governance boundary entry from earlier today.

### Open items

- None added. The architecture / implementation layering question itself remains parked (see the prior "(latest)" entry's open items).

---

## 2026-05-27 — Architecture / governance boundary made explicit; `governance.json` created as companion to `principles.json`; GOV_001 captured from PRIN_004 config-ownership discussion

### Context

While drafting PRIN_004's `solution.approach` (the `eval/drift/config.yaml` convention), the question surfaced: who edits the YAML in production when a business owner wants to change a threshold? The architecture says WHAT must be in the config and that CI gates check completeness. It says nothing about the human process — the request, the review, the approval, the edit, the deploy. That's governance, not architecture, and it's a real and separate concern that arises from many of the catalogue's principles (which scenarios go in the harness, what strata count, what thresholds count, who approves a strata-manifest change, etc.).

### Decisions

1. **The architecture / governance boundary is made explicit.** Architecture (the catalogue in `principles.json`) answers what artefact exists, where, what's checked, who validates it from a technical-ownership perspective (Project Architect / ARB). Governance answers the human-process layer around those architectures — who raises a change request, who reviews, who approves, who edits, who merges, who deploys. The two are complementary and frequently entangled in practice, but should be treated as separate concerns in this catalogue's framing so each can be sharpened in isolation.

2. **`governance.json` created.** Lives alongside `principles.json` at the catalogue root. Holds an `entries` array — each entry captures a governance question surfaced by an architecture principle, with the context that raised it, the question itself, and (eventually) the agreed resolution. Format v1.0. The schema is deliberately minimal at this stage; if a richer structure is needed later (e.g., a separate catalogue of governance principles with their own shape), this file becomes a question-log feeding into that work.

3. **GOV_001 captured.** First entry: the `eval/drift/config.yaml` threshold-change governance question, raised during PRIN_004 solution authoring. Status: open (no resolution yet). Names the request → review → approval → edit → deploy chain as the open shape.

4. **Going forward.** As future principles are authored, governance questions that surface should be captured as `governance.json` entries at the point of surfacing, not buried inside architecture principles. This keeps each principle in `principles.json` narrow and lets governance be addressed separately — either by writing inline resolutions on entries or by eventually authoring a governance-principles catalogue with its own schema.

### Why this is the right call

The catalogue has been growing without an explicit boundary between architecture and governance. Several existing principles already gesture at governance (PRIN_001's "PA self-attests at release", PRIN_002's "PA confirms strata reflect decision branches at release", PRIN_004's "alert routing" field) but the catalogue doesn't articulate the human-process layer that surrounds those self-attestations. Without a separate place to capture governance questions, they either pollute architecture principles (making them larger, less focused, and harder to author against the V1 statement rubric) or get lost in conversation.

The companion-file approach (`governance.json` sibling to `principles.json`) keeps each catalogue narrow while making the architecture-vs-governance distinction navigable. Future work can decide whether `governance.json` grows into a schema'd catalogue with its own structure, or remains a question-log answered piecemeal as governance principles are authored elsewhere.

### Files changed today (this entry)

- `governance.json` — new file at the catalogue root. Holds GOV_001 (the `eval/drift/config.yaml` threshold-change question) and a meta block explaining the architecture / governance boundary.
- `decisions.md` — this entry. "(latest)" marker moved off the retitle-pass entry from earlier today.

### Open items

- **GOV_001 itself is unresolved.** Captured as a question, not a decision. To be addressed separately.
- **Governance entry schema is V1.** The minimal shape (`entry_id`, `raised_during`, `related_principle`, `context`, `governance_question`, `status`, `proposed_resolution`, `agreed_resolution`) is enough to capture questions but may need extension as governance gets actually treated (e.g., responsible-role fields, decision-rights matrices).
- **Cross-references.** PRIN_004's `solution.approach` should eventually note the architecture / governance boundary explicitly and cross-reference GOV_001. Pending PRIN_004 solution finalization.
- **Backlog scan.** PRIN_001 / PRIN_002 / PRIN_003 likely have governance questions implicit in their content (who decides what scenarios go in the harness, who approves a strata-manifest change, who reviews metric edits, who signs off on a baseline-update ADR). Worth scanning these for additional governance.json entries once the convention beds in.

---

## 2026-05-27 — Retitle pass on PRIN_001/002/003 `statement.title` under V1 statement rubric; explain_prompt identity lines updated to mirror; CLAUDE.md gained a hand-apply-rubric working rule

### Context

The per-field authoring rubric framework was introduced earlier today (see the sibling 2026-05-27 entry below). The carried-forward open item from that entry — "Retitle pass for PRIN_001/002/003 + draft PRIN_004 title" — is now done for the three live principles. PRIN_004's title was confirmed prescriptive at draft time and committed straight to its in-flight statement.

### Decisions

1. **PRIN_001 retitled.** `statement.title` from "Versioned Ground-Truth Evaluation Harness for Agent Decisions" (noun phrase) to "Maintain a versioned ground-truth evaluation harness for agent decisions in the workload repository" (imperative). PATCH bump 1.5.0 → 1.5.1.

2. **PRIN_002 retitled.** `statement.title` from "Stratified Ground-Truth Composition and Per-Stratum Evaluation Gating" (noun phrase) to "Stratify the ground-truth harness and gate evaluation per stratum, not on the aggregate" (imperative). PATCH bump 1.3.0 → 1.3.1.

3. **PRIN_003 retitled.** `statement.title` from "Encapsulated Evaluation Metrics in the Workload Repository" (noun phrase) to "Implement every evaluation metric as a named, encapsulated code unit" (imperative). PATCH bump 2.0.0 → 2.0.1. The `eval/metrics/` path reference was deliberately omitted from the title to avoid over-specifying convention at the title level — the path stays in `solution.approach` and the gates, where it belongs.

4. **explain_prompt identity lines updated on each principle.** Each principle's `explain_prompt.system` opens with a sentence referencing the principle's title verbatim ("explaining the failure mode that PRIN_NNN — <title> — prevents..."). That title quote was updated to the new title on each of the three principles. `compiled_for_principle_version` bumped on each to mirror the principle version bump (1.5.0 → 1.5.1, 1.3.0 → 1.3.1, 2.0.0 → 2.0.1).

5. **No content change on any of the three principles.** Rule, gates, ownership, framework_mappings, problem, solution, evidence — all unchanged. Pure title-only PATCH, matching the precedent set by PRIN_001 v1.0.1 (rename + cleanup).

6. **`agentflow/rubrics/statement.md` calibration table updated.** Now shows the actual before/after for each retitle (PRIN_001/002/003) plus the unchanged historical PRIN_003 v1.0.0 scope_match: 0 example and the PRIN_004 draft passing example. Replaces the earlier "(proposed)" rows with the committed retitles.

7. **CLAUDE.md gained a hand-apply-rubric working rule.** A new "Catalogue authoring" section instructs: when manually authoring a `statement.title`, run it through `agentflow/rubrics/statement.md` first. This is a stop-gap until the agentflow pipeline is built and runs the rubric mechanically; until then, the rule is hand-applied.

### Why this is the right call

The rubric framework introduced earlier today is only useful if it actually gets applied. PRIN_004's title was the first one drafted under the new rubric and passed cleanly. PRIN_001/002/003 still carried their pre-rubric noun-phrase titles, which would have left the catalogue internally inconsistent (one prescriptive principle, three noun-phrase principles). PATCH bumps are the cheapest version-mechanism that records the change without claiming a content shift that did not happen. The CLAUDE.md working rule prevents the same flaw from being re-introduced on the next principle authored before agentflow is built.

PRIN_003's title deliberately drops the `eval/metrics/` path reference. The earlier proposed retitle ("Implement every evaluation metric as a named, encapsulated code unit under `eval/metrics/` and import it from the eval runner") was over-specifying convention at the title level. Conventions belong in `solution.approach` and `gates`; the title should carry the architectural rule, not the implementation specifics. The shorter retitle still passes the rubric (all dimensions ≥ 2).

### Files changed today (this entry)

- `principles.json` — PRIN_001/002/003 `statement.title` retitled; `explain_prompt.system` identity-line title quotes updated; `explain_prompt.compiled_for_principle_version` bumped on each (1.5.0→1.5.1, 1.3.0→1.3.1, 2.0.0→2.0.1); `change_history.current_version` bumped on each; new PATCH change_history entry appended to each.
- `agentflow/rubrics/statement.md` — calibration examples table replaced to show actual committed retitles.
- `CLAUDE.md` — new "Catalogue authoring" section added with the hand-apply-rubric rule.
- `decisions.md` — this entry. "(latest)" marker moved off the earlier 2026-05-27 rubric-framework entry.

### Open items

- **Closed:** "Retitle pass for PRIN_001/002/003 + draft PRIN_004 title under the V1 statement rubric." Drops off the carried-forward list.
- **Carried forward unchanged** from the earlier 2026-05-27 entry: formal meta-prompt; GENOPS01-BP01 walkthrough (PRIN_004 mid-flight on step 6; step 7 pending); bash sandbox blocked by WSL UNC; `SKILL.md` stale; Datawhistl deck PRIN_007 mis-attribution; sustainability pillar omitted; PRIN_001/002 explain_prompt field-tests; nine deferred field rubrics; `statement.md` → `statement.py` promotion; calibration weights.
- **Added by this entry:** none.

---

## 2026-05-27 — Per-field authoring rubrics introduced; `statement` rubric V1 authored in `agentflow/rubrics/`; PRIN_001/002/003 + draft PRIN_004 title flagged for retitle pass under rubric guidance

### Context

While drafting PRIN_004 (GENOPS01-BP01 step 6 — Monitor for performance drifts), the user pushed back on the proposed title shape: "principles are prescriptive." Examination of the catalogue confirmed: PRIN_001 ("Versioned Ground-Truth Evaluation Harness for Agent Decisions"), PRIN_002 ("Stratified Ground-Truth Composition and Per-Stratum Evaluation Gating"), and PRIN_003 ("Encapsulated Evaluation Metrics in the Workload Repository") all carry noun-phrase titles, while AWS's own BP titles are imperatives ("Periodically evaluate functional performance", "Monitor all application layers"). Four principles' titles had been authored without a structured judge of statement quality; the form flaw propagated through three completed principles and would have shipped on PRIN_004 too.

The user then surfaced the deeper move: every non-deterministic field in the schema needs a quality rubric of this kind. Without rubrics, each LLM-authored field is judged vibes-based and field-level errors are caught only when a human reader pushes back. With rubrics — named dimensions, structured scoring, deterministic thresholds — the authoring pipeline catches errors before any human review.

### Decisions

1. **Per-field authoring rubrics are now catalogue convention.** Every LLM-authored field carries a 0–3 dimensioned rubric with a deterministic threshold rule, implemented in `agentflow/rubrics/` (one file per field, named after the field). The ten LLM-authored fields are: statement, problem, solution, gates, explain_prompt, focus_area, impact_level, applicability, maturity_level, framework_mappings. The five deterministic / rules-based fields (principle_id, pillar, evidence, change_history, ownership) do not get rubrics — there is no judgment to evaluate.

2. **Scope: catalogue-authoring discipline, not workload-architecture principle.** The rubric framework belongs in `agentflow/rubrics/`, not in `principles.json`. It is about what the agentflow pipeline does when authoring catalogue content, not about what a team building an AI workload does. Declaring it as a principle would pollute the catalogue. The schema-level rule that this discipline exists is recorded in `taxonomy.json` `conventions.per_field_authoring_rubrics`; the implementation lives in `agentflow/rubrics/` with the convention documented at `agentflow/rubrics/README.md`.

3. **V1 scope: only the `statement` rubric.** The other nine field rubrics are deferred until their respective agentflow authoring nodes are built. Building all ten upfront would repeat the universal-prompt mistake the catalogue learned from `explain_prompt` — calibrating against assumptions rather than worked examples. The first rubric exists because the titles failure forced it; subsequent rubrics land as their authoring nodes do.

4. **`statement` rubric dimensions.** Five dimensions, each 0–3: `is_prescriptive` (uses imperative verb, reads as a directive), `derives_from_aws_verbatim` (load-bearing terms map to AWS step), `names_artefact_and_enforcement` (both the artefact and the check are named), `scope_match` (no scope creep, no invented architectural theories — the PRIN_003 v1.x lesson), `parallel_form_with_siblings` (voice and shape match other catalogue entries). Threshold: all dimensions ≥ 2 to pass; any 0 or 1 on any dimension is a fail and the statement is routed back for re-drafting before any downstream field is touched. Calibration examples in the spec are drawn from the catalogue's own history — PRIN_001/002/003 noun-phrase titles fail `is_prescriptive`; PRIN_003 v1.0.0's "Verification Chain Coverage" title fails `scope_match`; the proposed retitles pass.

5. **Format: markdown V1, Python when agentflow has plumbing.** The rubric exists as `agentflow/rubrics/statement.md` for now — agentflow does not yet have LLM plumbing, and the spec content matters more than the code wrapper. When the authoring pipeline is wired, the spec is promoted to `agentflow/rubrics/statement.py` (Pydantic model whose fields mirror the dimensions, judge prompt as a module-level constant, deterministic threshold function as a post-processor). The markdown spec text migrates into docstrings on the Pydantic model so the human-readable rubric lives alongside the executable form.

6. **No weights in V1.** Every dimension counts equally. Weights deferred until a worked example surfaces the need.

7. **Taxonomy convention added.** `taxonomy.json` `conventions.per_field_authoring_rubrics` declares the rule and cross-references `agentflow/rubrics/README.md` for the implementation convention. Document `format_version` bumped 1.3 → 1.4 (conventions block extended). `applies_to_principles_schema_version` unchanged at 1.8 — this is a convention addition, not a per-principle schema change.

8. **Retitle debt for PRIN_001/002/003 + draft PRIN_004 title.** All four titles need flipping from noun-phrase to imperative under the new rubric. Deferred to a follow-up session — pure title-only changes will be PATCH bumps per the precedent of PRIN_001 v1.0.1 (rename + cleanup, no rule change). The retitle pass will run each candidate title through the V1 statement rubric (hand-scored, since agentflow LLM plumbing is not yet built) and pick the highest-scoring candidate.

### Why this is the right call

The titles failure has the same shape as PRIN_003's v1.x scope creep — a quality issue that was not caught by any structured judge and only surfaced when a human reader noticed. PRIN_003 v2.0.0 introduced the lesson "field-test the explain_prompt before shipping." The rubric framework generalises that lesson to every LLM-authored field: do not ship without a structured judge.

The structural parallel to PRIN_003 itself is exact. PRIN_003 says evaluation metrics for AI workloads must be encapsulated code in `eval/metrics/` — named, importable, testable, reviewable. The rubric framework says the same one level up: the rubrics that judge our authored principles are encapsulated code in `agentflow/rubrics/`. Same architectural rule, two layers. The catalogue-authoring discipline practises what the catalogue preaches.

Building only the `statement` rubric for V1 honours the cost-of-premature-breadth lesson from the explain_prompt design: a universal `explain_prompt` distorted three of four failure shapes; ten rubrics built before their fields had been authored at scale would calibrate against assumptions. Each rubric earns its place as its authoring node lands.

### Files changed today (this entry)

- `agentflow/rubrics/statement.md` — new file. Five-dimension rubric for the `statement` field with calibration examples drawn from existing PRIN_001/002/003 titles and PRIN_004 candidates.
- `agentflow/rubrics/README.md` — new file. Pins the file convention (one rubric per LLM-authored field; markdown V1, Python at agentflow build time; threshold rule semantics; build-per-node policy; scope split between catalogue-authoring discipline and workload-architecture rule).
- `taxonomy.json` — `conventions.per_field_authoring_rubrics` added. Document `format_version` bumped 1.3 → 1.4 with note in `meta.notes`. `applies_to_principles_schema_version` unchanged at 1.8.
- `decisions.md` — this entry. "(latest)" marker moved off the PRIN_003 v2.0.0 entry from 2026-05-26.

### Open items (carried forward and added)

Carried from the 2026-05-26 PRIN_003 v2.0.0 entry and still open:

- **Formal meta-prompt.** Per-principle explain_prompts are still hand-compiled.
- **GENOPS01-BP01 walkthrough.** Steps 1 / 2 / 4 promoted; step 3 not_promoted; step 5 now not_promoted as of today's sibling entry; steps 6 / 7 pending walkthrough. PRIN_004 authoring (step 6) is mid-flight — title pending the retitle pass under the new rubric.
- **Bash sandbox.** Still blocked by the WSL UNC mount.
- **`SKILL.md`.** Still stale.
- **Datawhistl deck.** Still mis-attributes legacy PRIN_007 to GENOPS01-BP01.
- **Sustainability pillar.** Still intentionally omitted.
- **PRIN_001 and PRIN_002 explain_prompt field-tests.** Not run yet.

Added by this entry:

- **Retitle pass for PRIN_001/002/003 + draft PRIN_004 title.** All four under the V1 statement rubric (hand-scored, since agentflow LLM plumbing is not yet built). PATCH bumps on each. Pending next session.
- **Nine deferred field rubrics.** `problem`, `solution`, `gates`, `explain_prompt`, `focus_area`, `impact_level`, `applicability`, `maturity_level`, `framework_mappings`. Each authored as its agentflow authoring node is built; not upfront.
- **Promotion of `statement.md` to `statement.py`.** Pending agentflow LLM plumbing.
- **Calibration weights.** Currently no weights; threshold is all-dims-≥-2. Worth revisiting if a worked example shows a dimension should carry more or less weight than others.

---

## 2026-05-27 — GENOPS01-BP01 step 5 (Perform model evaluations) not_promoted; absorbed by PRIN_001 (CI execution gate) and step 6's future drift-monitor principle (periodic execution)

### Context

GENOPS01-BP01 walkthrough resumed after the PRIN_003 v2.0.0 rewrite. Step 5 was previously tagged `pending_review` in `lens_mapping.md` with a note ("Borderline — may collapse into a sibling. 'Perform the evaluation you already set up' may not be architecturally distinct from PRIN_001's CI execution gate."). Today's read of the AWS verbatim against the existing catalogue confirmed the borderline call comes down on the not_promoted side.

AWS step 5 verbatim:

> Perform model evaluations.
>   - Input prompts into the model
>   - Generate outputs and compare them to ground truth values
>   - Analyze results to track performance over time

### Decisions

1. **Step 5 not_promoted.** Second non-promotion in the GENOPS01-BP01 walkthrough, after step 3.

2. **Rationale: absorbed by sibling principles.** "Input prompts into the model" and "generate outputs and compare them to ground truth" are concretised by PRIN_001 gate 2 (the harness runs and passes on PRs touching `src/agent/`); the mechanical act of running is the CI gate. "Analyze results to track performance over time" — the longitudinal element — falls out naturally as a byproduct of PRIN_001 + PRIN_002 + PRIN_003 running per-PR; what the team DOES with the resulting time series belongs to step 6 (Monitor for performance drifts). The `lens_mapping.md` note on step 3 already earmarked "run periodically" for step 6, so the periodic-execution element of step 5 is also absorbed there.

3. **`lens_mapping.md` step 5 row flipped from `pending_review` to `not_promoted`** with rationale matching this entry.

### Why this is the right call

Same shape as step 3's non-promotion: "perform the evaluation you already set up" is what the prior setup is for, not a standalone architectural rule. Promoting it would have produced a principle whose content is fully redundant with PRIN_001 (per-PR execution) and the future step 6 principle (periodic execution). The honest call is to leave it as a documented gap — adopters can see that we considered it and chose to absorb rather than restate.

### Files changed today (this entry)

- `lens_mapping.md` — step 5 row in the GENOPS01-BP01 ledger flipped from `pending_review` to `not_promoted` with rationale matching this entry.
- `decisions.md` — this entry.

### Open items

None added — this entry closes step 5. Steps 6 (in flight, PRIN_004 drafting) and 7 (pending walkthrough) remain in the GENOPS01-BP01 carried-forward list captured in the sibling 2026-05-27 entry above.

---

## 2026-05-26 — PRIN_003 v2.0.0: rewritten against what AWS step 4 actually says; scope-creep failure-mode theory retired; applicability broadened to agent + RAG + LLM mandatory, ML nice-to-have

### Context

PRIN_003 had been authored against an elaborate failure-mode theory: silent regression of an agent's verification chain — the right-answer-for-wrong-reason failure mode, where a tool call silently breaks and the agent's headline output stays plausible because of compensation or coincidence. The principle's statement, problem, solution, gates, and explain_prompt were all calibrated to that theory.

Field tests on the explain_prompt repeatedly failed to support it. Retail + Agent (InvoiceWizard) produced a self-contradictory example mixing "wrong amounts approved" with "right answer for wrong reason" — the two are mutually exclusive. Airline + Agent (FareRateService) held together only by stretching to "tolerance window as soft synthesis," which the user pushed back on as not a real-world workflow design. Fashion + Agent (ChicAdvisor) didn't fit at all because fashion recommendations have no verifiable correctness anchor. Insurance + Agent (ClaimCheck / SecureLife medical records) read as bad workflow design — if the medical-records service is failing intermittently and the workflow continues, that's a missing fail-stop gate, not a metrics-eval failure. Each successive tightening of the explain_prompt (WORKLOAD FIT CHECK, decisioner-vs-recommender classification, narrow-to-soft-synthesis framing) made the principle's scope smaller and more contrived without ever producing a clean honest example.

The user diagnosed the underlying problem directly: the verification-chain failure-mode theory was scope creep. The AWS step it anchors to (GENOPS01-BP01 step 4) is exactly two sentences: *"Define custom metrics. Use the fmeval library to create custom metric classes. Encapsulate logic for calculating specific evaluation criteria."* That is a plain software-engineering hygiene rule about putting evaluation metrics in named, encapsulated code rather than inline expressions. Nothing about silent regressions, verification chains, right-answer-wrong-reason failures, or soft synthesis. The principle has been carrying an invented architectural theory.

### Decisions

1. **PRIN_003 bumped 1.2.0 → 2.0.0 (MAJOR).** Statement, problem, solution, gates, and explain_prompt rewritten against the honest reading of the AWS step.

2. **New statement.** *"Encapsulated Evaluation Metrics in the Workload Repository.* Each evaluation metric used by the workload's harness must be implemented as a named, encapsulated unit of code — a class or function with a stable interface — in a known directory of the workload repository (convention: `eval/metrics/`). The evaluation runner imports metrics from this directory and contains no inline scoring logic. Each metric is independently unit-testable."

3. **New problem.** The failure mode is code-hygiene drift over time: inline metric definitions across eval scripts and notebooks; the same metric tweaked subtly in parallel PRs and silently divergent; metric semantics buried in 400-line eval-runner refactors and shipping unreviewed; new joiners unable to tell what a metric measures without Git archaeology; eval results not replicating between local dev and CI because inline implementations have drifted; team eventually losing trust in its own eval numbers and forced into a substantial rebuild.

4. **New solution.** `eval/metrics/` directory with one metric per file. Each metric is a class (or function) with a stable interface (e.g., a Python class with an `evaluate(output, expected) -> float` method, or the team's equivalent). Sibling unit tests for each metric. The eval runner imports metric instances from `eval/metrics/` and iterates over them — the runner contains no scoring logic, only orchestration.

5. **New gates (both pre_merge, both required status checks).** (a) `eval/metrics/` exists and contains at least one named, encapsulated metric with a stable interface; (b) on any PR that touches `eval/`, no metric definitions appear outside `eval/metrics/` — a lint that fails if metric-shaped classes/functions are defined elsewhere.

6. **Applicability broadens.** From `{ "agentic": "mandatory" }` to `{ "agentic": "mandatory", "rag": "mandatory", "llm": "mandatory", "ml": "nice_to_have" }`. The metrics-as-encapsulated-code discipline applies anywhere a team writes custom evaluation logic — not just to agents. For classical ML, library-provided metrics (sklearn.metrics et al.) typically already carry the discipline, so it lands as nice-to-have rather than mandatory.

7. **Maturity stays foundational.** The discipline matters from day one of any non-trivial evaluation setup; skipping it creates debt that compounds.

8. **AIGP cross-reference stays III.B (Govern the AI Model Lifecycle (Design & Build))** with `mapping_state: unverified`. Encapsulating evaluation metrics is a build-phase design discipline; the placement is unchanged.

9. **explain_prompt totally rewritten.** New failure-shape framing: cumulative-drift / code-hygiene, not silent-regression. The example now establishes a team that IS evaluating (not a no-eval setup) but with inline metric calculations, and walks through how those inline definitions drift over months until the team loses trust in its own eval numbers. Compiled_for_principle_version bumped to 2.0.0; compiled_at and compiled_by unchanged.

10. **No schema change.** Schema v1.8 stays. The principle's `applicability` enum values are all already in the schema; the only thing different is which keys are populated. No bump of `principles.json` format_version or `taxonomy.json` schema version is required.

### Why this is the right call

The v1.x line was a sunk cost driving more sunk cost. Every field test surfaced incoherence, and every tightening of the explain_prompt narrowed the principle's scope further to chase the failure mode I had invented. The user kept pressing on why the examples didn't hang together, and the honest answer at every stage was that the failure mode I was defending wasn't actually what the AWS step describes. Better to admit the scope creep, retire the theory, and re-anchor to the plain reading of the step.

A side benefit: the principle becomes much broader in applicability. The metrics-as-encapsulated-code discipline genuinely applies to any team writing custom evaluation logic, regardless of whether the workload is agentic, RAG, LLM-only, or ML. The narrow agentic-only framing was forced by the failure-mode theory, not by anything real about the discipline.

The catalogue gains something else too: an honest record of what scope creep looks like and how to recognise it. The change_history entry on PRIN_003 v2.0.0 keeps the v1.x entries intact — they document the theory, the field tests that failed it, and the diagnosis. Future principles in the catalogue can be sense-checked against this pattern: when an explain_prompt's example keeps requiring tighter and tighter qualifications to remain plausible, the principle's framing is probably wrong, not the example.

### Files changed today (this entry)

- `principles.json` — PRIN_003 rewritten end-to-end. `applicability` broadened. `framework_mappings.aws.references[0].note` rewritten to match the new framing (fixed directory, stable interface, no inline logic in runner, metric changes as first-class diffs). `statement` rewritten. `problem.description` and `problem.examples` rewritten. `solution.approach` and `solution.key_benefits` rewritten. `gates` rewritten (existence + no-inline-definitions, both required status checks). `change_history.current_version` bumped 1.2.0 → 2.0.0 with v2.0.0 entry appended. `explain_prompt.system` totally rewritten to a cumulative-drift / code-hygiene failure shape. `explain_prompt.compiled_for_principle_version` bumped 1.2.0 → 2.0.0. Other fields (pillar, focus_area, impact_level, maturity_level, framework_mappings.aigp, ownership, evidence, user_template, compiled_at, compiled_by) unchanged. No content change to PRIN_001 or PRIN_002.

- `decisions.md` — this entry. "(latest)" marker moved off the v1.8 entry from earlier today.

### Open items (carried forward and added)

Carried from the v1.8 entry and still open:

- **Formal meta-prompt.** Per-principle explain_prompts are still compiled by hand. The meta-prompt that takes a principle as input and outputs the explain_prompt is the next architectural step.
- **PRIN_002 threshold-shape question.** Was flagged in PRIN_003's v1.0.0 entry (per-metric per-stratum thresholds). With PRIN_003 v2.0.0 no longer mandating per-metric thresholds at all, this question is moot — PRIN_002's threshold language stands as-is.
- **GENOPS01-BP01 walkthrough.** Steps 1 / 2 / 4 promoted; step 3 not_promoted; steps 5 / 6 / 7 pending walkthrough. `lens_mapping.md` GENOPS01 ledger still needs step 4 flipped from `pending_review` to `promoted_to_principle: PRIN_003 v2.0.0`.
- **Bash sandbox.** Still blocked by the WSL UNC mount.
- **`SKILL.md`.** Still stale.
- **Datawhistl deck.** Still mis-attributes legacy PRIN_007 to GENOPS01-BP01.
- **Sustainability pillar.** Still intentionally omitted.

Added by this entry:

- **PRIN_001 and PRIN_002 sense-check.** PRIN_001 and PRIN_002 carry their own failure-mode framings (setup-absence; silent regression of a minority class). These have not been field-tested against the explain_prompt generations as aggressively as PRIN_003's was. Worth running a few representative generations to confirm those framings hold up — and being willing to bump them with MAJOR rewrites if they don't.

---

## 2026-05-26 — Schema v1.8: per-principle `explain_prompt` field added; universal-prompt design rejected after field-test contradiction; PRIN_001 / PRIN_002 / PRIN_003 compiled in-session

### Context

The session continued from the v1.7 work, moving into design for a runtime UI feature: an "Explain" button on each principle's Problem tab. Clicking opens a popup that asks the user to pick an Industry (Insurance / Banking / E-Commerce / Retail / Education / etc.) and an Implementation type (RAG / Agent / LLM Only / ML), then calls OpenAI to generate an illustrative example with two sections — Use Case Background and Issue Detail.

The initial design produced a single universal system prompt that the runtime would use across every principle, with the principle data, industry, and implementation type substituted into the user message at call time. The prompt was reviewed and iterated several times, culminating in a version with explicit "discriminating failure mode" / "working baseline first" / "name the broken link" / "surface stays plausible" rules. A field-test on PRIN_003 with Retail + Agent produced a use case ("InvoiceWizard") whose narrative contradicted itself — the Issue Detail described an obviously-wrong-amount accuracy regression but framed it as a right-answer-for-wrong-reason failure, the latter being PRIN_003's actual failure mode. The two are mutually exclusive: if payments are obviously wrong, simpler aggregate-accuracy monitoring catches it and PRIN_003's per-metric discipline is not what the example demonstrates.

Investigation showed the universal prompt was calibrated for one failure shape (silent regression of a working chain) and produced incoherent narratives when applied to principles whose failure modes had different shapes. The catalogue holds several failure-mode shapes — silent regression, setup-time absence, cumulative drift, one-shot breach — and a single universal prompt cannot honour all of them without distorting at least three. The user proposed a cleaner architecture: compile a per-principle prompt at authoring time, store it on the principle, and let the runtime use just industry + implementation type as variables. This entry records the architectural decision and the schema and content changes that followed.

### Decisions

1. **Schema v1.8: optional `explain_prompt` field added on every principle.** Field shape: `{ system: string, user_template: string, compiled_for_principle_version: string, compiled_at: string (YYYY-MM-DD), compiled_by: string }`. `system` is the full OpenAI-style system message; it bakes in the principle's identity, statement, problem framing, failure-mode shape, the output JSON contract (use_case_background + issue_detail), and the invariant style rules. `user_template` is the user message with two Mustache-style placeholders — `{{ industry }}` and `{{ implementation_type }}` — substituted by the runtime at call time. `compiled_for_principle_version` records which `change_history.current_version` of the principle the prompt was compiled against, enabling stale-prompt detection. `compiled_at` is the ISO date of compilation; `compiled_by` is a short identifier ('manual_authoring' for the first wave; will later be the meta-prompt's version once that is formalised).

2. **Optional, not required.** A principle without `explain_prompt` cannot drive the runtime UI's Explain affordance; the runtime can either fall back to a generic prompt or hide the affordance. Optionality matches the incremental nature of catalogue authoring — not every principle will be compiled at the same time.

3. **Per-principle compilation, not a single universal prompt.** Universal prompts cannot honour every failure shape: scaffolding that works for silent-regression principles (working baseline → broken link → plausible surface) actively distorts setup-absence principles (the team had nothing; an event made the absence visible), cumulative-drift principles (many locally-rational decisions compounding to a portfolio problem), and one-shot-breach principles (a discipline that hadn't been tested until it was exploited). Compiling per principle moves the failure-shape calibration off the runtime path into authoring time, where it can be done deliberately, reviewed, and stored. The runtime gets uniform behaviour (same JSON output shape across every principle); the per-principle calibration is invisible to it.

4. **Invariant style rules carried in every compiled prompt.** The runtime style invariants — JSON-only output of the agreed shape; no bullet lists or headings; no invented regulatory specifics; honest signposting of invented numbers; implementation-type definitions (RAG retrieves, Agent reasons + tools, LLM Only is single-turn, ML is classical); the italicised opening sentence when the chosen implementation type isn't one the principle marks mandatory — live in every compiled prompt. The principle-specific calibration is layered on top: identity, statement, failure-mode framing, problem references. This keeps the runtime UX consistent regardless of which principle was clicked.

5. **Meta-prompt is the next deliverable; in-session compilation is by hand.** Long-term plan is a meta-prompt that takes a principle as input and outputs the compiled `explain_prompt` — making the work an LLM-tractable task in its own right and enabling bulk re-compilation when the meta-prompt is improved. The meta-prompt itself is deferred; PRIN_001, PRIN_002, and PRIN_003 are compiled by hand in this session per the discipline articulated in the new `usage.when_compiling_an_explain_prompt` block in `taxonomy.json`. When the formal meta-prompt is built, every existing `explain_prompt.compiled_by` value will be updated from `manual_authoring` to the meta-prompt's version on re-compilation.

6. **Three principles compiled in-session.** PRIN_001 (Versioned Ground-Truth Evaluation Harness for Agent Decisions) calibrated to its setup_absence failure shape: working agent + informal validation; triggering event (architect departure, refactor, audit, customer regression) forces the absence into view; cost is a forced choice between ship-blind / rebuild-from-memory / stall. PRIN_002 (Stratified Ground-Truth Composition and Per-Stratum Evaluation Gating) calibrated to its silent_regression failure shape, minority-class variant: working harness with skewed scenario distribution; change ships that regresses a minority class; aggregate stays green; regression eventually surfaced by something other than CI. PRIN_003 (Encapsulated, Version-Controlled Custom Metrics for Agent Evaluation) calibrated to its silent_regression failure shape, right-answer-for-wrong-reason variant, with an explicit "name the working chain first, then describe the regression of that chain" guard added in response to the InvoiceWizard contradiction surfaced in the field-test.

7. **Schema and principle versions bumped accordingly.** `principles.json` `meta.format_version` 1.7 → 1.8. `taxonomy.json` `applies_to_principles_schema_version` 1.7 → 1.8. `taxonomy.json` document `format_version` 1.2 → 1.3 (fields / conventions / usage blocks extended). PRIN_001 1.4.0 → 1.5.0 (MINOR — new sibling field). PRIN_002 1.2.0 → 1.3.0 (MINOR). PRIN_003 1.0.0 → 1.1.0 (MINOR). All version bumps record the explain_prompt addition with a per-principle summary of the prompt's calibration.

### Why this is the right call

The field-test contradiction was diagnostic. It surfaced a real limitation of a single runtime prompt that no amount of style-rule iteration could close. Different failure-mode shapes need different narrative scaffolding, and the LLM cannot infer the right scaffolding from the principle alone — the failure-mode shape isn't an explicit field on the principle, and inferring it from `problem.description` is unreliable. Either the schema gains a `failure_shape` enum (the in-session "Option B" — schema change + UI branching + per-shape prompt) or each principle carries its own compiled prompt (the route taken here). The compiled-prompt route is more elegant: no taxonomy change beyond a single optional field, no UI branching, no enum to maintain. The per-principle prompt absorbs the failure-shape calibration as part of its content. Bulk re-compilation when the meta-prompt is improved is cheap. The cost is one extra field per principle and one disciplined authoring step per principle.

The decision also resolves a long-standing tension: the catalogue keeps insisting "every principle is concrete and self-contained" but the runtime UX was about to lean on a generic explanation pipeline that was anything but. Moving the explanation prompt onto the principle restores the catalogue's invariant — everything about how a principle is reasoned about, evaluated, and explained lives on the principle itself.

### Files changed today (this entry)

- `taxonomy.json` — Bumped `applies_to_principles_schema_version` 1.7 → 1.8 and document `format_version` 1.2 → 1.3. Added v1.8 explanatory note to `meta.notes`. Inserted the `explain_prompt` field definition into `principle_schema.fields[]` as an optional field after `change_history`, with a structured-shape description and pointers to the new convention and usage block. Added `conventions.per_principle_explain_prompt_compilation` explaining the per-principle architecture rationale. Added `usage.when_compiling_an_explain_prompt` with six step-by-step compilation instructions (identify failure shape; bake in principle identity; carry invariant style rules; carry discriminating-failure-mode discipline; populate metadata; re-compile on principle version bumps that affect example shape).

- `principles.json` — Bumped `meta.format_version` 1.7 → 1.8 with explanatory note. Added `explain_prompt` block to PRIN_001 (compiled_for_principle_version 1.5.0; setup_absence calibration), PRIN_002 (1.3.0; silent_regression / minority-class calibration), and PRIN_003 (1.1.0; silent_regression / right-answer-wrong-reason calibration with the explicit "name the working chain first" guard). Bumped each principle's `change_history.current_version` accordingly and appended per-principle change entries describing the explain_prompt addition and its failure-shape calibration. No content change to any principle's rule, gates, ownership, or framework mappings.

- `decisions.md` — this entry. "(latest)" marker moved off the earlier v1.7 entry from this morning.

### Where the session paused

This session paused at the close of the v1.8 schema work. The next natural moves are: (a) author the formal meta-prompt so future principles can be compiled mechanically rather than by hand; (b) resume the GENOPS01-BP01 walkthrough at step 5 (Perform model evaluations) — pending the call on whether step 5 warrants its own principle or merges into a sibling; (c) decide whether PRIN_002 should be bumped (to v1.4.0 after today's v1.3.0) to make the per-metric threshold language explicit, an open question flagged in PRIN_003's v1.0.0 change-history summary that remains undecided.

### Open items (carried forward)

Carried from the v1.7 entry and still open:

- **Formal meta-prompt.** Per-principle explain_prompts are currently compiled by hand. The meta-prompt that takes a principle as input and outputs the explain_prompt is the next architectural step. Once built, all existing explain_prompts can be re-compiled in bulk and their `compiled_by` values updated.
- **PRIN_002 threshold-shape question.** PRIN_003 evolved the strata.yaml threshold shape from `threshold: number` to `thresholds: { metric_name: value }`. PRIN_002's wording ("per-stratum metric threshold") was read as generic enough to accommodate this without a content change. The user has not yet decided whether to bump PRIN_002 to make the per-metric shape explicit in PRIN_002's own contract.
- **GENOPS01-BP01 walkthrough.** Steps 1 / 2 / 4 promoted; step 3 not_promoted; steps 5 / 6 / 7 pending walkthrough. `lens_mapping.md` GENOPS01 section still needs step 4 flipped from `pending_review` to `promoted_to_principle: PRIN_003` (not done in the v1.7 session either; carried forward).
- **Bash sandbox.** Still blocked by the WSL UNC mount; JSON validity for today's edits verified by structural read-back, not by `json.load`.
- **`SKILL.md`.** Still stale (v1.0-era schema language; doesn't reference v1.7, v1.8, applicability map, maturity_level, framework_mappings, or step-level anchoring).
- **Datawhistl deck.** Still mis-attributes legacy PRIN_007 to GENOPS01-BP01.
- **Sustainability pillar.** Still intentionally omitted.

---

## 2026-05-26 — Schema v1.7: `applicability` reshaped from array to pattern-criticality map; `pattern_criticality` enum added; PRIN_001 + PRIN_002 retrofitted

### Context

The v1.6 work earlier in the day reintroduced `applicability` (which patterns the principle applies to) and `maturity_level` (when an org should care). During the immediate follow-up the user surfaced a sharper question: given a specific GenAI pattern (say RAG), which of the catalogue's principles are *mandatory* for that pattern and which are *nice-to-have*? The v1.6 `applicability` shape (array of patterns) could not answer this — it told us a principle applies to a pattern, but said nothing about how essential it was for that pattern.

A short check against the AWS Generative AI Atlas (awslabs.github.io/generative-ai-atlas) confirmed the industry uses multiple overlapping pattern taxonomies (application-type — chatbot / IDP / multimodal / data-insight; technical-pattern — RAG / agents / fine-tuning; orchestration — fan-out, prompt-chaining, human-in-loop). Adopting one of these wholesale would have expanded our scope without answering the actual question (mandatory vs nice-to-have per pattern). The correct move was a small schema change to encode criticality per pattern, on top of the four-value taxonomy we already had.

### Decisions

1. **Schema v1.7: `applicability` reshaped from array to map.** The v1.6 shape `applicability: ["agentic", "rag"]` becomes `applicability: { "agentic": "mandatory", "rag": "nice_to_have" }`. Keys are still drawn from `enums.applicability` (`llm` / `rag` / `agentic` / `ml`); values are drawn from a new enum `pattern_criticality` (`mandatory` / `nice_to_have`). Omitted patterns mean "doesn't materially apply" — `n/a` is not a value, absence is.

2. **`enums.pattern_criticality` added.** Two values: `mandatory` (without this principle the failure mode it prevents is the dominant production-failure pattern for this kind of system) and `nice_to_have` (the principle helps, but the failure mode is rare for this pattern, or industry norms already cover something equivalent — e.g. stratified k-fold for classical ML, train/test splits for any supervised model).

3. **`applicability` and `maturity_level` are orthogonal.** `applicability` map values say "for THIS system pattern, how critical is this principle." `maturity_level` says "at what point in your org's GenAI journey should you adopt it." Both can be expressed independently — a principle can be `mandatory` for `rag` and still be `scaling` rather than `foundational`. Convention added in `taxonomy.json` (`conventions.applicability_and_maturity_level` updated; new `conventions.choosing_pattern_criticality` added).

4. **PRIN_001 and PRIN_002 retrofitted, kept narrow.** Both now carry `applicability: { "agentic": "mandatory" }` — same scope as v1.6 (both principles' statements explicitly mention "agent workload" and PRIN_002 builds on PRIN_001), just expressed in the new shape. Conscious decision to keep them narrow rather than broaden to RAG / LLM / ML: each pattern's entry shape (input + expected decision + expected evidence trace is agent-shaped; RAG would be query + retrieved docs + expected answer + expected citations), strata vocabulary, and failure modes differ enough that a single broad principle would hedge. Sibling principles for RAG / LLM / ML will be authored separately when those subject areas are walked through.

5. **Schema versions bumped.** `principles.json` `meta.format_version` 1.6 → 1.7. `applies_to_principles_schema_version` in `taxonomy.json` bumped 1.6 → 1.7. `taxonomy.json` document `format_version` bumped 1.1 → 1.2 since fields / enums / conventions blocks were extended again. PRIN_001 bumped 1.3.0 → 1.4.0; PRIN_002 bumped 1.1.0 → 1.2.0 (MINOR — schema field reshape with content change, no rule changes).

### Why this is the right call

The v1.6 `applicability` was a step in the right direction but stopped one move short. Telling adopters "this principle applies to RAG" without saying whether it's mandatory or optional pushed the call onto each adopter — and the whole point of the catalogue is to make those calls explicit, not implicit. The map shape closes that gap with a one-token addition per pattern.

The decision to keep PRIN_001 and PRIN_002 narrow (agentic-only) is a deliberate trade-off. Going broad would have meant rewriting the principle statements to be pattern-agnostic, which would have softened the agent-specific framing that makes them useful in the first place. Sibling principles for other patterns can carry pattern-specific entry shapes when they're authored. The catalogue is sharper when each principle has one tight scope.

### Files changed today (this entry)

- `taxonomy.json` — bumped `applies_to_principles_schema_version` 1.6 → 1.7 and document `format_version` 1.1 → 1.2. Changed `principle_schema.fields[].applicability` type from `array` to `object`, with `keys_ref` and `values_ref` pointers to enums. Field description rewritten to describe the map shape, the omission-means-not-applicable convention, and the v1.6 → v1.7 migration. Added `pattern_criticality` to `enums`. Updated `conventions.applicability_and_maturity_level` to reflect the new map shape and note the orthogonality with `maturity_level`. Added `conventions.choosing_pattern_criticality` describing how to decide mandatory vs nice_to_have. Added a note to `meta.notes` summarising v1.7.

- `principles.json` — bumped `meta.format_version` 1.6 → 1.7 with explanatory note. Changed PRIN_001 and PRIN_002 `applicability` from `["agentic"]` to `{ "agentic": "mandatory" }`. Bumped PRIN_001 `change_history.current_version` 1.3.0 → 1.4.0 with v1.4.0 entry. Bumped PRIN_002 1.1.0 → 1.2.0 with v1.2.0 entry. Both summaries explain the schema reshape and the narrow-scope decision.

- `decisions.md` — this entry. "(latest)" marker moved off the earlier v1.6 entry from this morning.

### Where the session paused

Walkthrough of GENOPS01-BP01 paused mid-step 4 (Define custom metrics). Substance established in this session:

**AWS verbatim for step 4:**

> Define custom metrics.
>   - Use the fmeval library to create custom metric classes
>   - Encapsulate logic for calculating specific evaluation criteria

And from the BP body: *"The fmeval library provides a framework for defining and using custom metrics. By creating a custom metric class, you can encapsulate the logic for calculating a specific evaluation criterion tailored to your use case. Use this to continuously assess your language models using both standard metrics provided by fmeval and your own specialized metrics."* AWS's sub-bullets are vendor-specific (fmeval); the architectural content sits one layer up.

**Proposed framing (agreed in principle, not yet ratified):** Step 4 likely warrants a standalone principle because for an agentic system, "success" is not a single number — it's a tuple of metrics: decision correctness, evidence-trace completeness, tool-call correctness, response-shape adherence, policy-compliance score. Stock metrics (accuracy, F1, BLEU, ROUGE) cannot evaluate these. The principle's commitment would be **metrics-as-code**: each evaluation metric is a named, encapsulated function or class in the workload repository, version-controlled, reviewed in PRs — not a number pulled from a lookup table or a definition that lives in someone's head.

**Distinction from PRIN_001 and PRIN_002:**

- PRIN_001 says: the harness exists with structured entries.
- PRIN_002 says: strata are declared and per-stratum metrics + thresholds gate CI.
- Proposed step-4 principle would say: the metric definitions themselves are code, named, encapsulated, version-controlled, reviewed in PRs. A team could comply with PRIN_001 + PRIN_002 by declaring a single metric called `score` whose body is `return 1 if output == expected else 0` — step 4 closes that hole.

**What was NOT yet decided (open for the next session):**

1. **Enforcement.** What does the CI gate check — that named metrics exist as code, that scenarios reference metrics that exist (no dangling reference), that metric definitions don't change without a PR review touching them, that strata thresholds in `eval/strata.yaml` reference declared metric names?
2. **Tier.** Likely project-tier (same as PRIN_001 and PRIN_002) but not confirmed.
3. **Gates.** Likely a single pre_merge required status check, but the exact contract needs articulation.
4. **Repository convention.** Probable path: `eval/metrics/` for the metric definitions. To be confirmed.
5. **`applicability` map.** Under v1.7. Likely `{ "agentic": "mandatory" }` keeping the narrow scope, but the question of whether custom-metrics-as-code applies broadly (RAG, LLM) is worth a brief check before deciding.
6. **Principle ID.** Will be PRIN_003 on the assumption that step 4 promotes.
7. **AIGP cross-reference.** TBD — likely Domain III.B (Govern the AI Model Lifecycle (Design & Build)) since metric definition is part of evaluation design, but needs the same provisional-unverified treatment as PRIN_001 and PRIN_002 carry until a competency-level review is done.

### To resume in the next session

Suggested opening: *"Read `taxonomy.json`, `principles.json`, and the latest 2026-05-26 entry of `decisions.md`. We are partway through the GENOPS01-BP01 walkthrough — steps 1 and 2 promoted (PRIN_001 v1.4.0, PRIN_002 v1.2.0); step 3 not_promoted; step 4 mid-walkthrough with the proposed framing captured in the 'Where the session paused' section of the latest decisions.md entry. Schema is now v1.7 — `applicability` is a pattern-criticality map, not an array. Resume step 4 by answering the seven open questions listed in that section: enforcement, tier, gates, repository convention, applicability map, principle ID, AIGP cross-reference. Once those are decided, draft PRIN_003."*

### Open items (carried forward)

Same as the earlier v1.6 entry, plus:

- **No new principles authored under v1.7 yet.** PRIN_001 and PRIN_002 are retrofits. When the next principle is authored (likely step 4), it will be the first written natively to the v1.7 shape and will exercise the new convention for choosing criticality.
- **Sibling principles for RAG / LLM / ML.** Conscious deferral; sibling principles preferred over broad rewrites of PRIN_001 and PRIN_002. May surface naturally when GENPERF (Performance Efficiency) focus areas or BPs covering chatbot / RAG / IDP patterns come up.

---

## 2026-05-26 (earlier — v1.6 session) — PRIN_002 authored (GENOPS01-BP01 step 2 → Stratified Sampling); step 3 not_promoted; schema v1.6 (applicability + maturity_level reintroduced); PRIN_001 + PRIN_002 retrofitted; lens_mapping.md GENOPS01 section converted to step-level ledger

### Context

Resumed the GENOPS01-BP01 walkthrough from where the earlier 2026-05-26 entry paused (step 1 done as PRIN_001 v1.2.0; step 2 next). Worked through steps 2 and 3 in sequence. Mid-walkthrough the user surfaced a schema gap — "some steps are absolute must-haves, some are nice-to-haves" — which led to reintroducing two legacy fields the v1.5 rebuild had dropped.

### Decisions

1. **Step 2 (Apply stratified sampling techniques) promoted to PRIN_002 — Stratified Ground-Truth Composition and Per-Stratum Evaluation Gating.** AWS step 2 says "Categorize ground truth data into relevant groups. Randomly sample from each group to achieve balanced representation." Strip out the AWS vendor framing and what remains is two architectural commitments AWS leaves undefined: (a) the dataset's composition is deliberately stratified, not whatever you happened to collect; (b) metrics are computed and gated per stratum, not only on aggregate pass-rate. For an agentic workload the strata are domain-specific — decision branches, tool-call paths, persona segments, policy carve-outs — and have to be declared because they cannot be inferred mechanically. Without per-stratum gating an aggregate pass-rate sits at green while a small but business-critical class silently regresses; this is the dominant production-failure pattern for agent decisioning systems with skewed traffic.

2. **PRIN_002 is project-tier; two `pre_merge` gates, both required status checks on the integration branch.** (a) `eval/strata.yaml` exists with ≥1 declared stratum; every entry in `eval/scenarios/` carries a `stratum` field referencing a declared stratum; every declared stratum has ≥ its declared minimum example count; the harness emits per-stratum metrics; every stratum meets its per-stratum threshold. (b) COVERAGE — any PR touching `src/agent/` that adds or alters a decision branch / tool integration / policy carve-out must also modify `eval/strata.yaml` OR include a linked ADR justifying why no strata change is needed. Evidence blank (project-tier convention — the CI gate IS the proof). The architecturally non-mechanical part — *are the chosen strata meaningful* — sits in PA self-attestation at release; ARB sees it via aggregate dashboard / spot-check.

3. **Step 3 (Establish periodic evaluation processes) NOT promoted.** First non-promotion in the walkthrough. Strip out the Bedrock / SageMaker / fmeval vendor sub-bullets and what remains has no architecturally distinct content. "Run the harness on a schedule" is absorbed by step 6 (Monitor for performance drifts) — a drift monitor that doesn't run on a cadence isn't a drift monitor. "Re-evaluate when new candidate models arrive or model customization applied" belongs in a future model-change-gate principle, likely emerging from step 5 or the GENOPS05 focus area. "Identify a single-threaded workload owner" is operating-model / RACI policy, not an architectural rule. Recorded in lens_mapping.md as `not_promoted` with rationale.

4. **Schema v1.6: `applicability` and `maturity_level` reintroduced as root-level fields on every principle.** Triggered by the must-have-vs-nice-to-have observation during the step 4 discussion. Two dials: which AI patterns does the principle apply to (`applicability: array of llm / rag / agentic / ml`), and at what organisational maturity should an adopter care (`maturity_level: foundational / scaling / mature`). Both fields existed in the legacy v1.0 schema, were dropped during the v1.5 rebuild while framework_mappings was being finalised, and are now back. Field placement: root-level, right after `impact_level`. Field descriptions cover the enum values inline. Convention added at `taxonomy.json` → `conventions.applicability_and_maturity_level`.

5. **PRIN_001 and PRIN_002 retrofitted with the new fields.** Both set to `applicability: ["agentic"]` (both principles are written for agent decisioning systems — agent-workload vocabulary in statements, agent-specific strata for PRIN_002) and `maturity_level: "foundational"` (PRIN_001 is bedrock; PRIN_002 addresses a day-one failure mode on agentic workloads). PRIN_001 bumped 1.2.0 → 1.3.0 (MINOR); PRIN_002 bumped 1.0.0 → 1.1.0 (MINOR). Per-principle change-history entries record rationale.

6. **Schema `format_version` bumped 1.5 → 1.6.** Two new required fields constitute a real schema change. `applies_to_principles_schema_version` in `taxonomy.json` updated to 1.6; `format_version` in `principles.json` meta updated to 1.6; `taxonomy.json` own document `format_version` bumped 1.0 → 1.1 since fields / enums / conventions blocks were extended.

7. **`lens_mapping.md` GENOPS01 section converted to the step-level due-diligence ledger.** First BP to be converted from the legacy BP-level table format. Shows step 1 → PRIN_001 v1.3.0 (promoted), step 2 → PRIN_002 v1.1.0 (promoted), step 3 → not_promoted with rationale, steps 4–7 → pending_review with notes on likely outcomes. Stale PRIN_007 gap-fill prose removed (PRIN_007 lives in principles_old.json). Top-of-file note added explaining the transition — GENOPS01-BP01 is the first BP in the new format; other BPs remain in legacy BP-level format pending walkthrough.

### Why this is the right call

The non-promotion of step 3 is methodologically significant. It's the first time the step-level walkthrough produced a "not architecturally distinct enough to warrant its own principle" outcome, recorded with rationale rather than silently elided. This validates the per-step due-diligence — the `framework_mappings_spec` assumption that "not all steps become principles" is now a working pattern, not just a theoretical position.

The applicability + maturity_level reintroduction came from the walkthrough rather than abstract schema work — the user noticed mid-conversation that some steps are absolute day-one essentials while others are conditional on workload type or organisational maturity. Without the fields the catalogue silently asserts "every principle is universal," which is false. The fields are filtering aids, not gates: a startup running a single LLM chatbot can filter to `applicability: includes 'llm'` + `maturity_level: 'foundational'` and pick up exactly the principles that matter today, without being overwhelmed by mature-portfolio concerns.

### Files changed today (this entry)

- `principles.json` — Appended PRIN_002 (Stratified Ground-Truth Composition and Per-Stratum Evaluation Gating; GENOPS01-BP01 step 2; mapping_state: verified; project-tier; two pre_merge gates; evidence blank). Bumped `meta.format_version` 1.5 → 1.6 with explanatory note. Added `applicability: ["agentic"]` and `maturity_level: "foundational"` to both PRIN_001 (between `impact_level` and `framework_mappings`) and PRIN_002. Bumped PRIN_001 `change_history.current_version` 1.2.0 → 1.3.0 with v1.3.0 entry; bumped PRIN_002 1.0.0 → 1.1.0 with v1.1.0 entry. Both summaries describe the v1.6 retrofit.

- `taxonomy.json` — Bumped `applies_to_principles_schema_version` 1.5 → 1.6 and document `format_version` 1.0 → 1.1. Inserted `applicability` and `maturity_level` field definitions into `principle_schema.fields[]` after `impact_level`. Added `applicability` and `maturity_level` entries to `enums`. Added `conventions.applicability_and_maturity_level` explaining the field's purpose and the v1.6 reintroduction history. Added a note to `meta.notes` summarising v1.6.

- `lens_mapping.md` — GENOPS01 section restructured to per-step due-diligence ledger format. Top-of-file methodology note added (GENOPS01-BP01 is the first BP in the new step-level format; other BPs remain in legacy BP-level format pending walkthrough). Stale PRIN_007 gap-fill paragraph removed.

- `decisions.md` — this entry. "(latest)" marker moved off the earlier 2026-05-26 entry.

### Where the session paused

Walkthrough of GENOPS01-BP01 paused mid-step 4 (Define custom metrics). Agreed in principle that step 4 likely warrants a standalone principle — the discipline of "metrics are code, not folklore" is architecturally distinct from step 1 (harness exists) and step 2 (strata exist). The enforcement / tier / gates discussion has not started.

### To resume in the next session

Suggested opening: *"Read `taxonomy.json`, `principles.json`, and the latest 2026-05-26 entry of `decisions.md`. We are partway through the GENOPS01-BP01 walkthrough — steps 1 and 2 promoted (PRIN_001 v1.3.0, PRIN_002 v1.1.0); step 3 not_promoted; step 4 mid-walkthrough. Continue from step 4 (Define custom metrics) — we agreed in principle it warrants a standalone principle but had not started enforcement / tier / gates."*

### Open items (carried forward)

**Immediate (continuation of GENOPS01-BP01 walkthrough):**

- **Step 4 (Define custom metrics)** — agreed in principle that it warrants a standalone principle. Needs enforcement / tier / gates discussion + drafting.
- **Steps 5, 6, 7** — pending walkthrough.

**Structural / file-management (carried forward, still open):**

- `principles_old.json` long-term disposition — leave-as-is for now.
- Manually `rm taxonomy.md` — sandbox UNC issue prevents physical deletion. One-line user cleanup.
- Bash sandbox unavailable — WSL UNC path still blocks the workspace bash mount. All JSON validity for today's edits verified by structural read-back, not by `json.load`. Worth a parser run when shell is available.

**Documentation / downstream artefacts (carried forward, still open):**

- `SKILL.md` is stale. Still describes the v1.0-era schema; doesn't reference v1.6, applicability, maturity_level, framework_mappings, or step-level anchoring.
- Datawhistl deck still mis-attributes legacy PRIN_007 to GENOPS01-BP01.
- Sustainability pillar — still intentionally omitted; decision should be made explicit on whether to add it later.

**`lens_mapping.md` continuation:**

- Other BPs (GENOPS02, GENOPS03, GENOPS04, GENOPS05, GENSEC*, GENREL*, GENPERF*, GENCOST*) still in legacy BP-level format. Will be converted to step-level format as each walkthrough happens.
- Extension-principles table at the bottom still references legacy PRIN_NNN's (PRIN_009, PRIN_010, PRIN_001-LangGraph, PRIN_013–017). All those PRINs now live in principles_old.json. To be reconciled when those subject areas are walked through.

---

## 2026-05-26 (earlier today) — Schema v1.5 (framework_mappings, implementation-step anchoring, AIGP folded in, change_history); rebuilt catalogue in `principles.json` (legacy → `principles_old.json`); taxonomy spec converted to `taxonomy.json`; GENOPS01-BP01 walkthrough started (step 1 → PRIN_001 v1.2.0)

### Context

This session opened with the Datawhistl deck review and the user's challenge against the deck's mapping of PRIN_007 to GENOPS01-BP01 ("I do not see any test harness shit in there"). Fetching the live AWS BP confirmed the challenge — GENOPS01-BP01 is about *periodic ground-truth evaluation with stratified sampling and drift detection*, not the pre-merge regression-gate principle PRIN_007 was authored as. The mismapping was real and it had propagated into the deck.

From there the conversation went to the schema. Two structural changes surfaced. First, the `aws_mapping` field is shaped as a singular AWS-vocabulary object — pillar / focus_area / question / best_practice — with no structural room for an Azure or GCP mapping to live alongside, and with the verification state encoded inline as prose ("(VERIFIED — ...)", "(UNVERIFIED — ...)", "(EXTENSION — ...)") rather than as queryable fields. Second, `responsible_ai_lens_crossref` was a separate top-level field — AWS-vocabulary at the schema level — that split a principle's external-framework relationships across two fields and undercut the "schema travels across clouds" position the catalogue claims.

The right move was a schema overhaul plus a fresh-file rebuild against the live Lens. The legacy `principles.json` carries enough TODO mappings and provisional anchors that retrofitting it would have been busywork; authoring one principle at a time against the actual AWS source produces sharper content with less rework.

### Decisions

1. **Schema v1.5: `framework_mappings` replaces `aws_mapping`.** The field is an object keyed by framework identifier (`aws`, `azure`, `gcp`, `nist`, `owasp`, etc.). Each framework key holds a `references` array — zero or more reference objects. A principle can map to multiple frameworks, multiple references inside a single framework (e.g. one principle concretising two AWS BPs), or zero references (no analogue in that framework — captured as a single reference with `mapping_state: "na"`). Only framework keys that have actually been audited for the principle should be present; absent keys mean "not yet checked."

2. **Reference objects carry their own state, not prose.** Each reference is `{ lens, pillar, focus_area, question, best_practice, mapping_state, last_checked, note }`. `mapping_state` is a real enum (`verified`, `unverified`, `na`) instead of a string fragment hidden inside `best_practice`. `last_checked` is an ISO date populated on every reference regardless of state — for `verified` and `unverified` it's when the assessment was done; for `na` it's when we last checked and found no analogue. The `note` field carries the rationale that used to be jammed into parenthetical suffixes.

3. **`responsible_ai_lens_crossref` is retired.** The Responsible AI Lens is another AWS Lens — it belongs *inside* `framework_mappings.aws.references` as an entry with `lens: "Responsible AI Lens"`, not as a parallel top-level field named after AWS's product taxonomy. The cross-lens fact is implicit in the reference's `lens` value; the `note` field carries the placement rationale.

4. **`change_history` added to every principle.** Two parts: `current_version` (semver, denormalised) and `changes` (append-only array of `{ version, date, author, summary }`, chronological oldest first). Semver semantics: MAJOR = rule changed, MINOR = meaningful addition (new gate, new framework mapping, mapping promoted to verified), PATCH = clarification or typo. Never edit prior entries — append.

5. **Build a fresh catalogue in a new file rather than migrate the legacy one in place.** Partway through a planned in-place migration (PRIN_001–009 fully on v1.5; PRIN_010 partially migrated) the user redirected: this should be a fresh catalogue, authored one principle at a time against the live AWS Lens, not a bulk schema-flip of legacy content. Working file naming during this session: the rebuild was initially drafted as `principles_new.json`; the user subsequently renamed the legacy file to `principles_old.json` and promoted the rebuild to the primary `principles.json` name. From this entry onward, `principles.json` IS the rebuilt v1.5-aligned catalogue; `principles_old.json` is the half-migrated legacy file, reference-only.

6. **The rebuilt `principles.json` uses the flat structure (option B).** Top-level `principles[]` array, each principle tagged with `pillar` and `focus_area` as string fields. Not the hierarchical `pillars[] → focus_areas[] → principles[]` shape. Same shape as the legacy file at the top level; same v1.5 per-principle schema.

7. **First principle written in the new `principles.json`: PRIN_001 — Periodic Performance Evaluation Against Versioned Ground Truth.** Concretises GENOPS01-BP01 against what the BP *actually says* (periodic evaluation with stratified sampling against versioned ground truth, with drift detection and dataset refresh), not the pre-merge regression-gate framing inherited from the legacy PRIN_007 (now in `principles_old.json`). Three gates: blocking pre-release evaluation against committed dataset with thresholds met per stratum; non-blocking scheduled weekly run with staleness alerting; quarterly dataset-refresh review (or an ADR justifying skip). Project-tier ownership; Evidence blank with `review_mode: "automated_only"` per v1.4. The framing departure from legacy PRIN_007 is captured in the principle's own `change_history.v1.0.0.summary`.

8. **Convention: illustrative examples must be signposted.** Examples in `problem.examples` should be concrete failure patterns. If the examples are illustrative narratives (invented for clarity) rather than documented incidents, this must be flagged in `problem.description` so a reader cannot mistake invented precision for cited evidence. PRIN_001's examples were initially written with fabricated numbers (specific percentages, durations, scenario counts); a v1.0.1 patch added the illustrative-narratives signpost. Convention now documented in `taxonomy.json` (initially added to `taxonomy.md` earlier in the same session before that file was converted to JSON).

9. **Taxonomy spec converted from `taxonomy.md` to `taxonomy.json`.** User's prompt: "why do we have a taxonomy.md file and not a json file?" The taxonomy was already mostly structured data (pillars, focus areas, schema field definitions, enums) wrapped in markdown prose. JSON makes the structured parts programmatically queryable — a consumer can ask "list valid mapping_state values" or "what fields are required on a principle" by parsing the file rather than by reading prose. Normative spec prose (field descriptions, the required-status-check constraint, the cross-lens placement explanation, etc.) is preserved as `description` and `notes` strings on each field, so nothing is lost. Two sections from `taxonomy.md` were dropped from the JSON: "Why the `enforcement` field was retired" (already in decisions.md as the v1.2 entry) and the stale "Exemplar" paragraph about the legacy 16-principle retrofit pass (replaced by a fresh exemplar pointer to PRIN_001). The `taxonomy.md` file has been overwritten with a one-line tombstone redirecting to `taxonomy.json` (the sandbox couldn't physically delete it because of a UNC-path limitation — the user can rm the .md file manually). All forward-looking references to `taxonomy.md` across the repo (in `principles.json`, `decisions.md` intro and example-prompt sections, `lens_mapping.md`, `slides.md`) were updated to `taxonomy.json`. Historical "Files changed today" entries inside prior decisions.md sessions were left as-is — they accurately record that those sessions modified `taxonomy.md`, which was the file's name at the time.

10. **AIGP cross-reference folded into `framework_mappings`; standalone `aigp` field retired.** User's prompt: "how can we push AIGP under framework mappings rather than separate?" Same fix pattern as the `responsible_ai_lens_crossref` retirement earlier today — AIGP is structurally identical in role to AWS (both are external governance frameworks our principles map to), so giving AIGP a separate top-level field while AWS lives under `framework_mappings` was inconsistent. AIGP now lives at `framework_mappings.aigp.references[]` with the same outer shape as AWS. The schema change required splitting the reference object's fields: common fields (`mapping_state`, `last_checked`, `note`) are required on every reference regardless of framework; framework-specific structural fields are different per framework (`aws` has `lens` / `pillar` / `focus_area` / `question` / `best_practice` / `implementation_step`; `aigp` has `domain` / `competency`). The asymmetry between AWS-as-primary-anchor and AIGP-as-cross-reference is preserved by convention (AWS reference is mandatory and concretises a BP; AIGP is informational with no enforcement obligation), not by schema. PRIN_001's AIGP mapping is now explicitly `mapping_state: "unverified"` — honest about the fact that we asserted the III.A mapping without a side-by-side AIGP-spec comparison. Schema change documented in `taxonomy.json` framework_mappings_spec; PRIN_001 bumped to v1.2.0 (MINOR — new framework mapping in canonical form). Future frameworks (NIST AI RMF, ISO 42001, EU AI Act) can be added as new keys under `framework_mappings` using the same pattern — declare their structural fields in `framework_specific_reference_fields`, populate references on principles as they're mapped.

### Why this is the right call

The framework_mappings restructure is what makes the "schema over content" position actually true. Before this change, the catalogue's data model carried AWS-product-shaped vocabulary at the top level (`aws_mapping`, `responsible_ai_lens_crossref`) — the schema was wearing an AWS jersey. After this change, AWS-specific vocabulary is scoped inside one entry of an extensible array, and adding an Azure mapping tomorrow means appending an `azure` key, not migrating the schema. The framework-anchoring discipline is preserved (every principle still names the BPs it concretises) but the shape is portable.

The fresh-file rebuild is the right call because most of the legacy catalogue was inherited from an earlier AIGP-anchored design, and only one mapping (legacy PRIN_007) had been verified against AWS. Retrofitting 15 principles whose mappings are still TODO/unverified would have produced a catalogue full of `mapping_state: "unverified"` entries — the v1.5 schema technically applied but the catalogue not actually aligned to AWS. Authoring one principle at a time against the live Lens produces verified entries from the start, and the work surfaces exactly the gaps that need attention (e.g. the GENOPS01-BP01 reframing this session).

### Files changed today (this entry)

- `taxonomy.md` — earlier in the session: schema field table updated (`aws_mapping` row replaced by `framework_mappings`; `responsible_ai_lens_crossref` row removed; `change_history` row added); the prose section after the table replaced "AWS Mapping" with "Framework Mappings" (keyed-by-framework structure, references-array shape, mapping_state enum, last_checked date, cross-lens-placement note); new "Change History" subsection added after Evidence; new convention added to the `problem` row: signpost illustrative examples in `description`. Later in the session: file deprecated. All content migrated to `taxonomy.json`; this file overwritten with a one-line tombstone redirecting to the JSON version (sandbox UNC-path issue prevented physical deletion — user to rm manually).
- `taxonomy.json` — created. Structured JSON form of the taxonomy: meta block; pillars[] with focus_areas[] nested (each carrying pillar_id, name, aws_pillar_code, test_question, description, focus_area_id, aws_question_code, aws_alignment_status, failure_mode_addressed, principles_typically_govern); principle_schema with fields[] + framework_mappings_spec + ownership_spec + gates_spec + evidence_spec + change_history_spec; enums block (impact_level, mapping_state, ownership_tier, lifecycle_points, review_mode, sign_off); usage guidance; conventions (illustrative-examples signposting, exemplar pointer to PRIN_001); framework_alignment_notes. Dropped from the original taxonomy.md: retired-enforcement-field historical note and stale legacy-catalogue exemplar paragraph.
- `lens_mapping.md` — sustainability-pillar cross-reference updated from `taxonomy.md` to `taxonomy.json`.
- `slides.md` — onboarding instruction updated from `taxonomy.md` to `taxonomy.json`.
- `taxonomy.json` (second pass, AIGP fold-in) — top-level `aigp` field removed from `principle_schema.fields`. `framework_mappings_spec` extended: intro and shape_example now include AIGP; new `primary_anchor_vs_cross_reference` section makes the AWS-vs-other-frameworks asymmetry explicit; `anchoring_methodology` scoped to AWS (where implementation steps exist); `reference_object_fields` replaced by `common_reference_fields` (mapping_state, last_checked, note) + `framework_specific_reference_fields` (per-framework dictionary, currently populated for `aws` and `aigp`).
- `principles.json` (PRIN_001) — top-level `aigp` field removed; equivalent content moved into `framework_mappings.aigp.references[0]` with `mapping_state: "unverified"`, `last_checked: "2026-05-26"`, and a note explaining the provisional nature. change_history bumped 1.1.0 → 1.2.0.
- `principles_old.json` (the legacy catalogue, formerly named `principles.json`, renamed by the user during this session) — left in mid-migration state at the user's explicit instruction. Meta block on v1.5; PRIN_001 through PRIN_009 fully migrated to `framework_mappings` + `change_history`; PRIN_010 partially migrated (`framework_mappings` done, `responsible_ai_lens_crossref` line still present, `change_history` not added); PRIN_011, 013, 014, 015, 016, 017 still on the legacy v1.4 schema. File is now internally inconsistent but is reference-only going forward.
- `principles.json` (the rebuilt catalogue, drafted this session as `principles_new.json` and then renamed by the user to take over the primary `principles.json` filename) — contains the v1.5 meta block plus PRIN_001 (Periodic Performance Evaluation Against Versioned Ground Truth, mapped to GENOPS01-BP01 with `mapping_state: "verified"`). Change history at v1.0.1 after the illustrative-examples signposting patch.
- `decisions.md` — this entry; "(latest)" marker moved from the 2026-05-25 entry.

### Open items (carried forward)

### Where the session paused

Session paused mid-walkthrough of **GENOPS01-BP01 (Periodically evaluate functional performance)**. The user is deliberately doing per-BP due diligence: for each AWS BP, walk through every implementation step, decide which become standalone principles in our catalogue, and which are merged / omitted. The seven implementation steps of GENOPS01-BP01 are:

1. **Create a ground truth dataset** — DONE. Promoted to PRIN_001 (currently v1.2.0). Title still loose — user flagged ("Versioned Ground-Truth Evaluation Harness for Agent Decisions" called vague) but moved on without resolving. Three rewrite candidates were drafted but not picked.
2. **Apply stratified sampling techniques** — PENDING. Next to walk through.
3. **Establish periodic evaluation processes** — PENDING. Note: per-change CI evaluation was *deliberately bundled into step 1* during the v1.1.0 PRIN_001 revision (a harness that doesn't run is a fiction). Step 3's principle, when authored, should scope to *periodic/scheduled* evaluation specifically (e.g. weekly drift checks against the deployed model), not per-change.
4. **Define custom metrics** — PENDING. Likely a candidate for "covered as implementation detail inside a sibling, not its own principle" — but final call to be made when discussed.
5. **Perform model evaluations** — PENDING. Borderline candidate; "perform the thing you already set up" may not be architecturally distinct.
6. **Monitor for performance drifts** — PENDING. Likely a standalone principle (drift detection is a distinct commitment).
7. **Regularly update the ground truth dataset** — PENDING. Likely standalone (refresh discipline is distinct from initial creation).

### To resume in the next session

Suggested opening: *"Read `taxonomy.json`, `principles.json`, and the 2026-05-26 entry of `decisions.md`. We are partway through the GENOPS01-BP01 walkthrough — step 1 is done as PRIN_001 v1.2.0; we paused before stepping 2 (Apply stratified sampling techniques). Continue from there."*

### Open items (carried forward)

**Immediate (continuation of GENOPS01-BP01 walkthrough):**

- **Resolve PRIN_001 title.** Current title "Versioned Ground-Truth Evaluation Harness for Agent Decisions" was flagged by the user as loose. Three candidates were drafted: (1) "Repository-Resident Ground-Truth Harness with Structured Entries" — noun phrase matching catalogue style, recommended; (2) "Commit Structured Ground-Truth Entries to the Workload Repository" — imperative, closer to AWS step's verb-first style; (3) "Workload-Repository Evaluation Harness with Structured Entries" — variant of (1), more explicit about *workload's own* repo. User did not pick one.
- **Step 2 of GENOPS01-BP01 (Apply stratified sampling techniques)** — next to walk through. Same pattern: discuss whether it warrants its own principle, draft, refine, edit `principles.json`. Likely a yes (stratification IS architecturally distinct from "have the dataset"), but the decision should be made in the walkthrough.
- **Steps 3, 4, 5, 6, 7** — pending walkthrough. See above for likely-promote / likely-merge calls; final decisions per the methodology.

**Structural / file-management:**

- **Restructure `lens_mapping.md` as the per-BP due-diligence ledger.** This is referenced extensively in `taxonomy.json` (framework_mappings_spec.related_file says "lens_mapping.md is the per-BP due-diligence ledger") and in the new methodology, but `lens_mapping.md` itself has not been restructured yet. It currently mirrors the old `aws_mapping` shape. Format: for each AWS BP, list every implementation step with one of three statuses (`promoted_to_principle: PRIN_NNN`, `not_promoted: <reason>`, `pending_review`). The GENOPS01-BP01 entry should be the first one populated since step 1 has been promoted to PRIN_001.
- **Decide what to do with `principles_old.json` long-term.** User said leave it as-is for now. At some point: retire with a pointer to the new `principles.json`, revert to clean v1.4, or fully finish the half-migration. Not urgent.
- **Manually `rm taxonomy.md`.** The file was overwritten with a deprecation tombstone but the sandbox couldn't physically delete it (UNC-path block). A stale `.md` file in the workspace will show up in greps. One-line user cleanup.
- **Bash sandbox unavailable in this session.** WSL UNC path blocks the workspace bash mount. JSON validity for all today's edits has been checked by structural read-back, not by `json.load`. Worth a parser-run when a usable shell is available — recommended check on resumption: `python3 -c "import json; print('principles.json:', json.load(open('principles.json'))); print('taxonomy.json:', json.load(open('taxonomy.json')))"`.

**Documentation / downstream artefacts:**

- **`SKILL.md` is stale.** `ai-architecture-principles/SKILL.md` still describes the v1.0-era schema (`enforcement`, `applicability`, `maturity_level`, `area`, `domain` fields; four-area taxonomy). It doesn't reference `taxonomy.md`/`taxonomy.json` directly, so the rename didn't affect it — but the schema it describes has diverged several versions from the catalogue. Worth a rewrite pass against the v1.5 schema and the new `taxonomy.json`.
- **Update the Datawhistl deck.** The slide deck mis-attributes the legacy PRIN_007 to GENOPS01-BP01 with the testing-harness framing. The deck's worked example needs reframing — either swap to the new PRIN_001 from `principles.json` or honestly mark the legacy PRIN_007 as a native extension that doesn't concretise GENOPS01-BP01.
- **Sustainability pillar.** AWS GenAI Lens has six pillars (Sustainability added). Our catalogue intentionally omits it (recorded in `taxonomy.json` framework_alignment_notes and `principles.json` meta). Decision should be made explicit on whether to add it later or keep omitting.

**Methodology questions surfaced this session but not yet decided:**

- **Whether to bump `format_version` for the schema work done today.** Schema started at v1.5 and added: `implementation_step` field (decision #14), AIGP folded into framework_mappings with reshaped reference fields (decision #10). Both arguably warrant v1.6, but they all landed within the v1.5 design phase and no v1.5 was ever "released" to consumers. Currently still labelled v1.5 in `principles.json` meta and `taxonomy.json` meta. Leave or bump — to decide.

---

## 2026-05-25 — Schema v1.4: Evidence becomes optional; project-tier principles leave it blank

### Context

While drafting slide 11 (the PRIN_007 anatomy slide) for the Maven session, the user pushed back hard on the framing of the Evidence section. The framing in the catalogue and the slide was "what ARB clicks on" — but PRIN_007 is `ownership.tier: project`, which means PA self-attests with mechanical evidence and ARB only sees it via aggregate dashboard or ~10% quarterly spot-check. The "ARB clicks four URLs every release" workflow belongs to enterprise-tier principles, not PRIN_007.

The deeper observation that followed: for project-tier principles, the Evidence block mostly collapses into the Gates block. The "Latest CI run" artefact IS the gate firing. The "Harness directory" artefact is what the gate inspects, not a separate audit target. The "Coverage-exception ADRs" artefact is what gets generated when the COVERAGE check is bypassed. Only "Branch protection config" was genuinely separate — the meta-config that makes the CI check non-bypassable. The user's call: blank Evidence for project-tier principles, require it only for enterprise-tier, and migrate the branch-protection requirement into the Gates block so it isn't lost.

### Decisions

1. **Schema v1.4: Evidence is now optional.** Required for enterprise-tier principles (PRIN_002 prompt caching, PRIN_003 centralized LLM SDK, PRIN_008 agent security framework, PRIN_009 evidence-based decisioning, PRIN_010 multi-model bias mitigation) where a central validator — ARB, Security, Legal, Finance — physically clicks URLs at a central review gate. May be left blank for project-tier principles, where the Gates block (CI enforcement, configured as a required status check on the integration branch) IS the proof.

2. **Branch protection requirement migrates into each gate's `check` field.** Project-tier gates enforced via CI must explicitly state that the check is configured as a *required* status check on the integration branch (typically `develop` in git-flow setups, `main` in trunk-based setups) — not advisory. Without this in-gate constraint, a PA can write a passing CI check that nobody is forced to wait for, and the gate quietly becomes optional.

3. **PRIN_007 Evidence blanked; gate wording extended.** The four-artefact Evidence list (harness directory, latest CI run, branch protection config, coverage-exception ADRs) is removed. The Evidence block becomes `{ artefacts: [], review_mode: "automated_only", sign_off: "binary" }`. The Gates block's `check` field is extended to carry: (a) the required-status-check constraint, and (b) the explicit note that the Coverage-exception ADR ledger is reviewed by the PA at release self-attestation.

4. **Slide deck updates.** The "4 named artefacts ARB clicks" row in slide 10's AWS-vs-PRIN_007 contrast table is replaced with a "CI gate IS the proof; non-bypassable via branch protection" row. The full anatomy slide's Evidence table is removed and replaced with a one-paragraph note explaining that Evidence is blank for project-tier principles. Gate language in both slides now carries the "required status check" constraint.

5. **`review_mode: "automated_only"`** is the project-tier default when Evidence is blank. It signals that the build system is the validator and no central review is convened.

### Why this is the right call

The previous Evidence block was doing two different jobs depending on tier: for enterprise-tier principles, it told a central validator what to inspect; for project-tier principles, it was an artificial inventory of CI plumbing dressed up as audit material. The new policy separates these honestly — Evidence is meaningful only when there's an external validator, and the project-tier audit weight sits entirely in the Gates block plus the required-status-check constraint.

Practical consequence: the 11 project-tier principles in the catalogue can leave Evidence blank when they get retrofitted, simplifying their schemas materially. The 5 enterprise-tier principles will carry rich Evidence blocks because that's where central validators genuinely need a click-list. The catalogue is sharper and more honest about where the audit weight sits.

### Files changed today (this entry)

- `taxonomy.md` — Evidence subsection rewritten as optional / enterprise-tier-required; Gates subsection extended with the required-status-check requirement; schema field table row for `evidence` marked optional and reframed; Exemplar paragraph updated to reflect PRIN_007 as a project-tier principle with blank Evidence.
- `principles.json` — `format_version` bumped 1.3 → 1.4; meta `notes` block extended with v1.4 description; PRIN_007 Evidence block blanked; PRIN_007 gate `check` wording extended with the required-status-check constraint and the integration-branch terminology (`develop` in git-flow, `main` in trunk-based).
- `slides.md` — AWS-vs-PRIN_007 contrast table's "WHAT proves it works" and "WHEN they gate" rows revised; full anatomy slide's Evidence table removed and replaced with a project-tier note; Gates section header in the anatomy slide gained the "both required status checks" phrasing.
- `decisions.md` — this entry.

### Open items (carried forward)

- **Continue slide drafting.** Slides 11–17 of Part 4 still pending. Slide 11 (The Rule / PRIN_007 as concrete spec) is the next slot, now with the corrected Evidence framing.
- **10 other project-tier principles when retrofitted.** PRIN_001, 004, 005, 006, 011, 013, 014, 015, 016, 017. Default Evidence to blank with `review_mode: "automated_only"`. Gate `check` fields must include the required-status-check constraint where the gate is CI-enforced.
- **5 enterprise-tier principles when retrofitted.** PRIN_002, 003, 008, 009, 010. Evidence remains rich. `review_mode: "central_review_at_gate"` typically. These are the principles where the new Evidence-required policy genuinely lands.

---

## 2026-05-24 — Maven lightning session is the catalogue's pressure test; `slides.md` added

### Context

The catalogue work in this session has been driven in parallel with drafting a 45-minute Maven lightning session ("Why Enterprise AI Agents Fail Beyond The Demo"). The deck is now captured in `slides.md`. Several architectural decisions logged in earlier entries were forced by the slide drafting — when a slide was hard to explain, the underlying principle had a gap.

### Decisions

1. **`slides.md` is a peer file alongside `taxonomy.md`, `principles.json`, `decisions.md`, and `lens_mapping.md`.** It captures deck structure, drafted slide content (slide 10 "Life Without a Principle" + AWS-vs-PRIN_007 contrast + full PRIN_007 anatomy slide), key framings developed in conversation, and a slide-by-slide TODO for slides 11–17.

2. **The slide deck is a forcing function for catalogue clarity.** Concrete trigger events from this session:
   - Drafting the AWS-vs-PRIN_007 contrast surfaced the *Lens-as-universe* model (every AWS BP becomes a principle slot).
   - Drafting the full principle anatomy surfaced that the `enforcement` field was muddled — split into `ownership` / `gates` / `evidence` (schema v1.2).
   - The user's challenge during slide drafting ("how does ARB actually check if the project team HAS done it?") led to the evidence-block structure.
   - The "harness on a laptop" failure narrative led to the realisation that GENOPS01-BP01 is genuinely satisfiable by a setup that catastrophically fails when an architect leaves — the principle's value-add is durability and transferability, not the harness itself.
   - The "script only runs what's in the harness" pushback led to the two-part gate (execution + coverage).
   - The "guardrails vs scenarios vs test data" distinction was forced by the slide narrative — these are three different things, not one.

3. **Recommended pattern going forward:** when authoring a new principle or refining an existing one, draft an example slide using it. If the slide is hard to write, the principle has a gap. The hardness is diagnostic.

### Key conceptual framings worth preserving

These are the framings that emerged from the slide work and are now part of how the catalogue should be talked about:

- *"AWS gives a heading; PRIN_007 gives a contract."* — the catalogue's USP in one sentence.
- *"You can pass the AWS checklist and still hit this failure."* — the sharpest argument for why the catalogue exists (the FTSE retailer architect satisfied GENOPS01-BP01 in spirit and the failure happened anyway).
- *WHERE / WHO / WHEN / HOW* — the four things AWS leaves unspecified that our principles fill in. Use as the recall mnemonic.
- *"Code changes cause retrospective failures"* — the user-facing symptom framing. Distinct from the engineering cause. Lead with this when describing the failure.

### Files changed today (this entry)

- `slides.md` — created.
- `decisions.md` — this entry.

### Open items (carried forward)

- **Continue drafting slides 11–17 of Part 4** (PRIN_007 deep dive). Specifically slide 12 (Before — broken pattern), slide 13 (After — principle applied), slide 14 (Enforcement Points), slide 15 (Automation Hooks), slide 16 (Evidence & Applicability), slide 17 (Compound Effect callback). Slide 10 final wording sign-off also pending.
- **Apply the "draft a slide" diagnostic to the other 15 principles.** PRIN_009, PRIN_010, PRIN_011 are good candidates — if drafting their slide is awkward, they likely have the same gaps PRIN_007 had before this session's refinements.
- **Closing slides 18–20** still out of scope.

---

## 2026-05-24 (earlier latest) — PRIN_007 coverage check added: gate becomes two-part

### Context

The simplification entry below collapsed PRIN_007's gates to a single `pre_merge` check (harness runs and passes). The user immediately flagged the gap: the script can only run what's IN the harness folder. If a developer ships new agent code without adding corresponding scenarios, the harness still passes — because the harness has no way to know about the new code paths.

This is the coverage problem. Mathematically, full coverage cannot be guaranteed — you can't test for production shapes you haven't seen yet. But the dominant failure mode (developer adds new code, doesn't add corresponding scenario) IS mechanically catchable via PR diff inspection.

### Decisions

1. **Gate is now a two-part check at `pre_merge`:**
   - **EXECUTION** — Harness runs against all scenarios in `tests/production_scenarios/` and all pass; folder must contain ≥N scenario files.
   - **COVERAGE** — If any file under `src/agent/` changed in the PR, the PR must also include a change under `tests/production_scenarios/` OR include an ADR under `docs/adrs/` explaining why no scenario change is needed.

   Both parts blocking. Failure on either blocks merge to develop/main.

2. **Evidence grows from 3 → 4 artefacts.** Added "Coverage-exception ADRs" ledger so PA/ARB can audit which PRs were granted scenario-less-code-change exceptions. A PA who's been ADR-ing every change to escape the rule will be visible.

3. **The ADR escape hatch is intentional.** Some PRs legitimately don't need new scenarios — pure refactor, dependency bump, infrastructure tweak. The mechanism forces these to be explicitly justified, not silently elided.

### What's different from what the earlier simplification dropped

The previous simplification dropped the "coverage map (INDEX.md)" artefact. That decision still stands — INDEX.md was governance theatre (a separate index document that has to be manually maintained alongside scenario files). The new coverage check is different: it's a mechanical PR-diff inspection at CI time, with no parallel artefact to keep in sync.

### Honest framing for the principle

Full test coverage cannot be mechanically guaranteed for an LLM agent — production keeps inventing new shapes you've never seen. But every *code change* in the agent CAN be mechanically forced to either bring a matching scenario with it or document why it doesn't. That's the realistic enforceable version. The gap doesn't fully close; it gets significantly narrower.

### Files changed today (this entry)

- `principles.json` — PRIN_007 `gates` rewritten as two-part check; fourth evidence artefact added.
- `decisions.md` — this entry.

### Open items (carried forward)

- **Slide deck update.** Earlier "three artefacts" framing should become "four artefacts" — and the gate description in the slide should reflect the EXECUTION + COVERAGE two-part check.
- **Retrofit pattern revision.** The pattern for the other 15 principles should default to: one gate at the appropriate lifecycle point, that gate possibly two-part (execution + coverage), with 3–5 evidence artefacts. Avoid over-engineering, but don't simplify past the point of catching the dominant failure mode.

---

## 2026-05-24 (earlier latest) — PRIN_007 gates/evidence simplification: one gate, three artefacts

### Context

While drafting the PRIN_007 slide, the user pushed back on the original three-gate / seven-artefact structure. Two specific challenges landed:

1. The `quarterly_review` gate bundled three checks (scenario count growing, author distribution healthy, no stale @skip ADRs). The first two were governance theatre — gaming-prone metrics that don't reliably catch real failure. Only the stale-skip check earned its place.

2. The `pre_merge` and `pre_deploy` gates plus the separate "scenario directory" and "coverage map" evidence artefacts were over-engineered. If the harness *runs and passes* in CI, presence is implied — a missing folder or empty test set fails the run. Two layers collapse into one.

The user's framing: "if tests are present then it implies harness is also present" — correct, and the schema should reflect it.

### Decisions

1. **Gates collapsed from 3 to 1.** Single gate at `pre_merge`: harness runs against all scenarios, all must pass, folder must contain ≥N files. Presence and execution checked in one step.

2. **Evidence artefacts reduced from 7 to 3.** Kept: harness directory, latest CI run on develop/main, branch protection config. Dropped: coverage map (INDEX.md), deploy gate config (redundant with branch protection), scenario growth trend (gaming-prone), skipped scenario ADRs (governance theatre), author distribution (busywork).

3. **Implicit consequences for slide narrative.** The earlier slide framing of "seven mechanical artefacts ARB clicks" needs updating to "three mechanical artefacts." The "What Proves It Works" block in the slide deck is now shorter and sharper.

### Files changed today (this entry)

- `principles.json` — PRIN_007 `gates` and `evidence` blocks rewritten.
- `decisions.md` — this entry.

### Why this is the right call

The original seven artefacts were a kitchen sink. Three artefacts cover the actual failure modes: (a) does the harness exist with real content; (b) is it actually running and passing on recent merges; (c) is it enforced by the git host, not just hope. Anything else is governance dress-up.

PRIN_007 is now a tighter exemplar — easier to copy as the template for retrofitting the other 15 principles when their gates/evidence get authored.

### Open items (carried forward)

- **Slide deck update.** The Maven session slide showing the "seven evidence artefacts" needs the three-artefact version.
- **Retrofit pattern.** When the other 15 principles get their `gates` and `evidence` populated, default to the same shape: one or two gates max, three to five evidence artefacts max. Resist the urge to enumerate every conceivable check.

---

## 2026-05-24 (earlier latest) — Schema v1.3: `aws_mapping` field added to every principle

### Context

The previous entry committed to the Lens-as-universe model (`lens_mapping.md` as the working catalogue, our principles as 1:1 concretisations of AWS BPs). That entry flagged adding a `lens_anchor` field to the principle schema as a pending follow-up. This entry closes that follow-up.

### Decisions

1. **Field name is `aws_mapping`** (the user's chosen name during the conversation).

2. **Five sub-fields:** `lens`, `pillar`, `focus_area`, `question`, `best_practice`. Mirrors the AWS Lens hierarchy from outermost to most specific. Documented in `taxonomy.md` → AWS Mapping section.

3. **Field position:** between `impact_level` and `ownership` in each principle. Logical grouping with the other identifier/classification fields.

4. **Three mapping states:** verified, unverified, and EXTENSION (with closest-fit context recorded where applicable). All 16 principles now carry the field with explicit status. PRIN_007 ↔ GENOPS01-BP01 is the only fully verified mapping. Provisional mappings carry "(UNVERIFIED — needs side-by-side review)" markers. Extensions carry explicit EXTENSION markers in the field values, with the reason stated inline.

5. **Schema bumped to v1.3.** Notes block in `principles.json` updated to record the change. Backward-incompatible only in the sense that consumers may now rely on `aws_mapping` being present.

### Files changed today (this entry)

- `taxonomy.md` — added `aws_mapping` row to the schema field table and a new AWS Mapping subsection explaining the five sub-fields and the three mapping states.
- `principles.json` — `aws_mapping` added to all 16 principles. Format version bumped 1.2 → 1.3. Notes block extended.
- `decisions.md` — this entry.

### Verification

Grep confirms 16 `aws_mapping` blocks present, one per principle.

### Open items (carried forward)

- **Verification pass against AWS documentation.** Of the 16 mappings: 1 is verified (PRIN_007), 5 are unverified provisional mappings (PRIN_003, 005, 008 partially known; PRIN_002, 006, 011 mostly TODO), 4 are PRIN_004 + provisional context engineering judgements that need confirmation, and 6 are clearly marked EXTENSION (PRIN_009, 010 → Responsible AI Lens; PRIN_001 and PRIN_013–017 → context engineering / framework-specific outside AWS BP coverage). Each unverified mapping needs a side-by-side read of the AWS BP's implementation guidance against the principle's statement.
- **Update `lens_mapping.md`** with the same mapping states as `principles.json` so the two files stay in sync.
- **Decide what to do with the gates/evidence retrofit for the other 15 principles.** Still on the list from the v1.2 entry.

---

## 2026-05-24 (later, was previously labelled "latest") — Lens-as-universe model: our principles are 1:1 with AWS GenAI Lens best practices

### Context

While drafting the PRIN_007 slide (the "Life Without a Principle" deep-dive for the Maven session), the user surfaced the cleanest positioning the catalogue has had so far. We were trying to explain why our principle is "better" than AWS's GENOPS01-BP01, and ended up landing on a much sharper relationship: **the AWS Lens defines the universe of subject matter; our principles concretise each AWS best practice with the WHERE / WHO / WHEN / HOW that AWS leaves unspecified.**

The trigger was the user's observation: "you can pass the AWS checklist and still hit this failure." The FTSE retailer's architect was notionally satisfying GENOPS01-BP01 (they had a testing harness, ground truth data, periodic evaluation). The failure happened anyway because the harness was on their laptop. PRIN_007 raises the bar on the same subject matter.

### Decisions

1. **Adopt the Lens-as-universe model.** Hierarchy: `AWS Lens → Pillar → Question → Best Practice (= our principle)`. One AWS BP maps to one principle in our catalogue. Subject-matter coverage is set by AWS; specification depth is our value-add.

2. **`lens_mapping.md` is the working catalogue.** Lists every AWS BP (verified, partial, or TODO), with the mapping to our principle where one exists, and `UNMAPPED` where it doesn't. This file becomes a primary client-facing artefact: "Pick any AWS BP — here's the concrete enforceable version from our catalogue."

3. **Three categories of principle:**
   - **Mapped** — our principle directly concretises an AWS BP (e.g. PRIN_007 → GENOPS01-BP01).
   - **Extension** — our principle has no direct AWS BP analogue, either because AWS places it in a different Lens (Responsible AI Lens for PRIN_009 / PRIN_010) or because AWS doesn't address the topic at BP level (PRIN_001 LangGraph-specific patterns; PRIN_013–017 context engineering discipline).
   - **Future** — AWS BPs that have no principle yet. Each one is a candidate slot — either author a principle to fill it, or deliberately leave it out of scope.

4. **Add `lens_anchor` field to the principle schema.** Pending. Each principle should carry `{ lens, pillar_code, question_code, best_practice_code, best_practice_title }` so the 1:1 mapping is queryable from `principles.json` directly, not only via `lens_mapping.md`. Schema bump to v1.3 when this lands.

5. **AWS Lens revision tracking.** The Lens has been revised at least twice already (initial release 2025, updated revision 2025). Treat the AWS Lens as a versioned dependency — when AWS ships a new revision, `lens_mapping.md` must be re-verified end-to-end. Pillar names can change; questions can be re-numbered; new BPs can appear.

### Files changed today (this entry)

- `lens_mapping.md` — created. Scaffolded with verified content where AWS source was fetched (GENOPS01 + its two BPs), partial content where titles were extracted from search-result snippets, and TODO markers where the full content needs fetching. Our 16 principles' provisional mapping included where confidence allows.
- `decisions.md` — this entry.

### Why this is more than a cosmetic change

It re-positions the catalogue from "a parallel framework to AWS" to "the concrete enforcement layer on top of AWS." Two practical consequences:

1. **Client adoption gets easier.** Clients fluent in AWS already have a mental model — pillars, questions, best practices. We don't ask them to learn a new taxonomy. We say "here is your AWS Lens, here is the audit-ready version of each best practice."

2. **The catalogue's scope becomes well-defined.** Today our 16 principles are a selection from a vast possible space. With the Lens as the universe, "complete coverage" has a concrete meaning — every AWS BP either has a mapped principle or a documented decision to leave it out. The roadmap to a complete catalogue is now a checklist, not an open-ended exercise.

### Open items (carried forward)

- **Complete the AWS BP enumeration.** `lens_mapping.md` currently has verified content for GENOPS01 only. Every other pillar / question / BP needs verification from the live AWS documentation. Best done as a single dedicated session — fetch each pillar's TOC page, extract BPs, verify titles.
- **Verify the provisional mappings.** Several "Possibly **PRIN_X** — verify" entries in `lens_mapping.md` need confirmation: PRIN_004 ↔ GENOPS03-BP01, PRIN_005 ↔ GENOPS04-BP01, PRIN_003 ↔ GENSEC01-BP01, PRIN_008 ↔ GENSEC05-BP01. Each requires reading the BP's full guidance and the principle's full statement side by side.
- **Add `lens_anchor` field to all 16 principles in `principles.json`.** Schema v1.3.
- **Identify gap principles to author.** Once the Lens enumeration is complete, the unmapped AWS BPs become the principle backlog.
- **AWS Lens revision watch.** Set a reminder to re-verify `lens_mapping.md` when AWS publishes the next Lens revision. (Annual cadence likely.)

---

## 2026-05-24 (later) — Principle schema v1.2: `enforcement` retired, replaced by `ownership` / `gates` / `evidence`

### Context

While drafting Part 4 of the Maven lightning session (PRIN_007 deep dive), two cracks in the schema surfaced:

1. The `enforcement` field was conflating three orthogonal concerns: *what to do*, *when in the lifecycle*, and *what artefacts an auditor inspects*. Every principle's enforcement block read like a paragraph of mixed obligations rather than a clean structure.
2. The catalogue had no concept of *who* validates a principle. By default this meant ARB, which doesn't scale — auditing 16 principles × N projects per quarter is impossible and unnecessary. Most principles should be PA self-attested with mechanical evidence; ARB should only see portfolio-shaped ones.

The user's framing: "Project Architects must do their job too. So we need to somehow talk about principles that the project team must validate and then ones which are related to cost, legal etc which the EA team must handle. Otherwise, it is going to be a nightmare."

### Decisions

1. **Retire the `enforcement` field.** Its content was redistributed across three new fields. The legacy field is removed from all 16 principles.

2. **Add `ownership` block to every principle.** Two tiers:
   - `project` — Project Architect self-attests at every release with mechanical evidence. ARB watches an aggregate dashboard and spot-checks ~10% per quarter.
   - `enterprise` — ARB / Security / Legal / Finance validates at the relevant gate. PA cannot self-attest.

3. **Add `gates` block to every principle.** Array of `{ point, check, blocking }` triples. `point` is the lifecycle moment (`pre_commit`, `pre_merge`, `pre_deploy`, `release`, `quarterly_review`, `annual_review`, `incident_response`). `check` is binary. `blocking` indicates whether failure prevents progression.

4. **Add `evidence` block to every principle.** `{ artefacts, review_mode, sign_off }`. Each artefact is `{ name, location, check }` — `location` must be a clickable URL, file path, or git query that the validator inspects. `review_mode` is one of `mechanical_artefact_inspection`, `central_review_at_gate`, `automated_only`. `sign_off` is `binary` — if a principle needs a graded scale, it's two principles.

5. **PRIN_007 is the worked exemplar.** Three gates (pre_merge, pre_deploy, quarterly_review) and seven evidence artefacts (scenario directory, coverage map, latest CI build log, deploy gate config, scenario growth trend, skipped scenario ADRs, author distribution). The other 15 principles have `ownership` set but `gates: []` and `evidence.review_mode: "TODO_to_be_authored"` — retrofit pending.

### Ownership bucketing applied to the 16 principles

| Principle | Tier | Validator |
|---|---|---|
| PRIN_001 LangGraph node/utility separation | project | project_architect |
| PRIN_002 Prompt caching | enterprise | finance_and_arb |
| PRIN_003 Centralized LLM SDK | enterprise | enterprise_security |
| PRIN_004 Self-documenting data | project | project_architect |
| PRIN_005 Context lifecycle | project | project_architect |
| PRIN_006 Integration resilience | project | project_architect |
| PRIN_007 Production testing | project | project_architect |
| PRIN_008 Agent security framework | enterprise | enterprise_security |
| PRIN_009 Evidence-based decisioning | enterprise | legal_and_responsible_ai |
| PRIN_010 Multi-model bias mitigation | enterprise | legal_and_responsible_ai |
| PRIN_011 Ephemeral state | project | project_architect |
| PRIN_013 Context layering | project | project_architect |
| PRIN_014 Single source of truth | project | project_architect |
| PRIN_015 Channel discipline | project | project_architect |
| PRIN_016 Rule co-location | project | project_architect |
| PRIN_017 Deterministic assembly | project | project_architect |

Total: 11 project-owned, 5 enterprise-owned. Rule applied: a principle is `enterprise` if (1) failure spans multiple projects, (2) regulators are in scope, (3) a specialist function owns the underlying control, or (4) sign-off requires authority PA doesn't have.

### Rationale for the structural change

AWS WAF stops at the question ("How do you achieve consistent model output quality?"). It does not name *who* validates, *when* in the lifecycle, or *what artefacts* an auditor inspects. The user surfaced this directly while drafting the PRIN_007 slide: "this is all bullshit about 'should do' — how does ARB check if the project team HAS done it? apart from just a question item in the verification checklist?"

The new schema closes that gap and is the catalogue's actual differentiator vs WAF. PRIN_007 vs GENOPS01-BP01 is now the cleanest worked example: AWS says "build a testing harness with ground truth data"; PRIN_007 names the seven mechanical artefacts ARB clicks on and the three lifecycle gates that fire on every PR.

### Files changed today (this entry)

- `taxonomy.md` — added a "Principle Schema" section documenting `ownership` / `gates` / `evidence`, the two ownership tiers, the gate lifecycle points, the evidence review modes, and the rationale for retiring `enforcement`. PRIN_007 flagged as the exemplar.
- `principles.json` — schema bumped to v1.2. All 16 principles migrated: `enforcement` removed, `ownership` added per the bucketing above, `gates` and `evidence` added (full for PRIN_007, placeholders for the other 15).
- `decisions.md` — this entry.

### Open items (carried forward)

- **Gates and evidence retrofit for the other 15 principles.** PRIN_007 is the exemplar; the remaining 15 carry `gates: []` and `evidence.review_mode: "TODO_to_be_authored"`. Each needs its lifecycle gate points named and its mechanical evidence artefacts enumerated. Best done one principle at a time as they come into focus for the lightning session or consulting work — premature bulk retrofit will produce shallow content.
- **Verify the bucketing.** The project/enterprise split was reasoned through during this session but not stress-tested against real ARB workflows. Worth challenging with a real client's ARB lead before treating as final.
- **`responsible_ai_lens_crossref` field position.** Moved to the end of the object in this pass (was previously between `focus_area` and `impact_level` on PRIN_009 and PRIN_010). Confirm this is the desired schema position.

---

## 2026-05-24 — Taxonomy restructure to mirror AWS GenAI Lens

### Context

Previous taxonomy (A1–A4 areas, A11–A44 sub-areas) was a bespoke four-pillar structure. The decision today: mirror the AWS Well-Architected Generative AI Lens pillar names so clients fluent in AWS guidance can apply this catalogue without translation, and so the same mapping works for Azure-using clients (Azure WAF uses the same five pillar names).

### Decisions

1. **Five pillars, mirroring AWS WAF and Azure WAF**:
   - P1 — Operational Excellence
   - P2 — Security
   - P3 — Reliability
   - P4 — Performance Efficiency
   - P5 — Cost Optimization

2. **Sustainability omitted as a pillar.** Sustainability concerns distributed across P5 Cost Optimization (efficiency), P1 Operational Excellence (lifecycle), and P2 Security (data retention).

3. **Focus areas (formerly sub-areas) aligned to GenAI Lens question areas where possible.** GENOPS focus areas (P11–P15) match the Lens directly. GENSEC/GENREL/GENPERF/GENCOST focus area names are best-guesses pending verification against current Lens documentation.

4. **Responsible AI cross-referencing chosen over dual-Lens citation.** PRIN_009 (evidence-based decisioning) and PRIN_010 (multi-model bias mitigation) sit in P1 Operational Excellence with a `responsible_ai_lens_crossref` field noting AWS would place them in the separate Responsible AI Lens. Chose this option to keep the catalogue inside one Lens rather than spanning two.

5. **Legacy `domain` field removed** from all 16 principles. Nested `aigp.domain` (AIGP competency framework) retained — that is a separate cross-reference, not redundant.

### Files changed today

- `taxonomy.md` — rewritten end-to-end to use pillar / focus_area vocabulary and the five-pillar structure
- `principles.json` — added `pillar` and `focus_area` to all 16 principles; added `responsible_ai_lens_crossref` to PRIN_009 and PRIN_010; removed top-level `domain` from all 16

### Open items

- **Focus-area name verification.** GENSEC, GENREL, GENPERF, GENCOST focus area names in `taxonomy.json` (formerly `taxonomy.md`) are best-guesses based on AWS WAF conventions. Each carries `aws_alignment_status: "needs_verification"` on its focus_area object. Need to fetch each pillar section from the current GenAI Lens and confirm the exact question-area names before treating the focus-area taxonomy as locked.
- **`rationale.md` not yet drafted.** Three-part structure agreed: (1) the landscape of existing options grouped by shape, (2) the three properties that make a principle in this catalogue (focused, practical, specific), (3) the principle contract with a worked example. Target ~500 words. Positioning: this taxonomy can be applied as-is OR relabelled to any major standard since pillar names already match AWS and Azure.
- **`maturity_level` retrofit.** The schema in SKILL.md requires a `maturity_level` field for new principles, but PRIN_001–PRIN_017 don't carry it yet. One-shot retrofit pass outstanding.
- **PRIN_012 slot.** Still reserved and unfilled. Either author the principle (suggested title from notes: "Schema as the Authoritative Output Contract") or renumber PRIN_013–PRIN_017 down by one and update the reference inside PRIN_016.

### Why we're not just using AWS or Azure docs

For an upcoming class / consulting context, this catalogue is positioned as: AWS and Azure tell you *what* to aim for at a framework level; this catalogue gives engineering teams *what to check, what to block at which gate, and what evidence the ARB sees*. Pillar names match AWS/Azure so the structure is familiar; the principle shape (concrete violation examples + named enforcement mechanism) is what's net-new. PRIN_017 (Deterministic Prompt Assembly) is the canonical example showing the contrast — AWS gives "Maintain traceability" as a heading; PRIN_017 specifies the dry-run CLI, the assembled-prompt hash logging, the deployment block for non-deterministic inputs.

---

## How to use this log

Each session that produces a meaningful decision adds a dated entry at the top. Entries should capture: context, decisions made (numbered), files changed, open items, and any positioning / framing decisions that aren't captured by the file changes themselves.

When starting a new session, the recommended prompt is:

> "Read `taxonomy.json`, `principles.json`, and `decisions.md` to catch up on context, then we'll continue."
