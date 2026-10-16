# 设计工作室

`oh-my-design-studio@0.1.0` 把艺术指导、参考采集、界面需求、动效和独立验收分成五个岗位。每个组件先写功能、状态和核心信息，再点名 transitions.dev 上的一条过渡。参考先走 `design-atelier` 的网站架，架子没有覆盖时用 source-research 做网页搜索。

| 岗位 | 输入 | 输出 |
| --- | --- | --- |
| art-director | 目标、组件、受众、核心信息 | direction.md、component-brief.md、visual-receipt.json |
| reference-scout | 简报 | references.md |
| interface-designer | 简报与参考 | component-spec.md |
| motion-designer | 组件规格 | motion-spec.md |
| design-reviewer | 上述文件 | review.md |

`specify-component` 走完一条组件规格，艺术指导在这一步交出静帧回执。`motion-audit` 只核对已有界面的动效。两条都要独立验收后才算通过。出图、视频和三维模型共用 `visual-receipt.json`：运行时返回了文件才写哈希。ComfyUI、Remotion、video-use、ui-skills 和 transitions.dev 是引用，命令没跑过就标 skipped，不把它们的代码放进本仓库。
