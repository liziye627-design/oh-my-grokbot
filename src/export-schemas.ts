import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { installationSchema, planSchema } from "./contracts/installation.js";
import { provenanceSchema } from "./contracts/provenance.js";
import { capabilitySchema, packSchema, registrySchema } from "./contracts/registry.js";
import { connectorSchema, socialResultSchema } from "./contracts/social.js";
import { evidenceSchema, taskSchema } from "./contracts/task.js";

import { gatewayConfigSchema } from "./gateway/config.js";
import {
  approvalSchema,
  artifactSchema,
  createTaskSchema,
  eventSchema,
  outboxSchema,
} from "./gateway/contracts.js";

import { industryManifestSchema } from "./industry/contracts.js";

import { workspaceSchema } from "./workspaces/contracts.js";

const root = fileURLToPath(new URL("../schemas/", import.meta.url));
await mkdir(root, { recursive: true });
const schemas = {
  workspace: workspaceSchema,
  industry: industryManifestSchema,
  "gateway-config": gatewayConfigSchema,
  "gateway-task-input": createTaskSchema,
  "gateway-channel-event": eventSchema,
  "gateway-artifact": artifactSchema,
  "gateway-approval": approvalSchema,
  "gateway-outbox": outboxSchema,
  provenance: provenanceSchema,
  connector: connectorSchema,
  "social-result": socialResultSchema,
  capability: capabilitySchema,
  pack: packSchema,
  registry: registrySchema,
  task: taskSchema,
  evidence: evidenceSchema,
  plan: planSchema,
  installation: installationSchema,
} as const;
for (const [name, schema] of Object.entries(schemas)) {
  await writeFile(
    `${root}/${name}.schema.json`,
    `${JSON.stringify(z.toJSONSchema(schema, { io: "input" }), null, 2)}\n`,
  );
}
