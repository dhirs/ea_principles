"""Pipeline orchestrator tests — flat graph, with a schema-aware fake LLM.

The fake reads the section + op from the prompt, then returns a draft that
satisfies that section's output_contract (so validation passes) and rubric scores
that pass (or fail, per `fail_sections`). The resume/persistence test uses the
real Supabase REST checkpointer.
"""
import json
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


def _synth(schema):
    out = {}
    for k, v in schema.items():
        if isinstance(v, dict):
            out[k] = _synth(v)
        else:
            out[k] = 3 if re.search(r"\bint\b|integer", str(v).lower()) else "x"
    return out


class FakeLLM:
    """Returns contract-valid drafts; rubric passes unless the section is in fail_sections."""

    def __init__(self, fail_sections=()):
        self.fail = set(fail_sections)

    def complete(self, model, system, user, max_tokens=4096, *, contract=None, schema_name="", **kw):
        sys_l = system.lower()
        m = re.search(r"section you are (?:authoring|scoring):\s*(\w+)", sys_l)
        section = m.group(1) if m else "statement"
        schema = (contract or {}).get("schema") or {}
        if "you are scoring" in sys_l:  # rubric
            score = 1 if section in self.fail else 3
            return json.dumps({dim: {"score": score, "justification": "x"} for dim in schema})
        return json.dumps(_synth(schema))  # generate / revise


def test_full_run_completes():
    final = run_pipeline("PIPE-01", ANCHOR, llm=FakeLLM(), sections=SECTIONS)
    assert final["status"] == "completed"
    assert set(final["locked"]) == set(SECTIONS)
    assert final["section_status"]["statement"] == "ratified"


def test_hard_fail_marks_section_but_run_finishes():
    final = run_pipeline("PIPE-02", ANCHOR, llm=FakeLLM(fail_sections={"problem"}), sections=SECTIONS)
    assert final["status"] == "awaiting_human"
    assert final["section_status"]["statement"] == "ratified"
    assert final["section_status"]["problem"] == "hard_failed"
    assert "problem" not in final.get("locked", {})


def _load_creds():
    t = (Path(__file__).resolve().parents[3] / ".env").read_text()
    url = re.search(r"^SUPABASE_URL=(.*)$", t, re.M).group(1).strip()
    key = re.search(r"^SUPABASE_KEY=(.*)$", t, re.M).group(1).strip()
    return url, key


def test_checkpoint_persists_to_supabase():
    from agentflow_app.supabase_checkpointer import SupabaseCheckpointer

    url, key = _load_creds()
    cp = SupabaseCheckpointer.from_credentials(url, key)
    pid = f"PIPE-{uuid.uuid4().hex[:8]}"

    final = run_pipeline(pid, ANCHOR, llm=FakeLLM(), checkpointer=cp, sections=SECTIONS)
    assert final["status"] == "completed"

    graph = pipeline_mod.build_pipeline_graph(FakeLLM(), sections=SECTIONS, checkpointer=cp)
    snapshot = graph.get_state({"configurable": {"thread_id": pid}})
    assert set(snapshot.values["locked"]) == set(SECTIONS)
    assert all(v == "ratified" for v in snapshot.values["section_status"].values())


if __name__ == "__main__":
    sys.exit(pytest.main([__file__, "-v"]))
