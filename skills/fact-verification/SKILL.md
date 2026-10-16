---
name: fact-verification
description: Check claims, numbers, dates and source conflicts before delivery.
license: Apache-2.0; see NOTICE.md and licenses/
compatibility: Native agent host with permitted tools. Oh My CLI is optional; native import and account verification are required.
metadata:
  author: oh-my-grokbot
  version: "0.2.0"
  verification: reviewed
---

# fact-verification
Use when an answer contains consequential facts or quantitative comparisons. Input: draft claims, source references, reporting period and definitions. If the evidence is missing, request the source or mark the claim unverified.

1. Split compound claims. Record each claim's source, scope, date and required confidence. Trace citations to the original evidence; two reposts of one announcement are one source.
2. For numbers, confirm units, denominator, population, timezone, sample size and missing data. Recompute a representative calculation independently using permitted deterministic tools. Compare equivalent windows and definitions.
3. Look for counterevidence and explanations for disagreement. An older product guide and a newer release note may describe different versions. Keep both dates visible rather than averaging incompatible statements.
4. Label each claim supported, contradicted or insufficient. Separate direct source statements from your inference. A successful HTTP call proves retrieval, not truth of a post.
5. Revise unsupported wording and rerun affected checks. Do not fabricate a citation or silently replace a metric with a convenient proxy.

Output a claim ledger with verdict, evidence reference, calculation where relevant, correction and remaining limitation. Example: 120 vs 100 is +20% only if both periods and populations are comparable. Report uncertainty when either is unknown.

See [NOTICE.md](NOTICE.md) for pinned upstream sources and adaptation notes.
