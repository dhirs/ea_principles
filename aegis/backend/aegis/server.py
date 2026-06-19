"""Aegis MCP server.

Exposes the catalogue's *derived* capabilities as MCP tools. The client (a
customer's Claude) calls a tool with a project profile; this process runs the
logic against the private catalogue and returns conclusions only.

Run modes (set by AEGIS_TRANSPORT):
    stdio            (default) — local / plugin use:  python -m aegis.server
    streamable-http  — remote connector for another account:
                       AEGIS_TRANSPORT=streamable-http python -m aegis.server
                       serves the MCP endpoint at  http://<host>:<port>/mcp

Host/port for HTTP come from AEGIS_HOST (default 0.0.0.0) and AEGIS_PORT
(default 8000).
"""

from __future__ import annotations

import os
from typing import Any

from mcp.server.fastmcp import FastMCP

from . import catalogue, guardrails, rubrics

mcp = FastMCP(
    "aegis",
    host=os.environ.get("AEGIS_HOST", "0.0.0.0"),
    port=int(os.environ.get("AEGIS_PORT", "8000")),
)


@mcp.tool()
def get_applicable_standards(
    paradigms: list[str],
    include_nice_to_have: bool = True,
) -> dict[str, Any]:
    """Return which AI architecture standards apply to a project.

    Args:
        paradigms: The serving paradigm(s) the project uses. Valid values:
            "llm", "rag", "agentic", "ml". An Agentic RAG project is
            ["agentic", "rag"].
        include_nice_to_have: If True, also return standards that are
            nice_to_have (not just mandatory) for the given paradigms.

    Returns a derived view: applicable standards grouped by pillar, each with
    its title, focus area, impact level, why it matched, and a gate summary.
    Rubric internals and full prose stay server-side and are not returned.
    """
    return catalogue.get_applicable_standards(
        paradigms=paradigms,
        include_nice_to_have=include_nice_to_have,
    )


@mcp.tool()
def map_guardrails(component_type: str) -> dict[str, Any]:
    """Map the guardrail standards onto the control zones for a component.

    Args:
        component_type: "llm", "rag", or "agent". Nesting applies
            (llm ⊂ rag ⊂ agent). An Agentic RAG project is "agent".

    Returns the standards that gate Zone 1 (ingress), Zone 2 (process & act),
    Zone 3 (pre-delivery), and the cross-cutting band — each with what it gates
    at that crossing.
    """
    return guardrails.map_guardrails(component_type)


@mcp.tool()
def design_guardrail(check_type: str) -> dict[str, Any]:
    """Return layered implementation guidance for a guardrail check.

    Args:
        check_type: one of "input_screening", "content_safety", "grounding",
            "action_gate", "business_logic".

    Returns the zone, the engine per layer (managed vs custom vs app-side),
    deterministic-vs-probabilistic classification, the on_trip fallback, and the
    scope caveats (e.g. grounded ≠ true; guardrail ≠ business-logic).
    """
    return guardrails.design_guardrail(check_type)


@mcp.tool()
def review_against_standard(standard_id: str, design: str) -> dict[str, Any]:
    """Review a design against a standard's blocking gates.

    Args:
        standard_id: e.g. "ST-GS2B1-01" (the ST- prefix is optional).
        design: a description of the project's design / implementation to check.

    Returns the gate-by-gate checklist the design must satisfy. If an LLM judge
    is configured server-side (AEGIS_ANTHROPIC_API_KEY), also returns an
    automated pass/fail verdict with per-gate reasons. Rubric internals stay
    server-side.
    """
    return rubrics.review_against_standard(standard_id, design)


@mcp.tool()
def catalogue_info() -> dict[str, Any]:
    """Return catalogue metadata (title, description, standard count)."""
    return catalogue.catalogue_meta()


def main() -> None:
    transport = os.environ.get("AEGIS_TRANSPORT", "stdio")
    mcp.run(transport=transport)


if __name__ == "__main__":
    main()
