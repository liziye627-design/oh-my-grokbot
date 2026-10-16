import { z } from "zod";
import { identifier } from "../contracts/common.js";
import { packSchema } from "../contracts/registry.js";

export const industryInputKey = z.string().regex(/^[a-z][a-zA-Z0-9_-]{0,63}$/);
const strings = z.array(z.string().trim().min(1)).min(1).readonly();
export const workflowSchema = z
  .strictObject({
    id: identifier,
    name: z.string().trim().min(1),
    entryRole: identifier,
    requiredInputs: z.array(industryInputKey).readonly(),
    approvalRequired: z.boolean(),
    steps: z
      .array(
        z
          .strictObject({
            id: identifier,
            role: identifier,
            dependsOn: z.array(identifier).readonly(),
            requiredArtifacts: strings,
            acceptanceCriteria: strings,
          })
          .readonly(),
      )
      .min(1)
      .max(100)
      .readonly(),
  })
  .readonly();
export const industryManifestSchema = z
  .strictObject({
    pack: packSchema,
    workflows: z.array(workflowSchema).min(1).max(50).readonly(),
  })
  .readonly();
export type IndustryManifest = z.infer<typeof industryManifestSchema>;
export type Workflow = z.infer<typeof workflowSchema>;
