---
name: baoyu-markdown-to-html
description: 第二层内容 Bot 的公众号离线排版与预览。把已审 Markdown 转为 HTML，核对中文、来源和排版，不执行发布。
license: MIT; see licenses/baoyu-skills.txt
compatibility: Requires Bun; Mermaid diagrams additionally require Chrome. Native host support must be verified separately.
metadata:
  version: "0.1.0"
  upstream-revision: "1567581c26ec29f4216c6e6835415bf30343b0e3"
---

# 公众号离线排版

输入：已审 article.md、主题（未指定使用 default）、输出目录。完整来源映射单独保存，不把内部 claim ID 放进读者可见正文。

以本目录为 BASE。在已安装副本运行 `bun install --frozen-lockfile --ignore-scripts --cwd BASE/vendor/scripts`，不要向仓库受校验的源目录写依赖。运行 `bun --no-install BASE/vendor/scripts/main.ts ARTICLE.md --theme default`；按需要显式替换主题。

检查返回的 htmlPath；浏览器打开预览，检查标题、段落、中文、链接、图片与手机宽度。原稿保留，审稿后修改产生新版本。输出 article.html、render-receipt.json（命令、退出码、文件哈希）与 layout-review.md。

HTML 是预览和交付物。后续微信 Markdown 提交直接将 article.md 交给发布 Skill，由其处理图片和转换；不要把浏览器路径需要的图片占位转换与离线 HTML 混用。

原文和详细参数在 vendor/references/upstream-skill.md。这里只使用任务参数，不读取个人偏好作为作者身份。
