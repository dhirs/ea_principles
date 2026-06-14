# July 2 Workshop — Use Case: Governed Prompt Caching (Skepticism Register)

**Part 1 use case · Failure category: Cost**
**Maps to:** GENCOST03-BP03 → GC3B3-01 (cache the static prompt prefix to cut token cost — governed,
not ad-hoc)

> Same template as the grounding and harness registers. Three objections, each captured as **The
> concern · What should be fixed · If central control is dropped because the fix is hard.** Every
> objection argues for fixing the process, not abandoning the control. Siblings: `legal_grounding.md`,
> `ce_harness.md`.
>
> **What the standard is:** every model call re-sends a big unchanging block — system prompt, tool
> definitions, few-shot examples (often thousands of tokens). You pay full input-token price to
> reprocess that same block on every call. Prompt caching tells the provider "this prefix is stable,
> reuse it" so the static part bills at a fraction. The standard: **declare the cacheable static prefix
> of each reused prompt, and gate that cache-eligible prompts are actually cached and the prefix is
> correctly bounded** — so the saving is real and stays real, instead of one dev's flag nobody owns.
>
> **Scenario recap:** a customer-support agent (~12,000 conversations/day) carries ~8k tokens of static
> context — system prompt, tool defs, few-shot examples — re-sent on every turn. A dev enabled prompt
> caching: marked the static prefix cacheable so it bills at a fraction instead of full price. Input-
> token spend dropped ~50%; the cost dashboard went green; everyone moved on. Weeks later someone added
> a per-request value — a timestamp, a session id — near the *top* of the prompt, above the cache
> breakpoint. Now the "static" prefix was different on every call, so the cache stopped matching: hit
> rate fell to near zero and input-token spend silently climbed back to full price. CI was green. The
> agent still worked. Nobody noticed until the quarterly bill, because nobody owned the prompt's
> structure or watched the cache-hit rate. The cache was a one-line flag, set by one person, owned by no
> one, enforced by nothing. Fix: govern it — own the prefix contract, gate it, watch the hit rate.

---

## Challenge 1 — "The 'static' prefix isn't static, and the saving silently evaporates"

### The concern
"Prompt caching only pays off if the prefix is *byte-identical* call to call. And the cache is
invisible: when it hits I save, when it misses I just pay full price — same output, no error, nothing
red. So the day anyone drops a moving value above the breakpoint — a timestamp, a user id, a reordered
tool list — the prefix changes every call and my hit rate craters. I won't see it. The agent works fine.
The *only* signal is the bill, and Finance sees that a quarter later. You're telling me to govern a
saving that can quietly turn itself off and look exactly the same while it does. Who keeps the prefix
actually static, and who notices when caching stops paying?"

### What should be fixed
The concern is real and it's about **ownership of the prefix boundary and measurement of the hit rate**,
not the cache itself. The control has **two layers** — a pre-merge gate that catches the leak when the
code is written, and a runtime monitor that catches what the gate can't see. You need both.

**Layer 1 — the CI gate (pre-merge, structural).** Each project declares its prompt as a separated
yaml, and a lint runs on every PR:

```yaml
# prompt.yaml
cache:
  static_prefix_tokens: 3000   # declared size of the cacheable block
  no_cache: false              # explicit cache decision
static: |
  You are a support agent for ACME...
  [tool definitions, few-shot examples]   # never changes
dynamic: |
  Customer question: {{ user_question }}  # varies every call
```

The gate checks, in order:

1. **Structure exists** — the prompt is split into separate `static` and `dynamic` fields, not one
   merged blob. You can't cache what isn't separated, so a single-string prompt fails.
2. **No dynamic content in the static block** — *this is the check that catches the timestamp failure.*
   The lint scans `static` for interpolation markers and per-request calls (`{{ }}` placeholders,
   f-string vars, `datetime.now()`, session ids). If anything that varies per request sits in `static`,
   the build fails at the PR — before it ever ships.
3. **Eligibility honoured** — if the static block is ≥1024 tokens and `no_cache: false`, it must be
   cache-eligible; if it's a low-frequency caller, `no_cache: true` must be set *explicitly*, not left
   ambiguous. Forces a deliberate decision instead of an accidental default.
4. **Declared size matches actual** — the gate re-tokenises `static` and confirms it matches
   `static_prefix_tokens`; drift makes the declaration a lie and fails the build.

So a PR that does this gets a red build:

```diff
  static: |
+   Current time: {{ now }}
    You are a support agent for ACME...
```
```
✗ cache-contract: dynamic interpolation '{{ now }}' found in static block.
  Per-request values must go in `dynamic`. This would break the cache prefix on every call.
```

**Layer 2 — the runtime monitor (observability).** The gate is structural and can't see production, so
**cache-hit rate and input-token spend are monitored and owned per project** (read `cached_tokens` on
OpenAI, `cache_read_input_tokens` on Anthropic). A collapsed hit rate pages an owner rather than
surfacing on the invoice three months later.

The flag and the TTL aren't the control; the **pre-merge gate plus the watched hit rate, both owned**,
are — one stops the obvious leak when code is written, the other catches the drift that slips past it.

### If central control is dropped because the fix is hard
Wiring a prefix contract and hit-rate monitoring is ongoing work, so the tempting move is "flip the flag
and move on." Then prefixes drift the first time someone edits the prompt, caching silently dies, and
you're paying full price behind a green dashboard — cheap-looking and expensive-actually look identical
on a spend chart until the quarter closes. You didn't save money; you bought a saving that quietly
expired and left no mark.

---

## Challenge 2 — "It's a one-line flag — why a whole team?"

### The concern
"Enabling prompt caching is *one parameter* on the message — mark the prefix, done. This is twenty-year-
old caching with a new label. You cannot tell me a *team* and an *ARB* need to stand behind a flag. What
is the central standard even standardising — that the flag should be true? That's a one-line memo. The
prompt is mine, the traffic is mine, the flag is mine. Why is this governance and not a checkbox?"

### What should be fixed
Standardise the **interface — not the flag.** The whole standard reduces to one rule: *every project
submits the static part and the dynamic part as separate fields to the central gateway.* That's it.
Trivial to state — and that's the point. Its value is that it's **uniform**: because every project does
it the same way, the gateway can guarantee dynamic data never lands in the cached prefix automatically
for everyone (not project-by-project goodwill), and "did you do it?" becomes a **single checkable
question across all fifty projects** instead of fifty homebrew conventions.

That uniformity is what makes it *central* rather than a memo, and it's what makes it **auditable**. For
a regulated business, "a developer says he structured the prompt correctly" is worthless evidence; "the
gateway log shows every call went through the controlled static/dynamic assembly path, and the CI gate
(see Challenge 1) blocks any PR that violates the split" is an actual control an auditor accepts. The
flag is the easy 1%; the fleet-wide, uniform, verifiable contract is the 99% a memo can't deliver —
because a memo doesn't fail the build, and it doesn't produce evidence.

### If central control is dropped because the fix is hard
Writing and enforcing an assembly contract is real work, so the tempting move is "it's just a flag, let
teams set it." Then every team invents its own prompt structure, and the breakpoint is exactly the thing
non-experts get wrong — they freeze the volatile part and leave the stable part live, and the cache
saves nothing while reporting success. "Set the flag" with no structure contract isn't a light version
of the control; it's the silent zero-hit incident waiting to recur, team by team, with nobody verifying
the one detail that makes caching pay.

---

## Challenge 3 — "Freeze more to save more, and you freeze the wrong thing"

### The concern
"To squeeze the most out of this I want as much as possible inside the cached prefix — the bigger the
frozen block, the more I save per call. But the more I freeze, the more I risk freezing something that
*should* move: a policy line, a tool definition, an instruction that changed. Now I'm feeding the model
a stale frozen instruction for the whole cache lifetime — cheap and wrong. Or I mis-declare how big the
prefix is and the cache silently doesn't engage at all. Cache tight and safe, I save almost nothing.
Cache aggressive and cheap, I risk correctness. Either the control doesn't pay for itself, or it freezes
the wrong thing. So which is it?"

### What should be fixed
This is the cost-vs-correctness boundary, and the fix is **owning and measuring it** — enforced by the
same CI gate. The line between "stable — cache it" and "volatile — keep it live" is a decision someone
owns on evidence, not a dial anyone widens under cost pressure. Two of the gate's checks do the work
here: **(4) declared size matches actual** — the gate re-tokenises the `static` block and fails if it
no longer matches `static_prefix_tokens`, so "I thought it was cached" can't silently be false and a
quietly grown prefix can't drift uncosted; and **(2) no dynamic content in the static block** — which
also means content that *should* change (a policy line, a tool definition wired to live config) can't be
frozen into the prefix where it would serve stale for the whole cache lifetime. What's frozen is
declared, re-checked on every PR, and reviewed — not vibes — so you get the saving without freezing a
policy that changed last week.

### If central control is dropped because the fix is hard
Standing up the boundary review and the prefix-size gate is the most work of the three, so it's the
first thing dropped. Then the freeze-it-all-to-save dial gets turned by whoever's chasing the cost
number, with no one watching what got frozen; a changed policy keeps being served from a stale prefix,
or the prefix is mis-sized and saves nothing. Unowned, unmeasured, cross-cutting — the original failure
again. The saving you walked away to protect is the saving you lose first.

---

## The reframe (say this in the room)
Each objection is legitimate, and each argues for **fixing the implementation, not abandoning the
intent.** Silently evaporates → own the prefix boundary + watch the hit rate. "Just a flag" →
standardise the assembly contract, not the flag. Save-more-vs-freeze-wrong → own and measure the
boundary, gate the declared prefix size. Notice the shape: every objection is the *same* failure again —
a cross-cutting cost control (the cache) that nobody owns and nothing enforces. That is exactly the
failure that shipped the agent in the first place, repeated one level up — demo→production,
project→enterprise, flag→fleet. The cache didn't introduce a new kind of risk; it re-ran the old one.
Caving because the fix is difficult doesn't remove the friction, it removes the only thing standing
between a green cost dashboard and a bill that quietly doubled. The hard part *was* the value.

## Facilitator notes
- 10 min/challenge: set the scene (2) → drop the objection, let the room argue (5) → converge on the fix
  (2) → land the cost of dropping control (1). Three challenges = the 30-minute Cost use case.
- Run it live: show the ~50% saving and the green dashboard *first*, then reveal that a timestamp crept
  above the breakpoint and the saving silently evaporated — so the room feels "but it's saving us money"
  before they reach the fix. That pull is the lesson.
- Prompts: What's in your cached prefix today, and is anything per-request sitting above the breakpoint?
  Who would notice if your cache-hit rate fell to zero next week? Who owns where the breakpoint goes? Has
  anyone checked the declared prefix size against what's actually cached?
- Drive the thesis home at the end: ask the room to name *who owns the cache.* The usual answer — the dev
  who set the flag, who has since moved teams — is the whole point.
