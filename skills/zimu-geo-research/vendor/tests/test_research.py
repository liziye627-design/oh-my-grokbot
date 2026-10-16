import contextlib
import csv
import io
import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import httpx
from openai import OpenAI

from geo_research.cli import OVERVIEW_INSTRUCTIONS, main
from geo_research.report import extract


def fixture(status="completed"):
    return {
        "id": "resp_fixture", "model": "gpt-5.4", "created_at": 1788652800,
        "status": status, "usage": {"total_tokens": 120},
        "output": [
            {"type": "web_search_call", "id": "ws_1", "status": "completed", "action": {
                "type": "search", "queries": ["agent 2026", "coding tools"],
                "sources": [{"type": "url", "url": "https://a.example/page", "title": "=unsafe"},
                            {"type": "url", "url": "https://b.example/"}]}},
            {"type": "web_search_call", "id": "ws_2", "action": {"type": "search"}},
            {"type": "web_search_call", "id": "ws_3", "action": {
                "type": "open_page", "url": "https://a.example/page"}},
            {"type": "web_search_call", "id": "ws_4", "action": {
                "type": "find_in_page", "pattern": "coding", "url": "https://a.example/page"}},
            {"type": "message", "content": [
                {"type": "output_text", "text": "Answer one.", "annotations": [
                    {"type": "url_citation", "url": "https://a.example/page", "title": "A",
                     "start_index": 0, "end_index": 6}]},
                {"type": "output_text", "text": "Answer two.", "annotations": [
                    {"type": "url_citation", "url": "https://c.example/", "title": "C",
                     "start_index": 0, "end_index": 6}]}]},
        ],
    }


class ResearchTests(unittest.TestCase):
    def test_observable_counts_and_source_citation_distinction(self):
        report = extract(fixture(), "question")
        summary = report["summary"]
        self.assertEqual(summary["web_search_call_count"], 4)
        self.assertEqual(summary["search_call_count"], 2)
        self.assertEqual(summary["exposed_query_count"], 2)
        self.assertEqual(summary["search_calls_without_queries"], 1)
        self.assertEqual(summary["source_url_count"], 2)
        self.assertEqual(summary["cited_url_count"], 2)
        self.assertEqual(summary["cited_domains"], ["a.example", "c.example"])
        self.assertFalse(report["sources"][1]["cited"])
        self.assertFalse(report["sources"][2]["in_search_sources"])
        self.assertEqual(report["citations"][1]["content_index"], 1)
        self.assertIn("Answer two.", report["answer"])

    def test_legacy_query_duplicates_and_absent_output(self):
        response = fixture()
        response["output"][1]["action"]["query"] = "agent 2026"
        summary = extract(response, "q")["summary"]
        self.assertEqual(summary["exposed_query_count"], 3)
        self.assertEqual(summary["unique_query_count"], 2)
        self.assertEqual(summary["search_calls_without_queries"], 0)
        empty = extract({"status": "incomplete", "output": []}, "q")
        self.assertEqual(empty["summary"]["source_url_count"], 0)
        self.assertEqual(len(empty["summary"]["warnings"]), 2)

    def test_offline_exports_raw_integrity_and_no_overwrites(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            raw = json.dumps(fixture(), indent=3)
            source = root / "fixture.json"
            source.write_text(raw)
            args = ["café / ../ query", "--from-response", str(source), "--output", str(root / "runs")]
            with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
                self.assertEqual(main(args), 0)
                self.assertEqual(main(args), 0)
            runs = list((root / "runs").iterdir())
            self.assertEqual(len(runs), 2)
            for run in runs:
                self.assertEqual((run / "raw-response.json").read_text(), raw)
                self.assertEqual(len(list(run.iterdir())), 9)
                self.assertIn("café / ../ query", (run / "report.html").read_text())
                with (run / "sources.csv").open(encoding="utf-8-sig") as file:
                    rows = list(csv.DictReader(file))
                self.assertEqual(rows[0]["title"], "'=unsafe")

    def test_sdk_request_and_complete_export(self):
        observed = []
        raw = json.dumps(fixture(), indent=3)

        def handler(request):
            observed.append(json.loads(request.content))
            self.assertEqual(str(request.url), "https://api.openai.com/v1/responses")
            body = raw if len(observed) == 1 else json.dumps({"output": [{"type": "message", "content": [
                {"type": "output_text", "text": "The search explored several approaches and cited technical documentation."}]}]})
            return httpx.Response(200, text=body, headers={"content-type": "application/json"})

        client = OpenAI(api_key="test-key", http_client=httpx.Client(transport=httpx.MockTransport(handler)))
        with tempfile.TemporaryDirectory() as folder, patch.dict(os.environ, {"OPENAI_API_KEY": "test-key"}), \
                patch("geo_research.cli.OpenAI", return_value=client), \
                contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
            self.assertEqual(main(["question", "--output", folder,
                                   "--env-file", str(Path(folder) / "missing.env")]), 0)
            run = next(Path(folder).iterdir())
            self.assertEqual((run / "raw-response.json").read_text(), raw)
            self.assertEqual((run / "overview.md").read_text(), "The search explored several approaches and cited technical documentation.\n")
            self.assertIn("The search explored several approaches and cited technical documentation.", (run / "report.html").read_text())
            self.assertNotIn("test-key", (run / "request.json").read_text())
        self.assertEqual(observed[0]["include"], ["web_search_call.action.sources"])
        self.assertEqual(observed[0]["tools"], [{"type": "web_search"}])
        self.assertEqual(observed[0]["tool_choice"], "required")
        self.assertEqual(observed[0]["model"], "gpt-6.1-sol")
        self.assertEqual(observed[1]["instructions"], OVERVIEW_INSTRUCTIONS)
        self.assertIn("natural English", observed[1]["instructions"])
        self.assertIn("Do not translate, paraphrase, summarize, or replace it.", observed[1]["instructions"])
        self.assertNotIn("tools", observed[1])

    def test_model_environment_and_cli_precedence(self):
        observed = []
        raw = json.dumps(fixture())

        def handler(request):
            observed.append(json.loads(request.content))
            return httpx.Response(200, text=raw, headers={"content-type": "application/json"})

        clients = [OpenAI(api_key="test-key", http_client=httpx.Client(transport=httpx.MockTransport(handler)))
                   for _ in range(2)]
        with tempfile.TemporaryDirectory() as folder, \
                patch.dict(os.environ, {"OPENAI_API_KEY": "test-key", "OPENAI_MODEL": "gpt-env-model"}), \
                patch("geo_research.cli.OpenAI", side_effect=clients), \
                contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
            self.assertEqual(main(["question", "--output", folder]), 0)
            self.assertEqual(main(["question", "--output", folder, "--model", "gpt-cli-model"]), 0)
        self.assertEqual([request["model"] for request in observed],
                         ["gpt-env-model", "gpt-env-model", "gpt-cli-model", "gpt-cli-model"])

    def test_overview_failure_preserves_primary_report_without_retry(self):
        for failure in ("http", "empty", "invalid-json"):
            with self.subTest(failure=failure):
                requests = []
                raw = json.dumps(fixture())

                def handler(request):
                    requests.append(request)
                    if len(requests) == 1:
                        return httpx.Response(200, text=raw, headers={"content-type": "application/json"})
                    if failure == "http":
                        return httpx.Response(429, json={"error": {"message": "secret-test-key"}})
                    body = '{"output": []}' if failure == "empty" else '{invalid-json'
                    return httpx.Response(200, text=body, headers={"content-type": "application/json"})

                client = OpenAI(api_key="secret-test-key", max_retries=0,
                                http_client=httpx.Client(transport=httpx.MockTransport(handler)))
                with tempfile.TemporaryDirectory() as folder, \
                        patch.dict(os.environ, {"OPENAI_API_KEY": "secret-test-key"}), \
                        patch("geo_research.cli.OpenAI", return_value=client), \
                        contextlib.redirect_stdout(io.StringIO()), \
                        contextlib.redirect_stderr(io.StringIO()) as stderr:
                    self.assertEqual(main(["question", "--output", folder]), 1)
                    run = next(Path(folder).iterdir())
                    self.assertEqual((run / "raw-response.json").read_text(), raw)
                    self.assertTrue((run / "sources.csv").exists())
                    summary = json.loads((run / "summary.json").read_text())
                    self.assertEqual(summary["status"], "completed")
                    self.assertTrue(any("overview failed" in warning for warning in summary["warnings"]))
                    page = (run / "report.html").read_text()
                    self.assertIn("overview failed", page)
                    self.assertNotIn("secret-test-key", page + stderr.getvalue())
                self.assertEqual(len(requests), 2)

    def test_missing_key_makes_no_request(self):
        with tempfile.TemporaryDirectory() as folder, patch.dict(os.environ, {"OPENAI_API_KEY": ""}), \
                patch("geo_research.cli.OpenAI") as client, contextlib.redirect_stderr(io.StringIO()):
            self.assertEqual(main(["question", "--env-file", folder + "/missing"]), 2)
            client.assert_not_called()

    def test_api_error_is_sanitized_and_not_retried(self):
        requests = []

        def handler(request):
            requests.append(request)
            return httpx.Response(401, json={"error": {"message": "secret-test-key", "type": "invalid_request_error"}})

        client = OpenAI(api_key="secret-test-key", max_retries=0,
                        http_client=httpx.Client(transport=httpx.MockTransport(handler)))
        with tempfile.TemporaryDirectory() as folder, patch.dict(os.environ, {"OPENAI_API_KEY": "secret-test-key"}), \
                patch("geo_research.cli.OpenAI", return_value=client), \
                contextlib.redirect_stderr(io.StringIO()) as stderr:
            self.assertEqual(main(["question", "--output", folder]), 1)
            run = next(Path(folder).iterdir())
            self.assertNotIn("secret-test-key", (run / "error.json").read_text() + stderr.getvalue())
        self.assertEqual(len(requests), 1)

    def test_incomplete_response_is_saved_but_returns_failure(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            source = root / "response.json"
            source.write_text(json.dumps(fixture("incomplete")))
            with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
                self.assertEqual(main(["q", "--from-response", str(source), "--output", str(root / "runs")]), 1)
            self.assertTrue(next((root / "runs").iterdir()).joinpath("raw-response.json").exists())


if __name__ == "__main__":
    unittest.main()
