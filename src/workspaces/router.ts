import { identifier } from "../contracts/common.js";
import { CoreError } from "../errors.js";
import type { ChannelEvent, Identity } from "../gateway/contracts.js";
import { GatewayError } from "../gateway/errors.js";
import { requireRole } from "../gateway/tasks.js";
import type { IndustryManifest } from "../industry/contracts.js";
import {
  type IndustryPlanInput,
  industryPlanInputSchema,
  prepareIndustryPlan,
} from "../industry/plan.js";
import type { Workspace } from "./contracts.js";

const messageSchema = industryPlanInputSchema
  .unwrap()
  .pick({ objective: true, inputs: true })
  .extend({ workflow: identifier });

export class WorkspaceRouter {
  constructor(
    readonly workspaces: readonly Workspace[],
    readonly industries: readonly IndustryManifest[],
  ) {}
  configured(tenantId: string): boolean {
    return this.workspaces.some((workspace) => workspace.tenantId === tenantId);
  }
  list(identity: Identity): readonly Workspace[] {
    requireRole(identity, ["operator", "verifier"]);
    return this.workspaces.filter(
      (workspace) =>
        workspace.tenantId === identity.tenantId &&
        (identity.role === "operator"
          ? workspace.members.operators
          : workspace.members.verifiers
        ).includes(identity.id),
    );
  }
  prepare(identity: Identity, workspaceId: string, workflowId: string, input: IndustryPlanInput) {
    requireRole(identity, ["operator"]);
    const workspace = this.workspaces.find(
      (item) => item.id === workspaceId && item.tenantId === identity.tenantId,
    );
    if (!workspace) throw new GatewayError("WORKSPACE_NOT_FOUND", "Workspace is unavailable", 404);
    if (!workspace.members.operators.includes(identity.id))
      throw new GatewayError(
        "WORKSPACE_MEMBER_DENIED",
        "Workspace operator membership is required",
        403,
      );
    if (!workspace.workflows.includes(workflowId))
      throw new GatewayError(
        "WORKSPACE_WORKFLOW_DENIED",
        "Workflow is not enabled for this workspace",
        403,
      );
    const manifest = this.industries.find((item) => item.pack.metadata.name === workspace.pack);
    if (!manifest)
      throw new GatewayError("WORKSPACE_PACK_MISSING", "Workspace industry is unavailable", 404);
    try {
      const handoff = prepareIndustryPlan(manifest, workflowId, input);
      const objective = JSON.stringify({
        objective: input.objective,
        manifestDigest: handoff.manifestDigest,
        workflow: handoff.workflow,
        team: handoff.team,
        workspace: {
          id: workspace.id,
          name: workspace.name,
          coordinatorRole: workspace.coordinatorRole,
          bindings: workspace.bindings,
        },
        nativeActivation: "unverified",
      });
      if (objective.length > 16000)
        throw new GatewayError(
          "INDUSTRY_HANDOFF_TOO_LARGE",
          "Industry and workspace handoff exceed the 16000-character Gateway budget",
          400,
        );
      return {
        workspace,
        handoff: { ...handoff, taskRequest: { ...handoff.taskRequest, objective } },
      };
    } catch (error) {
      if (
        error instanceof CoreError &&
        ["INDUSTRY_INPUT_MISSING", "INDUSTRY_HANDOFF_TOO_LARGE"].includes(error.code)
      )
        throw new GatewayError(error.code, error.message, 400);
      throw error;
    }
  }
  receive(identity: Identity, event: ChannelEvent) {
    requireRole(identity, ["channel"]);
    const workspace = this.workspaces.find((item) => item.tenantId === identity.tenantId);
    if (!workspace) return undefined;
    const binding = workspace.feishu;
    if (
      !binding ||
      binding.principalId !== identity.id ||
      binding.chatId !== event.chatId ||
      !event.mentionedBot
    )
      throw new GatewayError(
        "WORKSPACE_CHANNEL_DENIED",
        "Channel does not match the configured workspace",
        403,
      );
    const sender = binding.senders.find((item) => item.senderId === event.senderId);
    if (!sender)
      throw new GatewayError(
        "WORKSPACE_SENDER_DENIED",
        "Sender is not mapped to a workspace operator",
        403,
      );
    const message = messageSchema.parse(JSON.parse(event.content));
    const routed = this.prepare(
      { id: sender.principalId, tenantId: workspace.tenantId, role: "operator" },
      workspace.id,
      message.workflow,
      { objective: message.objective, inputs: message.inputs, eventId: event.messageId },
    );
    return { ...routed, requestedBy: sender.principalId };
  }
}
