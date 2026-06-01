# agentflow pipeline — build prompt for Claude Code

Detailed implementation brief for the LangGraph-based principle-authoring pipeline. Read this end-to-end before writing any code. The pipeline architecture, prompt files, schema, and conventions already exist — this brief describes the Python code needed to wire them together.

---

## 1. What this pipeline does

`agentflow` authors AI Architecture Principles for the catalogue at `ai_principles/principles.json`. Each principle is a multi-section JSON object that concretises an AWS Well-Architected Generative AI Lens implementation step. The pipeline takes an AWS BP / step as input, runs it through a series of LLM-authored sections (with rubric-scored quality gates and bounded revision loops), and writes a ratified principle entry back to `principles.json` plus updates to `lens_mapping.md`.

**Two phases:**

1. **Phase 1 — Step promotion (BP-walking).** For each AWS implementation step in a BP, decide whether the step earns a standalone principle. Binary outcome: `promote` or `not_promote`. Uses the `step_promotion` rubric at `agentflow/sections/step_promotion/{generate,rubric,revise}.json`.

2. **Phase 2 — Per-principle authoring.** For each promoted step, author the full principle field-by-field through 11 LLM-authored sections plus a scored `tier` subgraph plus deterministic fill nodes for the remaining metadata.

---

## 2. Source-of-truth files (read these first)

Read these files in this order before writing any code:

1. **`agentflow/pipeline.md`** — the architecture spec. Per-section subgraph shape, edge logic, state schema, full per-principle pipeline ordering, open questions. **This is your blueprint.**
2. **`agentflow/taxonomy.json`** — the per-principle schema. Defines every field a principle must declare, plus the spec blocks for `framework_mappings`, `ownership`, `gates`, `evidence`, `change_history`. **This is what your output must conform to.**
3. **`agentflow/principle_schema.json`** — a leaner extracted view of just the per-principle schema (derived from taxonomy.json).
4. **`agentflow/system_prompts/{generate,rubric,revise}.json`** — shared base prompts (system_base + composes_with). Loaded by every section node.
5. **`agentflow/sections/<section>/{generate,rubric,revise}.json`** — per-section addenda. 12 sections × 3 files = 36 files (the 11 LLM-authored sections + `tier` + `step_promotion`). Each carries: `composes_with` reference, `system_addendum` prose, `user_template` with Mustache placeholders, `output_contract` schema, and (for rubrics) `dimensions` + `calibration_examples` + `threshold_rule`.
6. **`ai_principles/principles.json`** — the catalogue you're writing into. Read 1-2 existing principle entries (GO1B1-01, GC1B1-01, GC2B2-01) to understand the output shape concretely.
7. **`ai_principles/lens_mapping.md`** — the per-BP ledger you'll update on each principle ratification.
8. **`ai_principles/decisions.md`** — recent entries (2026-05-27 through 2026-06-01) give context on conventions and recent schema changes (serving_paradigm v1.9, tier rubric, evidence trigger).

---

## 3. Tech stack

- **Python 3.11+** with type hints throughout.
- **LangGraph** (recommended) for the graph orchestration. `pip install langgraph`. Its built-in `SqliteSaver` checkpointer handles durability cleanly. Alternative: vanilla Python orchestrator if LangGraph dependency is unwanted.
- **Anthropic SDK** — `pip install anthropic`. Models used: Sonnet 4.5/4.6 for `generate` and `revise` (creative authoring); Haiku 4.5 for `rubric` (structured scoring). Model choice configurable per node.
- **Pydantic v2** for state models and output-contract validation.
- **JSON Schema** for output_contract validation against each section's `output_contract.schema` field.
- **Click** or **Typer** for CLI.
- **Pytest** for tests.

Do NOT use Langflow — the prior conversation considered it and concluded LangGraph is cleaner for the actual catalogue authoring. Langflow stays as a future visual-demo path; the implementation here is plain code.

---

## 4. Folder layout to create

```
agentflow/app/
  README.md                    # overview, install, quickstart
  pyproject.toml               # dependencies, project metadata
  agentflow_app/
    __init__.py
    cli.py                     # Typer/Click CLI: author / resume / restart / status
    config.py                  # paths, model choices, retry counts, env vars
    state.py                   # Pydantic models — PipelineState, SectionState, SectionStatus enum
    composer.py                # ComposeSystemPrompt + FillUserTemplate logic
    validator.py               # ParseJSON + output_contract validation
    rubric.py                  # EvaluateRubric — threshold computation, fail-dim extraction
    section_subgraph.py        # The generic three-node subgraph (generate → rubric → revise)
    pipeline.py                # The per-principle pipeline (chains all 11 + tier + deterministic nodes)
    step_promotion.py          # The BP-walking phase (Phase 1)
    deterministic_nodes.py     # ownership_fill, evidence_node, change_history_node, principle_id, pillar
    persistence.py             # checkpoint save/load + atomic write to principles.json + lens_mapping.md update
    llm_client.py              # Anthropic client wrapper with retries + model selection
    prompt_loader.py           # Loads + caches the prompt JSON files from agentflow/sections/ + agentflow/system_prompts/
  checkpoints/                 # JSON state files per principle in flight (gitignored)
    .gitkeep
  tests/
    test_composer.py
    test_validator.py
    test_rubric.py
    test_section_subgraph.py
    test_pipeline_integration.py  # end-to-end with a mocked LLM
    fixtures/
      mock_responses/          # canned LLM responses for deterministic tests
```

---

## 5. Modules — what each one does

### 5.1 `state.py` — Pydantic models

```python
class SectionStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    RATIFIED = "ratified"
    FAILED_RETRYING = "failed_retrying"
    HARD_FAILED_AWAITING_HUMAN = "hard_failed_awaiting_human"
    SKIPPED = "skipped"            # for not_promote in step_promotion

class SectionState(BaseModel):
    status: SectionStatus
    draft: dict | None = None
    last_draft: dict | None = None
    last_rubric_scores: dict | None = None
    retry_count: int = 0
    ratified_at: datetime | None = None
    failed_at: datetime | None = None

class PipelineState(BaseModel):
    principle_id: str               # e.g. "GC2B3-01"
    aws_anchor: dict                # { bp_code, bp_title, step_number, step_title, step_verbatim, pillar, focus_area, question }
    pillar: str                     # derived from BP
    focus_area: str                 # derived from BP
    sibling_sections: dict          # { "statement": [<existing principles' statements>], ... } — loaded from principles.json
    section_states: dict[str, SectionState]
    status: PipelineStatus          # in_progress, completed, awaiting_human, abandoned
    started_at: datetime
    completed_at: datetime | None = None
```

Pipeline order (the keys of `section_states` in order):

```python
SECTION_ORDER = [
    "statement",
    "problem",
    "solution",
    "gates",
    "applicability",
    "serving_paradigm",        # schema v1.9
    "impact_level",
    "maturity_level",
    "focus_area",
    "framework_mappings",
    "tier",                    # scored — uses agentflow/sections/tier/rubric.json
    # deterministic nodes follow, not in this list — run by the orchestrator
    "explain_prompt",          # last LLM-authored section; compiled from upstream
]
```

### 5.2 `prompt_loader.py`

```python
@cache
def load_section_prompt(section: str, op: str) -> dict:
    """Loads agentflow/sections/<section>/<op>.json. Cached."""

@cache
def load_system_prompt(op: str) -> dict:
    """Loads agentflow/system_prompts/<op>.json. Cached."""
```

Cache the JSON loads — they don't change during a run.

### 5.3 `composer.py`

```python
def compose_system_prompt(section: str, op: str) -> str:
    shared = load_system_prompt(op)["system_base"]
    addendum = load_section_prompt(section, op)["system_addendum"]
    return shared + "\n\n" + addendum

def fill_user_template(section: str, op: str, state: PipelineState, extra: dict = None) -> str:
    template = load_section_prompt(section, op)["user_template"]
    placeholders = build_placeholders(state, extra or {})
    return chevron.render(template, placeholders)  # or simple regex sub
```

`build_placeholders` flattens state into a dict matching the `{{ placeholder }}` names used in the section's user_template. The placeholder names vary by section — read each section's `generate.json` to know what's needed. Common ones: `principle_id`, `pillar`, `focus_area`, `aws_bp`, `aws_step_number`, `aws_step_title`, `aws_step_verbatim`, `sibling_statements`, `candidate_title`, `candidate_description`, etc.

### 5.4 `validator.py`

```python
def parse_and_validate(raw_response: str, output_contract: dict) -> dict:
    """Parse the LLM response as JSON. Validate against the section's output_contract.schema.
    Raises ParseError or ValidationError on failure (routes to revise as synthetic well_formed dim fail)."""
```

Use the `output_contract.schema` field from each section's `generate.json`. For sections with a `structure` field on the principle_schema level, validate the parsed object matches that structure.

### 5.5 `rubric.py`

```python
def evaluate_rubric(scores: dict, threshold_rule: dict) -> RubricVerdict:
    """Returns { verdict: 'ratify' | 'fail', fail_dimensions: [...], scores: {...} }.
    V1 threshold_rule is { type: 'all_dimensions_minimum', value: 2 }."""
```

The threshold computation lives here, not in the rubric prompt — the rubric returns per-dimension scores; this function applies the pass/fail rule.

### 5.6 `llm_client.py`

```python
class LLMClient:
    def __init__(self, api_key: str):
        self.client = anthropic.Anthropic(api_key=api_key)
    
    def complete(self, model: str, system: str, user: str, max_tokens: int = 4096) -> str:
        """Calls Anthropic. Retries on transient errors (rate limit, 5xx) with exponential backoff."""
```

Model selection per node — see config.py. Default mixed-tier: `claude-sonnet-4-5` for generate/revise, `claude-haiku-4-5` for rubric.

### 5.7 `section_subgraph.py` — the heart of the pipeline

This is the LangGraph subgraph that runs one section through generate → rubric → revise.

```python
def build_section_subgraph(section: str) -> CompiledStateGraph:
    """Builds and returns the three-node subgraph for `section`.
    Returns a LangGraph CompiledStateGraph that takes a SectionContext and produces a ratified draft or hard-fail."""
```

Internal nodes:

- `generate_node(state)` — composes prompts, calls LLM (Sonnet), parses output, writes to `state.draft`.
- `rubric_node(state)` — composes rubric prompts, calls LLM (Haiku), parses scores, writes to `state.rubric_scores`. Returns the threshold verdict.
- `revise_node(state)` — composes revise prompts (with failing draft + scores baked into user_template), calls LLM (Sonnet), parses output, updates `state.draft`, increments `state.retry_count`.

Edge logic:

- `generate → rubric` unconditional.
- `rubric → (next | revise)` conditional on threshold rule.
- `revise → rubric` unconditional but with retry guard: if `retry_count >= MAX_RETRIES`, route to `HARD_FAIL` terminal.

`MAX_RETRIES` defaults to 3, configurable per section in `config.py`.

### 5.8 `pipeline.py` — the per-principle orchestrator

```python
def run_pipeline(principle_id: str, aws_anchor: dict) -> PipelineState:
    """Authors a full principle from scratch. If a checkpoint exists, resumes from it."""
    state = load_checkpoint(principle_id) or init_state(principle_id, aws_anchor)
    
    for section in SECTION_ORDER:
        s = state.section_states[section]
        if s.status == SectionStatus.RATIFIED:
            continue  # idempotent skip
        if s.status == SectionStatus.HARD_FAILED_AWAITING_HUMAN:
            log(f"{section} awaiting human review. Resume after editing checkpoint.")
            return state
        
        subgraph = build_section_subgraph(section)
        result = subgraph.invoke({"state": state, "section": section})
        
        if result.ratified:
            s.status = SectionStatus.RATIFIED
            s.draft = result.draft
            s.ratified_at = now()
        else:
            s.status = SectionStatus.HARD_FAILED_AWAITING_HUMAN
            s.last_draft = result.last_draft
            s.last_rubric_scores = result.scores
            s.retry_count = result.retries
            checkpoint(state)
            log(f"{section} hard-failed after {result.retries} retries.")
            return state
        
        checkpoint(state)  # persist after each ratified section
    
    # All LLM-authored sections done. Run deterministic nodes.
    state = run_deterministic_nodes(state)
    
    # Write the principle to principles.json + update lens_mapping.md
    write_to_catalogue(state)
    archive_checkpoint(principle_id)
    
    state.status = PipelineStatus.COMPLETED
    state.completed_at = now()
    return state
```

### 5.9 `step_promotion.py` — Phase 1

```python
def walk_bp(bp_code: str, bp_implementation_guidance: str, steps: list[Step]) -> dict[int, StepDecision]:
    """For each AWS implementation step in the BP, run the step_promotion subgraph.
    Returns a dict mapping step number to { decision: 'promote' | 'not_promote', rationale, ... }.
    """
```

Uses the same `build_section_subgraph` machinery — the step_promotion section's prompt files have the same shape as any other section's. Output decisions become `lens_mapping.md` ledger entries; `promote` decisions feed the per-principle pipeline.

### 5.10 `deterministic_nodes.py`

```python
def assign_principle_id(state) -> str:
    """Computes the next sequential principle_id for the BP code."""

def assign_pillar_and_focus_area(state):
    """Derives from aws_anchor."""

def ownership_fill_node(state):
    """Fills validator, audit_mode, arb_role from the tier outcome.
    - tier == 'project' → validator=project_architect, audit_mode=self_attestation_with_mechanical_evidence
    - tier == 'enterprise' + D1=no → validator=project_architect, audit_mode=self_attestation_with_mechanical_evidence (platform-team-owned tooling)
    - tier == 'enterprise' + D1=yes → validator=<specialist named by tier rubric>, audit_mode=central_review_at_gate
    - arb_role=dashboard_and_spot_check by default
    """

def evidence_node(state):
    """If audit_mode == 'central_review_at_gate': require non-empty artefacts.
    Otherwise: { artefacts: [], review_mode: 'automated_only', sign_off: 'binary' }."""

def change_history_node(state):
    """Initial entry: version 1.0.0, today's date, author, summary."""
```

### 5.11 `persistence.py`

```python
def save_checkpoint(state: PipelineState):
    """Writes state to checkpoints/<principle_id>.json atomically (write to .tmp, fsync, rename)."""

def load_checkpoint(principle_id: str) -> PipelineState | None:
    """Reads checkpoint. Returns None if not found."""

def archive_checkpoint(principle_id: str):
    """Moves the checkpoint to checkpoints/archive/ after successful completion."""

def write_to_catalogue(state: PipelineState):
    """Appends the principle to ai_principles/principles.json. Updates ai_principles/lens_mapping.md row.
    Uses atomic writes (write to .tmp, fsync, rename). Validates the result against the schema before writing."""
```

### 5.12 `cli.py` — Click/Typer CLI

```
agentflow author <bp_code> --step <step_number>
    # Runs step_promotion for the step. If promote: assigns principle_id, runs full pipeline.

agentflow walk <bp_code>
    # Runs step_promotion across all steps in the BP. Authors each promoted step.

agentflow resume <principle_id>
    # Loads checkpoint, picks up from first non-ratified section.

agentflow restart <principle_id> --from <section>
    # Discards locked sections from <section> onward, resets them to PENDING, re-runs.

agentflow status <principle_id>
    # Shows the state of each section.

agentflow list
    # Lists all in-progress checkpoints + their statuses.
```

---

## 6. Behavioural requirements

1. **Idempotent re-runs.** Re-running with a checkpoint where all sections are RATIFIED is a no-op (just writes to catalogue if not already there).
2. **Persist after every step.** Never lose work on a transient crash. Every successful section write commits the checkpoint.
3. **Bounded retries.** Default 3 revise attempts per section. After that, transition to `HARD_FAILED_AWAITING_HUMAN`.
4. **Atomic writes to catalogue.** Never leave `principles.json` in a partial state. Write to `.tmp`, validate the result parses as JSON and the new principle entry validates against the schema, then `rename`.
5. **Human-in-the-loop is explicit.** Sections in `HARD_FAILED_AWAITING_HUMAN` block the pipeline. User edits the checkpoint manually (changes status to RATIFIED, provides a draft) then `agentflow resume`.
6. **Schema validation at boundary.** Every section's LLM output is validated against its `output_contract.schema` BEFORE being written to state. Parse failures route to revise as a synthetic `well_formed` dimension fail.
7. **Configurable model per node.** Generate/revise: Sonnet by default. Rubric: Haiku by default. Override via config.

---

## 7. Tests

Aim for ~80% line coverage. Critical paths:

- **`test_composer.py`** — system prompt composition (shared base + section addendum); template filling with various state shapes.
- **`test_validator.py`** — JSON parsing happy path + parse failures + schema validation failures.
- **`test_rubric.py`** — threshold computation: all-pass, one-fail, multiple-fails.
- **`test_section_subgraph.py`** — full subgraph with a mocked LLM client; verify generate → rubric → revise → rubric loop with retry counter; verify hard-fail terminal after N retries.
- **`test_pipeline_integration.py`** — end-to-end with mocked LLM returning canned responses; verify a complete principle is written to a test principles.json; verify resume from checkpoint works; verify restart-from-section works.

Mock LLM responses live in `tests/fixtures/mock_responses/` as JSON files. Tests don't make real API calls (cost + reproducibility).

---

## 8. Done criteria

The pipeline is "done" when:

1. `agentflow walk GENCOST02-BP03` produces a complete principle entry appended to `principles.json` end-to-end, with each section ratified through the rubric, with no manual intervention required for well-formed AWS step input.
2. A simulated transient failure (e.g., LLM timeout on the rubric call) is recoverable via `agentflow resume`.
3. A simulated hard-fail (revise loop exhausts retries) transitions the section to `HARD_FAILED_AWAITING_HUMAN`, persists the checkpoint, and exits cleanly. User edits the checkpoint, sets status to RATIFIED with their draft, runs `agentflow resume`, pipeline completes.
4. `principles.json` after every successful run validates against the schema in `taxonomy.json`.
5. `lens_mapping.md` is updated to flip the step row from `pending` to `promoted_to_principle: <id>` (or `not_promoted: <reason>`).
6. All tests pass.
7. README documents the install, quickstart, and CLI commands.

---

## 9. Open questions to resolve while building

Captured in `pipeline.md` "Open questions / TBD" — your call as you build:

- **Loop bound.** Default `MAX_RETRIES = 3`. Per-section override worth considering once retry-rate data exists.
- **Sibling section loading.** When the user_template asks for `sibling_statements`, where do they come from? Load on demand from principles.json keyed by pillar/focus_area? Pre-compute an index at pipeline start? Pre-compute is simpler and faster — recommend that.
- **Cross-section validation.** A whole-principle validation pass after all sections are locked (e.g., gates reference paths that solution also references) before writing to principles.json. Recommend: a simple consistency check function that scans for known cross-references.
- **Re-authoring entry point.** `agentflow restart` is for in-flight principles. Re-authoring a SHIPPED principle (e.g., PRIN_003 v1 → v2 rewrite) is different — needs a separate entry point that loads the existing principle from principles.json, marks sections for re-author, runs only those. Defer to v2.

---

## 10. Pointers to the existing catalogue files

Absolute paths on the dev machine (Windows / WSL):

- Schema: `\\wsl.localhost\ubuntu-24.04\home\dheeraj\ai_principles_server\agentflow\taxonomy.json`
- Per-principle schema view: `\\wsl.localhost\ubuntu-24.04\home\dheeraj\ai_principles_server\agentflow\principle_schema.json`
- Pipeline spec: `\\wsl.localhost\ubuntu-24.04\home\dheeraj\ai_principles_server\agentflow\pipeline.md`
- Prompt files: `\\wsl.localhost\ubuntu-24.04\home\dheeraj\ai_principles_server\agentflow\sections\` + `\agentflow\system_prompts\`
- Catalogue: `\\wsl.localhost\ubuntu-24.04\home\dheeraj\ai_principles\principles.json`
- Per-BP ledger: `\\wsl.localhost\ubuntu-24.04\home\dheeraj\ai_principles\lens_mapping.md`
- Decision journal: `\\wsl.localhost\ubuntu-24.04\home\dheeraj\ai_principles\decisions.md`
- Conventions: `\\wsl.localhost\ubuntu-24.04\home\dheeraj\ai_principles\CLAUDE.md`

---

## 11. What to do FIRST when you start building

1. Read `pipeline.md` end-to-end.
2. Read `taxonomy.json` `principle_schema.fields[]` to internalise the 16-field structure.
3. Open one section's three prompt files (e.g., `sections/statement/generate.json`, `rubric.json`, `revise.json`) and read them — understand the prompt composition pattern.
4. Open `principles.json` and read GO1B1-01 end-to-end — understand what a ratified principle looks like.
5. Open `principles.json` GC2B2-01 — note the new `serving_paradigm` field (v1.9 schema).
6. Open `decisions.md` 2026-05-31 entry — understand the tier rubric and the redefined ownership.tier semantics.

Only then start writing code. Build vertical first (one section end-to-end with a mocked LLM) before going wide (all 11 sections).

---

## 12. Initial git commit plan

Suggested commit sequence (each one merges cleanly to main):

1. Project scaffold: pyproject.toml, README, folder layout, empty modules with docstrings.
2. State models (`state.py`) + tests.
3. Prompt loader + composer (`prompt_loader.py`, `composer.py`) + tests.
4. Validator + rubric evaluator (`validator.py`, `rubric.py`) + tests.
5. LLM client wrapper (`llm_client.py`) + tests.
6. Section subgraph (`section_subgraph.py`) for ONE section (statement) end-to-end with mocked LLM + tests.
7. Section subgraph generalised for all sections + integration tests against statement, problem, gates.
8. Deterministic nodes (`deterministic_nodes.py`) + tests.
9. Persistence (`persistence.py`) + tests (read/write checkpoints; atomic principles.json append; lens_mapping.md update).
10. Pipeline orchestrator (`pipeline.py`) + integration test for full-principle run.
11. Step promotion (`step_promotion.py`) + tests.
12. CLI (`cli.py`).
13. End-to-end test: `agentflow walk` on a known BP, verify the catalogue is updated correctly.

---

End of brief. Build the pipeline.
