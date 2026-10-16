# 行业数字员工

行业层复用 Core Installer、Gateway、Result MCP、审批和 Outbox。原生 Grok Bot
执行岗位任务与 Bot 交接；行业层提供可安装的团队资源、经过校验的流程和任务输入。
岗位职责和推荐组合见 [Bot 操作指南](bot-playbook.md)。

## 团队目录

| 行业包 | 业务范围 | 资源与验收案例 |
| --- | --- | --- |
| `oh-my-design-studio` | 组件需求、点名动效、参考架和独立验收 | [设计工作室](../industries/design-studio/README.md) |
| `oh-my-content-studio` | 一篇内容从简报到公众号正文、X 剪裁和发布前交接 | [Content Studio](../industries/content-studio/README.md) |
| `oh-my-research-lab` | 来源研究、行业与竞品、事实审查 | [Research Lab](../industries/research-lab/README.md) |
| `oh-my-x-growth` | 增长工作组的当前渠道：短帖、线程、长文草稿和数据复盘。后续平台加入同一工作组 | [增长工作组](../industries/x-growth/README.md) |
| `oh-my-wechat` | 个人公众号文风、大纲、正文、标题和审稿 | [WeChat](../industries/wechat/README.md) |
| `oh-my-app-studio` | 产品规格、开发、缺陷修复、测试与发布准备 | [App Studio](../industries/app-studio/README.md) |
| `oh-my-video-studio` | 策划、脚本、素材、剪辑与媒体验收 | [Video Studio](../industries/video-studio/README.md) |
| `oh-my-sales-team` | 线索、公司核查、方案草稿、外联前交接 | [Sales Team](../industries/sales-team/README.md) |
| `oh-my-office-team` | 会议、文档、指标和日程草案 | [Office Team](../industries/office-team/README.md) |
| `oh-my-business-operations` | 会议行动项、客服分流、经营周报 | [Business Operations](../industries/business-operations/README.md) |
| `oh-my-engineering-lab` | 需求、固件计划、模型计划、测试记录 | [Engineering Lab](../industries/engineering-lab/README.md) |
| `oh-my-reverse-lab` | 书面授权后的本地样本观察笔记 | [Reverse Lab](../industries/reverse-lab/README.md) |
| `oh-my-specialist-lab` | 视觉评测、游戏规则、市场研究笔记 | [Specialist Lab](../industries/specialist-lab/README.md) |
| `oh-my-market-desk` | 公开行情与公告的研究、模拟笔记和独立审稿 | [Market Desk](../industries/market-desk/README.md) |
| `oh-my-solo-company` | 机会、报价草稿、交付清单、经营复盘 | [Solo Company](../industries/solo-company/README.md) |

岗位说明、示例和验收标准保存在各行业目录。示例数据是测试材料，不能当成真实客户
结果。当前共 75 个岗位、40 条工作流。行业清单由 `industry.json` 声明，引用已冻结的 Core Skills；原生账号、连接器
授权与外部工具安装不会随模板复制。外部引擎、浏览器、编码工作区、媒体工具和连接器在注册表中是 reference，缺失时为 skipped。

## 内容生产链路

个人创作优先安装 `oh-my-content-studio`。`produce-piece` 把简报、来源、文风、大纲、公众号正文、标题、X 线程和短帖放在同一次交接里，审稿后停在发布前。`next-topics` 只根据作者导出的数据准备下一题。

增长工作组当前用 `oh-my-x-growth` 跑选题、草稿和复盘，后续平台的增长流程加进同一组。只做公众号时用 `oh-my-wechat`。排版、微信草稿箱和各平台发布仍由作者在对应后台确认。

## 安装与使用

先列出团队，再写出自己要的包名。`choose` 只记录选择，不会安装。确认之后，对每一个选中的包装单独执行 `install`。

```bash
pnpm build
pnpm ohmy --json industry list
pnpm ohmy --json industry choose oh-my-content-studio oh-my-reverse-lab --out selection.json
pnpm ohmy --json industry inspect oh-my-x-growth
pnpm ohmy --json plan oh-my-x-growth
pnpm ohmy --workspace ./team-workspace install oh-my-x-growth --yes --allow-unverified
```

安装返回 `needs_human`（退出码 2）表示本地文件已经部署、原生导入与账号验收仍待完成。
使用 `status` 查看安装 ID，使用 `verify` 检查部署文件；`rollback <id> --yes` 仅移除
该安装拥有且内容未变化的文件。行业团队资源和现有 Core Skills 都进入同一份锁定计划。

选择某个 workflow，按照其 `requiredInputs` 准备 JSON 字符串映射，然后运行：

```bash
pnpm ohmy --json industry plan oh-my-x-growth WORKFLOW_ID --objective "业务目标" --inputs inputs.json --out handoff.json
```

输出供操作者检查岗位、步骤、输入和成果要求，再交给原生团队。不要把 API 密钥、
Cookie 或账户密码写进 inputs、handoff 或长期 Bot 提示词。

Gateway 启动步骤见 [Gateway 操作指南](gateway.md)。使用 operator 凭据调用
`GET /v1/industries` 可列出行业流程；调用
`POST /v1/industries/:pack/workflows/:workflow/tasks`，提交 `eventId`、`objective`、
`inputs`（可选 `deadline`），建立对应行业与入口岗位的任务。租户来自认证身份。
行业目标上限为 4,000 字符；包含团队与流程的 JSON 交接内容总上限为 16,000 字符，
编码后超限会明确拒绝，不截断工作要求。inputs 最多 40 项，每项引用最多 1,800 字符。
相同事件与内容重放复用任务，更改内容后重用事件 ID 会被拒绝。

创建后的任务沿用 `/v1/tasks/:id/claim` 和六个 Result MCP 工具。领取结果中的凭据
只用于该 taskId/runId；操作者通过受支持的原生配置方式交给执行团队。原生触发入口
仍处于 `manual_native`，不会因为行业任务入库而自动启动 Grok Bot。

## 业务验收

1. 按任务保存的工作流完成岗位交接，保留输入来源与实际执行记录。
2. 每一步交付 `requiredArtifacts`，由 reviewer 按 `acceptanceCriteria` 检查。
3. 通过 `submit_artifact` 提交文本文件与 SHA-256；`complete_task` 仅进入 verifying。
4. 独立 operator/verifier 下载、阅读并验证业务成果，再决定接受或拒绝。
5. 验收结果进入 Outbox。真实通道是否投递成功以远端回执为准；不确定状态人工核对。

视频、图片、二进制应用包目前需要宿主交付位置，以及可读取的校验清单、哈希和实际
工具运行记录；Result MCP 当前提交 UTF-8 文本，不能直接上传大型二进制文件。

工作流依赖、岗位引用和输入校验由代码执行。业务质量、原生 Bot 交接与每步执行由
原生团队及独立验收者落实；当前没有在 Gateway 另建逐步骤自动调度器。审批记录
也不会自动执行发布、部署、发信或修改外部业务系统。

## 上线条件

本地安装与 HTTP/MCP 验收覆盖行业资源交付和任务协议。真实业务上线还需对目标账号
完成一次实际原生执行、业务成果验收及连接器回传；素材版权、账号权限和业务数据
由各行业操作指南列出。共享 Grok Bot 云电脑中的岗位不构成租户隔离。

## 本地验证

```bash
pnpm test
pnpm industry:smoke
```

全部行业包 smoke 使用临时目录、真实本地 HTTP 和官方 MCP 客户端，验证安装与回滚、
任务创建、持久化交接、成果提交、独立验收和本地回执。它提交明确标记的协议测试
材料，不代表四个行业的真实业务已执行。证据见 `.omo/evidence/industry-smoke.json`。

### 第二层的专业内容能力

内容团队和公众号团队升级到 0.2.0，已绑定四个 bundled 专业 Skills：宝玉采集、排版、草稿交付与卡兹克写作方法。第二层是 Bot 的核心工作方法与执行能力；第一层继续负责安装、连接和可靠性。见 [实际运行与文章验收](content-production.md)。
