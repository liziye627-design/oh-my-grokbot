# Native Integration Gateway · Alpha 2

第二层已提供本地 HTTP Gateway、SQLite 任务账本、Result MCP、任务凭证、审批记录和持久化 Outbox。飞书适配使用官方 `@larksuite/channel` SDK；真实飞书账号连接、原生 Grok Bot 触发及其 MCP 绑定仍待验收。当前派发方式是 `manual_native`。

## 在 Windows PowerShell 启动

需要 Node.js >=22.14、pnpm 11.7。Gateway 使用 Node 内置 `node:sqlite`，在 Node 22 上属于实验功能；启动脚本显式启用 `--experimental-sqlite`。在项目根目录执行：

```powershell
pnpm install --frozen-lockfile --ignore-scripts
pnpm build
$env:OHMY_OPERATOR_TOKEN = node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('base64url'))"
$env:OHMY_VERIFIER_TOKEN = node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('base64url'))"
pnpm gateway --config examples/gateway.local.json --workspace .
```

令牌仅在当前进程环境中设置，不会打印出来。配置文件保存环境变量名称；每个身份需要独立、随机的 32–200 位 URL 安全字符令牌。生产部署应由宿主秘密管理机制提供稳定凭据。重新生成令牌后，旧的管理端令牌失效。

服务绑定 `127.0.0.1:19741`，按 Ctrl+C 正常关闭。`--workspace` 是 CLI 全局选项，决定 `.ohmy/gateway` 所在位置；`--config` 路径相对于启动命令的当前目录。等价的完整命令为：

```powershell
node --experimental-sqlite dist/cli.js --workspace . gateway serve --config examples/gateway.local.json
```

`GET http://127.0.0.1:19741/health` 可用于存活检查；其中 `nativeTrigger: manual_unverified` 明确保留原生触发的验证状态。健康检查之外的接口均要求 Bearer 凭证。

## 身份与任务流

| 身份 | 能力 |
| --- | --- |
| `operator` | 创建/领取任务、查看本租户任务、审批、验收、处理 Outbox |
| `verifier` | 查看本租户任务及交付物、验收完成声明 |
| `channel` | 在配置的会话与发送者白名单内接收精确 @事件 |
| `runner` | 领取时签发；只访问一个 taskId/runId 的结果工具与交付物 |

租户来自已认证身份，任务创建接口不接受调用者指定 tenantId。任务与运行 ID 由服务生成。相同身份重复提交相同 eventId 和内容会复用任务；同一 ID 对应不同内容会报冲突。

任务进入 `queued` 后，由 operator 领取到 `running`。领取响应提供一次性显示的 runner 凭证，账本仅保存其 SHA-256；有效期为一小时或任务截止时间，两者取较早值。当前没有自动续期或重新领取终态任务的接口。

服务运行时，在另一个已注入相同 OHMY_OPERATOR_TOKEN 的 PowerShell 客户端环境中执行：

```powershell
$gatewayUrl = 'http://127.0.0.1:19741'
$operatorHeaders = @{ Authorization = "Bearer $env:OHMY_OPERATOR_TOKEN" }
$body = @{ eventId = [guid]::NewGuid().ToString(); objective = '整理指定 GitHub 仓库的资料并交付带来源的 Markdown 报告' } | ConvertTo-Json
$created = Invoke-RestMethod "$gatewayUrl/v1/tasks" -Method Post -Headers $operatorHeaders -ContentType 'application/json' -Body $body
$taskId = $created.record.task.taskId
$claim = Invoke-RestMethod "$gatewayUrl/v1/tasks/$taskId/claim" -Method Post -Headers $operatorHeaders
```

将 `$claim.record.task` 中的任务要求交给指定原生 Bot，并在客户端的安全凭据配置中使用 `$claim.credential` 作为 Result MCP 的 Bearer 凭证。请勿把它发送到群聊或写入可共享的任务说明。MCP 地址是 `http://127.0.0.1:19741/mcp`，采用官方 SDK 的无状态 Streamable HTTP；客户端与 Gateway 必须网络可达。云端原生 Bot 无法直接访问你电脑的 loopback 地址，远程部署与安全接入路径需要另行验证。

## Result MCP

每次调用都提交本任务的 `taskId` 和 `runId`；服务还会独立检查凭证绑定范围。

| 工具 | 额外输入与行为 |
| --- | --- |
| `get_task` | 返回任务要求、已提交交付物和审批状态 |
| `report_progress` | `message`；记录运行进展 |
| `submit_artifact` | `name`、UTF-8 `content`、`sha256`；校验内容并保存交付物 |
| `request_approval` | `approvalId`、`operation`、`destination`、`payload`、`expiresAt`；记录精确操作提案 |
| `complete_task` | `artifactIds`；提交已有交付物，任务进入 `verifying` |
| `report_failure` | `code`、`message`；保存失败并生成简要通知 |

交付物名称为相对文件名，例如 `report.md` 或 `research/report.md`；不得包含路径逃逸。内容最多 262144 个字符，同时限制 UTF-8 字节数不超过 1 MiB。相同任务下同名同内容提交可复用；不同内容不会覆盖已有文件。

完成声明需要 operator 或 verifier 单独验收。查看 `GET /v1/tasks/{taskId}`，通过 `GET /v1/tasks/{taskId}/artifacts/{artifactId}` 读取原文并检查业务要求，再向 `POST /v1/tasks/{taskId}/review` 提交 `{"verdict":"accepted","reason":"具体的验收依据"}` 或 rejected。服务会重新读取并校验交付物哈希；accepted 才推进为 `succeeded`。验收同时撤销 runner 凭证并写入 Outbox。哈希检查证明内容未漂移，业务正确性仍由验收者判断。

审核或审批身份的 ID 与 assignedRole 相同也会被拒绝。这里的独立验收指凭证角色分离；operator 是可签发 runner 凭证的可信管理员，系统不能证明两组凭证由不同的人持有。多人员复核仍需组织权限管理。

## 审批与回传

审批提案支持 `social-publish` 与 `external-write`，有效期必须在未来 24 小时内。请求后任务进入 `awaiting_approval`。operator 核对目标和完整内容后，在 `POST /v1/approvals/{approvalId}/decision` 提交 `decision`（approved/denied）及服务给出的 `payloadHash`。内容、目标或操作改变时需要新的审批。通过后任务回到 running；拒绝或已过期的决策进入 needs_human。

这些审批记录尚未接入发布执行器；approved 不会自动发布公众号、X 帖子或执行任意外部写入，也不能限制原生 Bot 在其他工具中的操作。

验收结果与 Outbox 入队在同一事务中提交。飞书适配启用后，每两秒处理一次本租户待发送项，回复原消息；通知包含验收说明、交付物名称与哈希，原文通过受认证的交付物接口读取。当前没有飞书文件上传或公开下载链接。纯本地配置没有发送器，通知保留在 Outbox。

发送状态为 `pending → sending → sent`。网络异常或缺失回执会进入 `needs_human`；服务恢复时，遗留的 sending 也进入 needs_human，不会盲目重发。操作者在飞书确认已发送并取得消息回执后，可向 `POST /v1/outbox/{id}/reconcile` 提交 `{"receipt":"已核实的远端消息 ID"}`。该接口登记人工核对结果；当前没有自动重试、重新入队或撤销发送接口，也不承诺网络层恰好发送一次。

## 接入真实飞书

以 [gateway.feishu.json](../examples/gateway.feishu.json) 为基础，将 channel 身份的 `chats` 与 `senders` 替换为测试群和测试用户的真实 ID。配置文件只保存凭据引用：

| 环境变量 | 用途 |
| --- | --- |
| `OHMY_OPERATOR_TOKEN` | 管理接口身份 |
| `OHMY_VERIFIER_TOKEN` | 验收接口身份 |
| `OHMY_FEISHU_TOKEN` | 受信任 channel 身份的 Gateway 令牌，与应用凭据不同 |
| `FEISHU_APP_ID` | 飞书应用 ID |
| `FEISHU_APP_SECRET` | 飞书应用密钥 |

前两项沿用本地配置；为 channel 独立生成随机令牌，并从秘密管理机制注入应用凭据：

```powershell
$env:OHMY_FEISHU_TOKEN = node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('base64url'))"
pnpm gateway --config examples/gateway.feishu.json --workspace .
```

服务通过官方 SDK 连接。请根据飞书应用平台及 SDK 文档配置消息权限与事件接收方式。当前策略仅接收白名单群内白名单用户对 Bot 的精确 @消息，拒绝私聊、@全体、机器人发信和超过五分钟的旧消息。接收后只创建任务，由 operator 领取；尚未自动唤起原生 Grok Bot。

`POST /v1/events` 是本地受信任适配器使用的标准化事件接口，需要 channel Bearer 凭证；它不是可直接填入飞书控制台的公网事件回调地址。请按 [连接验证清单](integration-spike.md) 验收真实账号，不以本地测试替代实测。

## 运维与接口索引

```text
<workspace>/.ohmy/gateway/
├── service.lock                       # 持锁进程 PID
├── ledger.sqlite                      # 任务、凭证哈希、审批、事件、审计、Outbox
├── ledger.sqlite-wal / -shm            # SQLite 运行时可能出现
└── artifacts/<taskId>/<runId>/...      # UTF-8 交付物
```

同一工作区只能启动一个 Gateway。异常退出后若 service.lock 仍在，先检查其中 PID 并确认原进程已结束，再移除该锁文件，保留账本与交付物后重新启动。正常 Ctrl+C 会关闭连接并移除锁。备份时应正常停服后整体备份 gateway 目录。

| 接口 | 身份与用途 |
| --- | --- |
| `GET /health` | 无凭据，存活与原生触发状态 |
| `POST /v1/tasks` | operator，创建任务 |
| `GET /v1/tasks` | operator/verifier，最近 100 个本租户任务 |
| `POST /v1/events` | channel，标准化消息入站 |
| `GET /v1/tasks/{id}` | operator/verifier/本任务 runner，任务、进展、证据和审批 |
| `POST /v1/tasks/{id}/claim` | operator，领取并获得任务凭证 |
| `GET /v1/tasks/{id}/artifacts/{artifact}` | operator/verifier/本任务 runner，读取校验后的交付物 |
| `POST /v1/tasks/{id}/review` | operator/verifier，独立验收 |
| `POST /v1/approvals/{id}/decision` | operator，决定精确提案 |
| `GET /v1/outbox` | operator，查看通知状态 |
| `POST /v1/outbox/dispatch` | operator，有发送器时处理最多 10 条待发送项 |
| `POST /v1/outbox/{id}/reconcile` | operator，登记不确定发送的已核实回执 |
| `POST /mcp` | runner，官方 Streamable HTTP Result MCP |

API 的角色与租户检查保护 Gateway 调用边界。它们不能隔离同一个操作系统账号中的任意进程；原生 Grok Bots 共享电脑和登录，因此不得把该共享电脑当作陌生租户之间的隔离边界。当前还没有远程 TLS 接入、凭证续期、任务自动重跑或 Guardian 进程恢复。

## 本地验证

```powershell
pnpm gateway:smoke
pnpm test
```

smoke 使用编译后的真实 Gateway、HTTP 与官方 MCP 客户端，覆盖模拟 channel 事件、审批、交付物哈希及下载、独立验收、凭证撤销和重启持久化。它不连接真实飞书或原生 Grok Bot。完整业务连接仍由 Spike 0 的账号实测验收。
