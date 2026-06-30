# BUILD — Mini test harness for ST-GS4B2-01

> **For Claude Code.** This file is the spec. Build out the scaffold in this folder into a
> working mini-project that tests the standard. The scaffold already runs end-to-end with a
> stub model and seed corpus; your job is to flesh out the TODOs and expand the corpus.
>
> **This folder is a reusable template.** Every standard we test gets a `tests/<standard>/`
> folder with this same shape: `BUILD.md` (spec) + scaffolding code. Keep the structure
> stable so the pattern generalises.

## The standard

**ST-GS4B2-01 — "Screen user input before it reaches the model."** Zone 1 ingress guardrail.
Every path that puts user-influenced text into a model prompt must route it through an input
guardrail (prompt-injection + size/rate limits) before the model is called, with a declared
`on_trip` fallback.

## What this harness must prove — TWO separate claims

A demo that only shows "attack blocked" is not enough. Prove both, separately:

1. **Wiring** — no input reaches the model unscreened. Shown by the guarded path routing through
   the guardrail, and the **unguarded path** (deliberate bypass) letting the same attack through.
   This is the failure the routed-input AST lint exists to prevent.
2. **Efficacy** — the guardrail actually *catches* injections, **measured** against a labelled
   corpus. Output two numbers: **catch-rate (recall on attacks)** and **false-positive rate (on
   benign input)**. Wiring ≠ efficacy: a guardrail tuned to its weakest setting passes wiring and
   fails efficacy.

These two numbers are the `mechanical_evidence` a SYSC 4.1.1R / EU AI Act Art 15 examiner would accept.

## The layered design (cheapest-and-surest first)

Run layers in order; short-circuit on the first trip so most rejects cost a cheap check, not an inference.

| Layer | Engine | Determinism | What it catches |
|---|---|---|---|
| **0** | size + rate limits (plain code) | deterministic | oversized prompts, brute-force / cost-inflation |
| **1** | pattern / keyword filter (stand-in for Bedrock Guardrails / Azure Content Safety) | deterministic at fixed config | known injection phrasings, prompt-extraction probes |
| **2** | LLM-as-judge | probabilistic | novel jailbreaks Layer 1 misses |

`on_trip`: `block_and_replace` (return the declared safe message) or `escalate`. **Never** return the
raw model call on a trip. There is no deterministic function for "is this a jailbreak" — name Layer 2
as probabilistic.

## Scope boundaries (do NOT build these here)

- **Context boundary** (delimiting user text in the template) — belongs to GO3B1-01's template registry.
- **Output / grounding safety** — belongs to GS2B1-01. This harness is **input only**.

## Directory layout

```
tests/GS4B2-01/
  BUILD.md                  <- this spec
  requirements.txt
  .env.example
  guardrails/input.yaml     <- the declared guardrail config (mirrors the standard's contract)
  src/
    config.py               <- loads input.yaml
    model_client.py         <- model call (stub now; real provider = TODO)
    guardrail.py            <- orchestrates Layer 0/1/2 + on_trip
    layers/
      layer0_limits.py      <- deterministic size + rate
      layer1_patterns.py    <- pattern/keyword injection filter
      layer2_judge.py       <- LLM-as-judge (judge prompt is visible; real call = TODO)
    app.py                  <- guarded_chat() + unguarded_chat() (the bypass demo)
  corpus/
    attacks.jsonl           <- labelled injection prompts (seed; EXPAND to ~30-50)
    benign.jsonl            <- benign lookalikes (seed; EXPAND to ~30-50)
  harness/
    metrics.py              <- confusion matrix, recall, FP rate, per-layer latency
    run_redteam.py          <- runs corpus -> the two numbers
  tests/
    test_wiring.py          <- asserts guarded blocks / unguarded leaks
```

## TODO checklist for Claude Code

- [ ] **Layer 1** — expand the pattern list in `layers/layer1_patterns.py`; ideally swap in a real
      managed engine (Bedrock Guardrails `ApplyGuardrail`, or Azure AI Content Safety) behind the same
      interface. Keep the pattern fallback for offline runs.
- [ ] **Layer 2** — implement the real LLM-judge call in `layers/layer2_judge.py` (provider read from
      `.env`). The `JUDGE_PROMPT` is already written; wire the API and parse the JSON verdict. Keep the
      offline heuristic as a fallback so the harness runs without a key.
- [ ] **Model client** — implement a real provider in `src/model_client.py` (optional; the stub is
      fine for proving wiring + efficacy, since the guardrail screens *before* the model).
- [ ] **Corpus** — grow `corpus/attacks.jsonl` to ~30-50 across all four classes (instruction-override,
      prompt-extraction, tool-hijack, sensitive-data-extraction) and `corpus/benign.jsonl` to a matching
      count of hard benign lookalikes (so FP rate is meaningful).
- [ ] **Threshold** — set the Layer 2 catch-rate threshold in `guardrails/input.yaml` and make
      `run_redteam.py` exit non-zero if recall is below it (this is the quarterly-red-team gate).
- [ ] **Per-layer cost/latency** — make `metrics.py` report mean latency per layer so the "don't default
      everything to a model judge" argument is visible in numbers.

## How to run

```bash
cd tests/GS4B2-01
pip install -r requirements.txt
python -m harness.run_redteam        # prints confusion matrix + catch-rate + FP rate
python -m pytest tests/              # wiring: guarded blocks, unguarded leaks
```

## Acceptance

- `run_redteam` prints a confusion matrix and the two headline numbers, and exits non-zero when
  catch-rate < threshold.
- `test_wiring` shows the same attack is **blocked on the guarded path** and **passes on the unguarded
  path** — the bypass failure made concrete.
- The harness runs offline (stub model + heuristic judge) and upgrades cleanly when real engines are wired.
