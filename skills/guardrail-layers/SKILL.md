---
name: guardrail-layers
description: Use this skill for implementation-level discussions about how AI guardrails are built and layered at runtime — which engine does which check (Bedrock Guardrails / Azure Content Safety for PII, toxicity, denied topics as a managed first layer; a custom LLM-judge or NLI check for grounding/faithfulness; app-side code for business-logic verification), what order they run in, deterministic vs probabilistic checks, cost/latency per layer, where each maps onto the Zone 1/2/3 component-boundary model, and how to measure efficacy. Trigger when the user wants to design, compare, or sequence concrete guardrail engines for an LLM / RAG / agent — even without naming a file — e.g. "Bedrock or a custom check for X", "what runs before what", "is this deterministic", "how do I catch hallucinations", "where does this control sit". This is the HOW-a-guardrail-is-realised counterpart to the principles catalogue, not for authoring or scoring principles (that is `ai-architecture-principles`).
---

# Guardrail Layers — implementation-level design

This skill carries the operating knowledge for **focused discussions about how guardrails are actually
implemented** for an AI component (LLM call, RAG pipeline, or agent). It is the *how-to-build*
counterpart to the catalogue. The catalogue says which control must exist and which zone it sits in;
this skill is about which engine does the check, in what order, how much it costs, and how you know it
works.

**Boundary with `ai-architecture-principles`:** that skill authors, scores, and reviews catalogue
*principles* (`principles.json`, rubrics, RIs, promote/not_promote). This skill is for *implementation
design conversations* — engines, layering, deterministic-vs-probabilistic, cost/latency, efficacy. If
the user is authoring or scoring a principle, that is the other skill. If they are reasoning about how a
guardrail is realised in code/infra, it is this one.

## Read first (do not work from memory)

The architecture is already written down. Before reasoning about placement, read:

1. `guardrail.md` (repo root) — **The Component Boundary Model.** The three control zones (1 Ingress ·
   2 Process & act · 3 Pre-delivery gate) + the cross-cutting band, the per-standard mapping, and the
   `LLM ⊂ RAG ⊂ Agent` nesting. This is the source of truth for *where* a control sits. Do not restate
   it from this skill — read it.
2. `data/ri/GS2B1-01/README.md` — the worked RI for the output guardrail (managed vs custom config,
   `on_trip` fallback, the three pre-merge lints, the efficacy red-team). The template for how a Zone-3
   guardrail is specified.
3. The relevant principle in `data/principles.json` (e.g. `ST-GS2B1-01`) for the mandate the
   implementation has to satisfy.

Never enumerate which standard sits in which zone from this skill's memory — `guardrail.md` is canonical
and evolves.

## The layering model

A guardrail "check" is rarely one thing. Realised at runtime it is usually **stacked layers**, cheapest
and most deterministic first, most expensive and most probabilistic last. Run the cheap, certain checks
before the costly, fuzzy ones so most bad output is stopped before you pay for a model judge.

- **Layer 1 — Managed engine (off-the-shelf).** AWS Bedrock Guardrails, Azure AI Content Safety, Google
  Vertex safety. Handles the commodity, well-defined checks: **PII, toxicity/content, denied topics,
  prompt-injection word/pattern filters.** Pre-built, cheap, low-latency, near-deterministic at fixed
  config. First line. Owned centrally; projects configure denied-topic lists and sensitivities.
- **Layer 2 — Custom check (you build it).** The checks no managed product does well: **grounding /
  faithfulness** (is the answer supported by the retrieved context?), domain-specific policy checks.
  Implemented as an **LLM-as-judge** call or a smaller **NLI classifier**. Probabilistic, costs a model
  inference, needs tuning and measurement. Second line.
- **Layer 3 — App-side business-logic verification (not a "guardrail" engine).** Deterministic code
  that checks the answer against a live backend — is this offer still valid, does this account balance
  match. Out of scope for the guardrail SDK; it is application code. Call it out explicitly so it is not
  conflated with grounding (see scope rules below).

The same two inputs flow into the content checks: the **candidate response** and, for grounding, the
**retrieved context**. The fork by destination matters: a *response* to a user is gated in Zone 3; an
*action* to the world is gated in Zone 2 (before execution). Keep them separate.

## Decision rules to apply in a discussion

- **Deterministic vs probabilistic — name it every time.** PII regex / denied-topic match / size limits
  are deterministic. Grounding, toxicity scoring, and any LLM-judge are probabilistic. There is *no
  deterministic function for semantic faithfulness* — embedding cosine similarity is deterministic but
  measures topical overlap, not truth, and misses the "2 weeks vs 6 weeks" contradiction. If a user
  expects a deterministic grounding check, correct the premise: the problem isn't deterministic, so the
  check isn't.
- **Order cheapest-and-surest first.** Layer 1 managed filters before Layer 2 model judges, so most
  rejects cost a pattern match, not an inference.
- **Fail safe.** On a trip, return the declared `on_trip` fallback (block_and_replace / disclaimer /
  escalate) — never the raw model text, never an empty string. A guardrail with no defined fallback is
  half a control.
- **Cost & latency are per-layer and real.** Every probabilistic check is an extra inference on every
  response — latency the user feels, tokens Finance pays. Factor it; it is the live-path analogue of the
  CI cost objection. Tier or cache where defensible.
- **Wiring ≠ efficacy.** A lint/config proving the guardrail is plugged in does not prove it catches
  anything. Threshold floors are owned centrally (not a local dial to zero), and recall is measured by a
  periodic adversarial red-team — not assumed. Treat "it's configured" and "it works" as two separate
  claims.

## Scope honesty (state these in the room)

- **Grounded ≠ true.** A grounding check proves the answer is faithful to the *retrieved context*, not
  that the context is correct or current. A faithful answer over a stale document is grounded *and*
  wrong. Keeping the retrieval corpus accurate (freshness, versioning, source-of-truth ownership) is a
  *separate* concern — flag it, don't let the grounding badge imply it.
- **Guardrail ≠ business-logic verification.** The Zone-3 guardrail validates content/safety and
  grounding-against-context only. It does not check a live backend (offer validity, balances) — that is
  app-side Layer 3. Don't let one stand in for the other.

## How to run a focused guardrail discussion

1. **Fix the component and pattern** — LLM / RAG / agent. This sets which zones are in play
   (`LLM ⊂ RAG ⊂ Agent`).
2. **Name the check and its zone** — read `guardrail.md`, place it (ingress / process-act / pre-delivery
   / cross-cutting band).
3. **Pick the engine per layer** — managed (Layer 1) vs custom (Layer 2) vs app-side (Layer 3); justify
   the split, don't default everything to a model judge.
4. **Classify each check** deterministic vs probabilistic; order them cheapest-surest first.
5. **Define the trip behaviour** — the `on_trip` fallback, and who sees it.
6. **State cost/latency and efficacy** — the per-response inference cost, the owned threshold floor, and
   how recall is measured.
7. **Call the scope boundaries** — grounded≠true, guardrail≠business-logic — so nothing is over-claimed.

If runnable code helps, build the smallest end-to-end slice (model call → check → fallback) for the
specific check under discussion; prefer LLM-as-judge for grounding so the judge prompt is visible.
