# From AWS principle to enforceable RI

*Worked example: GENOPS03-BP01 → GO3B1-01*

---

## Slide 1 — Title

**From AWS principle to enforceable RI**

The AWS GenAI Lens is the question. The reference implementation is the audit.

Worked example: `GENOPS03-BP01` → `GO3B1-01`

---

## Slide 2 — The AWS GenAI Lens, at a glance

Five pillars, fifteen questions, around thirty best practices. Each BP is one paragraph of guidance.

- **Pillar 1** — Operational Excellence
- **Pillar 2** — Security
- **Pillar 3** — Reliability
- **Pillar 4** — Performance Efficiency
- **Pillar 5** — Cost Optimization

Hierarchy: Pillar → Question → Best Practice.

Example: Operations → GENOPS03 (Observability in workloads) → BP01 (Implement prompt template management).

---

## Slide 3 — AWS stays abstract, deliberately

AWS publishes for thousands of customers across every industry. Hypothesising the business context for each one would multiply infinitely.

AWS picks the highest-leverage layer it can publish once: **what to aim for**.

Naming WHERE the artefact lives, WHO validates it, WHEN it gates, and HOW you prove it works — that's the consuming organisation's job.

**AWS gives you the question. The audit is yours.**

---

## Slide 4 — What AWS gives you

**GENOPS03-BP01 · Implement prompt template management**

> *"Implement and maintain a versioned prompt template management system. Test and compare different prompt variants. Capture baseline metrics of the model output. Use the Amazon Bedrock SDK to incorporate prompts during model inference."*

One paragraph. No paths. No CI gates. No owners. No definition of "done".

A team can read this, nod, and ship anything from a `prompts.txt` file to a hosted prompt management system — both nominally compliant.

---

## Slide 5 — The four things AWS leaves blank

| Dimension | The question AWS doesn't answer |
|---|---|
| **WHERE** | does the artefact live? Repo path? Hosted service? Database? |
| **WHO** | validates it? Project architect? Central team? Regulator? ARB? |
| **WHEN** | does it gate? Pre-merge? Pre-deploy? Quarterly review? Annual audit? |
| **HOW** | do you prove it works? What artefact does the auditor inspect? |

The catalogue exists to fill these four gaps. Every principle answers all four.

---

## Slide 6 — The project team's three-step job

**Step 1 — Select**
Which BPs apply to your workload patterns (LLM / RAG / agent / ML) and serving paradigm.

**Step 2 — Prioritize**
Score on the 4 axes: legal risk, cost, customer experience, org readiness. Veto at 5 on any axis.

**Step 3 — Concretize**
Convert into a reference implementation with named artefacts, gates, owners, and acceptance criteria.

The catalogue ships pre-built RIs for common patterns. Teams inherit, override, or extend.

---

## Slide 7 — The catalogue's concretization

**GO3B1-01 · Route every model call through a registered, versioned prompt template via the central SDK**

| Dimension | The catalogue's answer |
|---|---|
| **WHERE** | `prompts/manifest.yaml` + `prompts/<template_id>.md` in the workload repo (Mode A), or a hosted prompt management service (Mode B) |
| **WHO** | Central platform team builds the SDK + lints; project architect self-attests with CI evidence |
| **WHEN** | `pre_merge`, configured as a required status check on the integration branch via branch protection |
| **HOW** | Three CI lints: `template_id` ↔ registry consistency; no-inline-call AST scan; SDK version floor |

---

## Slide 8 — The contrast

**AWS GENOPS03-BP01**
- Form: one paragraph of guidance
- Where: unspecified
- Who validates: unspecified
- When it gates: unspecified
- What the auditor inspects: unspecified
- Outcome: "use Bedrock Prompt Management"

**Catalogue GO3B1-01**
- Form: statement + problem + solution + 3 gates + RI
- Where: `prompts/manifest.yaml`
- Who: project architect + central platform team split
- When: pre_merge required status check
- Inspector reads: 3 CI lint logs + manifest
- Storage-neutral: file-based OR hosted TMS

---

**AWS gives you the question. The RI is the audit.**
