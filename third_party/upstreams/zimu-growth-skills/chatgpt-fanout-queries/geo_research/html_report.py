"""Render a portable single-query report from observable saved response data."""

import argparse
import html
import json
import re
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlencode, urlsplit

TEMPLATE = Path(__file__).with_name("templates") / "fanout-report-template.html"


def esc(value):
    return html.escape(str(value if value is not None else "Not recorded"), quote=True)


def link(url, label=None):
    """Only allow web links from untrusted research content."""
    try:
        valid = urlsplit(url).scheme.lower() in {"http", "https"} and bool(urlsplit(url).netloc)
    except ValueError:
        valid = False
    if not valid:
        return esc(label or url)
    return f'<a href="{esc(url)}" target="_blank" rel="noopener noreferrer">{esc(label or url)}</a>'


def inline(text):
    # A deliberately small, HTML-free Markdown subset; preserve unsupported syntax.
    parts, offset = [], 0
    for match in re.finditer(r'\[([^\]\n]+)\]\((https?://[^\s)]+)\)', text):
        parts.append(esc(text[offset:match.start()]))
        parts.append(link(match[2], match[1]))
        offset = match.end()
    parts.append(esc(text[offset:]))
    return re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', ''.join(parts))


def answer_html(text):
    """Readable paragraphs and simple tables, without executing embedded HTML."""
    blocks = []
    for block in re.split(r'\n\s*\n', text.strip()):
        lines = block.splitlines()
        if not lines:
            continue
        if len(lines) >= 2 and lines[0].startswith('|') and re.fullmatch(r'[\s|:\-]+', lines[1]):
            rows = [[inline(cell.strip()) for cell in line.strip().strip('|').split('|')] for line in lines]
            head = ''.join(f'<th scope="col">{cell}</th>' for cell in rows[0])
            body = ''.join('<tr>' + ''.join(f'<td>{cell}</td>' for cell in row) + '</tr>' for row in rows[2:])
            blocks.append(f'<table><thead><tr>{head}</tr></thead><tbody>{body}</tbody></table>')
        elif len(lines) == 1 and lines[0].startswith('#'):
            blocks.append(f'<h3>{inline(lines[0].lstrip("# "))}</h3>')
        elif all(line.startswith('- <http') and line.endswith('>') for line in lines):
            blocks.append('<ul>' + ''.join(f'<li>{link(line[3:-1])}</li>' for line in lines) + '</ul>')
        else:
            blocks.append('<p>' + '<br>'.join(inline(line) for line in lines) + '</p>')
    return ''.join(blocks) or '<p class="muted">This response contains no answer text.</p>'


def render_html(report, request=None, artifact_names=(), overview=None):
    s = report['summary']
    queries, calls, sources = report['queries'], report['calls'], report['sources']
    request = request or {}
    settings = request.get('request') or {}
    generated = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')
    recorded = request.get('recorded_at') or 'Not recorded'
    call_numbers = {call.get('id'): i for i, call in enumerate(calls, 1)}
    search_numbers = {call.get('id'): i for i, call in enumerate(
        (call for call in calls if (call.get('action') or {}).get('type') == 'search'), 1
    )}
    overview_html = (f'<div class="overview-query"><span>Original question</span><code>{esc(s["query"])}</code></div>'
                     + (f'<p>{esc(overview.strip())}</p>' if overview and overview.strip()
                        else '<p>No model-generated overview is available for this run. The cards below still show the recorded counts.</p>'))
    if s['warnings']:
        overview_html += '<p class="overview-note"><strong>Note:</strong> This record includes warnings. See Data notes for details.</p>'
    cards = [(s['exposed_query_count'], 'Exposed search queries', f"{s['unique_query_count']} unique queries"),
             (s['search_call_count'], 'Search calls', f"{s['web_search_call_count']} web tool calls"),
             (s['source_url_count'], 'Source URLs', f"Across {len(s['source_domains'])} domains"),
             (s['cited_url_count'], 'Cited URLs', f"{s['citation_count']} citations in the answer")]
    branches = []
    for row in queries:
        # Separate domain tokens for display only; exported queries stay intact.
        pattern = r'(?<!\S)site([:.])(\S+)'
        matches = list(re.finditer(pattern, row['query'], re.I))
        display_query = re.sub(pattern, '', row['query'], flags=re.I).strip()
        domain_meta = ''.join(
            f'<span class="tag">{"Site filter" if match[1] == ":" else "Domain mention"}: {esc(match[2])}</span>'
            for match in matches
        )
        google_query = row['query']
        google_url = 'https://www.google.com/search?' + urlencode({'q': google_query})
        google_link = (f'<a href="{esc(google_url)}" target="_blank" rel="noopener noreferrer"'
                       f' title="{esc(google_query)}" aria-label="Search Google: {esc(google_query)}">Search Google ↗</a>')
        branches.append(f'<li class="branch"><p class="query">{esc(display_query or "Domain information only")}</p>'
                        + f'<div class="branch-meta">{domain_meta}{google_link}</div></li>')
    call_html = []
    action_labels = {'search': 'Search', 'open_page': 'Open page', 'find_in_page': 'Find in page'}
    for index, call in enumerate(calls, 1):
        action = call.get('action') or {}
        terms = [row for row in queries if row['call_id'] == call.get('id')]
        count = sum(call.get('id') in row['search_call_ids'] for row in sources if call.get('id'))
        extra = ''
        if action.get('type') == 'search' and not terms:
            extra = '<p class="note">This search call did not expose its queries.</p>'
        elif action.get('type') != 'search':
            extra = f'<pre>{esc(json.dumps(action, ensure_ascii=False, indent=2))}</pre>'
        heading = (f'Search {search_numbers.get(call.get("id"))}'
                   if action.get('type') == 'search' else f'Web operation {index}')
        call_html.append(f'<article class="call" id="call-{index}"><div class="call-title"><strong>{heading}</strong>'
                         f'<span class="tag">{esc(action_labels.get(action.get("type"), "Other operation"))}</span>'
                         f'<span class="muted">Status: {esc(call.get("status"))}</span></div>'
                         f'<p>{len(terms)} queries · {count} source URLs</p>'
                         f'<details class="technical"><summary>Technical details</summary>'
                         f'<code>{esc(call.get("id"))}</code></details>{extra}</article>')
    domains = Counter(row['domain'] or 'Unknown domain' for row in sources if row['in_search_sources'])
    domain_cited = Counter(row['domain'] or 'Unknown domain' for row in sources if row['in_search_sources'] and row['cited'])
    max_count = max(domains.values(), default=1)
    bars = ''.join(f'<div class="domain-row"><span>{esc(name)}</span><span class="count">{count} / {domain_cited[name]} cited</span>'
                   f'<div class="track"><div class="fill" style="width:{count / max_count * 100:.2f}%"></div></div></div>'
                   for name, count in sorted(domains.items(), key=lambda item: (-item[1], item[0])))
    source_rows = []
    for row in sorted(sources, key=lambda item: (not item['cited'], item['domain'], item['url'])):
        attribution = '、'.join(
            f'Search {search_numbers[cid]}' if cid in search_numbers else f'Web operation {call_numbers[cid]}'
            for cid in row['search_call_ids'] if cid in call_numbers
        )
        attribution = attribution or ('Search sources' if row['in_search_sources'] else 'Cited only')
        citation = f'<span class="tag positive">Cited · {row["citation_count"]} citations</span>' if row['cited'] else '<span class="muted">Not cited</span>'
        url_caption = '<span class="url">' + esc(row['url']) + '</span>' if row['title'] else ''
        source_rows.append(f'<tr data-cited="{str(row["cited"]).lower()}"><td>{link(row["url"], row["title"] or row["url"])}'
                           f'{url_caption}</td>'
                           f'<td>{esc(row["domain"])}</td><td>{esc(attribution)}</td><td>{citation}</td></tr>')
    usage = s.get('usage') or {}
    notes = [('Original question', s['query']), ('Recorded at', recorded), ('Report generated at', generated),
             ('Model / response status', f'{s["model"]} / {s["status"]}'), ('Response ID', s['response_id']),
             ('Reasoning effort / search mode', f'{(settings.get("reasoning") or {}).get("effort", "Not recorded")} / {settings.get("tool_choice", "Not recorded")}'),
             ('Calls by action type', json.dumps(s['action_counts'], ensure_ascii=False)),
             ('Search calls without exposed queries', s['search_calls_without_queries']),
             ('Token usage (input / output / total)', ' / '.join(str(usage.get(k, 'Not recorded')) for k in ('input_tokens', 'output_tokens', 'total_tokens')))]
    slots = {
        'REPORT_TITLE': esc(s['query'] + ' · Fan-out queries report'), 'QUERY': esc(s['query']),
        'GENERATED_AT': esc(generated),
        'META': ''.join(f'<span>{esc(label)}: {esc(value)}</span>' for label, value in [('Model', s['model']), ('Recorded at', recorded), ('Response status', s['status'])]),
        'OVERVIEW': overview_html,
        'KPI_CARDS': ''.join(f'<div class="kpi"><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>' for value, label, detail in cards),
        'QUERY_BRANCHES': ''.join(branches) or '<li class="branch">This response did not expose any search queries.</li>',
        'CALL_RECORDS': ''.join(call_html) or '<p class="muted">This response contains no web tool calls.</p>',
        'DOMAIN_BARS': bars or '<p class="muted">This response contains no source domains.</p>',
        'SOURCE_ROWS': ''.join(source_rows), 'ANSWER_HTML': answer_html(report['answer']), 'ANSWER_RAW': esc(report['answer']),
        'WARNINGS': ''.join(f'<p class="verdict">{esc(warning)}</p>' for warning in s['warnings']),
        'DATA_NOTES': ''.join(f'<tr><th scope="row">{esc(label)}</th><td>{esc(value)}</td></tr>' for label, value in notes),
        'ARTIFACT_LINKS': ''.join(f'<a href="{esc(name)}">{esc(name)}</a>' for name in artifact_names),
    }
    return re.sub(r'\{\{([A-Z_]+)\}\}', lambda match: slots[match[1]], TEMPLATE.read_text(encoding='utf-8'))


def write_html_report(path, report):
    path = Path(path)
    request_path = path / 'request.json'
    request = json.loads(request_path.read_text(encoding='utf-8')) if request_path.exists() else {}
    overview_path = path / 'overview.md'
    overview = overview_path.read_text(encoding='utf-8') if overview_path.exists() else None
    artifacts = [name for name in ('request.json', 'summary.json', 'queries.json', 'web-search-calls.json',
                                   'sources.csv', 'citations.json', 'answer.md', 'overview.md',
                                   'raw-response.json', 'overview-response.json') if (path / name).is_file()]
    output = path / 'report.html'
    output.write_text(render_html(report, request, artifacts, overview), encoding='utf-8')
    return output


def main(argv=None):
    parser = argparse.ArgumentParser(description='Generate report.html from a saved research run without calling the API or changing the original records.')
    parser.add_argument('run_dir', type=Path)
    args = parser.parse_args(argv)
    from .report import extract
    try:
        summary = json.loads((args.run_dir / 'summary.json').read_text(encoding='utf-8'))
        response = json.loads((args.run_dir / 'raw-response.json').read_text(encoding='utf-8'))
        report = extract(response, summary['query'])
        for warning in summary.get('warnings', []):
            if isinstance(warning, str) and warning not in report['summary']['warnings']:
                report['summary']['warnings'].append(warning)
        print(write_html_report(args.run_dir, report))
    except (OSError, ValueError, KeyError) as error:
        parser.exit(1, f'Could not generate the report ({type(error).__name__}). Check raw-response.json and summary.json in the run directory.\n')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
