import { z } from "zod";
import { identifier, publicUrl } from "./common.js";

export const socialPlatformSchema = z.enum(["x", "bluesky", "mastodon", "youtube"]);
export type SocialPlatform = z.infer<typeof socialPlatformSchema>;
export const socialQuerySchema = z
  .strictObject({
    platform: socialPlatformSchema,
    query: z.string().trim().min(1).max(512),
    limit: z.number().int().min(1).max(40).default(10),
  })
  .readonly();
export type SocialQuery = z.infer<typeof socialQuerySchema>;
export const connectorSchema = z
  .strictObject({
    platform: identifier,
    stage: z.enum(["read_adapter", "reference_only"]),
    auth: z.enum(["public", "bearer", "api_key", "oauth_app_review"]),
    credentialEnv: z
      .string()
      .regex(/^[A-Z][A-Z0-9_]+$/)
      .optional(),
    readOperations: z.array(z.literal("search")).readonly(),
    writeOperations: z.array(z.string()).length(0).readonly(),
    documentation: publicUrl,
    limitations: z.array(z.string().min(1)).min(1).readonly(),
  })
  .readonly();
export const socialItemSchema = z
  .strictObject({
    id: z.string().min(1),
    url: z.url({ protocol: /^https$/ }),
    author: z.string(),
    text: z.string(),
    contentFormat: z.enum(["text", "html"]),
    publishedAt: z.iso.datetime({ offset: true }).nullable(),
  })
  .readonly();
export type SocialItem = z.infer<typeof socialItemSchema>;
export const socialResultSchema = z
  .strictObject({
    platform: socialPlatformSchema,
    query: z.string(),
    retrievedAt: z.iso.datetime(),
    requests: z.literal(1),
    truncated: z.boolean(),
    items: z.array(socialItemSchema).readonly(),
    warnings: z.array(z.string()).readonly(),
  })
  .readonly();
export type SocialResult = z.infer<typeof socialResultSchema>;
