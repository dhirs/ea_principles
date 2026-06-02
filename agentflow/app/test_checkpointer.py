"""Smoke test: prove the Supabase REST checkpointer persists & resumes.

Builds a trivial 2-node graph that increments a counter, runs it under a unique
thread_id, then reads the saved state back and walks the checkpoint history —
all through the Supabase REST API (no DB password).
"""
import re
import uuid
from pathlib import Path
from typing import TypedDict

from langgraph.graph import START, END, StateGraph

import sys
sys.path.insert(0, str(Path(__file__).resolve().parent))
from agentflow_app.supabase_checkpointer import SupabaseCheckpointer

REPO_ROOT = Path(__file__).resolve().parents[2]
env = REPO_ROOT / ".env"
text = env.read_text()
URL = re.search(r"^SUPABASE_URL=(.*)$", text, re.MULTILINE).group(1).strip()
KEY = re.search(r"^SUPABASE_KEY=(.*)$", text, re.MULTILINE).group(1).strip()


class S(TypedDict):
    count: int
    log: list[str]


def step_a(s: S) -> S:
    return {"count": s["count"] + 1, "log": s["log"] + ["a"]}


def step_b(s: S) -> S:
    return {"count": s["count"] + 10, "log": s["log"] + ["b"]}


def main() -> None:
    cp = SupabaseCheckpointer.from_credentials(URL, KEY)

    g = StateGraph(S)
    g.add_node("a", step_a)
    g.add_node("b", step_b)
    g.add_edge(START, "a")
    g.add_edge("a", "b")
    g.add_edge("b", END)
    graph = g.compile(checkpointer=cp)

    thread_id = f"smoketest-{uuid.uuid4().hex[:8]}"
    config = {"configurable": {"thread_id": thread_id}}

    print(f"thread_id = {thread_id}")
    result = graph.invoke({"count": 0, "log": []}, config=config)
    print("run result:", result)

    # Read the persisted state straight back from Supabase.
    snapshot = graph.get_state(config)
    print("persisted state:", snapshot.values)

    history = list(graph.get_state_history(config))
    print(f"checkpoints stored: {len(history)}")

    assert result["count"] == 11, result
    assert snapshot.values["count"] == 11, snapshot.values
    assert len(history) >= 3, history  # at least: start, after a, after b
    print("\nPASS — checkpoints persisted to Supabase via REST and read back.")


if __name__ == "__main__":
    main()
