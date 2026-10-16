import { z } from "zod";
import { identifier, publicUrl, relativePath, sha256 } from "./common.js";

const fileSchema = z.strictObject({ path: relativePath, sha256 });
export const provenanceSchema = z
  .strictObject({
    schemaVersion: z.literal("0.1"),
    sources: z
      .array(
        z
          .strictObject({
            id: identifier,
            repository: publicUrl.refine((value) =>
              /^https:\/\/github\.com\/[^/]+\/[^/]+$/.test(value),
            ),
            commit: z.string().regex(/^[a-f0-9]{40}$/),
            license: z.enum(["MIT", "Apache-2.0"]),
            files: z
              .array(fileSchema.extend({ role: z.enum(["license", "reference"]) }))
              .min(2)
              .readonly(),
          })
          .readonly(),
      )
      .min(1)
      .readonly(),
    adaptations: z
      .array(
        z
          .strictObject({
            skill: identifier,
            directory: relativePath,
            upstreams: z.array(identifier).min(1).readonly(),
            files: z.array(fileSchema).min(3).readonly(),
          })
          .readonly(),
      )
      .min(1)
      .readonly(),
  })
  .readonly();
export type Provenance = z.infer<typeof provenanceSchema>;
