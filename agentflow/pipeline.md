# agentflow LangGraph pipeline — design notes

Running design document for the LangGraph pipeline that authors principles for the catalogue. Captured at the point of discussion; expanded and revised as authoring sections expose questions. The prompt files under `sections/` and `system_prompts/` are the *content* the pipeline loads; this file is the *runtime architecture* that loads them.

Status: early sketch. Statement and problem sections have prompt files written; no LangGraph code exists yet.

---

## Per-section subgraph

Every LLM-authored section in a principle (statement, problem, solution, gates, explain_prompt, focus_area, impact_level, applicability, maturity_level, framework_mappings — ten total) is authored by an identical three-node subgraph: **generate → rubric → revise** with a bounded loop.

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

Ten section subgraphs chained sequentially. Statement first (everything else depends on it), then problem, solution, gates, evidence (deterministic — no LLM), change_history (deterministic), and the filtering/metadata fields (focus_area, impact_level, applicability, maturity_level), then explain_prompt last (compiled from upstream).

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
applicability_subgraph     ← filtering fields
impact_level_subgraph
maturity_level_subgraph
focus_area_subgraph
  ↓
framework_mappings_subgraph
  ↓
ownership_subgraph         ← deterministic tier rule
evidence_subgraph          ← deterministic shape from tier
change_history_subgraph    ← deterministic, single entry on first author
  ↓
explain_prompt_subgraph    ← compiled last, references upstream
  ↓
END (write principle to principles.json)
```

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
- **Deterministic sections in the graph.** `ownership`, `evidence`, `change_history`, `principle_id`, `pillar` don't get the three-node subgraph (no judgment to evaluate). They're single nodes that compute their output from upstream state. They still live in the pipeline; they just have a different node shape.
- **Re-authoring an existing principle.** The pipeline above is for authoring from scratch. Re-authoring (e.g. the PRIN_003 v1→v2 rewrite, or PATCH bumps from a retitle) needs a different entry point — likely load the existing principle into state.locked_sections, mark the sections that need re-authoring, run only those subgraphs. TBD.
- **Hard-fail handling.** When a section exhausts MAX_RETRIES, what happens? Surface to human for hand-authoring? Abandon the principle? Stash partial state for resume? TBD.
- **Cross-section validation.** Some constraints span multiple sections (e.g. gates references paths that solution should also reference). A whole-principle validation pass after all sections are locked, before writing to principles.json? TBD.

---

## Change log

- **2026-05-27** — File created. Initial sketch captured from conversation following the rubric structure migration. Statement and problem sections have prompt files; no LangGraph code yet.
