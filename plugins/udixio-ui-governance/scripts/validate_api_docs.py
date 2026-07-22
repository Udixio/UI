#!/usr/bin/env python3
"""Validate the deterministic structure of generated Udixio API documentation."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any


KNOWN_FRAMEWORKS = {"react", "angular"}
REQUIRED_TAGS = ("devx", "a11y", "limitations")
TAG_FIELDS = {"status", "category", "parent", *REQUIRED_TAGS}
ROOT_FIELDS = {"schemaVersion", "displayName", "defaultFramework", "frameworks"}
ITEM_FIELDS = {
    "name",
    "description",
    "required",
    "type",
    "defaultValue",
    "alias",
}


class DuplicateKeyError(ValueError):
    """Raised when JSON contains a duplicate object key."""


def object_without_duplicate_keys(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for key, value in pairs:
        if key in result:
            raise DuplicateKeyError(f"duplicate JSON key {key!r}")
        result[key] = value
    return result


def non_empty_string(value: Any) -> bool:
    return isinstance(value, str) and bool(value.strip())


def validate_item(path: str, key: str, item: Any) -> list[str]:
    errors: list[str] = []
    if not isinstance(item, dict):
        return [f"{path} must be an object"]
    unexpected = sorted(set(item) - ITEM_FIELDS)
    if unexpected:
        errors.append(f"{path} contains unsupported fields: {', '.join(unexpected)}")
    if item.get("name") != key:
        errors.append(f"{path}.name must equal its record key {key!r}")
    if not non_empty_string(item.get("description")):
        errors.append(f"{path}.description must be a non-empty string")
    if not isinstance(item.get("required"), bool):
        errors.append(f"{path}.required must be a boolean")
    item_type = item.get("type")
    if not isinstance(item_type, dict) or not non_empty_string(item_type.get("name")):
        errors.append(f"{path}.type.name must be a non-empty string")
    default_value = item.get("defaultValue", object())
    if default_value is not None and (
        not isinstance(default_value, dict)
        or "value" not in default_value
        or not non_empty_string(default_value.get("value"))
    ):
        errors.append(f"{path}.defaultValue must be null or {{\"value\": <non-empty string>}}")
    if "alias" in item and not non_empty_string(item["alias"]):
        errors.append(f"{path}.alias must be a non-empty string when present")
    return errors


def validate_record(path: str, value: Any) -> list[str]:
    if not isinstance(value, dict):
        return [f"{path} must be an object"]
    errors: list[str] = []
    for key, item in value.items():
        errors.extend(validate_item(f"{path}.{key}", key, item))
    return errors


def validate_content(path: str, value: Any) -> list[str]:
    if not isinstance(value, dict):
        return [f"{path} must be an object"]
    errors: list[str] = []
    fields = {"name", "selector", "description"}
    for key, slot in value.items():
        slot_path = f"{path}.{key}"
        if not isinstance(slot, dict):
            errors.append(f"{slot_path} must be an object")
            continue
        unexpected = sorted(set(slot) - fields)
        if unexpected:
            errors.append(
                f"{slot_path} contains unsupported fields: {', '.join(unexpected)}"
            )
        if slot.get("name") != key:
            errors.append(f"{slot_path}.name must equal its record key {key!r}")
        for field in ("selector", "description"):
            if not non_empty_string(slot.get(field)):
                errors.append(f"{slot_path}.{field} must be a non-empty string")
    return errors


def validate_framework(name: str, payload: Any) -> list[str]:
    path = f"frameworks.{name}"
    if not isinstance(payload, dict) or not payload:
        return [f"{path} must be a non-empty object"]

    errors: list[str] = []
    if name == "react":
        allowed_fields = {
            "filePath",
            "description",
            "tags",
            "methods",
            "props",
        }
    else:
        allowed_fields = {
            "filePath",
            "description",
            "tags",
            "inputs",
            "outputs",
            "content",
        }
    unexpected = sorted(set(payload) - allowed_fields)
    if unexpected:
        errors.append(f"{path} contains unsupported fields: {', '.join(unexpected)}")
    for field in ("filePath", "description"):
        if not non_empty_string(payload.get(field)):
            errors.append(f"{path}.{field} must be a non-empty string")

    tags = payload.get("tags")
    if not isinstance(tags, dict):
        errors.append(f"{path}.tags must be an object")
    else:
        unexpected_tags = sorted(set(tags) - TAG_FIELDS)
        if unexpected_tags:
            errors.append(
                f"{path}.tags contains unsupported fields: {', '.join(unexpected_tags)}"
            )
        for tag in REQUIRED_TAGS:
            if not non_empty_string(tags.get(tag)):
                errors.append(f"{path}.tags.{tag} must be a non-empty string")

    if name == "react":
        methods = payload.get("methods")
        if not isinstance(methods, list):
            errors.append(f"{path}.methods must be an array")
        errors.extend(validate_record(f"{path}.props", payload.get("props")))
    elif name == "angular":
        errors.extend(validate_record(f"{path}.inputs", payload.get("inputs")))
        errors.extend(validate_record(f"{path}.outputs", payload.get("outputs")))
        if "content" in payload:
            errors.extend(validate_content(f"{path}.content", payload["content"]))

    return errors


def validate_document(document: Any) -> list[str]:
    if not isinstance(document, dict):
        return ["document root must be an object"]

    errors: list[str] = []
    unexpected = sorted(set(document) - ROOT_FIELDS)
    if unexpected:
        errors.append(f"document root contains unsupported fields: {', '.join(unexpected)}")
    if document.get("schemaVersion") != 2:
        errors.append("schemaVersion must equal 2")
    if not non_empty_string(document.get("displayName")):
        errors.append("displayName must be a non-empty string")

    frameworks = document.get("frameworks")
    if not isinstance(frameworks, dict) or not frameworks:
        errors.append("frameworks must be a non-empty object")
        return errors

    unknown = sorted(set(frameworks) - KNOWN_FRAMEWORKS)
    if unknown:
        errors.append(f"frameworks contains unsupported keys: {', '.join(unknown)}")

    default_framework = document.get("defaultFramework")
    if default_framework != "react":
        errors.append("defaultFramework must equal 'react'")
    if default_framework not in frameworks:
        errors.append("defaultFramework must reference an available framework payload")

    for name, payload in frameworks.items():
        if name in KNOWN_FRAMEWORKS:
            errors.extend(validate_framework(name, payload))
    return errors


def resolve_files(paths: list[Path]) -> list[Path]:
    files: set[Path] = set()
    for path in paths:
        if path.is_dir():
            files.update(candidate for candidate in path.rglob("*.json") if candidate.is_file())
        else:
            files.add(path)
    return sorted(files)


def kebab_case(value: str) -> str:
    value = re.sub(r"([a-z0-9])([A-Z])", r"\1-\2", value.strip())
    value = re.sub(r"[^A-Za-z0-9]+", "-", value)
    return re.sub(r"-+", "-", value).strip("-").lower()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "paths",
        nargs="*",
        type=Path,
        help="Explicit generated JSON file or directory",
    )
    selection = parser.add_mutually_exclusive_group()
    selection.add_argument(
        "--component",
        action="append",
        default=[],
        help="Validate one touched component; repeat for multiple components",
    )
    selection.add_argument(
        "--all",
        action="store_true",
        help="Audit every generated API artifact, including unmigrated documentation debt",
    )
    parser.add_argument(
        "--root",
        type=Path,
        default=Path("."),
        help="Repository root used with --component or --all",
    )
    return parser.parse_args()


def selected_files(args: argparse.Namespace) -> list[Path]:
    api_directory = args.root / "apps/doc/src/data/api"
    if args.paths:
        if args.component or args.all:
            raise ValueError("explicit paths cannot be combined with --component or --all")
        return resolve_files(args.paths)
    if args.component:
        return [api_directory / f"{kebab_case(component)}.json" for component in args.component]
    if args.all:
        return resolve_files([api_directory])
    raise ValueError("select explicit paths, --component <name>, or --all")


def main() -> int:
    try:
        files = selected_files(parse_args())
    except ValueError as error:
        print(str(error), file=sys.stderr)
        return 2
    if not files:
        print("No generated API JSON files found.", file=sys.stderr)
        return 2

    failures = 0
    for path in files:
        errors: list[str]
        try:
            document = json.loads(
                path.read_text(encoding="utf-8"),
                object_pairs_hook=object_without_duplicate_keys,
            )
            errors = validate_document(document)
        except (OSError, UnicodeDecodeError, json.JSONDecodeError, DuplicateKeyError) as error:
            errors = [str(error)]

        if errors:
            failures += 1
            for error in errors:
                print(f"{path}: {error}", file=sys.stderr)

    if failures:
        print(f"Invalid API documentation files: {failures}/{len(files)}", file=sys.stderr)
        return 1
    print(f"Validated API documentation files: {len(files)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
