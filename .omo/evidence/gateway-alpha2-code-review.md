# Gateway Alpha2 code review

Scope reviewed: `src/gateway/*.ts` and `tests/gateway/*.test.ts`, with the
Alpha2 boundaries requested for tenant and task credentials, artifacts,
approvals, outbox durability, and service lifecycle.

## Skill-perspective check

I read the `programming` and `remove-ai-slops` skill instructions before this
review. The TypeScript code uses typed Zod boundaries and has no `any`, cast,
or suppression escape hatch in the reviewed files. The tests exercise real
SQLite, HTTP, and the MCP SDK, so they are not prompt tests or simple constant
mirrors. I found no deletion-only or tautological tests. The service split is
within the 250 pure-LOC ceiling and the abstractions have distinct persistence,
authorization, transport, and lifecycle responsibilities.

The diff violates the programming perspective at one authorization boundary:
the claimed independent-review and approval boundary is not encoded in the
authorization decision. It also leaves one reliability path incomplete.

## Findings

### CRITICAL

None.

### HIGH

1. **A configured operator can approve its own runner's completion or external-action proposal.**

   `src/gateway/tasks.ts:73` copies caller-controlled `assignedRole` into the
   task; `claim()` then writes that value as the minted runner credential's
   actor at `src/gateway/tasks.ts:145`. `Lifecycle.review()` only checks that
   the caller has the `operator` or `verifier` role (`src/gateway/lifecycle.ts:75-77`),
   and `Approvals.decide()` only checks for `operator`
   (`src/gateway/approvals.ts:77-84`). Consequently, an operator may create a
   task with `assignedRole` equal to its configured principal id, claim it,
   produce artifacts/request an approval through the runner credential, then
   accept/approve it through its static operator credential. The current tests
   only reject a *runner-typed* token and therefore miss this identity
   collision despite describing the review as independent.

   Minimal fix: after loading the task record, reject review and approval
   decisions when `identity.id === record.task.assignedRole` (or model a
   separate immutable runner-principal id and compare that). Add two focused
   tests that create a task with `assignedRole: "owner"`, then prove owner is
   refused for both review and approval decision while another configured
   reviewer/operator remains accepted.

### MEDIUM

1. **A non-`Error` sender rejection leaves an outbox item permanently
   `sending` until a process restart.**

   In `src/gateway/outbox.ts:70-79`, `dispatch()` rethrows any rejection that
   is not an `Error`. The claim has already been persisted as `sending`, and
   the normal human-reconciliation endpoint accepts only `needs_human`
   (`src/gateway/outbox.ts:82-94`). `recoverDeliveries()` only repairs this on
   next gateway startup (`src/gateway/database.ts:49-53`). A sender is an
   injected async boundary, so rejected values are untrusted and cannot safely
   be assumed to be `Error` instances.

   Minimal fix: make the catch transition every sender failure to
   `needs_human`; log/sanitize the unknown value only at the outer boundary.
   Add one test whose sender rejects a string and assert the item is immediately
   reconcilable without restart.

2. **Shutdown can strand the exclusive lock and open resources if a later
   shutdown operation fails.**

   `src/gateway/server.ts:87-97` performs close steps serially without a
   `finally`. If `server.close()` or `channel.close()` rejects, it never closes
   the ledger/file handle nor unlinks `service.lock`; subsequent startup is
   rejected as `GATEWAY_LOCKED`. This is specifically harmful to the durable
   service lifecycle the exclusive lock is intended to protect.

   Minimal fix: make `close()` idempotent and ensure gateway, lock handle, and
   lock-path cleanup occur in a `finally`, preserving the first close error for
   the caller. Add a narrow fake/controlled close-failure test or factor the
   cleanup seam so the lock-release guarantee is testable.

### LOW

1. **Artifact verification has a filesystem time-of-check/time-of-use gap.**

   `Lifecycle.review()` hashes evidence before opening the ledger transaction
   (`src/gateway/lifecycle.ts:80-86`), then marks it verified later
   (`src/gateway/lifecycle.ts:93-108`). `Artifacts.read()` similarly hashes
   before a separate read (`src/gateway/artifacts.ts:96-100`). An actor with
   direct access to the shared gateway filesystem can replace bytes between
   these operations and have changed bytes labeled verified or returned. The
   runner API cannot do this after `verifying`, so this is lower severity for
   the current local deployment, but it conflicts with the shared-host threat
   model.

   Recommended follow-up: treat the artifact store as gateway-private in
   deployment and, before production multi-tenant use, use immutable content
   addressed objects or return verified bytes from one opened file descriptor.

## Test relevance and coverage

The 22 gateway tests are meaningful behavioral coverage: HTTP authorization,
credential scope/expiry, evidence drift, approval hash/expiry, durable outbox
behavior, TCP MCP operation, and lock release are all exercised. Missing
coverage is specific to the three findings above, especially the static-role /
runner-role identity collision.

## Verdict

- `codeQualityStatus`: **BLOCK**
- `recommendation`: **REQUEST_CHANGES**
- `blockers`: fix the self-review/self-approval authorization collision before
  presenting Alpha2's independent review and approval boundaries as complete.

## Re-review after remediation

Reviewed the final changes requested after the initial review.

- `Lifecycle.review()` now rejects a configured operator/verifier whose id
  matches `assignedRole` (`src/gateway/lifecycle.ts:75-80`), and
  `Approvals.decide()` applies the matching rule
  (`src/gateway/approvals.ts:98-101`). The added collision tests prove that a
  static `owner` cannot accept or approve a task it was assigned to execute,
  while a different configured reviewer can accept the completion.
- `Outbox.dispatch()` transitions every rejected sender result, including a
  non-`Error` rejection, to `needs_human` (`src/gateway/outbox.ts:66-78`). The
  added test proves immediate reconciliation is available.
- `startGateway()` now memoizes shutdown and invokes every cleanup action even
  if an earlier one fails (`src/gateway/server.ts:84-135`). The tests cover
  repeated close and recovery from an already-closed HTTP server.
- Artifact download now returns the same buffer that was hashed
  (`src/gateway/artifacts.ts:96-108`).

I independently ran `pnpm vitest run tests/gateway`: 7 files and 26 tests
passed. The prior red-run artifact records the expected regressions before
these changes.

The HIGH and MEDIUM findings are resolved. The remaining filesystem
time-of-check limitation is only relevant to a party with direct access to the
gateway's private filesystem; it is documented as a deployment constraint,
not an Alpha2 gateway-API blocker. Separately, an operator remains a trusted
administrator that can mint runner credentials. Distinct token roles enforce
the gateway's credential/identity boundary, but they do not prove two
different humans or provide OS-level isolation on a shared host.

### Re-review verdict

- `codeQualityStatus`: **CLEAR**
- `recommendation`: **APPROVE**
- `blockers`: none within the reviewed Alpha2 scope.
