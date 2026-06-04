# From AWS principle to enforceable RI

*The AWS GenAI Lens is the question. The reference implementation is the audit.*

---

## What AWS gives you

**GENOPS03-BP01 — Implement prompt template management:**
> "Implement and maintain a versioned prompt template management system. Test and compare different prompt variants. Use the Amazon Bedrock SDK to incorporate prompts during model inference."

One paragraph. No paths. No CI gates. No owners. AWS deliberately stays abstract — it publishes for every industry and won't hypothesise per business context.

## The four things AWS leaves blank

**WHERE** the artefact lives · **WHO** validates it · **WHEN** in the lifecycle it gates · **HOW** you prove it works

## What the catalogue concretises (GO3B1-01)

**Route every model call through a registered, versioned prompt template via the central SDK.**

| | |
|---|---|
| **WHERE** | `prompts/manifest.yaml` + `prompts/<template_id>.md` (Mode A) or a hosted prompt management service (Mode B) |
| **WHO** | Central platform team builds SDK + lints; project architect self-attests with CI evidence |
| **WHEN** | `pre_merge`, required status check on the integration branch via branch protection |
| **HOW** | 3 lints: template_id ↔ registry consistency, no-inline-call AST scan, SDK version floor |

## The project team's three-step job

**Select** (which BPs apply to your patterns) → **Prioritize** (4 axes: legal / cost / CX / org readiness) → **Concretize** (named artefacts + gates + owners)

---

**AWS gives you the question. The RI is the audit.**
