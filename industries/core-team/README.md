# core-team

`oh-my-core-team@0.1.2` 把参谋、计划、独立审查和知识沉淀分成四个原生岗位。操作者只和幕僚长对话；计划、审查和知识库把全文留在记录里，短摘要交回幕僚长。它不自动调度其他行业包。

三条可以分开验收的流程：`assign-work` 是章程和名单，`retain-knowledge` 是分配验收之后的共享知识库，`review-week` 是周复盘。周复盘同时记下返工和净分钟：基线减去仍花费，再减去审阅本不该出现的产出。零、负数或全程危机都记为未通过。缺计时保持未知。运行次数和用量百分比不换成节省。每条例行写每周次数、无变化是否仍发言、是否挂在主对话上。每份章程末尾列出仍需人工批准的动作：对外发送、发布、付款、删除和生产变更。

岗位、工作流和验收标准在 `industry.json`。`prompts/` 是交给原生 Bot 的角色说明，由本项目编写，不是上游提示词副本。`examples/inputs.json` 只演示第一条工作流的输入键，值必须换成真实授权材料。

可选外部工具在注册表中是 reference 交付。安装计划会列出人工步骤；工具不存在时结果为 skipped，不能写成已执行。安装返回 needs_human，表示本地文件已部署，原生账号尚未验收。

```bash
pnpm ohmy --json industry inspect oh-my-core-team
pnpm ohmy --workspace ./team-workspace install oh-my-core-team --yes --allow-unverified
```

上游许可和处理方式见 `SOURCES.md`。金融、发布、外联、烧录和第三方写入都要单独批准，本包不授予这些执行权。
