# Stage 1 — Service to NAICS

**Input:** user describes their product/service.
**Output:** ranked list of NAICS codes to target. Nothing else — no searching, no filters.

## Process

1. Ask the user:
   - What is the product/service?
   - Who buys it (role/department)?
   - What pain does it solve?
   - Any verticals already selling into, or explicitly out of scope?
2. From the answers, identify which industries feel that pain hardest. Reason from the pain, not from generic industry lists.
3. Output a ranked table: NAICS code (3-digit), industry name, one-line why.
4. Include a standing exclusion list (NAICS to always exclude).
5. Confirm with the user before any code is used in a search.

## Current answer for this project (CDP architecture selection service)

Pain targeted: customer data fragmented across channels the company doesn't control.

| Rank | NAICS | Industry | Why |
|---|---|---|---|
| 1 | 423 | Durable-goods wholesale/distribution | Data chaos on both sides of the channel |
| 2 | 333 | Machinery manufacturing | Dealer channel, no view of end customer |
| 3 | 335 | Electrical equipment & appliances | Same channel structure |
| 4 | 326 | Plastics & rubber products | Mid-market dense, distributor blindness |

Expansion and opportunistic tiers: see `naics-target-industries.md`.

**Exclusions (always):** 813 nonprofits/associations, 51 media, 61 education, 92 public admin.

## Stage boundary

Stage 1 ends when the user confirms the NAICS list. Stage 2 (firmographic query: geo + headcount + these NAICS codes, revenue pruned from results) starts only after that confirmation.
