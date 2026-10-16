# 真实内容生产验证：2026-10-16

文章：[从一篇初稿到可交付内容](article.md) · [生成的公众号 HTML](article.html)

这是一篇实际撰写的项目实践稿，不是 lorem ipsum、模板占位或已发布文章。当前 AI 助手按第二层角色阶段完成写作，独立代理审稿；宝玉工具实际承担网页采集和 HTML 排版。没有宣称六个 Grok Bot 已自动运行。

## 交付物

- brief.md、voice-profile.md、outline.md：选题和文风边界；用户旧文样本为 0。
- sources.json、claims.json：来源与可核查主张，内部编号不进入正文。
- article.md、titles.md：正文和六个候选标题。
- thread.md、post-cut.md：可复制的 X 文案；状态、事实映射在 channel-metadata.json。
- article.html、render-receipt.json：实际宝玉渲染产物及命令/哈希。
- dependency-check.json：冻结依赖检查的真实输出。
- review.md、layout-review.md：独立审稿与显示检查的范围。
- approval-request.json、delivery-request.json、handoff.md：待确认账户、标题和封面的精确交接。

## 复现

按 [内容生产安装说明](../../../docs/content-production.md) 在新目录安装。将 article.md 复制到自己的工作目录后运行已安装的宝玉排版入口。可对照 render-receipt.json 的命令与固定依赖。

测试环境：Windows、Node 22.14.0、Bun 1.4.1。公开网页由独立 Chrome profile 抓取；没有复制用户 Cookie、EXTEND.md 或凭据。文中工具说明有官方来源，增长、收益和个人亲历均未编造。

本地 HTML 已渲染，桌面截图已观察。窄屏截图不足以通过手机适配验收；内置浏览器的 file URL 访问被拒绝，未绕过继续验证。微信实际预览和提交、X 发布、Grok 原生账号运行均未执行。
