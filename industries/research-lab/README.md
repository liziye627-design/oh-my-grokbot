# research-lab

`oh-my-research-lab@0.1.0` 用研究总监、来源研究员、行业分析、竞品侦察、事实审查和趋势观察完成可回溯研究。

岗位、工作流和验收标准在 `industry.json`。`prompts/` 是交给原生 Bot 的角色说明，由本项目编写，不是上游提示词副本。`examples/inputs.json` 只演示第一条工作流的输入键，值必须换成真实授权材料。

可选外部工具在注册表中是 reference 交付。安装计划会列出人工步骤；工具不存在时结果为 skipped，不能写成已执行。安装返回 needs_human，表示本地文件已部署，原生账号尚未验收。

```bash
pnpm ohmy --json industry inspect oh-my-research-lab
pnpm ohmy --workspace ./team-workspace install oh-my-research-lab --yes --allow-unverified
```

上游许可和处理方式见 `SOURCES.md`。金融、发布、外联、烧录和第三方写入都要单独批准，本包不授予这些执行权。
