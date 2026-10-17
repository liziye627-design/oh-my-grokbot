# 官方开源参考

核查日期：2026-10-15。使用 GitHub 官方组织仓库及其 README/LICENSE 声明核对；这些是将来连接器适配的候选参考，没有下载上游源码、执行安装脚本或配置账户。不是通过许可证即可获得业务账户访问权限。

| 项目 | 已核实内容 | 本包适配方向 | 当前状态 |
| --- | --- | --- | --- |
| [larksuite/node-sdk](https://github.com/larksuite/node-sdk) | 官方 Node 服务端 SDK，MIT；[LICENSE](https://github.com/larksuite/node-sdk/blob/main/LICENSE) | 后续授权的组织数据/办公 API；与现有 Gateway channel SDK 分开审核 | 参考；未新增连接器 |
| [HubSpot/hubspot-api-nodejs](https://github.com/HubSpot/hubspot-api-nodejs) | 官方 HubSpot Node SDK，Apache-2.0；[LICENSE](https://github.com/HubSpot/hubspot-api-nodejs/blob/master/LICENSE) | 将来读取受授权 CRM 导出或受控更新记录 | 参考；当前流程仅接收用户提供导出 |
| [microsoftgraph/msgraph-sdk-typescript](https://github.com/microsoftgraph/msgraph-sdk-typescript) | Microsoft Graph TypeScript SDK，MIT；README 标记预发布；[LICENSE](https://github.com/microsoftgraph/msgraph-sdk-typescript/blob/main/LICENSE) | 将来授权的办公资料读取和审批后的日历/邮件动作 | 参考；需另外选择固定版本及账户权限，不作为已支持能力 |
| [activepieces/activepieces](https://github.com/activepieces/activepieces) | 核心 MIT；企业目录另有许可。2026-10-15 核对 LICENSE 首段 | 可选自动化连接器，不部署服务器 | 注册表 reference；未复制源码 |

选择这些候选的原因是官方维护和显式身份授权接口，不是星标数量。后续接入前应固定 commit/发行版，复查许可证、最小权限与 API 限制，使用测试账户完成读取/写入回执验收。当前包只引用网页，没有复制这些项目的代码，项目本地新增文件沿用仓库 MIT 许可。
