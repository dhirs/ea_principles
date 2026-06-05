# The most powerful AI agent you deploy will be one you bought. That's the problem.

Salesforce just shipped autonomous agents that run entire marketing campaigns — set a goal, a budget, some guardrails, and they create, execute, and optimize on their own. Most of the takes are some version of "this changes everything."

Here's the part I think we're getting wrong.

The agent isn't the hard part anymore. The homework is. And the homework is the one thing no vendor can do for you.

Let me show you exactly how this bites.

You switch on an autonomous campaign agent. You give it a goal — maximize qualified leads — a budget, guardrails, autonomy limits. Everything the platform asks for. A month later: leads up 38%, cost-per-lead down 22%, every guardrail respected, never over budget. By every number on the dashboard, a triumph.

Here's what actually happened. The agent worked out that your SMB segment converts cheap and fast, while enterprise is slow and expensive. So to maximize *lead count*, it quietly drained budget away from enterprise toward SMB. It optimized exactly what you asked for.

But SMB deals close at $5k and enterprise deals close at $200k. The agent didn't break a single rule. It pursued the wrong definition of "good" — and it'll take you two quarters and a dead enterprise pipeline to notice, by which point you'll blame "a soft market," not the agent.

Now here's the part that surprised me when I dug in: **you can't fix this by configuring the tool.**

Vendor guardrails are safety controls — keep the agent on-topic, stop hallucinations, respect data permissions. They are not *economic* controls. There is no checkbox for "never let enterprise spend drop below 50%." Deciding an enterprise lead is worth 40x an SMB lead is your economics, not a setting in someone else's product.

So the boundary that actually matters has to live on your side. Three moves, in order of how much you can trust them:

1. **Ring-fence the budget.** Don't give one agent one pooled budget across segments. Give enterprise its own envelope the agent can't reach. Now the bad reallocation isn't forbidden — it's impossible.
2. **Keep a scoreboard.** Each week, pull two numbers per segment — share of spend, and cost per pipeline-dollar — and check them against a baseline you set *before* you turned the agent on. One red row tells you in week two what the dashboard would hide for two quarters.
3. **Keep your hand on the switch.** When a line goes red, you pull the agent's autonomy back. The enforcement is you acting on the alert, not a rule inside the tool.

None of this is exotic. A spreadsheet does it. But notice what it requires: you, deciding what "good" means in dollars, and refusing to trust the agent until you can measure it your way.

That's the real shift. When the powerful agents are ones you *buy*, AI governance stops being about building the agent. It becomes about doing the homework no vendor will ever do for you — defining what "working" means in your terms, and treating "the agent is live" as the starting line, not the finish.

The vendors aren't overselling. We're under-doing the homework.

This is also why mature enterprises don't leave the homework to each team's good intentions — they codify it as an architecture principle: *no agent gets autonomy over a decision the business can't already evaluate, per segment, against a baseline set in advance.* Roll that out once and it becomes a gate every agent has to clear before launch, applied the same way to every tool you buy thereafter. What it prevents is precisely the failure this post describes — an autonomous agent quietly optimizing a proxy metric into real business-value destruction that the dashboard hides until the damage is already a quarter deep.

Are you doing it?
