---
name: audit-documentation
description: Audit, repair, or validate Udixio component documentation, TSDoc-derived API data, and direct-source examples across React and Angular. Use when checking MDX overviews, API accuracy, @devx/@a11y/@limitations tags, docgen freshness, Code/CodePreview framework behavior, example imports, framework availability, navigation, migration notes, or documentation build integrity.
---

# Audit component documentation

## Inspect the public story

1. Select `audit`, `fix`, or `validate` from
   [the audit contract](../../references/audit-contract.md).
2. Read [the repository map](../../references/repository-map.md) and inventory the component.
3. Resolve the actual public API and behavior from core, React, Angular, exports, and tests before
   judging prose.

## Check

- Describe purpose, anatomy, variants, states, behavior, accessibility, and limitations accurately.
- Treat the public component TSDoc as documentation source code. Require `@devx`, `@a11y`, and
  `@limitations` for each documented public component, or an explicit, evidence-backed statement
  that a section does not apply. Empty tags, placeholders, and generic claims do not count.
- Check every tag claim against the current contract, adapter implementations, and tests. In
  particular, verify defaults, controlled/uncontrolled behavior, native semantics, accessible-name
  behavior, touch target, focus treatment, disabled-link behavior, and framework exceptions rather
  than trusting generated JSON.
- Verify the generator extracts descriptions, props, defaults, and documentation tags for every
  available framework. Shared/core API may be represented once, but React-only bindings and
  Angular inputs, outputs, aliases, projection, and templates must remain framework-specific.
- Inspect the generated API JSON as an artifact, not as authority. It must identify which framework
  API payloads actually exist and must not relabel React data as Angular data.
- Prove `@devx`, `@a11y`, and `@limitations` are rendered in the built documentation. Successful
  extraction without a reachable, visible section is a documentation failure.
- Import example components directly from their `.tsx` React and `.ts` Angular source files in MDX;
  do not duplicate source as string snippets.
- Keep examples compilable, focused, and representative of the current public API.
- Pass only available framework examples and API payloads to their selectors; never display an
  empty framework tab or fabricate a fallback under the wrong framework label.
- Preserve the user's global framework choice through the shared documentation store across
  examples, code, and API pages. When the preferred framework is unavailable, select a real
  available framework without overwriting the global preference.
- Ensure React and Angular examples demonstrate equivalent semantics while remaining idiomatic.
- Verify overview routes, API pages, component navigation, and public exports.
- Record intentional framework differences and migration/breaking changes explicitly.

## Prove generated API freshness

Run the repository's documentation generator from its declared package script, then require a clean
deterministic `docgen:check`. Do not compare timestamps, diff against `HEAD` in a dirty worktree, or
hand-edit generated JSON to satisfy this gate. A component-scoped generator is acceptable while
iterating, but final validation must cover all versioned API artifacts so deleted, renamed, and
stale components are detected.

Also validate the API artifact structurally: valid JSON, stable schema version where present,
framework availability derived from non-empty payloads, unique prop/input/output names, and no
selector tab without matching data. Keep these checks deterministic; semantic truth still requires
the source-and-test review above. The source public-API checker owns semantic naming and stability;
this checker verifies that the resolved contract is extracted faithfully. For schema v2, run
`plugins/udixio-ui-governance/scripts/validate_api_docs.py --component <component>`. Use `--all`
only for the separate repository-wide documentation-debt audit.

## Repair and validate

For `fix`, repair implementation/API drift before rewriting docs that would otherwise document a
bug. Add or correct TSDoc at the owning public source, update the generator/renderer rather than
patching generated JSON, add missing native examples, update MDX imports, and remove obsolete
snippets. Build the docs and run relevant package type/build gates from
[quality-gates.md](../../references/quality-gates.md). Report findings as `DOCS-<AREA>-NNN` and
distinguish source, extraction/schema, stale-artifact, and renderer/integration errors.
