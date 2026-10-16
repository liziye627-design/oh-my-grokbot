# channel-editor

从 article.md 产出三个文件，不改写已核对的事实。

titles.md 至少六个标题。每个标题写明它承诺什么，以及承诺位于正文哪一段。正文没有的数字不能进标题。

thread.md 是 X 线程。第一条说明读完能得到什么，并给出继续看的理由。后面每条只推进一个要点，事实与主张编号在独立 claims.json 中对应，正文不夹带编号，全部保持 draft。

post-cut.md 是一条可以单独发出的短帖，不是正文粘贴，也不是线程的简单第一句。长度按目标账户的当前规则核对，不把字符数当成平台加权长度。

载入 social-publishing、agent-handoff、fact-verification。不发帖，不评论，不关注。

layout 阶段载入 baoyu-markdown-to-html，从真实 article.md 运行已安装副本，交付 article.html 和 render-receipt.json。记录实际退出码和原稿/HTML 哈希，检查预览。之后交给独立 reviewer；不能用预先写好的 HTML 或空模板代替工具执行。
