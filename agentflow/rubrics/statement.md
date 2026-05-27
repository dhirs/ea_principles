# Rubric — `statement` field

Judges the quality of a principle's `statement` (title + description). Run during principle authoring; a passing score is the minimum bar for committing the statement before any downstream field is drafted.

## Why this rubric exists

GO1B1-01, GO1B1-02, and GO1B1-03 (formerly PRIN_001, PRIN_002, PRIN_003) were authored with noun-phrase titles ("Versioned Ground-Truth Evaluation Harness for Agent Decisions") despite the catalogue's principles being prescriptive — AWS's own BP titles are imperatives ("Periodically evaluate functional performance", "Monitor all application layers"). The form flaw was caught by human pushback only after four principles had inherited it (three live + the GO1B1-04 draft, formerly PRIN_004). A `statement` rubric run against the first draft of GO1B1-01 would have caught this on day one.

This rubric exists so that field-level form flaws are caught at draft time, not after they have propagated through the catalogue.

## Dimensions

Each dimension is scored 0–3:

- **0** — fails the dimension entirely
- **1** — weak / partially meets
- **2** — meets
- **3** — exemplary

### `is_prescriptive`

The title is a directive, not a description. Uses an imperative verb (or otherwise reads as a rule that can be obeyed or violated), not a noun phrase that names an artefact.

- **3** — Title is an imperative verb phrase that names what to do ("Monitor production inputs and model outputs for drift against the deployment baseline"). Description amplifies with concrete shall/must language.
- **2** — Title is prescriptive but slightly hedged, wordy, or uses a weak verb.
- **1** — Title is a noun phrase that implies an action but doesn't state it ("Drift Monitoring of Production Inputs").
- **0** — Title is purely descriptive — names an artefact without naming the discipline ("Versioned Ground-Truth Evaluation Harness for Agent Decisions").

### `derives_from_aws_verbatim`

Every load-bearing noun and verb in the statement maps to a noun or verb in the anchored AWS implementation step's verbatim text. The reader can put the AWS step and our statement side-by-side and see the lineage without explanation.

- **3** — All load-bearing terms map; lineage is obvious without explanation.
- **2** — Most terms map; one or two are catalogue-specific concretisations (`pre_merge`, `workload repository`) that are acceptable as the value-add over AWS.
- **1** — Some lineage visible but key concepts in the statement are not in the AWS step.
- **0** — Statement introduces architectural ideas absent from the AWS step (GO1B1-03 v1.0.0's "silent regression of verification chain" was nowhere in the two-sentence AWS step).

### `names_artefact_and_enforcement`

Statement (title + description together) names BOTH the artefact mandated AND what is enforced about it. The reader can answer "what must exist?" and "what is checked?" from the statement alone, without reading `gates`.

- **3** — Both named explicitly: title names the discipline, description names the artefact, its path or location, and the check.
- **2** — Both present but one is implicit and only clear from context.
- **1** — Only one is named.
- **0** — Neither is concrete; statement is a goal not a rule.

### `scope_match`

Statement claims no more and no less than the AWS step covers. Does not import scope from sibling steps or the broader BP body. Does not invent a failure mode the step does not name.

- **3** — Scope matches the AWS step exactly; sibling content (other steps, broader BP) referenced where useful but not absorbed.
- **2** — Slight under- or over-reach with no functional consequence.
- **1** — Material scope creep — statement claims scope that belongs to a sibling step, or invents a failure mode the AWS step does not name.
- **0** — Statement is built around an architectural theory the AWS step does not support (GO1B1-03 v1.x).

### `parallel_form_with_siblings`

Voice and shape match other principles in the catalogue. Same grammatical form. Same level of specificity. A reader scanning a list of statement titles sees a coherent voice.

- **3** — Form match perfect — voice indistinguishable from sibling principles.
- **2** — Minor variance (slightly longer; slightly more or less specific) but recognisably the same family.
- **1** — Off-form in one dimension (much longer, different tense, mismatched specificity).
- **0** — Reads as authored by a different hand against a different template.

## Threshold rule

A statement passes if **all five dimensions score ≥ 2**. A score of 0 or 1 on any dimension fails the rubric. The pipeline must route the statement back for re-drafting before any downstream field (`problem`, `solution`, `gates`, …) is authored — downstream fields build on the statement, so a failed statement contaminates everything that follows.

No weights in V1 — every dimension counts equally. Weights are deferred until a worked example surfaces the need for one.

## Judge prompt (template)

```
You are judging a draft principle statement against five dimensions defined in `agentflow/rubrics/statement.md`. The principle anchors to the following AWS implementation step:

<aws_step>
{aws_step_verbatim}
</aws_step>

The catalogue's existing sibling principles for parallel-form comparison:

<siblings>
{sibling_titles_and_descriptions}
</siblings>

Candidate statement:

<candidate>
Title: {candidate_title}
Description: {candidate_description}
</candidate>

For each dimension, return an integer score 0–3 and a one-sentence justification.

Dimensions and definitions (see statement.md for full scoring rubric):

- is_prescriptive
- derives_from_aws_verbatim
- names_artefact_and_enforcement
- scope_match
- parallel_form_with_siblings

Output a single JSON object with this exact shape and no other text:

{
  "is_prescriptive":            {"score": <int 0-3>, "justification": "<one sentence>"},
  "derives_from_aws_verbatim":  {"score": <int 0-3>, "justification": "<one sentence>"},
  "names_artefact_and_enforcement": {"score": <int 0-3>, "justification": "<one sentence>"},
  "scope_match":                {"score": <int 0-3>, "justification": "<one sentence>"},
  "parallel_form_with_siblings":{"score": <int 0-3>, "justification": "<one sentence>"}
}
```

## Calibration examples

| Candidate statement | Outcome |
|---|---|
| (GO1B1-01 prior, pre-retitle) "Versioned Ground-Truth Evaluation Harness for Agent Decisions" | `is_prescriptive: 0` (pure noun phrase); **FAILS** |
| (GO1B1-01 v1.5.2) "Maintain a versioned ground-truth evaluation harness for agent decisions in the workload repository" | All ≥ 2; **PASSES** |
| (GO1B1-02 prior, pre-retitle) "Stratified Ground-Truth Composition and Per-Stratum Evaluation Gating" | `is_prescriptive: 0`; **FAILS** |
| (GO1B1-02 v1.3.2) "Stratify the ground-truth harness and gate evaluation per stratum, not on the aggregate" | All ≥ 2; **PASSES** |
| (GO1B1-03 prior, pre-retitle) "Encapsulated Evaluation Metrics in the Workload Repository" | `is_prescriptive: 0`; **FAILS** |
| (GO1B1-03 v2.0.2) "Implement every evaluation metric as a named, encapsulated code unit" | All ≥ 2; **PASSES** (path convention `eval/metrics/` deliberately omitted from title — stays in description and gates) |
| (GO1B1-03 v1.0.0 historical) "Encapsulated, Version-Controlled Custom Metrics with Verification Chain Coverage" | `scope_match: 0` (verification-chain failure mode not in AWS step); **FAILS** |
| (GO1B1-04 draft) "Monitor production inputs and model outputs for drift against the deployment baseline" | All ≥ 2; **PASSES** |

## Promotion to code

When agentflow has LLM plumbing wired, this spec becomes `agentflow/rubrics/statement.py`: a Pydantic model whose fields mirror the dimensions, the judge prompt as a module-level constant, and a deterministic `threshold(scores) -> bool` post-processor. The spec text in this file migrates into docstrings on the Pydantic model so the human-readable rubric lives alongside the executable form.

Until that promotion lands, the rubric is run by hand — a human (or a transient LLM call from an authoring session) scores each candidate against the dimensions and applies the threshold rule.
