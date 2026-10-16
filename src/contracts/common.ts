import { valid, validRange } from "semver";
import { z } from "zod";

export const identifier = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .max(64);
export const version = z.string().refine((value) => valid(value) !== null, "Invalid version");
export const versionRange = z
  .string()
  .refine((value) => validRange(value) !== null, "Invalid range");
export const sha256 = z.string().regex(/^[a-f0-9]{64}$/);
export const providerSchema = z.enum(["grokbot", "muse"]);
export type Provider = z.infer<typeof providerSchema>;
export const supportSchema = z.enum(["supported", "manual", "unsupported", "unknown"]);
export const verificationSchema = z.enum(["discovered", "reviewed", "compatible", "verified"]);
export const relativePath = z
  .string()
  .regex(/^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_.-]+)*$/)
  .refine((value) => value.split("/").every((part) => part !== "." && part !== ".."));
export const publicUrl = z.url({ protocol: /^https$/ }).refine((value) => {
  const url = new URL(value);
  return !url.username && !url.password && !url.search && !url.hash;
}, "Use a public HTTPS source URL without credentials, query or fragment");
export const taskFitSchema = z.enum(["text", "image", "audio", "code"]);
export type TaskFit = z.infer<typeof taskFitSchema>;
export const requirementSchema = z
  .strictObject({
    capability: identifier,
    range: versionRange,
    optional: z.boolean(),
    fit: taskFitSchema.optional(),
  })
  .readonly();
export type Requirement = z.infer<typeof requirementSchema>;

export const checkSchema = z
  .strictObject({
    name: z.string(),
    status: z.enum(["passed", "failed", "skipped", "needs_human"]),
    code: z.string(),
    message: z.string(),
  })
  .readonly();
export type Check = z.infer<typeof checkSchema>;
