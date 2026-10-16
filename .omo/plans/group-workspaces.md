# Group workspace ecosystem

Goal: reusable four-industry group workspaces with members, native Bot bindings,
workflow intake, evidence review and origin-bound reply. Native Bot group chats
(2–6 Bots) and multi-human Team Bot access are distinct documented surfaces.

- [x] Contracts, member/tenant validation and native group plan (industry_engine).
- [x] Authenticated HTTP / normalized Feishu routing (industry_gateway).
- [x] Gateway/CLI/schema integration and four example workspaces (root).
- [x] Real local HTTP/MCP multi-human group acceptance (industry_acceptance).
- [x] Documentation, review and full regression (root).

Boundary: each workspace owns one distinct Gateway tenant. Users who participate
in two groups use distinct scoped principals. Config is trusted operator-owned,
not a public self-enrollment API. Native group creation, Team Bot publishing,
connector consent and actual account tests require observed target state.
No credentials in group kickoff messages, and no fabricated native creation receipt.

Latest steering: upload a self-contained bootstrap document and let native Bot create the roster. Public bulk-create/group API is unverified. Generate upload artifacts and require real native creation receipts; do not request pre-existing Bot names.

Local completion:139 tests/27 files, typecheck, Biome, schema export and pinned upstream verification passed. Four upload bundles generated and parsed. Native creation/upload remains blocked: this session has no native app control and no verified public bulk-creation interface. Account activation is unverified.
