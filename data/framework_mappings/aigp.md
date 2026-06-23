# AIGP (IAPP AI Governance Professional) — mapping methodology

> A **cross-reference** to the IAPP AIGP competency framework — informational, showing which AI-governance competency each standard supports.

| | |
|---|---|
| **Framework key** | `aigp` |
| **Role** | cross-reference (informational, no enforcement) |
| **Status** | populated (audited + verified) |
| **Standards mapped** | 17 / 24 (7 cleared as no-fit — all surviving refs `verified`) |
| **Mapped against** | **AIGP Body of Knowledge v2.1** (effective 2026-02-02), 4-domain structure |
| **Convention in `taxonomy.json`** | `framework_mappings_spec.aigp_convention` |
| **Last reviewed** | 2026-06-23 |

## WHY we map to it

**What AIGP is.** AIGP (Artificial Intelligence Governance Professional) is a certification from the IAPP. It is **not a law and not an engineering spec** — it is a *competency framework*: a map of the governance areas an organisation is expected to have a handle on, organised into 4 domains and their competencies. The competencies our standards map to (official BoK v2.1):

- **Domain I — Foundations of AI governance:** I.C *Establish policies and procedures throughout the AI life cycle.*
- **Domain III — Governing AI development:** III.A *Govern the designing and building of the AI system*; III.B *Govern the collection and use of data in training and testing the AI system*; III.C *Govern the release, monitoring and maintenance of the AI system.*
- **Domain IV — Governing AI deployment and use:** IV.A *Evaluate factors/risks relevant to the decision to deploy*; IV.B *Perform key activities to assess the AI system*; IV.C *Govern the deployment and use of the AI system.*

Each is a *governance area*, not a technical rule. (Domain II is law/standards knowledge — no technical standard "is how we do" a knowledge competency, so nothing maps there.)

**What the mapping does.** It answers one question: **"which governance area does this engineering standard belong to?"** It is a bridge from our technical controls to the governance vocabulary a compliance reviewer or ARB thinks in — so a governance person can look at a standard and see "that is how we actually deliver part of *that* governance area." It is a cross-reference, never an anchor.

## HOW we map

**Field shape** (`framework_specific_reference_fields.aigp`): `domain`, `competency`. No step/article structure — AIGP references map at the **competency level** directly.

**The test — "IS how we do X".** Because AIGP is a competency, not an obligation a gate can "discharge", its mapping rule is its own: a standard earns a reference only if its enforced mechanism can finish the sentence **"this standard IS how we do [competency]"** — checked against the competency's actual definition. If the best you can say is "this standard is *sort of near* [competency]", it does **not** earn the tag. "Same topic, roughly" is exactly the failure to avoid.

**Good example.** **GO3B1-01** ("Treat prompts as governed assets") forces every prompt into a registered registry — owner, version, code contract. Competency **I.C** is *Establish policies and procedures throughout the AI life cycle.* The registry literally *is* an enforced lifecycle policy for prompt assets → it finishes the sentence: "GO3B1-01 IS how we establish a lifecycle policy/procedure for prompts." Earns I.C.

**Bad example (cleared in the 2026-06-23 audit).** **GC3B1-01** ("Keep the cost of every prompt under control") enforces a token budget. There is **no AIGP competency for cost/FinOps** — the closest you can say is "it happens during the lifecycle," which is "sort of near," not "IS how we do." It was removed rather than forced. The whole GENCOST cost family and the GENREL reliability family cleared for the same reason (the BoK has no cost or software-resilience competency).

**PRIMARY vs secondary.** A standard may genuinely deliver more than one competency; mark the one it most directly *is* as PRIMARY, the rest secondary. Many standards deliver **none** — that is a valid outcome, not a gap to fill.

**`mapping_state`:** `verified` once checked against the official AIGP competency definition; `unverified` while provisional. (After the 2026-06-23 audit, **all 17 surviving references are `verified`** against BoK v2.1. The earlier set was `unverified`, placed by the now-retired "subject-matter proximity" method.)

## How to (re)map a standard to AIGP — the procedure

1. **Get the authoritative competency definition.** What does this AIGP competency *actually* cover, per the IAPP AIGP body of knowledge? The current tags were placed without this — it is the missing source of truth and the prerequisite for any real mapping.
2. **Read the standard's mechanism** — its `statement` + `gates` (what the check actually enforces).
3. **Apply the "IS how we do X" test** against the real definition. Keep, downgrade, or remove.
4. **Pick PRIMARY** (the competency the standard most directly *is*); record secondaries only if they also pass the test.
5. **Write the `note`** so it finishes the "IS how we do [competency]" sentence — that sentence is the justification.
6. **Set `mapping_state: verified`** (you checked it against the definition) and `last_checked` to today.
7. **Bump the standard's version + add a `change_history` entry**; do it one standard at a time.

## STATUS — what's mapped

17 of 24 standards carry a `verified` `aigp` reference after the 2026-06-23 audit:

- **III.B** (data in training/testing): GO1B1-01, GO1B1-02, GO1B1-05, GS6B1-01, GS1B3-02
- **III.C** (release/monitoring/maintenance): GO1B1-04, GO1B1-06, GO3B2-01
- **IV.C** (govern deployment & use): GO3B2-02, GC5B1-01, GS1B3-01, GS2B1-01, GS4B2-01, GS5B1-01
- **I.C** (lifecycle policies/procedures): GO3B1-01
- **IV.A** (deploy decision): GC1B1-01
- **IV.B** (assess the system): GO1B1-03

**7 cleared — no natural competency fit** (cost/FinOps and reliability engineering are not AIGP competencies): GC2B2-01, GC3B1-01, GC3B2-01, GC3B3-01, GC4B1-01, GR3B1-01, GR3B2-01.

## Open items

- **Re-check on each new BoK release** (the BoK updates roughly annually — v2.0.1 Feb 2025, v2.1 Feb 2026). See the refresh procedure in `README.md`.
- AIGP mappings are **not yet surfaced as a sidebar filter** in the app (open UI work).
