---
name: routine-design
description: Design a bounded native routine with explicit timezone, overlap and recovery rules.
license: MIT; see NOTICE.md and licenses/
compatibility: Native agent host with permitted tools. Oh My CLI is optional; native import and account verification are required.
metadata:
  author: oh-my-grokbot
  version: "0.2.0"
  verification: reviewed
---

# routine-design
Use when the user requests recurring work. Input: objective, cadence, timezone, start/end, authorized resources, budget and notification preference.

1. Resolve the user's local time to an explicit IANA timezone; state DST behavior. Record a concrete schedule, expiry/end condition, run timeout and per-run budget. Do not assume GitHub Actions cron semantics apply to Grok Routines.
2. Define input freshness, deduplication key, output/evidence location, one active run at a time and overlap policy. A missed run should not produce an uncontrolled catch-up burst.
3. Prepare the native Routine configuration only through available supported UI/tools. If scheduling is unavailable, provide the exact configuration and mark needs_human; never claim the routine is active without a receipt.
4. Keep external writes behind the same scoped authorization as an interactive run. A read-only monitoring request does not authorize scheduled posts. Separate draft creation from publishing.
5. Define failure backoff, reconciliation and a stop condition. Keep unchanged monitoring quiet unless the user asks for periodic reports. Validate one representative run and cancellation path.

Output: routine proposal, timezone and next-run examples, resource/budget bounds, actual scheduler state, smoke evidence and disable procedure. Do not deploy a second scheduling engine just to mimic the native host.

See [NOTICE.md](NOTICE.md) for pinned upstream sources and adaptation notes.
