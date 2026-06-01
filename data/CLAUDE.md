# Working style — read at session start

Keep responses SHORT by default. 2–4 sentences. No walls of text.

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

## Catalogue authoring

When manually authoring a principle's `statement.title`, run it through `data/sections/statement/rubric.json` first — the rubric (5 dimensions, threshold rule, calibration examples) catches noun-phrase / non-prescriptive titles before they ship. Until the LangGraph pipeline at `app/` is wired, this is a hand-applied check.

When manually deciding promote vs not_promote on an AWS implementation step during a BP walkthrough, run the call through `data/sections/step_promotion/rubric.json` first — the rubric (4 dimensions: has_enforceable_artefact, architecturally_distinct, in_bp_scope, not_vendor_menu; threshold all ≥ 2; calibration examples drawn from BP01 + GENCOST01-BP01 precedent) catches hollow-artefact promotions, scope creep, cross-pillar misplacements, and vendor-menu-shaped non-mandates before they get authored. Binary outcome — promote or not_promote, no merge category. Until the LangGraph pipeline is wired, this is a hand-applied check.

When manually setting `ownership.tier` on a principle, run the call through `data/sections/tier/rubric.json` first — the rubric (2 dimensions: D1 legal_exposure binary veto, D2 repeatability_cost 0-3; three outcomes mandatory_centralise / recommended_centralise / local) replaces the prior 4-rule binary screen in taxonomy.json and reflects the real driver: enforcement should be centralised when it requires building and maintaining anything repeatedly for every project, and must be centralised whenever legal exposure is in scope. Tier semantics are now centralisation-of-enforcement (NOT validation — `validator` and `audit_mode` are independent axes). Until the LangGraph pipeline is wired, this is a hand-applied check.
