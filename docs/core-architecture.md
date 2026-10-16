# Core Installer 与 Gateway 架构契约

依据：2026-10-14 主 PRD、01—05 子文档，以及用户补充的《Oh My Core 核心技术架构与连接方案》。
Alpha 1 安装层与 Alpha 2 本地集成层已实现；连接 Spike 保留真实账号和原生触发的独立验收门槛。

## 模块

| 目录 | 职责 |
| --- | --- |
| `src/contracts` | Capability、Pack、Task、Evidence、Plan、Installation 的输入边界 |
| `src/registry` | 来源引用、唯一性、许可交付限制、版本/能力解析和 Skill 格式 |
| `src/providers` | 生成原生配置指引与待验证项 |
| `src/installer` | 生成精确计划、部署、所有权日志、诊断、校验与回滚 |
| `src/commands` | CLI 参数与结果协议 |
| `src/gateway` | HTTP/MCP、SQLite 台账、身份、交付物、审批、Outbox 与飞书 SDK 适配 |
| `registry` | 不执行代码的静态资源清单 |
| `skills` | 十二个 Core 方法及两个社交方法；基于许可明确的上游适配 |
| `schemas` | 由 Zod 导出的 JSON Schema |

使用 Node.js、TypeScript、Zod、Commander、YAML、semver，开发验证使用 Biome 与 Vitest。
Gateway 使用 Hono、Node 内置 SQLite、官方 MCP SDK 和飞书 Channel SDK；没有引入独立消息队列或 ORM，也未使用未公开的原生 Grok Bot 触发接口。

## 三个契约

Capability 描述能力、实现种类、来源、版本、权限、风险、宿主支持状态与交付模式。
Resolver 选择顺序为 native → CLI/SDK → Skill → MCP → 自定义 adapter。需求若标明
text、image、audio 或 code，同类中先选声明了该形态的能力，再选较新兼容版本；
未声明形态的能力仍可被选中。更低信任等级即使声明了形态，也不越过更高信任等级。
冲突时回溯。点名的第三方模型只有在注册表中有已审核条目时才算候选。可选依赖缺失必须返回 skipped，循环和不可满足约束必须失败。

Task 含 schemaVersion、taskId、runId、tenantId、requestedBy、assignedRole、输入引用、
目标、审批策略和截止时间。Gateway 在 SQLite 保存任务及状态转移；queued 任务由 operator 人工领取，暂未自动调度原生 Bot。

Evidence 通过 taskId/runId/tenantId 关联任务及提交者，记录交付物引用、哈希与验证状态。
`submitted` 和 `verified` 分离；verified 必须有验证时间。Schema 本身不认证调用者。Gateway 根据 Bearer 身份检查租户、taskId/runId 与验收权限；runner 只能提交交付物和完成声明，验收时重新读取文件并校验哈希，随后由 operator/verifier 决定结果。

## 安装信任边界

- 注册表是操作者选择的本地可信配置。CLI 不从网络发现后立即执行资源。
- 当前 delivery 支持 bundled 和 reference；reference 输出人工步骤，不假装完成部署。
- 锁文件包含精确版本、注册表摘要、文件 SHA-256、权限及待验证项。
- apply 根据当前可信注册表和本地资源重新生成计划，拒绝被修改或过期的锁文件。
- SHA-256 检测漂移，不是作者签名。远程 Registry、签名和第三方 Managed Install 尚未实现。
- 文件只写入 `.ohmy`；拒绝路径逃逸、符号链接/目录联接、覆盖不同内容的已有文件。
- 独占锁防止并发变更；部署前保存安装记录，异常标记 failed，留待明确恢复。
- 不读取环境变量中的业务凭据，也不运行注册表中的 Shell 命令或第三方安装脚本。
- JSONL 审计仅保存事件码、安装 ID 和时间，不写完整业务输入或错误原始载荷。

安装状态为 installing → needs_human / failed → rolled_back。
当前没有 installed 状态，因为没有接通可认证的原生验收证据；本地文件匹配不等于整个
原生团队已通过验收。后续应以明确的独立验证协议推进到 installed。

## 原生能力与后续接口

支持原生 Bot 模板、Skills/Routines 和共享工作区的事实来自官方资料；具体账号状态仍需实测。
Grok Bot 的 Bots 共享文件及登录，岗位不是租户隔离。Gateway 已使用独立凭据引用、
租户授权和任务级工具凭证，但这些检查不隔离同一操作系统账号下的进程，不能把共享云电脑当作陌生租户之间的安全边界。

Alpha 2 已实现 Result MCP、SQLite Task Ledger、精确提案审批、Outbox 和官方 Feishu Channel SDK 适配。原生触发、真实账号接入与原生 MCP 绑定仍待实测；审批尚未连接外部写入执行器，Guardian 尚未实现。`doctor` 继续保留原生账号/连接待验证状态。

任务凭证最长有效一小时且绑定一个 taskId/runId，账本仅保存凭证哈希。完成声明先进入 verifying；独立验收与 Outbox 入队在同一事务中完成。通知发送先记 sending，成功保存远端回执；不确定发送进入 needs_human，恢复时不盲目重发。

Gateway 默认只监听 loopback，配置保存凭据环境变量名称，业务账本与交付物保存在 `.ohmy/gateway/`。接口、启动和恢复步骤见 [Gateway 操作指南](gateway.md)。

## 第二层内容 Bot 核心（2026-10-16）

第一层保持安装、连接与可靠性；第二层组织岗位、专业方法、工具执行和成果验收。
内容 Bot 使用四个已锁定的专业 Skills：宝玉采集、宝玉排版、宝玉草稿交付、卡兹克长文方法。
它们不是第二套 Agent 框架。详细契约、安装与真实文章证据见 [内容生产](content-production.md)。
