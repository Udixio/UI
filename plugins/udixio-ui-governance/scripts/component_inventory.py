#!/usr/bin/env python3
"""Discover the files that participate in a Udixio UI component contract."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Iterable


MARKERS = ("nx.json", "pnpm-workspace.yaml", "packages")


def kebab_case(value: str) -> str:
    value = re.sub(r"([a-z0-9])([A-Z])", r"\1-\2", value.strip())
    value = re.sub(r"[^A-Za-z0-9]+", "-", value)
    return re.sub(r"-+", "-", value).strip("-").lower()


def find_root(start: Path) -> Path:
    current = start.resolve()
    for candidate in (current, *current.parents):
        if all((candidate / marker).exists() for marker in MARKERS):
            return candidate
    raise ValueError(f"Unable to find repository root from {start}")


def relative_paths(root: Path, paths: Iterable[Path]) -> list[str]:
    return sorted(
        {
            str(path.resolve().relative_to(root))
            for path in paths
            if path.is_file()
        }
    )


def matching_files(directory: Path, pattern: str, slug: str) -> list[Path]:
    if not directory.exists():
        return []
    return [
        path
        for path in directory.rglob(pattern)
        if kebab_case(path.name.split(".", 1)[0]) == slug
    ]


def matching_examples(directory: Path, pattern: str, slug: str) -> list[Path]:
    if not directory.exists():
        return []
    return [
        path
        for path in directory.rglob(pattern)
        if (candidate := kebab_case(path.name.split(".", 1)[0])) == slug
        or candidate.startswith(f"{slug}-")
    ]


def contains_symbol(path: Path, patterns: list[str]) -> bool:
    try:
        content = path.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError):
        return False
    return any(re.search(pattern, content) for pattern in patterns)


def inventory(root: Path, component: str) -> dict[str, object]:
    slug = kebab_case(component)
    symbol = "".join(part.capitalize() for part in slug.split("-"))

    react_components = root / "packages/ui-react/src/lib/components"
    react_tests = root / "packages/ui-react/src/tests"
    angular_lib = root / "packages/ui-angular/src/lib"
    core = root / "packages/core/src/lib"
    docs = root / "apps/doc/src/data/components"
    api_docs = root / "apps/doc/src/data/api"
    examples = root / "apps/doc/src/examples"

    react_source = matching_files(react_components, "*.tsx", slug)
    angular_source = [
        path
        for path in matching_files(angular_lib, "*.ts", slug)
        if ".spec." not in path.name and ".test." not in path.name
    ]
    angular_tests = [
        path
        for path in angular_lib.rglob("*.spec.ts")
        if slug in kebab_case(str(path.relative_to(angular_lib)))
    ] if angular_lib.exists() else []
    react_test_files = [
        path
        for path in react_tests.rglob("*.ts*")
        if slug in kebab_case(path.name)
    ] if react_tests.exists() else []
    core_test_files = [
        path
        for path in core.rglob("*.spec.ts")
        if slug in kebab_case(path.name)
    ] if core.exists() else []

    artifact_patterns = {
        "core_interface": [core / "interfaces" / f"{slug}.interface.ts"],
        "core_style": [core / "styles" / f"{slug}.style.ts"],
        "core_behavior": [core / "behaviors" / f"{slug}.behavior.ts"],
        "core_dom": [core / "dom" / f"{slug}.ts"],
        "documentation": [docs / f"{slug}.overview.mdx"],
        "generated_api": [api_docs / f"{slug}.json"],
    }

    shared_api_doc_sources = artifact_patterns["core_interface"]
    api_doc_sources = [
        *shared_api_doc_sources,
        *react_source,
        *angular_source,
    ]
    documentation_infrastructure = [
        root / "apps/doc/scripts/docgen.js",
        root / "apps/doc/src/content.config.ts",
        root / "apps/doc/src/layouts/components.astro",
        root / "apps/doc/src/pages/components/[component]/api.astro",
        root / "apps/doc/src/stores/exampleFrameworkStore.ts",
    ]
    api_components = root / "apps/doc/src/components/api"
    if api_components.exists():
        documentation_infrastructure.extend(
            path
            for path in api_components.rglob("*")
            if path.is_file() and path.suffix in {".astro", ".ts", ".tsx"}
        )

    barrel_candidates = [
        root / "packages/core/src/index.ts",
        root / "packages/core/src/lib/interfaces/index.ts",
        root / "packages/core/src/lib/styles/index.ts",
        root / "packages/core/src/lib/behaviors/index.ts",
        root / "packages/core/src/lib/dom/index.ts",
        root / "packages/ui-react/src/lib/components/index.ts",
        root / "packages/ui-react/src/lib/index.ts",
        root / "packages/ui-angular/src/index.ts",
    ]
    escaped_slug = re.escape(slug)
    escaped_symbol = re.escape(symbol)
    barrels = [
        path
        for path in barrel_candidates
        if path.is_file()
        and contains_symbol(path, [escaped_slug, escaped_symbol])
    ]

    result: dict[str, object] = {
        "schemaVersion": 2,
        "component": component,
        "slug": slug,
        "symbol": symbol,
        "root": str(root),
        "artifacts": {
            "reactSource": relative_paths(root, react_source),
            "reactTests": relative_paths(root, react_test_files),
            "angularSource": relative_paths(root, angular_source),
            "angularTests": relative_paths(root, angular_tests),
            "coreInterface": relative_paths(root, artifact_patterns["core_interface"]),
            "coreStyle": relative_paths(root, artifact_patterns["core_style"]),
            "coreBehavior": relative_paths(root, artifact_patterns["core_behavior"]),
            "coreTests": relative_paths(root, core_test_files),
            "coreDom": relative_paths(root, artifact_patterns["core_dom"]),
            "documentation": relative_paths(root, artifact_patterns["documentation"]),
            "generatedApi": relative_paths(root, artifact_patterns["generated_api"]),
            "sharedApiDocumentationSources": relative_paths(
                root, shared_api_doc_sources
            ),
            "reactApiDocumentationSources": relative_paths(root, react_source),
            "angularApiDocumentationSources": relative_paths(root, angular_source),
            "apiDocumentationSources": relative_paths(root, api_doc_sources),
            "documentationInfrastructure": relative_paths(
                root, documentation_infrastructure
            ),
            "reactExamples": relative_paths(
                root, matching_examples(examples / "react", "*.tsx", slug)
            ),
            "angularExamples": relative_paths(
                root, matching_examples(examples / "angular", "*.ts", slug)
            ),
            "publicBarrels": relative_paths(root, barrels),
        },
    }
    return result


def missing_required(result: dict[str, object]) -> list[str]:
    artifacts = result["artifacts"]
    assert isinstance(artifacts, dict)
    required = (
        "reactSource",
        "reactTests",
        "angularSource",
        "angularTests",
        "coreInterface",
        "coreStyle",
        "documentation",
        "generatedApi",
    )
    missing = [key for key in required if not artifacts.get(key)]
    if artifacts.get("coreBehavior") and not artifacts.get("coreTests"):
        missing.append("coreTests")
    return missing


def markdown(result: dict[str, object]) -> str:
    artifacts = result["artifacts"]
    assert isinstance(artifacts, dict)
    lines = [
        f"# Component inventory: {result['symbol']}",
        "",
        f"- Slug: `{result['slug']}`",
        f"- Root: `{result['root']}`",
        "",
        "| Artifact | Paths |",
        "| --- | --- |",
    ]
    for key, paths in artifacts.items():
        assert isinstance(paths, list)
        rendered = "<br>".join(f"`{path}`" for path in paths) if paths else "—"
        lines.append(f"| {key} | {rendered} |")
    missing = missing_required(result)
    lines.extend(["", f"Required artifacts missing: {', '.join(missing) if missing else 'none'}"])
    return "\n".join(lines)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("component", help="Component symbol or kebab-case route")
    parser.add_argument("--root", default=".", help="Repository root or descendant")
    parser.add_argument("--format", choices=("markdown", "json"), default="markdown")
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Exit non-zero when a required cross-framework artifact is absent",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        root = find_root(Path(args.root))
        result = inventory(root, args.component)
    except ValueError as error:
        print(str(error), file=sys.stderr)
        return 2

    if args.format == "json":
        print(json.dumps(result, indent=2))
    else:
        print(markdown(result))
    return 1 if args.strict and missing_required(result) else 0


if __name__ == "__main__":
    raise SystemExit(main())
