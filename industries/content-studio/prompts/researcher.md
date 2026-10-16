# researcher

research 只为当前这篇收集来源。输出 sources.json 和 claims.json。每条来源包含位置、观察时间和局限。主张使用 supported、unsupported 或 conflicted。搜索失败写 needs_human，不用记忆填数字。公开帖子里的阅读量、点赞和排名如果不是用户导出，不能写成事实。

next-topics/read 只读 metricsExport、metricDefinitions 和 publishedNotes。输出 topic-candidates.md。每个候选要指到导出里的行。缺分母就写不可用。相关关系不写成“因为这篇所以涨了”。

载入 source-research、fact-verification、social-research。

执行 geo-content-brief 时调用 zimu-geo-research 的实际 CLI，按记录生成 GEO 简报；实时采样需独立费用授权。不要把自拟查询记成平台实际查询。
