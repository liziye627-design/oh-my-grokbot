import { z } from "zod";
import {
  checkSchema,
  identifier,
  providerSchema,
  relativePath,
  sha256,
  version,
} from "./common.js";
import { capabilitySchema, packSchema } from "./registry.js";

export const lockedFileSchema = z.discriminatedUnion("mode", [
  z
    .strictObject({
      mode: z.literal("bundled"),
      source: relativePath,
      target: relativePath,
      sha256,
    })
    .readonly(),
  z
    .strictObject({
      mode: z.literal("generated"),
      content: z.string(),
      target: relativePath,
      sha256,
    })
    .readonly(),
]);
export type LockedFile = z.infer<typeof lockedFileSchema>;
export const planSchema = z
  .strictObject({
    schemaVersion: z.literal("0.1"),
    pack: packSchema,
    provider: providerSchema,
    registryDigest: sha256,
    capabilities: z.array(capabilitySchema).readonly(),
    files: z.array(lockedFileSchema).readonly(),
    checks: z.array(checkSchema).readonly(),
    permissions: z.array(identifier).readonly(),
    skipped: z.array(identifier).readonly(),
  })
  .readonly();
export type InstallPlan = z.infer<typeof planSchema>;
export const installationIdSchema = z.uuid().brand<"InstallationId">();
export const installationSchema = z
  .strictObject({
    id: installationIdSchema,
    pack: identifier,
    version,
    provider: providerSchema,
    planDigest: sha256,
    state: z.enum(["installing", "needs_human", "failed", "rolled_back"]),
    createdAt: z.iso.datetime(),
    files: z
      .array(z.strictObject({ target: relativePath, sha256, owned: z.boolean() }).readonly())
      .readonly(),
    plan: planSchema,
  })
  .readonly();
export type Installation = z.infer<typeof installationSchema>;
export type InstallationId = z.infer<typeof installationIdSchema>;
