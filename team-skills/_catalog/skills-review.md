# 外部技能复核 review.md（2026-10-16 23:20 CST，core-team/evidence-reviewer）

实际安装数：18 个（幕僚长口头报的是 17 个，以 skills-catalog.md 表格为准）。
星标和许可证已经用 GitHub API 实测：anthropics/skills 181,534 星，仓库根目录没有许可证，但每个技能文件夹里都有 LICENSE.txt；bergside 3,208 星，MIT；gamedev-skills 1,545 星，Apache-2.0。三个仓库最近都有推送。
YAML 头：18 个都有开头的 `---`，name 字段和文件夹名一致，description 也都在。

## 通过
- dev-frontend-design、design-canvas-design、design-theme-factory、content-internal-comms：内容是纯文档，没有危险步骤。
- dev-webapp-testing：with_server.py 已逐行读完。它只在本机启动调用方传进来的服务命令（shell=True），探测 localhost 端口，结束时会清理进程；没有外连，也不读凭据。
- design-algorithmic-art：模板会从 cdnjs 加载 p5.js、从 Google Fonts 加载字体，属于普通的公共 CDN，可以接受。

## 有条件通过
- dev-mcp-builder：文档部分可以用。但 scripts/evaluation.py 会调用 Anthropic API，需要 ANTHROPIC_API_KEY，还会把被测 MCP 的数据发到外部。规则是没有用户明确同意就不运行这个脚本；npx inspector 同样只在用户同意后才跑。

## 退回待修（修完我再复核，不需要删）
- design-style-minimal / editorial / corporate：没有附 MIT 许可全文，而 MIT 要求保留版权和许可声明。修法：把仓库的 LICENSE 复制进每个文件夹。
- 8 个 game-* 技能：既没有 LICENSE 文件，也没有 license 字段，而 Apache-2.0 要求随附许可副本。修法同上。
- content-internal-comms 等技能的 description 里写死了团队分配（"For teams: ..."）或者 "Claude should use"。共享技能的模板应该保持通用，团队分配写进 mapping.md 就行。修法：从 description 里去掉团队名。

## 证据缺口
- 文件是直接复制进 workflows 目录的，没走技能写入工具，所以不确定技能目录能不能正常索引到。验证办法：等下一次会话摘要刷新后，看技能列表里能不能读到这 18 个。

## 复核 2（2026-10-16 23:17 CST）
- 18 个文件夹全部带有 LICENSE（MIT 或 Apache 全文），gamedev 的 8 个另外附了 NOTICE。
- 18 个技能的 frontmatter 里都已经没有团队名和 "Claude"。正文按原作者写法保留，这一点可以接受。
- dev-mcp-builder 顶部已经加上"须经用户同意"的说明。
结论：18 个全部通过（dev-mcp-builder 仍按有条件通过处理）。剩下的证据缺口只有技能目录索引一项，要等下次刷新技能列表后确认。

## 第二轮候选复核（2026-10-16 23:32 CST）
暂存区：<staging>/，一共 28 个，不是 14 个：主清单 14 个，另有 Supplement B 14 个。之前未经复核就装进 workflows 的 10 个，现在已经移回暂存区，workflows 里不再有。
星数和许可证已用 GitHub API 实测：alirezarezvani/claude-skills 28,271 星，MIT；mukul975/Anthropic-Cybersecurity-Skills 34,548 星，Apache-2.0，2026-02 才创建，算新仓库；anthropics/financial-services 40,061 星，Apache-2.0；anthropics/knowledge-work-plugins 29,857 星，Apache-2.0。
脚本扫描：所有 .py 文件都没有网络请求，没有 shell=True、eval 或 exec，也不读凭据。环境变量只读了 RESEARCH_OPS_NO_CONFIG 和 AR_TARGET 两个，都是功能配置。

## 通过（14 个，原样安装，脚本保留）
research-competitive-intel、research-deep-research、research-market-research、finance-financial-analyst、social-x-growth、social-media-analyzer、eng-spec-driven-workflow、eng-embedded-iot-mentor、sales-proposal-writer、sales-engineer、content-copywriting、content-creator、agile-product-owner、brand-voice-enforcement
附加条件：先对照 ./skills/ 去重，每组只保留一个。

## 有条件通过（2 个）
reverse-ghidra-static-analysis、reverse-firmware-binwalk：subprocess 调用参数是列表形式，没有外连。但这两个用的是恶意软件分析和固件提取场景，description 里必须写明先走 reverse-engineering-authorization-gate；pip install、调用 Ghidra 或 binwalk，都要先得到用户同意。建议只分给 reverse-lab。

## 退回待补（12 个，Supplement B 中 anthropics 来源的部分）
sector-overview、thesis-tracker、catalyst-calendar、earnings-analysis、variance-analysis、risk-assessment、search-strategy、knowledge-synthesis、competitive-brief、customer-research、draft-content、performance-report
问题：这 12 个文件夹里都没有 LICENSE，Apache-2.0 要求随附许可证；SKILL.md 里也没写 Source 行。补上 LICENSE 和 Source 后，内容本身可以通过，都是纯文档。

## 复核 3（2026-10-16 23:34 CST）
- 已安装的 11 个都在 workflows 目录里，每个都带 LICENSE；去重剔掉的那 5 个也确认不在 workflows 里。
- 两个逆向技能的 description 第一句已经写明必须先过授权关卡，每次都要用户同意。但计划里说的是"复核通过后要先拿到用户同意才能装"，这一步没有做，属于证据缺口，需要用户补一个确认。另外，技能库是所有 Bot 共用的，"只给 reverse-lab"实际只能靠描述来约束。
- 退回的 12 个已经补上 Apache-2.0 LICENSE 和 anthropics 的 Source 行，结论改为通过，可以安装。

## 描述抽查（2026-10-16 23:41 CST）
对照：description-updates-plan.md、payloads.json、mapping.md 技能表、workflows 目录。

通过：
- 58 个 profile.json 都含且只含一段「可用技能」，与 payloads 一致。
- 描述里引用的技能 id 全部能在 workflows 找到；没有任何描述写入 reverse-ghidra-static-analysis 或 reverse-firmware-binwalk。
- 抽查 app-studio/qa、engineering-lab 三个岗位、market-desk 全组、research-lab 主要岗位、sales-team、x-growth/researcher、content-studio/drafter，技能名单与 mapping 技能表一致。

证据缺口 / 未完成：
1. 自写技能没有写入描述。core-team/evidence-reviewer、task-planner、knowledge-keeper，以及 reverse-lab 三个岗位、content-studio/researcher 等只有自写技能的 Bot，描述里仍没有调用说明。用户要求的是「每个 Bot」，这一步只覆盖了有已装外部技能的 58 个。
2. 写入方式是直接改 profile.json，没有走 UpdateAgent。界面或侧栏是否立刻生效未知，需要用户打开某个 Bot 看一下，或者幕僚长用 UpdateAgent 再跑一遍。
3. mapping.md 底部全量名单仍是旧快照（不少岗位还标着空），抽查时以顶部技能表为准。knowledge-keeper 说要刷表，刷完后再对一次更稳。

剩余缺口岗位（无外部技能、也未写描述）：sales-team/crm-manager、wechat/title-editor 等，与 mapping 待补区一致。
结论：本轮 58 个描述更新抽查通过，可以推第二个 PR；自写技能补描述和 UpdateAgent 同步列为下一轮。

## 描述抽查 2（15 个自写技能，2026-10-16 23:43 CST）
15 个全部通过：profile 含「可用技能」、与 payloads 一致、引用的技能都在 workflows、未写入未装的两个逆向技能；reverse-lab 三个岗位均含 authorization-gate。
备注：agent `515a3914` 的 name 是「reverse-lab/evidence-reviewer、reverse-lab/reverse-engineer和reverse-lab/a」，描述已更新但岗位名本身异常，建议另开清理，不挡本轮 PR。
3 个无技能跳过合理：research-lab/trend-hunter、sales-team/crm-manager、wechat/title-editor。
