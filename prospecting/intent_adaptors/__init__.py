"""Stage 5 intent adaptors — one folder, one shape.

Each signal is a self-contained adaptor at intent_adaptors/<slug>/ (README.md +
adaptor.py) implementing the shared SignalAdaptor contract in base.py and registered
in registry.py. Adaptors emit normalized SignalRecords into the apollo_intent_signals
ledger; they NEVER write apollo_company_scores — only the composite scorer does.

Architecture: adr/2026-07-18-stage5-intent-scoring.md. Convention: methodology.md →
"Intent adaptors — one folder, one shape". Reference adaptor: apollo_bombora/.
"""
