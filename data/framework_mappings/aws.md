# AWS Well-Architected Generative AI Lens — mapping methodology

> The catalogue's **primary anchor**: every standard concretises a specific AWS GenAI Lens best-practice implementation step.

| | |
|---|---|
| **Framework key** | `aws` |
| **Role** | **primary anchor** (every standard must anchor here, or explicitly extend with `mapping_state: na`) |
| **Status** | populated |
| **Standards mapped** | 24 / 24 |
| **Convention in `taxonomy.json`** | `framework_mappings_spec.anchoring_methodology` + `primary_anchor_vs_cross_reference` |
| **Related ledger** | `data/lens_mapping.md` (per-BP due-diligence) + `data/lens_mapping_authored.md` |
| **Last reviewed** | 2026-06-23 |

## WHY we map to it

AWS defines the **universe of subject matter** for the catalogue. The GenAI Lens names, for each pillar, the questions and best practices a production GenAI system must answer — but it stops at the *question*. It does not say WHERE the artefact lives, WHO validates it, WHEN it gates, or HOW you prove it works. Our standards fill exactly those slots: same scope, one level more specified. AWS is the anchor (not merely a cross-reference) because the catalogue's claim is "here is the concrete, enforceable version of the AWS Lens."

## HOW we map

**Field shape** (`framework_specific_reference_fields.aws`): `lens`, `pillar`, `focus_area`, `question`, `best_practice`, and `implementation_step` `{ number, title, verbatim_text }`.

**Anchoring level — implementation STEP, not BP.** Each AWS BP is decomposed into its numbered implementation steps. Every step gets a due-diligence pass recorded in `lens_mapping.md`: `promoted_to_principle`, `not_promoted` (with rationale), or `pending_review`. A standard anchors to the specific step it concretises. Whole-BP anchoring (`implementation_step: null`) is the rare exception, documented in the `note`.

**The derivation rule.** A step is promoted to a standard only when it carries architecturally distinct, enforceable content. Vendor menus ("use Bedrock / SageMaker / fmeval"), pure process advice ("run it on a schedule"), and generic base-WAF material are **not_promoted** — recorded as documented gaps, not forced into standards.

**`mapping_state`:** `verified` (step text fetched from AWS docs and confirmed). The `note` must explain what our standard adds beyond the AWS step.

**Worked example.** GENOPS01-BP01 step 1 ("Create a ground truth dataset") → **GO1B1-01**. AWS says the dataset must exist with diverse representation; it leaves unspecified where it lives, who owns it, its shape for an autonomous agent, and how strata are verified. GO1B1-01 concretises all four and adds two pre-merge CI gates. That gap between "the dataset exists" (AWS) and "a committed, CI-gated harness" (ours) is the value the anchor makes visible.

## STATUS — what's mapped

All 24 standards anchor here. The authoritative ledger of every AWS BP/step and its promote/not_promote decision is **`lens_mapping.md`** — read that for the full picture rather than duplicating it here.

Pillar coverage: P1 Operational Excellence (9), P2 Security (6), P3 Reliability (2), P5 Cost Optimization (7), P4 Performance Efficiency (0, not started).

## Open items

- Performance Efficiency (GENPERF) pillar not yet walked.
- A model-registry standard (the model-side twin of GO3B1-01) flagged as an open extension candidate in `lens_mapping.md`.
