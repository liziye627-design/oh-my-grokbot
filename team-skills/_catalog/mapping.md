# 技能-岗位对照表 mapping.md（2026-10-16 CST，core-team/knowledge-keeper）
依据：<local-path>（evidence-reviewer 复核）、<local-path>（幕僚长清单）。只收复核通过/有条件通过的条目。

## 已入表（18 个，第二轮复核全部通过）
| 技能 id | 来源（星，许可证） | 复核结论 | 分配到的工作组/岗位 | 使用限制 |
|---|---|---|---|---|
| dev-frontend-design | anthropics/skills（181,534，Apache-2.0） | 通过 | app-studio/architect、app-studio/implementer、design-studio | 无 |
| dev-webapp-testing | 同上 | 通过 | app-studio/qa、app-studio/reviewer、engineering-lab/test-engineer | with_server.py 只在本机起服务 |
| dev-mcp-builder | 同上 | 有条件通过 | app-studio/architect、app-studio/implementer、engineering-lab/ai-engineer | scripts/evaluation.py（要用 API key，会把数据发到外部）和 npx inspector 都要等用户明确同意才能运行 |
| design-canvas-design | 同上 | 通过 | design-studio、content-studio/producer、video-studio | 无 |
| design-theme-factory | 同上 | 通过 | design-studio、office-team、app-studio | 无 |
| design-algorithmic-art | 同上 | 通过 | design-studio/motion-designer、video-studio | 运行时从 cdnjs 和 Google Fonts 加载资源 |
| content-internal-comms | 同上 | 通过 | core-team/chief-of-staff、business-operations、office-team、solo-company | 无 |
| design-style-minimal | bergside/awesome-design-skills（3,208，MIT） | 通过（第二轮） | design-studio、app-studio | 无 |
| design-style-editorial | bergside/awesome-design-skills（3,208，MIT） | 通过（第二轮） | design-studio、content-studio/channel-editor、content-studio/producer | 无 |
| design-style-corporate | bergside/awesome-design-skills（3,208，MIT） | 通过（第二轮） | design-studio、office-team、solo-company | 无 |
| game-feel | gamedev-skills/awesome-gamedev-agent-skills（1,545，Apache-2.0+NOTICE） | 通过（第二轮） | specialist-lab/game-designer | 无 |
| game-level-design | gamedev-skills/awesome-gamedev-agent-skills（1,545，Apache-2.0+NOTICE） | 通过（第二轮） | specialist-lab/game-designer | 无 |
| game-procedural-gen | gamedev-skills/awesome-gamedev-agent-skills（1,545，Apache-2.0+NOTICE） | 通过（第二轮） | specialist-lab/game-designer | 无 |
| game-ui-ux | gamedev-skills/awesome-gamedev-agent-skills（1,545，Apache-2.0+NOTICE） | 通过（第二轮） | specialist-lab/game-designer、design-studio | 无 |
| game-dialogue-systems | gamedev-skills/awesome-gamedev-agent-skills（1,545，Apache-2.0+NOTICE） | 通过（第二轮） | specialist-lab/game-designer | 无 |
| game-genre-rpg | gamedev-skills/awesome-gamedev-agent-skills（1,545，Apache-2.0+NOTICE） | 通过（第二轮） | specialist-lab/game-designer | 无 |
| game-genre-card-game | gamedev-skills/awesome-gamedev-agent-skills（1,545，Apache-2.0+NOTICE） | 通过（第二轮） | specialist-lab/game-designer | 无 |
| game-genre-roguelike | gamedev-skills/awesome-gamedev-agent-skills（1,545，Apache-2.0+NOTICE） | 通过（第二轮） | specialist-lab/game-designer | 无 |

## 待确认
- 团队分配统一以本表为准（各技能 description 已改成通用写法）。
- 技能目录能不能正常索引到这些技能，要等技能列表刷新后再核对。

## 覆盖缺口
research-lab、market-desk、财务、x-growth、reverse-lab，以及开源许可的 Office 文档技能。

## 第二轮已入表（11 个，2026-10-16 23:35 CST）
依据：幕僚长安装记录、candidates.md 分配、evidence-reviewer 通过/有条件通过结论。

| 技能 id | 来源（星，许可证） | 复核结论 | 分配到的工作组/岗位 | 使用限制 |
|---|---|---|---|---|
| research-competitive-intel | alirezarezvani/claude-skills（28.3k，MIT） | 通过 | research-lab/competitor-scout、research-lab/industry-analyst | 无 |
| finance-financial-analyst | 同上 | 通过 | market-desk/filings-reader、market-desk/thesis-writer、market-desk/risk-reviewer、specialist-lab/financial-researcher、solo-company/finance-reviewer | 偏公司 FP&A，不是 SEC 财报解析 |
| social-media-analyzer | 同上 | 通过 | x-growth/researcher、x-growth/reviewer、content-studio/channel-editor | 本地指标脚本 |
| eng-spec-driven-workflow | 同上 | 通过 | engineering-lab/requirements-engineer、app-studio/product-analyst | 本地脚本 |
| eng-embedded-iot-mentor | 同上 | 通过 | engineering-lab/embedded-engineer | 偏选型辅导，固件实践较轻 |
| sales-proposal-writer | 同上 | 通过 | sales-team/proposal-writer、solo-company/sales-lead | 合同模板不是法律意见 |
| sales-engineer | 同上 | 通过 | sales-team/sales-engineer、sales-team/company-researcher | 本地 RFP/POC 脚本 |
| agile-product-owner | 同上 | 通过 | engineering-lab/requirements-engineer、app-studio/product-analyst | 本地用户故事脚本 |
| brand-voice-enforcement | anthropics/knowledge-work-plugins partner-built（29.9k，MIT） | 通过 | content-studio/voice-keeper、wechat/voice-keeper、x-growth/reviewer | 无 |
| reverse-ghidra-static-analysis | mukul975/Anthropic-Cybersecurity-Skills（34.5k，Apache-2.0） | 有条件通过 → **已移回暂存区**（等用户决定） | 拟 reverse-lab ONLY | 未在共享库；装回前需用户同意 + 授权关卡 |
| reverse-firmware-binwalk | 同上 | 有条件通过 → **已移回暂存区**（等用户决定） | 拟 reverse-lab ONLY | 同上 |


说明（2026-10-16 23:34 CST）：上述 11 个里两个逆向技能已由幕僚长移回 `<staging>/`，共享库实际保留 9 个；等用户决定装回去 / 留暂存 / 彻底不要。
因与 Mika 已上线技能重叠而剔除（不入表）：research-market-research、research-deep-research、content-copywriting、content-creator、social-x-growth。



## 第二轮补装（11 个，2026-10-16 23:37 CST）
competitive-brief 与 research-competitive-intel 重复，剔留暂存。本轮共享库外部技能合计 20 个（先前 9 + 本批 11）；两个逆向仍暂存等用户决定。

| 技能 id | 来源（星，许可证） | 复核结论 | 分配到的工作组/岗位 | 使用限制 |
|---|---|---|---|---|
| sector-overview | anthropics/financial-services（40.1k，Apache-2.0） | 通过 | market-desk/universe-clerk、market-desk/thesis-writer、research-lab/industry-analyst | 公开信息行业映射，不交易 |
| thesis-tracker | 同上 | 通过 | market-desk/thesis-writer、market-desk/risk-reviewer | 无 |
| catalyst-calendar | 同上 | 通过 | market-desk/news-reader、market-desk/tape-reader | 公开事件/催化剂跟踪 |
| earnings-analysis | 同上 | 通过 | market-desk/filings-reader、market-desk/thesis-writer | 财报阅读分析，非自动交易 |
| variance-analysis | anthropics/knowledge-work-plugins（29.9k，Apache-2.0） | 通过 | solo-company/finance-reviewer、office-team/data-analyst | 预算/实际差异，不付款 |
| risk-assessment | 同上 | 通过 | market-desk/risk-reviewer、business-operations/operations-reviewer | 通用风险登记方法 |
| search-strategy | 同上 | 通过 | research-lab/source-researcher、research-lab/research-director | 查询规划 |
| knowledge-synthesis | 同上 | 通过 | research-lab/industry-analyst、research-lab/research-director | 多源综合 |
| customer-research | 同上 | 通过 | sales-team/company-researcher、sales-team/lead-hunter | 无 |
| draft-content | 同上 | 通过 | content-studio/drafter、wechat/drafter、x-growth/researcher | 无 |
| performance-report | 同上 | 通过 | x-growth/operations、content-studio/channel-editor | 指标汇报 |

## 暂存区状态（更新后，共 8 个）
- **等用户决定（2 个逆向）**：reverse-ghidra-static-analysis、reverse-firmware-binwalk。
- **因重叠剔除**：competitive-brief；以及 research-market-research、research-deep-research、content-copywriting、content-creator、social-x-growth。

## 覆盖缺口（再更新）
仍缺：开源 Office 文档；sales-team/crm-manager；网络协议逆向；wechat/title-editor 仍可能偏弱（brand-voice / draft-content 仅部分覆盖）。market-desk 与 research-lab 本批已基本补上。

## 全量 Bot 名单（2026-10-16 23:30 CST）
岗位 Bot 共 76 个；另有组长或独立 Bot 16 个（x-growth、Mika、content-studio、core-team、specialist-lab、solo-company、video-studio、business-operations、opus5.5制作视频大师、research-lab、应用开发工作组、wechat、design-studio、office-team、engineering-lab、sales-team），不按岗位分配技能。
自写技能和岗位的对应是我按技能名推断的，标了“推断”，请各岗位确认。外部技能的分配按复核过的对照表。

| Bot | 外部技能（已复核） | 自写技能（推断） |
|---|---|---|
| app-studio/architect | dev-frontend-design, dev-mcp-builder, design-theme-factory, design-style-minimal | — |
| app-studio/implementer | dev-frontend-design, dev-mcp-builder, design-theme-factory, design-style-minimal | code-review-request, code-review-response, test-first-development, isolated-worktree-setup, branch-finishing |
| app-studio/product-analyst | design-theme-factory, design-style-minimal | — |
| app-studio/qa | dev-webapp-testing, design-theme-factory, design-style-minimal | — |
| app-studio/reviewer | dev-webapp-testing, design-theme-factory, design-style-minimal | — |
| business-operations/customer-support | content-internal-comms | support-ticket-triage |
| business-operations/operations-analyst | content-internal-comms | business-metrics-from-exports |
| business-operations/operations-coordinator | content-internal-comms | ops-work-coordination |
| business-operations/operations-reviewer | content-internal-comms | operations-review |
| content-studio/channel-editor | design-style-editorial | — |
| content-studio/drafter | — | — |
| content-studio/producer | design-canvas-design, design-style-editorial | content-producer-brief-and-handoff |
| content-studio/researcher | — | content-source-research |
| content-studio/reviewer | — | content-review-gate |
| content-studio/voice-keeper | — | voice-profile-and-outline |
| core-team/chief-of-staff | content-internal-comms | goal-decomposition-and-escalation |
| core-team/evidence-reviewer | — | acceptance-evidence-review |
| core-team/knowledge-keeper | — | knowledge-base-ingest |
| core-team/task-planner | — | task-plan-with-acceptance |
| design-studio/art-director | dev-frontend-design, design-canvas-design, design-theme-factory, design-style-minimal, design-style-editorial, design-style-corporate, game-ui-ux | design-brainstorming |
| design-studio/design-reviewer | dev-frontend-design, design-canvas-design, design-theme-factory, design-style-minimal, design-style-editorial, design-style-corporate, game-ui-ux | — |
| design-studio/interface-designer | dev-frontend-design, design-canvas-design, design-theme-factory, design-style-minimal, design-style-editorial, design-style-corporate, game-ui-ux | ui-component-requirements |
| design-studio/motion-designer | dev-frontend-design, design-canvas-design, design-theme-factory, design-algorithmic-art, design-style-minimal, design-style-editorial, design-style-corporate, game-ui-ux | — |
| design-studio/reference-scout | dev-frontend-design, design-canvas-design, design-theme-factory, design-style-minimal, design-style-editorial, design-style-corporate, game-ui-ux | — |
| engineering-lab/ai-engineer | dev-mcp-builder | — |
| engineering-lab/embedded-engineer | — | — |
| engineering-lab/requirements-engineer | — | — |
| engineering-lab/test-engineer | dev-webapp-testing | — |
| market-desk/filings-reader | — | — |
| market-desk/news-reader | — | — |
| market-desk/risk-reviewer | — | — |
| market-desk/tape-reader | — | — |
| market-desk/thesis-writer | — | — |
| market-desk/universe-clerk | — | — |
| office-team/data-analyst | design-theme-factory, content-internal-comms, design-style-corporate | metric-table-calculation |
| office-team/document-specialist | design-theme-factory, content-internal-comms, design-style-corporate | document-assembly-with-source-check |
| office-team/meeting-secretary | design-theme-factory, content-internal-comms, design-style-corporate | meeting-notes-extraction |
| office-team/schedule-manager | design-theme-factory, content-internal-comms, design-style-corporate | action-items-to-schedule-draft |
| research-lab/competitor-scout | — | — |
| research-lab/fact-checker | — | claim-fact-check |
| research-lab/industry-analyst | — | — |
| research-lab/research-director | — | — |
| research-lab/source-researcher | — | — |
| research-lab/trend-hunter | — | — |
| reverse-lab/authorization-clerk | — | reverse-engineering-authorization-gate |
| reverse-lab/evidence-reviewer | — | reverse-lab-evidence-reviewer |
| reverse-lab/evidence-reviewer、reverse-lab/reverse-engineer和reverse-lab/a | — | — |
| reverse-lab/reverse-engineer | — | reverse-lab-reverse-engineer |
| sales-team/company-researcher | — | — |
| sales-team/crm-manager | — | — |
| sales-team/lead-hunter | — | — |
| sales-team/proposal-writer | — | — |
| sales-team/sales-engineer | — | — |
| solo-company/chief-of-staff | content-internal-comms, design-style-corporate | — |
| solo-company/delivery-engineer | content-internal-comms, design-style-corporate | — |
| solo-company/finance-reviewer | content-internal-comms, design-style-corporate | — |
| solo-company/opportunity-researcher | content-internal-comms, design-style-corporate | — |
| solo-company/sales-lead | content-internal-comms, design-style-corporate | — |
| specialist-lab/computer-vision-engineer | — | cv-model-evaluation |
| specialist-lab/financial-researcher | — | financial-research-memo |
| specialist-lab/game-designer | game-ui-ux, game-feel, game-level-design, game-procedural-gen, game-dialogue-systems, game-genre-rpg, game-genre-card-game, game-genre-roguelike | game-design-spec |
| specialist-lab/model-evaluator | — | model-evaluation-review |
| video-studio/editor | design-canvas-design, design-algorithmic-art | video-render-evidence |
| video-studio/producer | design-canvas-design, design-algorithmic-art | video-producer-brief |
| video-studio/qa | design-canvas-design, design-algorithmic-art | video-media-qa |
| video-studio/researcher | design-canvas-design, design-algorithmic-art | video-claim-and-source-verification |
| video-studio/scriptwriter | design-canvas-design, design-algorithmic-art | video-script-from-evidence |
| wechat/drafter | — | wechat-article-drafting |
| wechat/reviewer | — | wechat-article-review |
| wechat/title-editor | — | — |
| wechat/voice-keeper | — | wechat-style-extraction, wechat-topic-to-outline |
| x-growth/editor | — | x-draft-and-calendar |
| x-growth/operations | — | x-metrics-approval-receipt |
| x-growth/researcher | — | — |
| x-growth/reviewer | — | x-prepublish-review |
| x-growth/scout | — | x-topic-scouting |

## 缺口岗位（没有任何技能，22 个）
- content-studio/drafter
- engineering-lab/embedded-engineer
- engineering-lab/requirements-engineer
- market-desk/filings-reader
- market-desk/news-reader
- market-desk/risk-reviewer
- market-desk/tape-reader
- market-desk/thesis-writer
- market-desk/universe-clerk
- research-lab/competitor-scout
- research-lab/industry-analyst
- research-lab/research-director
- research-lab/source-researcher
- research-lab/trend-hunter
- reverse-lab/evidence-reviewer、reverse-lab/reverse-engineer和reverse-lab/a
- sales-team/company-researcher
- sales-team/crm-manager
- sales-team/lead-hunter
- sales-team/proposal-writer
- sales-team/sales-engineer
- wechat/title-editor
- x-growth/researcher
