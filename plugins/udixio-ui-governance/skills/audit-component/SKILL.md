---
name: audit-component
description: Orchestrate a complete Udixio UI component audit or repair across core, React, Angular, accessibility, React-Angular parity, framework quality, tests, exports, and documentation. Use for end-to-end component reviews, production-readiness checks, full component fixes, or validation before declaring a component complete.
---

# Audit a component end to end

Treat React as the default source adapter, but treat valid shared contracts in core as authoritative.
Finish the React and core review before judging Angular parity.

## Prepare

1. Infer `audit`, `fix`, or `validate` from the request using
   [the audit contract](../../references/audit-contract.md).
2. Read [the repository map](../../references/repository-map.md) and current
   `docs/component-authoring.md` plus `docs/component-behavior.md`.
3. Run `../../scripts/component_inventory.py <component> --root <repo>` and inspect every candidate.
4. Establish the public component scope, including core artifacts, exports, tests, TSDoc sources,
   generated API JSON, docs renderers, examples, and deliberate exceptions.

## Compose the checkers

Read and apply these sibling skills in this exact order:

1. [audit-multiframework](../audit-multiframework/SKILL.md): validate the core contract and the
   React implementation first.
2. [audit-framework-quality](../audit-framework-quality/SKILL.md): review React practices, naming,
   tests, and debt.
3. [audit-accessibility](../audit-accessibility/SKILL.md): prove the React semantic and interaction
   contract.
4. [audit-parity](../audit-parity/SKILL.md): compare Angular with the resolved React/core source.
5. Apply `audit-framework-quality` and `audit-accessibility` to Angular, including framework-specific
   and rendered-DOM concerns.
6. [audit-documentation](../audit-documentation/SKILL.md): verify the public story only after the
   implementation contract is resolved, including TSDoc truth, per-framework API extraction,
   generated-artifact freshness, and actual rendering.

Do not mark a later checker as passing because an earlier checker already inspected similar code.
Record independent evidence for each dimension.

## Repair

For `fix`, audit first, then repair from foundations outward:

1. shared interface, style, pure behavior, and DOM controller;
2. React source and React regression tests;
3. Angular synchronization and Angular regression tests;
4. exports, examples, and documentation;
5. integration validation.

Never propagate a React defect to Angular for the sake of superficial parity. Correct React/core,
then synchronize Angular. Use [sync-angular-component](../sync-angular-component/SKILL.md) for a
substantial adapter gap.

## Complete

Run the proportional gates in [quality-gates.md](../../references/quality-gates.md). Report findings
once, ordered by severity, with checker labels and exact evidence. State which gates passed, failed,
warned, or were not run. Do not declare completion with an open blocker/major finding or an
unexplained framework exception.
