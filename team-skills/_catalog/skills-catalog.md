# Skills catalog (installed 2026-10-16 CST) — 18 installed skills

Location: /home/box/agent-data/workflows/<id>/ (bundled files copied alongside SKILL.md)

| id | source (stars) | license | category | assigned teams/bots |
|---|---|---|---|---|
| dev-frontend-design | https://github.com/anthropics/skills (181.5k★) | Apache-2.0 | dev/design | app-studio (architect, implementer), design-studio |
| design-canvas-design | https://github.com/anthropics/skills (181.5k★) | Apache-2.0 | design | design-studio, content-studio/wechat (producer), video-studio |
| design-theme-factory | https://github.com/anthropics/skills (181.5k★) | Apache-2.0 | design | design-studio, office-team, app-studio |
| design-algorithmic-art | https://github.com/anthropics/skills (181.5k★) | Apache-2.0 | design | design-studio (motion-designer), video-studio |
| content-internal-comms | https://github.com/anthropics/skills (181.5k★) | Apache-2.0 | content | core-team (chief-of-staff), business-operations, office-team, solo-company |
| dev-mcp-builder | https://github.com/anthropics/skills (181.5k★) | Apache-2.0 | dev | app-studio (architect, implementer), engineering-lab (ai engineer) |
| dev-webapp-testing | https://github.com/anthropics/skills (181.5k★) | Apache-2.0 | dev/testing | app-studio (qa, reviewer), engineering-lab (test engineer) |
| design-style-minimal | https://github.com/bergside/awesome-design-skills (3.2k★) | MIT | design | design-studio, app-studio |
| design-style-editorial | https://github.com/bergside/awesome-design-skills (3.2k★) | MIT | design | design-studio, content-studio/wechat (channel-editor, producer) |
| design-style-corporate | https://github.com/bergside/awesome-design-skills (3.2k★) | MIT | design | design-studio, office-team, solo-company |
| game-feel | https://github.com/gamedev-skills/awesome-gamedev-agent-skills (1.5k★) | Apache-2.0 | game | specialist-lab (game-designer) |
| game-level-design | https://github.com/gamedev-skills/awesome-gamedev-agent-skills (1.5k★) | Apache-2.0 | game | specialist-lab (game-designer) |
| game-ui-ux | https://github.com/gamedev-skills/awesome-gamedev-agent-skills (1.5k★) | Apache-2.0 | game | specialist-lab (game-designer), design-studio |
| game-procedural-gen | https://github.com/gamedev-skills/awesome-gamedev-agent-skills (1.5k★) | Apache-2.0 | game | specialist-lab (game-designer) |
| game-dialogue-systems | https://github.com/gamedev-skills/awesome-gamedev-agent-skills (1.5k★) | Apache-2.0 | game | specialist-lab (game-designer) |
| game-genre-rpg | https://github.com/gamedev-skills/awesome-gamedev-agent-skills (1.5k★) | Apache-2.0 | game | specialist-lab (game-designer) |
| game-genre-card-game | https://github.com/gamedev-skills/awesome-gamedev-agent-skills (1.5k★) | Apache-2.0 | game | specialist-lab (game-designer) |
| game-genre-roguelike | https://github.com/gamedev-skills/awesome-gamedev-agent-skills (1.5k★) | Apache-2.0 | game | specialist-lab (game-designer) |
## Rejected
| skill | source | reason |
|---|---|---|
| docx, xlsx, pptx, pdf | anthropics/skills | Source-available, "All rights reserved" proprietary license; also rely heavily on bundled scripts |
| doc-coauthoring | anthropics/skills | No license file in folder; repo has no root license |
| brand-guidelines | anthropics/skills | Anthropic's own brand only; not useful for us |
| claude-api, academy-guide, discernment-nudge | anthropics/skills | Vendor/product-specific, not relevant to our teams |
| skill-creator | anthropics/skills | Overlaps existing team-skill-authoring; value depends on large bundled script/eval tooling |
| web-artifacts-builder | anthropics/skills | Value depends on bundled shell scripts + opaque shadcn-components.tar.gz archive |
| slack-gif-creator | anthropics/skills | Slack-specific, needs pip requirements |
| other ~50 design styles | bergside/awesome-design-skills | Kept 3 representative styles to avoid bloat; others can be added on request |
| godot-* and remaining genres/disciplines | gamedev-skills/awesome-gamedev-agent-skills | Engine-specific / not requested; kept engine-neutral design skills |

## Notes
- Vetting: grep for remote downloads, credentials, sending messages, prompt-override text; only benign hits (mcp-builder mentions `npx @modelcontextprotocol/inspector` as optional testing; webapp-testing ships an inspected local `with_server.py` that starts local dev servers via subprocess).
- Gaps (no reputable high-star source found this pass): research/finance/market-desk, office docs (xlsx/pptx/docx open-licensed alternatives).

## Revision 2026-10-16 23:20 CST
- Count reconciled: 18 installed (7 anthropics, 3 bergside, 8 gamedev-skills); earlier "17" was a miscount.
- LICENSE (MIT) added to 3 design-style-*; LICENSE + NOTICE (Apache-2.0) added to 8 game-*; 7 anthropics skills already carry LICENSE.txt.
- Descriptions made generic (team notes / "Claude" removed); team mapping lives only in this catalog.
- dev-mcp-builder: approval-required note added for npx inspector and scripts/evaluation.py.
