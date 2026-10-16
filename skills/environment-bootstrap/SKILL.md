---
name: environment-bootstrap
description: Stage a pinned capability pack locally and verify native host setup separately.
license: Apache-2.0; see NOTICE.md and licenses/
compatibility: Native agent host with permitted tools. Oh My CLI is optional; native import and account verification are required.
metadata:
  author: oh-my-grokbot
  version: "0.2.0"
  verification: reviewed
---

# environment-bootstrap
Use for preparing Oh My Core in a workspace. Input: trusted catalog, pack/version, workspace and native host. This adapts installer principles; upstream Codex paths and scripts are not Grok Bot interfaces.

1. Inspect the pack's source, license and requested permissions. Run ohmy plan <pack> --out <lockfile> and review exact versions, file hashes, references and human checks.
2. Run ohmy install <pack> --dry-run or apply the reviewed lockfile. Local changes require --yes. The development-only --allow-unverified flag permits reviewed resources and does not convert them to Verified.
3. Stage only inside the requested workspace's .ohmy directory. Existing owned files are checked; conflicting user files must not be overwritten. Do not install globally, execute downloaded hooks or copy account credentials.
4. Use ohmy status, ohmy verify <installation-id> and ohmy doctor. Read the generated .ohmy/recipes/<pack>/<provider>.md, import/bind Skills using the native UI if supported and perform one safe task.
5. Record local integrity and native execution separately. No native API is assumed. Rollback removes only unchanged files owned by the installation; remote accounts/resources require separate handling.

Output: lock and installation references, local checks, native smoke evidence, account gates and rollback instructions. A template cannot transfer the original account's computer or login.

See [NOTICE.md](NOTICE.md) for pinned upstream sources and adaptation notes.
