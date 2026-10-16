# Attribution and modifications

This skill is original wording for Oh My Grok Bot. It records the research shape found in two local checkouts. It does not copy upstream prompts, agent personas, or order-routing code. No upstream install script was run.

Checked 2026-10-16. Local checkouts live in `.omo/research/market-upstreams/` and are not part of Git or the upload bundle.

## ai-hedge-fund

Repository: https://github.com/virattt/ai-hedge-fund

Revision: 78b779c1389e2d1452dc29606d2c4126d859b964

License: MIT ([preserved text](licenses/ai-hedge-fund.txt))

Local reading used the data-client categories (prices, company facts, financial metrics, earnings, news, disclosed insider trades), the assess-then-record pipeline, and the deterministic per-name and gross-exposure caps. Paper brokerage and order construction are not part of this skill.

## trading-agents

Repository: https://github.com/TauricResearch/TradingAgents

Revision: 1394a3f72aa4393e1a98f51b382434c4b4c2d972

License: Apache-2.0 ([preserved text](licenses/trading-agents.txt))

Local reading used the parallel analyst reports for filings, news, recent sentiment and price indicators, followed by supporting and opposing points and a separate risk review. The upstream transaction and portfolio-decision stages are not part of this skill.
