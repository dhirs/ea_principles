---
name: ai-architecture-principles
description: Use this skill whenever the user works on the enterprise AI architecture principles catalogue — authoring a new principle from an AWS Well-Architected GenAI Lens BP step, editing or reviewing existing ones, mapping production failures to architectural concerns, deciding promote / not_promote on an AWS implementation step, scoring a section against its hand-applied rubric, or anything involving `principles.json`, the per-section rubrics under `data/sections/`, the reference implementations under `data/ri/`, `lens_mapping.md`, or `{bp_code}-NN` identifiers (e.g. GO1B1-01, GC2B2-01, GO3B2-02). Trigger this skill even when the user does not name the file explicitly but is clearly thinking about how to standardise AI agent design, ARB review criteria, AIGP alignment, prompt / context governance, observability discipline, cost discipline, or any "what does production-ready look like" question for AI systems.
---

# Enterprise AI Architecture Principles

This skill carries the operating rules for the user's enterprise AI architecture principles catalogue. The catalogue gives delivery teams and ARBs a shared, auditable definition of "production-ready" for AI systems.

Decisions here ripple across the catalogue. Read the canonical files for current state before acting — do not act from this skill's memory of what the schema, conventions, or open items used to be. This skill is procedure, not specification.

## File locations

Everything is consolidated under `ai_principles_server/`:

- `ai_principles_server/data/` — content + schema + prompts + reference implementations. All catalogue artefacts live here.
- `ai_principles_server/app/` — pipeline Python code (scaffold; not yet wired). Hand-authoring is the current path.
- `ai_principles_server/agentflow/app/anchor.json` — the next-BP staging slot. The single path under the old `agentflow/` layout that is still live.

Old `agentflow/` paths in journal entries refer to the pre-2026-06-01 layout.

## Read first at session start

Before any principle work, read in this order:

1. `data/CLAUDE.md` — working-style instructions and hand-applied rubric pointers.
2. `data/decisions.md` — top 2–3 entries. The `(latest)` marker sits on the newest. Carries recent schema evolutions, rubric versions, and open items.
3. `data/principles.json` — meta block + the most recent principles. Confirm the live schema shape, the format_version, and field presence on the latest entry (the schema evolves; in-memory expectations may be stale).
4. `data/principle_schema.json` and `data/taxonomy.json` — the formal schema and field conventions. This is the source of truth for what fields exist and what values are allowed. Never enumerate enums or fields from memory.
5. `data/lens_mapping.md` and `data/lens_mapping_authored.md` — what's been mapped, what's deferred, what's pending.

For section-specific work (authoring, scoring, reviewing), also read the rubric at `data/sections/{section}/rubric.json` for the section in question. The rubric files are the source of truth for dimensions, thresholds, and calibration — do not score from memory.

## Identifier convention

Principles use the format `{bp_code}-NN` where `bp_code` compresses the AWS pillar / question / BP triple to 5 characters, and `NN` is sequential within the BP block (no gaps regardless of which steps were not_promoted). The exact convention lives at `data/taxonomy.json` under `conventions.principle_id_format`. Read it there before allocating a new ID.

Legacy `PRIN_NNN` IDs are retained at `data/principles_old.json` for historical reference only and must not be authored in the live catalogue.

## Authoring workflow — strict order

When authoring a principle from an AWS implementation step, follow this order exactly. Do not collapse steps. Do not run ahead.

1. **Fetch the AWS step.** Read the AWS verbatim text for the step (from the BP page on docs.aws.amazon.com, or from the anchor already loaded). Quote it back in chat so the user can see what's being worked from.

2. **Load the anchor.** Populate `agentflow/app/anchor.json` with the BP code, step number, step title, and verbatim text.

3. **Prepare the `statement` only.** Draft the title (imperative — score against `data/sections/statement/rubric.json`) and a 1–3 sentence description. Optionally sketch the problem shape in 1–2 sentences inline in chat (not the full `problem` section yet) so the discussion has something concrete to chew on.

4. **HALT. Interactive discussion with the user.** Present the statement and the problem sketch. Walk the user through:
   - What the AWS step says verbatim and what it leaves unspecified.
   - What the candidate statement is mandating and what failure mode it prevents.
   - Sibling principles or adjacent BPs that might absorb the substance instead.
   - Any pillar-placement question (this BP vs cross-pillar deferral).
   - The shape of the artefact and gate that the principle would concretise to.

   The point of this discussion is for the user to understand the context and form a view before any promote / not_promote decision is made. Do NOT proceed past this step until the user has explicitly indicated they are ready to move on. Phrases like "let's promote it" or "score it" or "ok continue" or equivalent are the trigger — silence or implicit assent is not. If the user asks questions or pushes back, answer them and stay halted.

5. **Only after the user signals to proceed: score the candidate against `data/sections/step_promotion/rubric.json`.** Report per-dimension scores and justifications. Binary outcome: promote / not_promote.

6. **If promote:** draft the `problem` section in full (description + 4–5 concrete examples, scored against `data/sections/problem/rubric.json`), then walk each remaining section's rubric in turn (solution, gates, applicability, serving_paradigm, maturity_level, tier, framework_mappings, impact_level, focus_area, explain_prompt) — read the rubric file, score the draft, revise if it fails the threshold. Compose the full principle. Merge into `data/principles.json` at the correct numeric position. Write the RI at `data/ri/{principle_id}/README.md`. Flip the relevant row in `data/lens_mapping.md`. Append a top entry in `data/lens_mapping_authored.md`. Mark `agentflow/app/anchor.json` completed. Log the call as a `(latest)` entry in `data/decisions.md`.

7. **If not_promote:** log the deferral in `data/lens_mapping_authored.md` (naming the absorbing principle or cross-pillar target BP), add a brief `decisions.md` entry, leave `anchor.json` in-progress until the user picks the next step.

8. **Verify the JSON parses** — `python3 -c "import json; json.load(open('data/principles.json'))"`. If the sandbox blocks the workspace path, flag it as an open item for the user to run from their terminal before pushing.

The recurring failure mode this workflow exists to prevent: running through every step in one shot — load anchor, draft everything, score, merge, write RI, log — without ever stopping for the user to form an independent view. The halt at step 4 is not a courtesy; it is the point at which the user's judgement gets folded into the decision instead of being rubber-stamped after the fact.

When reviewing an existing principle: walk each section through its rubric. Surface any section that fails the threshold.

When mapping a production failure to the catalogue: identify which existing principle (if any) covers it. If none, flag as a candidate for a future BP walk and record in `lens_mapping_authored.md`.

## Field-level guidance and enums

Do not enumerate fields, allowed values, or enum sets from this skill's memory. Read them from:

- `data/principle_schema.json` for the field list, types, required-vs-optional, and enum values.
- `data/taxonomy.json` for the format conventions (principle_id shape, applicability/serving_paradigm criticality-map intent, tier/maturity_level semantics, AIGP domain and competency strings).
- The most recent principles in `data/principles.json` for the live shape — grep for any field across the catalogue to confirm whether it's present on all prior principles before declaring it optional on a new one. The miss pattern to avoid: trusting a journal entry that said a field was "deferred" instead of checking the actual file.

## Schema-presence check before declaring "done"

Before declaring any principle complete, grep `data/principles.json` for each field name and confirm presence on every prior principle. If 8 of 8 prior principles carry a field, the 9th gets it unless there is a specific written reason in the principle's own change_history justifying the omission. Schema is the source of truth; journal entries are not.

This applies to every field — `pillar`, `focus_area`, `applicability`, `serving_paradigm`, `framework_mappings`, `ownership`, `gates`, `change_history`, `explain_prompt`, and any field added by a schema evolution recorded in `decisions.md` or `principles.json`'s meta block.

## Reference implementations

Each principle has an RI at `data/ri/{principle_id}/README.md`. The shape (principle_id → tier_outcome → central_team Builds/Operates/Owns → project_team Configures/Populates/Consumes via → interface_contract → acceptance_criteria) is stable across the catalogue; read an existing RI (e.g. `data/ri/GO1B1-01/README.md`, `data/ri/GO3B2-01/README.md`) as the template for a new one. Match the existing structure rather than authoring from this skill's description of it.

## Hand-applied rubrics

Per-section rubrics live at `data/sections/{section}/rubric.json`. Each is a structured judge — read the file for the section's dimensions, threshold, and calibration examples before scoring. Until the LangGraph composer at `app/` is wired, every rubric is hand-applied. The current set of rubrics is whatever exists under `data/sections/` — list the directory before declaring which sections need scoring.

Hand-applied rubric workflow per section: read the rubric file → draft the section → score against the rubric's dimensions → revise if any dimension fails the threshold → record the per-dimension scores in the principle's `change_history` summary.

## What "done" looks like

Before declaring complete:

- JSON parses cleanly (or, if the sandbox blocks parse, flag for the user's terminal).
- Every field present on prior principles is present on this one (schema-presence check above).
- Every section ran through its hand-applied rubric and passed.
- The `change_history.changes[0].summary` carries the full reasoning chain — rubric scores, alternatives considered, sibling distinctions, decisions about non-default field values.
- RI exists at `data/ri/{principle_id}/README.md` matching the existing RI template.
- `lens_mapping.md`, `lens_mapping_authored.md`, `agentflow/app/anchor.json`, and `decisions.md` are all updated.
- The principle would survive an ARB member reading it cold.

## Outstanding work

Read `decisions.md` "Open items" sections for the current list. Do not enumerate open items from this skill — they shift each session.
