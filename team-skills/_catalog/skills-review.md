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
