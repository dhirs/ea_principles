"""apollo_bombora adaptor — Bombora buyer-intent surge (signal_type 'bombora_surge').

Implements the SignalAdaptor contract to intent_adaptors/apollo_bombora/README.md.
Reads Apollo's org-level intent fields (Bombora/LeadSift surge) and emits one
SignalRecord per account that is CURRENTLY surging on one of our Step-1 ICP topics.

Source call: Apollo mixed_companies/search with q_organization_domains_list (README →
Source call). Verified live 2026-07-18: the four intent fields are present on the SEARCH
payload (show_intent=true) but are absent/false on organizations/bulk_enrich — intent is
a search-surfaced signal here, so this adaptor reads search, not enrich. Batched by domain
(1 credit / page of 100) to cut credits.
Fields read off each org object (README → Source call):
    show_intent                 gate: is intent surfaced for this account
    has_intent_signal_account   is it currently surging
    intent_strength             how strongly (level → value_norm via strength_map)
    intent_signal_account       which topic (confirm ∈ ICP topics → evidence)

Emit rule (README → Logic): require show_intent AND has_intent_signal_account AND
intent_signal_account ∈ ICP topics → emit. Otherwise emit NOTHING (ADR: collection
failure != zero — absence is the scorer's denominator, never a fake value_norm=0).

observed_at caveat (README): Apollo intent is a weekly rolling snapshot with no
per-account "surge started on" date, so observed_at is the COLLECTION date. The scorer's
recency decay is therefore coarser here than for timestamped signals like job postings.

Status 2026-07-18: field surface live (show_intent=true verified) but surge values
populate on Apollo's weekly refresh — so this adaptor emits nothing until then, then
lights up on its own with zero code change.
"""
from __future__ import annotations

import json
import time
import urllib.request
from datetime import datetime, timezone

from intent_adaptors.base import SignalAdaptor, SignalRecord

SEARCH_URL = "https://api.apollo.io/api/v1/mixed_companies/search"
SEARCH_BATCH = 100       # domains per search page (1 credit/page); results ≤ domains sent
VERSION = "apollo_bombora-v1"


class ApolloBomboraAdaptor(SignalAdaptor):
    signal_type = "bombora_surge"
    source = "bombora"       # read via Apollo, but the signal is Bombora's
    version = VERSION

    def __init__(self, cfg: dict, api_key: str):
        super().__init__(cfg)
        self.api_key = api_key
        self.strength_map = cfg["strength_map"]
        # Match topics case-insensitively but keep Apollo's exact string in evidence.
        self.icp_topics = {t.lower() for t in cfg["icp_topics"]}

    # --- source call -------------------------------------------------------
    def _search(self, domains: list[str]) -> list[dict]:
        """Search a batch of domains → list of org objects (intent fields included).

        Intent surfaces on the SEARCH payload, not enrich (verified 2026-07-18).
        Results are ≤ len(domains), so one page at per_page=len(domains) suffices.
        """
        body = json.dumps({"q_organization_domains_list": domains,
                           "per_page": len(domains), "page": 1}).encode()
        req = urllib.request.Request(
            SEARCH_URL,
            data=body,
            headers={"Content-Type": "application/json",
                     "Cache-Control": "no-cache",
                     "accept": "application/json",
                     "X-Api-Key": self.api_key},
        )
        with urllib.request.urlopen(req, timeout=60) as r:
            data = json.load(r)
        return data.get("organizations") or []

    # --- normalization -----------------------------------------------------
    def _to_record(self, apollo_org_id: str, org: dict, observed_at: str,
                   run_id: str | None) -> SignalRecord | None:
        """Apply the emit rule; return a SignalRecord or None (emit nothing).

        apollo_org_id is OUR universe id (resolved by requested domain), never the
        enrich payload's id — Apollo can drift a domain to a different entity/id that
        is not in our universe and would violate the ledger's FK (Stage 4 lesson).
        """
        if not org.get("show_intent"):
            return None
        if not org.get("has_intent_signal_account"):
            return None
        topic = org.get("intent_signal_account")
        if not topic or topic.lower() not in self.icp_topics:
            return None  # surging, but not on one of OUR topics

        strength = org.get("intent_strength")
        value_norm = self.strength_map.get(str(strength).lower())
        if value_norm is None:
            # Surging on our topic but an unmapped strength level — floor rather than
            # drop, so a real surge is never silently lost. Log-visible via evidence.
            value_norm = min(self.strength_map.values())

        return SignalRecord(
            apollo_org_id=apollo_org_id,
            signal_type=self.signal_type,
            source=self.source,
            value_raw=None,                 # intent_strength is a level, not a magnitude
            value_norm=value_norm,
            confidence=1.0,                 # exact topic match; no partial coverage in v1
            observed_at=observed_at,        # collection date — see module docstring caveat
            adaptor_version=self.version,
            evidence={"topic": topic,
                      "strength": strength,
                      "show_intent": True,
                      "has_intent_signal_account": True},
            run_id=run_id,
        )

    # --- contract ----------------------------------------------------------
    def collect(self, accounts: list[dict], window: dict) -> list[SignalRecord]:
        """Fetch intent fields for each account; emit a row only on a real surge.

        `window` is vestigial here (intent is a current snapshot, not a time range).
        observed_at is stamped once per run = collection date.
        """
        run_id = window.get("run_id")
        observed_at = datetime.now(timezone.utc).isoformat()

        # Only accounts with a domain can be enriched by domain.
        by_domain: dict[str, str] = {}
        for a in accounts:
            dom = (a.get("domain") or "").strip().lower()
            if dom:
                by_domain[dom] = a["apollo_org_id"]
        domains = list(by_domain)

        records: list[SignalRecord] = []
        for i in range(0, len(domains), SEARCH_BATCH):
            batch = domains[i:i + SEARCH_BATCH]
            for org in self._search(batch):
                # Resolve the returned org back to OUR universe id via its domain;
                # skip drifted records whose domain isn't one we asked for (FK safety).
                dom = (org.get("primary_domain") or org.get("domain") or "").strip().lower()
                apollo_org_id = by_domain.get(dom)
                if not apollo_org_id:
                    continue
                rec = self._to_record(apollo_org_id, org, observed_at, run_id)
                if rec is not None:
                    records.append(rec)
            time.sleep(0.3)  # be polite to the API
        return records
