import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import ky from "ky";
import { z } from "zod";
import { statelessResultTransport } from "../dist/gateway/client.js";
import { gatewayConfigSchema } from "../dist/gateway/config.js";
import { approvalSchema, artifactSchema, recordSchema } from "../dist/gateway/contracts.js";
import { startGateway } from "../dist/gateway/server.js";
import { hash } from "../dist/io.js";

// Isolated local demonstration; no platform credentials or publishing.
const workspace = await mkdtemp(join(tmpdir(), "ohmy-gateway-smoke-"));
const env = {
  OWNER: randomBytes(32).toString("base64url"),
  REVIEWER: randomBytes(32).toString("base64url"),
  CHANNEL: randomBytes(32).toString("base64url"),
};
const config = gatewayConfigSchema.parse({
  schemaVersion: "0.1",
  port: 0,
  principals: [
    { id: "owner", tenantId: "demo", role: "operator", tokenEnv: "OWNER" },
    { id: "reviewer", tenantId: "demo", role: "verifier", tokenEnv: "REVIEWER" },
    {
      id: "channel",
      tenantId: "demo",
      role: "channel",
      tokenEnv: "CHANNEL",
      chats: ["demo-chat"],
      senders: ["demo-user"],
    },
  ],
});
const client = new Client({ name: "ohmy-smoke", version: "1.0.0" });
let service;
const report = {
  at: new Date().toISOString(),
  surface: "compiled Gateway + real loopback HTTP + official MCP SDK",
  checks: [],
  liveFeishu: false,
  nativeGrokTrigger: "unverified",
};
function connected(active) {
  const address = active.server.address();
  assert.ok(address && typeof address !== "string");
  assert.equal(address.address, "127.0.0.1");
  const base = `http://127.0.0.1:${address.port}`;
  const api = (token) =>
    ky.create({
      prefix: base,
      headers: { Authorization: `Bearer ${token}` },
      retry: 0,
      timeout: 5000,
    });
  return { base, owner: api(env.OWNER), reviewer: api(env.REVIEWER), channel: api(env.CHANNEL) };
}
function decoded(value) {
  const parsed = z
    .object({
      content: z.array(z.object({ type: z.literal("text"), text: z.string() })),
      isError: z.boolean().optional(),
    })
    .parse(value);
  assert.notEqual(parsed.isError, true);
  assert.ok(parsed.content[0]);
  return JSON.parse(parsed.content[0].text);
}
try {
  service = await startGateway(workspace, config, env, () => undefined);
  const { base, owner, reviewer, channel } = connected(service);
  const event = {
    messageId: "local-event",
    chatId: "demo-chat",
    senderId: "demo-user",
    content: "Verify the local Gateway result loop.",
    mentionedBot: true,
  };
  const created = z
    .object({ record: recordSchema, replayed: z.boolean() })
    .parse(await channel.post("v1/events", { json: event }).json());
  const replay = z
    .object({ record: recordSchema, replayed: z.boolean() })
    .parse(await channel.post("v1/events", { json: event }).json());
  assert.equal(replay.record.task.taskId, created.record.task.taskId);
  assert.equal(replay.replayed, true);
  report.checks.push("authenticated channel event deduplicated");
  const claim = z
    .object({ credential: z.string(), record: recordSchema, dispatch: z.literal("manual_native") })
    .parse(await owner.post(`v1/tasks/${created.record.task.taskId}/claim`).json());
  const scope = { taskId: claim.record.task.taskId, runId: claim.record.task.runId };
  await client.connect(statelessResultTransport(new URL(`${base}/mcp`), claim.credential));
  const tools = await client.listTools();
  assert.equal(tools.tools.length, 6);
  report.checks.push("official MCP initialization and six tools");
  decoded(
    await client.callTool({
      name: "report_progress",
      arguments: { ...scope, message: "Local evidence prepared." },
    }),
  );
  const approval = approvalSchema.parse(
    decoded(
      await client.callTool({
        name: "request_approval",
        arguments: {
          ...scope,
          approvalId: randomUUID(),
          operation: "external-write",
          destination: "local-demo",
          payload: "Review only; no external write executor.",
          expiresAt: new Date(Date.now() + 300000).toISOString(),
        },
      }),
    ),
  );
  await owner.post(`v1/approvals/${approval.approvalId}/decision`, {
    json: { decision: "approved", payloadHash: approval.payloadHash },
  });
  report.checks.push("exact proposal approved without executing any external action");
  const content = "Local Gateway smoke evidence. No social content was created or published.";
  const artifact = artifactSchema.parse(
    decoded(
      await client.callTool({
        name: "submit_artifact",
        arguments: { ...scope, name: "report.md", content, sha256: hash(content) },
      }),
    ),
  );
  const completion = decoded(
    await client.callTool({
      name: "complete_task",
      arguments: { ...scope, artifactIds: [artifact.id] },
    }),
  );
  assert.equal(completion.state, "verifying");
  const selfReview = await ky.post(`${base}/v1/tasks/${scope.taskId}/review`, {
    headers: { Authorization: `Bearer ${claim.credential}` },
    json: { verdict: "accepted", reason: "self review" },
    retry: 0,
    throwHttpErrors: false,
  });
  assert.equal(selfReview.status, 403);
  const downloaded = await reviewer.get(`v1/tasks/${scope.taskId}/artifacts/${artifact.id}`).json();
  assert.equal(downloaded.content, content);
  assert.equal(hash(downloaded.content), artifact.sha256);
  const reviewed = recordSchema.parse(
    await reviewer
      .post(`v1/tasks/${scope.taskId}/review`, {
        json: { verdict: "accepted", reason: "Read and checked local evidence bytes." },
      })
      .json(),
  );
  assert.equal(reviewed.task.state, "succeeded");
  const revoked = await ky.get(`${base}/v1/tasks/${scope.taskId}`, {
    headers: { Authorization: `Bearer ${claim.credential}` },
    retry: 0,
    throwHttpErrors: false,
  });
  assert.equal(revoked.status, 401);
  report.checks.push(
    "artifact retrieved, hash checked, self-review denied, independent review accepted, token revoked",
  );
  const missing = await owner.post("v1/outbox/dispatch", { throwHttpErrors: false });
  assert.equal(missing.status, 409);
  assert.equal((await missing.json()).code, "CHANNEL_NOT_CONNECTED");
  await client.close();
  await service.close();
  service = undefined;
  service = await startGateway(workspace, config, env, () => undefined);
  const restarted = connected(service).owner;
  const persisted = await restarted.get(`v1/tasks/${scope.taskId}`).json();
  assert.equal(persisted.task.state, "succeeded");
  const outbox = await restarted.get("v1/outbox").json();
  assert.equal(outbox.items.length, 1);
  assert.equal(outbox.items[0].state, "pending");
  report.checks.push(
    "state and pending outbox survive restart; disconnected Feishu explicitly reported",
  );
  report.status = "passed";
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} finally {
  await client.close();
  if (service) await service.close();
  const insideTemp = relative(resolve(tmpdir()), resolve(workspace));
  assert.ok(insideTemp.startsWith("ohmy-gateway-smoke-") && !insideTemp.includes(".."));
  await rm(workspace, { recursive: true, force: true });
}
