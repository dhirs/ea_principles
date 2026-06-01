---
name: ai-architecture-principles
description: Use this skill whenever the user works on enterprise AI architecture principles — authoring a new principle, editing or reviewing existing ones, mapping production failures to architectural concerns, classifying principles into the four-area taxonomy, or anything involving the `principles.json` catalogue or `PRIN_` identifiers. Trigger this skill even when the user does not name the file explicitly but is clearly thinking about how to standardise AI agent design, ARB review criteria, AIGP alignment, prompt/context governance, or any "what does production-ready look like" question for AI systems.
---

# Enterprise AI Architecture Principles

This skill carries the operating rules for a specific catalogue of enterprise AI architecture principles. The catalogue exists to give delivery teams and architecture review boards a shared, auditable definition of "production-ready" for AI systems, so that quality does not depend on individual architect heroics.

When this skill triggers, the user is working on principles that will be applied across many AI projects in an enterprise. Decisions made here ripple. Stay disciplined about the schema, the taxonomy, and the writing conventions below.

## File locations

Catalogue lives at:

- `\\wsl.localhost\ubuntu-24.04\home\dheeraj\ai_principles\principles.json` — the authoritative principle catalogue
- `\\wsl.localhost\ubuntu-24.04\home\dheeraj\ai_principles\reusable.json` — supporting case studies on centralisation decisions (UC_NNN, not PRIN_NNN)

Always read the current `principles.json` before editing — the catalogue is being actively developed and the in-context version may be stale. Never invent or overwrite a `PRIN_NNN` without checking what's there.

## The four-area taxonomy

Every principle belongs to one primary area and optionally a secondary area. These four areas are the spine of the catalogue. If a new principle does not fit cleanly into one, the principle is probably underspecified — push back on the user rather than inventing a fifth area.

### 1. Business Value and Delivery
Principles that ensure AI initiatives are economically justified and deliverable. Covers cost (tokens, infra, licensing), delivery predictability, vendor/tooling consolidation, reuse across projects, and avoiding duplicated effort. **Test question:** "Is this worth building, and can we ship it repeatedly without bleeding money or time?"

### 2. Reliability and Scale
Principles that make agents trustworthy and diagnosable in production. Covers observability, traceability of decisions, resilience under load, recovery from failure, incident response standards, and performance at scale. **Test question:** "When something goes wrong, can we see what happened, fix it, and keep running?"

### 3. Operability and Change Control
Principles that make systems supportable, transferable, and maintainable beyond the original architect. Covers prompts-as-code, version control, drift management, single source of truth, context layering, deterministic assembly, handover standards, and the non-functional definition of "production-ready." **Test question:** "Can a different team operate, change, and extend this six months from now?"

### 4. Risk, Governance, and Compliance
Principles that make systems auditable and aligned to enterprise policy. Covers legal, privacy, security, identity and authorization for agents, guardrails, audit trails, responsible AI, explainability, and the evidence model ARBs need to approve consistently. **Test question:** "Can we prove this system is safe, compliant, and accountable?"

### The pairing pattern
A mature catalogue often has **paired principles** — one operability, one governance — covering the same capability from different angles. Example: prompts-as-code (operability: can engineers safely change them?) versus prompt change audit retention (governance: can we prove who approved what?). When you author a new principle, ask whether its sibling in another area is also worth writing.

### Mapping rules — primary vs secondary
- **Primary area** answers the test question that most strongly drives the principle's existence.
- **Secondary area** is set when the principle's benefits clearly serve a second test question. Don't reach — only set a secondary when at least two of the listed `key_benefits` map to that other area.
- **Co-primary** (both areas tagged equally) is rare and reserved for principles like PRIN_017 (Deterministic Prompt Assembly) where reliability and governance are both first-order motivations explicit in the principle's stated goals.

## Principle JSON schema

Every principle is an object with this exact structure. Field order matters for diff readability — keep it consistent.

```json
{
  "principle_id": "PRIN_NNN",
  "domain": "<thematic grouping string>",
  "impact_level": "Critical | High | Medium | Low",
  "applicability": ["llm" | "rag" | "agentic" | "ml"],
  "maturity_level": "foundational | scaling | mature",
  "statement": {
    "title": "<short imperative title>",
    "description": "<1–3 sentences stating the rule>"
  },
  "problem": {
    "description": "<the failure mode this principle prevents>",
    "examples": ["<concrete example 1>", "..."]
  },
  "solution": {
    "approach": "<how the principle is implemented>",
    "key_benefits": ["<benefit 1>", "..."]
  },
  "enforcement": {
    "mechanism": "<snake_case mechanism name>",
    "automated": true,
    "details": "<how the enforcement actually works>"
  },
  "aigp": {
    "domain": "<AIGP domain string — see AIGP reference below>",
    "competency": "<AIGP competency string — see AIGP reference below>"
  }
}
```

**Required for every new principle**: all fields above. The two recently added fields (`applicability`, `maturity_level`) are mandatory on new principles even though existing PRIN_001–PRIN_017 do not yet carry them.

**Optional fields**:
- `enforcement.sample_script` — object with `trigger`, `integration_point`, and `script_path` when there's a real enforcement script to point at (see PRIN_005 for an example).
- `area` / `secondary_area` — the four-area taxonomy. Not yet required on principles; will be added in a later schema revision.

## Writing conventions

These conventions are not optional. They are what make the catalogue scan-able, reviewable, and consistent across authors.

### `principle_id`
Format `PRIN_NNN` with zero-padded three-digit number. Allocate the next free ID. **PRIN_012 is currently reserved** (see "Outstanding work" below) — do not assign it without checking the gap first.

### `domain`
A short thematic string (not the four-area taxonomy). Existing values in use:
- "Production Environment Complexity"
- "Governance and Control Gaps"
- "Data Infrastructure Problems"
- "Context Drift and Maintenance"
- "System Integration Challenges"

Prefer reusing an existing `domain` string over inventing a new one. The taxonomy is the `area` field; `domain` is a finer-grained tag for grouping.

### `impact_level`
Use the four-level scale: `Critical | High | Medium | Low`. Reserve `Critical` for principles where violation creates regulatory, security, or business-continuity risk. Most principles are `High`.

### `applicability`
Array of strings identifying which AI system patterns the principle applies to. Required. Allowed values:

- `llm` — any LLM-based system (chatbot, summarisation, generation, classification with prompts)
- `rag` — retrieval-augmented generation systems (LLM + vector store + retrieval pipeline)
- `agentic` — autonomous agents with tool use, planning, multi-step reasoning, or LangGraph-style workflows
- `ml` — traditional ML (supervised/unsupervised learning, classical models, embeddings as features)

A principle can apply to multiple patterns — list all that apply. If a principle is universal, list all four explicitly rather than using a shortcut value. This makes filtering reliable. Examples:
- LangGraph node separation → `["agentic"]`
- Prompt caching → `["llm", "rag", "agentic"]`
- Self-documenting data → `["rag", "agentic", "ml"]`
- Evidence-based agent decisioning → `["agentic"]`

The purpose of this field is to let a delivery team filter the catalogue down to only the principles relevant to what they're actually building. A pure-RAG team should not have to read agentic-only principles.

### `maturity_level`
Single string. Required. Identifies the organisational maturity at which this principle should be adopted. Allowed values:

- `foundational` — adopt on the first AI project. Skipping it creates debt that compounds. Examples: deterministic prompt assembly, evidence-based decisioning for high-risk use cases.
- `scaling` — adopt once running multiple AI projects (roughly 2–5) or once multiple teams are involved. Examples: prompt caching, centralised LLM SDK, single source of truth for context.
- `mature` — adopt once running an AI portfolio (5+ projects, formal ARB, dedicated platform team). Examples: automated context lifecycle management, comprehensive observability standards.

Pick the strictest level that honestly applies. If a principle is foundational for high-risk use cases but only scaling-relevant for low-risk ones, pick `foundational` — it is safer to over-adopt than to under-adopt. The purpose of this field is to let a startup or new team find the principles they should care about *today* without being overwhelmed by mature-portfolio concerns.

### `statement.title`
Short imperative or noun phrase. Examples that read well: "Single Source of Truth for AI Context", "Centralized LLM Access Through Enterprise SDK", "Co-locate Rules with the Artefacts They Govern". Avoid vague titles like "Good Logging" — name the rule, not the topic.

### `statement.description`
One to three sentences stating the rule clearly enough that an engineer could check whether their code complies. Should read like a policy, not a recommendation. "AI context must be organised in a strict hierarchy by scope" — not "AI context should generally be organised by scope when possible."

### `problem.description`
One paragraph explaining the failure mode. Focus on what *breaks* without this principle, especially failure modes that only surface at portfolio scale (multiple projects, multiple teams, over time).

### `problem.examples`
**Always 4–5 concrete examples.** Each should be a specific, observable failure — code-level if possible, not abstract. Pattern that works well:
- Reference a real artefact ("Voice rule 'use British English' copied into 30 prompt files")
- Show the consequence ("updating it requires editing each")

This is the most-read part of the principle. If reviewers can recognise their own systems in the examples, the principle lands.

### `solution.approach`
One paragraph describing the implementation pattern. Should map back to the rule in `statement.description`, but expand on *how* — what gets created, what gets enforced, what the runtime/build-time behaviour looks like.

### `solution.key_benefits`
3–5 bullets. Quantify when honest ("70-90% reduction in token costs"), name the failure mode it eliminates when not ("Drift detection becomes trivial: any non-canonical copy is a violation").

### `enforcement.mechanism`
A short snake_case identifier for the enforcement type. Existing values include: `pre_commit_ai_analysis`, `scope_layering_lint`, `canonical_source_validation`, `langgraph_architecture_review`, `data_catalog_compliance_gates`. Reuse where appropriate.

### `enforcement.automated`
`true` if enforcement runs without human action (linters, CI gates, runtime checks). `false` for human-driven mechanisms (code review checkpoints, ARB review). Both are valid; the field is informational.

### `enforcement.details`
The specific checks the enforcement performs, numbered (1), (2), (3). Should be concrete enough that someone could implement the enforcement from the description. This is what ARB and tooling teams read.

### `aigp.domain` / `aigp.competency`
Use only the existing AIGP domains and competencies listed in the AIGP reference below. Do not invent new ones — AIGP is an external framework and the mapping must match it.

## AIGP reference

The catalogue maps to AIGP (AI Governance Professional) competencies. Use these exact strings.

### Domain I: Understanding the Foundations of AI Governance
- `I.A: Define Core Principles and Accountability`
- `I.B: Establish an AI Governance Framework`

### Domain II: Understanding How Laws, Standards, and Frameworks Apply to AI
- `II.C: Align with Standards and Risk Frameworks`

### Domain III: Understanding How to Govern AI Development
- `III.A: Govern Data for AI Systems`
- `III.B: Govern the AI Model Lifecycle (Design & Build)`

### Domain IV: Understanding How to Govern AI Deployment and Use
- `IV.A: Govern AI Deployment Options and Infrastructure`
- `IV.B: Implement Ongoing Risk Assessments and Monitoring`
- `IV.C: Establish Security, Access Control, and Incident Management`

If a new principle seems to need a competency not listed here, surface that to the user — it may indicate the principle is straddling AIGP boundaries or AIGP has been updated.

## Authoring workflow

When the user asks to add a new principle, follow this order:

1. **Read `principles.json` first.** Identify the next free `PRIN_NNN`, check that the proposed principle does not duplicate an existing one, and look for related principles to cross-reference.
2. **Confirm the four-area mapping** with the user before drafting. Primary area, and secondary if applicable. If the principle doesn't fit, that's signal — discuss before writing.
3. **Draft the principle** following the schema and writing conventions above. Pay particular attention to: 4–5 concrete `examples`, an enforcement `details` block specific enough to implement, and AIGP strings that match the reference exactly.
4. **Cross-reference related principles** in the `key_benefits` or `problem.description` where it strengthens the principle (e.g., "Reduces the maintenance load that PRIN_005 must catch downstream"). Use existing IDs only.
5. **Append to `principles.json`** at the correct position (numeric order by `PRIN_NNN`). Do not reorder existing principles.
6. **Verify the JSON parses** — run `python3 -c "import json; json.load(open('principles.json'))"` or equivalent before declaring done.

When the user asks to **review** an existing principle, check it against the schema, writing conventions, the four-area test, and AIGP reference. Surface any field that fails a check.

When the user asks to **map a failure** (production incident, ARB finding, course case study) to the catalogue, identify which area the failure belongs to first, then which existing principle (or gap) it relates to.

## Outstanding work

These are known gaps in the catalogue. Surface them to the user when relevant.

- **PRIN_012 is reserved but unfilled.** PRIN_016 references it ("Aligns with PRIN_012 by making the schema the locus of output governance"). The implied principle is something like "Schema as the Authoritative Output Contract" — the JSON schema (not prose) is the canonical specification for output structure, and schema and validator must agree. Either author PRIN_012 or renumber PRIN_013–PRIN_017 down by one and fix the reference inside PRIN_016. Do not assign PRIN_012 to an unrelated principle without resolving this first.
- **`applicability` and `maturity_level` are not yet on PRIN_001–PRIN_017.** New principles must include them; the existing 16 will need a retrofit pass when the user is ready.
- **`area` / `secondary_area` fields are not yet on any principle.** When the user is ready, retrofit using the four-area mapping rules. Not required on new principles until the user formalises this field.
- **Catalogue is operability-heavy.** PRIN_013–PRIN_017 are all primarily Operability and Change Control. The other three areas are underweight, especially Business Value and Delivery (only PRIN_002, PRIN_003 fit cleanly) and Reliability and Scale (PRIN_006, PRIN_007, PRIN_011 partially fit). When the user proposes new principles, prefer those that round out the underweight areas unless they have a specific operability gap to fill.

## Worked examples

Three principles drawn from the catalogue, one from each major "type." Use these as templates when drafting.

### Type A: Tactical implementation principle (PRIN_001)

```json
{
  "principle_id": "PRIN_001",
  "domain": "Production Environment Complexity",
  "impact_level": "High",
  "applicability": ["agentic"],
  "maturity_level": "foundational",
  "statement": {
    "title": "LangGraph Node vs Utility Function Separation",
    "description": "In LangGraph architectures, restrict nodes to LLM reasoning and decision-making only. Implement all deterministic operations (file I/O, parsing, API calls) as utility functions outside the graph."
  },
  "problem": {
    "description": "In LangGraph workflows, wrapping deterministic operations as graph nodes or LLM tools creates state bloat, adds unnecessary complexity, and introduces failure points",
    "examples": [
      "S3 loading as a node: data = s3.get_object() in node → bloats state with large_data passed between all nodes",
      "PDF extraction as LLM tool: Tool(name='extract_pdf') → LLM might skip critical extraction",
      "Conditional writes as nodes: if confidence > 0.8: write_to_s3() → simple logic becomes full graph node",
      "File I/O in nodes: with open(file) as f: data = f.read() → deterministic ops mixed with reasoning logic"
    ]
  }
}
```
Area mapping: **Operability and Change Control** (primary — about clean separation that makes debugging and handover easier), **Business Value and Delivery** (secondary — 70-90% token cost reduction is a stated benefit).

### Type B: Governance principle (PRIN_009)

```json
{
  "principle_id": "PRIN_009",
  "applicability": ["agentic"],
  "maturity_level": "foundational",
  "statement": {
    "title": "Evidence-Based Agent Decisioning",
    "description": "All autonomous agent decisions must be traceable to specific evidence collected through defined investigation actions, preventing black-box reasoning and ensuring explainable AI."
  },
  "enforcement": {
    "mechanism": "ai_powered_pre_commit_validation",
    "automated": true,
    "details": "AI-powered pre-commit hook performs multi-level validation: (1) Verifies prompts are externalized in dedicated files following ReAct pattern, (2) Analyzes prompt content for evidence collection instructions with minimum 3 investigation actions, (3) Validates code implements mentioned tools and enforces evidence requirements, (4) Cross-checks prompt-code alignment ensuring decision nodes cannot execute without evidence_collected state, (5) Detects and blocks any direct LLM calls that bypass evidence gathering."
  }
}
```
Area mapping: **Risk, Governance, and Compliance** (primary — explainability, audit trails, regulatory compliance are the stated benefits), **Reliability and Scale** (secondary — reduced hallucination through forced evidence grounding is a runtime quality benefit).

### Type C: Context engineering principle (PRIN_014)

```json
{
  "principle_id": "PRIN_014",
  "applicability": ["llm", "rag", "agentic"],
  "maturity_level": "scaling",
  "statement": {
    "title": "Single Source of Truth for AI Context",
    "description": "Every fact, definition, rule, or instruction consumed by an AI system must live in exactly one canonical file. Where the same content appears in multiple files, one is the source and the others are bugs."
  },
  "problem": {
    "description": "Duplicated content across prompt files, agent configurations, and tool definitions silently diverges over time. Each duplication multiplies the surface area for drift, and there is no signal when one copy is updated and others are not. PRIN_005 addresses drift between AI agents and authoritative business definitions; this principle addresses drift within the AI system's own internal content."
  }
}
```
Area mapping: **Operability and Change Control** (primary — one edit per change is a maintainability rule), **Reliability and Scale** (secondary — silent drift between copies is a runtime failure mode). Note the cross-reference to PRIN_005 in `problem.description` — that pattern is encouraged when it helps the reader understand the boundary between two related principles.

## What "done" looks like for any principle work

Before declaring a piece of work complete, check:

- JSON parses cleanly
- New `PRIN_NNN` is correct (next free ID, not reused, PRIN_012 still reserved unless explicitly resolved)
- `applicability` array is set with at least one valid value (`llm`, `rag`, `agentic`, `ml`)
- `maturity_level` is set to one of `foundational`, `scaling`, `mature`
- `problem.examples` has 4–5 concrete entries
- `enforcement.details` is implementable, not aspirational
- AIGP strings exactly match the reference
- Cross-references to other principles use real IDs
- The principle would survive being read by an ARB member who has never spoken to the author
