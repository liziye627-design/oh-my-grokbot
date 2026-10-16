# 增长工作组

这里交付 5 个原生员工配置、5 条工作流、输入样例及可核算的预期产物。它是增长工作组的当前渠道，覆盖选题、短帖、线程、长文草稿和导出数据复盘。后续平台的增长流程加入同一工作组，不另开以平台命名的圈子。它复用第一层 Skills 和既有只读社交能力，由共享行业引擎校验/分发；所有模型执行留在 Grok Bot 原生员工。没有新增模型运行时或发布后台。需要把公众号正文和多渠道剪裁放在同一次生产里时，使用 `oh-my-content-studio`。

| 员工 | 输入 | 输出 |
|---|---|---|
| scout | brief、来源或授权读取、时间范围 | sources.json、topic-brief.md |
| researcher | 来源与选题 | claims.json、research-brief.md |
| editor | 已核验事实、品牌、目标账户和日历窗口 | drafts.md、calendar.csv |
| reviewer | 当前工作流的实际文件 | review.md |
| operations | 指标导出或通过评审的草稿 | analytics.md 或 approval-request.json、handoff.md |

## 原生配置与交接

依次为每个员工载入 prompts/<role>.md 和 industry.json 中对应既有 Skill。每次分配传入 taskId/runId、工作流与 step ID、输入文件引用、截止时间及专属 Result MCP 配置；凭证单独安全传递，不写进提示词文件或示例。运行态字段由 Gateway 创建，示例不预造真实 token。

共享引擎按 dependsOn 只向已满足前序证据的角色交接。员工提交 UTF-8 文件及真实摘要，通过 complete_task 进入 verifying，独立 operator/verifier 检查实际文件再验收。原生跨员工自动触发、X 账户权限和外部发布尚待真实账户接入验证；当前可人工配置原生员工并交接任务。共享云电脑不等于租户安全边界。

## 三条可验收场景

1. topic-research：将 examples/brief.json 与 sources.json 作为提供素材。检查选题均绑定来源；claims.json 必须排除示例的“十倍增长”；研究报告必须标明未做实时 X 搜索。与 fixtures/topic-brief.md、claims.json、research-brief.md 比较语义，不要求逐字匹配。
2. content-calendar：使用已审核 claims，生成草稿/CSV，再独立评审。预期 fixtures 中账户仍为占位符，handoff 应停在 needs_human。真正发布须替换账户、核对文案、批准准确 payload，并由已有授权原生执行能力执行；修改重批、未知结果先核对、禁止盲目重发。没有回执不得标记已发。
3. export-analytics：使用 examples/metrics.csv 和 brief 内的指标定义。独立复算 3000 展示、80 互动、50 点击；聚合互动率 2.6667%、点击率 1.6667%，零分母 unavailable。示例是合成数据，不能宣称真实增长。重复 ID、负数、缺失列或窗口不一致应退回数据，不能自动修补后继续下结论。
4. write-thread：用一个想法、声音样本和已核验主张写线程。第一条说明读完的收获，后面每条只推进一个要点。没有真实帖子编号。
5. write-article：写带标题和来源的长文，并另剪一条可以单独发布的短帖。不把长文粘成帖子，也不声明已经创建 X Article。

fixtures/review.md 是预期验收行为，不是实际通过证明。没有真实发布/搜索验收记录。整个准备流程不要求 X 写权限；采集可使用提供的数据，x-public-search 仅为可选依赖。

## 官方上游调研（2026-10-15）

- [xdevplatform/samples](https://github.com/xdevplatform/samples)：官方 API 示例，作为只读检索及身份授权边界的参考；本包未复制或执行代码。
- [xdevplatform/xdk-typescript](https://github.com/xdevplatform/xdk-typescript)：当前官方 TypeScript XDK 候选；本包复用现有适配器，未自动新增 SDK 依赖。
- [历史 TypeScript SDK](https://github.com/xdevplatform/twitter-api-typescript-sdk)：README 标注 beta/not production ready，因此不把它默认作为新增生产运行时。

这些 URL 在调研中已核对，文档参考不等于账户可用性验证。此目录的提示词/样例是项目原创，未把未经许可的上游代码打包。安装第一层能力不会自动完成平台登录、凭证授权或原生触发验证。
