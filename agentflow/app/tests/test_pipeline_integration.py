"""Pipeline orchestrator tests.

Isolate the orchestrator (parent graph + sequencing + halt + checkpointer) by
stubbing run_section — the subgraph itself is covered by test_section_subgraph.
The resume/persistence test uses the real Supabase REST checkpointer.
"""
import re
import sys
import uuid
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import agentflow_app.pipeline as pipeline_mod
from agentflow_app.pipeline import run_pipeline

SECTIONS = ["statement", "problem"]
ANCHOR = {"bp_code": "GENCOST02-BP03", "pillar": "Operational Excellence", "focus_area": "evaluation"}


def _ratify_all(section, llm, inputs, **kw):
    return {"status": "ratified", "draft": {"title": f"{section} t", "description": "d"}, "retry_count": 0, "verdict": "ratify"}


def _hard_fail_problem(section, llm, inputs, **kw):
    if section == "problem":
        return {"status": "hard_failed", "draft": {"_raw": "x"}, "retry_count": 3, "verdict": "fail"}
    return _ratify_all(section, llm, inputs)


def test_full_run_completes(monkeypatch):
    monkeypatch.setattr(pipeline_mod, "run_section", _ratify_all)
    final = run_pipeline("PIPE-01", ANCHOR, llm=None, sections=SECTIONS)
    assert final["status"] == "completed"
    assert set(final["locked"]) == set(SECTIONS)
    assert final["metadata"]["principle_id"] == "PIPE-01"
    assert final["metadata"]["change_history"][0]["version"] == "1.0.0"


def test_hard_fail_halts_and_skips_rest(monkeypatch):
    monkeypatch.setattr(pipeline_mod, "run_section", _hard_fail_problem)
    final = run_pipeline("PIPE-02", ANCHOR, llm=None, sections=SECTIONS)
    assert final["status"] == "awaiting_human"
    assert final["halted"] is True
    assert final["section_status"]["statement"] == "ratified"
    assert final["section_status"]["problem"] == "hard_failed"
    assert "problem" not in final.get("locked", {})


def _load_creds():
    t = (Path(__file__).resolve().parents[3] / ".env").read_text()
    url = re.search(r"^SUPABASE_URL=(.*)$", t, re.M).group(1).strip()
    key = re.search(r"^SUPABASE_KEY=(.*)$", t, re.M).group(1).strip()
    return url, key


def test_checkpoint_persists_to_supabase(monkeypatch):
    monkeypatch.setattr(pipeline_mod, "run_section", _ratify_all)
    from agentflow_app.supabase_checkpointer import SupabaseCheckpointer

    url, key = _load_creds()
    cp = SupabaseCheckpointer.from_credentials(url, key)
    pid = f"PIPE-{uuid.uuid4().hex[:8]}"

    final = run_pipeline(pid, ANCHOR, llm=None, checkpointer=cp, sections=SECTIONS)
    assert final["status"] == "completed"

    # Re-read state straight from Supabase via the checkpointer.
    graph = pipeline_mod.build_pipeline_graph(None, sections=SECTIONS, checkpointer=cp)
    snapshot = graph.get_state({"configurable": {"thread_id": pid}})
    assert set(snapshot.values["locked"]) == set(SECTIONS)
    assert snapshot.values["status"] == "completed"


if __name__ == "__main__":
    sys.exit(pytest.main([__file__, "-v"]))
