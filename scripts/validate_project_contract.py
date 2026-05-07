#!/usr/bin/env python3
"""Validate the basic shape of a xiro project contract.

This script is intentionally lightweight. It catches missing sections, missing
scope mode, invalid module statuses, and unresolved blocking modules before
`/xiro spec` plans from a shallow project document.
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


REQUIRED_SECTIONS = [
    "Overview",
    "Scope Mode",
    "Users and Context",
    "Must-Work Journeys",
    "Non-Goals",
    "Module Matrix",
    "Mock, Fixture, and Prototype Boundary",
    "Gold-Test Candidates",
    "Open Questions",
    "Spec-Readiness Status",
    "Interview Transcript (Verbatim)",
]

VALID_SCOPES = {"mockup-prototype", "usable-local", "production-ready"}
VALID_MODULE_STATUSES = {"active", "skipped", "deferred", "blocking"}


def read_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return path.read_text()


def section_names(text: str) -> set[str]:
    names: set[str] = set()
    for line in text.splitlines():
        match = re.match(r"^##\s+(.+?)\s*$", line)
        if match:
            names.add(match.group(1).strip())
    return names


def find_scope(text: str) -> str | None:
    for scope in VALID_SCOPES:
        if scope in text:
            return scope
    return None


def module_rows(text: str) -> list[tuple[str, str]]:
    rows: list[tuple[str, str]] = []
    in_matrix = False
    for line in text.splitlines():
        if line.startswith("## Module Matrix"):
            in_matrix = True
            continue
        if in_matrix and line.startswith("## "):
            break
        if not in_matrix or not line.startswith("|"):
            continue
        cells = [cell.strip().strip("`") for cell in line.strip().strip("|").split("|")]
        if len(cells) < 2:
            continue
        if cells[0].lower() in {"module", "---"}:
            continue
        rows.append((cells[0], cells[1]))
    return rows


def validate(path: Path, template_mode: bool = False) -> list[str]:
    text = read_text(path)
    errors: list[str] = []

    sections = section_names(text)
    for required in REQUIRED_SECTIONS:
        if required not in sections:
            errors.append(f"missing required section: {required}")

    if not find_scope(text) and not template_mode:
        errors.append(
            "missing scope mode: expected one of "
            + ", ".join(sorted(VALID_SCOPES))
        )

    rows = module_rows(text)
    if not rows:
        errors.append("module matrix has no module rows")
    else:
        for module, status in rows:
            status_value = status.lower()
            if "{" in status_value and template_mode:
                continue
            if status_value not in VALID_MODULE_STATUSES:
                errors.append(f"invalid module status for {module}: {status}")

    if "Status: `not ready`" in text or "Status: not ready" in text:
        errors.append("project contract is marked not ready")

    if re.search(r"\|\s*blocking\s*\|[^|]*\|\s*(none|n/a|-)\s*\|", text, re.I):
        errors.append("blocking module row is missing a concrete question")

    return errors


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("path", nargs="?", help="project.md path")
    parser.add_argument("--template", dest="template", help="template project.md path")
    args = parser.parse_args()

    target = args.template or args.path
    if not target:
        parser.error("provide a project.md path or --template path")

    path = Path(target)
    errors = validate(path, template_mode=bool(args.template))
    if errors:
        for error in errors:
            print(f"FAIL: {error}")
        return 1

    print(f"PASS: {path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
