---
name: audit-parity
description: Compare, repair, or strictly validate an Angular component against its React source and shared core contract. Use for React-Angular concordance, API/state/event/DOM/style/motion/accessibility/test parity, framework drift, or deciding whether a difference is intentional.
---

# Audit React-Angular parity

Treat React as the default source adapter only after verifying that it obeys core and repository
standards, including [the public API standard](../../references/public-api-standard.md). Never
synchronize a confirmed React defect or a semantically weak public name.

## Identify the delivery shape first

Before comparing anything, record how each adapter delivers the concept: React component, Angular
component, directive, service, pipe, or hook. Then judge whether each shape is the idiomatic one
for its framework, using
[the public API standard](../../references/public-api-standard.md#separate-concept-vocabulary-and-delivery-shape).

A shape that differs across adapters is a legitimate starting point, not drift. Never report an
Angular directive as a defect when the core contract and the observable behavior are preserved.
Report the opposite instead: an adapter that replays a foreign framework's mechanism — an input
whose only purpose is to carry a `ref`, a required host element the framework could resolve itself
— is an `API-DESIGN-*` defect even when both adapters agree.

## Build a parity matrix

Read [the audit contract](../../references/audit-contract.md) and
[the repository map](../../references/repository-map.md). Compare:

1. the concepts of the core contract, their defaults, aliases, and blocked states, mapped to each
   adapter's members — not a one-to-one props/inputs table, which a legitimate shape difference
   invalidates;
2. callbacks/outputs, event count, payloads, and controlled state ownership;
3. rendered semantic elements, content projection, icons, links, and loading content;
4. resolved style-state inputs, variants, element keys, shape, and state-layer structure;
5. pointer, keyboard, focus, animation, interruption, cleanup, and reduced motion;
6. ARIA role/name/state/value and focus behavior;
7. public exports and package consumption;
8. equivalent tests and documentation examples.

Classify every difference as `defect`, `platform-adaptation`, `platform-shape`, or
`documented-exception`.

- `platform-adaptation` covers binding syntax at equal shape: `children`/`ng-content`,
  callbacks/outputs, refs/view queries. It preserves the same public meaning and user-observable
  behavior.
- `platform-shape` covers a different delivery vector — component against directive, service, or
  pipe — where the core contract and the observable behavior are preserved and only the way a
  consumer reaches the concept differs. It requires an accepted `FORM-*` finding and an explicit
  statement of each framework's shape in the component documentation.

These two verdicts are deliberately separate. Do not widen `platform-adaptation` to cover shape:
its scope has already been read as syntax-only, and a same-shape syntax difference needs no `FORM-*`
decision while a shape difference does.

Do not count identical questionable names as successful parity. Report the source defect as
`API-DESIGN-*`, resolve it, then compare both adapters against the corrected canonical concept.

## Repair and validate

For a small `fix`, change the incorrect owner and add regression tests. For substantial Angular
drift, follow [sync-angular-component](../sync-angular-component/SKILL.md). Run both adapters'
focused tests and compilation gates from [quality-gates.md](../../references/quality-gates.md).
Report findings as `PARITY-<AREA>-NNN`; do not use identical screenshots as the sole parity proof.
