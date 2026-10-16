# 原生 Bot 群组与上传初始化包

目标：把行业岗位、角色说明和工作流交给 Grok Bot，由宿主中的 Bot 执行创建、配置和协作。当前已实现本地生成与任务链路；账号里的 Bot、群组和连接器尚未验收。

## 上传入口

运行 `pnpm build`，然后为一个工作组生成可上传的 Markdown：

```shell
node dist/cli.js workspace bundle --config examples/workspaces.config.json --id app-studio --out examples/workspaces/generated/app-studio.md
```

输出 `needs_human`、退出码 2 表示文件已准备好，宿主创建尚未确认，不是已创建成功。将生成的 Markdown 附到 Grok Bot 的私聊，发送：

> 请执行附件中的初始化流程，创建或复用列出的专职 Bot，配置角色说明并组织协作群组。先核对当前实际对象，避免重复创建；逐项返回真实 Bot 和群组标识、验证结果及阻塞项。工具不支持的步骤请明确报告，不要用计划替代成功结果。

初始化包内嵌岗位说明和工作流，不要求 Grok 访问这台电脑的文件路径。它是执行说明文档，不是官方模板导入格式。Skills 名称是能力需求，不能据此宣称已安装；连接器授权与凭据仍要在宿主私有入口配置。无需上传 Gateway 配置文件。

官方说明 Bot 可以创建专职 Bot，并支持文件附件；尚未查到通用的批量创建 Bot / 群组公开接口。自动创建能否完成取决于宿主当前工具、权限和账号功能。官方模板链接的 Add / Import 是另一条复用入口，不等于支持任意 JSON 导入。

来源：[创建与管理 Bot](https://docs.x.ai/grok-bot/bots)、[文件附件](https://docs.x.ai/grok-bot/files-and-results)。

## 工作组

增长工作组是统一的增长圈子。当前登记的流程是选题、内容日历、导出复盘、线程草稿和长文草稿；后续平台的增长流程加进同一组。行业包名仍是 `oh-my-x-growth`，因为现有岗位说明和验收样例还是这一渠道。

| 配置 ID | 群组 | 岗位数 | 工作流数 | 协调员 |
| --- | --- | ---: | ---: | --- |
| growth | 增长工作组 | 5 | 5 | scout |
| app-studio | 应用开发工作组 | 5 | 3 | product-analyst |
| video-studio | 视频制作工作组 | 5 | 2 | producer |
| business-operations | 业务运营工作组 | 4 | 3 | operations-coordinator |
| content-studio | 内容生产工作组 | 6 | 2 | producer |
| reverse-lab | 逆向实验室 | 3 | 2 | authorization-clerk |
| market-desk | 市场研究台 | 6 | 2 | universe-clerk |
| core-team | 核心团队 | 4 | 3 | chief-of-staff |
| wechat | 公众号工作组 | 4 | 2 | voice-keeper |
| solo-company | 一人公司 | 5 | 1 | chief-of-staff |
| sales-team | 销售工作组 | 5 | 2 | lead-hunter |
| research-lab | 研究实验室 | 6 | 3 | research-director |
| office-team | 办公室工作组 | 4 | 2 | meeting-secretary |
| engineering-lab | 工程实验室 | 4 | 2 | requirements-engineer |
| specialist-lab | 专项实验室 | 4 | 3 | computer-vision-engineer |
| design-studio | 设计工作室 | 5 | 2 | art-director |

`examples/workspaces/generated/reverse-lab.md` 已生成，SHA-256 `a79a616b7f3babe353d8768f9a14a5e17432b38e31e72dcf2ed147657574738d`。2026-10-16 在已登录的 Grok Bot 0.71.2 中创建了三个 Bot 和一个三人群：`reverse-lab/authorization-clerk` `1a259d55-af77-4d49-8aac-df7ea1d3632d`，`reverse-lab/reverse-engineer` `d91aee72-242d-42d9-8176-41db32d302d1`，`reverse-lab/evidence-reviewer` `e41aa9ef-72eb-4743-9081-353ebae4ea79`，群 `515a3914-da3e-49dd-9584-1a4007207aaa`。三个岗位说明已生效，Bot 在群里按各自职责做了开场回复。群的显示名仍是成员名单，因为电脑处于离开休眠（`SAND_AWAY_PARK`），把名称写成「逆向实验室」的请求被宿主拒绝。confirm-scope 交接回执尚未取得。

`examples/workspaces/generated/market-desk.md` 已生成，SHA-256 `3b315afefe155e00f28d6952e3f5592502c64e93cf3177a79418e9cc3f4cc751`，退出码 2。同一天在 Grok Bot 0.71.2 中创建了六个 Bot 并写入岗位说明：`market-desk/universe-clerk` `b9148adc-6258-40e1-93d9-b0a9ce912391`，`market-desk/filings-reader` `a5aeb99a-48d4-42cf-99af-f015f2e53f6f`，`market-desk/news-reader` `f6c70f32-4ac5-42e3-b9bc-a8770a5c47b6`，`market-desk/tape-reader` `72f3929b-c811-4108-bc96-6f9900f17e4e`，`market-desk/thesis-writer` `ae93d106-ae79-43fd-a9b7-584ff1540c1c`，`market-desk/risk-reviewer` `32319be5-2a05-4f08-bbbb-b1c4ff03165e`。技能包 `market-research` 已放进本机 `~/.grok/skills/market-research`。六个 Bot 的 harness 都是 `temporal`，名单里的 `serverId` 为空。批准安装后再次调用 `addGrokBotAgentSkill`，宿主仍返回 `failed_precondition`：要先把 Bot 分享给团队才能管理插件。`setGrokBotAgentVisibility` 返回 `unsupported_harness`，写入团队访问也返回 `failed_precondition`。市场研究台群组尚未创建。

每组指定协调员，按依赖关系分派任务，每次交接包含任务标识、当前负责人、输入来源、产物引用、验收标准、下一负责人或阻塞原因。重复上传应先核对现有对象，遇到同名但职责不同的 Bot 不覆盖。

原生群组支持 2–6 个 Bot；协调员使用明确的 @ 指派。群组中的 Bot 间交接目前是文本消息，需检查图片时直接发送给检查者。批准、登录和密钥请求在私有会话处理。管理员禁用 Bot 间通信时，协作流程需要先解决这一阻塞。

来源：[群聊和任务交接](https://docs.x.ai/grok-bot/chat-and-collaboration)。

多人访问同一个 Bot 的 Team Bot 功能与多个 Bot 的协作群不同。本轮配置的主入口是后者；本地成员权限不会自动授予 Grok 原生访问权限。参见 [Team Bots](https://docs.x.ai/grok-bot/team-bots)。

## 创建后的验收

先取得实际 Bot / 群组标识，再通过群内协调员分派一个有明确输入的小任务。观察专职 Bot 接收、交接、产物返回与独立审阅。创建成功、Skills 可用、连接器可用、工作流跑通分别记录；缺少任何证据都保持未验证。不能把初始化文档或本地测试回执当成账号创建证据。

## 可选 Gateway 集成

`workspace plan --config examples/workspaces.config.json --id app-studio` 输出本地审阅计划。每组独占一个 Gateway tenant；operator、verifier 和可选渠道身份均显式绑定。配置群组后，通用创建接口拒绝绕过群组入口。

- `GET /v1/workspaces`：返回身份有权访问的工作组。
- `POST /v1/workspaces/:id/workflows/:workflow/tasks`：验证群组权限与工作流输入，持久化 Bot 映射和任务。
- Result MCP：作用域令牌读取任务与提交产物，独立 verifier 验收。
- `examples/workspaces.feishu.config.json`：可选飞书消息映射示例，本轮未连接真实飞书。

本地 HTTP/MCP 已有端到端验收。Grok 云端不能直接连接本机 127.0.0.1；真实连接需另行部署可访问且经过身份验证的服务。当前没有自动发送到 Grok 原生群的连接器，本地 Outbox 回执不是原生群消息。
