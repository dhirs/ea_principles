# Aegis — Setup & Architecture Overview

What Aegis is, why it's built this way, and how the pieces fit. This is the
orientation doc; the runnable detail lives in `backend/README.md`.

## The idea

Aegis turns the enterprise AI architecture standards catalogue into a sellable
product. The catalogue, its rubrics, and its reference implementations are the
IP. The whole design exists to answer one question: **how do we sell access to
what the catalogue knows without ever handing the customer the catalogue?**

The answer: **distribute a thin wrapper, host the brains.** The customer's Claude
calls tools over MCP; the logic runs on our side; only derived conclusions
(which standards apply, the guardrail map, a review verdict) come back. The
`principles.json`, the rubrics under `data/sections/`, and the explain-prompts
never leave the server.

## Why not just ship a plugin / skill?

A Claude plugin or skill is markdown + data files copied onto the customer's
machine — fully readable. That gives distribution but **zero IP protection**. So
the plugin (later) is only a thin pointer to our hosted MCP server. The valuable
files stay here. Plugin = storefront; MCP server = engine.

## Folder layout

```
ai_principles_server/
  data/                     # THE IP — catalogue, rubrics, RIs (read-only to Aegis)
    principles.json         #   the 23-standard catalogue
    sections/*/rubric.json  #   per-section judge rubrics (never shipped)
  guardrail.md              #   the Component Boundary Model (zones)
  aegis/
    SETUP.md                # this file
    backend/                # the server-side engine
      aegis/
        __init__.py
        catalogue.py        # loads principles.json; applicability logic
        guardrails.py       # zone model + layered guardrail design
        rubrics.py          # review-against-standard; reads rubrics server-side
        server.py           # FastMCP server; registers the tools
      requirements.txt
      pyproject.toml
      .env.example
      README.md             # run + host detail
    frontend/               # (future) separate UI project; talks to backend only
```

The backend reads the catalogue from `../../data` by default; override with
`AEGIS_DATA_DIR`. Nothing in `data/` is ever returned wholesale.

## The tools (the product surface)

| Tool | Input | Returns (derived only) |
|---|---|---|
| `get_applicable_standards` | paradigms (`llm`/`rag`/`agentic`/`ml`) | applicable standards grouped by pillar + gate summary |
| `map_guardrails` | component_type (`llm`/`rag`/`agent`) | standards mapped to Zone 1/2/3 + cross-cutting band |
| `design_guardrail` | check_type | layered impl guidance: engine, deterministic-vs-probabilistic, on_trip, caveats |
| `review_against_standard` | standard_id, design | blocking-gate checklist; optional LLM-judge verdict |
| `catalogue_info` | — | catalogue metadata + standard count |

Design rule for every tool: **inputs go up, conclusions come back, the catalogue
stays hidden.** Prefer derived answers (verdicts, checklists, maps) over raw
standard text, so the IP can't be reconstructed by hammering the API.

## How the IP is protected, concretely

- `catalogue.py` returns a `_derive()` view — id, title, pillar, focus area, gate
  summary, why-it-matched. It drops the full problem/solution prose and the
  explain-prompt.
- `guardrails.py` joins only **titles** from the catalogue onto a hand-encoded
  zone map; no prose ships.
- `rubrics.py` reads the section rubric server-side but returns only dimension
  **names** + the threshold + the verdict. The `system_addendum` (the judge
  prompt + calibration) is never returned.

## Running it

Local / plugin mode (stdio):

```bash
cd aegis/backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python -m aegis.server
```

Point an MCP client (a Claude plugin) at `python -m aegis.server`. See
`backend/README.md` for the optional LLM-judge env vars.

## Verified behaviour

Against the live 23-standard catalogue:

- Agentic RAG (`["agentic","rag"]`) → 23 applicable, all mandatory.
- `map_guardrails`: LLM 13 / RAG 16 / Agent 21 — matches `guardrail.md` exactly.
- `review_against_standard("GS2B1-01", ...)` → 4 blocking gates + the gates
  rubric's dimension names.
- All five tools register on the FastMCP server.

## What comes next

1. **Auth + HTTP wrapper** — wrap the same `aegis.*` functions behind FastAPI
   with API-key / OAuth-per-org. That auth layer is also the billing meter.
2. **`aegis/frontend`** — a separate UI project that renders the derived output.
   It talks to the backend's API only; it never reads `data/`.
3. **The distributable plugin** — a ~20-line MCP config pointing at the hosted
   endpoint. This is the only thing the customer installs.
4. **Tiering** — decide per tool whether free/teaser or paid, and which return
   raw text (keep that to the teaser) vs derived answers (the paid core).
