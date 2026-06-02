"""Persistence tests — catalogue assembly + atomic write + ledger."""
import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from agentflow_app import persistence

STATE = {
    "principle_id": "GENCOST02-BP03-01",
    "locked": {
        "statement": {"title": "Maintain X", "description": "desc"},
        "problem": {"title": "P", "description": "d"},
    },
    "metadata": {
        "principle_id": "GENCOST02-BP03-01",
        "pillar": "Operational Excellence",
        "focus_area": "evaluation",
        "ownership": {"tier": "local", "validator": "project_architect", "audit_mode": "self_attestation_with_mechanical_evidence", "arb_role": "dashboard_and_spot_check"},
        "evidence": {"artefacts": [], "review_mode": "automated_only", "sign_off": "binary"},
        "change_history": [{"version": "1.0.0", "date": "2026-06-02", "author": "agentflow", "summary": "Initial authoring."}],
    },
}


def test_build_principle():
    p = persistence.build_principle(STATE)
    assert p["principle_id"] == "GENCOST02-BP03-01"
    assert p["statement"]["title"] == "Maintain X"
    assert p["ownership"]["tier"] == "local"
    assert p["change_history"][0]["version"] == "1.0.0"


def test_write_and_idempotent_replace(tmp_path):
    target = tmp_path / "principles_authored.json"
    persistence.write_to_catalogue(STATE, target=target)
    cat = json.loads(target.read_text())
    assert len(cat["principles"]) == 1
    assert cat["principles"][0]["principle_id"] == "GENCOST02-BP03-01"

    # re-authoring the same id replaces, does not duplicate
    persistence.write_to_catalogue(STATE, target=target)
    cat = json.loads(target.read_text())
    assert len(cat["principles"]) == 1


def test_atomic_no_tmp_left(tmp_path):
    target = tmp_path / "principles_authored.json"
    persistence.write_to_catalogue(STATE, target=target)
    assert not (tmp_path / "principles_authored.json.tmp").exists()


def test_update_lens_mapping(tmp_path):
    ledger = tmp_path / "ledger.md"
    persistence.update_lens_mapping("GENCOST02-BP03", 1, "promoted_to_principle", "named eval/strata.yaml", target=ledger)
    text = ledger.read_text()
    assert "GENCOST02-BP03 step 1" in text
    assert "promoted_to_principle" in text


if __name__ == "__main__":
    sys.exit(pytest.main([__file__, "-v"]))
