# Spike 0 · 飞书到原生 Grok Bot 的连接验证

状态：**待真实账号实验**。本地 Gateway 和飞书 SDK 适配已实现，但尚未通过真实账号发送飞书消息，也未调用 Grok Bot 触发入口。
文档核对不是连接成功的证据。

## 已核对的上游资料（2026-10-14）

- [Grok Bot Skills/Routines](https://docs.x.ai/grok-bot/skills-routines-and-automations)：
  原生周期任务、受支持的事件触发；不能据此推导任意第三方 Webhook 都可用。
- [Grok Automations Webhooks](https://docs.x.ai/grok/automations/webhooks)：
  不同产品路径，不能直接作为 Grok Bot Routine 接口契约。
- [Bot 模板](https://docs.x.ai/grok-bot/bots)：分享配置副本，不转移账号登录及电脑。
- [电脑与连接器](https://docs.x.ai/grok-bot/computer-and-apps)：同账号 Bots 共享凭据与文件。
- [Feishu Channel SDK](https://github.com/larksuite/channel-sdk-node)：官方消息通道 SDK；
  版本 0.7.1 已安装并接入 Gateway；尚未做真实账号授权测试。
- [Agent Skills 格式](https://agentskills.io/specification)：本地十四个适配 Skills 的目录与 frontmatter 格式依据。

## 实验输入

单个测试租户、一个测试用户、一个受限飞书应用、一个专用原生 Bot、测试会话白名单。
凭据通过宿主安全输入或外部秘密库配置，不能写进 Pack、日志或 Git 仓库。

## 通过条件

1. 用官方 Channel SDK 收到测试会话的精确 @消息，保存唯一事件 ID。
2. 明确识别并授权原生 Grok Bot 支持的触发入口；记录文档与实际配置。
3. 用同一 taskId/runId 触发指定 Bot 执行只读测试任务。
4. Bot 通过已实现的 Result MCP 提交可检查的交付物及引用。
5. Gateway 核验身份、租户、任务与结果，向最初会话回传一次结果。
6. 重放相同事件不新建第二个逻辑任务；错误 @、错误租户、过期审批均拒绝。

找不到公开支持的触发入口时，记录 unknown/unsupported，并保留原生对话人工发起路径。
不能用未公开 API 或以其他产品的接口成功来宣称本项通过。

## 已实现的本地结果工具

Gateway 已提供 `get_task`、`report_progress`、`submit_artifact`、`request_approval`、
`complete_task`、`report_failure` 六个工具。官方 MCP 客户端的本地 HTTP 闭环已验证；这不代表原生 Bot 已绑定这些工具。
每次调用必须绑定可认证执行者、tenantId、taskId、runId；complete_task 只提交完成声明，
必须通过业务结果验收，才能把任务从 verifying 推进到 succeeded。

启动及凭证配置见 [Gateway 操作指南](gateway.md)。可运行 `node examples/gateway-smoke.mjs` 重现本地模拟事件、MCP 提交、审批及验收；真实飞书消息、原生任务执行和回复仍须按上面的通过条件单独记录证据。
