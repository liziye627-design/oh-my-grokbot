---
name: social-publishing
description: Prepare platform-specific social drafts and an exact publication approval packet.
license: MIT; see NOTICE.md and licenses/
compatibility: Native agent host with permitted tools. Oh My CLI is optional; native import and account verification are required.
metadata:
  author: oh-my-grokbot
  version: "0.2.0"
  verification: reviewed
---

# social-publishing
Use to turn approved research or a user brief into social drafts. This Alpha prepares drafts only; live publishing is not implemented.

1. Confirm brand voice, audience, platform/account and objective from supplied context. Choose one clear point per post and preserve factual citations. Tailor format to the platform after checking current official length/media constraints; do not hardcode growth hacks or promise engagement.
2. Draft text, links, media references, alt text and optional thread order. Check claims, link destinations, attribution and visible previews. Reuse ideas with platform-specific presentation, without impersonation or fabricated experience.
3. Prepare a local publication packet containing destination identity, visibility, exact text and attachment hashes, intended time/timezone, evidence and required action. No write credentials are needed to draft.
4. Apply approval-protocol. Existing explicit authorization is scoped to its concrete action; any missing decision is requested against the finished preview. Content/target changes invalidate the previous packet binding.
5. Return needs_human for publication until the project has an enforcing write adapter and the user's account is authorized. Do not reinterpret this Skill or an approved draft as a working publish tool. If a future write times out, reconcile its external receipt before retrying.

Output: final drafts, reviewed media references, approval
 packet and observed publication state. Separate drafted, approved and published with actual evidence for each state.

See [NOTICE.md](NOTICE.md) for pinned upstream sources and adaptation notes.
