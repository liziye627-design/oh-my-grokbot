# Skills 接入与内容、量化、创收路线

日期：2026-10-16。状态：本地规划完成，尚未复制新增上游代码、安装依赖、上传 Grok Bot 或连接账户。

## 1. 范围和实际基线

用户要求：接入宝玉内容 Skills，复用本机 Codex Skills，研究金融量化、股票以及帮助个人创收的开源案例；先在本地做好规划。

- 项目现有内容链路：`industries/content-studio`、`industries/wechat`、`industries/x-growth`。
- 本机 `C:/Users/<user>/.codex/skills` 的顶层可见目录共发现 36 个 SKILL.md；本次不包括隐藏 `.system`、插件缓存和 `.agents/skills`。
- 14 个通用 Skill 的入口 SKILL.md 与本仓库字节一致，复用现有条目。这个比较不等于完整目录已逐文件验证。
- 3 个宝玉 Skill 本地存在，尚未作为本项目可执行 Capability 接入。
- 其余 19 个是三维/视觉资产相关候选，本轮列入清单，后续单独核对来源、授权和依赖，不并入内容写作的默认安装。
- 本轮盘点文件：`local-skills-inventory.tsv`，包括入口 SHA-256 与是否重复，不含凭据或用户配置内容。
- 现有 `routine-design` 是定时任务方法，不能代替文风提取；后续需要独立 `author-voice` 方法。

## 2. 本地复制和 Grok Bot 上传分开完成

复制单位是选中的完整 Skill 资源目录，不是整个 `.codex`，也不是仅一份 SKILL.md。

1. 建立明确文件白名单：SKILL.md、必要 scripts/references/assets、LICENSE 和 NOTICE；检查相对路径与跨目录依赖。
2. 排除 `.env`、令牌、Cookie、浏览器 profile、账号 EXTEND.md、私人文章、聊天记录、缓存和构建依赖。配置只提供不含秘密的样例。
3. 对重复 Skills 使用现有 registry ID，不覆盖项目版本；有差异时保存比较结果后再决定采用哪版。
4. 将许可证原文、不可变提交、来源路径和逐文件 SHA-256 一起保存；本地 metadata 的 revision 只是线索，复制前须与上游原文比对。
5. 沿用 `third_party/upstreams/`、`skills/`、`registry/upstreams.lock.json`，不建立第二套正式注册表。
6. 现有 provenance 契约主要覆盖方法文件；带可执行脚本的包需要核对安装器是否递归交付资源、锁定运行依赖及检查运行时。若不支持，先补契约，不能只写 reference 就称接入成功。
7. 本地输出安装预览和上传候选包；不在包中携带账户授权。
8. Grok Bot 端先验证真实的文件/Skill 导入入口、shell/CLI/browser/MCP 能力和资源限制。能上传文件不等于能运行 Bun、Chrome 或 Python。
9. 为一个 Bot 导入最小包并运行真实样例，保留产物与回执，之后才推广到团队。宿主不支持的引擎放在外部服务，通过最小工具接口调用。

状态采用现有 discovered/reviewed/compatible/verified。候选研究、已复制、本地可执行和宿主已验证分别记录，不能混为完成。

## 3. P0：宝玉与内容生产

本地三个目录 metadata 都声明 revision `1567581c26ec29f4216c6e6835415bf30343b0e3`。尚未证明全部目录与该提交完全一致。三个 LICENSE 本地 SHA-256 均为 `601839401f6ce68b7a8aec0f7ba247ab8ef0848113378220bec4b2615cc84ee7`。

| 资源 | 当前证据 | 接入决定 | 验收 |
| --- | --- | --- | --- |
| baoyu-url-to-markdown | 本地 v1.61.0，有脚本与许可证 | 首批复制候选；核对 baoyu-fetch、Bun、Chrome 依赖 | 公开样例网页导出 Markdown，保留 URL/时间；不带会话信息 |
| baoyu-markdown-to-html | 本地 v1.117.3，有脚本与许可证 | 独立预览/导出能力 | 中文、图片、代码、链接正常显示；保留原稿 |
| baoyu-post-to-wechat | 本地 v1.118.2，有脚本与许可证 | 草稿箱适配器；账号配置在用户侧 | 授权测试账户取得真实草稿 media_id；不将草稿保存称作群发 |
| baoyu-format-markdown | 官方 README 列出，本地未安装 | 第二批引入；整理已有稿件，不代替原创写作 | 整理前后事实和链接不丢失 |
| baoyu-cover-image / baoyu-article-illustrator | 官方 README 推荐的公众号组合 | 第二批，审查图像后端、成本与凭据 | 真实封面/插图可打开，尺寸、来源和成本可记录 |
| WeWrite 的写作流程 | 官方仓库已查看 | 提取选题、文风、大纲、正文与审稿方法，逐文件核许可 | 一份真实 brief 产出可读正文；与原作者样本对照 |

来源：[宝玉官方仓库](https://github.com/JimLiu/baoyu-skills)、[WeWrite](https://github.com/imraywang/wewrite)。宝玉官方明确公众号发布 Skill 内含 Markdown 转换；不要强制先跑独立 HTML 转换再交给浏览器发布路径。离线 HTML 预览与实际提交是两个用途。

建议新增自有方法 Skills（尚未创建）：`author-voice`、`content-outline`、`article-writing`、`headline-editing`、`channel-adaptation`、`editorial-review`。每项必须有输入、输出、示例、质量标准和失败处理，不能只放角色描述。

目标链路：素材采集 → 选题 → 文风与证据 → 大纲 → 正文 → 标题/X 改写 → 独立审稿 → 封面/插图与排版 → 作者预览 → 授权草稿提交 → 发布回执与导出复盘。

生产稿不显示内部 claim ID，证据对应关系放独立 sidecar。审稿修订后需失效旧版本批准，绑定正文、媒体、账户和版本。

P0 完成定义：本地跑一篇真实样例，交出 Markdown、HTML、图片（如启用）、来源表、审稿记录；从安装包在干净目录复现。Grok Bot 验证与微信账户验证分别留证。没有账户时只能标记本地通过。

## 4. P1：股票研究与金融量化

本轮核读官方仓库，以下是候选优先级，不是已审核可复制清单。所有新增代码在固定 SHA 和对应目录 LICENSE 核对前保持 reference；行情数据权利单独检查，代码许可不包含数据再分发许可。

| 候选 | 采用能力 | 集成方式 | 优先级 |
| --- | --- | --- | --- |
| [Microsoft Qlib](https://github.com/microsoft/qlib) | 数据、模型、回测、评估流程；官方 qrun 示例可作基线 | 外部 Python 工具环境，Bot 收取结构化研究结果 | P1 首选回测基线 |
| [TradingAgents](https://github.com/TauricResearch/TradingAgents) | 多角色金融研究与讨论 | 先提取研究分工，执行引擎可选 | P1 研究报告 |
| [AI Hedge Fund](https://github.com/virattt/ai-hedge-fund) | 投资研究角色和组合研究案例 | 可选研究服务，输出论据与风险，不直接接订单 | P1 比较候选 |
| [RD-Agent](https://github.com/microsoft/RD-Agent) | 自动化数据/模型研发 | Qlib 基线可复现后，隔离运行因子实验 | P2 |
| [FinRL](https://github.com/AI4Finance-Foundation/FinRL) | 强化学习金融实验 | 独立研究环境，记录训练和评估成本 | P2，不作首个演示 |
| [vn.py](https://github.com/vnpy/vnpy) | 量化框架与交易接口生态 | 后续按市场、品种和具体 gateway 审查 | P2；不能推断任意股票账户都支持 |

第一套计划包 `oh-my-quant-research`：Market Researcher、Data Steward、Strategy Researcher、Backtest Engineer、Risk Reviewer。先围绕一个用户选择的市场运行，不默认将 A 股、美股、港股规则混用。

三条计划流程：

- `stock-research`：证券标识、市场、截止日、财报与行情来源 → 带来源的研究报告、证据缺口、相反论据。用户自选股是输入，不在本轮推荐具体股票。
- `backtest-strategy`：策略定义、数据版本、训练/验证/样本外区间、基准 → 成本前后结果、最大回撤、交易记录、配置和可复现日志。
- `paper-portfolio`：模拟组合、价格时间、交易规则 → 模拟成交与持仓账本、风险说明。与真实订单状态完全分开。

验收必须检查：未来信息泄漏、幸存者偏差、复权方式、停牌和退市、手续费与滑点、市场交易时段/最小单位，以及适用时的涨跌停、T+1；记录样本外表现和基准，不拿训练期成绩当结果。以固定数据做可重现评估，收益与失败策略都保留。

真实买卖股票属于后续独立执行模块：明确市场/券商、账户授权、仓位限制、订单预览、幂等和成交对账后才能实施。本次用户要求的是规划，不包含实盘开通或下单。

## 5. P1：帮助用户创收的案例

区分“可运行工作流”“自报收入案例”“可核验商业结果”。本轮没有核实任何项目能稳定赚钱，也没有取得可审计的实盘收益或订单收入证明。

| 案例 | 上游参考 | 用户得到什么 | 如何衡量商业效果 |
| --- | --- | --- | --- |
| 内容获客与代运营 | 宝玉 + WeWrite + [Marketing Skills](https://github.com/coreyhaines31/marketingskills) | 同一主题的公众号/X 内容、交付清单与复盘 | 内容成本、有效咨询、获客成本；收入由真实订单记录提供 |
| 线索筛选与售前 | [CrewAI Examples Lead Score Flow](https://github.com/crewAIInc/crewAI-examples) | 授权线索评分、公司简报、方案草稿 | 人工审核通过率、有效商机、签约回款；禁止虚构客户回复 |
| 自动化实施服务 | [Activepieces](https://github.com/activepieces/activepieces) | 客户授权范围内的 CRM/报表流程与交付说明 | 节省工时、运行成功率、服务费和持续维护成本 |
| 研究订阅/简报服务 | 现有 Research Lab + 内容链路 | 有来源的行业简报和版本归档 | 付费订阅、退款、留存及制作成本；不能复制付费资料转卖 |

CrewAI 官方要求查看具体示例许可，不能把框架许可证推及所有示例。Activepieces 需核对所选目录及企业组件的许可。优先实现内容获客案例，再做售前交付，不把“多发内容”直接当作收入增长。

首个创收演示：输入某一类客户的公开行业资料 → 制作一份行业样稿与服务方案 → 导出可审阅交付包 → 使用用户提供的成本/线索/订单数据复盘。外联发送、平台发布和收款操作不在演示内自动执行。

## 6. 开发能力与后续分批

[Superpowers](https://github.com/obra/superpowers) 在本仓库已有固定上游来源；继续复用规划、验证和调试方法。[Oh My OpenAgent](https://github.com/code-yeongyu/oh-my-openagent) 用作编排与恢复设计参考，后续核对具体版本及文件许可，不整套复制宿主运行时。

| 阶段 | 交付物 | 完成门槛 | 状态 |
| --- | --- | --- | --- |
| 本轮 | 本地盘点、候选与适配路线、验证定义 | 文件可读，来源可追溯，未执行事项明确 | 已完成 |
| A | 宝玉三项候选白名单副本、NOTICE、锁文件与运行依赖 | 来源/许可/校验通过，无私人配置 | 待实施 |
| B | 写作方法 Skills、内容团队绑定和真实样例 | 文章、X 改写、排版经过独立验收 | 待实施 |
| C | Grok Bot 最小导入包与账户级试运行 | 原生工具可用，真实产物与回执 | 待实施，需宿主能力和账户配置 |
| D | Qlib 可复现基线 + 股票研究团队 | 数据与样本外评估完整，仅研究/模拟 | 待实施 |
| E | 内容获客案例 + 商业指标复盘 | 交付物与真实成本/收入分开记录 | 待实施 |

实施前待确定：量化首个市场（A 股/美股/港股）、可用数据源、Grok Bot 实际导入与执行能力。上述选择不阻塞宝玉本地适配。
