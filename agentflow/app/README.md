# agentflow

LangGraph pipeline that authors AI Architecture Principles for the catalogue at
`data/principles.json`. It runs an AWS Well-Architected GenAI Lens step through a
two-phase process — **step promotion** (does this step earn a principle?) and
**per-principle authoring** (author each field through rubric-gated generate →
rubric → revise loops) — then writes a ratified principle entry back to the
catalogue.

## Architecture

- **One generic section subgraph** (`section_subgraph.py`): every LLM-authored
  section runs through the same `generate → rubric → revise` loop with a bounded
  retry. Sections are *data* (the prompt JSON files under `data/sections/<x>/`),
  not code — adding a section is three JSON files + one line in `SECTION_ORDER`.
- **One parent graph per principle** (`pipeline.py`): one node per section,
  chained, compiled with a checkpointer and run with `thread_id = principle_id`.
  A crash mid-section resumes at that section. A hard-failed section halts the
  rest and leaves the checkpoint for human inspection.
- **Checkpointing in Supabase over REST** (`supabase_checkpointer.py`): a
  `BaseCheckpointSaver` that persists through the Supabase REST API (the direct
  Postgres host is IPv6-only and unreachable here, and the REST API is IPv4).
  Standard LangGraph checkpointing — one store.
- **LangSmith tracing**: env-driven (`LANGCHAIN_*` in repo `.env`); each run is
  named/tagged by principle + section; the LLM client is wrapped so calls show as
  spans. Project: `agentflow`.

## Install

```bash
python3 -m venv .venv && . .venv/bin/activate
pip install -e .            # or: pip install -e ".[dev]" for tests
```

One-time: create the checkpoint tables by pasting `schema.sql` into the Supabase
dashboard SQL editor (no DB password needed).

## Configuration

Reads the repo-root `.env`:
- `SUPABASE_URL`, `SUPABASE_KEY` — checkpointer (REST).
- `LANGCHAIN_TRACING_V2`, `LANGCHAIN_API_KEY`, `LANGCHAIN_ENDPOINT` — LangSmith.
- `ANTHROPIC_API_KEY` — live LLM calls (default models are `claude-*`).
  Alternatively set `config.GENERATE/REVISE/RUBRIC_MODEL` to `gpt-*` to use
  `OPENAI_API_KEY`; the client routes by model-name prefix.

Models, `MAX_RETRIES`, the rubric threshold, and `SECTION_ORDER` live in
`agentflow_app/config.py`.

## CLI

```bash
agentflow author <anchor.json>     # step-promote one step; if promote, author it
agentflow walk   <steps.json>      # step-promote every step in a BP; author promotions
agentflow resume <principle_id>    # resume from the Supabase checkpoint
agentflow status <principle_id>    # per-section status
agentflow list                     # all principle threads with checkpoints
```

Catalogue writes go to the scratch `data/principles_authored.json` by default;
pass `--write-real` to write the actual `data/principles.json`.

### anchor.json
```json
{
  "bp_code": "GENCOST02-BP03",
  "bp_title": "Evaluate model outputs",
  "step_number": 1,
  "step_title": "Establish ground truth",
  "step_verbatim": "Establish a ground-truth dataset for evaluation.",
  "pillar": "Operational Excellence",
  "focus_area": "evaluation",
  "sibling_sections": { "statement": ["..."] }
}
```
`steps.json` is `{ "steps": [ <anchor>, ... ] }` (or a bare list).

## Tests

```bash
pytest            # mock-LLM unit tests + a live Supabase checkpoint round-trip
```

Tests never call a real LLM (mocked) and never touch the real catalogue. The
checkpoint persistence test does hit Supabase over REST (needs the `.env` creds
and the `schema.sql` tables).
```
