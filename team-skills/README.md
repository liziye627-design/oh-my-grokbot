# team-skills — 核心团队整理的技能集

本目录收录核心团队（core-team）整理并复核通过的 22 个 Agent 技能，分两类：

## 外部技能（18 个）

来源与许可证如下，各技能文件夹内保留原始 `LICENSE`（及 Apache 批次的 `NOTICE`）文件：

| 来源仓库 | 许可证 | 技能 |
|---|---|---|
| [anthropics/skills](https://github.com/anthropics/skills) | Apache-2.0 | `dev-frontend-design`, `design-canvas-design`, `design-theme-factory`, `design-algorithmic-art`, `content-internal-comms`, `dev-mcp-builder`, `dev-webapp-testing` |
| [bergside/awesome-design-skills](https://github.com/bergside/awesome-design-skills) | MIT | `design-style-minimal`, `design-style-editorial`, `design-style-corporate` |
| [gamedev-skills/awesome-gamedev-agent-skills](https://github.com/gamedev-skills/awesome-gamedev-agent-skills) | Apache-2.0 | `game-feel`, `game-level-design`, `game-ui-ux`, `game-procedural-gen`, `game-dialogue-systems`, `game-genre-rpg`, `game-genre-card-game`, `game-genre-roguelike` |

## 核心团队自写技能（4 个）

`goal-decomposition-and-escalation`, `task-plan-with-acceptance`, `acceptance-evidence-review`, `knowledge-base-ingest` — 由本团队原创编写。

## 安全须知：`dev-mcp-builder`

`dev-mcp-builder` 内附的 `scripts/evaluation.py` 与 `npx @modelcontextprotocol/inspector` 检查器**需用户明确同意才能运行**。本仓库**仅收录这些脚本文件，不运行它们**。

## 文档

`_catalog/` 下为技能清单与复核记录：
- `skills-catalog.md` — 安装清单（来源、星数、许可证、岗位映射、未收录项及原因）
- `mapping.md` — 技能到岗位的对照表及使用限制
- `skills-review.md` — 两轮独立复核记录

## Round 2 (20 external skills)

Some skills ship local Python helper scripts (`scripts/`, e.g. finance-financial-analyst, social-media-analyzer, eng-spec-driven-workflow, sales-engineer, agile-product-owner). They are included as-is and were **reviewed but not executed**; review them before running. Each skill keeps its upstream LICENSE and a Source line in SKILL.md.
