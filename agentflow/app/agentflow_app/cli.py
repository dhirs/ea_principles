"""agentflow CLI.

    agentflow author <anchor.json>     run step_promotion for one step; if promote, author the principle
    agentflow walk   <steps.json>      step_promotion across all steps in a BP; author each promoted step
    agentflow resume <principle_id>    resume an in-flight principle from its Supabase checkpoint
    agentflow status <principle_id>    show per-section status
    agentflow list                     list in-flight / completed principle threads

Anchor/steps JSON shapes are documented in README.md. Live runs need ANTHROPIC_API_KEY
(or switch config models to gpt* and rely on OPENAI_API_KEY).
"""
from __future__ import annotations

import json
import os
from pathlib import Path

import typer

from . import config, env
from .llm_client import LLMClient
from .persistence import update_lens_mapping, write_to_catalogue
from .pipeline import build_pipeline_graph, run_pipeline
from .step_promotion import Step, promote_step
from .supabase_checkpointer import SupabaseCheckpointer

app = typer.Typer(add_completion=False, help="Author AI Architecture Principles.")


def _checkpointer() -> SupabaseCheckpointer:
    env.load_env()
    return SupabaseCheckpointer.from_credentials(os.environ["SUPABASE_URL"], os.environ["SUPABASE_KEY"])


def _next_principle_id(bp_code: str) -> str:
    target = config.PRINCIPLES_JSON
    n = 0
    if target.exists():
        cat = json.loads(target.read_text())
        n = sum(1 for p in cat.get("principles", []) if str(p.get("principle_id", "")).startswith(bp_code))
    return f"{bp_code}-{n + 1:02d}"


def _author(anchor: dict, llm: LLMClient, cp: SupabaseCheckpointer, *, write_real: bool) -> None:
    pid = anchor.get("principle_id") or _next_principle_id(anchor.get("bp_code", "PRIN"))
    typer.echo(f"authoring {pid} ...")
    final = run_pipeline(
        pid,
        anchor,
        llm=llm,
        checkpointer=cp,
        pillar=anchor.get("pillar", ""),
        focus_area=anchor.get("focus_area", ""),
        sibling_sections=anchor.get("sibling_sections", {}),
    )
    if final.get("status") == "completed":
        target = config.PRINCIPLES_JSON if write_real else None
        principle = write_to_catalogue(final, target=target)
        typer.echo(f"  ratified all sections -> wrote {principle['principle_id']}")
    else:
        typer.echo(f"  HALTED (awaiting human): {final.get('section_status')}")


@app.command()
def author(
    anchor_file: Path,
    write_real: bool = typer.Option(False, "--write-real", help="Write to the real principles.json instead of the scratch file."),
):
    """Step-promote one step, then author the principle if it promotes."""
    env.load_env()
    anchor = json.loads(anchor_file.read_text())
    llm, cp = LLMClient(), _checkpointer()

    step = Step(
        bp_code=anchor.get("bp_code", ""),
        step_number=anchor.get("step_number", 1),
        step_title=anchor.get("step_title", ""),
        step_verbatim=anchor.get("step_verbatim", ""),
        bp_title=anchor.get("bp_title", ""),
        pillar=anchor.get("pillar", ""),
        focus_area=anchor.get("focus_area", ""),
    )
    decision = promote_step(step, llm)
    typer.echo(f"step_promotion: {decision.decision} (ratified={decision.ratified})")
    update_lens_mapping(
        step.bp_code, step.step_number,
        "promoted_to_principle" if decision.decision == "promote" else "not_promoted",
        decision.rationale[:120],
    )
    if decision.decision == "promote":
        _author(anchor, llm, cp, write_real=write_real)


@app.command()
def walk(
    steps_file: Path,
    write_real: bool = typer.Option(False, "--write-real"),
):
    """Step-promote every step in a BP, authoring each promoted step."""
    env.load_env()
    data = json.loads(steps_file.read_text())
    steps = data["steps"] if isinstance(data, dict) else data
    llm, cp = LLMClient(), _checkpointer()
    for s in steps:
        step = Step(
            bp_code=s.get("bp_code", ""), step_number=s.get("step_number", 1),
            step_title=s.get("step_title", ""), step_verbatim=s.get("step_verbatim", ""),
            bp_title=s.get("bp_title", ""), pillar=s.get("pillar", ""), focus_area=s.get("focus_area", ""),
        )
        d = promote_step(step, llm)
        typer.echo(f"step {step.step_number}: {d.decision} (ratified={d.ratified})")
        update_lens_mapping(
            step.bp_code, step.step_number,
            "promoted_to_principle" if d.decision == "promote" else "not_promoted", d.rationale[:120],
        )
        if d.decision == "promote":
            _author({**s, "principle_id": s.get("principle_id")}, llm, cp, write_real=write_real)


@app.command()
def resume(principle_id: str):
    """Resume an in-flight principle from its Supabase checkpoint."""
    cp = _checkpointer()
    graph = build_pipeline_graph(LLMClient(), checkpointer=cp)
    final = graph.invoke(None, config={"configurable": {"thread_id": principle_id}})
    typer.echo(f"resumed {principle_id}: status={final.get('status')}")


@app.command()
def status(principle_id: str):
    """Show per-section status for a principle."""
    cp = _checkpointer()
    graph = build_pipeline_graph(LLMClient(), checkpointer=cp)
    snap = graph.get_state({"configurable": {"thread_id": principle_id}})
    if not snap.values:
        typer.echo(f"no checkpoint for {principle_id}")
        raise typer.Exit(1)
    typer.echo(f"{principle_id}: {snap.values.get('status', 'in_progress')}")
    for section, st in snap.values.get("section_status", {}).items():
        typer.echo(f"  {section}: {st}")


@app.command("list")
def list_threads():
    """List all principle threads with checkpoints."""
    cp = _checkpointer()
    threads = cp.list_threads()
    if not threads:
        typer.echo("no checkpoints found")
        return
    for t in threads:
        typer.echo(t)


if __name__ == "__main__":
    app()
