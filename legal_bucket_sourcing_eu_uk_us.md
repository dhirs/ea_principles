# Sourcing standards for the Legal / Compliance bucket — EU vs UK vs USA

## Why this document exists

Our catalogue splits AI failure into three buckets: **cost**, **customer experience**, and **legal / compliance**. Cost and CX have no external legal source of truth — we set our own bar and source the standards from the AWS GenAI Lens (and our own baseline). The legal / compliance bucket is the one bucket where **we do not get to invent the baseline**. We inherit it from whatever instrument creates legal liability, and translate that into our standard format.

So the question for this bucket is narrow: **what is the binding source of truth, and how do we source standards from it?** And because we operate across the EU, the UK, and (potentially) the US, the answer differs by jurisdiction.

## The sourcing principle (applies in every jurisdiction)

Anchor the legal bucket's spine to the **binding legal instrument** of the jurisdiction — never to a methodology. The recurring mistake is starting from NIST sub-categories because they are a tidy, exhaustive list. NIST is a *risk-management taxonomy, not a register of legal obligations*; anchoring to it drops the regulatory-procedure duties that have no NIST equivalent.

The correct order is law-first, NIST-last:

1. **Enumerate the obligations** from the binding instrument(s). This is the row set and defines "done" for the bucket.
2. **Classify each system** — which obligations activate (risk tier / regulated activity / automated decision / sector / market reach).
3. **Map each obligation to ISO 42001** — the management system that governs and evidences it.
4. **Map each obligation to the GenAI Lens / our catalogue principle** — the engineering implementation.
5. **Tag with NIST, then sweep** — as a neutral crosswalk index and a coverage cross-check. Anything the sweep surfaces that is non-legal routes to the cost or CX buckets.

Across all three jurisdictions: **NIST is never the spine** (it is an index in the EU/UK, and the de facto common methodology in the US), and **ISO 42001 is the portable management-system wrapper** that helps everywhere.

## How sourcing differs by jurisdiction

### EU — source from the EU AI Act
The EU AI Act (Reg. 2024/1689) is a single, binding, horizontal law. It is the spine. Enumerate obligations from the articles/annexes, scoped by **risk tier** (prohibited / high-risk / limited / minimal) and **role** (provider vs deployer). High-risk obligations (risk-management system, data governance, technical documentation, logging, human oversight, accuracy/robustness/security, QMS, conformity assessment, EU-database registration, post-market monitoring) become the legal standards. ISO 42001 is the practical route to discharging the Act's own Art 9 (risk-MS) and Art 17 (quality-MS) requirements.

### UK — source from UK GDPR + FCA + sector regulators (with an EU AI Act overlay)
There is **no UK AI Act**. The UK runs a principles-based, regulator-led regime, so the legal spine is assembled from existing instruments:
- **UK GDPR** — especially the solely-automated-decision rules (Articles 22A–22D after the Data (Use and Access) Act 2025): human review, contest, meaningful information about the logic.
- **FCA conduct** — Consumer Duty and ICOBS for financial services / insurance.
- **Sector regulators** — ICO, FCA, MHRA, Ofcom applying the five cross-sector AI principles within their existing remits.
- **EU AI Act as an overlay** — binds UK firms *only* where AI is placed on the EU market or its output is used in the EU (Article 2 extraterritorial reach). If there is no EU reach, the Act does not apply and the spine is purely the UK instruments above.

### USA — source from sector prudential regulation (with NIST as the common methodology)
There is **no horizontal AI law**. For banks and insurers the binding obligations come from existing, technology-neutral sector regulation, applied through supervisory examination:
- **Banks** — Model Risk Management (the SR 11-7 lineage, replaced April 2026 by revised interagency MRM guidance): model inventory, independent validation, documentation, ongoing monitoring, board oversight, third-party validation. Plus fair-lending (ECOA / CFPB adverse-action explainability).
- **Insurers** — the NAIC AI Model Bulletin (2023; adopted by ~24 states + DC): written AI governance program, risk management, third-party oversight, bias / unfair-discrimination testing. The NAIC AI Systems Evaluation Tool (piloting through 2026) makes this examination-ready.
- **Security** — handled through existing cyber regimes (GLBA Safeguards Rule, NYDFS 23 NYCRR 500, FFIEC), not an AI-specific clause. NYDFS issued a May 2026 advisory on frontier-AI cyber threats under the existing rule.
- **NIST AI RMF + NIST CSF** rise to become the *primary* common framework here, precisely because there is no horizontal law to displace them.

## Comparison table

| Dimension | EU | UK | USA (banks & insurers) |
|---|---|---|---|
| **Binding instrument** | EU AI Act (Reg. 2024/1689) — one horizontal law | No AI Act — UK GDPR + FCA + sector regulators | No horizontal law — sector prudential regulation + supervisory guidance |
| **Legal spine to source from** | AI Act articles / annexes | UK GDPR (Art 22A–22D), FCA (Consumer Duty, ICOBS), ICO guidance | MRM guidance (banks); NAIC AI Model Bulletin (insurers); GLBA / NYDFS 500 (security); fair-lending |
| **What activates obligations** | Risk tier + provider/deployer role | Automated decisioning, sector conduct rules, + EU AI Act *if* EU market reach | "It's a model" / regulated activity / consumer-data handling; asset & materiality thresholds |
| **Risk model** | Prescriptive 4-tier pyramid + GPAI track | Principles-based, regulator-applied | Principles-based, risk-proportionate supervision |
| **How security is sourced** | Legal obligation — Art 15 (accuracy, robustness, cybersecurity) | UK GDPR security duty + FCA + (AI Act Art 15 if EU reach) | Existing cyber regimes (GLBA, NYDFS 500, FFIEC) + MRM validation + third-party risk |
| **Role of NIST** | Index / crosswalk (not binding) | Index / crosswalk (not binding) | De facto *primary* common framework |
| **Role of ISO 42001** | Certifiable route to Art 9 & 17 conformity | Portable management-system wrapper (voluntary) | Optional best practice; exams are the real route |
| **Enforcement** | Conformity assessment + CE marking *before* market | Regulator supervision + enforcement under existing law | Supervisory & market-conduct examination (ex-post) |
| **Penalties** | Up to €35M / 7% turnover | Under existing UK GDPR / FCA powers | Existing supervisory / consumer-protection powers (consent orders, MRAs, civil penalties) |

## Takeaways for the catalogue

1. **One sourcing method, three different spines.** The pipeline (law-first, NIST-last) is identical everywhere; only the binding instrument at step 1 changes by jurisdiction.
2. **Classification is unavoidable, controls are reusable.** Every system needs a per-system classification (tier / automated-decision / sector / market reach) to decide which obligations activate — but the controls behind each obligation are built once and inherited.
3. **NIST is never the spine.** It is an index in the EU/UK and the common methodology in the US. Do not start the legal enumeration from it.
4. **ISO 42001 is the portable layer.** A single 42001-aligned management system gives auditable evidence that travels across all three jurisdictions, regardless of which legal spine applies.
5. **The destinations converge.** EU, UK and US all land on similar controls — inventory, validation, monitoring, human oversight, security, bias testing. The EU mandates them ex-ante through one law; the UK assembles them from existing regulators; the US extracts them ex-post through supervisory exams.

---

## From legal obligations to an *implementable* standards catalogue (EA scope)

The sourcing pipeline above tells us **which obligations exist**. This section narrows from there to **what enterprise architecture actually owns and ships**: system-level, GenAI-specific, testable controls. The funnel has three gates, then a decomposition-and-coverage step.

### Scoping decision: EA owns system-level, not org-level

The EU AI Act's high-risk requirements split into two layers:

- **Org / program-level** — Technical Documentation (Art 11), Quality Management System (Art 17), Conformity Assessment & CE marking (Art 43, 47, 48), EU-database Registration (Art 49). A model cannot *implement* these; they are legal artefacts and management process. **These are owned by the Risk / Governance team, not enterprise architecture.** They reference the system; they are not standards the system meets.
- **System-level** — Data Governance (Art 10), Logging (Art 12), Transparency (Art 13, 50), Human Oversight (Art 14), Accuracy/Robustness/Security (Art 15), plus GPAI duties (Art 53). These translate into controls an LLM / agent / ML model can be **built to and tested against**. **This is the EA catalogue's scope.**

So Gate 1 is: **drop the org-level obligations** to the Risk/Governance register and keep only the system-level ones.

### Gate 2: filter system-level → GenAI-specific

GenAI-specificity is a **per-control filter, not a per-category one**. Each system-level category contains both generic-ML controls and GenAI-distinctive controls. The litmus test for each individual control:

> *Would this control still exist if the model were a logistic regression or a rules engine?*

If yes → it is generic ML/data governance (e.g. bias testing, representativeness, drift) — real, but not GenAI-specific. If the control only exists because the system **generates free-form content, accepts free-form input, or acts autonomously** → it is GenAI-distinctive and belongs in this catalogue. Equivalent shorthand: *does it have a home in the AWS GenAI Lens but not in base Well-Architected?* — same filter, different lens.

### The GenAI-distinctive control set (output of Gates 1–3)

Applying both gates yields the eight controls with **no analogue in classic ML** — the implementable spine of the legal bucket:

1. **Synthetic-content watermarking & labelling** — Art 50
2. **Prompt-injection / jailbreak resistance** — Art 15 (cybersecurity)
3. **Hallucination / grounding / factuality** — Art 15 (accuracy)
4. **Output content-safety filtering** — toxicity / harmful generation (Art 5 prohibited-use + Art 15)
5. **Training-corpus provenance & copyright** — GPAI Art 53
6. **RAG / retrieval-context governance** — the GenAI slice of Art 10
7. **Agentic action authorisation & tool-use gating** — agent-specific oversight (Art 14 applied)
8. **Prompt / completion / token logging** — the GenAI slice of Art 12

### Decomposition method — and why NOT ISO 42001 here

Each of the eight controls decomposes into **best practices** (testable, enforceable statements). The decomposition source must operate at the **system layer**, so:

- **Do NOT decompose through ISO 42001.** 42001 is a management-system standard; its Annex A controls are governance/process controls (policy, roles, impact assessment) — i.e. the **org-level layer we deliberately excluded at Gate 1**. Decomposing the eight through 42001 drags the work back up to the governance layer the Risk/Governance team owns. 42001 stays where the rest of this document puts it: the portable **evidence / management wrapper**, not the engineering decomposition.
- **DO decompose through system-level technical frameworks:**
  - **OWASP Top 10 for LLM Applications** — prompt injection, insecure output handling, training-data poisoning, excessive agency. Maps closely onto controls 2, 4, 5, 7.
  - **MITRE ATLAS** — adversarial-ML attack/defence techniques (jailbreaks, evasion, extraction).
  - **NIST Generative AI Profile (AI 600-1)** — GenAI-specific risk-management actions.

This keeps the same *law-first, methodology-second* discipline as the sourcing pipeline — applied one layer down, at the system control.

### Coverage check against the AWS GenAI Lens

For each decomposed best practice, crosswalk to the **AWS GenAI Lens** (the catalogue's primary anchor):

- **Covered by a Lens BP** → anchor the standard to that BP in `framework_mappings.aws` (the normal case).
- **Not covered** → implement it as a **new standard that extends beyond AWS**, recorded with `mapping_state: 'na'` and a note explaining the GenAI obligation it discharges. This is already the catalogue's sanctioned path for principles with no AWS analogue — no new machinery required.

### Tagging, not splitting

Do not fork into separate catalogues per system type. Tag every standard `applies_to: {ML, LLM, agent}`. A generic data-governance control is `{ML, LLM, agent}`; watermarking is `{LLM}`; tool-use gating is `{agent}`. One catalogue, filtered by system type at implementation time.

### The method in one line

**All obligations → drop org-level (Risk/Governance owns it) → keep system-level → filter to GenAI-specific (the 8) → decompose into BPs via OWASP-LLM / ATLAS / NIST-GenAI (not 42001) → crosswalk to GenAI Lens (gap = new standard, `mapping_state: 'na'`) → tag `applies_to`.**
