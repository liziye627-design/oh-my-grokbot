# 第二层：子木 GEO 研究能力

来源：[JeffLi1993/open-growth-skills](https://github.com/JeffLi1993/open-growth-skills)，MIT，Copyright 2026 Zimu。固定提交 eecf789af79a03a2dadedc5cea0cd40841f07aee。接入其 chatgpt-fanout-queries 为 zimu-geo-research，原始源码完整保留并锁定哈希。

## Bot 分工

oh-my-content-studio@0.3.0 的研究员调用工具，审稿员核对原始记录，制作人把结果接入正文生产。GEO 属于第二层 Bot 的核心能力；第一层仍负责安装、连接与运行记录。

新增 geo-content-brief 工作流：question + businessContext + responseFile → trace → brief → review → handoff。它是离线输入工作流，不会默认触发付费请求。输出 geo-run.json 指向真实运行目录；geo-brief.md 作为 produce-piece 的 sourceNotes。研究方向仍需用户确定。

完整链路：GEO 查询与信源研究 → 选题/证据简报 → 卡兹克写作 → 宝玉排版 → 独立审核 → 授权交接 → 有真实数据时复盘。

## 安装运行

```sh
node dist/cli.js --workspace ./geo-workspace install oh-my-content-studio --yes --allow-unverified
uv venv ./geo-venv
uv pip install --python ./geo-venv/Scripts/python.exe ./geo-workspace/.ohmy/skills/zimu-geo-research/vendor
PYTHONUTF8=1 ./geo-venv/Scripts/python.exe -B ./geo-workspace/.ohmy/skills/zimu-geo-research/vendor/scripts/run_research.py "原始问题" --from-response /absolute/raw-response.json --output ./geo-runs
```

以上 Python 路径适用于 Windows Git Bash；Unix 使用 geo-venv/bin/python。必须在安装副本中安装依赖，构建会生成 build/egg-info，不能污染仓库受哈希保护的源目录。当前上游 pyproject 声明依赖范围，没有冻结传递依赖；此次验证环境版本记录在 artifacts/geo-validation/dependencies.log，不等于跨时间完全可复现的依赖锁。

本次 Python 3.13.15、openai 2.54.0、python-dotenv 1.2.4；Windows 用 PYTHONUTF8=1 避免系统 GBK 对中文产物的误读。-B 避免在 Skill 目录生成字节码缓存。

实时采样需要账号实际支持的模型、私有 OPENAI_API_KEY 和明确的费用范围；Bot 显式指定 --model 并默认 --no-model-overview，不自动重试。当前仅验证离线 CLI 和上游模拟测试，未进行付费采样。

## 边界与验收

工具记录 API 实际暴露的搜索与引用；不推测隐藏查询，不等同 ChatGPT 网页端或 Grok 搜索。来源出现与最终引用分开。GEO 建议不是排名、收录或收益保证。

[本地验收样例](../examples/content-studio/geo-research/README.md) 使用醒目标注的 synthetic 测试夹具。已真实安装并解析、生成 HTML/JSON/CSV/Markdown，未验证真实市场效果与 Grok 原生宿主。源码许可证、提交和哈希已进入 registry/upstreams.lock.json。

同仓库的 long-blog-to-viral-social-posts 本轮没有复制，以免与已有 X 改写重复；需要扩展 LinkedIn 时可另行评估。

已通过公共 CLI 为该流程生成交接计划：

```sh
node dist/cli.js industry plan oh-my-content-studio geo-content-brief --objective "GEO 研究到内容简报" --inputs examples/content-studio/geo-research/inputs.json --out ./geo-plan.json
```

此样例输入明确为模拟夹具；实际使用替换为真实问题、业务范围和响应文件。生成计划不等于派发或运行 Grok Bot。
