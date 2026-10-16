# 示例独立验收
这是预期结果模板，不是运行时 verifier 的真实签名。真实运行应填 task/run、文件 SHA-256、验收人、时间。

- topic-research：来源可追溯，claim-1 可用于文档议题；claim-2 应排除。实时趋势仍 needs_human。
- content-calendar：草稿引用 claim-1，时间含时区；目标账户为占位符，发布验收 needs_human，不能批准发布。
- export-analytics：3000 展示、80 互动、50 点击，聚合率 2.6667%/1.6667%；零分母 unavailable，合成数据限制可见。算术检查 passed。
- 独立性：runner 不能使用自己的凭证调用最终验收接口。

用于与实际输出对比，不应直接复制成自动通过的验收结论。
