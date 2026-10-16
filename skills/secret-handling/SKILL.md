---
name: secret-handling
description: Use scoped credential references without leaking credentials into prompts or evidence.
license: MIT; see NOTICE.md and licenses/
compatibility: Native agent host with permitted tools. Oh My CLI is optional; native import and account verification are required.
metadata:
  author: oh-my-grokbot
  version: "0.2.0"
  verification: reviewed
---

# secret-handling
Use when a connector needs authentication. Input: platform, trusted endpoint, required scope and credential reference name. Never ask a user to paste a token into task text.

1. Prefer the native host's credential store; otherwise use the documented environment variable supplied out of band. The CLI accepts variable names, not token values. Public Bluesky reads need no token.
2. Confirm platform/account identity and minimum read scope. Token possession is not permission to publish. Keep write credentials away from drafting/research tools; the Alpha social adapters expose no write operation.
3. Send a credential only to the configured official endpoint (Mastodon: fixed mastodon.social instance in this Alpha). Refuse redirects rather than forward authorization to another origin. Never copy browser cookies or extract hidden account credentials.
4. Log variable names and sanitized error categories, not headers, raw error bodies, query strings carrying keys or token values. Do not store secrets in artifacts, Git, Skills, lockfiles or handoff messages.
5. On 401/403, stop with the missing/expired scope or account gate. On suspected exposure, tell the owner which reference needs revocation/rotation without repeating the value. Scope changes require reauthorization.

Output: platform, account identity when actually verified, secret reference name, required scope, check result and next account step. Text-only redaction rules do not replace runtime isolation.

See [NOTICE.md](NOTICE.md) for pinned upstream sources and adaptation notes.
