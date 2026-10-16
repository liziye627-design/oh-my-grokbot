import { z } from "zod";

import { CoreError } from "../errors.js";
import { type CreateTask, createTaskSchema } from "../gateway/contracts.js";
import { hash } from "../io.js";
import { type IndustryManifest, industryInputKey, type Workflow } from "./contracts.js";
import { orderedSteps } from "./validation.js";

export const industryInputsSchema = z
  .record(industryInputKey, z.string().trim().min(1).max(1800))
  .readonly();
export const industryPlanInputSchema = z
  .strictObject({
    objective: z.string().trim().min(1).max(4000),
    inputs: industryInputsSchema,
    eventId: z.string().min(1).max(200).optional(),
    deadline: z.iso.datetime().nullable().optional(),
  })
  .readonly();
export type IndustryPlanInput = z.infer<typeof industryPlanInputSchema>;
export type IndustryPlan = {
  readonly schemaVersion: "0.1";
  readonly dispatch: "manual_native";
  readonly manifestDigest: string;
  readonly pack: string;
  readonly version: string;
  readonly team: IndustryManifest["pack"]["spec"]["agents"];
  readonly workflow: Workflow;
  readonly inputs: IndustryPlanInput["inputs"];
  readonly taskRequest: CreateTask;
};
export function prepareIndustryPlan(
  manifest: IndustryManifest,
  workflowId: string,
  input: IndustryPlanInput,
): IndustryPlan {
  const workflow = manifest.workflows.find((item) => item.id === workflowId);
  if (!workflow)
    throw new CoreError("INDUSTRY_WORKFLOW_MISSING", "Requested industry workflow does not exist");
  const missing = workflow.requiredInputs.filter((key) => !input.inputs[key]?.trim());
  if (missing.length)
    throw new CoreError("INDUSTRY_INPUT_MISSING", `Required inputs missing: ${missing.join(", ")}`);
  const inputs = Object.fromEntries(
    Object.entries(input.inputs).sort(([a], [b]) => a.localeCompare(b, "en")),
  );
  const manifestDigest = hash(JSON.stringify(manifest));
  const eventId =
    input.eventId ??
    `industry-${hash(JSON.stringify({ manifestDigest, workflowId, objective: input.objective, inputs, deadline: input.deadline ?? null }))}`;
  const envelope = JSON.stringify({
    objective: input.objective,
    manifestDigest,
    workflow: { ...workflow, steps: orderedSteps(workflow) },
    team: manifest.pack.spec.agents,
  });
  if (envelope.length > 16000)
    throw new CoreError(
      "INDUSTRY_HANDOFF_TOO_LARGE",
      "Encoded objective, workflow and team exceed the 16000-character Gateway budget",
    );
  const taskRequest = createTaskSchema.parse({
    eventId,
    objective: envelope,
    pack: manifest.pack.metadata.name,
    assignedRole: workflow.entryRole,
    inputRefs: Object.entries(inputs).map(([key, value]) => `${key}=${value}`),
    deadline: input.deadline ?? null,
  });
  return {
    schemaVersion: "0.1",
    dispatch: "manual_native",
    manifestDigest,
    pack: manifest.pack.metadata.name,
    version: manifest.pack.metadata.version,
    team: manifest.pack.spec.agents,
    workflow: { ...workflow, steps: orderedSteps(workflow) },
    inputs,
    taskRequest,
  };
}
