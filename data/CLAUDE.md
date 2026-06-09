# Working style — read at session start

Keep responses SHORT by default. 2–4 sentences. No walls of text.

Names, titles, and statements must be plain and short. Say it the way you'd say it out loud. No stacked clauses, no "fail builds where… and… unless…" constructions, no flowery or padded phrasing. If a title needs commas to survive, it's wrong. This applies to principle titles too — a plain spoken sentence beats a clever one every time.

When tempted to produce a long structured analysis: stop. Send a one-paragraph summary first and ask if I want the full version.

No headers, no tables, no nested bullets unless I explicitly ask for them. Plain bullets are fine when there are 3+ discrete items and prose would be worse.

When I ask a question, answer the question. Don't preface with restating what I asked. Don't pad with caveats.

Match the energy of my messages. Terse from me means terse from you.

If you must produce something long (a draft document, a worked example I asked for): file it, present it as a link, and summarise in 2–3 lines. Don't dump the body into chat.

## Paid workshop

5-block workshop design lives in `paid_workshop.md` (in `data/`, same folder as this file). Read at session start when workshop / Maven context is relevant — the workshop sells enforceable principles + prioritisation + platform-vs-project decisioning, with three concrete artefacts students walk out with plus one fully-authored reference implementation.

## File locations

Everything consolidated under `ai_principles_server/` as of 2026-06-01. Single root, two top-level folders:

- **`ai_principles_server/data/`** — content + schema + prompts + reference implementations. All catalogue artefacts live here.
  - **Catalogue content** at `data/` root: `principles.json`, `decisions.md`, `lens_mapping.md`, `governance.json`, `advanced_ai.json`, `pillars.md`, `classstrategy.md`, `slides.md`, `paid_workshop.md`, `principles_old.json`, `marketing_use_cases.md`, `nbo_deep_dive.md`, `workshop_three_artefacts.md`, `GO1B1-01_teaching_notes.md`, `centralisation_value_rubric_draft.json`, `README.md`, this `CLAUDE.md`, `SKILL.md`, deprecated `taxonomy.md` stub, `reusable.json`.
  - **Schema + pipeline spec** at `data/` root: `taxonomy.json`, `principle_schema.json`, `pipeline.md`.
  - **Prompts** under `data/`: `system_prompts/{generate,rubric,revise}.json` and `sections/<section>/{generate,rubric,revise}.json` for 12 sections — statement, problem, solution, gates, focus_area, impact_level, applicability, maturity_level, framework_mappings, explain_prompt, step_promotion, tier.
  - **Reference implementations** at `data/ri/<principle_id>/README.md` for all 7 principles (GO1B1-01..05, GC1B1-01, GC2B2-01).
  - **Centralisation examples** at `data/centralisation/README.md` and `data/centralisation/examples/`.
- **`ai_principles_server/app/`** — pipeline Python code (the implementation that authors principles by reading the prompts + schema in `data/` and writing back to `data/principles.json`). Build brief lives at `app/BUILD_PROMPT.md`. Currently a scaffold for Claude Code to implement; LangGraph node code does not yet exist.

History note: the catalogue used to split across two sibling folders (`ai_principles/` for content, `ai_principles_server/agentflow/` for code + schema). On 2026-06-01 everything consolidated into `ai_principles_server/data/` + `ai_principles_server/app/`. Old `agentflow/` paths in journal entries refer to the pre-consolidation layout; live cross-references now use `data/sections/...` etc.

## What the catalogue is — the layers (read before classifying anything)

The catalogue is a set of **enforceable non-functional requirements (NFRs) for AI systems.** Functional correctness — does the bot answer the question right — is the project's own job (they spec it, unit-test it, and won't ship it broken) and is deliberately OUT of scope. The principles already encode this in their scope boundaries: GS2B1-01 punts backend-correctness to app-side business logic; GS5B1-01 gates the action, not the model's reasoning. What projects systematically do NOT test is the cross-cutting NFRs — observability, model-version discipline, input/output guardrails, action authorization, retrieval authorization, cost. Those, identical across every workload and neglected until audit/incident time, are the scaffolding the enterprise architecture function owns. That is the entire remit of this catalogue.

Altitude within a principle (2026-06-09 split): the `statement` is the **abstract principle** — the durable why, written at should/ought altitude, naming the failure it prevents but not the mechanism. The `gates` are the **standard** — the concrete, built-against enforcement (named artefacts, paths, thresholds, CI checks). The principle is what you believe; the gate is what a lint proves. The catalogue stays "enforceable" because every abstract principle still carries its standard in `gates`. Do not fold mechanism back up into the statement.

Three layers — keep them distinct:

- **Remit (what belongs here at all): functional vs non-functional.** If it's functional, it's the project's job, not a principle. If it's a cross-cutting NFR, it's a candidate principle.
- **Tier (where the enforcement is deployed): project vs enterprise.** A sub-question of *how* an NFR is enforced — an in-repo lint the project runs, or a central platform service. Driven by the tier rubric (legal exposure + repeatability), NOT by the failure's severity or reach.
- **Priority (what order an adopting org builds them): the prioritization ladder.** Once something is a principle and you know where its enforcement lives, build order is decided by the per-org Principle Prioritization Tool (`principle_prioritization_tool.md`) — a strict lexicographic ladder, **Legal/Compliance > Customer Experience > Cost**, each scored as *"what does it cost the org NOT to have this?"* (Legal always wins outright; Cost is only ever a final tiebreaker). The ladder measures cost-of-absence only; cost-to-build / adoption effort is a feasibility input (tier + maturity), NOT a ladder axis. This is a downstream per-org adoption tool, NOT catalogue metadata: it sets build order, never whether something is a principle.

Deprecated framing: do NOT classify failures by "blast radius" or "project-level vs enterprise-level impact." Blast radius describes consequence reach, which comes apart from both axes above — a GDPR PII leak is contained to one workload's bucket yet carries enterprise-scale consequences and an enterprise-tier control. Use functional-vs-NFR to decide whether something is a principle, and tier to decide where its enforcement lives. See `decisions.md` (2026-06-08 framing entry).

## Catalogue authoring

When manually authoring a principle's `statement.title`, run it through `data/sections/statement/rubric.json` first — the rubric (5 dimensions, threshold rule, calibration examples) catches titles at the wrong altitude before they ship. As of the 2026-06-09 altitude split, the statement is the ABSTRACT principle (the durable why, should/ought register); a title that names the artefact, path, manifest field, or CI gate FAILS (is_abstract_principle). The concrete, built-against standard lives in `gates`. Until the LangGraph pipeline at `app/` is wired, this is a hand-applied check.

When manually deciding promote vs not_promote on an AWS implementation step during a BP walkthrough, run the call through `data/sections/step_promotion/rubric.json` first — the rubric (4 dimensions: has_enforceable_artefact, architecturally_distinct, in_bp_scope, not_vendor_menu; threshold all ≥ 2; calibration examples drawn from BP01 + GENCOST01-BP01 precedent) catches hollow-artefact promotions, scope creep, cross-pillar misplacements, and vendor-menu-shaped non-mandates before they get authored. Binary outcome — promote or not_promote, no merge category. Until the LangGraph pipeline is wired, this is a hand-applied check.

When manually setting `ownership.tier` on a principle, run the call through `data/sections/tier/rubric.json` first — the rubric (2 dimensions: D1 legal_exposure binary veto, D2 repeatability_cost 0-3; three outcomes mandatory_centralise / recommended_centralise / local) replaces the prior 4-rule binary screen in taxonomy.json and reflects the real driver: enforcement should be centralised when it requires building and maintaining anything repeatedly for every project, and must be centralised whenever legal exposure is in scope. Tier semantics are now centralisation-of-enforcement (NOT validation — `validator` and `audit_mode` are independent axes). NB: tier is the *deploy-location* axis — where an NFR's enforcement is built (in-repo lint vs central platform) — and is subordinate to the catalogue's remit axis (functional vs non-functional; see "What the catalogue is — the layers" above). It does NOT classify the failure's severity or blast radius; never use it as a project-vs-enterprise impact label. Until the LangGraph pipeline is wired, this is a hand-applied check.

When authoring `statement.description`, `problem.description`, and `solution.approach`, do NOT write one dense wall-of-text paragraph (the GC4B1-01 / GC5B1-01 descriptions are the over-long shape to avoid). Break each into 2–4 short paragraphs separated by a blank line (`\n\n` in the JSON string), one point per paragraph. Lead with a plain statement of the mandate (statement), the dominant failure (problem), or the baseline approach (solution); push any enumeration into a bulleted list using markdown `-` — e.g. the fields a declaration carries, the distinct ways the discipline is fragile, the gate's individual checks, the Option A lint's numbered behaviours. Use bullets only where the content is genuinely a set of discrete items; keep connective reasoning as prose. This is content shape only — it does not change which facts the field must carry, and `problem.examples` / `solution.key_benefits` already render as their own bulleted lists so don't duplicate those there. Applies to hand-authoring now; propagate to `data/sections/{statement,problem,solution}/generate.json` when the pipeline is wired.

**Rendering dependency — differs by section.** `solution.approach` ALREADY renders markdown: `s3-json-viewer/components/principles/sections/SolutionSection.tsx` runs it through `react-markdown` + `remark-gfm` with the shared `markdownComponents` map (and `key_benefits` already renders as a bulleted list), so paragraphs and bullets in `solution.approach` display correctly today with no frontend change — it is the reference pattern. `statement.description` and `problem.description` do NOT yet: `StatementSection.tsx` emits a single `<p>` with no line-break handling (so `\n\n` collapses and `-` shows as a literal dash), and `ProblemSection.tsx` uses `whitespace-pre-wrap` (so `\n\n` shows as paragraph breaks but `-` still shows as a literal dash, not a list). To make those two render paragraphs AND bullets, mirror SolutionSection — wrap the description in `react-markdown` + `remark-gfm` + `markdownComponents`. Until that change ships, authored bullets in statement/problem will display as raw dashes; existing single-paragraph descriptions are unaffected.
