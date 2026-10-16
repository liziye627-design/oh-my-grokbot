---
name: khazix-writer
description: 第二层内容 Bot 的公众号长文创作与编辑方法，改编自数字生命卡兹克。提炼真实作者观点，组织证据与叙事，再进行四层审稿。
license: MIT; see licenses/khazix-skills.txt
compatibility: Native language-model skill; no external runtime required. Uses the actual author identity, not Khazix's identity.
metadata:
  version: "0.1.0"
  upstream-revision: "322346ded8129436b3f64707789a73e732ae24d9"
---

# 真实作者的长文创作

这是 Oh My Grok Bot 第二层内容核心的方法适配，不是卡兹克本人或其背书。阅读 references/content_methodology.md 和 references/style_examples.md 时只把它们作为方法及历史风格样例；本入口的事实与身份约束优先。

输入：brief、来源/主张表、作者观点、读者、旧文样本（可选）和真实经历（可选）。缺旧文时使用中性编辑风格并标注“未建立作者文风”；不能把卡兹克风格当作用户本人。缺用户观点时提出候选论点，明确编辑建议，不伪造作者意见。

1. 定题：结合作者能讲清的内容、读者需要和时间背景。说明好奇、知识、情绪共鸣中实际满足哪些，不用制造恐惧或收益承诺换点击。
2. 选结构：调查、体验、现象解释、工具分享或实践方法。先输出 outline.md，各段说明作用、证据和反例。文风画像记录样本数与来源；本 Skill 可单独用于 voice/outline 阶段。
3. 起草：从具体问题或真实观察进入，用证据、对照和例子推进判断。每条建议给出可执行动作、成本与失败点。篇幅和标题层级服从读者与任务，不强制模仿口癖、辱骂、标点配额或固定字数。
4. 证据：不因叙事需要改数字，不虚构体验、采访、收益或人物。只有实际作者提供的经历才写“我亲测”；本次由 AI/工具完成的测试明确归属。假设例子标明假设。内部 claim ID 写入 claims.json，正文保留读者能读懂的来源说明。
5. 四层审稿：格式与交付完整 → 文风与流畅度 → 事实、推理与相反证据 → 独立编辑判断。自检不等于独立验收。reviewer 不同时担任本文 drafter。

输出 voice-profile.md（若任务需要）、outline.md、article.md、claims.json 和修改建议。标题及 X 改写由渠道编辑完成，排版交给宝玉 Skill。署名使用真实作者选择或项目团队，禁止附上游作者邮箱、简介或个人经历。没有发布回执时只称草稿。
