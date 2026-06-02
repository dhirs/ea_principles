"""agentflow CLI.

    agentflow author <anchor.json>     run step_promotion for one step; if promote, author the principle
    agentflow walk   <steps.json>      step_promotion across all steps in a BP; author each promoted step
    agentflow resume <principle_id>    resume an in-flight principle from its Supabase checkpoint
    agentflow status <principle_id>    show per-section status
    agentflow list                     list in-flight / completed principle threads

Anchor/steps JSON shapes are documented in README.md. Live runs need ANTHROPIC_API_KEY
(or switch config models to gpt* and rely on OPENAI_API_KEY).
"""
import json
import os
from pathlib import Path

import typer

from . import env
from .api import author_principle
from .llm_client import LLMClient
from .pipeline import build_pipeline_graph
from .supabase_checkpointer import SupabaseCheckpointer

app = typer.Typer(add_completion=False, help="Author AI Architecture Principles.")


def _checkpointer() -> SupabaseCheckpointer:
    env.load_env()
    return SupabaseCheckpointer.from_credentials(os.environ["SUPABASE_URL"], os.environ["SUPABASE_KEY"])


def _report(result: dict) -> None:
    typer.echo(f"step_promotion: {result['decision']} (ratified={result['ratified']})")
    if result["status"] == "completed":
        typer.echo(f"  ratified all sections -> wrote {result['principle_id']}")
    elif result["status"] == "awaiting_human":
        typer.echo(f"  {result['principle_id']} HALTED (awaiting human): {result.get('section_status')}")
    else:
        typer.echo("  not promoted")


@app.command()
def author(
    anchor_file: Path,
    write_real: bool = typer.Option(False, "--write-real", help="Write to the real principles.json instead of the scratch file."),
):
    """Step-promote one step, then author the principle if it promotes."""
    env.load_env()
    anchor = json.loads(anchor_file.read_text())
    _report(author_principle(anchor, llm=LLMClient(), checkpointer=_checkpointer(), write_real=write_real))


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
        typer.echo(f"--- step {s.get('step_number')} ---")
        _report(author_principle(s, llm=llm, checkpointer=cp, write_real=write_real))


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
