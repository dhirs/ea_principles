# agentflow LangGraph pipeline — design notes

Running design document for the LangGraph pipeline that authors principles for the catalogue. Captured at the point of discussion; expanded and revised as authoring sections expose questions. The prompt files under `sections/` and `system_prompts/` are the *content* the pipeline loads; this file is the *runtime architecture* that loads them.

Status: design sketch updated 2026-06-01 to reflect schema v1.9 (added `serving_paradigm`), the 2026-05-31 tier rubric (ownership.tier is now scored, not deterministic), and the 2026-05-31 evidence-trigger change (now driven by `ownership.audit_mode`, not by tier). All eleven LLM-authored section prompt files exist under `sections/`. No LangGraph code yet.

---

## Upstream context — step_promotion (not part of this per-principle pipeline)

Before any per-principle authoring pipeline fires, an upstream **step_promotion** node decides whether a given AWS implementation step earns a principle at all. Files: `agentflow/sections/step_promotion/{generate,rubric,revise}.json`. Same three-node loop shape as a per-principle section (generate → rubric → revise, bounded retries). Binary outcome — promote or not_promote, no merge category. Authored 2026-05-29 after the GENCOST01-BP01 walkthrough surfaced that promote / not_promote calls had no structured judge.

The BP-walking phase iterates each AWS step through step_promotion; only `promote` outcomes trigger a per-principle pipeline. `not_promote` outcomes are recorded in `lens_mapping.md` with their rationale (decision_process_advice / absorbed_by_sibling / cross_pillar_scope / vendor_menu). This file's scope is per-principle authoring only — step_promotion is upstream.

---

## Per-section subgraph

Every LLM-authored section in a principle (statement, problem, solution, gates, explain_prompt, focus_area, impact_level, applicability, serving_paradigm, maturity_level, framework_mappings — **eleven total** as of schema v1.9, 2026-05-29 when `serving_paradigm` was added) is authored by an identical three-node subgraph: **generate → rubric → revise** with a bounded loop. The `ownership.tier` field, although nested under `ownership`, also uses this subgraph (rubric at `agentflow/sections/tier/rubric.json`) — see the deterministic-sections note below for the composition.

```
[from previous section's exit, with prior sections locked in state]
                            │
                            ▼
                  ┌──────────────────┐
                  │  generate_node   │ ← loads system_prompts/generate.json
                  │  (section=X)     │   + sections/X/generate.json,
                  │                  │   composes system, fills user_template,
                  │                  │   calls LLM, parses JSON,
                  │                  │   writes draft to state
                  └────────┬─────────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │   rubric_node    │ ← loads system_prompts/rubric.json
                  │  (section=X)     │   + sections/X/rubric.json,
                  │                  │   scores draft on the section's
                  │                  │   dimensions, writes scores to state
                  └────────┬─────────┘
                           │
              ┌────────────┴────────────┐
              │                         │
        pass (all ≥ 2)            fail (any ≤ 1)
              │                         │
              ▼                         ▼
      [lock section,            ┌──────────────────┐
       hand off to next         │   revise_node    │ ← loads
       section's                │  (section=X)     │   system_prompts/revise.json
       generate_node]           │                  │   + sections/X/revise.json,
                                │                  │   revises using rubric
                                │                  │   feedback, increments
                                │                  │   retry counter
                                └────────┬─────────┘
                                         │
                                         └─→ back to rubric_node
                                             (bounded: hard fail after N retries)
```

The interesting logic is in the edges, not the nodes. Each node is small — load the two prompt files, compose, call LLM, parse, write state.

---

## State schema (sketch)

LangGraph state carried through the per-principle pipeline:

```python
class State(TypedDict):
    # principle metadata
    principle_id: str            # e.g. "GO1B1-05"
    pillar: str
    focus_area: str
    aws_anchor: dict             # { bp, step_number, step_title, step_verbatim }
    sibling_sections: dict       # { "problem": [<sibling problem texts>], ... }

    # current section in flight
    current_section: str         # e.g. "problem"
    draft: dict                  # the in-flight section content
    rubric_scores: dict          # per-dimension { score, justification }
    retry_count: int

    # accumulator of locked sections
    locked_sections: dict        # { "statement": {...}, "problem": {...}, ... }
```

On a `pass`, the edge writes `state.locked_sections[state.current_section] = state.draft`, resets `state.draft / rubric_scores / retry_count`, sets `state.current_section` to the next section name, and routes to that section's `generate_node`.

---

## Edge logic — the three transitions

1. **`generate_node → rubric_node`** — unconditional. The generated draft always gets scored.
2. **`rubric_node → (next section | revise_node)`** — conditional on the threshold rule (V1: all dimensions ≥ 2). The threshold computation lives in the edge function, not in the rubric prompt (the rubric returns per-dim scores; the edge sums the pass/fail decision).
3. **`revise_node → rubric_node`** — unconditional, but with retry-count guard. If `retry_count >= MAX_RETRIES`, the edge routes to a hard-fail terminal instead of looping back. `MAX_RETRIES` is a runtime config (proposed default: 3).

---

## Prompt composition at runtime

Each node loads two prompt files and composes them:

```python
def compose_system_prompt(section: str, op: str) -> str:
    shared = load_json(f"system_prompts/{op}.json")["system_base"]
    specific = load_json(f"sections/{section}/{op}.json")["system_addendum"]
    return shared + "\n\n" + specific

def fill_user_template(section: str, op: str, state: State) -> str:
    template = load_json(f"sections/{section}/{op}.json")["user_template"]
    return render(template, placeholders_from(state))
```

The output_contract schema from the section file is used to validate the LLM's JSON response before it's written to state. Parse failure → treat as a rubric failure on a synthetic "well_formed" dimension → route to revise.

---

## Full per-principle pipeline

Eleven LLM-authored section subgraphs chained sequentially, plus a scored `tier_subgraph` (nested under ownership), plus deterministic fill nodes for the rest of ownership, evidence, change_history, principle_id, and pillar.

Authoring order TBD — likely:

```
START
  ↓
statement_subgraph
  ↓
problem_subgraph
  ↓
solution_subgraph
  ↓
gates_subgraph
  ↓
applicability_subgraph        ← filtering fields (AI pattern)
serving_paradigm_subgraph     ← filtering fields (hosting axis, orthogonal to applicability) — schema v1.9
impact_level_subgraph
maturity_level_subgraph
focus_area_subgraph
  ↓
framework_mappings_subgraph
  ↓
tier_subgraph                 ← scored — D1 legal_exposure + D2 repeatability_cost (rubric at agentflow/sections/tier/rubric.json)
ownership_fill_node           ← deterministic: validator + audit_mode + arb_role from tier outcome and convention
evidence_node                 ← deterministic shape from ownership.audit_mode (required when audit_mode == 'central_review_at_gate'; empty otherwise)
change_history_node           ← deterministic, single initial entry on first author
  ↓
explain_prompt_subgraph       ← compiled last, references upstream
  ↓
END (write principle to principles.json)
```

The tier rubric runs the same three-node loop as the per-principle sections — generate (draft tier reasoning), rubric (score D1 + D2, compute outcome), revise (on fail). `tier_subgraph` writes `ownership.tier` into state; `ownership_fill_node` fills the rest of the ownership object deterministically (validator typically `project_architect` under self-attestation; escalates to specialist when D1 fires; audit_mode and arb_role follow convention).

---

## Conventions for adding new sections

When a new section's authoring node comes online:

1. Author three files: `sections/<section>/{generate,rubric,revise}.json`. The `composes_with` field of each file must point at the corresponding `system_prompts/<op>.json`.
2. Calibrate the V1 rubric against the existing sibling principles' content in that section. Use them as the calibration corpus, not invented examples.
3. Add the section to the per-principle pipeline ordering above.
4. No section is allowed to ship with only `rubric.json` — the triad is enforced (generate / rubric / revise) to ensure every section gets the same authoring discipline.

---

## Open questions / TBD

- **Loop bound.** Proposed default `MAX_RETRIES = 3`. May need per-section override (some sections may need more retries; some less). Empirical question — set when nodes are wired and we can measure retry rates.
- **Sibling section inputs.** Currently each section's user_template includes "sibling principles' versions of this same section" for parallel-form context. How are siblings loaded — from principles.json directly? From a pre-computed index? Streaming as principles get added? Open.
- **Deterministic vs scored fields.** `principle_id`, `pillar`, `change_history`, and the non-tier sub-fields of `ownership` (validator, audit_mode, arb_role) are deterministic — single nodes that compute their output from upstream state and convention. `evidence` is deterministic from `ownership.audit_mode` (required when `central_review_at_gate`, empty otherwise — per the 2026-05-31 trigger change). `ownership.tier`, although nested inside `ownership`, is SCORED via the tier rubric at `agentflow/sections/tier/rubric.json` (D1 legal_exposure binary veto + D2 repeatability_cost 0-3, three outcomes mapped to two-value enum) — it gets the same generate → rubric → revise subgraph as the per-principle sections. The ownership object is therefore composed: `tier_subgraph` (scored) + `ownership_fill_node` (deterministic for the rest).
- **Re-authoring an existing principle.** The pipeline above is for authoring from scratch. Re-authoring (e.g. the PRIN_003 v1→v2 rewrite, or PATCH bumps from a retitle) needs a different entry point — likely load the existing principle into state.locked_sections, mark the sections that need re-authoring, run only those subgraphs. TBD.
- **Hard-fail handling.** When a section exhausts MAX_RETRIES, what happens? Surface to human for hand-authoring? Abandon the principle? Stash partial state for resume? TBD.
- **Cross-section validation.** Some constraints span multiple sections (e.g. gates references paths that solution should also reference). A whole-principle validation pass after all sections are locked, before writing to principles.json? TBD.

---

## Implementation status — as built (`agentflow/app/`, 2026-06-02)

The runtime now exists as Python under `agentflow/app/agentflow_app/`. The as-built
architecture diverges from the sketch above in several ways — this section is
authoritative for the code; the sections above describe the original design intent.

**Provider / model.** OpenAI **gpt-5** for all ops (generate / rubric / revise),
not the mixed Anthropic tiers in the sketch. The client (`llm_client.py`) routes by
model-name prefix (`gpt*` → OpenAI, `claude*` → Anthropic), so either provider works.

**Structured Outputs, not post-hoc validation.** Each section's
`output_contract.schema` (a loose hint-dict) is converted to a strict JSON Schema
(`schema_convert.py`) and passed to OpenAI's **Responses API** via
`text.format = {type: json_schema, strict: true}`. The model is *forced* to return
the exact keys — this replaced an earlier bug where the model invented field names
(`why_promote` instead of `rationale`) and the validator silently rejected good
output. `validator.py` is now a cheap backstop, not the gate.

**Flat graph, no nested sub-graphs.** Each section contributes three nodes directly
to ONE `StateGraph`: `<section>_generate → <section>_rubric → <section>_revise` with
a bounded revise loop (conditional edge `after_rubric`). There is NO separate
compiled sub-graph per section (an earlier design wrapped each section in its own
sub-graph, which double-nested the LangSmith trace). The whole principle is one flat
graph compiled once.

**No finalize / deterministic nodes (currently).** `SECTION_ORDER` is trimmed to
`["statement"]` while iterating; the `finalize` node and the deterministic fill
(`ownership_fill` / `evidence` / `change_history`) described above are NOT wired into
the live graph — sections chain straight to `END` and completion status is derived
afterwards. `deterministic_nodes.py` exists but is unused by `pipeline.py`.

**Hard-fail is non-blocking.** When a section exhausts `MAX_RETRIES` it is marked
`section_status[section] = hard_failed` and the run CONTINUES to the next section
(it does not halt the whole pipeline). Final `status` = `awaiting_human` if any
section hard-failed, else `completed`.

**step_promotion** runs as a plain bounded Python loop (`step_promotion.py`), not via
the graph, reusing the same prompt-composition / validate / rubric primitives.

**Checkpointing — Supabase over REST.** The standard `PostgresSaver` can't be used:
the project's Supabase direct DB host is IPv6-only and unreachable from the dev box.
So `supabase_checkpointer.py` is a custom `BaseCheckpointSaver` that persists
checkpoints through the Supabase **REST API** (tables `lg_checkpoints` / `lg_writes`,
created via `app/schema.sql`). `thread_id = principle_id`.
- **Gotcha:** re-invoking the same `principle_id` *resumes* its saved checkpoint
  (loads the row, overwrites only the channels passed in the fresh input, continues
  from the saved position). To author cleanly you currently bump the `principle_id`
  or clear that thread's rows. A proper fix (per-run thread_id, or clear-on-fresh)
  is pending.

**Entry point + tracing.** `api.author_principle(anchor, *, llm, checkpointer,
write_real)` is the single entry (CLI and any external caller use it), decorated with
LangSmith `@traceable` so a whole run is one trace tree. Tracing goes to the
**`agentflow`** LangSmith project; each LLM call is named `<section>:<op>` via
`langsmith_extra`. Catalogue writes default to scratch `data/principles_authored.json`
(`--write-real` for `data/principles.json`).

---

## Change log

- **2026-05-27** — File created. Initial sketch captured from conversation following the rubric structure migration. Statement and problem sections have prompt files; no LangGraph code yet.
- **2026-06-01** — Updated to reflect schema v1.9 and the 2026-05-31 tier/evidence changes: (a) `serving_paradigm` added as the 11th LLM-authored section and inserted into the pipeline ordering next to `applicability` (orthogonal filter axes); (b) `tier_subgraph` separated out as a scored node — D1 + D2 rubric at `agentflow/sections/tier/rubric.json` replaces the prior deterministic-tier-rule framing; (c) `ownership_fill_node` introduced to deterministically fill `validator / audit_mode / arb_role` from the tier outcome; (d) `evidence_node` trigger changed from "deterministic from tier" to "deterministic from `ownership.audit_mode == 'central_review_at_gate'`"; (e) new upstream-context section names `step_promotion` as the BP-walking node that decides whether a per-principle pipeline fires at all; (f) optional `reference_implementation_url` field flagged as queued (taxonomy.json schema bump pending — decisions.md 2026-05-30 entry).
- **2026-06-02** — Pipeline built as code under `agentflow/app/`. See "Implementation status — as built" above for the deltas from this sketch: OpenAI gpt-5 + Responses API Structured Outputs, a single flat graph (no per-section sub-graphs), non-blocking hard-fails, no finalize/deterministic nodes wired yet, step_promotion as a plain loop, and a custom Supabase-REST checkpointer (direct DB is IPv6-only). LangSmith project `agentflow`, per-call run names `<section>:<op>`.
