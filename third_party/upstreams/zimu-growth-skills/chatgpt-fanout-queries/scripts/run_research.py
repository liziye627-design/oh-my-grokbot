#!/usr/bin/env python3
"""Run the existing GEO research CLI from an unpacked skill directory."""

from pathlib import Path
import sys


SKILL_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SKILL_ROOT))

from geo_research.cli import main  # noqa: E402


if __name__ == "__main__":
    raise SystemExit(main())
