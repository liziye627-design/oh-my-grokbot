---
name: capability-selection
description: Select a reviewed capability by task modality, source, license, permissions and native fit.
license: MIT; see NOTICE.md and licenses/
compatibility: Native agent host with permitted tools. Oh My CLI is optional; native import and account verification are required.
metadata:
  author: oh-my-grokbot
  version: "0.2.1"
  verification: reviewed
---

# capability-selection
Use before adding a Skill, SDK, MCP or connector. Input: task, host, required read/write operations and authorized accounts.

1. Inspect the native host's existing tools first. Query the project registry with ohmy search and inspect the selected resource with ohmy inspect. Native capabilities take precedence when they satisfy the task.
2. If missing, search specific GitHub concepts. Read the implementation and license at an immutable commit. Evaluate ownership, maintenance, permission surface, transport, actual task fit and compatibility. Stars are discovery signals, not proof of safety or correctness.
3. Name the task modality: text, image, audio, or code. Within one implementation kind, prefer a reviewed capability that declares that modality over a newer one that does not. Native still precedes CLI/SDK, Skill, MCP, and adapter. A lower-trust connector does not replace a native tool just because it names the modality.
4. If the selected capability does not declare the modality, do not treat it as the best backend. Stop at needs_human and name the missing reviewed connector. A third-party model name is not a selection unless the catalog already has a reviewed entry for it.
5. Distinguish a method Skill from an executable connector. Missing or unclear redistribution terms mean reference only. Record source revision, license, required credentials, install path, the modality, the rejected default, and the acceptance check. Use the trusted local catalog and lockfile; do not run an upstream install script or globally install from an unreviewed README.
6. Validate local packaging separately from native execution. A reviewed candidate remains unverified until an account-level smoke test passes.

Output: selected capability and reason, alternatives rejected with reasons, permissions, provenance, verification state and installation plan reference.

See [NOTICE.md](NOTICE.md) for pinned upstream sources and adaptation notes.
