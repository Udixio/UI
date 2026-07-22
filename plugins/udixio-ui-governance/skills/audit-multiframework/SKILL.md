---
name: audit-multiframework
description: Audit, repair, or validate Udixio's framework-agnostic component architecture across core, React, and Angular. Use to check shared interfaces, styles, behavior, DOM/Motion controllers, controlled state, exports, test matrices, or to remove duplicated framework logic and prevent cross-framework technical debt.
---

# Audit multiframework architecture

Read [the repository map](../../references/repository-map.md), current authoring/behavior docs, and
[the audit contract](../../references/audit-contract.md). Resolve vocabulary with
[the public API standard](../../references/public-api-standard.md) before assigning ownership.

## Resolve ownership

For each prop, state, style decision, transition, DOM effect, and event, identify one owner:

- core interface for framework-agnostic public data;
- core style for pure visual class decisions;
- core behavior for pure state transitions and semantics;
- `@udixio/core/dom` for shared imperative DOM/Motion behavior;
- framework adapter only for rendering, lifecycle, content, refs, inputs, and outputs.

Flag hollow props, framework types in core, duplicated decisions, and behavior hidden in adapter-only
CSS. Require one Motion JavaScript controller when both frameworks need the same imperative effect.

## Review the source slice

1. Inventory all artifacts and public barrels.
2. Validate the semantic public contract; do not promote a React implementation name into core
   until it is intent-oriented, framework-neutral, and stable.
3. Validate interface props, resolved states, element keys, and `className` state exposure.
4. Validate controlled/uncontrolled semantics and blocked transitions against shared pure behavior.
5. Review React completely against the resolved core contract.
6. Review Angular only after the React/core source contract is stable.
7. Require the same scenario matrix in core, React, and Angular tests where applicable.

Distinguish API parity from platform syntax: `children`/`ng-content`, callbacks/outputs, and refs/view
queries may differ while semantics remain equal.

## Repair and validate

For `fix`, move each decision to its correct single owner, update React, then synchronize Angular.
Delete superseded implementations and tests; do not leave compatibility layers without explicit
removal criteria. Run the relevant gates from [quality-gates.md](../../references/quality-gates.md)
and report findings as `MULTI-<AREA>-NNN`.
