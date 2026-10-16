import { z } from "zod";
import { identifier, publicUrl } from "../contracts/common.js";

export const workspaceSchema = z
  .strictObject({
    id: identifier,
    name: z.string().trim().min(1).max(200),
    tenantId: identifier,
    pack: identifier,
    workflows: z.array(identifier).min(1).readonly(),
    coordinatorRole: identifier,
    bindings: z
      .array(
        z
          .strictObject({
            role: identifier,
            botName: z.string().trim().min(1).max(100),
            templateUrl: publicUrl.optional(),
          })
          .readonly(),
      )
      .min(1)
      .readonly(),
    members: z
      .strictObject({
        operators: z.array(identifier).min(1).readonly(),
        verifiers: z.array(identifier).min(1).readonly(),
      })
      .readonly(),
    feishu: z
      .strictObject({
        principalId: identifier,
        chatId: z.string().trim().min(1).max(200),
        senders: z
          .array(
            z
              .strictObject({
                senderId: z.string().trim().min(1).max(200),
                principalId: identifier,
              })
              .readonly(),
          )
          .min(1)
          .readonly(),
      })
      .readonly()
      .optional(),
  })
  .readonly();
export type Workspace = z.infer<typeof workspaceSchema>;
