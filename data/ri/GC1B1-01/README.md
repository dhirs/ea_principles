# Reference Implementation — GC1B1-01

## 1. principle_id
GC1B1-01 — Maintain a versioned model-selection decision record in the workload repository declaring requirements, candidate models, chosen model, and cost-aware rationale.

## 2. tier_outcome
**local** → `ownership.tier: project`
- D1 (legal_exposure): no — vendor procurement may have regulatory aspects but the selection record itself is engineering documentation.
- D2 (repeatability_cost): 1 — a shareable ADR template plus a small fill-in lint. The actual selection content is bespoke per workload (different requirements, different candidates, different cost models). Project-tier.

---

## 3. central_team
**None — project owns end-to-end.**

A central team may optionally publish:
- An ADR template with the four required sections pre-stubbed.
- A small lint that verifies each section is non-empty and the chosen model is referenced consistently across `src/` and the ADR.

Both are light enough that a project writes them itself if no central version exists.

---

## 4. project_team

**Configures**
- An ADR file at a known path (convention: `docs/adrs/model-selection-<workload>.md`).
- A small CI lint that runs on PRs touching `src/` and verifies model references match the ADR.

**Populates**
- The four required ADR sections:
  - **Requirements** — minimum performance bar the model must meet (accuracy, latency p95, context window, modality, languages, jurisdiction constraints).
  - **Candidate models** — the models evaluated, with the evidence supporting each (benchmark scores, internal evaluation results, vendor docs).
  - **Chosen model** — the selected model identifier with version and serving paradigm (api_on_demand / api_provisioned / self_hosted_managed / self_hosted_unmanaged).
  - **Cost-aware rationale** — explicit reasoning tying the choice to prioritised cost dimensions (hosting paradigm, model size, token cost) and to the requirements bar.
- Updates to the ADR whenever the model reference in `src/` changes — PRs must update both or fail the lint.

**Consumes via**
- Whatever local lint the team writes; or the optional central template + lint if published.

---

## 5. interface_contract

**ADR template (markdown sections, all required non-empty)**
```markdown
# Model Selection — <workload name>

## Status
<proposed | accepted | superseded by <ADR ref>>

## Date
<ISO 8601>

## Requirements
- Performance: ...
- Latency: ...
- Context window: ...
- Modality: ...
- Jurisdiction / data residency: ...
- Other: ...

## Candidate Models
| Model | Serving paradigm | Evidence | Cost basis |
|---|---|---|---|
| ... | ... | ... | ... |

## Chosen Model
- Identifier: <vendor:model:version>
- Serving paradigm: <api_on_demand | api_provisioned | self_hosted_managed | self_hosted_unmanaged>
- Effective date: <ISO 8601>

## Cost-Aware Rationale
- Prioritised cost dimensions: hosting paradigm / model size / token cost
- Why the chosen model wins on those dimensions given the requirements bar
- Trade-offs accepted
```

**Lint behaviour**
- Parses the ADR; fails if any of the four required sections is empty.
- Parses `src/` for model identifier references (in config files, prompts, SDK calls); fails if the ADR's "Chosen Model" identifier does not appear in `src/`, or if a model identifier in `src/` is not the ADR's chosen one.
- PRs touching `src/` paths that change a model reference must also modify the ADR (date + status update at minimum).

---

## 6. acceptance_criteria

- [ ] ADR exists at `docs/adrs/model-selection-<workload>.md` (or the project's chosen convention).
- [ ] All four required sections (Requirements, Candidate Models, Chosen Model, Cost-Aware Rationale) are present and non-empty.
- [ ] The model identifier in the ADR's "Chosen Model" section matches the model reference(s) in `src/`.
- [ ] Most recent ADR date is current relative to the deployed model (any model change in the last 90 days is reflected in the ADR).
- [ ] ADR-consistency lint is configured as a **required** status check on the integration branch via branch protection.
- [ ] Latest ADR-consistency lint exits 0 on the integration branch.
