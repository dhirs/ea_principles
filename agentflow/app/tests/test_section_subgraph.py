"""Section subgraph tests with a mocked LLM — no API key, no network."""
import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from agentflow_app import config
from agentflow_app.section_subgraph import run_section

RUBRIC_DIMS = [
    "is_prescriptive",
    "derives_from_aws_verbatim",
    "names_artefact_and_enforcement",
    "scope_match",
    "parallel_form_with_siblings",
]


def _draft(title="Maintain a versioned thing in the repo", desc="A. B. C."):
    return json.dumps({"title": title, "description": desc})


def _scores(passing=True):
    return json.dumps(
        {d: {"score": 3 if passing else 1, "justification": "ok"} for d in RUBRIC_DIMS}
    )


class FakeLLM:
    """Routes by model: haiku -> rubric queue, else -> draft queue.

    A single-element queue acts as 'always return this'; longer queues pop.
    """

    def __init__(self, drafts, rubrics):
        self.drafts = list(drafts)
        self.rubrics = list(rubrics)

    def _next(self, q):
        return q.pop(0) if len(q) > 1 else q[0]

    def complete(self, model, system, user, max_tokens=4096):
        return self._next(self.rubrics) if model.startswith("claude-haiku") else self._next(self.drafts)


INPUTS = {
    "principle_id": "TEST-01",
    "pillar": "Operational Excellence",
    "focus_area": "evaluation",
    "sibling_statements": ["Maintain a versioned eval harness in the repo"],
    "aws_anchor": {
        "bp_code": "GENCOST02-BP03",
        "step_number": 1,
        "step_title": "Establish ground truth",
        "step_verbatim": "Establish a ground-truth dataset for evaluation.",
        "pillar": "Operational Excellence",
        "question": "How do you evaluate agents?",
    },
}


def test_ratifies_on_first_pass():
    llm = FakeLLM(drafts=[_draft()], rubrics=[_scores(passing=True)])
    result = run_section("statement", llm, INPUTS)
    assert result["status"] == "ratified"
    assert result["retry_count"] == 0
    assert result["draft"]["title"]


def test_revise_loop_then_ratify():
    llm = FakeLLM(
        drafts=[_draft(title="bad"), _draft(title="Maintain a versioned thing in the repo")],
        rubrics=[_scores(passing=False), _scores(passing=True)],
    )
    result = run_section("statement", llm, INPUTS)
    assert result["status"] == "ratified"
    assert result["retry_count"] == 1


def test_hard_fail_after_max_retries():
    llm = FakeLLM(drafts=[_draft()], rubrics=[_scores(passing=False)])
    result = run_section("statement", llm, INPUTS)
    assert result["status"] == "hard_failed"
    assert result["retry_count"] >= config.MAX_RETRIES


def test_unparseable_generate_routes_to_revise():
    # generate returns junk -> synthetic well_formed fail -> revise produces valid -> rubric passes
    llm = FakeLLM(
        drafts=["not json at all", _draft()],
        rubrics=[_scores(passing=True)],
    )
    result = run_section("statement", llm, INPUTS)
    assert result["status"] == "ratified"
    assert result["retry_count"] == 1


if __name__ == "__main__":
    sys.exit(pytest.main([__file__, "-v"]))
