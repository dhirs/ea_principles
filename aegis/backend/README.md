# Aegis — Backend

Server-side engine for the enterprise AI architecture standards catalogue.

**Why this exists:** the catalogue (`principles.json`), rubrics, and RIs are the
product IP. They must never ship to a customer's machine. This backend keeps them
server-side and exposes only *derived conclusions* — which standards apply, their
gates, a summary — through MCP tools (and, later, an authed HTTP API). Customers
get verdicts, not the engine.

## Layout

```
aegis/backend/
  aegis/
    __init__.py
    catalogue.py     # loads principles.json (IP), applicability logic
    server.py        # FastMCP server + tool definitions
  requirements.txt
  pyproject.toml
  .env.example
```

The catalogue itself lives at `../../data/principles.json` (the repo's canonical
copy). Override the location with `AEGIS_DATA_DIR`.

## Tools exposed

- **`get_applicable_standards(paradigms, include_nice_to_have=True)`** — given a
  project's serving paradigm(s) (`llm`, `rag`, `agentic`, `ml`), returns the
  applicable standards grouped by pillar, each with title, focus area, impact
  level, why it matched, and a gate summary. An Agentic RAG project is
  `paradigms=["agentic", "rag"]`.
- **`map_guardrails(component_type)`** — for `"llm"`, `"rag"`, or `"agent"`,
  returns the guardrail standards mapped onto the control zones (Zone 1 ingress,
  Zone 2 process & act, Zone 3 pre-delivery, cross-cutting band) with what each
  gates. Nesting applies (llm ⊂ rag ⊂ agent); Agentic RAG is `"agent"`.
- **`design_guardrail(check_type)`** — for `input_screening`, `content_safety`,
  `grounding`, `action_gate`, or `business_logic`, returns layered
  implementation guidance: engine per layer (managed / custom / app-side),
  deterministic-vs-probabilistic, the `on_trip` fallback, and scope caveats
  (grounded ≠ true; guardrail ≠ business-logic).
- **`get_reference_implementation(standard_id)`** — the step-by-step RI: the
  central-team responsibilities (Builds / Operates / Owns) vs the project-team
  responsibilities (Configures / Populates / Consumes), the interface contract
  including YAML config, and the acceptance criteria. Answers "what does MY team
  do vs the platform team?" Returns structured sections + the full markdown.
- **`review_against_standard(standard_id, design)`** — returns the standard's
  blocking gates as a review checklist. If `AEGIS_ANTHROPIC_API_KEY` is set, also
  runs an LLM-judge (using the private rubric + gates server-side) and returns a
  pass/fail verdict with per-gate reasons.
- **`catalogue_info()`** — catalogue metadata + standard count.

What the tools deliberately do **not** return: rubric calibration / judge
prompts, full problem/solution prose, or explain prompts. That is the moat —
read server-side, never shipped. `review_against_standard` exposes only rubric
dimension *names* + the threshold, plus the verdict.

## Optional automated judge

`review_against_standard` runs a deterministic gate checklist by default. Set
these to enable automated scoring (the rubric/prompt stays server-side):

```bash
export AEGIS_ANTHROPIC_API_KEY=sk-ant-...   # your key, billed to you
export AEGIS_JUDGE_MODEL=claude-sonnet-4-6  # optional, this is the default
```

## Run locally (stdio / plugin mode)

```bash
cd aegis/backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python -m aegis.server
```

Point a Claude plugin/MCP client at this command (`python -m aegis.server`) to
get the tools. The plugin you distribute is a thin pointer; the brains stay here.

## Hosting (SaaS path)

For the hosted product, wrap the same `aegis.catalogue` functions behind an
HTTP layer with auth (API key / OAuth per org) — that auth layer is also the
billing meter. The frontend project (separate, e.g. `aegis/frontend`) renders
the derived output; it never reads `data/` directly.

## Design rule

When adding tools: inputs go up, conclusions come back, the catalogue stays
hidden. Prefer returning derived answers (verdicts, scores, checklists) over raw
standard text, so the IP can't be reconstructed by hammering the API.
