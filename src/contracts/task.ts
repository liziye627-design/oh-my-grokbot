import { z } from "zod";
import { identifier, sha256 } from "./common.js";

export const taskIdSchema = z.uuid().brand<"TaskId">();
export const runIdSchema = z.uuid().brand<"RunId">();
export const taskStates = [
  "created",
  "queued",
  "running",
  "awaiting_approval",
  "verifying",
  "succeeded",
  "partial",
  "failed",
  "canceled",
  "needs_human",
] as const;
export const taskSchema = z
  .strictObject({
    schemaVersion: z.literal("0.1"),
    taskId: taskIdSchema,
    runId: runIdSchema,
    tenantId: identifier,
    pack: identifier,
    requestedBy: z.string().min(1),
    assignedRole: identifier,
    objective: z.string().min(1),
    inputRefs: z.array(z.string().min(1)).readonly(),
    state: z.enum(taskStates),
    approvalPolicy: z.literal("external-actions"),
    deadline: z.iso.datetime().nullable(),
  })
  .readonly();
export type Task = z.infer<typeof taskSchema>;

export const evidenceSchema = z
  .strictObject({
    schemaVersion: z.literal("0.1"),
    taskId: taskIdSchema,
    runId: runIdSchema,
    tenantId: identifier,
    submittedBy: identifier,
    artifact: z.strictObject({ uri: z.string().min(1), sha256 }).readonly(),
    status: z.enum(["submitted", "verified", "rejected"]),
    verifiedAt: z.iso.datetime().nullable(),
  })
  .readonly()
  .refine(
    (value) => value.status !== "verified" || value.verifiedAt !== null,
    "Verified evidence requires a verification time",
  );
export type Evidence = z.infer<typeof evidenceSchema>;

const transitions: Readonly<Record<Task["state"], readonly Task["state"][]>> = {
  created: ["queued", "canceled"],
  queued: ["running", "canceled", "needs_human"],
  running: ["awaiting_approval", "verifying", "failed", "partial", "canceled", "needs_human"],
  awaiting_approval: ["running", "canceled", "needs_human"],
  verifying: ["succeeded", "partial", "failed", "needs_human"],
  succeeded: [],
  partial: [],
  failed: [],
  canceled: [],
  needs_human: ["queued", "canceled"],
};

export function canTransition(from: Task["state"], to: Task["state"]): boolean {
  return transitions[from].includes(to);
}
