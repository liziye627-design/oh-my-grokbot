import { open } from "node:fs/promises";
import { CoreError } from "../errors.js";
import type { IndustryManifest } from "../industry/contracts.js";
import { hash, safePath } from "../io.js";
import type { Workspace } from "./contracts.js";
import { prepareWorkspacePlan } from "./plan.js";

export async function prepareWorkspaceBundle(
  root: string,
  workspace: Workspace,
  manifest: IndustryManifest,
) {
  const plan = prepareWorkspacePlan(workspace, manifest);
  const sources: { readonly path: string; readonly sha256: string; readonly bytes: number }[] = [];
  const sections: string[] = [];
  let total = 0;
  for (const bot of plan.bots)
    for (const role of bot.roles) {
      const path = await safePath(root, role.promptFile);
      const file = await open(path, "r");
      let prompt: string;
      try {
        const stat = await file.stat();
        if (!stat.isFile() || stat.size > 65536)
          throw new CoreError(
            "WORKSPACE_PROMPT_SIZE",
            "Role prompt must be a regular file no larger than 64 KiB",
          );
        const bytes = Buffer.alloc(65537);
        const result = await file.read(bytes, 0, bytes.length, 0);
        if (result.bytesRead > 65536)
          throw new CoreError("WORKSPACE_PROMPT_SIZE", "Role prompt exceeds 64 KiB");
        prompt = new TextDecoder("utf-8", { fatal: true }).decode(
          bytes.subarray(0, result.bytesRead),
        );
        total += result.bytesRead;
        if (total > 524288)
          throw new CoreError("WORKSPACE_BUNDLE_SIZE", "Embedded role prompts exceed 512 KiB");
        sources.push({ path: role.promptFile, sha256: hash(prompt), bytes: result.bytesRead });
      } finally {
        await file.close();
      }
      sections.push(
        `<!-- source:${role.promptFile} -->\n${prompt}\n<!-- end-source:${role.promptFile} -->`,
      );
    }
  const native = {
    schemaVersion: plan.schemaVersion,
    workspaceId: plan.workspaceId,
    group: plan.group,
    pack: plan.pack,
    bots: plan.bots,
    workflows: plan.workflows,
    kickoffMessage: plan.kickoffMessage,
  };
  const markdown = `${[
    `# ${workspace.name} · 原生多 Bot 工作群启动包`,
    "请在当前原生 Grok Bot 账号中执行此启动包。目标是创建或复用以下命名 Bot，并建立真实多 Bot 工作群；上传文件本身不表示执行成功。",
    "## 执行约束与交付",
    "1. 检查当前真正可用的 Bot 创建、配置、群创建及加成员工具。仅使用已有工具；不要猜测 API、JSON 导入格式或绕过缺失权限。",
    "2. 按名册查找已有 Bot。唯一且匹配时复用；未找到时使用真实创建工具创建，重名歧义时报告 blocked。将下方完整角色提示词配置给对应 Bot。多个角色绑定同一 Bot 时保留全部职责。",
    "3. 逐项检查所需 Skills 是否真实可用并配置。技能名称不是安装证明；缺失项写入回执，不声明已安装。模板 URL 只作为参考，不导入凭据。",
    "4. 使用真实群工具创建或复用指定名称的群，将 2–6 个不同 Bot 加入，并由指定协调员发送启动消息、按工作流依赖交接。若无群工具，保留已完成的 Bot 创建结果，明确 groupStatus=blocked 及最小缺项，不假装群已建立。",
    "5. 执行一次可验证的角色交接，记录实际 Bot 标识、群标识、任务和产物依据。群聊不支持的批准流程必须转入支持批准的私有会话。凭据只能走私有配置，禁止写入群、文件或回执。",
    "6. 原生多 Bot 群是首要目标。Team Bots 的人类访问权限是独立配置；Gateway、Result MCP、飞书和人工成员管理是可选基础设施。下面角色原文中的 Gateway 提交流程仅在相应基础设施已接入时适用；否则保留本地成果和真实交接证据，报告该集成未启用。",
    "7. 返回实际执行回执：workspaceId、bots[{botName,id,status,evidence}]、group{id,status,evidence}、skills[{name,status}]、handoffEvidence、blockedReasons。使用 created/reused/verified/blocked 状态，仅凭实际工具回执和检查结果填写；尚无回执时整体保持 needs_human。",
    "## 原生创建与协作配置",
    `\`\`\`json\n${JSON.stringify(native, null, 2)}\n\`\`\``,
    "## 完整角色提示词",
    ...sections,
    "## 源文件校验清单",
    `\`\`\`json\n${JSON.stringify(sources, null, 2)}\n\`\`\``,
  ].join("\n\n")}\n`;
  return {
    status: "needs_human" as const,
    workspaceId: workspace.id,
    sha256: hash(markdown),
    sources,
    markdown,
  };
}
