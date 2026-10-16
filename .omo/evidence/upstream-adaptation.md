# Upstream Skills and social connectors

Completed 2026-10-14, local Windows / Node 22.14 / pnpm 11.7.

- [x] Search GitHub; compare source ownership, maintenance, license and host fit.
- [x] Read selected implementations and license texts; document rejected alternatives.
- [x] Download 19 original files from six repositories at immutable full revisions.
- [x] Adapt twelve Core Skills and two social methods, each with preserved licenses and notices.
- [x] Register nine social platform entries: four executable read adapters and five reference-only integrations. Prefer native Grok X read when resolving the social pack.
- [x] Verify provenance, contracts, installer, CLI and packaged distribution; record account/service gates below.

Deliverables: registry/catalog.json, registry/upstreams.lock.json, skills/,
third_party/upstreams/, src/connectors/, src/contracts/social.ts,
docs/upstream-adaptation.md, artifacts/oh-my-skills-0.2.0.zip and npm archive.
Source snapshots are untrusted reference documents; no upstream hooks/scripts run.
Unlicensed research candidates remain outside the distributable and Git.

## Local verification

- pnpm typecheck: passed.
- pnpm check: passed, no errors or infos on final source checks.
- pnpm verify:upstreams: six sources / fourteen adaptations passed.
- pnpm test: 9 files, 51 tests passed. Covers origins, read-only dispatch, credential gates, bounded requests, normalization, malformed data, HTTP errors, missing/modified licenses, floating revisions, unknown files, installer and CLI behavior.
- pnpm schemas: passed; 10 schemas exported.
- pnpm audit --prod --registry=https://registry.npmjs.org: no known vulnerabilities.
- Manual CLI: 13 scenarios recorded in social-manual-qa.json. Core has 12 Skills / 37 managed files; Social has 14 Skills / 45 managed files. Install, full file verification, same-plan idempotency, native preference and rollback preserving a test user file observed.
- Extracted npm archive: provenance passes for all original/adapted files. Production dependency installation exits 0; its own compiled CLI dry-run and social pack install dry-run both exit 0. pnpm emits a nonblocking Windows Vite dev-bin warning during prod resolution; Vite is not a runtime dependency of this CLI.
- npm pack excludes pnpm-lock.yaml by package-manager convention. Frozen installation instructions apply to the source checkout; extracted npm archive was tested with pnpm install --prod --ignore-scripts --no-frozen-lockfile.

## Runtime and account gates

- X/Mastodon/YouTube: credentials intentionally absent in manual CLI QA. Dry-run is observed; real authenticated results are not verified.
- Bluesky: actual public search GET returns HTTP403, Content-Type=text/html, Server=BunnyCDN-PB1-1430. Same host _health returns HTTP200 JSON. The search-access cause is undetermined; do not infer general network outage or that a token fixes it. No endpoint/account bypass attempted.
- Found and corrected overbroad HTTP403 classification: regression initially expected CONNECTOR_FORBIDDEN and received CONNECTOR_AUTH (1 failed, 6 passed). Minimal change makes all seven transport tests pass. Actual CLI now emits CONNECTOR_FORBIDDEN with exit1, rather than claiming connection success or demanding a public endpoint credential.
- Native Grok Skill import and behavioral acceptance require a real host/account. None marked Verified.
- Publishing, DMs, likes, follows, deletion and OAuth enrollment are not executable in this Alpha. Social publishing Skill prepares drafts/approval packets only. Write executors belong to the next Gateway/approval/outbox layer.
- Threads/Instagram/Facebook/LinkedIn/TikTok are reference-only catalog entries, not running integrations.

Temporary diagnosis used no source instrumentation, ports, proxies or background
processes. .debug-journal.md is removed after preserving the findings here.
