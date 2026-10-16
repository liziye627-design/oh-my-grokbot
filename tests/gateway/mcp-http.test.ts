import { serve } from "@hono/node-server";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import ky from "ky";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";
import { createGatewayApp } from "../../src/gateway/app.js";
import { statelessResultTransport } from "../../src/gateway/client.js";
import { artifactSchema, recordSchema } from "../../src/gateway/contracts.js";
import { hash } from "../../src/io.js";
import { fixture, token } from "./helpers.js";

let f: Awaited<ReturnType<typeof fixture>>;
beforeEach(async () => {
  f = await fixture();
});
afterEach(async () => {
  await f.cleanup();
});
const textResult = z.object({
  content: z.array(z.object({ type: z.literal("text"), text: z.string() })),
  isError: z.boolean().optional(),
});
function decoded(value: unknown): unknown {
  const parsed = textResult.parse(value);
  const first = parsed.content[0];
  if (!first) throw new Error("Tool returned no result");
  return JSON.parse(first.text);
}

describe("Real HTTP and MCP native-result surface", () => {
  it("completes an authenticated MCP task only after independent HTTP review and sends one reply", async () => {
    const sent: string[] = [];
    const server = serve({
      fetch: createGatewayApp(f.gateway, async (item) => {
        sent.push(item.id);
        return "local-receipt";
      }).fetch,
      hostname: "127.0.0.1",
      port: 0,
    });
    await new Promise<void>((resolve) => server.once("listening", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("No TCP port");
    const base = `http://127.0.0.1:${address.port}`;
    const owner = ky.create({
      prefix: base,
      headers: { Authorization: `Bearer ${token}` },
      retry: 0,
      timeout: 5000,
    });
    const client = new Client({ name: "gateway-e2e", version: "1.0.0" });
    try {
      const created = z.object({ record: recordSchema }).parse(
        await owner
          .post("v1/tasks", {
            json: { eventId: "http-event", objective: "produce a cited report" },
          })
          .json(),
      );
      const claim = z
        .object({ credential: z.string(), record: recordSchema })
        .parse(await owner.post(`v1/tasks/${created.record.task.taskId}/claim`).json());
      const scope = { taskId: claim.record.task.taskId, runId: claim.record.task.runId };
      await client.connect(statelessResultTransport(new URL(`${base}/mcp`), claim.credential));
      expect((await client.listTools()).tools.map((tool) => tool.name).sort()).toEqual([
        "complete_task",
        "get_task",
        "report_failure",
        "report_progress",
        "request_approval",
        "submit_artifact",
      ]);
      await client.callTool({
        name: "report_progress",
        arguments: { ...scope, message: "sources checked" },
      });
      const artifact = artifactSchema.parse(
        decoded(
          await client.callTool({
            name: "submit_artifact",
            arguments: {
              ...scope,
              name: "report.md",
              content: "verified source material",
              sha256: hash("verified source material"),
            },
          }),
        ),
      );
      const completed = decoded(
        await client.callTool({
          name: "complete_task",
          arguments: { ...scope, artifactIds: [artifact.id] },
        }),
      );
      expect(completed).toMatchObject({ state: "verifying" });
      const runnerReview = await ky.post(`${base}/v1/tasks/${scope.taskId}/review`, {
        headers: { Authorization: `Bearer ${claim.credential}` },
        json: { verdict: "accepted", reason: "self approve" },
        throwHttpErrors: false,
      });
      expect(runnerReview.status).toBe(403);
      const reviewer = ky.create({
        prefix: base,
        headers: { Authorization: `Bearer ${"v".repeat(40)}` },
        retry: 0,
      });
      const final = recordSchema.parse(
        await reviewer
          .post(`v1/tasks/${scope.taskId}/review`, {
            json: { verdict: "accepted", reason: "Read artifact and checked sources" },
          })
          .json(),
      );
      await owner.post("v1/outbox/dispatch");
      await owner.post("v1/outbox/dispatch");
      expect(final.task.state).toBe("succeeded");
      expect(sent).toHaveLength(1);
      expect(
        await owner.get(`v1/tasks/${scope.taskId}/artifacts/${artifact.id}`).json(),
      ).toMatchObject({ content: "verified source material" });
    } finally {
      await client.close();
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    }
  });
});
