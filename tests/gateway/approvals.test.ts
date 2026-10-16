import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, expect, it } from "vitest";
import { createTaskSchema } from "../../src/gateway/contracts.js";
import { fixture, owner } from "./helpers.js";

let f: Awaited<ReturnType<typeof fixture>>;
beforeEach(async () => {
  f = await fixture();
});
afterEach(async () => {
  await f.cleanup();
});
function proposal(assignedRole = "chief-of-staff") {
  const { record } = f.gateway.create(
    owner,
    createTaskSchema.parse({ eventId: "e", objective: "draft", assignedRole }),
  );
  const claim = f.gateway.tasks.claim(owner, record.task.taskId),
    runner = f.gateway.access.authenticate(`Bearer ${claim.credential}`);
  const input = {
    taskId: record.task.taskId,
    runId: record.task.runId,
    approvalId: randomUUID(),
    operation: "social-publish" as const,
    destination: "account-a",
    payload: "exact post",
    expiresAt: "2026-10-15T08:10:00Z",
  };
  return { record, runner, input, approval: f.gateway.approvals.request(runner, input) };
}
it("rejects a decision whose hash does not match the exact proposal", () => {
  const p = proposal();
  expect(() =>
    f.gateway.approvals.decide(owner, p.approval.approvalId, "approved", "0".repeat(64)),
  ).toThrowError(expect.objectContaining({ code: "APPROVAL_HASH" }));
});
it("does not approve an expired proposal", () => {
  const p = proposal();
  f.advance(600001);
  expect(
    f.gateway.approvals.decide(owner, p.approval.approvalId, "approved", p.approval.payloadHash)
      .state,
  ).toBe("expired");
  expect(f.gateway.tasks.get(owner, p.record.task.taskId).task.state).toBe("needs_human");
});
it("does not allow a runner to approve its own proposal", () => {
  const p = proposal();
  expect(() =>
    f.gateway.approvals.decide(p.runner, p.approval.approvalId, "approved", p.approval.payloadHash),
  ).toThrowError(expect.objectContaining({ code: "ROLE_DENIED" }));
});
it("rejects changing the target under an existing approval identifier", () => {
  const p = proposal();
  expect(() =>
    f.gateway.approvals.request(p.runner, { ...p.input, destination: "another-account" }),
  ).toThrowError(expect.objectContaining({ code: "APPROVAL_CONFLICT" }));
});

it("rejects a static approver whose identity matches the assigned runner", () => {
  const p = proposal("owner");
  expect(() =>
    f.gateway.approvals.decide(owner, p.approval.approvalId, "approved", p.approval.payloadHash),
  ).toThrowError(expect.objectContaining({ code: "SELF_APPROVAL" }));
});
