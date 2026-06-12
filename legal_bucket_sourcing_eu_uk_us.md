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
