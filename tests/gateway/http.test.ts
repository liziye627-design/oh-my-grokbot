import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";
import { createGatewayApp } from "../../src/gateway/app.js";
import { createTaskSchema, recordSchema } from "../../src/gateway/contracts.js";
import { fixture, owner, token } from "./helpers.js";

let f: Awaited<ReturnType<typeof fixture>>;
beforeEach(async () => {
  f = await fixture();
});
afterEach(async () => {
  await f.cleanup();
});
function request(path: string, secret = token, body?: object) {
  return createGatewayApp(f.gateway).request(`http://localhost${path}`, {
    method: body ? "POST" : "GET",
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}
describe("Gateway HTTP trust boundary", () => {
  it("persists a manual task once when the source event is replayed", async () => {
    const input = { eventId: "event-1", objective: "research sources" };
    const first = await request("/v1/tasks", token, input);
    const second = await request("/v1/tasks", token, input);
    const schema = z.object({ record: recordSchema, replayed: z.boolean() });
    const a = schema.parse(await first.json()),
      b = schema.parse(await second.json());
    expect(first.status).toBe(201);
    expect(b.record.task.taskId).toBe(a.record.task.taskId);
    expect(b.replayed).toBe(true);
  });
  it("rejects anonymous access and body-supplied tenant escalation", async () => {
    expect((await request("/v1/tasks", "bad", { eventId: "e", objective: "x" })).status).toBe(401);
    expect(
      (await request("/v1/tasks", token, { eventId: "e", objective: "x", tenantId: "beta" }))
        .status,
    ).toBe(400);
  });
  it("hides another tenant's task from a valid operator", async () => {
    const { record } = f.gateway.create(
      owner,
      createTaskSchema.parse({ eventId: "e", objective: "x" }),
    );
    expect((await request(`/v1/tasks/${record.task.taskId}`, "b".repeat(40))).status).toBe(404);
  });
  it("rejects changed replay content without creating a second task", async () => {
    await request("/v1/tasks", token, { eventId: "e", objective: "first" });
    expect((await request("/v1/tasks", token, { eventId: "e", objective: "changed" })).status).toBe(
      409,
    );
  });
  it("rejects a channel event outside mention and sender policy", async () => {
    expect(
      (
        await request("/v1/events", "c".repeat(40), {
          messageId: "m",
          chatId: "chat-1",
          senderId: "other",
          content: "research",
          mentionedBot: true,
        })
      ).status,
    ).toBe(403);
  });
});
