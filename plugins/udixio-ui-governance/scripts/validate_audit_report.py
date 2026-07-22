#!/usr/bin/env python3
"""Validate the stable JSON report contract used by governance checkers."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any


ACTIONS = {"audit", "fix", "validate", "sync", "create"}
STATUSES = {"pass", "fail", "partial"}
SEVERITIES = {"blocker", "major", "minor", "info"}
CONFIDENCES = {"high", "medium", "low"}
DISPOSITIONS = {"open", "fixed", "accepted"}
VALIDATION_STATUSES = {"pass", "fail", "warn", "not-run"}
FINDING_ID = re.compile(r"^[A-Z][A-Z0-9]*-[A-Z][A-Z0-9]*-[0-9]{3}$")


def require_string(value: Any, path: str, errors: list[str]) -> None:
    if not isinstance(value, str) or not value.strip():
        errors.append(f"{path} must be a non-empty string")


def validate_evidence(value: Any, path: str, errors: list[str]) -> None:
    if not isinstance(value, list) or not value:
        errors.append(f"{path} must be a non-empty array")
        return
    for index, item in enumerate(value):
        item_path = f"{path}[{index}]"
        if not isinstance(item, dict):
            errors.append(f"{item_path} must be an object")
            continue
        require_string(item.get("path"), f"{item_path}.path", errors)
        require_string(item.get("detail"), f"{item_path}.detail", errors)
        if "line" in item and (not isinstance(item["line"], int) or item["line"] < 1):
            errors.append(f"{item_path}.line must be a positive integer")


def validate_validation(value: Any, path: str, errors: list[str]) -> None:
    if not isinstance(value, dict):
        errors.append(f"{path} must be an object")
        return
    require_string(value.get("command"), f"{path}.command", errors)
    require_string(value.get("scope"), f"{path}.scope", errors)
    require_string(value.get("summary"), f"{path}.summary", errors)
    if value.get("status") not in VALIDATION_STATUSES:
        errors.append(f"{path}.status must be one of {sorted(VALIDATION_STATUSES)}")


def validate_report(report: Any) -> list[str]:
    errors: list[str] = []
    if not isinstance(report, dict):
        return ["report must be a JSON object"]

    if report.get("schemaVersion") != 1:
        errors.append("schemaVersion must equal 1")
    require_string(report.get("component"), "component", errors)
    if report.get("action") not in ACTIONS:
        errors.append(f"action must be one of {sorted(ACTIONS)}")
    if report.get("status") not in STATUSES:
        errors.append(f"status must be one of {sorted(STATUSES)}")

    validations = report.get("validations")
    if not isinstance(validations, list):
        errors.append("validations must be an array")
        validations = []
    for index, validation in enumerate(validations):
        validate_validation(validation, f"validations[{index}]", errors)

    findings = report.get("findings")
    if not isinstance(findings, list):
        errors.append("findings must be an array")
        findings = []

    identifiers: set[str] = set()
    open_material_findings = False
    for index, finding in enumerate(findings):
        path = f"findings[{index}]"
        if not isinstance(finding, dict):
            errors.append(f"{path} must be an object")
            continue
        identifier = finding.get("id")
        if not isinstance(identifier, str) or not FINDING_ID.fullmatch(identifier):
            errors.append(f"{path}.id must match CHECKER-AREA-NNN")
        elif identifier in identifiers:
            errors.append(f"{path}.id duplicates {identifier}")
        else:
            identifiers.add(identifier)
        if finding.get("severity") not in SEVERITIES:
            errors.append(f"{path}.severity must be one of {sorted(SEVERITIES)}")
        if finding.get("confidence") not in CONFIDENCES:
            errors.append(f"{path}.confidence must be one of {sorted(CONFIDENCES)}")
        disposition = finding.get("disposition")
        if disposition not in DISPOSITIONS:
            errors.append(f"{path}.disposition must be one of {sorted(DISPOSITIONS)}")
        if disposition == "open" and finding.get("severity") in {"blocker", "major"}:
            open_material_findings = True
        for key in ("checker", "framework", "expected", "actual", "impact", "remediation"):
            require_string(finding.get(key), f"{path}.{key}", errors)
        validate_evidence(finding.get("evidence"), f"{path}.evidence", errors)
        finding_validations = finding.get("validation")
        if not isinstance(finding_validations, list):
            errors.append(f"{path}.validation must be an array")
        elif disposition == "fixed" and not finding_validations:
            errors.append(f"{path}.validation must prove a fixed finding")

    failed_validation = any(
        isinstance(item, dict) and item.get("status") == "fail" for item in validations
    )
    if report.get("status") == "pass" and (open_material_findings or failed_validation):
        errors.append("status cannot be pass with open blocker/major findings or failed validation")
    return errors


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("report", help="JSON report path, or - for stdin")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        if args.report == "-":
            report = json.load(sys.stdin)
        else:
            report = json.loads(Path(args.report).read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        print(f"Unable to read report: {error}", file=sys.stderr)
        return 2

    errors = validate_report(report)
    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        return 1
    print("Audit report is valid.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
