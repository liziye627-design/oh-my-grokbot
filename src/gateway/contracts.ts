import { z } from "zod";
import { identifier, relativePath, sha256 } from "../contracts/common.js";
import { runIdSchema, taskIdSchema, taskSchema } from "../contracts/task.js";

export const principalSchema = z
  .strictObject({
    id: identifier,
    tenantId: identifier,
    role: z.enum(["operator", "channel", "verifier"]),
    tokenEnv: z.string().regex(/^[A-Z][A-Z0-9_]+$/),
    chats: z.array(z.string().min(1)).readonly().default([]),
    senders: z.array(z.string().min(1)).readonly().default([]),
  })
  .readonly();
export type Principal = z.infer<typeof principalSchema>;
export type Identity = {
  readonly id: string;
  readonly tenantId: string;
  readonly role: Principal["role"] | "runner";
  readonly scope?: { readonly taskId: string; readonly runId: string };
};
export const originSchema = z
  .strictObject({
    channel: z.enum(["manual", "feishu"]),
    chatId: z.string(),
    messageId: z.string(),
  })
  .readonly();
export const createTaskSchema = z
  .strictObject({
    eventId: z.string().min(1).max(200),
    objective: z.string().trim().min(1).max(16000),
    pack: identifier.default("oh-my-core"),
    assignedRole: identifier.default("chief-of-staff"),
    inputRefs: z.array(z.string().min(1).max(2000)).max(40).readonly().default([]),
    deadline: z.iso.datetime().nullable().default(null),
  })
  .readonly();
export type CreateTask = z.infer<typeof createTaskSchema>;
export const eventSchema = z
  .strictObject({
    messageId: z.string().min(1).max(200),
    chatId: z.string().min(1).max(200),
    senderId: z.string().min(1).max(200),
    content: z.string().trim().min(1).max(16000),
    mentionedBot: z.boolean(),
  })
  .readonly();
export type ChannelEvent = z.infer<typeof eventSchema>;
export const scopeSchema = z.strictObject({ taskId: taskIdSchema, runId: runIdSchema });
export const progressSchema = scopeSchema.extend({ message: z.string().min(1).max(2000) });
const artifactName = z
  .string()
  .max(200)
  .regex(/^[a-zA-Z0-9_-][a-zA-Z0-9_.-]*(?:\/[a-zA-Z0-9_-][a-zA-Z0-9_.-]*)*$/);
export const artifactInputSchema = scopeSchema.extend({
  name: artifactName,
  content: z.string().max(262144),
  sha256,
});
export const completionSchema = scopeSchema.extend({
  artifactIds: z.array(z.uuid()).min(1).max(20).readonly(),
});
export const failureSchema = scopeSchema.extend({
  code: identifier,
  message: z.string().min(1).max(2000),
});
export const approvalInputSchema = scopeSchema.extend({
  approvalId: z.uuid(),
  operation: z.enum(["social-publish", "external-write"]),
  destination: z.string().min(1).max(1000),
  payload: z.string().min(1).max(16000),
  expiresAt: z.iso.datetime(),
});
export const approvalSchema = approvalInputSchema
  .extend({
    tenantId: identifier,
    payloadHash: sha256,
    state: z.enum(["pending", "approved", "denied", "expired"]),
    decidedBy: z.string().nullable(),
  })
  .readonly();
export type Approval = z.infer<typeof approvalSchema>;
export const artifactSchema = scopeSchema
  .extend({
    id: z.uuid(),
    tenantId: identifier,
    name: artifactName,
    path: relativePath,
    sha256,
    submittedBy: identifier,
    status: z.enum(["submitted", "verified", "rejected"]),
    verifiedAt: z.iso.datetime().nullable(),
  })
  .readonly();
export type Artifact = z.infer<typeof artifactSchema>;
export const recordSchema = z
  .strictObject({
    task: taskSchema,
    origin: originSchema,
    completionIds: z.array(z.uuid()).readonly(),
  })
  .readonly();
export type TaskRecord = z.infer<typeof recordSchema>;
export const outboxSchema = z
  .strictObject({
    id: z.uuid(),
    tenantId: identifier,
    taskId: taskIdSchema,
    origin: originSchema,
    text: z.string(),
    state: z.enum(["pending", "sending", "sent", "needs_human"]),
    attempts: z.number().int(),
    receipt: z.string().nullable(),
  })
  .readonly();
export type OutboxItem = z.infer<typeof outboxSchema>;
export const reviewSchema = z.strictObject({
  verdict: z.enum(["accepted", "rejected"]),
  reason: z.string().trim().min(1).max(2000),
});
export const decisionSchema = z.strictObject({
  decision: z.enum(["approved", "denied"]),
  payloadHash: sha256,
});
