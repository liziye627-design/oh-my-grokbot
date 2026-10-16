---
name: cost-awareness
description: Bound searches, execution time and paid usage with observable budgets.
license: MIT; see NOTICE.md and licenses/
compatibility: Native agent host with permitted tools. Oh My CLI is optional; native import and account verification are required.
metadata:
  author: oh-my-grokbot
  version: "0.2.1"
  verification: reviewed
---

# cost-awareness
Use for research, API calls, repeated tasks and expensive tool execution. Input: required outcome, time/call/page limits and any user-approved monetary ceiling.

1. Prefer deterministic local checks where they answer the question. Reuse verified evidence within its freshness window and avoid duplicate requests.
2. Estimate calls/pages and identify possible paid endpoints before execution. If rates or account quotas are unavailable, record unknown; never invent a zero-cost claim or quote stale prices as current.
3. Set a finite call count, deadline and result limit. The bundled social search makes one request with no pagination or automatic retry. X can require fetching at least ten results even when fewer are returned locally.
4. Track actual available usage separately from estimates. Stop when sufficient evidence exists or the budget expires. For 429, record the retry time and resume only within the agreed budget.
5. Repeated workflows need a per-run cap, concurrency limit and end condition. Scheduling a task is not permission to increase spend indefinitely. Before a routine exists, write its weekly run count and whether an unchanged run still speaks. A routine on the main chat is priced apart from a quiet specialist. Stop a job that crosses a burn line chosen before the run.
6. Score one job for one dated window. Net minutes equal a timed baseline, minus minutes still spent, minus minutes reviewing output that should not have existed. Zero, negative, or a crisis on every line fails the window. Copy overflow only from an invoice the operator can open. Compare a usage percentage only with itself. Run history proves a run fired. Leave missing clocks unknown. Do not invent allowance dollars or a savings percentage, and retire the verdict when the next window starts.

Output: estimate and assumptions, observed calls/time/usage, remaining budget and next useful step. Platform billing dashboards remain the source of actual charges.

See [NOTICE.md](NOTICE.md) for pinned upstream sources and adaptation notes.
