"""Parse an LLM response as JSON and structurally validate it.

The section output_contract.schema files are *shape descriptors* (values are
human type-hints like "int 0-3", not formal JSON Schema), so validation here is
structural: the parsed object must be a dict containing every key the schema
declares (recursively for nested dicts). A failure raises ContractError, which
the subgraph treats as a synthetic 'well_formed' rubric failure -> route to revise.
"""
from __future__ import annotations

import json
import re

_FENCE = re.compile(r"```(?:json)?\s*(.*?)```", re.DOTALL)


class ContractError(ValueError):
    """Raised when an LLM response is unparseable or violates its contract."""


def parse_json(raw: str) -> dict:
    text = raw.strip()
    m = _FENCE.search(text)
    if m:
        text = m.group(1).strip()
    else:
        # tolerate prose around a single JSON object
        start, end = text.find("{"), text.rfind("}")
        if start != -1 and end != -1 and end > start:
            text = text[start : end + 1]
    try:
        obj = json.loads(text)
    except json.JSONDecodeError as e:
        raise ContractError(f"response is not valid JSON: {e}") from e
    if not isinstance(obj, dict):
        raise ContractError("response JSON is not an object")
    return obj


def _check_keys(obj: dict, schema: dict, path: str = "") -> None:
    for key, spec in schema.items():
        if key not in obj:
            raise ContractError(f"missing required field: {path}{key}")
        if isinstance(spec, dict):
            child = obj[key]
            if child is None:
                continue  # nullable nested object (e.g. if_promote when not_promote)
            if not isinstance(child, dict):
                raise ContractError(f"field {path}{key} must be an object")
            _check_keys(child, spec, path=f"{path}{key}.")


def validate_contract(obj: dict, output_contract: dict) -> dict:
    schema = (output_contract or {}).get("schema")
    if isinstance(schema, dict):
        _check_keys(obj, schema)
    return obj


def parse_and_validate(raw: str, output_contract: dict) -> dict:
    return validate_contract(parse_json(raw), output_contract)
