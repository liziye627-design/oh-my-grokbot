# GitHub 上游选型与适配清单

2026-10-14。本次按原文可读、许可证清楚、场景适配、宿主耦合程度和可验证性选择基线。
“适合本项目”不等于所有场景中的绝对最佳，也不以星数代替代码审核。

## 已下载的基线

| 上游及固定提交 | 许可范围 | 采用内容 | 对应项目 Skill |
| --- | --- | --- | --- |
| [obra/superpowers](https://github.com/obra/superpowers/tree/bb92a77741419a4ab5f06e711a283343f1ada0c3) | MIT | writing-plans、verification-before-completion、systematic-debugging、dispatching-parallel-agents | task-planning、artifact-validation、failure-recovery、agent-handoff |
| [Anthropic knowledge-work-plugins](https://github.com/anthropics/knowledge-work-plugins/tree/02ffa99ff00ce4d3046ccebabb8357cb39f3ab06) | Apache-2.0 | search-strategy、knowledge-synthesis、validate-data | source-research、fact-verification；补充 social-research |
| [Vercel skills](https://github.com/vercel-labs/skills/tree/13e4063a1cf913f5606d57d42ab83a86f5001e04) | MIT | find-skills | capability-selection |
| [OpenAI skill-installer](https://github.com/openai/skills/tree/49f948faa9258a0c61caceaf225e179651397431/skills/.system/skill-installer) | 此目录内 Apache-2.0；不推及整个仓库 | 安装来源、路径、现有文件保护的原则 | environment-bootstrap |
| [GitHub gh-aw](https://github.com/github/gh-aw/tree/462ed682857c4ab64d40f2c85e3738fa27834839) | MIT | staged safe outputs、凭据隔离、预算、定时规则；这些是实现参考文档 | approval-protocol、secret-handling、cost-awareness、routine-design；补充 social-publishing |
| [Marketing Skills](https://github.com/coreyhaines31/marketingskills/tree/c7d7dfb6b460fc376b4b2204b78a9c9fd5ca6467) | MIT | social 的上下文、受众、平台格式、草稿工作流 | social-research、social-publishing |

共 6 个仓库、19 份原始文件（含许可证），保存在 `third_party/upstreams/`。
`registry/upstreams.lock.json` 记录完整提交、文件路径和 SHA-256；每个适配 Skill
都有独立 `NOTICE.md` 和原样许可证，随安装进入 `.ohmy/skills/`。

未把上游仓库整个安装到本机，也未运行其脚本、Hooks 或自动更新器。研究缓存包含
未采纳候选的文本，已排除出 Git 和发行包；它们不是项目可分发资源。

## 适配做了什么

- Core 从 8 个短方法扩为 12 个方法，版本 `0.2.0`；社交包再增加 2 个方法。
- 去掉 Claude/Codex 专属目录、命令、强制提交、强制子代理和全局安装假设。
- 各方法明确输入、工具存在条件、处理步骤、失败分支、输出证据和例子。
- 原生协作不可用时输出交接包；连接器不可用时输出缺失范围；不会虚构执行成功。
- 发布草稿与发布执行分别记录。审批文本不能代替 Gateway 的授权强制执行。
- 原生优先：社交包解析 `x-public-search` 时先选 Grok 原生 X 能力；CLI 是可用的替代入口。
- Core 和 Social 两个包可分别试装。它们共享相同 Skill 文件，安装器会保护共享所有权。

来源校验：`pnpm verify:upstreams`。默认 catalog 加载时也验证原文和适配树，
发现字节变化、未知文件、缺许可证、浮动版本或缺失 Skill 来源时停止。
`.gitattributes` 保持这些文件在 Windows/Unix 上的精确字节。

## 社交连接器状态

| 平台 | 当前交付 | 认证与边界 |
| --- | --- | --- |
| X | Grok 原生读取配方 + 本地只读 recent-search 适配器 | `OHMY_X_BEARER_TOKEN`；开发者权限与账号额度另行验证；不读取私信 |
| Bluesky | 公开 AppView 只读搜索适配器 | 不传账号凭据；本环境真实搜索返回 HTTP 403，尚未验证成功结果 |
| Mastodon | `mastodon.social` 的只读 statuses 搜索适配器 | `OHMY_MASTODON_ACCESS_TOKEN`，`read:search`；其他实例尚未接入 |
| YouTube | Data API v3 视频元数据搜索适配器 | `OHMY_YOUTUBE_API_KEY`，项目需启用 API；不声称读取字幕或看过视频 |
| Threads / Instagram / Facebook | 注册表参考项 | 尚无可执行适配器；应用、账号类型、权限审核与当前 API 契约待确认 |
| LinkedIn | 注册表参考项 | Posts API 产品权限、成员/组织身份及版本须确认；不假设能任意搜索公开内容 |
| TikTok | 注册表参考项 | 应用审核、用户授权和内容发布规则待接入；尚无可执行适配器 |

正式接口文档：[X](https://docs.x.com/x-api/posts/search-recent-posts)、
[Bluesky lexicon](https://github.com/bluesky-social/atproto/blob/32f8e454f199f4355574e452f660098a55365706/lexicons/app/bsky/feed/searchPosts.json)、
[Mastodon](https://docs.joinmastodon.org/methods/search/)、
[YouTube](https://developers.google.com/youtube/v3/docs/search/list)、
[原生 X 能力](https://docs.x.ai/grok-bot/computer-and-apps)。

只读适配器采用上述官方 HTTP 契约的最小实现，无额外 SDK/MCP 运行时依赖。
固定 HTTPS 端点、GET、禁止重定向、15 秒超时、2 MB 响应上限、一次请求，
不自动翻页或重试。结果含引用地址、作者、时间、检索时间与格式标记。
Mastodon HTML 是不可信源材料，消费方必须经过清理后才能展示。
API 错误仅输出分类和 HTTP 状态，不打印原始错误体或凭据。

## 比较后暂未纳入的实现

- [Vectara agent-skills](https://github.com/vectara/agent-skills/tree/a0b1d2b65a5912722493abf68243d62d5d409809)：凭据案例可作研究线索，但本轮未取得适用许可证，未复制进可分发资源。
- [social-mcp](https://github.com/IhsanKabir/social-mcp/tree/27313071a8ba68c4c795c1c563ae05428435e7b8)：MIT，多平台能力有参考价值；其服务器和自主调度会扩大 Core 的运行边界，本轮不整套引入。
- [socials-assistant](https://github.com/aryaminus/socials-assistant/tree/f8b64248e729b6700ace08d078dec3b81af396af)：MIT，是较完整的社交应用；其服务/会话模型需要单独安全审核，未当作可直接插入原生 Bot 的插件。
- [X 官方 TypeScript SDK](https://github.com/xdevplatform/xdk-typescript/tree/9b312949e7edf4da32bfbaffda575f0eb7bc1525)：包声明 MIT，本轮未在检查的根 LICENSE 路径取得正文，未镜像源码；目前一个 GET 端点无需引入完整 SDK。
- [Bluesky AT Protocol SDK](https://github.com/bluesky-social/atproto/tree/32f8e454f199f4355574e452f660098a55365706)、[masto.js](https://github.com/neet/masto.js/tree/49ab1a650c9129bf8370cfb0602ab576404f40cb)、[Google API client](https://github.com/googleapis/google-api-nodejs-client/tree/e5b1964f1844df74269e146bfd8b373cee9e77cd)：保留为后续复杂 OAuth、写入、分页的客户端候选，本轮使用官方 HTTP 查询契约。
- [Facebook Business SDK](https://github.com/facebook/facebook-nodejs-business-sdk/tree/0d245ec888c1af38d68994fd7f2e24cd38abc82f)：采用平台专用许可；不能据此推断 Threads、Instagram、Facebook 发布全都已支持，保留链接。

## 使用与验收

```shell
pnpm build
pnpm ohmy social list
pnpm ohmy social search x grok --limit 5 --dry-run
pnpm ohmy social search bluesky grok --limit 5
pnpm ohmy plan oh-my-social --out social.lock.json
pnpm ohmy apply social.lock.json --yes --allow-unverified
pnpm verify:upstreams
```

凭据由用户在本地环境或宿主凭据系统中私下配置；命令行不接收 token 参数。
`--dry-run` 完全不读取凭据、不发请求。X 上游至少请求 10 项，CLI 可返回更少；
这不保证上游按返回数计费。预算/额度需以账号后台为准。
缺少凭据返回退出码 2；401、403、429、传输/契约错误返回退出码 1。
`truncated=true` 表示结果存在截断或继续查询的可能，不会自动发起下一页。

Core/Social 本地包完整性、适配器契约和 CLI 场景有自动化证据；
Grok 原生导入、真实账号授权和 Skill 的行为表现仍需对应宿主验收。
发布/私信/点赞/关注/删除未提供可执行入口。后续写能力应由 Gateway 的审批、
凭据隔离、幂等键、Outbox、结果核对机制统一执行，再绑定到社交 Skill。
