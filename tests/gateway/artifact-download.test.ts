import { afterEach, beforeEach, expect, it } from "vitest";
import { createGatewayApp } from "../../src/gateway/app.js";
import { createTaskSchema } from "../../src/gateway/contracts.js";
import { hash } from "../../src/io.js";
import { fixture, owner, token } from "./helpers.js";

let f: Awaited<ReturnType<typeof fixture>>;
beforeEach(async () => {
  f = await fixture();
});
afterEach(async () => {
  await f.cleanup();
});
it("returns submitted artifact bytes only to an identity with access to that task", async () => {
  const { record } = f.gateway.create(
    owner,
    createTaskSchema.parse({ eventId: "e", objective: "report" }),
  );
  const claimed = f.gateway.tasks.claim(owner, record.task.taskId);
  const runner = f.gateway.access.authenticate(`Bearer ${claimed.credential}`);
  const artifact = await f.gateway.artifacts.submit(runner, {
    taskId: record.task.taskId,
    runId: record.task.runId,
    name: "report.md",
    content: "review me",
    sha256: hash("review me"),
  });
  const response = await createGatewayApp(f.gateway).request(
    `http://localhost/v1/tasks/${record.task.taskId}/artifacts/${artifact.id}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({
    content: "review me",
    artifact: { sha256: hash("review me") },
  });
});
