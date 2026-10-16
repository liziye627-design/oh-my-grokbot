import { z } from "zod";
import {
  identifier,
  publicUrl,
  relativePath,
  requirementSchema,
  supportSchema,
  taskFitSchema,
  verificationSchema,
  version,
} from "./common.js";
import { connectorSchema } from "./social.js";

export const sourceSchema = z
  .strictObject({
    id: identifier,
    url: publicUrl.nullable(),
    author: z.string().min(1),
    license: z.string().min(1),
    redistribution: z.enum(["allowed", "reference_only", "local_only"]),
    verification: verificationSchema,
    checkedAt: z.iso.date(),
  })
  .readonly();

const deliverySchema = z.discriminatedUnion("mode", [
  z.strictObject({ mode: z.literal("bundled"), directory: relativePath }).readonly(),
  z
    .strictObject({ mode: z.literal("reference"), url: publicUrl, instructions: z.string().min(1) })
    .readonly(),
]);

export const capabilitySchema = z
  .strictObject({
    id: identifier,
    version,
    kind: z.enum(["native", "cli", "sdk", "skill", "mcp", "adapter"]),
    source: identifier,
    description: z.string().min(1),
    taskFit: z.array(taskFitSchema).min(1).readonly().optional(),
    provides: z.array(identifier).min(1).readonly(),
    dependencies: z.array(requirementSchema).readonly(),
    permissions: z.array(identifier).readonly(),
    risk: z.number().int().min(0).max(3),
    providerSupport: z.strictObject({ grokbot: supportSchema, muse: supportSchema }).readonly(),
    verification: verificationSchema,
    delivery: deliverySchema,
    connector: connectorSchema.optional(),
  })
  .readonly();
export type Capability = z.infer<typeof capabilitySchema>;

export const packSchema = z
  .strictObject({
    apiVersion: z.literal("ohmy.dev/v0alpha1"),
    kind: z.literal("IndustryPack"),
    metadata: z
      .strictObject({
        name: identifier,
        version,
        maintainer: z.string().min(1),
        license: z.string().min(1),
        description: z.string().min(1),
        verification: verificationSchema,
      })
      .readonly(),
    spec: z
      .strictObject({
        providers: z
          .array(z.enum(["grokbot", "muse"]))
          .min(1)
          .readonly(),
        requirements: z.array(requirementSchema).min(1).readonly(),
        agents: z
          .array(
            z
              .strictObject({
                id: identifier,
                mission: z.string().min(1),
                skills: z.array(identifier).readonly(),
                expectedOutputs: z.array(z.string().min(1)).min(1).readonly(),
              })
              .readonly(),
          )
          .min(1)
          .readonly(),
        policies: z.array(identifier).readonly(),
      })
      .readonly(),
  })
  .readonly();
export type Pack = z.infer<typeof packSchema>;

export const registrySchema = z
  .strictObject({
    apiVersion: z.literal("ohmy.dev/v0alpha1"),
    upstreamLock: relativePath.optional(),
    sources: z.array(sourceSchema).readonly(),
    capabilities: z.array(capabilitySchema).readonly(),
    packs: z.array(packSchema).readonly(),
  })
  .readonly();
export type Registry = z.infer<typeof registrySchema>;
