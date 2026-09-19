# Svelte adapter conventions

What a Svelte adapter looks like when it is idiomatic. [sync-svelte-component](../skills/sync-svelte-component/SKILL.md)
owns the conversion procedure; the audit skills cite this page instead of restating it.

Target: **Svelte 5, runes only**. `export let`, `$:`, `<slot>`, `createEventDispatcher`, and
`on:event` are legacy syntax and are defects in this repository, not stylistic choices.

## Shape

- A `.svelte` component when the component owns every element it needs.
- An **attachment** (`{@attach x(() => options)}`) when the primary behavior attaches to an
  element the consumer already owns. This is the counterpart of an Angular directive: the
  attachment receives the host `HTMLElement` itself, runs inside an effect, and may mount its own
  surface with `mount()`. Legacy actions (`use:x`) are not used. A plain function or store fits
  behavior with no host. Choosing a shape that differs from React requires an accepted `FORM-*`
  finding; an accepted Angular directive decision carries over.
- A Svelte component has **no host element**. The template's root element is the semantic element;
  anything React puts on its root element goes there.

## Contract

- `interface Svelte<Xxx>Props extends <Xxx>Props` lives in the sibling `<xxx>.types.ts` and is
  read with `let { … }: Svelte<Xxx>Props = $props()`. It is the public API and the docgen source:
  the component TSDoc (`@status`, `@devx`, …) sits on the interface, member TSDoc on its members,
  defaults in the destructuring only, `$bindable()` markers in the destructuring too.
- Rest props (`...rest`) are typed with the native element's attributes
  (`HTMLButtonAttributes`, …) and spread on the root element, so consumers keep `class`, `onclick`,
  `aria-*`, and data attributes. Resolved states and internal props never reach the DOM.
- Callback props keep the contract names: `onValueChange`, not `onvaluechange`, not a
  `CustomEvent`. The lowercased form is Svelte's DOM-event idiom and stays reserved for native
  events forwarded through rest props.
- A controllable value is declared `$bindable()`; `default*` seeds uncontrolled use. The core
  controllable-state primitive decides every transition; in controlled mode an accepted transition
  calls `onValueChange(next)` **and assigns the prop** (`value = next`). With `bind:` the owner's
  variable follows; with a Svelte 5 function binding
  (`bind:value={() => v, (next) => { if (ok) v = next }}`) the owner's setter decides. A child
  cannot detect whether a prop is bound, so the function binding is the controlled surface — a
  `platform-adaptation`. Mode is fixed for the component lifetime; switching logs the shared error.
- Content: `children?: Snippet`, and `Snippet<[state]>` for what React expresses as a render prop.
  Name slots after the contract concept (`leadingIcon`), not after their position.
- Customization is split as in Angular: `class` (string, applied to the root element) and
  `classes` (`ElementClasses<I> | ClassNameComponent<I>`), merged with `mergeClassNames` from
  `@udixio/core`. `class` is never a function.

## Reactivity and DOM

- `$derived` computes the style record from the core style function with every prop, resolved
  state, and `class`. No class decision lives in Svelte.
- `$effect` creates `@udixio/core/dom` controllers with `bind:this` element references and destroys
  them in its cleanup. `onMount` is reserved for one-shot setup that reads no reactive prop. A
  connect effect reads its inputs through `$derived` values, not raw props: a parent that spreads
  its props re-evaluates every prop on any update, and a raw read would re-create the controller.
- Pure transitions come from core behavior; `$state` only holds what the component owns.
- No `svelte/transition`, `svelte/animate`, or CSS-only reimplementation of an effect that core
  animates with anime.js.

## Naming

- File `Xxx.svelte`, contract `xxx.types.ts`, spec `xxx.spec.ts` (`xxx.spec.svelte.ts` when it
  uses runes), fixture `xxx.fixture.svelte`, attachment `xxx.attachment.svelte.ts` exporting
  `xxx(options: () => SvelteXxxProps)`, barrel `packages/ui-svelte/src/index.ts`.
- An attachment reads its options through a getter and keeps its trigger listeners and mounted
  surface across option changes (child `$effect`s, `untrack` at setup); defaults it applies in
  code are documented with `@default` on the options interface, which is where docgen reads them.
- Example stems `xxx-<case>.svelte` under `apps/doc/src/examples/svelte/`.

## Tests

vitest + `@testing-library/svelte` in jsdom, same semantic scenario matrix as React and Angular,
plus, for every `$bindable` prop, a `bind:` round-trip and a rejecting function binding (the
controlled-rejection scenario), and surface teardown on unmount where an attachment exists. `svelte-check` is part of the typecheck gate because vitest does not prove template types.
