---
name: baoyu-post-to-wechat
description: 第二层内容 Bot 的微信草稿交付。先准备精确提交包，只有明确授权、账号与素材齐备时才保存到微信草稿箱。
license: MIT; see licenses/baoyu-skills.txt
compatibility: Requires Bun and WeChat account credentials/IP allowlist for API, alias-specific environment variables; browser/remote mode is not supported by the adapter.
metadata:
  version: "0.1.0"
  upstream-revision: "1567581c26ec29f4216c6e6835415bf30343b0e3"
---

# 微信草稿交付

输入：已审正文、作者选定标题、账户引用、摘要、封面、审稿结果，以及绑定精确版本的用户授权。未获得授权时仅生成 delivery-request.json，状态 needs_human，绝不调用提交脚本。安装授权不等于微信写入授权。

先在已安装副本运行 `bun install --frozen-lockfile --ignore-scripts --cwd BASE/vendor/scripts`。BASE 为本目录。运行时依赖不写入仓库源目录。

本次适配优先支持 API 草稿路径。执行前阅读 vendor/references/api-setup.md、article-posting.md、multi-account.md。凭据仅存在用户自己的环境/私有配置，不写入群、文章、日志或安装包。缺封面、AppID/AppSecret、IP 白名单或账号明确选择时返回缺项，不自动挑账户。

使用项目入口先检查：`bun --no-install BASE/scripts/draft.mjs --account ALIAS --expected-app-id APP_ID`，默认不写入。账户必须显式配置且 default_publish_method 为 api；只接受完整的 `WECHAT_<ALIAS>_APP_ID` 和 `WECHAT_<ALIAS>_APP_SECRET` 环境变量（别名转大写，连字符换下划线），拒绝通用凭据回退、内联凭据和远程模式。得到绑定精确内容的授权后，在同一命令追加 `ARTICLE.html --title TITLE --author AUTHOR --cover COVER --submit-approved`；封面使用本地文件绝对路径。此开关只是调用意图，宿主仍负责验证用户授权。入口在隔离配置目录中调用上游，避免重新读取其他账号配置。项目入口只接受已经由排版 Skill 渲染并审核的 HTML，使用上游 API 的 HTML 路径，避免 Markdown 路径隐式下载另一个 Bun。正文中的本地图片路径需相对 HTML 可解析。浏览器/远程发布保留上游资源，但尚未在本项目验证，不默认使用。

保存真实 draft/add media_id 后才能说“草稿已保存”。它不是已群发，不生成虚构文章链接。输出 receipt 仅含脱敏账户引用、正文/媒体哈希、状态和真实草稿 ID；不保存响应中的 token。失败先查草稿状态再考虑重试，避免重复。

本地验证允许 `--help` 检查入口，但它不构成微信账户验证。本轮内容示例只生成交接包，不执行发布。
