---
name: evolve-governance
description: Maintain and evolve the Udixio UI Governance plugin when repository architecture, React, Angular, Material 3, accessibility standards, documentation tooling, or plugin formats change. Use to update checklists, quality gates, scripts, skill composition, compatibility, report contracts, or plugin validation without duplicating rules.
---

# Evolve governance safely

## Detect drift

1. Compare every plugin reference with current `docs/component-authoring.md`,
   `docs/component-behavior.md`, Nx targets, package entry points, docgen schema and extractors,
   docs renderer, framework preference store, and representative mature components.
2. Browse current primary documentation for React, Angular, Material 3, W3C accessibility, Codex
   plugins, and Claude plugins only where the change depends on current behavior.
3. Classify drift as repository evolution, upstream evolution, checker defect, missing coverage, or
   obsolete rule.

## Update one source of truth

- Put repository paths and naming in `references/repository-map.md`.
- Put finding/action semantics in `references/audit-contract.md`.
- Put commands and acceptance rules in `references/quality-gates.md`.
- Keep each checker focused on its domain and keep the orchestration order only in
  `audit-component`.
- Extend deterministic scripts for discovery/validation; do not encode semantic judgments with
  fragile text matching.
- Version generated API schemas explicitly when their shape changes. Keep structural validation in
  scripts and semantic TSDoc review in `audit-documentation`; never infer documentation truth from
  keyword counts or timestamps.
- Preserve shared `SKILL.md` compatibility with Codex and Claude. Add product-specific metadata only
  in files that the other product safely ignores.

## Validate the evolution

Run every script on a passing and failing fixture (including `test_validate_api_docs.py`),
quick-validate all skills, validate the Codex
plugin manifest, and run `claude plugin validate` when Claude is installed. Forward-test at least an
end-to-end audit and a React-to-Angular synchronization when the change affects workflow behavior.

Bump the plugin version for a committed release. During local Codex cache iteration, use the
official `plugin-creator` cachebuster flow instead of hand-editing marketplace configuration. Report
which standards and repository evidence caused the update.
