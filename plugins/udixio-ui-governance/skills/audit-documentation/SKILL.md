---
name: audit-documentation
description: Audit, repair, or validate Udixio component documentation and direct-source examples across React and Angular. Use when checking MDX overviews, API accuracy, Code/CodePreview framework behavior, example imports, framework availability, navigation, migration notes, or documentation build integrity.
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
- Import example components directly from their `.tsx` React and `.ts` Angular source files in MDX;
  do not duplicate source as string snippets.
- Keep examples compilable, focused, and representative of the current public API.
- Pass only available framework examples to `CodePreview`; never display an empty framework tab.
- Preserve the user's global framework choice through the shared documentation store.
- Ensure React and Angular examples demonstrate equivalent semantics while remaining idiomatic.
- Verify overview routes, API pages, component navigation, and public exports.
- Record intentional framework differences and migration/breaking changes explicitly.

## Repair and validate

For `fix`, repair implementation/API drift before rewriting docs that would otherwise document a
bug. Add missing native examples, update MDX imports, and remove obsolete snippets. Build the docs
and run relevant package type/build gates from [quality-gates.md](../../references/quality-gates.md).
Report findings as `DOCS-<AREA>-NNN` and distinguish source errors from renderer/integration errors.
