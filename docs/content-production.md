# 第二层：内容 Bot 的核心

第一层是安装、连接、身份、权限与可靠性。第二层是 Oh My Grok Bot 的岗位、专业方法、执行工具和验收工作流。内容生产属于第二层，不另起模型服务或 Agent 框架。

## 本次接入

| Skill | 来源 | 职责 | 已验证边界 |
| --- | --- | --- | --- |
| baoyu-url-to-markdown | 宝玉固定提交，MIT | 公开网页 → 来源 Markdown | 本地 Bun + 独立 Chrome 配置实际抓取 |
| khazix-writer | 数字生命卡兹克固定提交，MIT | 文风约束、大纲、长文、分层审稿 | 真实项目文章；不使用上游作者身份 |
| baoyu-markdown-to-html | 宝玉固定提交，MIT | 正文 → 公众号 HTML 预览 | 从干净安装副本实际渲染 |
| baoyu-post-to-wechat | 宝玉固定提交，MIT | 精确提交包 → 授权微信草稿 | 依赖与 --help 入口通过；账号写入未验证 |

宝玉源提交：`1567581c26ec29f4216c6e6835415bf30343b0e3`。
卡兹克源提交：`322346ded8129436b3f64707789a73e732ae24d9`。
源文件、适配文件、许可证逐文件 SHA-256 在 `registry/upstreams.lock.json`。只读快照在 `third_party/upstreams/`；适配入口在 `skills/`。宝玉 vendor 文件保留原样，不按项目代码风格重写，且不带上游测试或 node_modules。安装资源、原始参考与执行依赖的来源分别保留。

## 工作流

`oh-my-content-studio@0.2.0`：简报 → 来源/文风 → 大纲 → 正文 → 标题/X 改写 → **真实 HTML 排版** → 独立审稿 → 提交包。

`oh-my-wechat@0.2.0` 复用同一组专业 Skills。`routine-design` 不再承担这两个团队的文风工作。没有旧文可用中性编辑文风写草稿，但必须注明没有作者画像。

执行工具由原生 Bot 调用；配置文件本身不会自动拉起六个 Bot。本次真实文章由当前 AI 助手按角色阶段编排，并由独立审查代理核验，不冒充 Grok Bot 原生自动运行。

## 安装与本地运行

```bash
corepack pnpm exec tsc -p tsconfig.build.json
node dist/verify-upstreams.js
node dist/cli.js --workspace ./content-workspace install oh-my-content-studio --yes --allow-unverified
```

安装退出码 2 / needs_human 表示本地资源已暂存，原生验证未完成。不得把它当作上传成功。以后升级同一工作区时先检查已有安装与回滚指引，不强制覆盖文件。

对安装后的每个宝玉 Skill 显式准备依赖（Bun 已安装）：

```bash
bun install --frozen-lockfile --ignore-scripts --cwd content-workspace/.ohmy/skills/baoyu-url-to-markdown/vendor/scripts
bun install --frozen-lockfile --ignore-scripts --cwd content-workspace/.ohmy/skills/baoyu-markdown-to-html/vendor/scripts
bun install --frozen-lockfile --ignore-scripts --cwd content-workspace/.ohmy/skills/baoyu-post-to-wechat/vendor/scripts
```

不要在仓库 `skills/` 或 `third_party/` 的受哈希保护目录内装依赖。安装器不运行脚本或上传内容；宿主需要另行具备 Bun、Chrome 与网络访问。

```bash
bun --no-install content-workspace/.ohmy/skills/baoyu-url-to-markdown/vendor/scripts/lib/cli.ts https://github.com/JimLiu/baoyu-skills --output ./source.md --headless --chrome-profile-dir ./content-browser-profile
bun --no-install content-workspace/.ohmy/skills/baoyu-markdown-to-html/vendor/scripts/main.ts ./article.md --theme default --keep-title
bun --no-install content-workspace/.ohmy/skills/baoyu-post-to-wechat/scripts/draft.mjs --help
```

以上最后一步仅验证入口，不写入账号。正式提交需确定账号、封面和正文版本并取得授权。项目草稿入口仅接受已经审核的 HTML，沿上游 API 的 HTML 路径提交，避免 Markdown 分支隐式下载运行时；Markdown 先通过排版 Skill 显式转换。不要把凭据、profile、私人 EXTEND.md 放进安装包。

## 真实文章

[文章与复现说明](../examples/content-studio/real-article/README.md)。稿件、标题、X 线程、短帖、来源及交接保存在样例目录；运行日志与浏览器配置保存在被 Git 忽略的 `artifacts/content-validation/`，不随包上传。

本轮没有公众号群发、X 发布、金融量化接入，也没有声称已在 Grok Bot 账号创建员工。手机宽度的进一步浏览器验证未完成；桌面截图已观察。正式发布前仍需在微信实际预览界面检查。

## GEO 补充（0.3.0）

内容团队已加入子木 zimu-geo-research，由研究员执行、审稿员核验，输出进入本链路的 sourceNotes。见 [GEO 接入与验收](geo-content-production.md)。上文 0.2.0 的真实文章仍保留当时的源清单快照；新增 GEO 测试是模拟数据，不作为该文章的市场证据。
