# Input and Output Contract

Use this reference when consuming exported artifacts or changing the implementation.

## Input

The required positional input is one non-empty question. Preserve it verbatim when sending a live request and when recording the run. Existing optional flags and defaults are part of the public interface:

| Option | Default | Meaning |
| --- | --- | --- |
| `--model` | `OPENAI_MODEL`, then `gpt-6.1-sol` | Responses API model; explicit flag takes precedence |
| `--output` | `research` | Parent directory for the new run |
| `--env-file` | `.env` | Local dotenv file; process environment takes precedence |
| `--reasoning-effort` | `low` | `none`, `low`, `medium`, `high`, or `xhigh` |
| `--search-mode` | `required` | Force web search, or use `auto` |
| `--max-output-tokens` | `16000` | Positive output-token limit |
| `--timeout` | `180` | Positive client timeout in seconds |
| `--from-response` | unset | Reparse an existing raw Responses API JSON file without an API call |
| `--no-model-overview` | false | Skip the second, tool-free model request for a English overview |

Live search requests use one `web_search` tool, request `web_search_call.action.sources`, set `store=false`, and do not retry automatically. By default, live mode then sends a second tool-free request to the same model for an overview. Offline mode never calls the API. Relative output and dotenv paths resolve from the current working directory.

## Run Directory

Every invocation creates a distinct UTC timestamped directory with a random suffix. It must not overwrite a prior run. A completed or partially completed response produces:

| Artifact | Contract |
| --- | --- |
| `raw-response.json` | Exact HTTP response body, written before derived parsing; in offline mode, exact input file text |
| `request.json` | Input and request metadata without the API key |
| `summary.json` | Response metadata, usage, observable counts, domains, and warnings |
| `queries.json` | Only search terms exposed by the API, each associated with its call ID |
| `web-search-calls.json` | Each returned `web_search_call`, preserved as received |
| `sources.csv` | Union of search sources and cited URLs, deduplicated by exact URL string |
| `citations.json` | URL-citation annotations with original output/content indexes and offsets |
| `answer.md` | Returned answer text plus a deduplicated reference-link list |
| `report.html` | Self-contained offline report derived from the run |
| `overview-response.json` | Optional raw response from the second live request, when returned |
| `overview.md` | Optional English overview text; not a source of deterministic counts |

`sources.csv` keeps `in_search_sources` and `cited` independent. `search_call_ids` is semicolon-separated, `citation_count` counts citation annotations, and potentially formula-triggering spreadsheet cells receive a leading apostrophe. Raw JSON is never altered for spreadsheet safety.

## Counting Semantics

- `web_search_call_count` counts every Web Search tool call.
- `search_call_count` counts calls whose `action.type` is `search`.
- Opening a page and finding text in a page appear separately in `action_counts`.
- One search call may expose multiple queries or none. Missing queries increment `search_calls_without_queries` and produce a warning.
- Domains retain subdomains. URLs that differ only by tracking parameters remain distinct.
- Citation offsets remain relative to their original response content block, not the concatenated Markdown answer.

Exit status is `0` only for a completed response, `1` for API/file/parse failures or non-completed responses, `2` when no API key is configured, and `130` for interruption.

The primary report is exported before the optional overview request. If the overview fails, research artifacts remain available, a sanitized warning is saved in `summary.json` and shown in `report.html`, and the command returns `1` even if the search response status is `completed`. Do not treat this as a failed search or automatically repeat it.
