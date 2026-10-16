---
name: failure-recovery
description: Diagnose failures, reconcile partial effects and retry a safe bounded step.
license: MIT; see NOTICE.md and licenses/
compatibility: Native agent host with permitted tools. Oh My CLI is optional; native import and account verification are required.
metadata:
  author: oh-my-grokbot
  version: "0.2.0"
  verification: reviewed
---

# failure-recovery
Use for failed tasks or uncertain external outcomes. Input: expected/actual result, last verified checkpoint, sanitized error and action/task/run references.

1. Preserve evidence and inspect the failed boundary. Reproduce with a minimal permitted read-only case. Compare inputs, environment, authentication and data shape before changing code.
2. State one causal hypothesis and test it. Separate invalid input, missing credentials, forbidden scope, rate limits, transport failure and malformed responses. Avoid speculative bundles of fixes.
3. Reconcile partial effects before retry. For a timed-out write, query the remote receipt/action identifier first. An uncertain result does not prove nothing happened; never blindly republish.
4. Retry only an idempotent authorized step within its budget. Respect Retry-After. Do not loop on 401/403 or switch to cookies, private APIs or another account.
5. Resume at the verified checkpoint. Roll back only owned reversible changes and preserve user edits. If reconciliation is unavailable, mark needs_human and provide the missing evidence.

Output: category, tested cause, observed effects, recovery decision, evidence and next step. Example: a publish timeout requires checking whether the post exists before any repeat attempt.

See [NOTICE.md](NOTICE.md) for pinned upstream sources and adaptation notes.
