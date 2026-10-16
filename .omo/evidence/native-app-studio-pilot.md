# Native application team pilot

Date: 2026-10-15 Asia/Shanghai
Observed: native Grok Bot sidebar contains app-studio/product-analyst created in this session; native greeting seen at 18:32. Existing Mika draft preserved.
Upload pending: file chooser opened for examples/workspaces/generated/app-studio.md. Computer Use helper rejects child-dialog element and coordinate targeting (element unavailable / target-window mismatch). User asked to select exact file; no upload success claimed.

## Authorized task to send after attachment verified

执行附件中的应用开发工作组初始化。你就是 app-studio/product-analyst，请复用自己；创建或复用 app-studio/architect、app-studio/implementer、app-studio/qa、app-studio/reviewer，配置各自的岗位提示词。建立“应用开发工作组”原生群并核对五个成员。只使用实际可用的宿主功能，不能以文档、聊天角色扮演或临时子代理冒充持久 Bot 或原生群。

随后执行 APP-STUDIO-PILOT-001：在你们可访问的云端新建独立沙盒，开发一个纯 JavaScript 的任务状态迁移验证函数 canTransition(from,to)。状态 queued/running/verifying/succeeded/failed；仅允许 queued→running、running→verifying、running→failed、verifying→succeeded、verifying→failed，其余和未知状态拒绝。不得修改已有项目，不创建远程仓库，不推送、不发布、不部署。

由 product-analyst 写 spec.md 和验收样例，architect 写 design.md，implementer 写实现，qa 实际运行测试覆盖全部状态对与未知输入，reviewer 独立读取实现和执行证据作出结论。每个岗位必须由对应真实 Bot 接收任务并返回结果，记录消息/交接与产物引用。没有运行代码的能力时如实标记阻塞，不能把推演结果写成通过。

最终给出创建/复用的真实 Bot 标识、群标识及成员、岗位间交接证据、文件、测试命令和实际结果、独立审阅结论、缺失 Skills 与连接器。缺少建群或 Bot 间通信能力时停止依赖步骤并报告具体缺项，不伪造成功。
