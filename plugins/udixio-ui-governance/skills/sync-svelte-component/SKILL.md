---
name: sync-svelte-component
description: Create or update an Udixio Svelte 5 component from the default React source while preserving the shared core contract and idiomatic runes-based Svelte design. Use for React-to-Svelte conversion, missing Svelte adapters, parity repairs, Svelte test generation, $bindable/snippet/action decisions, or synchronizing later React component changes.
---

# Synchronize Svelte from React

## Resolve the source

1. Read [the repository map](../../references/repository-map.md),
   [svelte-conventions.md](../../references/svelte-conventions.md), current authoring/behavior docs,
   and inventory the component.
2. Apply [the public API standard](../../references/public-api-standard.md) to every source prop,
   callback, default, and type before conversion. React is not presumed correct.
3. If a contract is negative, implementation-shaped, ambiguous, or unstable, emit proposals and
   stop before editing Svelte. Do not obtain parity by propagating the defect or adding an alias.
4. Audit core and React enough to establish that the source behavior is valid. Fix confirmed source
   defects before conversion. When an Angular adapter exists, read it too: an accepted `FORM-*`
   or `API-DESIGN-*` decision recorded for Angular applies to Svelte unless Svelte idiom differs.
5. Choose the Svelte delivery shape before translating the contract. The deciding question is
   attachment, not rendering: does the component's primary behavior **attach** to an element the
   consumer already owns? If it does, the shape is an action (`use:xxx`) or an attachment, even
   when the behavior also renders a surface of its own — an action can mount that surface
   programmatically. Only when nothing is attached to a foreign host, and the component owns every
   element it needs, is a `.svelte` component the right shape. A function or store fits behavior
   with no host. When the answer is not the source adapter's shape, emit `FORM-*` and stop for the
   user's decision, as
   [the public API standard](../../references/public-api-standard.md#propose-a-delivery-shape-before-adopting-it)
   requires.
6. Write a parity matrix for API, defaults, state ownership, events, bindable surface, snippets,
   DOM semantics, styles, animation, accessibility, exports, and tests.

## Translate the contract, not JSX

- Map framework-agnostic props to the `Svelte<Xxx>Props` interface read through `$props()`, with
  defaults in the destructuring. Keep React `onXChange` callback props under the same name.
- Declare every controllable value `$bindable()` next to its callback and route both through the
  core controllable-state primitive. In controlled mode an accepted transition calls `onXChange`
  and assigns the prop; the owner rejects through a function binding. Never try to detect whether
  the prop is bound, and never let `bind:` bypass a blocked transition.
- Map `children` and render props to snippets typed with the state they receive. Never emit
  `<slot>`.
- Spread typed rest props on the root element; there is no host element to account for, so the
  root element carries the semantics, `class`, and forwarded native events.
- Use shared core styles through `$derived`, pure behavior, and DOM controllers connected in
  `$effect` with cleanup; do not port React hooks, `useEffect` ordering, or `motion/react`
  concepts. Shared animated effects live once in `@udixio/core/dom` with anime.js.
- Never introduce a prop whose only purpose is to replay a React `ref` or `targetRef`. An action
  receives its node; a component uses `bind:this` on its own elements.
- Preserve idiomatic Svelte templates (`{#if}`, `{#each}`, `{@render}`) and avoid React-shaped
  APIs when Svelte has a semantic equivalent.

## Prove synchronization

Port the React semantic test matrix, not its test syntax, with `@testing-library/svelte`. Add
Svelte-specific tests: `bind:` round-trip per bindable prop, controlled usage without binding,
snippet rendering, action `update`/`destroy` where an action exists. Export the component from the
package barrel, add/update the Svelte direct-source docs example, then run Svelte tests,
`svelte-check`, the package build, plus focused React/core and docs gates from
[quality-gates.md](../../references/quality-gates.md). Finish with
[audit-parity](../audit-parity/SKILL.md) in `validate` mode with Svelte as the target adapter.
