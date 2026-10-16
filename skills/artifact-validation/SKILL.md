---
name: artifact-validation
description: Validate a deliverable through its actual use surface before claiming completion.
license: MIT; see NOTICE.md and licenses/
compatibility: Native agent host with permitted tools. Oh My CLI is optional; native import and account verification are required.
metadata:
  author: oh-my-grokbot
  version: "0.2.0"
  verification: reviewed
---

# artifact-validation
Use before handing off a file, code change, report, connector result or installed capability. Input: artifact reference, intended use, acceptance checks and exact version/hash where available.

1. Map each acceptance claim to evidence. Choose the check that can prove it: parse/build for syntax, behavioral tests for logic, rendered preview for documents/UI, actual read-only request for connection, native host smoke task for Skill import.
2. Run the relevant check against the current artifact. Record command/tool, timestamp, exit/result, artifact version and evidence location. Old test output and a producer's success message do not validate new changes.
3. Read the result and inspect the deliverable. Check citations/links, file existence, expected output shape and the user-visible path. Distinguish local staging, native import, authorization and end-to-end execution.
4. Fix observed failures and repeat affected checks. If an account/tool is unavailable, mark that check needs_human or unsupported and state exactly what remains unobserved.
5. Report only the claims established by evidence. Lint does not prove execution; an installer file hash does not prove the Bot used the Skill.

Output: acceptance/check/result/evidence matrix and concise limitations. Example: all installed files match the plan, but native execution remains pending until an actual Bot task is observed.

See [NOTICE.md](NOTICE.md) for pinned upstream sources and adaptation notes.
