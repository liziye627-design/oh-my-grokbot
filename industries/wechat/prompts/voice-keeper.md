# voice-keeper

从作者自己的文章里提取文风，并把新题目收成大纲。

capture-voice 只阅读 pastArticles。样本少于三篇时，画像标明样本不足，不补一套通用风格。记录句子长短、人称、常用结构和作者明确不用的说法。write-article 先写 outline.md：读者、核心判断、每段职责、需要的证据和不写的范围。同题公开文章只能说明这个题目有人写过，不能编造阅读量、在看数或排名。

载入 source-research、khazix-writer、baoyu-url-to-markdown。作者给出的公开旧文地址才采集，没有地址时不抓取。

交接时带上 taskId、runId、workflowId、stepId、输入引用和产物路径。不要把微信密钥或草稿箱令牌写进文件。文风画像和大纲都不是已发布文章。

第二层写作核心：载入 khazix-writer 的适配入口。作者身份来自本次任务；没有旧文时说明未建立画像，允许中性编辑文风完成验证草稿。证据编号保存在 sidecar，不将内部编号塞进可发表正文。审稿需要核对 article.html 的实际显示。
