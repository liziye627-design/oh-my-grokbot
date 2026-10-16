# Oh My Grok Bot · Core Installer 与 Gateway

面向原生 Grok Bot 的能力发行与集成层。第一层提供静态能力注册表、版本解析与可审计的本地安装器；第二层提供本地 Gateway、持久化任务账本与受认证的 Result MCP。

当前可运行范围：**把十二个 Core Skills、可选社交方法和原生配置指引部署到用户工作区，
检查内容与上游许可完整性，安全回滚本次创建的文件；提供四个平台的只读搜索入口，以及任务领取、结果提交、审批、独立验收和持久化通知。**

原生 Bot 导入、账号授权和业务执行仍需在 Grok Bot 中验证；CLI 不会把本地文件
部署成功标成原生团队已经可用。当前目录中的资源是 `reviewed` 开发版本，尚无
独立账号的 `verified` 证明。

## 本地运行

需要 Node.js >=22.14、pnpm 11.7。以下命令适用于带锁文件的源码工作区。首次安装工具依赖后编译：

```shell
pnpm install --frozen-lockfile --ignore-scripts
pnpm build
pnpm ohmy --help
pnpm ohmy search research --kind skill
pnpm ohmy inspect oh-my-core
pnpm ohmy plan oh-my-core --out core.lock.json
```

开发版试装需要显式允许已审核、待独立验证的资源：

```shell
pnpm ohmy apply core.lock.json --dry-run --allow-unverified
pnpm ohmy apply core.lock.json --yes --allow-unverified
pnpm ohmy status
pnpm ohmy doctor
pnpm ohmy verify <installation-id>
pnpm ohmy rollback <installation-id> --yes
```

也可以通过 `pnpm ohmy install oh-my-core --yes --allow-unverified` 一步生成计划并试装。
`--workspace <directory>` 指定目标工作区，默认是当前目录；`--registry <file>` 指定
**由你信任的本地注册表**，默认使用项目内的 `registry/catalog.json`。
自定义注册表位于 `<distribution-root>/registry/`，bundled 路径相对于 distribution-root。

`plan` 默认只输出计划；只有 `--out` 才写锁文件。`--dry-run` 不创建工作区状态。
安装会拒绝默认安装未验证资源、未审核资源、内容冲突、越界路径及符号链接/目录联接。
`--allow-unverified` 只允许已审核开发资源，不能放行 `discovered` 资源。

npm tarball 已包含编译产物，解包后可用 `pnpm install --prod --ignore-scripts --no-frozen-lockfile` 安装运行依赖并运行 `node dist/cli.js`；npm 归档不包含 pnpm 锁文件。

## 第二层 Gateway

按 [Gateway 启动与操作指南](docs/gateway.md) 设置独立的 operator/verifier 令牌，然后启动本地服务：

```powershell
pnpm gateway --config examples/gateway.local.json --workspace .
```

SQLite 账本和交付物保存在 `.ohmy/gateway/`。领取任务会签发绑定 taskId/runId 的短期凭证；六个 Result MCP 工具提交结果，operator/verifier 验收后才标记成功。审批绑定精确内容，Outbox 持久化回传状态。飞书适配代码已接入官方 SDK，但真实账号、原生触发及原生 MCP 绑定仍待验证，当前由操作者人工派发给原生 Bot。

`node examples/gateway-smoke.mjs` 可在构建后运行本地 HTTP/MCP 验证；它不会连接飞书或原生 Bot。

## 状态与退出码

| 退出码 | 状态 | 含义 |
| --- | --- | --- |
| 0 | passed / skipped | 当前命令完成，或检查明确不适用 |
| 1 | failed | 无法满足命令契约，需要处理错误 |
| 2 | needs_human | 本地操作完成，但仍有原生配置/授权/实测步骤 |

使用 `--json` 获取 `status/code/message/context/evidence_refs` 结果。
安装后的退出码 2 是预期状态，pnpm 也会将非零退出码向上传递。

## 工作区布局

```text
<workspace>/.ohmy/
├── operation.lock                     # 仅在安装/回滚期间存在
├── installations/<id>.json             # 精确计划、哈希和文件所有权记录
├── audit.jsonl                        # 操作 ID、时间与固定事件码
├── skills/<skill>/SKILL.md
└── recipes/oh-my-core/grokbot.md        # 原生岗位、配置与实测步骤
```

重复安装相同计划复用原记录。现有同内容文件可复用，但不会成为此次安装所有的文件。
回滚仅删除本次创建且哈希仍匹配的文件；用户编辑的文件、其他安装仍引用的文件会阻止
回滚。原生 Bot、远端数据、账号和会话不属于本层回滚范围。

意外退出可能留下 `operation.lock` 和 `installing` 状态。先确认持锁进程已退出，
保留记录后再由操作者移除锁，并对明确的 installation-id 执行回滚。
安装器不会自行清除疑似过期的锁。Gateway 使用独立的 `service.lock`，恢复方法见其操作指南。

## Core Skills

`source-research`、`fact-verification`、`task-planning`、`agent-handoff`、
`artifact-validation`、`approval-protocol`、`failure-recovery`、`cost-awareness`、
`capability-selection`、`environment-bootstrap`、`secret-handling`、`routine-design`。

这些方法采用标准 `SKILL.md` 格式，已基于固定提交的开源案例适配，版本 `0.2.0`。
每项带来源说明与许可证；原始快照保存在 `third_party/upstreams/`。审批 Skill 不能替代宿主或
Gateway 的权限强制执行。当前安装到暂存目录，不假设宿主有未公开的 Skills 导入目录。

## 社交层

可选包 `oh-my-social` 在 Core 之上增加 `social-research` 和 `social-publishing`
两个方法。X、Bluesky、Mastodon（mastodon.social）、YouTube 已有本地只读搜索适配器；
Threads、Instagram、Facebook、LinkedIn、TikTok 当前是待接入参考项。
真实账号/宿主连接与发布执行尚未完成。Bluesky 实测搜索返回 HTTP 403，不能宣称已接通。

`pnpm ohmy social list` 查看状态；`pnpm ohmy social search x grok --limit 5 --dry-run`
查看只读请求计划；`pnpm ohmy plan oh-my-social --out social.lock.json` 生成安装计划。
认证变量、选型理由和接入边界见 [上游适配清单](docs/upstream-adaptation.md)。

## 验证与开发

```shell
pnpm typecheck
pnpm check
pnpm test
pnpm schemas
pnpm verify:upstreams
pnpm audit --prod --registry=https://registry.npmjs.org
```

`pnpm test` 先构建 CLI，再执行契约、依赖解析、真实文件系统和 CLI 场景检查。
`schemas/` 从同一套 Zod 契约导出；语义版本及跨字段约束仍以运行时 Zod 校验为准。
源码入口是 `src/index.ts`，命令入口是 `src/cli.ts`。

## 交付阶段

- Spike 0：在真实账号验证飞书 Channel → 指定 Grok Bot → 结果的触发链路。
- Alpha 1：Core Installer 与 Skills 已实现。
- Alpha 2：本地 Gateway、SQLite 任务账本、Result MCP、身份/租户授权、审批与 Outbox 已实现；真实账号及原生连接待验收。
- Alpha 3：Guardian、进程/环境/任务恢复与外部操作状态核对。
- 行业层：十六套可安装团队。先用 `industry choose` 勾选，再对选中的包执行 `install`。岗位职责和团队组合见 [Bot 操作指南](docs/bot-playbook.md)。个人内容生产优先看 [内容生产链路](docs/industry-employees.md#内容生产链路)。公开市场研究看 [Market Desk](industries/market-desk/README.md)。

参见 [架构与契约](docs/core-architecture.md)、[原生连接验证](docs/integration-spike.md)
和 [本次实现记录](.omo/evidence/core-foundation.md)。

## 许可状态

项目许可证尚待维护者决定，当前 package 标记为 `private` 和 `UNLICENSED`。
本地开发不等于许可公开分发。所选上游许可允许的文件已下载并保留声明；适配 Skills 的许可见各目录 NOTICE.md。
来源不明或许可受限的候选只保留链接，未纳入发行资源。
当前注册表不是第三方资源的全面安全审计或可商用保证。

## 原生群组

各团队的上传包在 `examples/workspaces/generated/`。成员隔离、已创建的 Bot 标识和协作链路见 [原生群组说明](docs/native-groups.md)。岗位怎么配合见 [Bot 操作指南](docs/bot-playbook.md)。本地链路已实现，原生账号创建与连接仍需实际回执验证。

### 第二层内容 Bot 核心

宝玉网页采集、公众号排版、微信草稿交付与数字生命卡兹克长文方法已适配为可安装 Skills。
[接入与运行说明](docs/content-production.md) · [真实文章验证](examples/content-studio/real-article/README.md)。
本地运行有实际产物；微信/X 发布与 Grok Bot 原生账号验证仍分别记录，不能由安装成功推定。
