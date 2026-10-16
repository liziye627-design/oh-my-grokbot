# Skills catalog (installed 2026-10-16 CST) — 18 installed skills

Location: <grokbot-workflows>/<id>/ (bundled files copied alongside SKILL.md)

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

## Round 2 installed (2026-10-16 23:35 CST) — 11 skills
| id | source (stars) | license | category | assigned teams/bots |
|---|---|---|---|---|
| research-competitive-intel | alirezarezvani/claude-skills (28.3k★) | MIT | research | research-lab (competitor-scout, industry-analyst) |
| finance-financial-analyst | alirezarezvani/claude-skills (28.3k★) | MIT | finance | market-desk (filings-reader, thesis-writer, risk-reviewer), specialist-lab/financial-researcher, solo-company/finance-reviewer |
| social-media-analyzer | alirezarezvani/claude-skills (28.3k★) | MIT | social | x-growth (researcher, reviewer), content-studio/channel-editor |
| eng-spec-driven-workflow | alirezarezvani/claude-skills (28.3k★) | MIT | eng | engineering-lab (requirements engineer), app-studio/product-analyst |
| eng-embedded-iot-mentor | alirezarezvani/claude-skills (28.3k★) | MIT | eng | engineering-lab (embedded engineer) |
| sales-proposal-writer | alirezarezvani/claude-skills (28.3k★) | MIT | sales | sales-team (proposal-writer), solo-company/sales-lead |
| sales-engineer | alirezarezvani/claude-skills (28.3k★) | MIT | sales | sales-team (sales-engineer, company-researcher) |
| agile-product-owner | alirezarezvani/claude-skills (28.3k★) | MIT | eng/product | engineering-lab (requirements), app-studio/product-analyst |
| brand-voice-enforcement | anthropics/knowledge-work-plugins partner-built/brand-voice (29.9k★ repo; MIT Tribe AI) | MIT | content | content-studio/voice-keeper, wechat/title-editor, sales-team |
| reverse-ghidra-static-analysis | mukul975/Anthropic-Cybersecurity-Skills (34.5k★) | Apache-2.0 | reverse | reverse-lab ONLY (authorization-gate + per-use consent) |
| reverse-firmware-binwalk | mukul975/Anthropic-Cybersecurity-Skills (34.5k★) | Apache-2.0 | reverse | reverse-lab ONLY (authorization-gate + per-use consent); eng embedded may consult methodology after gate |

### Dedupe (not installed; Mika's live versions win)
research-market-research, research-deep-research, content-copywriting, content-creator, social-x-growth → superseded by Mika market-research / source-research+fact-verification / khazix-writer / social-research.

### Remaining gaps
office docs (docx/xlsx/pptx/pdf) permissive SKILL.md; market-desk filings/tape/universe-specific; sales crm-manager/lead-hunter prospecting; network protocol RE methodology. Supplement B 12 awaiting re-review after LICENSE+Source fix.

## Supplement B installed (2026-10-16 23:40 CST) — 11 of 12
| id | source (stars) | license | category | assigned teams/bots |
|---|---|---|---|---|
| sector-overview | anthropics/financial-services (40.1k★) | Apache-2.0 | finance/research | market-desk (news-reader, universe-clerk), research-lab (industry-analyst), specialist-lab/financial-researcher |
| thesis-tracker | anthropics/financial-services (40.1k★) | Apache-2.0 | finance | market-desk (thesis-writer), specialist-lab/financial-researcher |
| catalyst-calendar | anthropics/financial-services (40.1k★) | Apache-2.0 | finance | market-desk (tape-reader, news-reader, universe-clerk) |
| earnings-analysis | anthropics/financial-services (40.1k★) | Apache-2.0 | finance | market-desk (filings-reader, thesis-writer, news-reader), specialist-lab/financial-researcher |
| variance-analysis | anthropics/knowledge-work-plugins (29.9k★) | Apache-2.0 | finance | market-desk (risk-reviewer), solo-company/finance-reviewer (complements finance-financial-analyst) |
| risk-assessment | anthropics/knowledge-work-plugins (29.9k★) | Apache-2.0 | ops/risk | market-desk (risk-reviewer), business-operations, solo-company/finance-reviewer (operational risk, not investment) |
| search-strategy | anthropics/knowledge-work-plugins (29.9k★) | Apache-2.0 | research | research-lab (source-researcher), complements Mika source-research |
| knowledge-synthesis | anthropics/knowledge-work-plugins (29.9k★) | Apache-2.0 | research | research-lab (source-researcher, fact-checker), knowledge-keeper |
| customer-research | anthropics/knowledge-work-plugins (29.9k★) | Apache-2.0 | research/support | business-operations (customer-support), research-lab |
| draft-content | anthropics/knowledge-work-plugins (29.9k★) | Apache-2.0 | content | content-studio/drafter, wechat/drafter (broader than WeChat; partial overlap with Mika khazix-writer noted) |
| performance-report | anthropics/knowledge-work-plugins (29.9k★) | Apache-2.0 | social/content | x-growth (reviewer), content-studio/channel-editor, complements social-media-analyzer |

### Dedupe drop (Supplement B)
- competitive-brief — NOT installed; overlaps research-competitive-intel (already live). Staged under skills-candidates/competitive-brief.
