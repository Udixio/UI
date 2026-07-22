---
name: audit-parity
description: Compare, repair, or strictly validate an Angular component against its React source and shared core contract. Use for React-Angular concordance, API/state/event/DOM/style/motion/accessibility/test parity, framework drift, or deciding whether a difference is intentional.
---

# Audit React-Angular parity

Treat React as the default source adapter only after verifying that it obeys core and repository
standards, including [the public API standard](../../references/public-api-standard.md). Never
synchronize a confirmed React defect or a semantically weak public name.

## Build a parity matrix

Read [the audit contract](../../references/audit-contract.md) and
[the repository map](../../references/repository-map.md). Compare:

1. public props/inputs, defaults, aliases, and blocked states;
2. callbacks/outputs, event count, payloads, and controlled state ownership;
3. rendered semantic elements, content projection, icons, links, and loading content;
4. resolved style-state inputs, variants, element keys, shape, and state-layer structure;
5. pointer, keyboard, focus, Motion, interruption, cleanup, and reduced motion;
6. ARIA role/name/state/value and focus behavior;
7. public exports and package consumption;
8. equivalent tests and documentation examples.

Classify every difference as `defect`, `platform-adaptation`, or `documented-exception`. A valid
platform adaptation preserves the same public meaning and user-observable behavior.

Do not count identical questionable names as successful parity. Report the source defect as
`API-DESIGN-*`, resolve it, then compare both adapters against the corrected canonical concept.

## Repair and validate

For a small `fix`, change the incorrect owner and add regression tests. For substantial Angular
drift, follow [sync-angular-component](../sync-angular-component/SKILL.md). Run both adapters'
focused tests and compilation gates from [quality-gates.md](../../references/quality-gates.md).
Report findings as `PARITY-<AREA>-NNN`; do not use identical screenshots as the sole parity proof.
