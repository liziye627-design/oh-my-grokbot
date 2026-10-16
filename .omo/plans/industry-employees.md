# Industry digital employees implementation

Scope from architecture attachment: X Growth, App Studio, Video Studio, Business Operations.
Native Grok Bot remains the execution host. This iteration delivers installable teams,
validated workflows, authenticated intake, native handoff and executable acceptance scenarios.
Account activation, connector credentials and a verified native trigger remain separate gates.

| Owner | Files | Deliverable | Status |
| --- | --- | --- | --- |
| x_growth | industries/x-growth/** | X research, drafting and analytics team | local acceptance passed |
| app_studio | industries/app-studio/** | Product, engineering and QA team | local acceptance passed |
| video_studio | industries/video-studio/** | Production and media validation team | local acceptance passed |
| business_operations | industries/business-operations/** | Operations, support and reporting team | local acceptance passed |
| industry_engine | src/industry/**, src/commands/industry.ts, tests/industry/** | Validated catalog, installation bundles, CLI handoff | local acceptance passed |
| industry_gateway | src/gateway/industry-routes.ts, tests/gateway/industry.test.ts | Authenticated workflow task intake | local acceptance passed |
| root | Shared entrypoints, schemas, docs, final integration | Integration and acceptance | local acceptance passed |

Acceptance: all four manifests resolve against frozen Core; invalid roles, missing inputs,
cyclic workflows and cross-tenant access are rejected; installation stages owned files and
rolls back safely; CLI and HTTP produce tasks with correct pack/role and durable handoff;
MCP completion stays verifying until independent review; no simulated external outcome is
reported as real execution. Every upstream reference remains reference-only unless licensed
and pinned separately. No credentials copied into templates.

## Final acceptance

104 tests in 23 files passed; strict typecheck, Biome, schema export and frozen upstream verification passed.
Four-pack compiled CLI + real HTTP/MCP smoke passed; see ../evidence/industry-smoke.json.
Reviewed and fixed Gateway semantic catalog validation and bounded handoff error mapping.
Live native trigger, actual industry business work and live Feishu are unverified account gates.
