import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTaskSchema } from "../../src/gateway/contracts.js";
import { Gateway } from "../../src/gateway/service.js";
import { hash } from "../../src/io.js";
import { fixture, owner, reviewer } from "./helpers.js";

let f: Awaited<ReturnType<typeof fixture>>;
beforeEach(async () => {
  f = await fixture();
});
afterEach(async () => {
  await f.cleanup();
});
async function running(eventId = "e", assignedRole = "chief-of-staff") {
  const { record } = f.gateway.create(
    owner,
    createTaskSchema.parse({ eventId, objective: "research", assignedRole }),
  );
  const claim = f.gateway.tasks.claim(owner, record.task.taskId);
  const identity = f.gateway.access.authenticate(`Bearer ${claim.credential}`);
  const input = {
    taskId: record.task.taskId,
    runId: record.task.runId,
    name: "report.md",
    content: "evidence",
    sha256: hash("evidence"),
  };
  const artifact = await f.gateway.artifacts.submit(identity, input);
  return { record, claim, identity, input, artifact };
}
describe("Task evidence and durable execution boundaries", () => {
  it("keeps completion in verifying until an independent identity accepts it", async () => {
    const r = await running();
    const result = f.gateway.lifecycle.complete(r.identity, {
      taskId: r.record.task.taskId,
      runId: r.record.task.runId,
      artifactIds: [r.artifact.id],
    });
    expect(result.task.state).toBe("verifying");
    expect(f.gateway.outbox.list(owner)).toHaveLength(0);
    await expect(
      f.gateway.lifecycle.review(r.identity, r.record.task.taskId, "accepted", "ok"),
    ).rejects.toMatchObject({ code: "ROLE_DENIED" });
  });
  it("rejects drifted artifact bytes at independent acceptance", async () => {
    const r = await running();
    f.gateway.lifecycle.complete(r.identity, {
      taskId: r.record.task.taskId,
      runId: r.record.task.runId,
      artifactIds: [r.artifact.id],
    });
    await writeFile(join(f.root, "artifacts", r.artifact.path), "tampered");
    await expect(
      f.gateway.lifecycle.review(reviewer, r.record.task.taskId, "accepted", "reviewed"),
    ).rejects.toMatchObject({ code: "ARTIFACT_DRIFT" });
    expect(f.gateway.tasks.get(owner, r.record.task.taskId).task.state).toBe("verifying");
  });
  it("scopes runner credentials to one task and expires them", async () => {
    const a = await running("a"),
      b = await running("b");
    expect(() =>
      f.gateway.tasks.runner(a.identity, b.record.task.taskId, b.record.task.runId),
    ).toThrowError(expect.objectContaining({ code: "SCOPE_DENIED" }));
    f.advance(3_600_001);
    expect(() => f.gateway.access.authenticate(`Bearer ${a.claim.credential}`)).toThrowError(
      expect.objectContaining({ code: "UNAUTHORIZED" }),
    );
  });
  it("stores credential hashes rather than bearer tokens", async () => {
    const r = await running();
    const row = f.gateway.ledger.get(
      "SELECT digest FROM credentials WHERE task=?",
      r.record.task.taskId,
    );
    const { digest } = row ?? {};
    expect(digest).toBe(hash(r.claim.credential));
    expect((await readFile(f.options.database)).includes(Buffer.from(r.claim.credential))).toBe(
      false,
    );
  });
  it("preserves the same logical task across database reopen", async () => {
    const r = await running();
    f.gateway.close();
    const reopened = new Gateway(f.options);
    expect(reopened.tasks.get(owner, r.record.task.taskId).task.runId).toBe(r.record.task.runId);
    reopened.close();
  });
  it("rejects incorrect upload hashes without creating an artifact", async () => {
    const r = await running();
    await expect(
      f.gateway.artifacts.submit(r.identity, {
        ...r.input,
        name: "wrong.md",
        sha256: "0".repeat(64),
      }),
    ).rejects.toMatchObject({ code: "ARTIFACT_HASH" });
    expect(f.gateway.artifacts.list(owner, r.record.task.taskId)).toHaveLength(1);
  });
});

it("rejects a static reviewer whose identity matches the assigned runner", async () => {
  const r = await running("collision", "owner");
  f.gateway.lifecycle.complete(r.identity, {
    taskId: r.record.task.taskId,
    runId: r.record.task.runId,
    artifactIds: [r.artifact.id],
  });
  await expect(
    f.gateway.lifecycle.review(owner, r.record.task.taskId, "accepted", "self"),
  ).rejects.toMatchObject({ code: "SELF_REVIEW" });
  expect(
    (await f.gateway.lifecycle.review(reviewer, r.record.task.taskId, "accepted", "checked")).task
      .state,
  ).toBe("succeeded");
});
