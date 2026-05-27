# agentflow/rubrics

Quality rubrics for LLM-authored fields in the principles catalogue at `\\wsl.localhost\ubuntu-24.04\home\dheeraj\ai_principles\`.

## Why this directory exists

Every LLM-authored field in `principles.json` is judgment-shaped — a draft can be good or bad, and badness is not always obvious to the author of the draft. Without a structured judge, field-level errors are discovered only when a human reader pushes back. The catalogue learned this when GO1B1-01, GO1B1-02, GO1B1-03, and a draft GO1B1-04 title (formerly PRIN_001, PRIN_002, PRIN_003, PRIN_004 — renamed 2026-05-27) all shipped noun-phrase (non-prescriptive) `statement.title` values before any human noticed the form was wrong. A `statement` rubric run against the first draft of GO1B1-01 would have caught it on day one.

Each rubric in this directory turns one LLM-authored field into something checkable: named dimensions, an explicit 0–3 scoring scale, a deterministic threshold rule. The authoring pipeline runs the rubric on a field's draft before any downstream field is authored.

## What is NOT in this directory

Deterministic / rules-based fields do not get rubrics — there is no judgment to evaluate:

- `principle_id` (next number)
- `pillar` (deterministic lookup from `focus_area`)
- `evidence` (derived from `ownership.tier`)
- `change_history` (semver stamp on the change)
- `ownership` (rule-driven from `enterprise_qualification_rules` in taxonomy)

Five fields, no rubrics.

## What IS in this directory

One rubric per LLM-authored field — ten in total once the agentflow pipeline is fully wired:

- `statement.md` — title + description (the only V1 rubric)
- `problem.md` — description + examples (deferred)
- `solution.md` — approach + key_benefits (deferred)
- `gates.md` — array of {point, check, blocking} (deferred)
- `explain_prompt.md` — compiled system + user_template (deferred — note this is the field whose CONTENT is itself an LLM judge, so the rubric judges the meta-prompt's output not the principle's content directly)
- `focus_area.md` — enum-constrained but the choice is judgment (deferred)
- `impact_level.md` — enum, judgment (deferred)
- `applicability.md` — pattern-criticality map, judgment (deferred)
- `maturity_level.md` — enum, judgment (deferred)
- `framework_mappings.md` — verbatim-match for the AWS anchor, plausibility for cross-references (deferred)

## File convention

Each rubric file holds:

1. **Why this rubric exists** — a one-paragraph motivation, pinned to a concrete failure the rubric prevents.
2. **Dimensions** — named axes, each scored 0–3, with what each score level looks like.
3. **Threshold rule** — deterministic pass/fail derivation from per-dimension scores.
4. **Judge prompt** — template for the LLM-as-judge call, with placeholders for the candidate field, the anchored AWS step, and sibling references.
5. **Calibration examples** — known-good and known-bad candidates with expected scores. Drawn from existing principles where possible — the rubric's claim is testable against the catalogue's own history.
6. **Promotion to code** — note on when and how the markdown spec gets wrapped as Python.

Filename = field name. One file per field. No subdirectories.

## Format and lifecycle

V1 rubrics are markdown. The agentflow pipeline does not yet have LLM plumbing, and the spec content matters more than the code wrapper. When agentflow's authoring nodes are wired, each `<field>.md` spec is promoted to `<field>.py` — a Pydantic model whose fields mirror the dimensions, the judge prompt as a module-level constant, the threshold function as a deterministic post-processor. The markdown spec text moves into docstrings inside the Python module so the human-readable rubric lives alongside the executable form.

## Build policy

Rubrics are built as their authoring nodes are built, not all upfront. The catalogue learned the cost of premature breadth from the universal-prompt mistake on `explain_prompt`: a single prompt calibrated against assumptions distorted three of four failure shapes. Ten rubrics written before their fields have been authored at scale would repeat that mistake — each rubric would calibrate against guesses, not against worked examples.

The first rubric — `statement.md` — exists because the titles failure forced it. Subsequent rubrics land as their authoring nodes do.

## Threshold semantics

V1 rule: a draft passes if **all dimensions score ≥ 2**. Any 0 or 1 on any dimension is a fail; the pipeline routes the draft back for re-drafting before any downstream field is authored.

No weights in V1 — every dimension counts equally. Weights are deferred until a worked example surfaces the need for one.

The "all dimensions ≥ 2" rule is deliberately strict: an LLM-authored field that scores 1 on any dimension is shipping a known weakness, and the pipeline's job is to catch known weaknesses before they propagate.

## Scope

These rubrics judge **catalogue-authoring outputs** — statements, gates, explain_prompts written for principles in the catalogue at `\\wsl.localhost\ubuntu-24.04\home\dheeraj\ai_principles\`. They do **not** judge a workload's behaviour at runtime; that is what the workload's own evaluation harness does (see GO1B1-01 in the catalogue).

The rubric framework itself is **not** a principle in `principles.json`. It is catalogue-authoring discipline (what the agentflow pipeline does), not workload-architecture discipline (what a team building an AI workload does). Declaring it as a principle would pollute the catalogue. The rule that this discipline exists is recorded in `taxonomy.json` under `conventions.per_field_authoring_rubrics`; the implementation lives here.

## Related

- `taxonomy.json` → `conventions.per_field_authoring_rubrics` — the schema-level declaration that LLM-authored fields carry rubrics of this shape.
- `decisions.md` 2026-05-27 entry — the architectural decision and the titles-failure that motivated it.
- GO1B1-03 in `principles.json` (formerly PRIN_003) — the workload-level analogue (eval metrics as encapsulated code in `eval/metrics/`); this directory is the catalogue-authoring analogue, one level up.
