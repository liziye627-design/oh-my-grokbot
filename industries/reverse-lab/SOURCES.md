核对日期：2026-10-16。三个仓库已浅克隆到本机 `.omo/research/reverse-upstreams/`（该目录不进入 Git，也不进入 Grok Bot 上传包）。没有运行上游安装脚本，没有把上游提示词抄进角色文件。PentAGI 示例配置里的默认口令、盐和密钥已清空。

| 上游 | 许可 | 处理 |
| --- | --- | --- |
| [REA](https://github.com/morluto/rea) `d72d856` | MIT | 本地副本 `rea/`，4066 个文件。注册表仍是 reference，不捆绑 MCP |
| [reverse-skill](https://github.com/zhaoxuya520/reverse-skill) `cab634b` | 主体 MIT；另含 GPL-3.0 CTF 编排 | 本地副本 `reverse-skill/`，599 个文件。未安装其渗透、CTF 或漏洞利用技能 |
| [PentAGI](https://github.com/vxcontrol/pentagi) `843dfeb` | 源码 MIT，另有 EULA；Cloud SDK 为带例外的 AGPL-3.0 | 本地副本 `pentagi/`，1728 个文件。示例口令已清空。未启动自动渗透系统 |
