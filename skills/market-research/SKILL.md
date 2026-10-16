---
name: market-research
description: Read a named market universe and write dated filings, news, tape, thesis and risk notes. No brokerage and no orders.
license: MIT and Apache-2.0; see NOTICE.md and licenses/
compatibility: Native agent host with permitted public sources and operator-supplied tables. Oh My CLI is optional.
metadata:
  author: oh-my-grokbot
  version: "0.1.0"
  verification: reviewed
---

# market-research

Use after an operator names the symbols, the date window, and the tables they are providing. This skill produces research notes. It does not connect a broker, store trading credentials, or emit orders.

1. Stop when the symbol list or the date window is missing. Separate operator-supplied files from public sources.
2. Filings note: for each symbol, record only figures present in a public filing or an attached statement. Cover company facts, income, balance sheet, cash flow, and any disclosed insider-transaction table the operator attached. Every figure needs a source name, a period or publication date, and the symbol. A missing statement is a gap. Do not invent a number.
3. News note: record public headlines and operator-supplied sentiment extracts inside the window. Each item needs a title or identifier, a publication date, an outlet, and the symbol it names. Social posts are not point-in-time history; say so when the extract is only a recent feed. A missing source is a gap.
4. Tape note: record prices, ranges and volumes only from the operator-supplied price table. Name the column and the date. Do not fill a blank from memory or from an unprovided feed. A missing table is skipped.
5. Thesis: split supporting points, opposing points and a simulation note. Cite only the three notes above. The simulation lists which supplied numbers were compared and which inputs were absent. Stop the arithmetic when a required input is absent. A research stance stays labeled as a hypothesis.
6. Risk review is a different person. If the operator supplied target weights and numeric caps, record whether any single name exceeds the stated per-name cap and whether the sum of absolute weights exceeds the stated gross cap. Weight removed by a cap stays noted as unallocated. Do not redistribute it and do not turn the result into an order. Reject notes that promise future returns or that contain an account action.

When a public feed or a local reference checkout is absent, record skipped and continue with the supplied files. A reference repository's documentation is not evidence that a backtest ran.

Output `universe.md`, `filings-note.md`, `news-note.md`, `tape-note.md`, `thesis.md` and `review.md` according to the current workflow step. See [NOTICE.md](NOTICE.md).
