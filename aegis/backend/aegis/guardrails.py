"""Guardrail zone model + layered guardrail design.

Encodes the Component Boundary Model (guardrail.md): the three control zones,
the cross-cutting band, and per-standard L/R/A pattern applicability. Titles are
joined from the live catalogue so they never drift.

Two tools draw on this:
  - map_guardrails(component_type) -> the standards that gate each zone for an
    LLM / RAG / agent component.
  - design_guardrail(check_type)   -> the layered implementation guidance
    (engine per layer, deterministic vs probabilistic, on_trip, scope caveats).
"""

from __future__ import annotations

from typing import Any

from . import catalogue

# Pattern nesting: llm subset of rag subset of agent.
COMPONENT_TYPES = ("llm", "rag", "agent")

ZONE_LABELS = {
    "zone1": "Zone 1 — Ingress (what is allowed in)",
    "zone2": "Zone 2 — Process & act (the call + actions to the world)",
    "zone3": "Zone 3 — Pre-delivery gate (safe to hand to the user)",
    "band": "Cross-cutting band (wraps every zone)",
}

# standard_id -> { zone, patterns it is mandatory in, gate note }.
# Patterns: l = LLM-only, r = RAG, a = Agent. Source: guardrail.md.
ZONE_MODEL: dict[str, dict[str, Any]] = {
    # --- Zone 1: Ingress ---
    "ST-GS4B2-01": {"zone": "zone1", "l": True, "r": True, "a": True,
                    "gates_here": "Input screened, size- and rate-bounded before the model acts."},
    "ST-GS1B3-01": {"zone": "zone1", "l": False, "r": True, "a": True,
                    "gates_here": "Retrieval scoped to the asking user's entitlements."},
    "ST-GS1B3-02": {"zone": "zone1", "l": False, "r": True, "a": True,
                    "gates_here": "Prohibited / out-of-scope data kept out of the store at write time."},
    "ST-GC4B1-01": {"zone": "zone1", "l": False, "r": True, "a": True,
                    "gates_here": "Right-sizes the embedding / retrieval pipeline feeding context in."},
    # --- Zone 2: Process & act ---
    "ST-GS5B1-01": {"zone": "zone2", "l": False, "r": False, "a": True,
                    "gates_here": "Irreversible / externally-visible actions pass a check before they run."},
    "ST-GC5B1-01": {"zone": "zone2", "l": False, "r": False, "a": True,
                    "gates_here": "Bounds the agent loop / spend so it cannot run away."},
    "ST-GC1B1-01": {"zone": "zone2", "l": True, "r": True, "a": True,
                    "gates_here": "Constrains which model may be called, with a recorded rationale."},
    "ST-GC3B1-01": {"zone": "zone2", "l": True, "r": True, "a": True,
                    "gates_here": "Disciplines the prompt the component sends to the model."},
    "ST-GC3B3-01": {"zone": "zone2", "l": True, "r": True, "a": True,
                    "gates_here": "Caches repeated prompt content across calls."},
    # --- Zone 3: Pre-delivery gate ---
    "ST-GS2B1-01": {"zone": "zone3", "l": True, "r": True, "a": True,
                    "gates_here": "Response passes safety + grounding check with a safe fallback before display."},
    # --- Cross-cutting band ---
    "ST-GO3B2-01": {"zone": "band", "l": True, "r": True, "a": True,
                    "gates_here": "Observability across all zones."},
    "ST-GO3B2-02": {"zone": "band", "l": True, "r": True, "a": True,
                    "gates_here": "Data governance over the observability stream."},
    "ST-GO1B1-04": {"zone": "band", "l": True, "r": True, "a": True,
                    "gates_here": "Continuous quality / drift monitoring."},
    "ST-GO1B1-03": {"zone": "band", "l": True, "r": True, "a": True,
                    "gates_here": "Consistent measurement method."},
    "ST-GO1B1-06": {"zone": "band", "l": True, "r": True, "a": True,
                    "gates_here": "Model versioning / change control."},
    "ST-GO3B1-01": {"zone": "band", "l": True, "r": True, "a": True,
                    "gates_here": "Prompt governance."},
    "ST-GC2B2-01": {"zone": "band", "l": True, "r": True, "a": True,
                    "gates_here": "Infrastructure right-sizing / cost-ops."},
    "ST-GO1B1-01": {"zone": "band", "l": False, "r": False, "a": True,
                    "gates_here": "Pre-ship evaluation."},
    "ST-GO1B1-02": {"zone": "band", "l": False, "r": False, "a": True,
                    "gates_here": "Fairness in evaluation."},
    "ST-GO1B1-05": {"zone": "band", "l": False, "r": False, "a": True,
                    "gates_here": "Evaluation-set maintenance."},
    "ST-GS6B1-01": {"zone": "band", "l": True, "r": True, "a": True,
                    "gates_here": "Training-data integrity (build-time, upstream of the runtime boundary)."},
}

_PATTERN_KEY = {"llm": "l", "rag": "r", "agent": "a"}


def _title_lookup() -> dict[str, str]:
    out: dict[str, str] = {}
    for std in (catalogue._standards()):  # internal read, server-side only
        sid = std.get("standard_id")
        title = (std.get("statement") or {}).get("title")
        if sid:
            out[sid] = title
    return out


def map_guardrails(component_type: str) -> dict[str, Any]:
    """Return the guardrail standards that gate each zone for a component.

    component_type: "llm", "rag", or "agent". Nesting applies — an agent
    inherits everything rag and llm carry (llm subset of rag subset of agent).
    Agentic RAG is "agent".
    """
    ct = (component_type or "").strip().lower()
    # Friendly aliases.
    if ct in ("agentic", "agentic_rag", "agentic rag"):
        ct = "agent"
    if ct not in COMPONENT_TYPES:
        return {
            "error": f"Unknown component_type '{component_type}'.",
            "valid": list(COMPONENT_TYPES),
            "note": "Agentic RAG -> 'agent'.",
        }

    pat = _PATTERN_KEY[ct]
    titles = _title_lookup()

    zones: dict[str, list[dict[str, Any]]] = {"zone1": [], "zone2": [], "zone3": [], "band": []}
    for sid, info in ZONE_MODEL.items():
        if info.get(pat):
            zones[info["zone"]].append({
                "standard_id": sid,
                "title": titles.get(sid),
                "gates_here": info["gates_here"],
            })
    for z in zones.values():
        z.sort(key=lambda x: x["standard_id"])

    total = sum(len(v) for v in zones.values())
    return {
        "component_type": ct,
        "nesting_note": "llm ⊂ rag ⊂ agent — an agent re-crosses Zones 1 & 2 every loop iteration.",
        "summary": {"mandatory_total": total, "by_zone": {z: len(v) for z, v in zones.items()}},
        "zones": [
            {"zone": z, "label": ZONE_LABELS[z], "standards": zones[z]}
            for z in ("zone1", "zone2", "zone3", "band")
        ],
    }


# --- design_guardrail: layered implementation guidance per check type ---

_DESIGN: dict[str, dict[str, Any]] = {
    "input_screening": {
        "standard_id": "ST-GS4B2-01",
        "zone": "zone1",
        "intent": "Screen user input before it reaches the model.",
        "layers": [
            {"layer": 1, "engine": "Managed (Bedrock Guardrails / Azure Content Safety)",
             "checks": ["prompt-injection patterns", "denied topics", "PII", "size / rate limits"],
             "nature": "deterministic-ish", "cost": "cheap, low-latency", "order": "first"},
        ],
        "on_trip": "Reject or sanitise before the model is called; never pass raw flagged input through.",
        "caveats": ["For an agent this re-fires every loop, since each tool result re-enters as ingress."],
    },
    "content_safety": {
        "standard_id": "ST-GS2B1-01",
        "zone": "zone3",
        "intent": "Check a model's RESPONSE for unsafe content before the user sees it.",
        "layers": [
            {"layer": 1, "engine": "Managed (Bedrock Guardrails / Azure Content Safety)",
             "checks": ["toxicity / hate / violence", "denied topics", "PII leakage"],
             "nature": "deterministic-ish", "cost": "cheap", "order": "first"},
        ],
        "on_trip": "block_and_replace / disclaimer / escalate — return the declared fallback, never raw model text.",
        "caveats": ["Pairs with the grounding check (Layer 2) on the same response."],
    },
    "grounding": {
        "standard_id": "ST-GS2B1-01",
        "zone": "zone3",
        "intent": "Check the response is faithful to the retrieved context (RAG paths).",
        "layers": [
            {"layer": 2, "engine": "Custom — LLM-as-judge or NLI classifier",
             "checks": ["is every claim supported by the chunks actually retrieved this run?"],
             "nature": "probabilistic", "cost": "one extra inference per response", "order": "after Layer 1"},
        ],
        "on_trip": "Treat as a trip: return the on_trip fallback, do not ship the ungrounded answer.",
        "caveats": [
            "There is NO deterministic function for semantic faithfulness; embedding cosine measures topical overlap, not truth.",
            "Grounded ≠ true: a faithful answer over a stale/wrong document is grounded and still wrong — corpus freshness is a separate concern.",
            "Checks against the RUN's retrieved context, NOT against ground truth (ground truth is offline eval only).",
        ],
    },
    "action_gate": {
        "standard_id": "ST-GS5B1-01",
        "zone": "zone2",
        "intent": "Check a consequential agent action BEFORE it executes (agent-only).",
        "layers": [
            {"layer": 1, "engine": "Policy/rules + optional human-in-the-loop",
             "checks": ["is this action permitted, reversible, within scope/spend?"],
             "nature": "deterministic where policy allows; probabilistic if an LLM classifies intent",
             "cost": "varies", "order": "before execution"},
        ],
        "on_trip": "Block the action; escalate for human approval; never execute-then-check.",
        "caveats": ["Gated in Zone 2 (action to the world), distinct from Zone 3 (response to the user)."],
    },
    "business_logic": {
        "standard_id": None,
        "zone": "app-side (Layer 3)",
        "intent": "Verify a claim against a live system of record (CRM / DB / pricing).",
        "layers": [
            {"layer": 3, "engine": "Your application code (NOT the guardrail SDK)",
             "checks": ["re-query the source of truth: is this offer valid, does this balance match?"],
             "nature": "deterministic", "cost": "a backend call", "order": "app-side, out of guardrail scope"},
        ],
        "on_trip": "Application decides — correct, suppress, or flag the claim.",
        "caveats": [
            "Explicitly OUT OF SCOPE of GS2B1-01. Guardrail ≠ business-logic verification.",
            "This is the 'other system' for real-world fact checks — the system of record, not a labelled eval set.",
        ],
    },
}


def design_guardrail(check_type: str) -> dict[str, Any]:
    """Return layered implementation guidance for a guardrail check type.

    check_type: one of input_screening, content_safety, grounding,
    action_gate, business_logic.
    """
    ct = (check_type or "").strip().lower()
    if ct not in _DESIGN:
        return {"error": f"Unknown check_type '{check_type}'.", "valid": list(_DESIGN.keys())}
    out = dict(_DESIGN[ct])
    out["check_type"] = ct
    sid = out.get("standard_id")
    if sid:
        out["title"] = _title_lookup().get(sid)
    out["layering_rule"] = "Run cheapest + most deterministic checks first; pay for a model judge only on what survives."
    return out
