import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import ky from "ky";
import { z } from "zod";
import { statelessResultTransport } from "../dist/gateway/client.js";
import { gatewayConfigSchema } from "../dist/gateway/config.js";
import { artifactSchema, recordSchema } from "../dist/gateway/contracts.js";
import { startGateway } from "../dist/gateway/server.js";
import { industryManifestSchema } from "../dist/industry/contracts.js";
import { hash } from "../dist/io.js";
import { workspaceSchema } from "../dist/workspaces/contracts.js";

// Local synthetic protocol acceptance: no native bot creation, account login or business work.
const directory = await mkdtemp(join(tmpdir(), "ohmy-workspace-smoke-"));
const manifest = industryManifestSchema.parse(
  JSON.parse(await readFile("industries/app-studio/industry.json", "utf8")),
);
const workflow = manifest.workflows[0];
assert.ok(workflow);
const env = Object.fromEntries(
  ["OWNER", "COLLEAGUE", "REVIEWER", "OUTSIDER", "REVIEWER_B", "CHANNEL"].map((key) => [
    key,
    randomBytes(32).toString("base64url"),
  ]),
);
const group = (id, tenantId, operators, verifiers) => ({
  id,
  name: id,
  tenantId,
  pack: manifest.pack.metadata.name,
  workflows: [workflow.id],
  coordinatorRole: workflow.entryRole,
  bindings: manifest.pack.spec.agents.map((role) => ({
    role: role.id,
    botName: `${id}-${role.id}`,
  })),
  members: { operators, verifiers },
});
const config = gatewayConfigSchema.parse({
  schemaVersion: "0.1",
  port: 0,
  principals: [
    { id: "owner", tenantId: "tenant-a", role: "operator", tokenEnv: "OWNER" },
    { id: "colleague", tenantId: "tenant-a", role: "operator", tokenEnv: "COLLEAGUE" },
    { id: "reviewer", tenantId: "tenant-a", role: "verifier", tokenEnv: "REVIEWER" },
    { id: "outsider", tenantId: "tenant-b", role: "operator", tokenEnv: "OUTSIDER" },
    { id: "reviewer-b", tenantId: "tenant-b", role: "verifier", tokenEnv: "REVIEWER_B" },
    {
      id: "channel",
      tenantId: "tenant-a",
      role: "channel",
      tokenEnv: "CHANNEL",
      chats: ["fixture-chat"],
      senders: ["user1", "unmapped"],
    },
  ],
  workspaces: [
    {
      ...group("workspace-a", "tenant-a", ["owner", "colleague"], ["reviewer"]),
      feishu: {
        principalId: "channel",
        chatId: "fixture-chat",
        senders: [{ senderId: "user1", principalId: "owner" }],
      },
    },
    group("workspace-b", "tenant-b", ["outsider"], ["reviewer-b"]),
  ],
});
const inputs = Object.fromEntries(
  workflow.requiredInputs.map((key) => [key, `synthetic-fixture:${key}`]),
);
const client = new Client({ name: "workspace-protocol-fixture", version: "1.0.0" });
let service;
function decode(result) {
  const parsed = z
    .object({
      content: z.array(z.object({ type: z.literal("text"), text: z.string() })).min(1),
      isError: z.boolean().optional(),
    })
    .parse(result);
  assert.notEqual(parsed.isError, true);
  return JSON.parse(parsed.content[0].text);
}
const listing = z.object({ workspaces: z.array(workspaceSchema) });
try {
  service = await startGateway(directory, config, env, () => undefined);
  const address = service.server.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}`;
  const api = (token) =>
    ky.create({
      prefix: base,
      headers: { Authorization: `Bearer ${token}` },
      retry: 0,
      timeout: 5000,
    });
  const owner = api(env.OWNER),
    colleague = api(env.COLLEAGUE),
    reviewer = api(env.REVIEWER),
    outsider = api(env.OUTSIDER),
    channel = api(env.CHANNEL);
  assert.deepEqual(
    listing.parse(await owner.get("v1/workspaces").json()).workspaces.map((item) => item.id),
    ["workspace-a"],
  );
  assert.deepEqual(
    listing.parse(await outsider.get("v1/workspaces").json()).workspaces.map((item) => item.id),
    ["workspace-b"],
  );
  const route = `v1/workspaces/workspace-a/workflows/${workflow.id}/tasks`;
  const created = z.object({ record: recordSchema }).parse(
    await owner
      .post(route, {
        json: {
          eventId: "workspace-fixture",
          objective: "Synthetic protocol fixture only",
          inputs,
        },
      })
      .json(),
  );
  const taskId = created.record.task.taskId;
  const shared = z
    .object({ task: z.object({ taskId: z.string() }) })
    .parse(await colleague.get(`v1/tasks/${taskId}`).json());
  assert.equal(shared.task.taskId, taskId);
  assert.equal((await outsider.get(`v1/tasks/${taskId}`, { throwHttpErrors: false })).status, 404);
  assert.equal(
    (
      await outsider.post(route, {
        json: { eventId: "forbidden", objective: "Fixture", inputs },
        throwHttpErrors: false,
      })
    ).status,
    404,
  );
  const claim = z
    .object({ credential: z.string(), record: recordSchema })
    .parse(await colleague.post(`v1/tasks/${taskId}/claim`).json());
  const scope = { taskId, runId: claim.record.task.runId };
  await client.connect(statelessResultTransport(new URL(`${base}/mcp`), claim.credential));
  const received = z
    .object({ task: z.object({ objective: z.string() }) })
    .parse(decode(await client.callTool({ name: "get_task", arguments: scope })));
  const durable = z
    .object({
      workspace: workspaceSchema
        .unwrap()
        .pick({ id: true, name: true, coordinatorRole: true, bindings: true }),
    })
    .parse(JSON.parse(received.task.objective));
  assert.equal(durable.workspace.id, "workspace-a");
  assert.equal(durable.workspace.name, config.workspaces[0].name);
  assert.equal(durable.workspace.coordinatorRole, workflow.entryRole);
  assert.deepEqual(durable.workspace.bindings, config.workspaces[0].bindings);
  const content = JSON.stringify({ syntheticProtocolFixture: true, businessWorkPerformed: false });
  const artifact = artifactSchema.parse(
    decode(
      await client.callTool({
        name: "submit_artifact",
        arguments: { ...scope, name: "fixture.json", content, sha256: hash(content) },
      }),
    ),
  );
  z.object({ state: z.literal("verifying") }).parse(
    decode(
      await client.callTool({
        name: "complete_task",
        arguments: { ...scope, artifactIds: [artifact.id] },
      }),
    ),
  );
  const decision = {
    verdict: "accepted",
    reason: "Synthetic protocol evidence bytes only; no business acceptance.",
  };
  assert.equal(
    (
      await api(claim.credential).post(`v1/tasks/${taskId}/review`, {
        json: decision,
        throwHttpErrors: false,
      })
    ).status,
    403,
  );
  const bytes = z
    .object({ content: z.string() })
    .parse(await reviewer.get(`v1/tasks/${taskId}/artifacts/${artifact.id}`).json());
  assert.equal(hash(bytes.content), artifact.sha256);
  const reviewed = recordSchema.parse(
    await reviewer.post(`v1/tasks/${taskId}/review`, { json: decision }).json(),
  );
  assert.equal(reviewed.task.state, "succeeded");
  const event = {
    messageId: "channel-fixture",
    chatId: "fixture-chat",
    senderId: "user1",
    mentionedBot: true,
    content: JSON.stringify({
      workflow: workflow.id,
      objective: "Synthetic channel protocol fixture",
      inputs,
    }),
  };
  const routed = z
    .object({ record: recordSchema })
    .parse(await channel.post("v1/events", { json: event }).json());
  assert.equal(routed.record.origin.channel, "feishu");
  assert.equal(routed.record.origin.chatId, event.chatId);
  assert.equal(routed.record.origin.messageId, event.messageId);
  assert.equal(routed.record.task.requestedBy, "owner");
  const denied = await channel.post("v1/events", {
    json: { ...event, messageId: "unmapped-event", senderId: "unmapped" },
    throwHttpErrors: false,
  });
  assert.equal(denied.status, 403);
  let receipts = 0;
  const sink = async () => {
    receipts += 1;
    return `local-workspace-receipt-${receipts}`;
  };
  const principal = service.gateway.access.principal("owner");
  await service.gateway.outbox.dispatch(principal, sink);
  await service.gateway.outbox.dispatch(principal, sink);
  assert.equal(receipts, 1);
  process.stdout.write(
    `${JSON.stringify(
      {
        status: "passed",
        realHTTP: true,
        officialMCP: true,
        sharedOperators: 2,
        isolatedWorkspaces: 2,
        filteredListing: true,
        sharedTaskClaim: true,
        durableWorkspaceBindings: true,
        outsiderDenied: true,
        mappedChannelOrigin: true,
        unmappedSenderDenied: true,
        runnerSelfReviewDenied: true,
        independentReview: true,
        localSinkReceipts: receipts,
        localFixtureOnly: true,
        nativeGroupVerified: false,
        liveFeishu: false,
        businessWorkPerformed: false,
      },
      null,
      2,
    )}\n`,
  );
} finally {
  await client.close();
  if (service) await service.close();
  const insideTemp = relative(resolve(tmpdir()), resolve(directory));
  assert.ok(insideTemp.startsWith("ohmy-workspace-smoke-") && !insideTemp.includes(".."));
  await rm(directory, { recursive: true, force: true });
}
