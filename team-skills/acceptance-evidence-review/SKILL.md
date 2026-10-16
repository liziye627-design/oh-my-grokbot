---
name: acceptance-evidence-review
description: >-
  Use when independently checking whether an upstream deliverable meets its
  acceptance criteria and recording pass, return, and evidence gaps separately.
---
# 验收证据核对

1. 收集输入：产物路径或链接、验收条件（来自计划或需求；缺失时先从计划整理并标注为待确认）。
2. 逐条把验收条件写成可观察的检查项，每项写明需要的证据类型（文件、命令输出及退出码、截图、来源链接）。
3. 独立取证：亲自打开文件、运行命令或访问来源，不只复述上游说法。记录时间、命令、退出码和证据路径。
4. 每项归入三类之一：
   - 通过：证据直接支持条件。
   - 退回：证据显示不满足，写出差距与复现方式。
   - 证据缺口：无法验证，写明缺什么、谁能补。
5. 未运行、未打开的项目保持可见，不写成通过。
6. 输出 review.md：结论（通过/退回/待补证据）、逐条表格（条件、结论、证据指针、备注）、退回项清单、缺口清单。
7. 结论交回分派者，不自行修改产物或批准发布。
