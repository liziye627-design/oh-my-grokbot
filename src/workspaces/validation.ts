import { CoreError } from "../errors.js";
import type { Principal } from "../gateway/contracts.js";
import type { IndustryManifest } from "../industry/contracts.js";
import type { Workspace } from "./contracts.js";

function unique(values: readonly string[], label: string): void {
  if (new Set(values).size !== values.length)
    throw new CoreError("WORKSPACE_DUPLICATE", `Duplicate ${label}`);
}
export function validateWorkspaces(
  workspaces: readonly Workspace[],
  principals: readonly Principal[],
  manifests: readonly IndustryManifest[],
): void {
  unique(
    workspaces.map((workspace) => workspace.id),
    "workspace identifier",
  );
  unique(
    workspaces.map((workspace) => workspace.tenantId),
    "workspace tenant",
  );
  unique(
    principals.map((principal) => principal.id),
    "principal identifier",
  );
  unique(
    workspaces.flatMap((workspace) =>
      workspace.feishu
        ? [JSON.stringify([workspace.feishu.principalId, workspace.feishu.chatId])]
        : [],
    ),
    "channel group binding",
  );
  for (const workspace of workspaces) {
    const manifest = manifests.find((item) => item.pack.metadata.name === workspace.pack);
    if (!manifest)
      throw new CoreError("WORKSPACE_PACK_MISSING", "Workspace industry pack is unavailable");
    unique(workspace.workflows, "workspace workflow");
    unique(
      workspace.bindings.map((binding) => binding.role),
      "role binding",
    );
    unique(workspace.members.operators, "operator membership");
    unique(workspace.members.verifiers, "verifier membership");
    const roles = manifest.pack.spec.agents.map((role) => role.id);
    if (
      !roles.includes(workspace.coordinatorRole) ||
      roles.length !== workspace.bindings.length ||
      workspace.bindings.some((binding) => !roles.includes(binding.role))
    )
      throw new CoreError(
        "WORKSPACE_ROLE_INVALID",
        "Bind every industry role exactly once and select an existing coordinator",
      );
    const bots = new Set(workspace.bindings.map((binding) => binding.botName));
    if (bots.size < 2 || bots.size > 6)
      throw new CoreError(
        "WORKSPACE_BOT_COUNT",
        "Native group requires between two and six distinct Bots",
      );
    if (
      workspace.workflows.some((id) => !manifest.workflows.some((workflow) => workflow.id === id))
    )
      throw new CoreError(
        "WORKSPACE_WORKFLOW_INVALID",
        "Workspace selects an unavailable workflow",
      );
    const requirePrincipal = (id: string, role: Principal["role"]): Principal => {
      const principal = principals.find((item) => item.id === id);
      if (!principal || principal.tenantId !== workspace.tenantId || principal.role !== role)
        throw new CoreError(
          "WORKSPACE_MEMBER_INVALID",
          "Workspace principal must have the required role and tenant",
        );
      return principal;
    };
    for (const id of workspace.members.operators) requirePrincipal(id, "operator");
    for (const id of workspace.members.verifiers) requirePrincipal(id, "verifier");
    const allowed = new Set([
      ...workspace.members.operators,
      ...workspace.members.verifiers,
      ...(workspace.feishu ? [workspace.feishu.principalId] : []),
    ]);
    if (
      principals.some(
        (principal) => principal.tenantId === workspace.tenantId && !allowed.has(principal.id),
      )
    )
      throw new CoreError(
        "WORKSPACE_UNLISTED_MEMBER",
        "Every principal in a workspace tenant must be explicitly bound",
      );
    if (workspace.feishu) {
      const binding = workspace.feishu;
      const channel = requirePrincipal(binding.principalId, "channel");
      unique(
        binding.senders.map((sender) => sender.senderId),
        "Feishu sender mapping",
      );
      if (!channel.chats.includes(binding.chatId))
        throw new CoreError(
          "WORKSPACE_CHANNEL_SCOPE",
          "Workspace chat is outside the channel allowlist",
        );
      for (const sender of binding.senders) {
        requirePrincipal(sender.principalId, "operator");
        if (
          !workspace.members.operators.includes(sender.principalId) ||
          !channel.senders.includes(sender.senderId)
        )
          throw new CoreError(
            "WORKSPACE_CHANNEL_SCOPE",
            "Workspace sender must map to an allowed member operator",
          );
      }
    }
  }
}
