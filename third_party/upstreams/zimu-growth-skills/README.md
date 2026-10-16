# Open Growth Skills

[Chinese](README.zh.md)

A collection of growth methods I've developed as Zimu, distilled into Agent
Skills and shared as open source.

My goal is to turn growth practices that once relied on individual experience
into skills that agents can run repeatedly and the community can improve together.

Each skill is a self-contained directory with a `SKILL.md` entry point. The
collection currently contains two skills:

| Skill | Use it for | Requirements |
| --- | --- | --- |
| [long-blog-to-viral-social-posts](long-blog-to-viral-social-posts/SKILL.md) | Turn one substantive article into three differentiated LinkedIn/X posts, with audience fit, source-grounded hooks and first-comment CTAs; optionally create a visual after selection. | Article text, file or accessible URL. Browsing for current rules/trends; an image or design tool for requested visuals. |
| [chatgpt-fanout-queries](chatgpt-fanout-queries/SKILL.md) | Capture visible search queries, tool calls, sources, citations and answers from the OpenAI Responses API into a local HTML report. | Python 3.10+ and package dependencies. Live research also requires network access, an API key and model access. |

## Install

Install a skill from a local checkout using your agent's skill installer. For
clients supporting the `skills` CLI, run from this repository root:

```sh
npx skills add ./long-blog-to-viral-social-posts
npx skills add ./chatgpt-fanout-queries
```

`agents/openai.yaml` provides optional Codex interface metadata. The required
portable entry point is `SKILL.md`; Python runtime dependencies are declared in
`chatgpt-fanout-queries/pyproject.toml`. See
[the research skill](chatgpt-fanout-queries/SKILL.md) for environment setup and
command-line usage.

## Use

```text
Use $long-blog-to-viral-social-posts.
Language: Chinese
Audience: SaaS founders
Destination URL: <your article or resource URL>

<paste a substantive article>
```

The default portfolio is two LinkedIn posts and one X post, each with a matching
author comment/reply CTA. A full article usually has 500+ words or 800+ CJK body
characters; shorter evidence-rich research and case studies can also qualify.
Platform mix, language and voice can be specified. Missing destination links
are marked as placeholders. By default, choose a post and visual direction
before image generation; you can also delegate those choices upfront. Virality
is an editorial objective, never a promised outcome.

```text
Use $chatgpt-fanout-queries.
Research question: best ai video generator
```

Live research makes a paid search request and, by default, a second tool-free
request for an English overview. Use `--no-model-overview` to omit the second
request. To analyze saved response JSON without calling the API:

```sh
python3 chatgpt-fanout-queries/scripts/run_research.py "Original question" \
  --from-response /path/to/raw-response.json --output ./research
```

The report describes observable API output; it does not expose hidden searches
or reproduce the ChatGPT product interface. Automatic retries are disabled.

## Structure

```text
open-growth-skills/
├── long-blog-to-viral-social-posts/
│   ├── SKILL.md
│   ├── agents/openai.yaml
│   ├── assets/hook-templates.md
│   └── references/
│       ├── platform-rules.md
│       ├── chinese-humanizer.md
│       └── output-package.md
├── chatgpt-fanout-queries/
│   ├── SKILL.md
│   ├── agents/openai.yaml
│   ├── scripts/run_research.py
│   ├── geo_research/
│   ├── references/output-contract.md
│   ├── tests/
│   ├── pyproject.toml
│   └── .env.example
├── README.md
└── README.zh.md
```

Local virtual environments, secret configuration, caches and generated run
outputs are excluded by `.gitignore`. Ignore rules do not affect manual folder
copies: exclude these files explicitly when packaging skills. Existing visual
examples may be retained locally; they are not required for skill execution.

## Validation

With the research dependencies installed:

```sh
cd chatgpt-fanout-queries
python3 -m unittest discover -s tests -v
```

Tests use mock HTTP responses and incur no API charges. Skill metadata follows
the [Agent Skills specification](https://agentskills.io/specification).

## License

This project is licensed under the [MIT License](LICENSE).
