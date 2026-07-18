"""Central adaptor registry (ADR §4).

The collector runner is source-agnostic: it iterates this list and, for each enabled
adaptor, upserts collect() into the ledger. Adding a signal is one class + one line here
+ a config weight — nothing else moves (ADR §8). v1 registers only apollo_bombora.

build_registry(env) constructs instances from config.SIGNALS, injecting per-source
clients (Apollo API key) where needed. An adaptor with no config entry, or config
enabled: False, still constructs — the scorer counts its weight in the denominator only
if enabled — but v1 simply omits the not-yet-built ones.
"""
from __future__ import annotations

from intent_adaptors import config
from intent_adaptors.apollo_bombora import ApolloBomboraAdaptor
from intent_adaptors.base import SignalAdaptor


def build_registry(env: dict[str, str]) -> list[SignalAdaptor]:
    """Return the list of adaptor instances for this run.

    env: parsed .env (needs APOLLO_API_KEY for Apollo-sourced adaptors).
    """
    reg: list[SignalAdaptor] = [
        ApolloBomboraAdaptor(config.SIGNALS["bombora_surge"],
                             api_key=env["APOLLO_API_KEY"]),
    ]
    # Future signals (apollo_job_postings, event_attendance, web_visitors, news_events)
    # register here as they are built. Not-yet-built signals are simply absent in v1.
    return reg


def enabled_weight_total() -> float:
    """Σ weight over ENABLED signals — the scorer's composite denominator (ADR §6).

    Divide by total enabled weight (not present-signal weight) so ABSENCE lowers the
    score: an account lit up on one of several enabled signals is cooler than one
    corroborated across them.
    """
    return sum(s["weight"] for s in config.SIGNALS.values() if s.get("enabled"))
