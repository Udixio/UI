#!/usr/bin/env python3
"""Regression tests for validate_api_docs.py."""

from __future__ import annotations

import json
import unittest

from validate_api_docs import (
    DuplicateKeyError,
    kebab_case,
    object_without_duplicate_keys,
    validate_document,
)


def api_item(name: str) -> dict[str, object]:
    return {
        "name": name,
        "description": f"Documentation for {name}.",
        "required": False,
        "type": {"name": "boolean"},
        "defaultValue": {"value": "false"},
    }


def api_tags() -> dict[str, str]:
    return {
        "devx": "Developer guidance.",
        "a11y": "Accessibility behavior.",
        "limitations": "Known limitations, or an explicit justified non-applicability.",
    }


def valid_document() -> dict[str, object]:
    return {
        "schemaVersion": 5,
        "displayName": "Button",
        "description": "Buttons prompt most actions in a UI.",
        "defaultFramework": "react",
        "frameworks": {
            "react": {
                "filePath": "packages/ui-react/src/lib/components/Button.tsx",
                "tags": api_tags(),
                "methods": [],
                "props": {"disabled": api_item("disabled")},
            },
            "angular": {
                "filePath": "packages/ui-angular/src/lib/button/button.ts",
                "selector": "udx-button",
                "tags": api_tags(),
                "inputs": {"disabled": api_item("disabled")},
                "outputs": {},
                "content": {
                    "default": {
                        "name": "default",
                        "selector": "*",
                        "description": "Visible label content.",
                    }
                },
            },
            "svelte": {
                "filePath": "packages/ui-svelte/src/lib/button/Button.svelte",
                "tags": api_tags(),
                "props": {
                    "disabled": api_item("disabled"),
                    "pressed": {**api_item("pressed"), "defaultValue": None, "bindable": True},
                },
                "snippets": {
                    "children": {"name": "children", "description": "Default content."},
                    "trailing": {
                        "name": "trailing",
                        "description": "Trailing content.",
                        "parameters": "[{ active: boolean; }]",
                    },
                },
            },
        },
    }


class ValidateApiDocsTest(unittest.TestCase):
    def test_accepts_normalized_multiframework_document(self) -> None:
        self.assertEqual(validate_document(valid_document()), [])

    def test_rejects_missing_required_documentation_tag(self) -> None:
        document = valid_document()
        del document["frameworks"]["angular"]["tags"]["a11y"]  # type: ignore[index]
        self.assertIn(
            "frameworks.angular.tags.a11y must be a non-empty string",
            validate_document(document),
        )

    def test_rejects_member_name_different_from_record_key(self) -> None:
        document = valid_document()
        document["frameworks"]["react"]["props"]["disabled"]["name"] = "isDisabled"  # type: ignore[index]
        self.assertIn(
            "frameworks.react.props.disabled.name must equal its record key 'disabled'",
            validate_document(document),
        )

    def test_rejects_legacy_top_level_api_fields(self) -> None:
        document = valid_document()
        document["props"] = {}
        self.assertIn(
            "document root contains unsupported fields: props",
            validate_document(document),
        )

    def test_rejects_malformed_angular_content_slot(self) -> None:
        document = valid_document()
        document["frameworks"]["angular"]["content"]["default"]["name"] = "body"  # type: ignore[index]
        self.assertIn(
            "frameworks.angular.content.default.name must equal its record key 'default'",
            validate_document(document),
        )

    def test_rejects_angular_payload_without_a_selector(self) -> None:
        document = valid_document()
        del document["frameworks"]["angular"]["selector"]  # type: ignore[index]
        self.assertIn(
            "frameworks.angular.selector must be a non-empty string",
            validate_document(document),
        )

    def test_accepts_an_attribute_directive_selector(self) -> None:
        document = valid_document()
        document["frameworks"]["angular"]["selector"] = "[udxTooltip]"  # type: ignore[index]
        self.assertEqual(validate_document(document), [])

    def test_rejects_the_previous_schema_version(self) -> None:
        document = valid_document()
        document["schemaVersion"] = 4
        self.assertIn("schemaVersion must equal 5", validate_document(document))

    def test_accepts_a_svelte_payload_without_snippets(self) -> None:
        document = valid_document()
        del document["frameworks"]["svelte"]["snippets"]  # type: ignore[index]
        self.assertEqual(validate_document(document), [])

    def test_rejects_a_false_bindable_marker(self) -> None:
        document = valid_document()
        document["frameworks"]["svelte"]["props"]["pressed"]["bindable"] = False  # type: ignore[index]
        self.assertIn(
            "frameworks.svelte.props.pressed.bindable must be true when present",
            validate_document(document),
        )

    def test_rejects_bindable_outside_svelte(self) -> None:
        document = valid_document()
        document["frameworks"]["react"]["props"]["disabled"]["bindable"] = True  # type: ignore[index]
        self.assertIn(
            "frameworks.react.props.disabled contains unsupported fields: bindable",
            validate_document(document),
        )

    def test_rejects_a_svelte_payload_without_props(self) -> None:
        document = valid_document()
        del document["frameworks"]["svelte"]["props"]  # type: ignore[index]
        self.assertIn("frameworks.svelte.props must be an object", validate_document(document))

    def test_rejects_a_snippet_name_different_from_its_key(self) -> None:
        document = valid_document()
        document["frameworks"]["svelte"]["snippets"]["children"]["name"] = "body"  # type: ignore[index]
        self.assertIn(
            "frameworks.svelte.snippets.children.name must equal its record key 'children'",
            validate_document(document),
        )

    def test_accepts_a_svelte_attachment_and_rejects_an_empty_one(self) -> None:
        document = valid_document()
        document["frameworks"]["svelte"]["attachment"] = "tooltip"  # type: ignore[index]
        self.assertEqual(validate_document(document), [])
        document["frameworks"]["svelte"]["attachment"] = ""  # type: ignore[index]
        self.assertIn(
            "frameworks.svelte.attachment must be a non-empty string when present",
            validate_document(document),
        )

    def test_rejects_an_angular_style_selector_on_svelte(self) -> None:
        document = valid_document()
        document["frameworks"]["svelte"]["selector"] = "udx-button"  # type: ignore[index]
        self.assertIn(
            "frameworks.svelte contains unsupported fields: selector",
            validate_document(document),
        )

    def test_rejects_a_document_without_a_shared_description(self) -> None:
        document = valid_document()
        del document["description"]
        self.assertIn("description must be a non-empty string", validate_document(document))

    def test_rejects_a_per_framework_description(self) -> None:
        document = valid_document()
        document["frameworks"]["react"]["description"] = "A second truth."  # type: ignore[index]
        self.assertIn(
            "frameworks.react contains unsupported fields: description",
            validate_document(document),
        )

    def test_rejects_duplicate_json_keys_before_schema_validation(self) -> None:
        with self.assertRaises(DuplicateKeyError):
            json.loads(
                '{"schemaVersion": 4, "schemaVersion": 4}',
                object_pairs_hook=object_without_duplicate_keys,
            )

    def test_normalizes_component_symbol_for_scoped_validation(self) -> None:
        self.assertEqual(kebab_case("IconButton"), "icon-button")


if __name__ == "__main__":
    unittest.main()
