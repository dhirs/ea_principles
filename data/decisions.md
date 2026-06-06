# Decisions Log

Append-only journal of decisions about the AI architecture principles catalogue.

When starting a new session, read this file alongside `taxonomy.json`, `principles.json`, `lens_mapping.md`, and `slides.md` to pick up context.

Entries are dated. Newest entry at the top.

---

## 2026-06-06 (latest) — Authored GC5B1-01 (Give every agent a hard stop) from GENCOST05-BP01; first principle under GENCOST05; created focus area P54 — Cost-informed Agents; GENCOST05 focus area closed

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
