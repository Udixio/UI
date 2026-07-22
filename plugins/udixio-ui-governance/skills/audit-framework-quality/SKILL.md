---
name: audit-framework-quality
description: Audit, repair, or validate React and Angular implementation quality for Udixio components, including framework best practices, naming, lifecycle, reactivity, typing, exports, tests, performance, cleanup, and technical debt. Use for code-quality reviews, convention enforcement, refactors, or production-maturity checks.
---

# Audit framework quality

Read current repository standards and use current official React/Angular documentation for claims
that may have changed. Apply [the audit contract](../../references/audit-contract.md) and
[the public API standard](../../references/public-api-standard.md).

## Public API design

When composing a full component audit, let `audit-public-api` own the semantic contract review.
Still flag negative or imperative toggles, implementation-shaped names, CSS/DOM leakage, ambiguous
booleans, surprising defaults, and contracts that will become false when internals change during a
standalone framework-quality audit.

For each questionable member, report an `API-DESIGN-*` finding with two or three alternatives, a
recommendation, cross-framework usage examples, and release impact. Stop synchronization until the
contract is resolved. Never silence the finding by copying the name to Angular or adding a
deprecated alias automatically.

## React

- Keep the React prop type and style hook with the component unless a real shared abstraction exists.
- Preserve native prop typing without leaking resolved state or internal props to the DOM.
- Use controlled/uncontrolled primitives consistently; avoid derived-state effects and stale closures.
- Keep hook order stable, dependency lists truthful, refs intentional, and cleanup complete.
- Avoid wrapper DOM, memoization, callbacks, and context unless they solve measured or structural needs.
- Require touched-file TypeScript correctness because Vite tests/builds do not prove it.

## Angular

- Use standalone components, `OnPush`, typed `input()`/`output()`, signals/computed state, and
  `afterRenderEffect` only for actual DOM lifecycle work.
- Keep templates declarative and public/protected/private members intentional.
- Clean up DOM controllers, subscriptions, observers, and animations.
- Use native elements and content projection appropriately; avoid host elements that alter layout,
  inheritance, semantics, or clipping without tests.
- Preserve Angular naming: `lib-` selectors, event outputs without `on`, and kebab-case paths.

## Debt and naming

Flag duplicated engines, speculative abstractions, `any`, assertions that hide contract errors,
suppressed diagnostics, skipped tests, dead exports, stale aliases, broad compatibility shims,
TODOs without ownership, and comments that restate code. Prefer deleting obsolete code over layering
new code around it.

For `fix`, make the smallest coherent architectural correction and add regression evidence. Run
[quality gates](../../references/quality-gates.md) and report `QUALITY-<AREA>-NNN` findings. Never
describe pre-existing unrelated failures as caused by the component change.
