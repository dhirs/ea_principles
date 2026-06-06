# AWS GenAI Lens — Best Practices Mapping

This file is the working catalogue of every best practice in the AWS Well-Architected Generative AI Lens, and the mapping from each AWS best practice to a principle in **our** catalogue.

## Methodology update — 2026-05-26

Principles now anchor at the AWS **implementation-step** level, not the BP level. Each AWS BP is decomposed into its constituent implementation steps, and each step receives a due-diligence pass deciding whether it is promoted to a standalone principle, merged into a sibling, or deliberately left as a documented gap. See `taxonomy.json` → `principle_schema.framework_mappings_spec.anchoring_methodology` for the full rationale.

This file is being converted to the new step-level due-diligence ledger format **one BP at a time**, as each BP is walked through. **GENOPS01-BP01** below is the first BP in the new format. The remaining BPs (GENOPS02 onward, all GENSEC / GENREL / GENPERF / GENCOST entries, the extension-principles table) are still in the legacy BP-level table format and reference the legacy catalogue (`principles_old.json`). They will be converted as their subject areas come into focus.

The diagram in "The model" below shows the legacy BP-level mapping for context. Read it as "one level shallower than what we actually do today."

## The model

```
AWS Well-Architected Generative AI Lens
        │
        ├── Pillar          (e.g. GENOPS — Operational Excellence)
        │       │
        │       ├── Question        (e.g. GENOPS01 — Model performance evaluation)
        │       │       │
        │       │       └── Best Practice   (e.g. GENOPS01-BP01 — Periodically evaluate
        │       │                                                  functional performance)
        │       │                                                       │
        │       │                                                       └── = OUR PRINCIPLE
        │       │                                                           (e.g. PRIN_007)
```

**One AWS best practice → one of our principles.**

AWS defines the universe of subject matter. Each AWS best practice has a title and a paragraph of implementation guidance, but does not specify:

- **WHERE** the artefact lives
- **WHO** validates it
- **WHEN** in the lifecycle it gates
- **HOW** you prove it works (what artefacts the auditor inspects)

Our principles fill those slots. Same scope, different level of specification. Where AWS gives a heading, our principle gives a contract.

## How to use this file

When a client asks "how does your catalogue relate to the AWS Well-Architected Framework?", point them at this file. Pick any AWS BP. We have (or are authoring) the concrete enforceable version.

When authoring a new principle, anchor it to an AWS BP. If no AWS BP exists in the relevant subject area, the principle is a deliberate extension (e.g. our Responsible AI cross-references — AWS would place those in the separate Responsible AI Lens).

## Status legend

- **VERIFIED** — fetched directly from AWS documentation, content confirmed
- **PARTIAL** — code and title confirmed from search results; full implementation guidance not yet verified
- **TODO** — not yet verified, included as placeholder
- **UNMAPPED** — no principle in our catalogue fills this slot yet
- **EXTENSION** — our principle has no direct AWS BP analogue (e.g. Responsible AI principles AWS places in a separate Lens)

---

## GENOPS — Operational Excellence

### GENOPS01 — Model performance evaluation [VERIFIED — step-level due-diligence format, 2026-05-26]

> *"How do you achieve and verify consistent model output quality?"*
>
> Achieving consistent model output quality involves periodic evaluations using user feedback, ground truth data, and sampling techniques.

#### GENOPS01-BP01 — Periodically evaluate functional performance [VERIFIED]

> *"Implement periodic evaluations using stratified sampling and custom metrics to maintain the performance and reliability of large language models."*

Per-step due-diligence. Each implementation step from the AWS BP carries one of three statuses: `promoted_to_principle: PRIN_NNN`, `not_promoted: <reason>`, or `pending_review`.

| Step | AWS title | Status | Notes |
|---|---|---|---|
| 1 | Create a ground truth dataset | **GO1B1-01** (v1.5.2) — promoted | Concretises step 1 by specifying: workload-repo residence, structured entries (input + expected decision + expected evidence trace), CI wiring for per-change evaluation. **Enterprise-tier** (reclassified 2026-05-31 under the new tier rubric — eval-core runner, diff tool, CI workflow template, manifest validator, scenario-schema validator all centralised); validator stays project_architect with mechanical self-attestation. Two pre_merge gates on harness existence + harness pass. Renamed 2026-05-27 from PRIN_001 under the BP-anchored ID convention (taxonomy.json conventions.principle_id_format). |
| 2 | Apply stratified sampling techniques | **GO1B1-02** (v1.3.2) — promoted | Concretises step 2 by specifying: strata manifest, per-stratum minimum example counts, per-stratum metric thresholds, per-stratum gating (not just aggregate), COVERAGE check coupling agent-code changes to strata-manifest changes. **Enterprise-tier** (reclassified 2026-05-31 — strata validator + per-stratum threshold checker + coverage lint all centralised); validator stays project_architect. Renamed 2026-05-27 from PRIN_002. |
| 3 | Establish periodic evaluation processes | **not_promoted** | Stripped of AWS's vendor-specific sub-bullets (Bedrock built-in evaluation, SageMaker Studio, fmeval library), step 3 has no architecturally distinct content. "Run the harness on a schedule" is absorbed by step 6 (a drift monitor that doesn't run on a cadence isn't a drift monitor). "Re-evaluate when new candidate models arrive or model customization applied" belongs in a future model-change-gate principle (likely emerging from step 5 or from GENOPS05). "Identify a single-threaded workload owner" is operating-model / RACI policy, not an architectural rule. First non-promotion in the catalogue. See decisions.md 2026-05-26 entry. |
| 4 | Define custom metrics | **GO1B1-03** (v2.0.2) — promoted | Concretises step 4 by specifying: metrics as named, encapsulated code units under `eval/metrics/` (one module per metric, stable interface, sibling unit tests); eval runner imports them and contains no inline scoring logic. **Enterprise-tier** (reclassified 2026-05-31 — metric-encapsulation lint + runner-import contract + sibling-unit-test template centralised; metric content remains project-local); validator stays project_architect. Two pre_merge gates on `eval/metrics/` existence + a lint forbidding metric-shaped definitions outside `eval/metrics/`. v2.0.0 rewrite — v1.x framing chased a "silent regression of verification chain" theory that failed `field_test_explain_prompt` across four industries (Retail / Airline / Fashion / Insurance — see GO1B1-03 v2.0.0 change_history); rewritten as a plain encapsulation rule. See decisions.md 2026-05-26 entry. Renamed 2026-05-27 from PRIN_003. |
| 5 | Perform model evaluations | **not_promoted** | Stripped of "perform the evaluation you already set up" framing, step 5 has no architecturally distinct content. The mechanical act of running ("input prompts" + "compare to ground truth") is concretised by GO1B1-01 gate 2 (harness runs and passes on PRs touching `src/agent/`). The longitudinal element ("analyze results to track performance over time") will be concretised by step 6's drift-monitor principle, which already absorbed the "run periodically" element non-promoted from step 3. Second non-promotion in the catalogue, after step 3. See decisions.md 2026-05-27 entry. |
| 6 | Monitor for performance drifts | **GO1B1-04** (v1.0.2) — promoted | Concretises step 6 by specifying: `eval/drift/config.yaml` declaring per-dimension metrics, baselines anchored to deployment, cadence, thresholds, alert routing; baseline-update coupling gate tying model-changing PRs to baseline refresh or ADR. Absorbs the "run periodically" element non-promoted from step 3. **Enterprise-tier** (reclassified 2026-05-31 — drift-detection infrastructure, baseline-storage schema, alert-routing integration, model-version coupling centralised; D1 borderline for regulated industries where MRM regs apply); validator stays project_architect. Two pre_merge gates. Authored 2026-05-27 (PRIN_004 at authoring time, renamed to GO1B1-04 the same day). |
| 7 | Regularly update the ground truth dataset | **GO1B1-05** (v1.0.0) — promoted | Concretises step 7 by specifying: `eval/refresh/config.yaml` declaring the refresh cadence + trigger conditions + named owner per cycle, `eval/refresh/log.yaml` as the audit trail, and two pre_merge CI gates coupling cadence enforcement and drift-alert response. Refresh closes the loop with step 6 (GO1B1-04) — drift detection without refresh discipline produces a permanently firing alert against a never-updated baseline. Project-tier; two pre_merge gates as required status checks on the integration branch. applicability: agentic-only (paired-narrow with GO1B1-01's harness scope); maturity: foundational. Authored 2026-05-27 end-to-end under the new agentflow sections/ + system_prompts/ structure; six new section rubrics authored alongside to enable the authoring (focus_area, impact_level, applicability, maturity_level, framework_mappings, explain_prompt). All implementation steps in GENOPS01-BP01 now mapped: 1, 2, 4, 6, 7 promoted; 3, 5 not_promoted. |

**BP-guidance (model-change re-evaluation) → GO1B1-06 (v1.0.0) — promoted.** Beyond the seven numbered steps, GENOPS01-BP01's implementation guidance directs: *"Run these evaluations when new candidate models are available, or when model customization techniques are applied."* This is the **model-change gate** earmarked in the step-3 not_promoted note above. GO1B1-06 — *Pin every model call to an immutable, catalogued version and re-run the evaluation harness before any version change ships* — concretises it: an approved model catalog + catalog-membership lint (no floating aliases), a runtime-refusing model SDK, and a pre_merge gate coupling any pinned-model-identifier change to a mandatory GO1B1-01 re-run. Enterprise-tier (D1=no borderline / D2=3); maturity scaling; impact High; applicability { llm/rag/agentic mandatory, ml nice_to_have }; serving_paradigm all four. Distinct from GO1B1-04 (drift): a discrete model swap is a step-change a window-to-window drift threshold can miss, with no per-PR trigger at all. step_promotion 3/3/3/3. `implementation_step: null` — anchors to the BP's guidance directive, not a numbered step (the seven steps are already concretised by GO1B1-01..05). Note: AWS ships **no dedicated BP for model versioning** (see GENOPS03 below); GO1B1-06's pin/catalog half is the model-side twin of GO3B1-01 and also concretises the GENOPS03 "model versioning" clause and the Reliability "standardized catalogs for prompts and models" design principle. Authored 2026-06-04.

#### GENOPS01-BP02 — Collect and monitor user feedback [VERIFIED]

UNMAPPED — pending walkthrough. No implementation steps decomposed yet.

### GENOPS02 — Monitor and manage operational health [VERIFIED]

> *"How do you monitor and manage the operational health of your applications?"*
>
> This focus area covers the strategies and tools used to track key metrics, set up alerts, and respond to issues across all layers of a generative AI application. While traditional monitoring best practices apply, foundation models interact with software and data differently than traditional systems, so the monitoring approach must extend to model-layer signals.

| Best Practice | Title | Our principle |
|---|---|---|
| GENOPS02-BP01 [VERIFIED] | Monitor all application layers | UNMAPPED |
| GENOPS02-BP02 [VERIFIED] | Monitor foundation model metrics | UNMAPPED |
| GENOPS02-BP03 [VERIFIED] | Implement solutions to mitigate the risk of system overload | UNMAPPED |

### GENOPS03 — Observability in workloads [VERIFIED]

> *"How do you maintain traceability for your models, prompts, and assets?"*
>
> Covers practices and tools for maintaining a structured approach to prompt engineering, model versioning, performance evaluation, testing variants, capturing baselines, and optimising against defined metrics and ground truth data.

> **Lens gap — model versioning has no dedicated BP.** GENOPS03's question names "your models, prompts, and assets" and the focus-area description names "model versioning," but GENOPS03 ships only two BPs: BP01 (prompt template management → GO3B1-01) and BP02 (tracing → GO3B2-01/02). The *model*-side of the question has no BP of its own. The model-version-lifecycle concern is partially covered by **GO1B1-06** (authored 2026-06-04 from GENOPS01-BP01's model-change re-evaluation guidance — pinning + approved-model-catalog + re-eval-on-change gate). A fuller model *registry* twin of GO3B1-01 (the model analogue of the prompt registry) remains an open extension candidate.

| Best Practice | Title | Our principle |
|---|---|---|
| GENOPS03-BP01 [VERIFIED] | Implement prompt template management | **GO3B1-01** (Route every model call through a registered, versioned prompt template via the central SDK) — authored 2026-06-03 from step 1 anchor (absorbing step 4 because SDK call-signature contract is inseparable from the registry). Legacy mappings PRIN_014 (Single Source of Truth for AI Context) and PRIN_017 (Deterministic Prompt Assembly) ruled out as distinct context-engineering extension concerns sitting outside GENOPS03-BP01's prompt-template-management scope. Steps 2/3 not_promoted (absorbed by GO1B1-01..05 eval-harness family — baseline performance evaluation and A/B variant testing). Steps 5/6 not_promoted (step 5 periodic review = process advice without commitable artefact, shape as GENCOST01-BP01 step 4 deferral; step 6 cross-team collaboration = mechanical consequence of step 1's central registry, style guidelines = coaching not gate). BP01 closed. |
| GENOPS03-BP02 [VERIFIED] | Enable tracing for agents and RAG workflows | **GO3B2-01** (Centralised Observability SDK for AI Workloads) — authored 2026-06-02 from step 1 anchor; PRIN_004 ruled out. **GO3B2-02** (Govern read access and retention on AI observability traces through a centrally-owned policy) — authored 2026-06-02 from step 2 anchor; sibling under P13. Steps 3–12 not_promoted (triaged 2026-06-01 — consumption advice / vendor menu / cross-pillar to GENPERF, GENSEC, GENOPS02). BP02 closed. |

### GENOPS04 — Automate lifecycle management [VERIFIED]

> *"How do you automate the lifecycle management of your generative AI workloads?"*
>
> Covers tool selection, CI/CD implementation, environment management, version control, and governance practices for creating reproducible, scalable, maintainable infrastructure for AI applications across development and deployment stages — with consistency, security, and regulatory compliance support.
>
> **Note on URL:** AWS publishes this focus area at `genops4.html` (no leading zero) while individual BPs use `genops04-bpXX.html` (with leading zero). Inconsistency within AWS's own URL scheme.

| Best Practice | Title | Our principle |
|---|---|---|
| GENOPS04-BP01 [VERIFIED title; full guidance not yet read] | Automate generative AI application lifecycle with infrastructure as code (IaC) | Possibly **PRIN_005** (Context Lifecycle Management) — verify; the BP is about IaC for the workload's infrastructure, not about lifecycle of context specifically, so the mapping may be partial |
| GENOPS04-BP02 [VERIFIED title; full guidance not yet read] | Implement GenAIOps to optimize the application lifecycle | UNMAPPED |

### GENOPS05 — Model customization [TODO]

All best practices to be enumerated from Lens documentation. BP01 title from search: "Learn when to customize models" — to be verified.

---

## GENSEC — Security

GENSEC pillar focus areas now VERIFIED from AWS documentation. Full BP detail still TODO for several focus areas (BP titles below extracted from search-result snippets where available).

### GENSEC01 — Endpoint security [VERIFIED focus area title]

> *Question text TODO — focus area covers endpoint security for foundation models and their data stores.*

| Best Practice | Title | Our principle |
|---|---|---|
| GENSEC01-BP01 [VERIFIED title] | Grant least privilege access to foundation model endpoints | Possibly **PRIN_003** (Centralized LLM SDK) — verify |
| GENSEC01-BP02 [TITLE FROM SEARCH] | Implement private network communication between foundation models and applications | UNMAPPED |
| GENSEC01-BP03 [VERIFIED title] | Implement least privilege access permissions for foundation models accessing data stores | UNMAPPED |
| GENSEC01-BP04 [VERIFIED title] | Implement access monitoring to generative AI services and foundation models | UNMAPPED |

### GENSEC02 — Response validation [VERIFIED focus area title]

> *Question text TODO. Full BP list TODO.*

### GENSEC03 — Event monitoring [VERIFIED focus area title]

> *Question text TODO. Full BP list TODO.*

### GENSEC04 — Prompt security [VERIFIED focus area title]

> *Question text TODO.*

| Best Practice | Title | Our principle |
|---|---|---|
| GENSEC04-BP01 [VERIFIED title] | Implement a secure prompt catalog | Possibly **PRIN_014** — verify |
| GENSEC04-BP02 [VERIFIED title] | Sanitize and validate user inputs to foundation models | UNMAPPED |

### GENSEC05 — Excessive agency [VERIFIED focus area title — note: NOT "Agentic security" as previously assumed]

> *Question text TODO — covers security for agentic workflows specifically, with the framing of "excessive agency" (preventing agents from doing more than they should).*

| Best Practice | Title | Our principle |
|---|---|---|
| GENSEC05-BP01 [VERIFIED title] | Implement least privilege access and permissions boundaries for agentic workflows | Possibly **PRIN_008** (Agent Security Framework) — verify |

### GENSEC06 — Data poisoning [VERIFIED focus area title]

> *Question text TODO. Full BP list TODO. This focus area was not previously enumerated in our file.*

---

## GENREL — Reliability [TODO]

All question areas and best practices to be enumerated from Lens documentation.

---

## GENPERF — Performance Efficiency

### GENPERF01 — Ground truth and performance metrics [PARTIAL]

> *Question text TODO.*

| Best Practice | Title | Our principle |
|---|---|---|
| GENPERF01-BP01 [PARTIAL] | Define a ground truth data set of prompts and responses | UNMAPPED (note: distinct from GENOPS01-BP01 — this is performance/latency focused, not functional correctness) |
| GENPERF01-BP02 [PARTIAL] | Collect performance metrics from generative AI workloads | UNMAPPED |

### GENPERF02–03 [TODO]

### GENPERF04 — Vector store performance [PARTIAL]

> *Question text TODO.*

| Best Practice | Title | Our principle |
|---|---|---|
| GENPERF04-BP01 [PARTIAL] | Test vector store features for latency and relevant performance | UNMAPPED |

---

## GENCOST — Cost Optimization

GENCOST pillar focus areas now VERIFIED from AWS documentation. Full BP enumeration still TODO.

### GENCOST01 — Model selection and cost optimization [VERIFIED — focus area title and question text both verified 2026-05-29]

> *"How do you select the appropriate model to optimize costs?"*
>
> Foundation model costs vary greatly across the various foundation model providers, model families and sizes, and model hosting paradigms. It may be advantageous to evaluate cost as a factor when selecting models. This question describes best practices to achieving cost-aware model selection.

#### GENCOST01-BP01 — Right-size model selection to optimize inference costs [VERIFIED — step-level due-diligence format, 2026-05-29]

> *"Foundation model costs vary greatly across the various foundation model providers, model families and sizes, and model hosting paradigms. It can be advantageous to use cost as a factor when selecting models. Understand the models available to you, as well as the requirements of your workload, to make an informed, cost-aware decision."*
>
> AWS-rated **Medium** risk if not established.

Per-step due-diligence. Each implementation step from the AWS BP carries one of three statuses: `promoted_to_principle: <ID>`, `not_promoted: <reason>`, or `pending_review`. First BP decomposed under the new step_promotion rubric (see `agentflow/sections/step_promotion/rubric.json` and decisions.md 2026-05-29 entry); steps 1/2 calls in this BP were used as calibration corpus for the rubric itself.

| Step | AWS title | Status | Notes |
|---|---|---|---|
| 1 | Identify the minimum performance requirements for a foundation model | **not_promoted** | AWS step 1 verbatim: "Identify the minimum performance requirements for a foundation model." Pure decision-process advice — work out the lowest bar before going shopping. No commitable artefact, no CI-gateable check. The requirements end up as content INSIDE step 3's selection ADR (which IS promoted as GC1B1-01), so the substance is not lost. Same shape as GENOPS01-BP01 step 5 non-promotion. Hand-applied step_promotion rubric: has_enforceable_artefact 3 / architecturally_distinct 3 / in_bp_scope 3 / not_vendor_menu 3 → ratify. See decisions.md 2026-05-29 entry. |
| 2 | Determine the models available which meet that minimum performance bar | **not_promoted** | The evaluated shortlist is intermediate evidence supporting the step 3 selection decision; promoting it separately produces a thin "shortlist exists" check with weak enforcement value. The shortlist lives inside the GC1B1-01 decision record. Hand-applied step_promotion rubric: not_promote ratified on architecturally_distinct grounds (substance absorbed by step 3's principle) and has_enforceable_artefact grounds (no standalone artefact survives extraction from the ADR). See decisions.md 2026-05-29 entry. |
| 3 | Select the most cost-efficient model based on the prioritized cost dimensions (like hosting paradigm, model size, or token cost) | **GC1B1-01** (v1.0.0) — promoted | Concretises step 3 by specifying: a versioned model-selection decision record at `model-selection/decision.md` (or equivalent ADR) under the workload repository, naming the requirements considered (absorbing step 1's substance), the candidates evaluated (absorbing step 2's substance), the chosen model, and the cost-aware rationale tied to the prioritized cost dimensions (hosting paradigm, model size, token cost). Two pre_merge CI gates as required status checks on the integration branch: (1) existence + content-completeness on the four required elements; (2) PR-coupling — any PR adding/changing a model reference under `src/` must touch the decision record (or include a linked ADR). Project-tier; impact_level Medium (matches AWS BP rating; principled outlier from the GO1B1 family's High because cost failures recover via re-selection); applicability { llm/rag/agentic: mandatory, ml: nice_to_have }; maturity_level foundational. Documentation-discipline only — code-vs-record consistency lint deliberately not implemented (acknowledged gap, user direction). Authored 2026-05-29. See decisions.md 2026-05-29 entry. |
| 4 | Continuously evaluate model selection to validate the highest performance is being achieved at the lowest possible price-point | **not_promoted** — deferred from catalogue scope (2026-05-29) | Deferred from catalogue scope on 2026-05-29 — see the corresponding deferral entry in decisions.md. Under the V1 step_promotion rubric this step scored promote (substance is architecturally distinct, in-scope, not vendor-menu; the rubric's not_promote shapes don't fit). The deferral is a meta-level catalogue scope choice overriding the rubric, per the taxonomy convention that the catalogue is a worked example and adopters are expected to inherit/override/extend. Rationale: the enforcement infrastructure required to make periodic re-evaluation auditable at portfolio scale (central LLM gateway with per-workload telemetry, workload registry, automated trigger rules, ticketing routing, ARB dashboard) is substantial platform-team work that exceeds the catalogue's current depth of treatment. Shipping the principle at small-scale form (calendar + review-config.yaml + review-log.yaml) would understate the enterprise enforcement work; shipping it with enterprise-tier ownership would assume infrastructure the catalogue does not treat. The discipline itself is real; adopters needing it can author their own principle following the sketch in decisions.md (cadence + triggers + named owner per cycle + audit-trail log) or rely on existing operational reviews. First documented override of the step_promotion rubric on meta-scope grounds. |

Net for GENCOST01-BP01: 1 promoted (GC1B1-01 v1.0.0 authored 2026-05-29); 3 non-promotions (steps 1, 2 absorbed by GC1B1-01 as content elements; step 4 deferred from catalogue scope on 2026-05-29 per decisions.md, first documented override of the step_promotion rubric on meta-scope grounds). BP01 closed.

### GENCOST02 — Generative AI pricing model [VERIFIED — step-level due-diligence format, 2026-05-29]

> *"How do you select a cost-effective pricing model (for example, provisioned, on-demand, hosted, or batch)?"*
>
> Foundation model hosting and inference can be conducted in a variety of ways. Some workloads demand immediate responses, while some can be done in batch. Some are hosted on unmanaged infrastructure, and some are hosted using serverless technologies. The inference and hosting paradigm selected influences total cost and should be done with cost in mind.

#### GENCOST02-BP01 — Balance cost and performance when selecting inference paradigms [VERIFIED]

> *"Hosting a foundation model for inference requires many choices, and many of these decisions can affect the cost of your workload. One of these choices includes the selection of a managed, serverless deployment of a foundation model against a self-hosted option."*
>
> AWS-rated **Medium** risk if not established.

Per-step due-diligence. Each implementation step from the AWS BP carries one of three statuses: `promoted_to_principle: <ID>`, `not_promoted: <reason>`, or `pending_review`.

| Step | AWS title | Status | Notes |
|---|---|---|---|
| 1 | Identify the nature of the demand for this workload | **not_promoted** | Decision-process advice; no commitable artefact, no CI-gateable check. Same shape as GENCOST01-BP01 step 1. The substance ends up as content INSIDE GC1B1-01's model-selection ADR (which already covers hosting paradigm as one of the prioritized cost dimensions). Hand-applied step_promotion rubric: 1/2/3/3 → not_promote on has_enforceable_artefact and absorbed-by-sibling grounds. |
| 2 | Compare the demand to the available hosting options, and remove the high-cost options that do not satisfy the workloads hosting requirements | **not_promoted** | Intermediate shortlist work product; same shape as GENCOST01-BP01 step 2. The shortlist lives inside GC1B1-01's decision record. Hand-applied step_promotion rubric: 1/2/3/3 → not_promote. |
| 3 | Select and test the available options that satisfy the workload requirements for latency, throughput, and response quality | **not_promoted** | Testing produces benchmark evidence; the evidence is rationale-content for GC1B1-01's selection ADR rather than a standalone artefact. Hand-applied step_promotion rubric: 1/2/3/3 → not_promote on absorbed-by-sibling grounds. |
| 4 | Implement the most appropriate, lower-cost hosting option for your model serving paradigm (for example, managed or self-hosted) | **not_promoted** | Architecturally redundant with GC1B1-01, which already names "hosting paradigm" as one of the prioritized cost dimensions in its model-selection decision record (statement.description, AWS step 3 verbatim_text, gates PR-coupling fires on `src/` changes to hosting paradigm). The architecturally_distinct dimension of the step_promotion rubric fails here: 1/3/3/3 → not_promote. Initial draft missed the sibling check and scored 3/3/3/3 → promote; cross-check against GC1B1-01 surfaced the redundancy mid-session. First documented sibling-redundancy not_promote in the catalogue; calibration corpus update worth recording for the step_promotion rubric. |

Net for GENCOST02-BP01: **0 promoted, all 4 steps absorbed by GC1B1-01.** BP01 closed.

#### GENCOST02-BP02 — Optimize resource consumption to minimize hosting costs [VERIFIED]

> *"Hosting a foundation model for inference requires myriad choices, all of which affect cost. These cost dimensions can be optimized to reduce cost while meeting performance goals."*
>
> AWS-rated **Medium** risk if not established.

Per-step due-diligence.

| Step | AWS title | Status | Notes |
|---|---|---|---|
| 1 | Identify the nature of the demand for this workload | **not_promoted** | Decision-process advice; verbatim-identical to BP01 step 1 (redundant on architecturally_distinct grounds too). Hand-applied step_promotion rubric: 1/1/3/3 → not_promote. |
| 2 | Deploy selected foundation model on acceptable infrastructure, even if it may be over-provisioned | **not_promoted** | Pre-condition / deploy-first-iterate-later process advice; no commitable artefact. Hand-applied step_promotion rubric: 1/2/3/3 → not_promote. |
| 3 | Establish an inference or demand profile for the hosted workload | **not_promoted** | Observation work product; substance is rationale-evidence for step 4's optimisation decision. Absorbed by GC2B2-01's right-sizing baseline (`infra/right-sizing/config.yaml` declares utilization_targets which IS the demand profile). Hand-applied step_promotion rubric: 2/2/3/3 → not_promote on absorbed-by-sibling grounds (same shape as BP01 step 3 → step 4 absorption). |
| 4 | Optimize the hosting infrastructure in accordance with the workload's demands, and select the most cost optimized infrastructure that meets performance requirements | **GC2B2-01** (v1.0.0) — promoted | Concretises step 4 by specifying: `infra/right-sizing/config.yaml` as the versioned baseline (target utilization bands, instance ceiling, scheduling/idle policy, reserved-capacity coverage target, model identifier + quantization precision); `infra/monitoring/utilization-alarms.yaml` as the versioned alarms; two pre_merge CI gates as required status checks on the integration branch — (1) existence + content-completeness on both files; (2) **code-vs-record consistency lint** parsing the workload's IaC (Terraform / CloudFormation / k8s manifests / docker-compose) and verifying actual GPU count / type / model / precision match the YAML AND that every declared alarm is deployed as an active monitoring resource. Gate 2 closes the documentation-discipline bypass that GC1B1-01 acknowledged but deliberately left open — declared baseline is binding against deployed infrastructure, not honour-system. Hand-applied step_promotion rubric: 3/3/3/2 (not_vendor_menu shaved by the AWS guidance's heavy HyperPod/EKS/Slurm/RI prose surrounding the generic step wording). Project-tier; impact_level Medium (matches AWS BP rating); applicability { llm/rag/agentic: mandatory, ml: nice_to_have }; **serving_paradigm { self_hosted_managed: mandatory, self_hosted_unmanaged: mandatory, api_provisioned: nice_to_have }** — first principle in the catalogue to use schema v1.9's new serving_paradigm field with a narrowed scope (api_on_demand omitted: no infrastructure to right-size on pure-API workloads). maturity_level mature (overridden from initial scaling draft after recognising Gate 2's code-vs-record consistency lint plus deployed-alarm verification is portfolio-tier engineering, not workload-tier — see GC2B2-01 v1.0.1 change_history; the maturity_level generator prompt was updated in the same session to add an explicit workload-vs-portfolio decision tree). AIGP III.B unverified. Authored 2026-05-29. See decisions.md 2026-05-29 entries for the schema v1.9 addition and the GENCOST02 walkthrough. |

Net for GENCOST02-BP02: **1 promoted (GC2B2-01 v1.0.0), 3 absorbed.** BP02 closed.

Net for GENCOST02 focus area: **1 promoted (GC2B2-01); 7 absorbed across both BPs.** Focus area closed.

### GENCOST03 — Cost-aware prompting [VERIFIED focus area title]

> *Covers controlling prompt lengths, response sizes, and token usage to minimise inference costs. Maps to catalogue focus area **P52 — Cost-aware Prompting** (created 2026-06-04, distinct from P51 Inference Cost Optimization). Question stem VERIFIED 2026-06-05: "How do you engineer prompts to optimize cost?" BP and step text below verified against the live AWS Lens page (BP01 fetched 2026-06-04; BP03 + BP-list fetched 2026-06-05).*

| Best Practice | Title | Our principle |
|---|---|---|
| GENCOST03-BP01 [VERIFIED] | Optimize prompt token length | **GC3B1-01** — Cap every prompt template at a declared token budget and fail builds whose token footprint exceeds it (anchors step 2; absorbs step 1) |
| GENCOST03-BP02 [VERIFIED] | Control model response length | UNMAPPED |
| GENCOST03-BP03 [VERIFIED] | Implement prompt caching to reduce token costs | **GC3B3-01** — Mark the cacheable static prefix of every reused prompt template and fail builds that leave a cache-eligible template uncached or mis-declare its prefix size (anchors step 2; absorbs step 1) |
| GENCOST03-BP04 [VERIFIED] | Annotate user input to enable cost-aware content filtering | **not_promoted** (no principle) — vendor-specific input-tag micro-optimisation; user-rejected 2026-06-05 |

**GENCOST03-BP01 decomposition (4 steps; risk: Medium):**

- **Step 1** — *Identify a verbose prompt which could be optimized.* → **not_promoted / absorbed** into GC3B1-01. A template that breaches its declared ceiling IS the identified verbose prompt — the Option A footprint gate surfaces it mechanically instead of by manual hunting. Decision-process / observation input, no standalone artefact (same shape as GENCOST01-BP01 step 1).
- **Step 2** — *Engineer the prompt to reduce the token count, trimming as many unnecessary words as possible.* → **promoted_to_principle: GC3B1-01.** step_promotion rubric 3/3/3/3. Concretised from coaching ("trim words") into an enforceable contract: a declared `runtime_token_budget.input` ceiling (reusing the GO3B1-01 manifest field) + a pre-merge footprint-vs-budget lint + a budget-inflation governance lint. Substrate GO3B1-01 (template registry + budget field) shipped 2026-06-03.
- **Step 3** — *Consider using a separate LLM to offer a shortened prompt (Amazon Bedrock Prompt Optimization).* → **not_promoted.** Vendor/technique suggestion; no architectural mandate survives extraction. An optional tool a team may use to author a shorter prompt, not a gate. Vendor specifics deferred to GC3B1-01's framework_mappings notes.
- **Step 4** — *Continue testing and optimizing the prompt to validate it meets the workload requirements (zero-shot / chain-of-thought / tree-of-thought / least-to-most).* → **not_promoted.** Prompt-engineering technique menu + process advice; no commitable artefact distinct from the GO1B1 eval-harness family. The "validate it meets requirements" slice is optionally absorbed by GC3B1-01's documented **Option B** (measured-from-eval-harness-fixtures), but the techniques themselves are coaching.

Net for GENCOST03-BP01: **1 promoted (GC3B1-01); step 1 absorbed; steps 3/4 not_promoted.** BP01 closed.

**GENCOST03 remaining BPs (UNMAPPED, not yet walked):**

- **BP02 — Control model response length.** Output-side analogue of BP01: declared `runtime_token_budget.output`, already capped via `max_tokens` by GO3B1-01, could be gated the same way. Natural future sibling.
- **BP03 — Implement prompt caching to reduce token costs** (risk: Medium; verbatim fetched 2026-06-05). **PROMOTED → GC3B3-01** (authored 2026-06-05). Anchors step 2 (enable caching / configure cache checkpoints); absorbs step 1 (identify caching opportunities) as the eligibility computation inside the gate — a template whose recomputed static prefix clears the model's minimum cache size IS the identified opportunity. The open question (does a CI-gateable artefact survive extraction, given caching looks like runtime config?) resolved YES via the manifest-derivable Option A: declare `cache.static_prefix_tokens` + a cache decision in the GO3B1-01 manifest, with a pre-merge lint that (1) requires the declaration, (2) requires cache-eligible templates to be checkpointed or opted out against `models/cache_minimums.yaml`, (3) recomputes the contiguous prefix tokenisation and fails on variance. Steps 3 (monitor caching metrics) and 4 (optimize cache usage) **not_promoted**: step 3 is realised as the optional Option C runtime telemetry alarm and belongs to the GO3B2 observability family; step 4 is tuning/process advice with no commitable pre-merge artefact. step_promotion 3/3/3/3. Distinct from GC3B1-01: opposite cost lever (GC3B1-01 fails prompts too big; GC3B3-01 caches big stable prefixes).
- **BP04 — Annotate user input to enable cost-aware content filtering** (verbatim fetched 2026-06-05; 7 steps; risk: Medium). **not_promoted — no principle authored.** The BP is a Bedrock-specific cost micro-optimisation: wrap only untrusted user spans in `<amazon-bedrock-guardrails-guardContent_xyz>` tags (with a random `tagSuffix`) so the input content filter scans the user input instead of the whole assembled prompt (system + retrieval + history), shrinking the moderation-pass token bill. Once the vendor mechanism is stripped, the residual architectural substance is thin — "scan only the untrusted input span" — and it does not survive as a durable, CI-gateable artefact distinct from the existing P52 siblings. Discussed and **rejected by the user on 2026-06-05** as a non-principle. Steps 4–6 (minimalist response scheme + hard response-length cap) are output-side concerns that belong to BP02 (Control model response length) / GC3B1-01's output budget, not here. GENCOST03 now closed: BP01 → GC3B1-01, BP02 → UNMAPPED (open sibling), BP03 → GC3B3-01, BP04 → not_promoted.

### GENCOST04 — Cost-informed vector stores [VERIFIED — focus area + question + BP list, 2026-06-06]

> *"How do you optimize vector stores for cost?" (verified 2026-06-06 from gencost04.html). "Generative AI architectures like Retrieval Augmented Generation (RAG) require a robust data backend to remain effective. Vector stores can add to the overall cost of running your application and should be optimized." Maps to catalogue focus area **P53 — Cost-informed Vector Stores** (created 2026-06-06). GENCOST04 ships exactly ONE BP (BP01) — the focus area is fully covered by GC4B1-01 and is closed.*
>
> Note: a vector-size concern also appears on the **performance** side at **GENPERF04-BP02 — Optimize vector sizes for your use case** (Vector store optimization focus area); that is the latency/accuracy analogue of this cost BP and a natural future GENPERF walk — the retrieval-quality testing not_promoted from GENCOST04-BP01 steps 3/4 lands there.

| Best Practice | Title | Our principle |
|---|---|---|
| GENCOST04-BP01 [VERIFIED] | Reduce vector length on embedded tokens | **GC4B1-01** — Use the smallest embedding vector that still retrieves well (anchors step 2; absorbs step 1; steps 3/4 not_promoted) |

**GENCOST04-BP01 decomposition (4 steps; risk: Medium; verbatim fetched 2026-06-06):**

- **Step 1** — *Identify the smallest vector length supported by the selected embedding foundation model.* → **not_promoted / absorbed** into GC4B1-01. The smallest-supported dimension is a model-card property the gate's declaration records against, surfaced mechanically rather than hunted; decision-process/observation input with no standalone artefact (same shape as GENCOST01-BP01 step 1 and GENCOST03-BP01 step 1).
- **Step 2** — *Embed data using the smallest vector length.* (sub: may modify chunk size / introduce overlapping chunks to maintain relevance) → **promoted_to_principle: GC4B1-01.** step_promotion 3/3/3/3. Concretised from advice ("use a smaller vector") into an enforceable contract: a declared per-vector-store record (`embedding_model` + `vector_dimension` + `quality_floor` + `quality_result`) + a pre-merge declaration/deployed-vs-declared consistency lint + a dimension-inflation governance lint. Distinct from GC1B1-01 (model-selection ADR): the cost lever is the vector store (storage/index/query), the dimension is independent of model choice (Matryoshka/MRL truncatable dims), and the choice is largely irreversible once indexed.
- **Step 3** — *Perform latency and load testing on your data retrieval workloads to verify that model response quality is still sufficient.* → **not_promoted.** Retrieval-quality testing; process advice whose substance overlaps the GO1B1 eval-harness family and the GENPERF04 (Vector store optimization) performance focus area. The "quality is still sufficient" slice is captured as the `quality_floor` + `quality_result` the GC4B1-01 declaration records (and optionally enforced by GC4B1-01's documented Option B), but the testing itself is not a commitable pre-merge artefact distinct from that number.
- **Step 4** — *Re-test with increased vector size or modified document chunking strategy to improve model response quality.* (sub: changing the search algorithm may also help) → **not_promoted.** Tuning / process advice (chunking strategy, search-algorithm choice) with no commitable pre-merge artefact; cross-touches GENPERF04 vector-store performance.

Net for GENCOST04-BP01: **1 promoted (GC4B1-01); step 1 absorbed; steps 3/4 not_promoted.** BP01 closed. **GENCOST04 focus area CLOSED** — the focus-area page (fetched 2026-06-06) lists exactly one BP (BP01), now mapped to GC4B1-01.

### GENCOST05 — Cost-informed agents [VERIFIED — focus area + question + BP list, 2026-06-06]

> *"How do you optimize agent workflows for cost?" (verified 2026-06-06 from gencost05.html). "Agentic architectures promise significant automation potential across domains. However, they can incur necessary additional cost if misconfigured." Maps to catalogue focus area **P54 — Cost-informed Agents** (created 2026-06-06). GENCOST05 ships exactly ONE BP (BP01) — the focus area is fully covered by GC5B1-01 and is closed.*

| Best Practice | Title | Our principle |
|---|---|---|
| GENCOST05-BP01 [VERIFIED] | Create stopping conditions to control long-running workflows | **GC5B1-01** — Give every agent a hard stop (anchors step 2; absorbs step 1; step 3 not_promoted) |

**GENCOST05-BP01 decomposition (3 steps; risk: High; verbatim fetched 2026-06-06):**

> AWS BP verbatim: *"Agentic workflows can be long-running, which can incur additional cost to your application. Develop controls to limit agents from running for extended periods of time without stopping."* Desired outcome: *"Maximum costs for an agent's runtime can be predicted based on the implemented stopping conditions."* **Risk: High** — notably higher than the Medium of every GENCOST01–04 BP.

- **Step 1** — *Estimate the maximum time needed for an agent to complete its runtime.* (sub: include model response, tool execution, and network latency) → **not_promoted / absorbed** into GC5B1-01. The runtime estimate is the number the declaration records (`estimated_max`), surfaced as a deliberate figure rather than hunted; decision-process/observation input with no standalone artefact (same shape as GENCOST01-BP01 step 1, GENCOST03-BP01 step 1, GENCOST04-BP01 step 1).
- **Step 2** — *Implement stopping conditions that enable an agent to run to the maximum duration.* (sub: a timeout mechanism like the one in Amazon Bedrock; alternatively in the prompt flow layer or within a software abstraction layer) → **promoted_to_principle: GC5B1-01.** step_promotion 3/3/3/3. Concretised from advice ("create stopping conditions") into an enforceable contract: a declared per-agent run-limits record (`max_steps` + `max_wallclock_seconds` + `max_run_token_budget` + `on_limit` + `estimated_max`) + a pre-merge declaration/wired-in-consistency lint + a ceiling-relaxation governance lint. The Bedrock timeout is one option among the explicitly named generic alternatives, so a vendor-neutral mandate survives extraction. Distinct from GO3B1-01 (`max_tokens` per call) and GC3B1-01 (prompt-token footprint): the cost lever is the number of steps and the duration of an agent run, the dimension that makes an agent's maximum spend predictable.
- **Step 3** — *Re-architect your workflows to facilitate stopping conditions.* (sub: set timeouts on external tools such as Lambda functions or API endpoints, verify prompts understand how to handle timeout responses; set token limits on model responses to simulate timeout functionality) → **not_promoted.** Two slices, neither distinct for the cost pillar: tool/Lambda/API-endpoint timeouts and "prompts understand how to handle timeout responses" are reliability-error-handling belonging to a future **GENREL** walk (cross-pillar); "set token limits on model responses" is already covered by GO3B1-01's per-call `max_tokens` cap and GC3B1-01's output budget (sibling-absorbed). Nothing architecturally distinct survives for cost.

Net for GENCOST05-BP01: **1 promoted (GC5B1-01); step 1 absorbed; step 3 not_promoted.** BP01 closed. **GENCOST05 focus area CLOSED** — the focus-area page (fetched 2026-06-06) lists exactly one BP (BP01), now mapped to GC5B1-01.

**Important gap for our catalogue:** The GENCOST pillar focuses on *within-workload* cost optimisation (model selection, prompt length, vector dims, agent stopping conditions). It does **not** address *cross-portfolio* concerns like vendor consolidation, multi-provider contract sprawl, or shared rate-limit pooling across projects — which are precisely the failure mode at the heart of the FTSE retailer's crack #3 ("12 AI Tooling Contracts"). This is a genuine extension space for our catalogue (PRIN_002 sits here, partially), not a concretisation of an existing AWS BP.

---

## GENSUS — Sustainability [INTENTIONALLY OMITTED FROM OUR CATALOGUE]

Sustainability is the sixth AWS pillar. Our catalogue omits it as a top-level pillar (see `taxonomy.json` and `decisions.md`). Sustainability concerns are distributed across our P5 Cost Optimization (efficiency), P1 Operational Excellence (lifecycle), and P2 Security (data retention) pillars.

The GENSUS best practices are catalogued here for completeness but are not expected to receive 1:1 principle mappings.

### GENSUS01 — Resource utilization [PARTIAL]

| Best Practice | Title | Our principle |
|---|---|---|
| GENSUS01-BP01 [PARTIAL] | Implement auto scaling and serverless architectures to optimize resource utilization | INTENTIONALLY UNMAPPED |

---

## FTSE Retailer Crack-to-BP Mapping (Maven Slide 15)

The 5 cracks from slide 4 of the Maven lightning session map to AWS GenAI Lens best practices as follows. Only verified BPs (titles confirmed from AWS docs) are listed.

| Slide 4 Crack | AWS BP(s) violated | Status |
|---|---|---|
| **1. 8 projects stuck in UAT** — quality in architect's head, non-functional layer rebuilt each project | **GENOPS01-BP01** — Periodically evaluate functional performance (the testing-harness BP). The "rebuilt non-functional layer" sub-issue partly touches **GENOPS04-BP01** (IaC for the workload lifecycle) but the core failure — no enforceable definition of "production-ready" — is **NOT IN THE LENS**. | GENOPS01-BP01 verified; meta-failure is an extension space (the catalogue itself fills it) |
| **2. Every incident investigation from scratch** — bespoke logging, no shared tooling | **GENOPS02-BP01** — Monitor all application layers, AND **GENOPS03-BP02** — Enable tracing for agents and RAG workflows. The standardisation-across-projects angle is partly addressed; the cross-project shared tooling/playbook angle extends beyond per-workload BPs. | Both BP titles verified |
| **3. 12 AI tooling contracts** — vendor sprawl, can't share capacity across projects | **NOT IN THE LENS at portfolio level.** GENCOST01–04 address within-workload cost optimisation but not cross-project vendor consolidation. GENSEC01-BP01 (least-privilege FM endpoint access) addresses per-project identity hygiene but not contract-level sprawl. Extension space — partially covered by PRIN_002 (Prompt Caching) and the broader P52 Vendor Consolidation focus area in our catalogue. | Verified gap |
| **4. Headcount up 4x** — 20 engineers doing bug fixes, zero new projects shipped | Aggregate consequence of cracks 1–3 compounding over multiple projects. No single BP — it's the compound interest from violating GENOPS01 + GENOPS02 + GENOPS03 across the portfolio. | n/a |
| **5. ARB reviewing blind** — no objective basis for "production-ready" | **NOT IN THE LENS.** AWS WAF / GenAI Lens assumes the consuming organisation has already established its definition of "production-ready" with measurable artefacts. The Lens provides best-practice questions to evaluate against, but does not specify the enforcement mechanism, the artefacts ARB inspects, or the gate structure. This is the catalogue's primary extension space — every principle in our catalogue carries `ownership`, `gates`, and (for enterprise-tier) `evidence` precisely to fill this gap. | Verified gap |

**Two key takeaways for slide 15:**

1. **Cracks 1 and 2 ARE addressed by AWS BPs** (GENOPS01-BP01, GENOPS02-BP01, GENOPS03-BP02, partly GENOPS04-BP01). The failure was implementation specificity — AWS told the retailer *what* to aim for but not *how* to enforce it. PRIN_007 closes this for crack 1; analogous principles need to be authored for crack 2.
2. **Cracks 3 and 5 are NOT in the Lens.** They are portfolio-level and meta-level failures that AWS doesn't address at the BP level. These are genuine extension spaces where our catalogue must author principles without an AWS anchor.

---

## Extension principles (our catalogue, no direct AWS BP analogue)

These principles in our catalogue have no direct AWS GenAI Lens best practice anchor. They are either (a) Responsible AI concerns AWS places in a separate Responsible AI Lens, or (b) engineering-discipline principles AWS doesn't address at the BP level.

| Our principle | Reason no AWS BP analogue exists |
|---|---|
| PRIN_009 — Evidence-Based Agent Decisioning | EXTENSION — AWS would place this in the Responsible AI Lens (Explainability dimension). Cross-referenced via `responsible_ai_lens_crossref`. |
| PRIN_010 — Multi-Model Orchestration for Bias Mitigation | EXTENSION — AWS would place this in the Responsible AI Lens (Fairness / Veracity dimension). Cross-referenced. |
| PRIN_013–PRIN_017 (context engineering principles) | EXTENSION — AWS GenAI Lens does not currently have BP-level coverage of prompt-context engineering discipline (scope layering, canonical sources, channel discipline, rule co-location, deterministic assembly). These are net-new contributions of our catalogue. Worth re-checking whether AWS adds these in future Lens revisions. |
| PRIN_001 — LangGraph node/utility separation | EXTENSION — AWS does not have framework-specific BPs at this level of granularity. Tool-agnostic AWS guidance does not address LangGraph patterns directly. |

---

## Outstanding work to complete this file

1. **Fetch every pillar's TOC page** from AWS Lens documentation. Enumerate every question and every BP, with their exact titles.
2. **Fetch the implementation guidance** for each BP — the paragraph or two of AWS advice under each one. Quote it verbatim where possible.
3. **Verify every "possibly maps to PRIN_X"** claim by reading the BP's full guidance and the principle's full statement side by side.
4. **Identify subject-area gaps** — BPs with no current principle mapping. For each, decide:
   - Author a new principle (concretise the AWS BP with WHERE/WHO/WHEN/HOW)
   - Leave deliberately unmapped (out of scope for our catalogue)
   - Add a cross-reference to a different Lens (Responsible AI Lens, etc.)
5. **Add a `lens_anchor` field** to each principle in `principles.json` containing the AWS BP code, title, question, and pillar. This makes the 1:1 mapping queryable.

---

## Versioning

When AWS publishes a new Lens revision, this file must be re-verified end-to-end. The AWS Lens has been updated at least twice (initial release 2025, updated revision 2025) — assume revisions roughly annually. Each new revision can add BPs, retire BPs, rename pillars, or restructure questions.
