# Bot 操作指南与组合

十六套团队、75 个岗位、40 条工作流。每套团队自己成群，原生群组放 2–6 个不同的 Bot。`industry choose` 只记录选择；对选中的包再执行 `install`。安装返回 `needs_human`、退出码 2 时，本地文件已经放下，账号里的 Bot 还要逐个核对。

岗位说明在 `industries/<团队>/prompts/`。上传包在 `examples/workspaces/generated/`。已登录账号里的真实标识见 [原生群组](native-groups.md)。

## 现在账号里有什么

Grok Bot 0.71.2 里已经有这些专职 Bot：

- 应用开发工作组：`app-studio/product-analyst`、`architect`、`implementer`、`qa`、`reviewer`。
- 逆向实验室：三个 Bot 和一个三人群。群的显示名仍是成员名单。
- 市场研究台：六个 Bot 的岗位说明已写入。`market-research` 技能文件在本机 `~/.grok/skills/market-research`。按 Bot 绑定技能被宿主拒绝。

拒绝原因：这六个 Bot 的 harness 是 `temporal`，名单里的 `serverId` 为空。`addGrokBotAgentSkill` 要求先把 Bot 分享给团队才能管理插件。`setGrokBotAgentVisibility` 返回 `unsupported_harness`，写入团队访问也返回 `failed_precondition`。2026-10-16 再次打开电脑面板时，屏幕仍是「电脑正在休眠」，阶段为 `settled`，没法在那台电脑上完成上传。

市场研究台不连接券商，不生成订单。逆向实验室先要有点名样本和归属方的书面授权。

## 一次任务怎么走

1. 选定团队和工作流。工作流标了批准的，先由操作者确认输入。
2. 协调员按步骤把任务交给对应岗位。每次交接带上任务标识、当前负责人、输入来源、产物路径和 SHA-256、验收条件、下一岗位或阻塞原因。
3. 每个岗位只写自己的产物。缺输入就停下并记下缺口。
4. 独立审稿岗位退回口径不一致、没有来源或越权的笔记。`complete_task` 只进入待验收。
5. 发布、外发、付款、写入外部日历和账户，停在批准之后。

本地计划：

```bash
pnpm build
pnpm ohmy --json industry choose oh-my-content-studio --out selection.json
pnpm ohmy --workspace ./team-workspace install oh-my-content-studio --yes --allow-unverified
pnpm ohmy --json workspace bundle --config examples/workspaces.config.json --id content-studio --out examples/workspaces/generated/content-studio.md
```

## 组合

| 组合 | 一起用的团队 | 交接 |
| --- | --- | --- |
| 个人内容 | `content-studio`；只做公众号时加 `wechat`；要短帖、线程和复盘时加 `x-growth` | 简报和来源进 `produce-piece`。审稿后停在发布前。公众号正文再进 `write-article`。短帖和线程进 `write-thread` 或 `write-article`。导出数据进 `next-topics` 或 `export-analytics`。 |
| 做一个产品 | `research-lab`、`design-studio`、`app-studio`、`video-studio`，需要排期时加 `core-team` | 研究问题进 `deep-report`。组件清单进 `specify-component`。仓库和验收样例进 `build-feature`。成片简报进 `produce-video`。`core-team` 的 `assign-work` 只拆任务，不代替各队审稿。 |
| 一人公司一周 | `solo-company`、`sales-team`、`office-team`、`business-operations` | 一件事进 `operate-engagement`。公开线索进 `qualify-lead`，方案进 `write-proposal`，外发前停下。会议记录进 `meeting-pack`。工单和周报进 `support-triage`、`business-weekly`。付款不由 `finance-reviewer` 执行。 |
| 公开市场研究 | `market-desk`；视觉、游戏或模型评测另用 `specialist-lab` | 名单、时间窗口和操作者提供的表进 `define-universe`，齐了再进 `write-thesis`。行情表没有就记缺口，不补价格。`specialist-lab` 的 `market-study` 同样只写研究笔记。 |
| 授权样本 | `reverse-lab` 单独成组 | 先跑 `confirm-scope`。授权记录和样本引用齐了，才跑 `analyze-artifact`。笔记只写行为、证据路径、限制和未知项。 |
| 设备或模型 | `engineering-lab` | 板级需求进 `firmware-delivery`。运行时和评估集进 `model-delivery`。没跑的测试保持未运行。 |

不要把市场研究台和销售外发放进同一个批准步骤。不要把逆向实验室的样本交给没有授权记录的内容团队。

## 各队岗位

### 内容

`oh-my-content-studio`：`producer` 收范围并准备发布交接；`researcher` 收集来源；`voice-keeper` 定文风和大纲；`drafter` 写公众号正文；`channel-editor` 出标题、线程和短帖；`reviewer` 退回没有来源的数字和过度标题。工作流 `produce-piece`（批准）、`next-topics`、`geo-content-brief`。

`oh-my-wechat`：`voice-keeper` 从旧文提取文风；`drafter` 写正文；`title-editor` 给备选标题；`reviewer` 独立审稿。工作流 `capture-voice`、`write-article`（批准）。草稿箱写入要另有账户授权。

`oh-my-x-growth`：`scout` 提取候选话题；`researcher` 核对事实；`editor` 写草稿和日历；`reviewer` 独立检查；`operations` 核算导出指标并准备审批包。工作流 `topic-research`、`content-calendar`（批准）、`export-analytics`、`write-thread`（批准）、`write-article`（批准）。

`oh-my-video-studio`：`producer` 持有简报和权利；`researcher` 核对主张；`scriptwriter` 写分镜；`editor` 记录渲染；`qa` 检查成片。工作流 `produce-video`、`repurpose-media`，都要批准。

### 产品与研究

`oh-my-research-lab`：`research-director` 拆问题；`source-researcher` 收集来源；`industry-analyst` 整理行业结构；`competitor-scout` 对照竞品；`fact-checker` 逐条核对；`trend-hunter` 记录时间窗内的重复信号。工作流 `deep-report`、`competitor-scan`、`trend-scan`。

`oh-my-design-studio`：`art-director` 定审美方向；`reference-scout` 打开参考架；`interface-designer` 写组件需求；`motion-designer` 为每个组件指定一条过渡；`design-reviewer` 退回没有功能理由的动效。工作流 `specify-component`、`motion-audit`，都要批准。

`oh-my-app-studio`：`product-analyst` 写需求和验收样例；`architect` 设计最小变更；`implementer` 在授权工作区交补丁；`qa` 保存测试命令和退出码；`reviewer` 独立通过或退回。工作流 `build-feature`、`fix-bug`、`prepare-release`（批准）。

`oh-my-engineering-lab`：`requirements-engineer` 写可观察的输入和约束；`embedded-engineer` 写固件计划；`ai-engineer` 写模型打包和评估；`test-engineer` 记录测试结果。工作流 `firmware-delivery`、`model-delivery`。

`oh-my-core-team`：`chief-of-staff` 对操作者说话并拆目标；`task-planner` 写步骤；`evidence-reviewer` 核对验收；`knowledge-keeper` 把已验收材料写入知识记录。工作流 `assign-work`、`retain-knowledge`、`review-week`。

### 经营

`oh-my-solo-company`：`chief-of-staff` 选一件事；`opportunity-researcher` 核查机会；`sales-lead` 起草报价；`delivery-engineer` 写交付清单；`finance-reviewer` 复盘工时和成本，不执行付款。工作流 `operate-engagement`（批准）。

`oh-my-sales-team`：`lead-hunter` 整理公开线索；`company-researcher` 核对公司事实；`sales-engineer` 判断是否匹配；`proposal-writer` 起草方案；`crm-manager` 整理交接，不写入外部系统。工作流 `qualify-lead`、`write-proposal`（批准）。

`oh-my-office-team`：`meeting-secretary` 提取决定和负责人；`document-specialist` 整理文档；`data-analyst` 按给定口径计算；`schedule-manager` 草拟日程，改外部日历前停下。工作流 `meeting-pack`（批准）、`data-brief`。

`oh-my-business-operations`：`operations-coordinator` 保持负责人和未决事项；`operations-analyst` 按导出数据计算；`customer-support` 分流工单并起草回复；`operations-reviewer` 独立检查。工作流 `meeting-followup`、`support-triage`、`business-weekly`。

### 单独成组

`oh-my-market-desk`：`universe-clerk` 记名单和时间窗口；`filings-reader` 记公告和财务数字；`news-reader` 记新闻和舆情；`tape-reader` 只读操作者提供的行情表；`thesis-writer` 分开写支持、反对和模拟；`risk-reviewer` 退回订单和收益承诺。工作流 `define-universe`、`write-thesis`，都要批准。

`oh-my-specialist-lab`：`computer-vision-engineer` 记录测量；`game-designer` 写可检查的规则；`financial-researcher` 写公开市场笔记；`model-evaluator` 独立检查。工作流 `market-study`、`vision-check`、`game-concept`。不提供诊断、法律决定或真实交易。

`oh-my-reverse-lab`：`authorization-clerk` 核对书面授权；`reverse-engineer` 写观察笔记；`evidence-reviewer` 退回超出范围的笔记。工作流 `confirm-scope`、`analyze-artifact`，都要批准。
