import { CoreError } from "../errors.js";
import type { IndustryManifest } from "../industry/contracts.js";
import type { Workspace } from "./contracts.js";

export function prepareWorkspacePlan(workspace: Workspace, manifest: IndustryManifest) {
  if (workspace.pack !== manifest.pack.metadata.name)
    throw new CoreError("WORKSPACE_PACK_MISMATCH", "Workspace and industry manifest must agree");
  const bots = [...new Set(workspace.bindings.map((binding) => binding.botName))].map(
    (botName) => ({
      botName,
      roles: workspace.bindings
        .filter((binding) => binding.botName === botName)
        .map((binding) => {
          const role = manifest.pack.spec.agents.find((agent) => agent.id === binding.role);
          if (!role) throw new CoreError("WORKSPACE_ROLE_INVALID", "Role binding is unavailable");
          return {
            ...role,
            promptFile: `industries/${manifest.pack.metadata.name.replace(/^oh-my-/, "")}/prompts/${role.id}.md`,
            templateUrl: binding.templateUrl ?? null,
          };
        }),
    }),
  );
  const coordinator = workspace.bindings.find(
    (binding) => binding.role === workspace.coordinatorRole,
  );
  if (!coordinator)
    throw new CoreError("WORKSPACE_ROLE_INVALID", "Coordinator must have a native Bot binding");
  return {
    schemaVersion: "0.1" as const,
    status: "needs_human" as const,
    dispatch: "manual_native" as const,
    workspaceId: workspace.id,
    tenantId: workspace.tenantId,
    group: { name: workspace.name, botCount: bots.length, coordinatorBot: coordinator.botName },
    pack: { id: workspace.pack, version: manifest.pack.metadata.version },
    bots,
    workflows: manifest.workflows.filter((workflow) => workspace.workflows.includes(workflow.id)),
    members: workspace.members,
    channelBinding: workspace.feishu ?? null,
    kickoffMessage: `工作组：${workspace.name}。由 ${coordinator.botName} 协调 ${workspace.coordinatorRole}；仅执行已登记流程：${workspace.workflows.join("、")}。各 Bot 按角色交付成果与依据，交付后由独立验收人核对。尚未接入真实账号时保持待人工配置状态。请勿在群内发送任务令牌、登录凭据或批准敏感外部操作。`,
    setup: [
      "将自包含启动包上传给原生 Bot，请它通过真实可用工具创建或复用清单中的 Bot；逐项配置角色说明与 Skills，工具缺失时报告 blocked。",
      "创建包含 2–6 个不同 Bot 的工作群，核对协调员和角色分工。Team Bots 的团队成员访问配置是独立步骤，不等于已经创建 Bot 协作群。",
      "群聊不承担敏感操作批准；在支持批准的私有会话或 Gateway 操作员界面核对确切载荷后再批准。",
      "Gateway、MCP、飞书和人工成员管理属于可选基础设施；如启用，单独通过私有凭据配置，禁止将任务令牌或密码写入群消息、模板或本计划。",
      "先完成原生多 Bot 群的创建与一次真实协作交接，返回 Bot 和群的实际标识及回执；可选基础设施另行验收。本地生成计划不代表已创建或激活。",
    ],
  };
}
