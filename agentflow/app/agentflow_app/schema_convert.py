"""Convert a section's output_contract.schema (loose hint dict) into a real
JSON Schema usable with OpenAI Structured Outputs (strict mode).

The contract files describe shapes with human hint-strings, e.g.
    {"decision": "string — 'promote' | 'not_promote'",
     "if_promote": {"candidate_artefact": "string | null — ..."}}
Strict structured outputs needs: every property listed in `required`,
`additionalProperties: false` on every object, and concrete types. Optionality
is expressed as a nullable union (`["string", "null"]`). A nested object whose
fields are all nullable is itself made nullable (covers if_promote/if_not_promote).
"""
from __future__ import annotations

import re


def _leaf(hint: str) -> dict:
    h = str(hint).lower()
    nullable = "| null" in h or "|null" in h
    if re.search(r"\bint\b|integer", h):
        base = "integer"
    elif "number" in h or "float" in h:
        base = "number"
    elif "bool" in h:
        base = "boolean"
    elif h.strip().startswith("array") or h.strip().startswith("[") or "list of" in h:
        return {"type": (["array", "null"] if nullable else "array"), "items": {"type": "string"}}
    else:
        base = "string"
    return {"type": ([base, "null"] if nullable else base)}


def _allows_null(schema: dict) -> bool:
    t = schema.get("type")
    return isinstance(t, list) and "null" in t


def _object(d: dict) -> tuple[dict, bool]:
    props: dict = {}
    required: list[str] = []
    all_nullable = True
    for key, val in d.items():
        if isinstance(val, dict):
            child, child_nullable = _object(val)
            if child_nullable:
                child["type"] = ["object", "null"]
        else:
            child = _leaf(val)
            child_nullable = _allows_null(child)
        props[key] = child
        required.append(key)
        if not child_nullable:
            all_nullable = False
    obj = {
        "type": "object",
        "properties": props,
        "required": required,
        "additionalProperties": False,
    }
    return obj, (all_nullable and bool(d))


def to_json_schema(hint_schema: dict) -> dict:
    """Top-level: root must be a (non-nullable) object for strict mode."""
    if not isinstance(hint_schema, dict) or not hint_schema:
        raise ValueError("output_contract.schema must be a non-empty object")
    root, _ = _object(hint_schema)
    return root
