"""Parse only observable API output; preserve raw calls and annotations."""

import csv
import json
import re
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlsplit
from uuid import uuid4


def domain(url):
    try:
        return (urlsplit(url).hostname or "").lower()
    except ValueError:
        return ""


def extract(response, query):
    calls, queries, citations, texts, refusals = [], [], [], [], []
    urls = {}
    missing_queries = 0

    def add_source(url, title="", call_id=None, cited=False):
        if not isinstance(url, str) or not url:
            return
        row = urls.setdefault(url, {
            "url": url, "domain": domain(url), "title": title or "",
            "in_search_sources": False, "cited": False,
            "search_call_ids": [], "citation_count": 0,
        })
        if title and not row["title"]:
            row["title"] = title
        if cited:
            row["cited"] = True
            row["citation_count"] += 1
        else:
            row["in_search_sources"] = True
            if call_id and call_id not in row["search_call_ids"]:
                row["search_call_ids"].append(call_id)

    for output_index, item in enumerate(response.get("output") or []):
        if item.get("type") == "web_search_call":
            calls.append(item)
            action = item.get("action") or {}
            if action.get("type") == "search":
                terms = action.get("queries")
                if not isinstance(terms, list) or not terms:
                    terms = [action["query"]] if action.get("query") else []
                terms = [term for term in terms if isinstance(term, str) and term.strip()]
                if not terms:
                    missing_queries += 1
                queries.extend({"call_id": item.get("id"), "query": term} for term in terms)
            for source in action.get("sources") or []:
                add_source(source.get("url"), source.get("title"), item.get("id"))
        elif item.get("type") == "message":
            for content_index, part in enumerate(item.get("content") or []):
                if part.get("type") == "refusal":
                    refusals.append(part.get("refusal", ""))
                if part.get("type") != "output_text":
                    continue
                texts.append(part.get("text", ""))
                for annotation in part.get("annotations") or []:
                    if annotation.get("type") == "url_citation":
                        citations.append({**annotation, "output_index": output_index,
                                          "content_index": content_index})
                        add_source(annotation.get("url"), annotation.get("title"), cited=True)

    actions = Counter((call.get("action") or {}).get("type", "unknown") for call in calls)
    warnings = []
    if missing_queries:
        warnings.append(f"{missing_queries} search call(s) did not expose search queries; fan-out is partial.")
    if not calls:
        warnings.append("No web_search_call was returned.")
    if response.get("status") != "completed":
        warnings.append(f"Response status is {response.get('status')}; output may be incomplete.")
    if refusals:
        warnings.append("The response contains refusal content.")
    summary = {
        "query": query, "response_id": response.get("id"), "model": response.get("model"),
        "created_at": response.get("created_at"), "status": response.get("status"),
        "web_search_call_count": len(calls), "search_call_count": actions["search"],
        "action_counts": dict(actions), "exposed_query_count": len(queries),
        "unique_query_count": len({row["query"] for row in queries}),
        "search_calls_without_queries": missing_queries,
        "source_url_count": sum(row["in_search_sources"] for row in urls.values()),
        "cited_url_count": sum(row["cited"] for row in urls.values()),
        "citation_count": len(citations),
        "source_domains": sorted({row["domain"] for row in urls.values()
                                  if row["in_search_sources"] and row["domain"]}),
        "cited_domains": sorted({row["domain"] for row in urls.values()
                                 if row["cited"] and row["domain"]}),
        "usage": response.get("usage"), "error": response.get("error"),
        "incomplete_details": response.get("incomplete_details"), "warnings": warnings,
    }
    answer = "\n\n".join(texts)
    if refusals:
        answer += "\n\n" + "\n\n".join(refusals)
    # Leave annotation offsets relative to their original content blocks in citations.json.
    if citations:
        answer += "\n\n## References\n\n" + "\n".join(
            f"- <{url}>" for url in dict.fromkeys(c.get("url") for c in citations) if url
        )
    return {"summary": summary, "queries": queries, "calls": calls,
            "citations": citations, "sources": list(urls.values()), "answer": answer.strip() + "\n"}


def create_run_dir(root, query):
    slug = re.sub(r"[^\w-]+", "-", query.lower(), flags=re.UNICODE).strip("-_")[:60] or "query"
    name = f"{datetime.now(timezone.utc):%Y-%m-%d-%H%M%S}-{slug}-{uuid4().hex[:8]}"
    path = Path(root).expanduser().resolve() / name
    path.mkdir(parents=True, exist_ok=False)
    return path


def write_json(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def csv_cell(value):
    # Protect spreadsheet users from formula evaluation; raw JSON remains unchanged.
    if isinstance(value, str) and value.lstrip().startswith(("=", "+", "-", "@")):
        return "'" + value
    return value


def export_report(path, response, query):
    report = extract(response, query)
    for filename, key in [("summary.json", "summary"), ("queries.json", "queries"),
                          ("web-search-calls.json", "calls"), ("citations.json", "citations")]:
        write_json(path / filename, report[key])
    (path / "answer.md").write_text(report["answer"], encoding="utf-8")
    with (path / "sources.csv").open("w", encoding="utf-8-sig", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=["url", "domain", "title", "in_search_sources",
                                                "cited", "search_call_ids", "citation_count"])
        writer.writeheader()
        for row in report["sources"]:
            writer.writerow({key: csv_cell(";".join(value) if isinstance(value, list) else value)
                             for key, value in row.items()})
    from .html_report import write_html_report
    write_html_report(path, report)
    return report["summary"]
