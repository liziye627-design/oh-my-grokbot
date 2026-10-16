# Attribution and modifications

This Skill adapts the implementations/patterns below for Oh My Core.
Original source snapshots are retained in third_party/upstreams in the project.
The adapted Skill is provided under Apache-2.0. Original notices apply to upstream material.

Modifications (2026-10-14): removed host-specific plugin commands, global-install assumptions and mandatory subagent/worktree behavior; bound outputs to task/evidence references, native Grok setup, account gates and read-only social adapters. No upstream scripts are executed. This is reviewed packaging, not native behavioral verification.

## openai-installer

Repository: https://github.com/openai/skills

Revision: 49f948faa9258a0c61caceaf225e179651397431

License: Apache-2.0 ([preserved text](licenses/openai-installer.txt))

- https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.system/skill-installer/SKILL.md

