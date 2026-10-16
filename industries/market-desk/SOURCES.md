核对日期：2026-10-16。两个仓库已浅克隆到本机 `.omo/research/market-upstreams/`（该目录不进入 Git，也不进入 Grok Bot 上传包）。没有运行上游安装脚本，没有把上游提示词抄进角色文件。示例环境文件里的密钥占位已清空。

| 上游 | 提交 | 许可 | 本地副本 |
| --- | --- | --- | --- |
| [AI Hedge Fund](https://github.com/virattt/ai-hedge-fund) | `78b779c` | MIT | `ai-hedge-fund/`，115 个已跟踪文件。信号、风险限额、组合构建和纸面记账只作研究参考 |
| [TradingAgents](https://github.com/TauricResearch/TradingAgents) | `1394a3f` | Apache-2.0 | `trading-agents/`，208 个已跟踪文件。公告、新闻、舆情、行情、支持和反对理由、风险审阅对应本团队岗位。下单模块不接入 |

岗位说明由本项目编写。两个上游都是可选参考，本机副本缺失时记 skipped。不连接券商，不生成订单。
