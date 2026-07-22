---
name: create-material-component
description: Create a complete Udixio Material 3 component from current official specifications, including core contract/style/behavior, React source, Angular adapter, accessibility, Motion/DOM effects, tests, exports, and direct-source documentation examples. Use when adding a new Material 3 component or completing a missing cross-framework component slice.
---

# Create a Material 3 component

## Research and specify

1. Read [material-3-workflow.md](../../references/material-3-workflow.md),
   [the repository map](../../references/repository-map.md), current authoring/behavior docs, and
   neighboring mature components.
2. Browse the current official Material 3 specification. Use current W3C/ARIA sources for semantic
   requirements and current framework docs for framework claims.
3. Record anatomy, variants, states, interactions, motion, tokens, responsive/RTL behavior,
   accessibility, and content constraints. Mark each item as normative, local design choice, or
   unsupported.
4. Propose the public contract before implementation. Avoid speculative variants and hollow props.

## Implement vertically

1. Add core interface, resolved states, pure style, pure behavior, and shared DOM/Motion controller
   only when required.
2. Add core tests for every semantic transition and imperative controller boundary.
3. Implement React as the default source adapter with native semantics and focused behavior tests.
4. Follow [sync-angular-component](../sync-angular-component/SKILL.md) to implement Angular from the
   resolved contract.
5. Add public exports, React and Angular direct-source examples, MDX overview, accessibility
   guidance, and API coverage.

## Accept

Run [audit-component](../audit-component/SKILL.md) in `validate` mode and every applicable gate in
[quality-gates.md](../../references/quality-gates.md). Do not call the component complete with a
placeholder adapter, uncompiled example, undocumented exception, or skipped required gate.
