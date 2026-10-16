# Core Installer execution ledger

Scope: Alpha 1 from the supplied Oh My Core design. Node.js + TypeScript,
static registry, three contracts, resolver, local installer, native instructions,
doctor/verify/rollback, and eight original bundled Skills.

- [x] Read the main PRD, five linked specifications and supplied Core design.
- [x] Verify Node tooling and research current upstream boundaries.
- [x] Implement contracts and registry with version/capability resolution.
- [x] Implement auditable local installation, diagnostics and rollback CLI.
- [x] Add original Core Skills and explicit native import instructions.
- [x] Run compiler, lint, contract/filesystem checks and actual CLI scenarios.
- [x] Record observed outcomes and remaining external integration gates.

External gates: no Feishu credentials or authenticated Grok Bot test environment
have been provided. Generic Feishu-to-Grok-Bot webhook support is unverified;
the Grok Automations endpoint is not evidence of Grok Bot compatibility.
Project licensing remains an owner decision. The repository is private and
UNLICENSED; no public release or third-party redistribution is authorized here.

## Observed verification (2026-10-14)

- Node 22.14.0 on native Windows; pnpm 11.7.0.
- `pnpm typecheck`, `pnpm check`, `pnpm build`, `pnpm schemas`: passed.
- `pnpm test`: 29 passing checks across five files, including actual child-process CLI execution.
- Official npm production audit: zero reported vulnerabilities in the installed production dependency graph.
- `core-cli.json`: actual discover/inspect/plan/dry-run/apply/reapply/verify/doctor/rollback scenario.
- `final-cli.json`: final-source lockfile/apply/verify/rollback recheck; nine files verified.
- Filesystem checks include Windows junction rejection, workspace locking, no-overwrite conflicts, unverified-resource refusal and preservation of user edits.
- No source file exceeds 250 pure LOC. CLI is in the warning band at 233; extract command registrations before adding more commands.
- Architectural self-review: domain modules have separate ownership, external data is parsed at boundaries, delivery matching is exhaustive, no any/type assertions/non-null escapes, no speculative service abstractions.

## Tool limitations and next-layer gates

LSP diagnostics timed out at the daemon; no clean LSP result is claimed. Compiler diagnostics are clean. The optional skill audit helper uses TypeScript 7 unstable API subpaths and cannot run against the pinned TypeScript 5.9 compiler; module measurements and Biome/tsc checks were used instead.

CI configuration is checked in but has not run on GitHub in this session. Only native Windows execution was observed locally; Ubuntu remains a configured CI target.

Gateway, SQLite task persistence, Result MCP, enforcing approval service, Outbox and Guardian are not part of Alpha 1. Only their foundational task/evidence/capability contracts are present. A real Feishu/Grok Bot account experiment and independent Pack validation remain required.
