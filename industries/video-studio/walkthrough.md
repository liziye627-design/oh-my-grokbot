# 验收演练

## 本仓库自包含的负向案例

加载 fixtures/brief.json，采用 fixtures/source-transcript.md 生成脚本，核对 expected-storyboard.csv 三镜总时长 30 秒。研究报告必须标注 fixture、非真实转录。权利表记录假设尚未被实际拥有者确认。没有 training-demo.mp4，编辑不得继续渲染，预期与 expected-blocked-delivery.json 一致。不能生成假的 ffprobe 回执，不提交成功验收。这个案例证明阻断约定；文件静态校验不等于原生 Bot 行为已验收。

## 账号与素材具备后的正向案例

1. 用户提供已授权的真实 90 秒视频和内容一致的逐字稿，producer 将实际输入摘要和权限证据写入 brief/rights-ledger。若实际时码不同，修订脚本与镜头表。
2. 运行环境检查 ffmpeg 和 ffprobe 版本、编码器、字体和授权输出位置；没有工具时记录阻断，不臆测已安装。使用已有 GUI 编辑器亦可，但须保留导出设置和真实文件。
3. editor 根据镜头表剪出三个 10 秒片段并按 1080×1920、中文字幕、有音轨导出。实际画幅裁剪不能切掉关键操作，必要时采用留边布局。
4. 记录真实执行结果、文件 bytes、SHA-256；用 ffprobe 保存 streams/format JSON。qa 在播放器中打开文件，检查三镜切点、字幕和声音，将每项 pass/fail 写入 media-qa.md。
5. 把文本证据以 UTF-8 artifacts 交 Gateway；delivery.json 指向验收者有权读取的媒体位置。独立 verifier 获取并检查媒体，核对摘要后才接受任务。任一项失败须修订并使用新产物摘要。

## 故障案例

- 把权限改为 unknown：rights 步骤阻断；不能因可下载而使用。
- 成片摘要与 receipt 不同：QA 拒绝；不得覆盖摘要来掩盖替换。
- 无音轨或时长 29 秒：与 brief 不符，QA 失败。
- 给出只有图片/脚本的 delivery：actualMediaValidated 保持 false。
- 链接不可访问：needs_human，不能确认交付。
- 公共平台上传请求：另建明确目的地/成片摘要的审批提案；本包没有自动发布执行器。
