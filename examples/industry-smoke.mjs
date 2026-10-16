import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
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

// Synthetic protocol fixtures verify transport and persistence, never business job quality.
const workspace = await mkdtemp(join(tmpdir(), "ohmy-industry-smoke-"));
const env = {
  OWNER: randomBytes(32).toString("base64url"),
  REVIEWER: randomBytes(32).toString("base64url"),
};
const config = gatewayConfigSchema.parse({
  schemaVersion: "0.1",
  port: 0,
  principals: [
    { id: "owner", tenantId: "fixture", role: "operator", tokenEnv: "OWNER" },
    { id: "reviewer", tenantId: "fixture", role: "verifier", tokenEnv: "REVIEWER" },
  ],
});
const envelope = z.object({ code: z.string(), context: z.unknown() });
async function cli(args, status = 0) {
  const result = await new Promise((resolveResult, reject) => {
    const child = spawn(
      process.execPath,
      [resolve("dist/cli.js"), "--json", "--workspace", workspace, ...args],
      { timeout: 20000, windowsHide: true },
    );
    let stdout = "",
      stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) => resolveResult({ status: code, stdout, stderr }));
  });
  assert.equal(result.status, status, result.stdout + result.stderr);
  return envelope.parse(JSON.parse(result.stdout));
}
function decoded(result) {
  const parsed = z
    .object({
      content: z.array(z.object({ type: z.literal("text"), text: z.string() })).min(1),
      isError: z.boolean().optional(),
    })
    .parse(result);
  assert.notEqual(parsed.isError, true);
  return JSON.parse(parsed.content[0].text);
}
const report = {
  at: new Date().toISOString(),
  status: "passed",
  realHTTP: true,
  officialMCP: true,
  localFixtureOnly: true,
  liveNative: false,
  liveFeishu: false,
  industries: [],
};
let service;
try {
  const listed = z
    .object({ items: z.array(z.object({ id: z.string() })) })
    .parse((await cli(["industry", "list"])).context);
  assert.equal(listed.items.length, 16);
  service = await startGateway(workspace, config, env, () => undefined);
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
    reviewer = api(env.REVIEWER);
  const { industries } = z
    .object({ industries: z.array(industryManifestSchema) })
    .parse(await owner.get("v1/industries").json());
  assert.deepEqual(
    industries.map((item) => item.pack.metadata.name).sort(),
    listed.items.map((item) => item.id).sort(),
  );
  for (const manifest of industries) {
    const pack = manifest.pack.metadata.name,
      workflow = manifest.workflows[0];
    assert.ok(workflow);
    const inputs = Object.fromEntries(
      workflow.requiredInputs.map((key) => [key, `synthetic-fixture:${key}`]),
    );
    const inputPath = join(workspace, "inputs.json"),
      planPath = join(workspace, "plan.json");
    await writeFile(inputPath, JSON.stringify(inputs));
    await cli([
      "industry",
      "plan",
      pack,
      workflow.id,
      "--objective",
      "Synthetic local protocol acceptance only",
      "--inputs",
      inputPath,
      "--out",
      planPath,
    ]);
    const plan = z
      .object({ pack: z.string(), workflow: z.object({ id: z.string() }) })
      .parse(JSON.parse(await readFile(planPath, "utf8")));
    assert.equal(plan.pack, pack);
    assert.equal(plan.workflow.id, workflow.id);
    const installation = z
      .object({ id: z.uuid(), files: z.array(z.object({ target: z.string() })) })
      .parse((await cli(["install", pack, "--yes", "--allow-unverified"], 2)).context);
    assert.ok(installation.files.some((file) => file.target.endsWith("/industry.json")));
    assert.equal((await cli(["rollback", installation.id, "--yes"])).code, "ROLLED_BACK");
    const route = `v1/industries/${pack}/workflows/${workflow.id}/tasks`;
    const missing = await owner.post(route, {
      json: { eventId: `missing-${pack}`, objective: "Protocol fixture", inputs: {} },
      throwHttpErrors: false,
    });
    assert.equal(missing.status, 400);
    z.object({ code: z.literal("INDUSTRY_INPUT_MISSING") }).parse(await missing.json());
    const created = z.object({ record: recordSchema }).parse(
      await owner
        .post(route, {
          json: {
            eventId: `fixture-${pack}`,
            objective: "Synthetic protocol fixture; no business work performed",
            inputs,
          },
        })
        .json(),
    );
    const claim = z
      .object({ record: recordSchema, credential: z.string() })
      .parse(await owner.post(`v1/tasks/${created.record.task.taskId}/claim`).json());
    const scope = { taskId: claim.record.task.taskId, runId: claim.record.task.runId };
    const client = new Client({ name: "industry-protocol-fixture", version: "1.0.0" });
    try {
      await client.connect(statelessResultTransport(new URL(`${base}/mcp`), claim.credential));
      const received = z
        .object({
          task: z.object({
            assignedRole: z.string(),
            objective: z.string(),
            inputRefs: z.array(z.string()),
          }),
        })
        .parse(decoded(await client.callTool({ name: "get_task", arguments: scope })));
      assert.equal(received.task.assignedRole, workflow.entryRole);
      assert.deepEqual(
        received.task.inputRefs.sort(),
        Object.entries(inputs)
          .map(([key, value]) => `${key}=${value}`)
          .sort(),
      );
      const durable = z
        .object({
          workflow: z.object({
            id: z.string(),
            steps: z.array(z.object({ id: z.string(), role: z.string() })),
          }),
          team: z.array(z.object({ id: z.string() })),
        })
        .parse(JSON.parse(received.task.objective));
      assert.equal(durable.workflow.id, workflow.id);
      assert.deepEqual(
        durable.workflow.steps.map((step) => step.id).sort(),
        workflow.steps.map((step) => step.id).sort(),
      );
      assert.deepEqual(
        durable.team.map((role) => role.id).sort(),
        manifest.pack.spec.agents.map((role) => role.id).sort(),
      );
      const content = JSON.stringify({
        syntheticProtocolFixture: true,
        businessWorkPerformed: false,
        pack,
        workflow: workflow.id,
      });
      const artifact = artifactSchema.parse(
        decoded(
          await client.callTool({
            name: "submit_artifact",
            arguments: { ...scope, name: "protocol-fixture.json", content, sha256: hash(content) },
          }),
        ),
      );
      z.object({ state: z.literal("verifying") }).parse(
        decoded(
          await client.callTool({
            name: "complete_task",
            arguments: { ...scope, artifactIds: [artifact.id] },
          }),
        ),
      );
      const downloaded = z
        .object({ content: z.string() })
        .parse(await reviewer.get(`v1/tasks/${scope.taskId}/artifacts/${artifact.id}`).json());
      assert.equal(hash(downloaded.content), artifact.sha256);
      const review = recordSchema.parse(
        await reviewer
          .post(`v1/tasks/${scope.taskId}/review`, {
            json: {
              verdict: "accepted",
              reason: "Accepted synthetic protocol fixture bytes only, not industry business work.",
            },
          })
          .json(),
      );
      assert.equal(review.task.state, "succeeded");
    } finally {
      await client.close();
    }
    report.industries.push({
      pack,
      workflow: workflow.id,
      roles: manifest.pack.spec.agents.length,
      installRollback: true,
      missingInputsDenied: true,
      durableWorkflowViaMCP: true,
      protocolFixtureReviewed: true,
      businessWorkPerformed: false,
    });
  }
  let deliveries = 0;
  const sink = async () => {
    deliveries += 1;
    return `local-fixture-receipt-${deliveries}`;
  };
  const principal = service.gateway.access.principal("owner");
  let guard = 0;
  while (deliveries < report.industries.length && guard < 5) {
    const batch = await service.gateway.outbox.dispatch(principal, sink);
    guard += 1;
    if (batch.length === 0) break;
  }
  assert.equal(deliveries, report.industries.length);
  const outbox = z
    .object({ items: z.array(z.object({ state: z.literal("sent") })) })
    .parse(await owner.get("v1/outbox").json());
  assert.equal(outbox.items.length, report.industries.length);
  process.stdout.write(
    `${JSON.stringify({ ...report, localSinkDeliveries: deliveries }, null, 2)}\n`,
  );
} finally {
  if (service) await service.close();
  const insideTemp = relative(resolve(tmpdir()), resolve(workspace));
  assert.ok(insideTemp.startsWith("ohmy-industry-smoke-") && !insideTemp.includes(".."));
  await rm(workspace, { recursive: true, force: true });
}
