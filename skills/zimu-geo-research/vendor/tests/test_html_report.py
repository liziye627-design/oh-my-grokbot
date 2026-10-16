import json
import tempfile
import unittest
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

from geo_research.html_report import main, render_html
from geo_research.report import extract
from test_research import fixture


class Tags(HTMLParser):
    def __init__(self, source):
        super().__init__()
        self.tags = []
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        self.tags.append((tag, dict(attrs)))


class HtmlReportTests(unittest.TestCase):
    def test_domain_hints_do_not_become_site_operators(self):
        response = fixture()
        response['output'][0]['action']['queries'] = ['site.example.com pricing', 'site:example.com pricing']
        page = render_html(extract(response, 'q'))
        self.assertIn('Domain mention: example.com', page)
        self.assertNotIn('Site filter: site.example.com', page)
        self.assertIn('Site filter: example.com', page)
        self.assertIn('<p class="query">pricing</p>', page)
        google_queries = [parse_qs(urlsplit(attrs['href']).query)['q'][0]
                          for tag, attrs in Tags(page).tags
                          if tag == 'a' and attrs.get('href', '').startswith('https://www.google.com/search?')]
        self.assertEqual(google_queries, ['site.example.com pricing', 'site:example.com pricing'])

    def test_visible_queries_and_call_level_attribution(self):
        page = render_html(extract(fixture(), 'question'))
        self.assertIn('agent 2026', page)
        self.assertIn('This search call did not expose its queries', page)
        self.assertIn('Cited only', page)
        self.assertIn('open_page', page)
        self.assertIn('find_in_page', page)
        self.assertIn('No model-generated overview', page)
        self.assertIn('Exposed search queries', page)
        self.assertIn('<h2>Search queries</h2>', page)
        fanout = page.split('<section id="fanout">', 1)[1].split('</section>', 1)[0]
        self.assertNotIn('ws_1', fanout)
        self.assertNotIn('Search 1', fanout)
        self.assertIn('Technical details', page)
        model_page = render_html(extract(fixture(), 'question'), overview='A model-generated overview.')
        self.assertIn('A model-generated overview.', model_page)
        self.assertIn('<span>Original question</span><code>question</code>', model_page)
        rows = [attrs for tag, attrs in Tags(page).tags if tag == 'tr' and 'data-cited' in attrs]
        self.assertEqual(len(rows), 3)
        self.assertEqual(sum(row['data-cited'] == 'true' for row in rows), 2)
        self.assertNotIn('{{QUERY}}', page)

    def test_untrusted_content_is_inert(self):
        response = fixture()
        response['output'][0]['action']['queries'] = ['<script>alert(1)</script> {{QUERY}}']
        response['output'][0]['action']['sources'][0] = {'url': 'javascript:alert(1)', 'title': '<img src=x onerror=alert(1)>'}
        response['output'][-1]['content'][0]['text'] = '<svg onload=alert(1)> **saved**'
        page = render_html(extract(response, '<script>alert(2)</script>'))
        tags = Tags(page).tags
        self.assertEqual(sum(tag == 'script' for tag, _ in tags), 1)  # Only template interaction script.
        self.assertFalse(any(tag in {'svg', 'img'} for tag, _ in tags))
        self.assertFalse(any(attrs.get('href', '').startswith('javascript:') for _, attrs in tags))
        self.assertIn('&lt;script&gt;alert(2)&lt;/script&gt;', page)
        self.assertIn('<strong>saved</strong>', page)

    def test_empty_and_incomplete_response(self):
        page = render_html(extract({'status': 'incomplete', 'output': []}, 'empty'))
        self.assertIn('This response did not expose any search queries', page)
        self.assertIn('This response contains no source domains', page)
        self.assertIn('This response contains no answer text', page)
        self.assertIn('output may be incomplete', page)

    def test_existing_run_preserves_every_input(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            (root / 'raw-response.json').write_text(json.dumps(fixture()))
            (root / 'summary.json').write_text(json.dumps({
                'query': 'café query', 'warnings': ['Model overview failed (APIStatusError).']
            }))
            (root / 'answer.md').write_text('do not overwrite')
            original = {p.name: p.read_bytes() for p in root.iterdir()}
            self.assertEqual(main([folder]), 0)
            self.assertTrue((root / 'report.html').exists())
            self.assertIn('Model overview failed', (root / 'report.html').read_text())
            self.assertEqual(original, {name: (root / name).read_bytes() for name in original})


if __name__ == '__main__':
    unittest.main()
