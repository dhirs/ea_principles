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

#### GENOPS01-BP02 — Collect and monitor user feedback [VERIFIED — walked 2026-06-07]

> *"Supplement model performance evaluation with direct feedback from users. Implement continuous feedback loops to optimize application performance and enhance user satisfaction."* AWS risk **High**. Desired outcome: surface FM performance degradation as it happens **without** requiring ground truth data.

**not_promoted (whole BP) — no principle authored. User-directed 2026-06-07.** 4 steps:

| Step | AWS title | Status | Notes |
|---|---|---|---|
| 1 | For Amazon Q Business, set up user feedback collection | **not_promoted** | Vendor menu (PutFeedback API, DynamoDB, conversation logging to S3/CloudWatch/Firehose). Cleanest `not_vendor_menu` failure. |
| 2 | For Amazon Bedrock, set up user feedback collection | **not_promoted** | Vendor menu (S3 bucket, web form/API endpoint, Lambda processor, EventBridge trigger). |
| 3 | Establish a regular review process | **not_promoted** | Cadence/review-process advice (Step Functions pipeline, Bedrock LLM analysis, QuickSight dashboards). Same shape not_promoted at GENOPS03-BP01 step 5 / deferred at GENCOST01-BP01 step 4 — portfolio-scale cadence enforcement exceeds catalogue depth. |
| 4 | Implement and test improvements | **not_promoted** | Improve + A/B test; absorbed by the GO1B1 eval-harness family. |

The honest promote candidate — a **feedback-as-telemetry** contract (declare a feedback signal + emit through **GO3B2-01**'s `emit()` as a `user_feedback` event referencing the response `trace_id`, so a rising 👎 rate surfaces degradation with no golden dataset) — was constructed and rejected: it rides GO3B2-01 as substrate (feedback is just another event type on the existing emission stream, nothing architecturally distinct survives), and the only thing the BP uniquely adds — the feedback-capture UX — is exactly what no CI gate can prove. High AWS risk does not substitute for architectural distinctness. See decisions.md (latest) + lens_mapping_authored.md.

**GENOPS01 focus area CLOSED** — BP01 → GO1B1-01..06 (5 steps promoted + model-change guidance); BP02 → not_promoted.

### GENOPS02 — Monitor and manage operational health [VERIFIED]

> *"How do you monitor and manage the operational health of your applications?"*
>
> This focus area covers the strategies and tools used to track key metrics, set up alerts, and respond to issues across all layers of a generative AI application. While traditional monitoring best practices apply, foundation models interact with software and data differently than traditional systems, so the monitoring approach must extend to model-layer signals.

| Best Practice | Title | Our principle |
|---|---|---|
| GENOPS02-BP01 [VERIFIED — walked 2026-06-16] | Monitor all application layers | **not_promoted / absorbed** (whole BP; user-directed 2026-06-16). Verbatim re-fetched 2026-06-16. BP mandate: comprehensive monitoring + telemetry at *each layer* of the GenAI request path (service / prompt catalog / vector store / guardrails / model / knowledge graph / prompt flow / agent); monitor invocation counts, latency, token usage, error rates, throttling; CloudWatch alarms + dashboards; X-Ray / Bedrock Agent tracing. Two grounds: (1) the GenAI-distinct per-layer tracing slice is already owned by **GO3B2-01** ("Make every AI workload observable through one consistent channel" — emits telemetry on every model call / tool / retrieval, per-agent, through one shared AI-aware channel), with **GO3B2-02** governing trace access/retention; (2) the generic half (CloudWatch dashboards, threshold alarms, X-Ray request-flow tracing) is base-WAF application telemetry — AWS's own Resources cross-reference **OPS04-BP02 (Implement application telemetry)**. The one slice that could have survived — a per-layer *coverage gate* (assert no declared layer is uninstrumented) — was raised and set aside: GO3B2-01's emission contract already carries per-layer span coverage, so nothing CI-gateable survives extraction distinct from it. step_promotion 3/3/3/3 → not_promote. See lens_mapping_authored.md + decisions.md (latest). |
| GENOPS02-BP02 [VERIFIED — walked 2026-06-16] | Monitor foundation model metrics | **not_promoted / absorbed** (whole BP; user-directed 2026-06-16). Verbatim re-fetched 2026-06-16. BP mandate: continuous monitoring + alerting on FM metrics for performance / security / cost — catch "data drift, model degradation, and security threats"; steps are EventBridge automated responses, Bedrock model-invocation logging (InputTokenCount / OutputTokenCount / InvocationThrottles), SageMaker Model Monitor, dashboards. Every named concern is already owned: **data drift / model degradation → GO1B1-04** (drift monitor — per-dimension metrics, deployment-anchored baselines, thresholds, alert routing); **token / invocation / throttle telemetry → GO3B2-01** (one-channel emission) + the **GENCOST** family (cost lens); **security threats → GENSEC03-BP01** territory (already not_promoted). The mechanics (EventBridge / Bedrock invocation logging / SageMaker Model Monitor / CloudWatch dashboards) are a vendor menu + base-WAF **OPS08** (analyze workload metrics). The one candidate-distinct slice — a mandate to emit *model-layer* signals specifically — is GO3B2-01's emission contract again. step_promotion 3/3/3/3 → not_promote. See lens_mapping_authored.md + decisions.md (latest). |
| GENOPS02-BP03 [VERIFIED — walked 2026-06-16; revisited 2026-06-23] | Implement solutions to mitigate the risk of system overload | **PARTIAL: rate-limiting/throttling thrust not_promoted; step 4 idempotency slice → GO2B3-01 (PROMOTED 2026-06-23).** Live AWS title (re-fetched 2026-06-23) is "Implement **solutions to mitigate the risk of system overload**". BP mandate: throttling + API Gateway rate limiting; exponential backoff with jitter; AWS SDK retry mechanisms; retry logic with idempotent operations; Step Functions for complex retry workflows; circuit breaker patterns; CloudWatch monitoring. The dominant resilience-engineering thrust stays **not_promoted/absorbed**: **retries / exponential backoff / circuit breakers → GR3B1-01**; **generic throttling / API Gateway / Step Functions → base-WAF REL05**; **model-provider TPM/RPM throughput quotas → GENREL01**. BUT step 4 verbatim — *"Implement idempotent operations where possible to facilitate safe retries"* — is a GenAI-distinct, enforceable slice that was flagged during the GR3B2-01 walk (2026-06-22) as a separate not-yet-authored standard both GR3B1-01's retries and GR3B2-01's safe-termination defer to. Promoted 2026-06-23 as **GO2B3-01** (Make every side-effecting tool call safe to retry) — user chose the GENOPS02-BP03 anchor (where "idempotent operations" is verbatim) over GR3B2-02/GR3B1-02 in the Reliability family. step_promotion 3/3/3/3 (idempotency slice). This **reopens GENOPS02** (was 0 principles). See data/authored/GO2B3-01.md + decisions.md (latest). |

**GENOPS02 status — REOPENED 2026-06-23, now 1 principle (was CLOSED/ZERO 2026-06-16).** BP01 (monitor all layers) not_promoted/absorbed (GO3B2-01/02 emission + base-WAF OPS04-BP02); BP02 (monitor FM metrics) not_promoted/absorbed (GO1B1-04 drift + GO3B2-01 telemetry + GENCOST + GENSEC03); BP03 — rate-limiting/throttling thrust not_promoted/absorbed+cross-pillar (GR3B1-01 + base-WAF REL05 + GENREL01), **but step 4's idempotency slice promoted 2026-06-23 → GO2B3-01**. The monitoring questions still yield nothing beyond the GO3B2 observability family / GO1B1-04 drift; the one enforceable GenAI-distinct slice in the whole focus area is BP03 step 4's safe-retry idempotency contract.

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
| GENOPS04-BP01 [VERIFIED — walked 2026-06-07] | Automate generative AI application lifecycle with infrastructure as code (IaC) | **not_promoted** (whole BP; AWS risk High; user-directed 2026-06-07). Generic IaC/DevOps discipline owned by the base WAF — AWS's own Resources cross-reference five base OPS BPs (OPS05-BP01/08/10, OPS06-BP03/04). 7 steps: step 1 tool-selection + vendor menu (CDK/CloudFormation/Terraform); steps 2/3/5 textbook IaC; step 4 CI/CD vendor menu (CodePipeline/Jenkins); step 6 governance vendor menu (AWS Config/Service Catalog); step 7 audit-process advice. GenAI veneer is thin (Bedrock resource templating, HyperPod recipes); the GenAI-distinct slice (model catalog / prompt registry / eval infra as code) is already owned by GO3B1-01 + GO1B1-06 + GC2B2-01. Stale provisional "possibly PRIN_005" mapping removed (mis-fit). See decisions.md + lens_mapping_authored.md. |
| GENOPS04-BP02 [VERIFIED — walked 2026-06-07] | Implement GenAIOps to optimize the application lifecycle | **not_promoted** (whole BP; AWS risk High; user-directed 2026-06-07). Umbrella BP — AWS's own "common concerns" (CI/CD, prompt management, artifact versioning, model upgrades, evaluation, monitoring) are each already owned: prompt mgmt → GO3B1-01; model versioning → GO1B1-06; evaluation → GO1B1-01..05; monitoring → GO3B2-01/02; CI/CD → base WAF (+ BP01); step-5 feedback loop → GENOPS01-BP02. The uniquely-here FMOps/LLMOps training-pipeline half is a vendor menu (SageMaker Pipelines / managed MLflow / Model Registry / Clarify / Code*) and narrow (only teams training/fine-tuning their own models). Cross-refs base WAF OPS (OPS05-BP01/07/10). See decisions.md + lens_mapping_authored.md. |

**GENOPS04 focus area CLOSED — zero principles.** Both BPs are AWS-rated High risk yet neither yields GenAI-distinct enforceable architecture: BP01 is generic IaC/DevOps owned by the base WAF; BP02 is a GenAIOps umbrella whose concerns are each already concretised by existing principles (GO3B1-01 / GO1B1-06 / GO1B1-01..05 / GO3B2-01/02) plus an FMOps training-pipeline vendor menu. A clean worked-example result, paralleling the GENPERF pillar.

### GENOPS05 — Model customization [VERIFIED — walked + CLOSED 2026-06-16]

> *"GENOPS05: How do you determine when to execute generative AI model customization?"* (verified 2026-06-16 from genops05.html). Ships exactly **one** BP (BP01). Focus area CLOSED — 0 promoted.
>
> Note: the model-customization *cost/efficiency* angle lives in the **Sustainability** pillar (**GENSUS01-BP02** "Use efficient model customization services" — parameter-efficient fine-tuning, managed customization services), out of scope for the current walk.

| Best Practice | Title | Our principle |
|---|---|---|
| GENOPS05-BP01 [VERIFIED — walked 2026-06-16] | Learn when to customize models | **not_promoted / absorbed** (whole BP; user-directed 2026-06-16). BP mandate: prioritize **prompt engineering and RAG before model customization** — begin with prompt engineering, progress to RAG, then fine-tuning, then custom models, escalating only as task specificity / data availability / resource constraints demand; avoid expensive customization when a cheaper technique suffices. This is **decision-process advice** ("think before you customize, prefer the cheap path") — the same shape not_promoted at GENCOST01-BP01 step 1 ("identify minimum requirements") and GENCOST02-BP01/02 steps 1–2: no commitable artefact, no CI-gateable check. The substance is rationale-content for a decision record, and **GC1B1-01** (the model-selection ADR) is its natural home — a "why we are (or aren't) customizing" justification sits inside that record. Adjacent owned pieces: **GO1B1-06** (model-change gate, if a custom model ships) + **GS6B1-01** (training-data purification, once customization happens). The one slice with a faint promote pulse — a justify-before-you-train ADR gate — collapses into GC1B1-01's record. step_promotion 3/3/3/3 → not_promote. See lens_mapping_authored.md + decisions.md (latest). |

**GENOPS05 focus area CLOSED 2026-06-16 — 1 BP, not_promoted (decision-process advice absorbed by GC1B1-01).**

**GENOPS pillar FULLY WALKED — 10 standards (updated 2026-06-23, was 9).** GENOPS01 → GO1B1-01..06 (6 standards; BP02 not_promoted); GENOPS02 → **GO2B3-01** (1 standard — BP03 step 4 idempotency, promoted 2026-06-23; reopened from CLOSED/0; BP01/BP02 + BP03's rate-limiting thrust still not_promoted); GENOPS03 → GO3B1-01 + GO3B2-01 + GO3B2-02 (3 standards); GENOPS04 → CLOSED, 0 (generic IaC + GenAIOps umbrella); GENOPS05 → CLOSED, 0 (decision-process advice). The Operational Excellence pillar yields its enforceable GenAI architecture entirely through the eval (GO1B1), prompt-registry (GO3B1), and observability (GO3B2) families; its monitoring, lifecycle-automation, and customization-decision questions resolve to those families + base-WAF discipline.

---

## GENSEC — Security

GENSEC pillar focus areas now VERIFIED from AWS documentation. Full BP detail still TODO for several focus areas (BP titles below extracted from search-result snippets where available).

### GENSEC01 — Endpoint security [VERIFIED — question + BP list 2026-06-07]

> *"GENSEC01: How do you manage access to generative AI endpoints?" (verified 2026-06-07 from gensec01.html). Foundation models are available through managed, serverless, or self-hosted endpoints; each paradigm has its own security considerations. Ships 4 BPs.*

| Best Practice | Title | Our principle |
|---|---|---|
| GENSEC01-BP01 [VERIFIED — walked 2026-06-07] | Grant least privilege access to foundation model endpoints | **not_promoted** (whole BP; AWS risk High; user-directed 2026-06-07). Generic IAM least-privilege owned by the base WAF Security pillar — AWS's own Resources cross-reference five base BPs (SEC02-BP01/02/06, SEC03-BP01/02). 4 steps: custom IAM policy on endpoint ARNs → role + permission boundary + trust policy → verify → Q Developer subscription access. The one GenAI-distinct slice (org-layer SCP/RCP "block models you haven't approved") is already owned by **GO1B1-06**'s approved-model catalog at the code layer that matters — GO3B1-01's no-inline-call AST lint already catches direct in-repo model calls, so the IAM layer's residual ("lock down stray account identities") is generic SEC03 hygiene, not GenAI-distinct. Stale "possibly PRIN_003" mapping removed (mis-fit: PRIN_003 is call-routing via a central SDK, not IAM endpoint permissions). See decisions.md + lens_mapping_authored.md. |
| GENSEC01-BP02 [VERIFIED — walked 2026-06-07] | Implement private network communication between foundation models and applications | **not_promoted** (whole BP; AWS risk High; user-directed 2026-06-07). Pure network security (PrivateLink, VPC endpoints, private subnets, security groups) owned by the base WAF Security pillar — AWS cross-references SEC05-BP01/02. Three steps are generic VPC-endpoint setup, identical for any AWS service; the GenAI-flavoured "FM reaches its vector store/agent tools privately" line is generic perimeter, no GenAI-distinct artefact. See decisions.md + lens_mapping_authored.md. |
| GENSEC01-BP03 [VERIFIED — walked 2026-06-07] | Implement least privilege access permissions for foundation models accessing data stores | **GS1B3-01** (Never retrieve what the user isn't allowed to see) — **PROMOTED 2026-06-07; first Security-pillar principle, 16th in the catalogue.** Anchors step 4 (least-privilege access policies on specific vector-store data), absorbs steps 1–2, operationalises the metadata-filtering guidance. Concretises the one GenAI-distinct, sibling-unowned slice of BP03 — RAG **retrieval-time per-query authorization**: acl label per document at ingestion + central retrieval SDK applying an IdP-derived identity pre-filter + AST lint banning direct multi-tenant store calls + quarterly security label-audit. Distinct from generic IAM (store reachability, not per-chunk retrieval) and from base-WAF data discipline (SEC03/07/08). First D1=yes / first central_review_at_gate principle. Honest enforcement limit (lint enforces plumbing not label correctness) recorded in enforcement_limits.md. Steps 5/6 not_promoted; step 3 PII-removal half deferred 2026-06-07, then **promoted 2026-06-10 → GS1B3-02** (Never ingest what the model should never process) — second standard from this BP, the catalogue's first one-BP-two-standards case: GS1B3-01 governs WHO retrieves (read gate, step 4), GS1B3-02 governs WHAT enters the store (write gate, step 3 — declared sanitisation stage ahead of the vector store, routed-ingestion AST lint, per-run audit, quarterly seeded-PII audit). See decisions.md + lens_mapping_authored.md. |
| GENSEC01-BP04 [VERIFIED — walked 2026-06-07] | Implement access monitoring to generative AI services and foundation models | **not_promoted** (whole BP; AWS risk High; user-directed 2026-06-07). Decomposes into three already-owned buckets: generic access logging + alerting (CloudTrail / CloudWatch alarms / Security Hub / S3 retention) = base-WAF security monitoring (cross-refs SEC03-BP08); vendor menu (steps 1–4: Bedrock invocation logging / Q activity capture / Q Business log delivery / SageMaker logging); GenAI telemetry (trace every model call / tool / retrieval, per-agent) already owned by GO3B2-01 + GO3B2-02. End-user-attribution slice noted as a recommended `end_user_id` field on GO3B2-01's payload (absorbed, not promoted). See decisions.md + lens_mapping_authored.md. |

**GENSEC01 focus area CLOSED 2026-06-07 — updated 2026-06-10: 2 promoted (both from BP03: GS1B3-01 step 4, GS1B3-02 step 3), 3 BPs not_promoted.** BP01 (least-priv IAM to endpoints) not_promoted (generic base-WAF IAM, approved-models slice owned by GO1B1-06); BP02 (private network) not_promoted (generic base-WAF network, SEC05); BP03 (FM access to data stores) → **GS1B3-01** promoted (RAG retrieval-time authorization — the one GenAI-distinct slice); BP04 (access monitoring) not_promoted (base-WAF logging + vendor menu + GO3B2 telemetry). The Security endpoint-security question yields exactly the RAG retrieval-authorization principle; the rest is generic base-WAF IAM/network/logging discipline.

### GENSEC02 — Response validation [VERIFIED — question + BP list 2026-06-07; CLOSED]

> *"GENSEC02: How do you stop generative AI applications from generating harmful, biased, or factually incorrect responses?" (verified 2026-06-07 from gensec02.html). Ships exactly ONE BP (BP01). Focus area CLOSED — 1 promoted.*

| Best Practice | Title | Our principle |
|---|---|---|
| GENSEC02-BP01 [VERIFIED — walked 2026-06-07] | Implement guardrails to mitigate harmful or incorrect model responses | **GS2B1-01** (Put every model response through a guardrail) — **PROMOTED 2026-06-07; second Security principle, 17th in the catalogue.** Anchored whole-BP (steps are vendor-console walkthroughs; mandate is in the implementation guidance). Concretises runtime OUTPUT validation — unowned by any sibling (GO1B1 eval / GO3B2 observability / GO3B1 input / GS1B3-01 retrieval): declare a guardrail config (content/toxicity/denied-topics/PII filters; grounding on for RAG; on_trip fallback) + route every response through the guardrail wrapper on GO3B1-01's SDK + three pre_merge lints (declaration / routed-output AST / grounding-for-RAG) + quarterly efficacy red-team. Scope: content/safety + grounding-vs-retrieved-context only; backend-correctness verification OUT of scope (app-side business logic); input-side injection → GENSEC04. Enforcement limit (lint = wiring not efficacy) per enforcement_limits.md. See decisions.md + lens_mapping_authored.md. |

**GENSEC02 focus area CLOSED 2026-06-07 — 1 BP, promoted (GS2B1-01).**

### GENSEC03 — Event monitoring [VERIFIED — question + BP list 2026-06-07; CLOSED]

> *"GENSEC03: How do you monitor and audit events associated with your generative AI workloads?" (verified 2026-06-07 from gensec03.html). Ships exactly ONE BP (BP01). Focus area CLOSED — 0 promoted.*

| Best Practice | Title | Our principle |
|---|---|---|
| GENSEC03-BP01 [VERIFIED — walked 2026-06-07] | Implement control plane and data access monitoring to generative AI services and foundation models | **not_promoted** (whole BP; AWS risk High; user-directed 2026-06-07). Broad monitoring umbrella (performance / quality / security / cost / audit-trail / compliance) via CloudTrail + CloudWatch. Generic control/data-plane monitoring owned by base WAF (cross-refs SEC04-BP01); vendor menu; sub-concerns each already owned (telemetry/audit → GO3B2-01/02, eval → GO1B1, cost → GENCOST); overlaps GENSEC01-BP04 (access monitoring, not_promoted). No GenAI-distinct artefact. See decisions.md + lens_mapping_authored.md. |

**GENSEC03 focus area CLOSED 2026-06-07 — 1 BP, not_promoted.**

### GENSEC04 — Prompt security [VERIFIED focus area title]

> *Question text TODO.*

> *"GENSEC04: How do you secure system and user prompts?" (verified 2026-06-07 from gensec04.html). Ships two BPs.*

| Best Practice | Title | Our principle |
|---|---|---|
| GENSEC04-BP01 [VERIFIED — walked 2026-06-07] | Implement a secure prompt catalog | **not_promoted** (whole BP; AWS risk Medium; user-directed 2026-06-07). The catalog itself is already owned by **GO3B1-01** (registered, versioned prompt templates via the central SDK); BP01's only addition is generic IAM access control on the catalog (least-priv on prompt actions, separation of duties = base WAF + GO3B2-02 pattern) + a Bedrock Prompt Management vendor walkthrough. Provisional "possibly PRIN_014" resolved to GO3B1-01 + generic IAM. See decisions.md + lens_mapping_authored.md. |
| GENSEC04-BP02 [VERIFIED — walked 2026-06-07; REVISITED + promoted 2026-06-07] | Sanitize and validate user inputs to foundation models | **promoted_to_principle: GS4B2-01** — Put every user input through a guardrail before it reaches the model. Input-side mirror of GS2B1-01 (output side): every user-influenced model-calling path declares an input-guardrail config (injection + prompt-extraction screening), size/rate limits, and an on_trip action, and routes user input through the input-guardrail wrapper; a pre-merge AST lint forbids passing raw user input to a model call that bypasses it; quarterly injection red-team for efficacy. New focus area **P23 — Prompt Security**. Context-boundary delimiter deferred to GO3B1-01's template registry (dependency). step_promotion 3/3/3/3. Initially not_promoted (user-deferred) earlier the same day, then revisited and authored. See decisions.md + lens_mapping_authored.md. |

**GENSEC04 focus area — 2 BPs, 1 promoted** (BP01 not_promoted, owned by GO3B1-01 + generic IAM; BP02 promoted → GS4B2-01).

### GENSEC05 — Excessive agency [VERIFIED — question + BP list 2026-06-08; CLOSED]

> *"GENSEC05: How do you avoid excessive agency for models?" (verified 2026-06-08 from gensec05.html). Excessive agency is an OWASP Top-10 LLM threat, typically introduced through agentic architectures — an agent takes actions beyond its intended purpose (not malicious, an unintended consequence of automation; the agent has little knowledge beyond the prompt of what is permitted). Ships exactly ONE BP (BP01). Focus area CLOSED — 1 promoted.*

| Best Practice | Title | Our principle |
|---|---|---|
| GENSEC05-BP01 [VERIFIED — walked 2026-06-08] | Implement least privilege access and permissions boundaries for agentic workflows | **GS5B1-01** (Put every consequential agent action through a gate before it runs) — **PROMOTED 2026-06-08; fourth Security principle, 19th in the catalogue.** Anchored whole-BP (implementation_step null): steps 1-3 are generic IAM least-privilege construction (scoped policies, resource ARNs, permission boundaries, trust-policy conditions — AWS Resources cross-ref SEC02-BP01/02/06 + SEC03-BP01/02, the same base-WAF BPs that drove the GENSEC01-BP01 not_promote); the GenAI-distinct mandate lives in the implementation guidance + step 4 (user confirmation for agent actions). Concretises agent ACTION authorization — the one GenAI-distinct, sibling-unowned slice: every agent declares a tool manifest (each tool `scope` + `class` read/write + a `gate` for writes), the agent loop executes tools only through a central wrapper, three pre-merge lints (declaration completeness / routed-execution AST lint / consequential-implies-gated, incl. unattended-write-needs-policy) + a quarterly agent red-team. THE ACTION-side member of the Security guardrail family: GS4B2-01 input, GS2B1-01 output, GS1B3-01 retrieval (read), this = what the agent DOES (write). New focus area **P24 — Agentic Action Control**. Gate has two forms — `confirm` (human-in-loop) or `policy:<name>` (deterministic, unattended) — so it holds for triggered/batch agents with no human. IAM half (steps 1-3) NOT re-linted: becomes the enforcement behind the manifest's `scope` (per-tool least-privilege execution role), depended on not reinvented. Enforcement limit (lint proves declared+routed+gated, not honest classification / minimal scope) per enforcement_limits.md. Legacy PRIN_008 (Agent Security Framework) formally ruled out (historical-only; not the specific action-authorization contract). step_promotion 3/3/3/3. See decisions.md (latest) + lens_mapping_authored.md. |

**GENSEC05 focus area CLOSED 2026-06-08 — 1 BP, promoted (GS5B1-01).**

### GENSEC06 — Data poisoning [VERIFIED — question + BP list 2026-06-10; CLOSED]

> *"GENSEC06: How do you detect and remediate data poisoning risks?" (verified 2026-06-10 from gensec06.html). Data poisoning occurs during model training or customization when data not meant for training is used, intentionally or by mistake; poisoning is successful once the model has learned from poisoned data — difficult to detect, challenging to remediate. Ships exactly ONE BP (BP01). Focus area CLOSED — 1 promoted.*

| Best Practice | Title | Our principle |
|---|---|---|
| GENSEC06-BP01 [VERIFIED — walked 2026-06-10] | Implement data purification filters for model training workflows | **GS6B1-01** (Never train a model on data no one has examined) — **PROMOTED 2026-06-10; fifth Security principle, 20th in the catalogue.** Anchored whole-BP (implementation_step null): the mandate lives in the implementation guidance ("Data should be examined and cleaned for content which may be considered poisonous before introducing that data to a training job"); steps 2+3 carry the promotable core (policy-derived filter declaration + filters for biased/factually-incorrect/hateful/violent/irrelevant content), step 1 is observation input, step 5 is the wired pipeline stage, steps 4/6 are consider-advice absorbed as filter options. Concretises training-data purification — the LEARNING-side member of the Security guardrail family (GS4B2-01 input, GS1B3-01 retrieval, GS2B1-01 output, GS5B1-01 action; this = what the model learns, the only face irreversible by rollback): a purification manifest (`training/purification/config.yaml` — policy-derived categories, per-category filter/threshold/on_flag, audit destination) + the purification stage wired ahead of the job (job consumes purified output only, incl. managed-API fine-tunes) + three pre_merge lints (declaration completeness / policy coverage / source coupling with audit-hash matching) + a quarterly seeded-poison audit on GO1B1-01's harness. New focus area **P25 — Training Data Integrity**. Narrow applicability resolved honestly: all four patterns mandatory, binding the training/customization path; no-training-path workloads satisfy vacuously (the GS5B1-01 no-action-surface shape). Post-training toxicity eval absorbed by GO1B1 family; training-env isolation = base-WAF; the GENSEC01-BP03 PII slice kept SEPARATE (retrieval corpus ≠ training corpus). Enforcement limit (lints prove declared/covered/wired/logged, not that filters catch poison) per enforcement_limits.md. step_promotion 3/3/3/3. See decisions.md (latest) + lens_mapping_authored.md. |

**GENSEC06 focus area CLOSED 2026-06-10 — 1 BP, promoted (GS6B1-01). GENSEC pillar now FULLY WALKED: GENSEC01–06 all closed; 5 promoted (GS1B3-01, GS2B1-01, GS4B2-01, GS5B1-01, GS6B1-01). The security pillar yields the five-face guardrail family: input, retrieval, output, action, learning. Open residue resolved 2026-06-10: the GENSEC01-BP03 step-3 PII-removal deferral was promoted as **GS1B3-02** (anchored to step 3 itself — the earlier 'no Lens home' framing was wrong). No open security-pillar residue remains; 6 security standards total.**

---

## GENREL — Reliability [PARTIAL — GENREL01/02/03/04 walked; GENREL05/06 TODO]

Reliability pillar (verified 2026-06-15 from reliability.html). Six focus areas: GENREL01 — Manage throughput quotas; GENREL02 — Network reliability; GENREL03 — Prompt remediation and recovery actions; GENREL04 — Prompt management; GENREL05 — Distributed availability; GENREL06 — Distributed compute tasks. Design principles: distributed resilience, robust error management, standardized prompt/model catalogs, intelligent scalability. The pillar names "Inconsistent model performance" (variations in output for similar inputs) as a common challenge — the runtime face of non-determinism — which lands here in GENREL03 rather than in the GENOPS eval family.

> Note: GENREL04 (Prompt management) walked 2026-06-23 — both BPs not_promoted (BP01 prompt catalog → GO3B1-01; BP02 model catalog → GO1B1-06). GENREL05/06 (distributed availability / compute) remain unwalked. To be enumerated as the pillar comes into focus.

### GENREL01 — Manage throughput quotas [walked 2026-06-22; not_promoted → ADR]

> *"GENREL01: How do you manage throughput quotas?"* (focus area + BP title verified 2026-06-22 via search; live BP page not fetchable — docs.aws.amazon.com web_fetch timed out, no Chrome connected. mapping_state **unverified**.)
>
> Ships **one** BP per search enumeration (confirm count on a verification pass).

| Best Practice | Title | Our standard |
|---|---|---|
| GENREL01-BP01 [UNVERIFIED — walked 2026-06-22] | Scale and balance foundation model throughput as a function of utilization | **not_promoted 2026-06-22 (user-directed).** AWS risk High. BP: match throughput to utilization — on-demand vs provisioned capacity, client-side rate limiting, quota/latency monitoring, periodic quota reassessment. **No distinct enforceable AI-specific principle survives.** The only CI-gateable artefact (a client-side rate limiter) cannot protect a *shared* account/region quota — a local limiter runs per process, so N instances each capped at X sum to N·X; a real shared ceiling needs a global rate-limiting gateway (parallel backend the org won't build) and per-client allocation is operational/political, not architectural. Substance lands elsewhere: throttling recovery (429 retry+backoff) → **GR3B1-01**; cross-region throughput balancing → **GENREL05-BP01**; provisioned-vs-on-demand capacity (a buy decision) → adjacent **GC2B2-01**; account isolation → generic multi-account landing-zone governance (base-WAF). The clean fix is account isolation (each project its own provider account/key → own quota + per-project billing) plus reserved capacity for critical traffic — neither a repo artefact. step_promotion **3/3/3/3 → not_promote**. Recommendation captured as an ADR at **data/adr/GENREL01-throughput-quotas.md**. (Was also flagged as the home for GENOPS02-BP03's deferred provider-quota slice — that slice likewise resolves to account isolation + GO3B2-01 monitoring, no new gate.) |

**GENREL01 status:** BP01 → not_promoted (ADR). Focus area CLOSED.

### GENREL02 — Network reliability [walked 2026-06-22; not_promoted]

> *"GENREL02: How do you optimize for network reliability?"* (focus area + BP title verified 2026-06-22 via search; live BP page not fetchable — web_fetch timed out, no Chrome connected. mapping_state **unverified**.)
>
> Ships **one** BP per search enumeration (confirm count on a verification pass).

| Best Practice | Title | Our standard |
|---|---|---|
| GENREL02-BP01 [UNVERIFIED — walked 2026-06-22] | Implement redundant network connections among model endpoints and supporting infrastructure | **not_promoted 2026-06-22 (user-directed).** The GenAI-Lens relabel of base-WAF **REL02-BP02** (provision redundant connectivity): multi-AZ deployment, PrivateLink VPC endpoints, redundant Direct Connect / VPN tunnels, NLB across AZs, BGP dynamic routing. **Generic network redundancy — nothing AI-specific** beyond "model endpoints" standing in for any other endpoint. The verbatim is a **vendor menu** (PrivateLink / Direct Connect / VPN / multi-AZ), and there is **no commitable repo artefact or CI gate** — network topology is infra/landing-zone, not a workload-repo lint. Fully **absorbed by base-WAF REL02** (the shape that closed most of GENPERF). The one adjacent angle — keeping inference traffic off the public internet via private connectivity to model endpoints — is a **security** concern (GENSEC network-isolation), to be considered in a GENSEC walk, not a reliability principle here. No ADR (no AI-specific recommendation to capture; guidance is "follow base-WAF REL02"). step_promotion **3/3/3/3 → not_promote**. |

**GENREL02 status:** BP01 → not_promoted (base-WAF REL02). Focus area CLOSED.

### GENREL03 — Prompt remediation and recovery actions [VERIFIED — walked 2026-06-15]

> *"GENREL03: How do you implement remediation actions for generative AI workload loops, retries, and failures?"* (verified 2026-06-15 from genrel03.html)
>
> Two BPs: BP01 (recover gracefully from failure) and BP02 (timeout mechanisms on agentic workflows).

| Best Practice | Title | Our standard |
|---|---|---|
| GENREL03-BP01 [VERIFIED — walked 2026-06-15] | Use logic to manage prompt flows and gracefully recover from failure | **GR3B1-01** (Recover gracefully when a model call goes wrong) — **PROMOTED 2026-06-15; first Reliability standard, 22nd in the catalogue; opens pillar P3 + focus area P31.** Anchored whole-BP (implementation_step null): steps 1-2 (error classification + recovery mechanisms — retries with exponential backoff, fallback templates, circuit breakers) are the concretised core; step 3 monitoring rides GO3B2-01's emit channel; step 4 is continuous-improvement process advice (no commitable artefact). Stripped of the Bedrock Flows vendor menu (iterator/condition nodes), the surviving rule is provider-neutral: every model call sits behind a layer that validates the response against an expected shape, retries retryable failures with backoff, and returns a declared fallback on exhaustion. The GenAI-distinct slice that survives base-WAF REL05-BP01 (generic graceful degradation) is AWS's own "classify responses as actionable or not ... to reduce non-determinism" — validating non-deterministic model output, which a normal typed API never needs. This is the **runtime face of non-determinism** the catalogue lacked (the GO1B1 family covers non-determinism only as an eval/drift discipline) AND the home for **retries** — two of the four "reason about reliability and cost like a Staff engineer" concerns collapse here. Sibling distinction: GS2B1-01 governs output SAFETY (not structural usability/recovery); GC5B1-01 governs agent RUN LENGTH (not single-call failure). Contract: per-call recovery spec (`output_schema` + `retry` + `fallback`) + central wrapper (`call_model` on the central LLM SDK) + two pre_merge lints (declaration completeness, routed-execution AST — the GO3B1-01 no-inline pattern on the call plane) + quarterly recovery-effectiveness review over emitted fallback-rate telemetry. Enterprise-tier (D1=no / D2=3 — the tier rubric's own "Centralised LLM SDK" example). step_promotion 3/3/3/3. Enforcement limit appended to enforcement_limits.md. See decisions.md (latest). |
| GENREL03-BP02 [VERIFIED — walked 2026-06-15; promoted 2026-06-22] | Implement timeout mechanisms on agentic workflows | **GR3B2-01** (Don't let a stalled agent hang forever) — **PROMOTED 2026-06-22 (unparked); 24th standard; second under GENREL03; the reliability twin of GC5B1-01.** AWS risk High. Parked 2026-06-15 ("do BP01 only"); unparked and promoted this session as a **standalone** reliability twin (user-directed, over folding a wall-clock dimension into GC5B1-01). The GenAI-distinct rule: a **wall-clock deadline on the whole run** across a model-chosen tool sequence, which fires even when a dependency returns nothing. SIBLING DISTINCTION: GC5B1-01 caps run LENGTH (iterations/steps/tokens) and is structurally blind to an agent idle on an unresponsive tool — no steps/tokens accrue while it waits; GR3B1-01 recovers a single call that *returns* an error, whereas this fires when nothing returns; base-WAF REL05-BP05 is a *per-call* timeout that cannot bound a run whose length the model decides at runtime. SCOPE (user-directed "Option 1" — keep it narrow): deadline + graceful termination + DLQ, with a safe-termination rule that defaults to **no auto-retry** (a run killed at tool 10 already fired tools 1-9; replay would double-fire side effects). Tool-call **idempotency** is split out as a distinct, not-yet-authored standard; when it lands, the safe-termination lint relaxes to "retry allowed only if all tool calls are idempotent". ARTEFACT: the **agent run config** (same artefact GC5B1-01's caps use; NOT the prompt YAML), per-tool timeouts on each tool binding. Contract: `wall_clock_deadline` + per-tool `timeout` + `on_timeout` (`terminate`/`dead_letter`) + central agent harness applies it by construction + three pre-merge lints (declaration completeness, safe-termination, routed-execution AST) + quarterly timeout-effectiveness review over GO3B2-01 telemetry. Enterprise-tier (D1=no / D2=3 — central agent harness). step_promotion **3/3/3/3**. Enforcement limit appended to enforcement_limits.md. Also absorbs GENCOST05-BP01 step 3's deferred tool/Lambda timeout residue. See decisions.md (latest). |

**GENREL03 status:** BP01 → GR3B1-01 (promoted); BP02 → GR3B2-01 (promoted 2026-06-22). **Focus area CLOSED.**

### GENREL04 — Prompt management [VERIFIED — walked 2026-06-23; both BPs not_promoted]

> *"GENREL04: How do you maintain versions for prompts, model parameters, and foundation models?"* (live pages fetched 2026-06-23 — genrel04.html, genrel04-bp01.html, genrel04-bp02.html. mapping_state **verified**.)
>
> Two BPs: BP01 (prompt catalog) and BP02 (model catalog). Both the Reliability-framed twins of existing Operational-Excellence standards.

| Best Practice | Title | Our standard |
|---|---|---|
| GENREL04-BP01 [VERIFIED — walked 2026-06-23] | Implement a prompt catalog | **not_promoted 2026-06-23.** AWS risk Medium. The Reliability-framed twin of **GO3B1-01** ("Treat prompts as governed assets") — AWS restates under Reliability the centralized, versioned prompt store with rollback that GO3B1-01 already mandates (registry schema `id/version/body/variables/output_schema/model/runtime_token_budget/owner/status`, no-inline lint). Step-map: BP01 step 1 (catalog structure) + step 2 (versioning/rollback) + step 5 (governance) → GO3B1-01 verbatim; step 3 (testing → release-to-live on passing thresholds) → **GO1B1-01** eval harness. 4 of 5 steps already discharged. **Residual slice:** GO3B1-01 binds a single `model` + token budgets but NOT (a) validated sampling-hyperparameter ranges (temperature/top_p/top_k) per prompt version, nor (b) a prompt×model-version test matrix — genuinely absent, but resolves to a **GO3B1-01 schema extension** (optional `hyperparameter_ranges` + `model_compatibility` fields, existence-linted; the "validated against" half rides GO1B1-01), not a new standard. step_promotion **3/3/2/3 → not_promote** (not_vendor_menu 2 — BP01 is generic mandate, absorption not vendor-menu is the basis). Recommendation captured as an ADR at **data/adr/GENREL04-prompt-catalog.md**. |
| GENREL04-BP02 [VERIFIED — walked 2026-06-23] | Implement a model catalog | **not_promoted 2026-06-23.** AWS risk Low. The Reliability-framed twin of **GO1B1-06** ("Know which model you're running") — AWS restates the approved, immutable, versioned model catalog with rollback that GO1B1-06 already mandates (every model ref resolves to a `models/catalog.yaml` entry, exact immutable versions, floating aliases banned, catalog-membership lint, re-eval-on-change gate). Step-map: BP02 step 1 (structure) + step 2 (tracking) + step 4 (governance) + step 5 (maintenance) + step 6 (validation) → GO1B1-06 (+ GO1B1-01 harness, GO3B2-01 monitoring). 5 of 6 steps already discharged. **Residual slice:** step 3 (**model cards** — capabilities/limitations, training-data characteristics, intended use, ethical considerations/biases) is a governance-doc artefact, partly **responsible-AI/GENSEC**, not a reliability gate → resolves to an optional `model_card` field on GO1B1-06's entry schema + a flagged GENSEC candidate, not a new standard. step_promotion **3/3/2/3 → not_promote**. Recommendation captured as an ADR at **data/adr/GENREL04-model-catalog.md**. |

**GENREL04 status:** BP01 → not_promoted (GO3B1-01 + ADR); BP02 → not_promoted (GO1B1-06 + ADR). **Focus area CLOSED — zero new standards, two schema-extension ADRs.**

---

## GENPERF — Performance Efficiency

### GENPERF01 — Establish performance evaluation processes [question VERIFIED 2026-06-07; CLOSED]

> *"GENPERF01: How do you capture and improve the performance of your generative AI models in production?"* (verified 2026-06-07 from genperf01.html)
>
> Ships **two** BPs — both not_promoted 2026-06-07. Focus area CLOSED.

| Best Practice | Title | Our principle |
|---|---|---|
| GENPERF01-BP01 [VERIFIED 2026-06-07] | Define a ground truth data set of prompts and responses | **not_promoted / absorbed by GO1B1 family.** Same golden prompt–response dataset + harness GO1B1-01/02/03 already mandate (and GO1B1-05's refresh = the "living artifact" line). The earlier "distinct from GENOPS01-BP01, performance/latency focused" note does NOT hold — the verbatim is task/response-quality eval over the same dataset, not latency. User directed not_promote 2026-06-07. See lens_mapping_authored.md. |
| GENPERF01-BP02 [VERIFIED 2026-06-07] | Collect performance metrics from generative AI workloads | **not_promoted / absorbed.** Decomposes into GO3B2-01 (emit telemetry/traces), GO1B1 harness + GO1B1-04 drift (quality over time), generic infra observability the base WAF owns (cross-refs PERF05 + MLPER), and process/vendor advice (OpenLLMetry/CloudWatch/fmeval/MLflow). SLO-as-code promote case rejected (same alert-threshold substance not_promoted at GENPERF02-BP01). User directed not_promote 2026-06-07. |

> **GENPERF pillar CLOSED 2026-06-07; fully walked 2026-06-16 — yields ZERO principles.** Every GENPERF BP (01-BP01/02, 02-BP01/02/03, 03-BP01, 04-BP01, 04-BP02) resolved to either generic infrastructure discipline owned by the base Well-Architected framework (PERF05 / ML lens MLPER), a performance-framed restatement of an already-authored GENOPS eval (GO1B1) / observability (GO3B2) / GENCOST (GC4B1-01) principle, or a technique/vendor menu. The GenAI performance pillar adds no enforceable architecture beyond what GENOPS + GENCOST already mandate. (GENPERF04-BP01 walked + not_promoted 2026-06-16 — the last open BP; pillar now 100% walked.)

### GENPERF02 — Maintaining model performance [question VERIFIED 2026-06-07; CLOSED]

> *"GENPERF02: How do you verify your generative AI workload maintains acceptable performance levels?"* (verified 2026-06-07 from genperf02.html)
>
> Ships **three** BPs — all not_promoted 2026-06-07. Focus area CLOSED.

| Best Practice | Title | Our principle |
|---|---|---|
| GENPERF02-BP01 [VERIFIED 2026-06-07] | Load test model endpoints | **not_promoted** (risk Medium). Generic performance engineering already owned by the base WAF (`PERF05-BP04`) + ML lens (`MLPER`), with only a thin GenAI veneer; promote-able core splits into observability (GO3B2) + the GO1B1 eval harness + the UNMAPPED GENPERF01-BP01, leaving a thin process-shaped pre_deploy test. Serving-paradigm-narrow (self-hosted/provisioned only). User directed not_promote 2026-06-07. See lens_mapping_authored.md. |
| GENPERF02-BP02 [VERIFIED 2026-06-07] | Optimize inference parameters to improve response quality | **not_promoted** (risk Low). Hyperparameter tuning = experimentation/technique advice; the only gateable slice ("pin inference params per template") is absorbed into GO3B1-01's prompt-template manifest. User directed not_promote 2026-06-07. |
| GENPERF02-BP03 [VERIFIED 2026-06-07] | Select and customize the appropriate model for your use case | **not_promoted / absorbed.** Performance-framed twin of GC1B1-01 (the "AI usage document" IS its model-selection ADR) + GO1B1 eval harness + GO1B1-06 (re-test on new model); routing/fine-tuning/distillation are a vendor/technique menu. Nothing architecturally distinct survives. User directed not_promote 2026-06-07. |

### GENPERF03 — Optimize consumption of high-performance compute [question VERIFIED 2026-06-07; CLOSED]

> *"GENPERF03: How do you optimize computational resources required for high-performance distributed computation tasks?"* (verified 2026-06-07 from genperf03.html)
>
> Ships exactly **one** BP.

| Best Practice | Title | Our principle |
|---|---|---|
| GENPERF03-BP01 [VERIFIED 2026-06-07] | Use managed solutions for model hosting, customization, and data access where appropriate | **not_promoted** (risk Medium). Vendor menu — steps 2–5 are a service-selection tree (Bedrock / SageMaker endpoints / managed customization / HyperPod); step 1 is decision-process advice; step 6 is GENSEC/IAM data-access (cross-pillar). Only bites for the minority of GenAI teams self-hosting inference; the dominant managed-API RAG/agent pattern satisfies it by default with nothing to gate. Promote case (managed-by-default ADR) rejected — near the serving_paradigm axis, operational-governance not architecture, no vendor-neutral anchor. step_promotion would fail not_vendor_menu + has_enforceable_artefact. User directed not_promote 2026-06-07. **Focus area CLOSED.** See lens_mapping_authored.md. |

### GENPERF04 — Vector store optimization [VERIFIED — CLOSED 2026-06-16]

> *"GENPERF04: How do you improve the performance of data retrieval systems?"* (verified 2026-06-07 from genperf04.html)
>
> Ships exactly **two** BPs (BP01, BP02). Both not_promoted. **Focus area CLOSED 2026-06-16.**

| Best Practice | Title | Our principle |
|---|---|---|
| GENPERF04-BP01 [VERIFIED — walked 2026-06-16] | Test vector store features for latency and relevant performance | **not_promoted** (whole BP; risk Medium; user-directed 2026-06-16). Live AWS title corrected from "Test vector embeddings…" → "Test vector **store features**…". Experiment-and-pick over four technique slices: ANN algorithm selection (LSH / HNSW / IVF / PQ accuracy-speed-memory-scalability trade-offs, benchmark on your dataset), hierarchical index organization, chunking/embedding strategy (fixed-size / hierarchical / semantic), query processing (query expansion, fuzzy → semantic similarity). Generic **technique** menu (not even vendor-specific — these are standard ANN algorithms), all tuning/benchmarking with no commitable pre-merge artefact. The latency/relevance-testing substance overlaps the GO1B1 eval-harness family; the vector-store dimension/quality slice is already owned by **GC4B1-01** (cost) and the sibling **GENPERF04-BP02**; chunking quality-testing is the same shape not_promoted at GENCOST04-BP01 steps 3/4. step_promotion 3/3/3/3 → not_promote. See lens_mapping_authored.md + decisions.md. |
| GENPERF04-BP02 [VERIFIED 2026-06-07] | Optimize vector sizes for your use case | **not_promoted / absorbed into GC4B1-01** (risk Low). Experiment-and-pick BP (identify performance KPI → test vector sizes → keep most performant); the only enforceable artefact is GC4B1-01's declare-dimension-plus-measured-evidence record, here framed as a latency/accuracy KPI rather than a cost-vs-quality floor. Performance twin of the cost principle GC4B1-01; the retrieval-quality testing not_promoted from GENCOST04-BP01 steps 3/4 lands here and stays process-shaped. User directed not_promote 2026-06-07. See lens_mapping_authored.md. |

**GENPERF pillar FULLY WALKED + CLOSED 2026-06-16 — ZERO principles.** All four focus areas closed: GENPERF01 (BP01/BP02 not_promoted), GENPERF02 (BP01/BP02/BP03 not_promoted), GENPERF03 (BP01 not_promoted), GENPERF04 (BP01/BP02 not_promoted). Every GENPERF BP resolved to one of: generic infra performance discipline owned by the base WAF (PERF05 / ML-lens MLPER), a performance-framed restatement of an already-authored GENOPS eval (GO1B1) / observability (GO3B2) / GENCOST principle (GC1B1-01, GC4B1-01, GO1B1-06), or a technique/vendor menu. The GenAI *performance* pillar adds no enforceable architecture beyond what GENOPS evaluation + observability and GENCOST cost discipline already mandate. A clean "worked example" result — the catalogue is honest about where a pillar yields no distinct GenAI architecture.

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
| GENCOST03-BP02 [VERIFIED — walked 2026-06-16] | Control model response length | **GC3B2-01** — Keep the cost of every response under deliberate control (anchored whole-BP). The output-side mirror of GC3B1-01: every template declares a real `runtime_token_budget.output` ceiling (the GO3B1-01 field), the central SDK applies it as `max_tokens` by construction, a pre-merge gate fails an unset ceiling or a call-site bypass (AST no-bypass lint extending GO3B1-01's routing lint), and a budget-inflation governance lint guards ceiling raises. **Honest enforcement limit:** output length is a runtime quantity — the gate proves the cap is declared + applied + un-bypassed, NOT that the model halts at it (recorded in enforcement_limits.md). step_promotion 3/3/3/3. Distinct from GC3B1-01 (input footprint, static/build-time), GC5B1-01 (whole-agent-run budget), GO3B1-01 (mandates the field exists, not that it's a binding cap). mapping_state unverified — BP title + GENCOST03 question confirmed but the live page's numbered steps couldn't be fetched this session (docs.aws.amazon.com timeouts); step decomposition reconstructed from scope (max_tokens / stop sequences / concise-prompt instruction), pending a verification pass. See lens_mapping_authored.md + decisions.md (latest). |
| GENCOST03-BP03 [VERIFIED] | Implement prompt caching to reduce token costs | **GC3B3-01** — Mark the cacheable static prefix of every reused prompt template and fail builds that leave a cache-eligible template uncached or mis-declare its prefix size (anchors step 2; absorbs step 1) |
| GENCOST03-BP04 [VERIFIED] | Annotate user input to enable cost-aware content filtering | **not_promoted** (no principle) — vendor-specific input-tag micro-optimisation; user-rejected 2026-06-05 |

**GENCOST03-BP01 decomposition (4 steps; risk: Medium):**

- **Step 1** — *Identify a verbose prompt which could be optimized.* → **not_promoted / absorbed** into GC3B1-01. A template that breaches its declared ceiling IS the identified verbose prompt — the Option A footprint gate surfaces it mechanically instead of by manual hunting. Decision-process / observation input, no standalone artefact (same shape as GENCOST01-BP01 step 1).
- **Step 2** — *Engineer the prompt to reduce the token count, trimming as many unnecessary words as possible.* → **promoted_to_principle: GC3B1-01.** step_promotion rubric 3/3/3/3. Concretised from coaching ("trim words") into an enforceable contract: a declared `runtime_token_budget.input` ceiling (reusing the GO3B1-01 manifest field) + a pre-merge footprint-vs-budget lint + a budget-inflation governance lint. Substrate GO3B1-01 (template registry + budget field) shipped 2026-06-03.
- **Step 3** — *Consider using a separate LLM to offer a shortened prompt (Amazon Bedrock Prompt Optimization).* → **not_promoted.** Vendor/technique suggestion; no architectural mandate survives extraction. An optional tool a team may use to author a shorter prompt, not a gate. Vendor specifics deferred to GC3B1-01's framework_mappings notes.
- **Step 4** — *Continue testing and optimizing the prompt to validate it meets the workload requirements (zero-shot / chain-of-thought / tree-of-thought / least-to-most).* → **not_promoted.** Prompt-engineering technique menu + process advice; no commitable artefact distinct from the GO1B1 eval-harness family. The "validate it meets requirements" slice is optionally absorbed by GC3B1-01's documented **Option B** (measured-from-eval-harness-fixtures), but the techniques themselves are coaching.

Net for GENCOST03-BP01: **1 promoted (GC3B1-01); step 1 absorbed; steps 3/4 not_promoted.** BP01 closed.

**GENCOST03 remaining BPs:**

- **BP02 — Control model response length** (risk: Medium). **PROMOTED → GC3B2-01** (authored 2026-06-16). Anchored whole-BP — the output-side mirror of GC3B1-01. Every template declares a real `runtime_token_budget.output` ceiling (the GO3B1-01 field, blank-by-default today), the central SDK applies it as `max_tokens` by construction, a pre-merge gate fails an unset ceiling or a call-site bypass (AST no-bypass lint extending GO3B1-01's routing lint), and a budget-inflation governance lint guards ceiling raises. The enforceability question the user pressed — *how do you check response length at a CI gate?* — resolved: you can't; the response doesn't exist at build time. The gate proves the cap is **declared + applied + un-bypassed** (the "wired-in, not runtime behaviour" enforcement limit, recorded in enforcement_limits.md); runtime length is observed via Option C on GO3B2-01's signal. Distinct from GC3B1-01 (input footprint, statically computable), GC5B1-01 (whole-agent-run budget), GO3B1-01 (mandates the field exists). step_promotion 3/3/3/3. mapping_state unverified — BP title + GENCOST03 question confirmed, but the live page's numbered steps couldn't be fetched this session (docs.aws.amazon.com timeouts); step decomposition reconstructed from scope (max_tokens / stop sequences / concise-prompt instruction), pending verification.
- **BP03 — Implement prompt caching to reduce token costs** (risk: Medium; verbatim fetched 2026-06-05). **PROMOTED → GC3B3-01** (authored 2026-06-05). Anchors step 2 (enable caching / configure cache checkpoints); absorbs step 1 (identify caching opportunities) as the eligibility computation inside the gate — a template whose recomputed static prefix clears the model's minimum cache size IS the identified opportunity. The open question (does a CI-gateable artefact survive extraction, given caching looks like runtime config?) resolved YES via the manifest-derivable Option A: declare `cache.static_prefix_tokens` + a cache decision in the GO3B1-01 manifest, with a pre-merge lint that (1) requires the declaration, (2) requires cache-eligible templates to be checkpointed or opted out against `models/cache_minimums.yaml`, (3) recomputes the contiguous prefix tokenisation and fails on variance. Steps 3 (monitor caching metrics) and 4 (optimize cache usage) **not_promoted**: step 3 is realised as the optional Option C runtime telemetry alarm and belongs to the GO3B2 observability family; step 4 is tuning/process advice with no commitable pre-merge artefact. step_promotion 3/3/3/3. Distinct from GC3B1-01: opposite cost lever (GC3B1-01 fails prompts too big; GC3B3-01 caches big stable prefixes).
- **BP04 — Annotate user input to enable cost-aware content filtering** (verbatim fetched 2026-06-05; 7 steps; risk: Medium). **not_promoted — no principle authored.** The BP is a Bedrock-specific cost micro-optimisation: wrap only untrusted user spans in `<amazon-bedrock-guardrails-guardContent_xyz>` tags (with a random `tagSuffix`) so the input content filter scans the user input instead of the whole assembled prompt (system + retrieval + history), shrinking the moderation-pass token bill. Once the vendor mechanism is stripped, the residual architectural substance is thin — "scan only the untrusted input span" — and it does not survive as a durable, CI-gateable artefact distinct from the existing P52 siblings. Discussed and **rejected by the user on 2026-06-05** as a non-principle. Steps 4–6 (minimalist response scheme + hard response-length cap) are output-side concerns that belong to BP02 (Control model response length) / GC3B2-01's output budget, not here. **GENCOST03 fully walked + CLOSED 2026-06-16: BP01 → GC3B1-01, BP02 → GC3B2-01, BP03 → GC3B3-01, BP04 → not_promoted (3 promoted, 1 not_promoted).** The Cost-aware prompting focus area (P52) yields the prompt-cost triad: input footprint (GC3B1-01), output cap (GC3B2-01), and cache reuse (GC3B3-01).

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
