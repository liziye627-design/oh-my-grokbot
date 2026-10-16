# reverse-lab

`oh-my-reverse-lab@0.1.0` 是一名逆向工程师加授权核对、独立审稿。操作者先选择要不要安装这个团队。安装不会自动开始分析。

`confirm-scope` 只根据书面授权和样本引用写出 scope.md。`analyze-artifact` 在范围确认后，根据操作者提供的本地样本和已有证据写 evidence-note.md，再由另一人写 review.md。两条流程都要人工批准。

岗位说明由本项目编写。REA 是可选的本地证据来源，缺失时记 skipped。reverse-skill 与 PentAGI 不进入安装计划。

```bash
pnpm ohmy --json industry choose oh-my-reverse-lab
pnpm ohmy --workspace ./team-workspace install oh-my-reverse-lab --yes --allow-unverified
```

安装返回 needs_human，表示本地文件已部署，原生账号尚未验收。示例输入不能当成真实授权。
