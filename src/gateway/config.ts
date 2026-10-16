import { z } from "zod";
import { workspaceSchema } from "../workspaces/contracts.js";
import { principalSchema } from "./contracts.js";
export const gatewayConfigSchema = z
  .strictObject({
    schemaVersion: z.literal("0.1"),
    host: z.literal("127.0.0.1").default("127.0.0.1"),
    port: z.number().int().min(0).max(65535).default(19741),
    principals: z.array(principalSchema).min(1).readonly(),
    workspaces: z.array(workspaceSchema).readonly().default([]),
    feishu: z
      .strictObject({
        principalId: z.string(),
        appIdEnv: z.string().regex(/^[A-Z][A-Z0-9_]+$/),
        appSecretEnv: z.string().regex(/^[A-Z][A-Z0-9_]+$/),
      })
      .readonly()
      .optional(),
  })
  .readonly()
  .refine(
    (config) => new Set(config.principals.map((item) => item.id)).size === config.principals.length,
    "Principal identifiers must be unique",
  );
export type GatewayConfig = z.infer<typeof gatewayConfigSchema>;
