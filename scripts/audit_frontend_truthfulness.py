#!/usr/bin/env python3
"""Heuristic audit for obvious frontend truthfulness risks.

This is not a replacement for tests. It flags patterns that often indicate
fixture leakage, inert controls, or placeholder production UI.
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


DEFAULT_EXTENSIONS = {
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".vue",
    ".svelte",
    ".html",
}

PATTERNS = [
    ("empty handler", re.compile(r"on[A-Z][A-Za-z0-9_]*=\{\s*\(\s*\)\s*=>\s*\{\s*\}\s*\}")),
    ("placeholder text", re.compile(r"\b(TODO|coming soon|placeholder|not connected yet)\b", re.I)),
    ("fake success", re.compile(r"\b(fake|stub|dummy)\b.*\b(success|saved|complete|done)\b", re.I)),
    ("fixture import", re.compile(r"from\s+['\"][^'\"]*(fixture|mock|dummy)[^'\"]*['\"]", re.I)),
    ("design flag", re.compile(r"\b(DESIGN_MODE|MOCK_MODE|FIXTURE_MODE)\b")),
]


def iter_files(root: Path) -> list[Path]:
    if root.is_file():
        return [root]
    files: list[Path] = []
    for path in root.rglob("*"):
        if path.is_file() and path.suffix in DEFAULT_EXTENSIONS:
            if any(part in {"node_modules", "dist", "build", ".next", "coverage"} for part in path.parts):
                continue
            files.append(path)
    return files


def scan_file(path: Path) -> list[tuple[int, str, str]]:
    try:
        text = path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return []

    findings: list[tuple[int, str, str]] = []
    for lineno, line in enumerate(text.splitlines(), start=1):
        for label, pattern in PATTERNS:
            if pattern.search(line):
                findings.append((lineno, label, line.strip()))
    return findings


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("paths", nargs="+", help="frontend files or directories to audit")
    parser.add_argument("--allow", action="append", default=[], help="case-insensitive substring to ignore")
    args = parser.parse_args()

    allow = [item.lower() for item in args.allow]
    total = 0

    for raw in args.paths:
        root = Path(raw)
        for path in iter_files(root):
            for lineno, label, line in scan_file(path):
                rendered = f"{path}:{lineno}: {label}: {line}"
                if any(token in rendered.lower() for token in allow):
                    continue
                print(rendered)
                total += 1

    if total:
        print(f"FAIL: {total} truthfulness finding(s)")
        return 1

    print("PASS: no obvious frontend truthfulness findings")
    return 0


if __name__ == "__main__":
    sys.exit(main())
