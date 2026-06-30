# Framework mappings — registry & methodology

Every standard in `principles.json` carries a `framework_mappings` object. **AWS is the sole primary anchor**; every other framework is a **cross-reference** (informational, no enforcement). This folder holds one document per framework explaining **WHY** we map to it and **HOW** the mapping is derived.

This is the human reasoning layer. The machine-readable field definitions and conventions live in `../taxonomy.json` → `principle_schema.framework_mappings_spec`; the per-AWS-BP promote/not_promote ledger lives in `../lens_mapping.md`. Each doc below links back to its `taxonomy.json` entry.

## Registry

| Framework | Key | Role | Status | Mapped | Doc |
|---|---|---|---|---|---|
| AWS Well-Architected GenAI Lens | `aws` | **primary anchor** | populated | 24 / 24 | [aws.md](./aws.md) |
| AIGP (IAPP) | `aigp` | cross-reference | populated | 23 / 24 | [aigp.md](./aigp.md) |
| EU AI Act (Reg. 2024/1689) | `eu_ai_act` | cross-reference | populated | 7 / 24 | [eu_ai_act.md](./eu_ai_act.md) |
| NIST AI RMF | `nist` | cross-reference | scaffolded (not populated) | 0 / 24 | [nist.md](./nist.md) |
| GDPR (Reg. 2016/679) | `gdpr` | cross-reference | proposed (not populated) | 0 / 24 | [gdpr.md](./gdpr.md) |
| FCA Handbook (SYSC / PRIN, under FSMA 2000) | `fca` | cross-reference | proposed (not populated) | 0 / 24 | [fca.md](./fca.md) |
| _planned: ISO/IEC 23894, OWASP LLM Top 10, …_ | — | cross-reference | not started | — | — |

> Note: ISO/IEC 42001 is deliberately **not** a framework key — it is a governance/management-system wrapper (proof a control is *governed*), not a control a standard concretises. See `eu_ai_act.md` for the three-layer rationale.

## The one rule, for every framework

A standard earns a reference **only when its gate actually discharges the framework's obligation** — never because the two are merely topically related. Obligations that no standard's gate discharges are recorded as **documented gaps / future-standard candidates**, not forced onto an unrelated standard. This keeps the mapping audit-honest.

## How to add a new framework (e.g. FCA)

1. **Decide it earns a key.** It must add coverage distinct from AWS and the existing frameworks, and be a *control source* (something a standard concretises) — not a governance wrapper like ISO 42001. If it fails this, it does not get a key.
2. **Copy `_TEMPLATE.md` → `<key>.md`** and fill in WHY / HOW / STATUS. Define the field shape and the derivation test before touching any data.
3. **Declare the schema** in `../taxonomy.json` → `framework_mappings_spec`: add `framework_specific_reference_fields.<key>` and a `<key>_convention` note. Bump `meta.format_version` in `principles.json` if the schema shape changes.
4. **Teach the authoring pipeline** — add the framework + its fields to `../sections/framework_mappings/generate.json` (`system_addendum`) so hand-authoring and the LangGraph node both know the shape.
5. **Author references** on the standards whose gates genuinely discharge the obligation, per-standard, `mapping_state: unverified` until read against source. Bump each standard's version + `change_history`.
6. **Add a row** to the Registry table above and update counts.
7. **(Optional, separate work) Surface a sidebar filter** in the app. Cross-references are populated in data first and surfaced later — AIGP and EU AI Act are populated but not yet filterable; only AWS and NIST have filter widgets today (NIST's are forward-scaffolding).
8. **Log it** as a `(latest)` entry in `../decisions.md`.

CLAUDE.md points here as the single signpost, so steps 1–2 and 6 are the only edits needed to register a new framework — no CLAUDE.md churn per framework.

## Keeping mappings current (the "refresh" procedure)

External frameworks change — the AIGP BoK updates roughly annually (v2.0.1 Feb 2025, v2.1 Feb 2026), the EU AI Act gains delegated acts and guidance, NIST revises the AI RMF. A mapping verified today can silently go stale. Each framework doc therefore records two anchors: **Mapped against** (the exact source version we checked) and **Last reviewed** (the date). The refresh is a re-check of those against the live source.

**Run a refresh per framework like this:**

1. **Fetch the current source** (the framework's authoritative document) and read its version.
2. **Diff against the doc's "Mapped against" version.** No change → bump "Last reviewed" and stop. Changed → continue.
3. **List what moved** — renamed/added/removed competencies, articles, or controls (the source's own changelog usually states this).
4. **Re-run the affected mappings** through that framework's rule (the "gate discharges the obligation" test, or for AIGP the "IS how we do X" test) against the new definitions. Keep / re-tag / clear — never force.
5. **Update the data** (`principles.json` references, `mapping_state`, version + change_history per standard) and the framework doc's STATUS + "Mapped against" + "Last reviewed".
6. **Log** a `decisions.md` entry.

**On making this a `/refresh` skill or scheduled task:** good idea, and the right shape for it is *per-framework, driven by this folder* — the skill reads the registry, and for each framework runs the six steps above using that framework's own doc as the spec. It can't be fully autonomous (steps 3–4 need judgement against source text), so treat it as a guided procedure + a drift detector, not a silent auto-updater. A periodic scheduled task (e.g. quarterly) that just does steps 1–2 — "has any framework published a newer version than we mapped against?" — and reports drift is the cheap, safe piece worth automating first.
