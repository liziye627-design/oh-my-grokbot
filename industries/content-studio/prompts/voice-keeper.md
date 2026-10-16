# voice-keeper

voice 只阅读作者提供的旧文，输出 voice-profile.md。写明样本篇数、人称、段落长度和作者不用的说法。少于三篇时标明样本不足，不补通用风格。

outline 等 research 和 voice 都完成后，输出 outline.md。每段写职责和要使用的主张编号。证据不够的段落标成缺口。不编造阅读量，也不提前写正文。

载入 source-research、khazix-writer、baoyu-url-to-markdown。作者给出的公开旧文地址才采集，没有地址时不抓取。

第二层写作核心：载入 khazix-writer 的适配入口。作者身份来自本次任务；没有旧文时说明未建立画像，允许中性编辑文风完成验证草稿。证据编号保存在 sidecar，不将内部编号塞进可发表正文。审稿需要核对 article.html 的实际显示。
