"""Step-promotion tests with a mocked LLM."""
import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from agentflow_app import config
from agentflow_app.step_promotion import Step, promote_step

DIMS = ["has_enforceable_artefact", "architecturally_distinct", "in_bp_scope", "not_vendor_menu"]

STEP = Step(
    bp_code="GENCOST02-BP03",
    step_number=1,
    step_title="Establish ground truth",
    step_verbatim="Establish a ground-truth dataset for evaluation.",
    bp_title="Evaluate model outputs",
    pillar="Operational Excellence",
    focus_area="evaluation",
)


def _promote_draft():
    return json.dumps({
        "decision": "promote",
        "rationale": "Quotes the AWS verbatim; names eval/strata.yaml + a CI gate.",
        "if_promote": {"candidate_artefact": "eval/strata.yaml", "candidate_gate_shape": "CI fails if harness missing"},
        "if_not_promote": None,
    })


def _not_promote_draft():
    return json.dumps({
        "decision": "not_promote",
        "rationale": "Absorbed by a sibling principle.",
        "if_promote": None,
        "if_not_promote": {"non_promotion_reason": "absorbed_by_sibling", "absorbing_principle_id": "GO1B1-04", "cross_pillar_target": None},
    })


def _scores(passing=True):
    return json.dumps({d: {"score": 3 if passing else 1, "justification": "ok"} for d in DIMS})


class FakeLLM:
    def __init__(self, drafts, rubrics):
        self.drafts, self.rubrics = list(drafts), list(rubrics)

    def _next(self, q):
        return q.pop(0) if len(q) > 1 else q[0]

    def complete(self, model, system, user, max_tokens=4096):
        is_rubric = "you are scoring" in system.lower()
        return self._next(self.rubrics) if is_rubric else self._next(self.drafts)


def test_promote_ratified():
    d = promote_step(STEP, FakeLLM([_promote_draft()], [_scores(True)]))
    assert d.decision == "promote"
    assert d.ratified is True
    assert d.draft["if_promote"]["candidate_artefact"] == "eval/strata.yaml"


def test_not_promote_ratified():
    d = promote_step(STEP, FakeLLM([_not_promote_draft()], [_scores(True)]))
    assert d.decision == "not_promote"
    assert d.ratified is True


def test_revise_then_ratify():
    d = promote_step(STEP, FakeLLM([_promote_draft(), _promote_draft()], [_scores(False), _scores(True)]))
    assert d.ratified is True
    assert d.retry_count == 1


def test_hard_fail():
    d = promote_step(STEP, FakeLLM([_promote_draft()], [_scores(False)]))
    assert d.ratified is False
    assert d.retry_count >= config.MAX_RETRIES


if __name__ == "__main__":
    sys.exit(pytest.main([__file__, "-v"]))
