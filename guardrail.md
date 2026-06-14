# The Component Boundary Model — Guardrails by Zone

A single conceptual frame for every AI component in the catalogue. The **component** is a black box — it can be an **LLM call**, a **RAG pipeline**, or an **autonomous agent**. The boundary around it is universal; only what fills each zone changes with the pattern.

A guardrail earns its place in a zone only if a **gate** can sit on that crossing. This is why the model has three control zones, not four: "what comes out" is the *artefact* flowing between the component and the user — not a checkpoint. Output forks by destination (response → the user, action → the world), and each fork is gated in a different zone.

```
                          ┌───────────────── CROSS-CUTTING BAND ─────────────────┐
                          │  observability · eval · drift · model & prompt gov.   │
                          │                                                       │
   user / system          │   ┌─────────────────────────────────────────────┐    │
   input ───────▶ [ ZONE 1 ]─▶│   THE COMPONENT        [ ZONE 2 ]            │    │
   retrieved ───▶  INGRESS    │   LLM call / RAG / agent  PROCESS & ACT      │    │
   tool results ▲            │   └──────────────┬─────────────┬──────────────┘    │
                │            │                  │             │                   │
                └────────────┼── action to the WORLD ◀────────┘  (gated in Zone 2)│
                  (agent loop)│                 │                                  │
                          │   response ─────▶ [ ZONE 3 ] ─────▶ end user           │
                          │                 PRE-DELIVERY GATE                      │
                          └───────────────────────────────────────────────────────┘
```

**Patterns legend:** ● mandatory · ◐ recommended · ○ optional · `·` not applicable. Columns are **L**LM-only / **R**AG / **A**gent.

For an autonomous agent the boundary is a **loop, not a line**: an action in Zone 2 produces a result that re-enters as Zone 1 ingress, and the cycle repeats N times before a response ever reaches Zone 3. That is why agents carry the most guardrails — every iteration re-crosses Zones 1 and 2.

---

## Zone 1 — Ingress: what is allowed *in*

Controls everything that crosses into the component: the user's input, and — for RAG/agents — anything retrieved or returned by tools that enters the model's context.

| Standard | L R A | What it gates here |
|---|:---:|---|
| **ST-GS4B2-01** — Screen user input before it reaches the model | ● ● ● | Input is checked, size- and rate-bounded before the model acts. EU AI Act: Art 15 (cybersecurity / prompt injection). |
| **ST-GS1B3-01** — Never let a user retrieve what they aren't allowed to see | `·` ● ● | Retrieval is scoped to the asking user's entitlements. EU AI Act: Art 10 (data governance). |
| **ST-GS1B3-02** — Never ingest what the model should never process | `·` ● ● | Prohibited / out-of-scope data is kept out of the store at write time. EU AI Act: Art 10 (data governance). |
| **ST-GC4B1-01** — Use no more embedding dimensions than retrieval needs | `·` ● ● | Right-sizes the embedding / retrieval pipeline that feeds context in. |

---

## Zone 2 — Process & act: what the component *does*

Controls the model call itself and any action the component takes in the world. This is where the **action-to-the-world fork** is gated — before execution, not after.

| Standard | L R A | What it gates here |
|---|:---:|---|
| **ST-GS5B1-01** — Check a consequential action before it happens, not after | `·` `·` ● | Irreversible / externally-visible actions pass a check before they run. EU AI Act: Art 14 (human oversight). |
| **ST-GC5B1-01** — Give every agent a limit it cannot run past | `·` `·` ● | Bounds the agent loop / spend so it cannot run away. |
| **ST-GC1B1-01** — Choose a model deliberately, and record why | ● ● ● | Constrains which model the component is allowed to call, with a recorded rationale. |
| **ST-GC3B1-01** — Keep the cost of every prompt under deliberate control | ● ● ● | Disciplines the prompt the component sends to the model. |
| **ST-GC3B3-01** — Don't pay twice for the same prompt content | ● ● ● | Caches repeated prompt content across calls. |

---

## Zone 3 — Pre-delivery gate: safe to hand to the *user*

Controls the response on its way to a human — the last checkpoint before a person sees the output.

| Standard | L R A | What it gates here |
|---|:---:|---|
| **ST-GS2B1-01** — Check a model's response before it reaches a user | ● ● ● | Response passes a safety check with a safe fallback before display. EU AI Act: Art 15 (robustness / output safety) + Art 15 (accuracy / grounding). |

> **Known thinness / gap.** Zone 3 currently holds a single standard, and its gate spans two concerns (output content-safety **and** grounding/accuracy). Art 50 disclosure ("tell the user it's AI") has no standalone standard yet. This zone is the catalogue's least-developed crossing and a candidate for splitting GS2B1-01 and adding a disclosure standard.

---

## Cross-cutting band: wraps every zone

These do not sit on one crossing — they watch the whole component. Drawn as a band around the box, not a point on the boundary. (ST-GS6B1-01 is **build-time**: it governs the data that shapes the model before it is ever deployed, upstream of the runtime boundary.)

| Standard | L R A | What it wraps |
|---|:---:|---|
| **ST-GO3B2-01** — Make every AI workload observable through one consistent channel | ● ● ● | Observability across all zones. |
| **ST-GO3B2-02** — Govern who reads traces and how long they live | ● ● ● | Data governance over the observability stream. |
| **ST-GO1B1-04** — Notice a model drifting before your users do | ● ● ● | Continuous quality monitoring. |
| **ST-GO1B1-03** — Measure quality the same way every time | ● ● ● | Consistent measurement method. |
| **ST-GO1B1-06** — Know which model you're running, and re-prove before you change it | ● ● ● | Model versioning / change control. |
| **ST-GO3B1-01** — Treat prompts as governed assets, not scattered strings | ● ● ● | Prompt governance. |
| **ST-GC2B2-01** — Size AI infrastructure to real demand | ● ● ● | Infrastructure right-sizing / cost-ops. |
| **ST-GO1B1-01** — Prove an agent still behaves before you ship a change | `·` `·` ● | Pre-ship evaluation. |
| **ST-GO1B1-02** — Judge an agent on its weakest group, not its average | `·` `·` ● | Fairness in evaluation. |
| **ST-GO1B1-05** — Keep the yardstick current with how the system is really used | `·` `·` ● | Evaluation-set maintenance. |
| **ST-GS6B1-01** — Never train a model on data no one has examined | ● ● ● | Training-data integrity (**build-time**, upstream of the runtime boundary). EU AI Act: Art 10 + Art 15 (poisoning); generic-ML, outside the eight GenAI-distinctive controls. |

---

## How the patterns nest

The zones are constant; the fill grows with the pattern — which is why **LLM ⊂ RAG ⊂ Agent**.

- **LLM call** — Zone 1 = just user input; Zone 2 = one inference; Zone 3 = output check. 13 mandatory standards.
- **RAG pipeline** — Zone 1 gains retrieval-auth, ingestion governance, and embedding discipline. 16 mandatory.
- **Autonomous agent** — Zone 2 gains the action gate and the loop; the eval band thickens. All 21.

The increments are intuitive: **retrieval adds data-boundary controls (Zone 1); autonomy adds action control (Zone 2) and harder evaluation (the band).**
