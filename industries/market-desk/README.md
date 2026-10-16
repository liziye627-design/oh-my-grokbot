# market-desk

`oh-my-market-desk@0.1.0` 是一个公开市场研究台：确认观察名单，分头阅读公告、新闻和行情表，写出支持理由、反对理由和模拟笔记，再独立审稿。操作者先选择要不要安装这个团队。安装不会自动开始研究，也不会连接券商。

`define-universe` 只根据名单、时间窗口和操作者提供的数据写出 universe.md。`write-thesis` 在名单确认后写 filings-note.md、news-note.md、tape-note.md 和 thesis.md，再由另一人写 review.md。两条流程都要人工批准。

岗位说明由本项目编写。本地参考副本在 `.omo/research/market-upstreams/`，不进入上传包。[AI Hedge Fund](https://github.com/virattt/ai-hedge-fund) `78b779c` 和 [TradingAgents](https://github.com/TauricResearch/TradingAgents) `1394a3f` 缺失时记 skipped。不复制上游角色提示词，不生成订单。

```bash
pnpm ohmy --json industry choose oh-my-market-desk
pnpm ohmy --workspace ./team-workspace install oh-my-market-desk --yes --allow-unverified
```

安装返回 needs_human，表示本地文件已部署，原生账号尚未验收。示例输入不能当成真实行情或投资建议。
