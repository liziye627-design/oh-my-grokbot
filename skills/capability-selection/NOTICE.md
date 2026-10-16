# Attribution and modifications

This Skill adapts the implementations/patterns below for Oh My Core.
Original source snapshots are retained in third_party/upstreams in the project.
The adapted Skill is provided under MIT. Original notices apply to upstream material.

Modifications (2026-10-14): removed host-specific plugin commands, global-install assumptions and mandatory subagent/worktree behavior; bound outputs to task/evidence references, native Grok setup, account gates and read-only social adapters. No upstream scripts are executed. This is reviewed packaging, not native behavioral verification.

Modifications (2026-10-16): selection records the task modality (text, image, audio, code). A named third-party model is not treated as installed unless the catalog has a reviewed entry. Native precedence stays ahead of a lower-trust fit.

## vercel-skills

Repository: https://github.com/vercel-labs/skills

Revision: 13e4063a1cf913f5606d57d42ab83a86f5001e04

License: MIT ([preserved text](licenses/vercel-skills.txt))

- https://github.com/vercel-labs/skills/blob/13e4063a1cf913f5606d57d42ab83a86f5001e04/skills/find-skills/SKILL.md

