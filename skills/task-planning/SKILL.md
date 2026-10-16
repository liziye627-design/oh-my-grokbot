---
name: task-planning
description: Turn an objective into owned steps with concrete inputs, outputs and acceptance checks.
license: MIT; see NOTICE.md and licenses/
compatibility: Native agent host with permitted tools. Oh My CLI is optional; native import and account verification are required.
metadata:
  author: oh-my-grokbot
  version: "0.2.0"
  verification: reviewed
---

# task-planning
Use for multi-step delivery. Read the actual requirements and existing project structure first. Input: objective, constraints, authorized resources, desired artifact and deadline/budget.

1. State observable success and global constraints. Identify unknown interfaces, account gates and irreversible actions. Resolve blocking unknowns with a small read-only spike before depending on them.
2. Define steps with one owner, dependencies, exact input/output references and acceptance checks. Use actual paths/interfaces where known; label assumptions explicitly. Make steps independently reviewable without creating gratuitous scaffolding.
3. Keep dependent work sequential. Parallelize only independent domains with separate ownership when collaboration is supported and authorized. Native Bots share the account's computer; a template does not copy a login or credential.
4. Identify external-action approval points and expected cost. Continue already-authorized preparation while an approval is pending; do not execute the dependent action.
5. Track one current step, evidence for completed steps, blockers and changed scope. Reconcile the plan against the final artifacts instead of treating a green build as the whole objective.

Output: task/run references, a short step list (owner, inputs, output, check), assumptions, approval gates and next executable step. Example: research -> evidence review -> draft -> publish approval; publication is not implied by asking for a draft.

See [NOTICE.md](NOTICE.md) for pinned upstream sources and adaptation notes.
