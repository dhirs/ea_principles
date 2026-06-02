"""Per-principle orchestrator.

The whole principle is ONE LangGraph graph: one node per LLM-authored section
(each runs that section's generate->rubric->revise subgraph to completion and
locks the ratified draft), chained sequentially, followed by a deterministic
fill node. Compiled with a checkpointer (the Supabase REST checkpointer) and run
with thread_id = principle_id, so a crash mid-section resumes at that section —
standard LangGraph checkpointing, no second checkpoint store.

A section that hard-fails sets `halted`, and every later node no-ops, leaving the
checkpoint in place for human inspection / resume.
"""
from __future__ import annotations

from typing import Any, TypedDict

from langgraph.graph import END, START, StateGraph

from . import config, deterministic_nodes
from .llm_client import LLMClient
from .section_subgraph import run_section


class PrincipleGraphState(TypedDict, total=False):
    principle_id: str
    pillar: str
    focus_area: str
    aws_anchor: dict
    sibling_sections: dict
    locked: dict            # section -> ratified draft
    section_status: dict    # section -> 'ratified' | 'hard_failed'
    halted: bool
    metadata: dict          # deterministic fields
    status: str             # 'completed' | 'awaiting_human'


def _make_section_node(section: str, llm: LLMClient):
    def node(state: PrincipleGraphState) -> dict:
        if state.get("halted"):
            return {}
        if section in state.get("section_status", {}):
            return {}  # idempotent: already done this section
        inputs = {
            "principle_id": state["principle_id"],
            "pillar": state.get("pillar", ""),
            "focus_area": state.get("focus_area", ""),
            "aws_anchor": state.get("aws_anchor", {}),
            "sibling_statements": state.get("sibling_sections", {}).get(section, []),
        }
        result = run_section(section, llm, inputs)
        status = result["status"]
        update: dict[str, Any] = {
            "section_status": {**state.get("section_status", {}), section: status},
        }
        if status == "ratified":
            update["locked"] = {**state.get("locked", {}), section: result["draft"]}
        else:
            update["halted"] = True
        return update

    return node


def _finalize_node(state: PrincipleGraphState) -> dict:
    if state.get("halted"):
        return {"status": "awaiting_human"}
    locked = state.get("locked", {})
    pillar, focus_area = deterministic_nodes.assign_pillar_and_focus_area(state.get("aws_anchor", {}))
    ownership = deterministic_nodes.ownership_fill(locked.get("tier"))
    evidence = deterministic_nodes.evidence_from_audit(ownership["audit_mode"])
    metadata = {
        "principle_id": state["principle_id"],
        "pillar": pillar or state.get("pillar", ""),
        "focus_area": focus_area or state.get("focus_area", ""),
        "ownership": ownership,
        "evidence": evidence,
        "change_history": deterministic_nodes.change_history_initial(),
    }
    return {"metadata": metadata, "status": "completed"}


def build_pipeline_graph(llm: LLMClient, *, sections: list[str] | None = None, checkpointer=None):
    sections = sections or config.SECTION_ORDER
    g = StateGraph(PrincipleGraphState)

    prev = START
    for section in sections:
        node_name = f"section_{section}"
        g.add_node(node_name, _make_section_node(section, llm))
        g.add_edge(prev, node_name)
        prev = node_name

    g.add_node("finalize", _finalize_node)
    g.add_edge(prev, "finalize")
    g.add_edge("finalize", END)

    compiled = g.compile(checkpointer=checkpointer)
    compiled.name = "agentflow-principle"
    return compiled


def run_pipeline(
    principle_id: str,
    aws_anchor: dict,
    *,
    llm: LLMClient,
    checkpointer=None,
    pillar: str = "",
    focus_area: str = "",
    sibling_sections: dict | None = None,
    sections: list[str] | None = None,
) -> dict:
    graph = build_pipeline_graph(llm, sections=sections, checkpointer=checkpointer)
    run_config = {
        "configurable": {"thread_id": principle_id},
        "run_name": f"author:{principle_id}",
        "tags": [principle_id, "author"],
        "metadata": {"principle_id": principle_id},
    }
    return graph.invoke(
        {
            "principle_id": principle_id,
            "aws_anchor": aws_anchor,
            "pillar": pillar,
            "focus_area": focus_area,
            "sibling_sections": sibling_sections or {},
            "locked": {},
            "section_status": {},
        },
        config=run_config,
    )
