---
name: sync-angular-component
description: Create or update an Udixio Angular component from the default React source while preserving the shared core contract and idiomatic Angular design. Use for React-to-Angular conversion, missing Angular adapters, parity repairs, Angular test generation, or synchronizing later React component changes.
---

# Synchronize Angular from React

## Resolve the source

1. Read [the repository map](../../references/repository-map.md),
   [angular-conventions.md](../../references/angular-conventions.md), current authoring/behavior
   docs, and inventory the component.
2. Apply [the public API standard](../../references/public-api-standard.md) to every source prop,
   callback, default, and type before conversion. React is not presumed correct.
3. If a contract is negative, implementation-shaped, ambiguous, or unstable, emit proposals and
   stop before editing Angular. Do not obtain parity by propagating the defect or adding an alias.
4. Audit core and React enough to establish that the source behavior is valid. Fix confirmed source
   defects before conversion. When a Svelte adapter exists, read it too: an accepted `FORM-*` or
   `API-DESIGN-*` decision recorded for Svelte applies to Angular unless Angular idiom differs.
5. Choose the Angular delivery shape before translating the contract. The deciding question is
   attachment, not rendering: does the component's primary behavior **attach** to an element the
   consumer already owns? If it does, the shape is a directive, even when the component also
   renders a surface of its own — a directive can instantiate that surface dynamically, so owning
   rendered content never disqualifies it. Only when nothing is attached to a foreign host, and the
   component owns every element it needs, is a component the right shape. A service fits behavior
   with no host; a pipe fits a pure transformation. When the answer is not the source adapter's
   shape, emit `FORM-*` and stop for the user's decision, as
   [the public API standard](../../references/public-api-standard.md#propose-a-delivery-shape-before-adopting-it)
   requires.
6. Write a parity matrix for API, defaults, state ownership, events, DOM semantics, styles,
   animation, accessibility, exports, and tests.

## Translate the contract, not JSX

- Map framework-agnostic props to typed `input()` and React `onXChange` callbacks to Angular
  `xChange` outputs.
- Map children/render slots to deliberate content projection or typed templates.
- Use shared core styles, pure behavior, and DOM controllers; do not port React hooks or
  `motion/react` concepts into Angular. Shared animated effects live once in `@udixio/core/dom`
  with anime.js, which every adapter consumes identically.
- Use signals and the repository's controllable-state primitive for reactive ownership.
- Use `afterRenderEffect` for DOM connection and always destroy controllers.
- Account for the Angular host in semantics, layout, CSS inheritance, border radius, clipping, and
  event targeting.
- Preserve idiomatic Angular templates and avoid React-shaped APIs when Angular has a semantic
  equivalent.
- Never introduce an input whose only purpose is to replay a React `ref` or `targetRef`. A directive
  injects its own `ElementRef`; a component queries its own view. An input that asks the consumer to
  hand over an element the framework can resolve itself is a transliterated mechanism, not a
  contract concept.

## Prove synchronization

Port the React semantic test matrix, not its test syntax. Add Angular-specific host/lifecycle tests
where needed. Export the component, add/update the Angular direct-source docs example, then run
Angular tests/package build plus focused React/core and docs gates from
[quality-gates.md](../../references/quality-gates.md). Finish with
[audit-parity](../audit-parity/SKILL.md) in `validate` mode with Angular as the target adapter.
