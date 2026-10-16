# Video Studio 数字员工包

五个原生员工：producer（制片）、researcher（研究）、scriptwriter（编剧）、editor（剪辑）、qa（验收）。两条流程分别从资料制作视频、从用户提供的现有媒体改编短片。角色提示词在 prompts；industry.json 是共享引擎读取的声明。版本 0.1.0，角色与流程定义已实现，真实账号绑定及媒体渲染需要各运行环境验收。

## 使用流程

1. 在原生 Bot 环境绑定 Core Skills，按 prompts 创建五个角色。当前 native trigger 仍需人工交接；不能把创建任务理解为自动创建原生员工。
2. 提供 brief、来源、授权、交付规格；改编还需要实际媒体和带时间码的 transcript。URI 必须指向本租户已授权位置，不要把签名下载 token 放进提示词或日志。
3. producer 确认受众、时长、画幅、预算、发布日期与权限。researcher 核验事实，scriptwriter 编制逐镜脚本。producer 审查逐项素材权利后，editor 才能执行渲染。
4. 编辑机预检 ffmpeg/ffprobe（或实际选用编辑器）、字体、编码器和输入文件读取权限。这里不自动安装软件；缺工具时交付规划及 needs_human，不能声称成片完成。
5. editor 输出实际媒体及执行回执。qa 用实际播放器和 ffprobe 检查成片。producer 整理交付，但最终由独立 operator/verifier 验收 Gateway 任务，runner 不能自验成功。

## 实际媒体与 Gateway

Gateway 当前只接受不超过 1 MiB 的 UTF-8 artifact。上传脚本、权利表、probe JSON 和验收报告；二进制视频保存在已授权的宿主文件区/媒体存储，delivery.json 写可访问位置、实际字节数和 SHA-256。验收者必须能取到该文件并重新计算摘要。不能用文字声明或占位链接代替媒体；不得将 MP4 伪装为 UTF-8/base64 来规避限制。宿主文件链接能否跨原生账号访问必须实际验收。

工作流 approvalRequired 表示生产方案和交付需要负责人审核。共享引擎的静态计划本身不执行、也不证明已批准。公开上传、发布或付费生成必须有针对实际目的地与最终内容的授权；当前包没有发布执行器。用户已授权的本地剪辑无需重复索取许可。

## 验收演练

fixtures/brief.json 与 fixtures/source-transcript.md 是虚构但具体的培训片场景；不包含真实视频。fixtures/expected-blocked-delivery.json 是负向预期，不能充当实际产出。按 walkthrough.md 先验缺媒体阻断，再在用户提供素材后执行正常链路。新制作流程同样先经过研究、脚本、权利、预检，缺少素材时停在渲染前。

工作流步骤中的 requiredArtifacts 是该步骤必须产出的证据文件名。编辑失败保留已有文件及错误摘要，不重复付费调用、不盲目覆盖输出。修订必须使用新输出路径并记录前后摘要。Core 权限不授予新平台访问权限。
