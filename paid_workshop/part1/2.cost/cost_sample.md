# Cost Sample — illustrative LLM spend estimate

> **Status:** rough Fermi estimate, to revisit. This is **not** based on any specific company — there is
> no public number behind it. It is built bottom-up from plausible assumptions for a large UK life &
> pensions insurer so we can flex the inputs later (ideally turn it into an adjustable spreadsheet
> model). Used in the Cost use case (`cost_caching.md`, GENCOST03-BP03 → GC3B3-01) to show the caching
> saving is a real share of a real bill, not a rounding error.

## Scale anchors (approximate — a large UK life & pensions insurer, illustrative)
- ~12M customers
- ~£280bn assets under administration
- ~7,500–10,000 staff
- Several consumer brands
- Heavily document- and contact-driven — a near-ideal GenAI footprint

## Pricing used (illustrative, GPT-4o-class — revisit, prices change)
- Input: ~$2.50 / 1M tokens
- Output: ~$10 / 1M tokens
- Reasoning models (o-series): roughly 5–10x the above

## Bottom-up, base case (moderate adoption)

| Use case | Annual volume | ~Tokens/call | Est. annual cost |
|---|---|---|---|
| Contact-centre agent assist (draft, summarise, classify, retrieve) | ~9M contacts × 60% AI-touched × ~4 calls ≈ 21.6M calls | ~5k in / 0.5k out | ~$380k |
| Document processing (claims, underwriting, correspondence) | ~3M docs × 2 calls ≈ 6M calls | ~8k in / 1k out | ~$180k |
| Internal staff knowledge assistant | ~3,200 active users × 10 q/day × 220 days ≈ 7M queries | ~4k in / 0.5k out | ~$105k |
| Developer coding assistants (if API-metered) | — | — | ~$75k |
| **Base total** | | | **~$0.7M/year** |

## Range
- **Conservative / pilots only:** ~$150k–$300k/year
- **Base (table above):** ~$0.7M/year
- **Aggressive (broad rollout, longer contexts, reasoning models for underwriting/complaints):** ~$3M–$8M/year

## Why this ties to the caching use case
Every call carries a big static prefix (system prompt + tool defs + retrieved policy/product context),
often 4–8k tokens, against a tiny variable question. **Input tokens dominate the bill.** Prompt caching
discounts exactly that static prefix by 50–90%. On a ~$1M bill where input is ~75–80% of cost, governed
caching plausibly shaves **25–45% — i.e. ~$250k–$450k/year.** That is a headcount, not a rounding error.
The silent cache-miss failure (a per-request value sneaking above the cache breakpoint) is precisely how
a company this size loses that saving without anyone noticing until the quarterly invoice.

## Assumptions to firm up on revisit
- Real contact volume and the AI-touched share
- Calls-per-interaction (agent step count)
- Actual token footprints (static prefix size is the key driver for the caching saving)
- Model mix (chat vs reasoning models — large cost multiplier)
- Whether dev tooling is API-metered or seat-licensed
- Build as a spreadsheet with assumptions as adjustable inputs
