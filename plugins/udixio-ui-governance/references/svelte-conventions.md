# Svelte adapter conventions

What a Svelte adapter looks like when it is idiomatic. [sync-svelte-component](../skills/sync-svelte-component/SKILL.md)
owns the conversion procedure; the audit skills cite this page instead of restating it.

Target: **Svelte 5, runes only**. `export let`, `$:`, `<slot>`, `createEventDispatcher`, and
`on:event` are legacy syntax and are defects in this repository, not stylistic choices.

## Shape

- A `.svelte` component when the component owns every element it needs.
- An **action** (`use:x`) — or an attachment (`{@attach x()}`) when the behavior must react to
  props of the consumer's element — when the primary behavior attaches to an element the consumer
  already owns. This is the counterpart of an Angular directive: the action receives the host
  `HTMLElement` itself and returns `update`/`destroy`. A plain function or store fits behavior with
  no host. Choosing a shape that differs from React requires an accepted `FORM-*` finding.
- A Svelte component has **no host element**. The template's root element is the semantic element;
  anything React puts on its root element goes there.

## Contract

- `interface Svelte<Xxx>Props extends <Xxx>Props` in `<script lang="ts">`, declared with
  `let { … }: Svelte<Xxx>Props = $props()`. It is the public API and the docgen source: TSDoc lives on
  its members, defaults live in the destructuring only.
- Rest props (`...rest`) are typed with the native element's attributes
  (`HTMLButtonAttributes`, …) and spread on the root element, so consumers keep `class`, `onclick`,
  `aria-*`, and data attributes. Resolved states and internal props never reach the DOM.
- Callback props keep the contract names: `onValueChange`, not `onvaluechange`, not a
  `CustomEvent`. The lowercased form is Svelte's DOM-event idiom and stays reserved for native
  events forwarded through rest props.
- A controllable value is additionally declared `$bindable()` so `bind:value` works. Binding is an
  ergonomic surface, not a second state engine: the core controllable-state primitive still decides
  every transition, blocked states still block, and `onValueChange` still fires. Controlled usage
  (owner passes `value` and handles `onValueChange` without binding) must keep working.
- Content: `children?: Snippet`, and `Snippet<[state]>` for what React expresses as a render prop.
  Name slots after the contract concept (`leadingIcon`), not after their position.
- `class` is the consumer-facing name of what React calls `className`; it accepts the same
  `string | ClassNameComponent<XxxInterface>` union and is forwarded to the core style function
  unchanged.

## Reactivity and DOM

- `$derived` computes the style record from the core style function with every prop, resolved
  state, and `class`. No class decision lives in Svelte.
- `$effect` creates `@udixio/core/dom` controllers with `bind:this` element references and destroys
  them in its cleanup. `onMount` is reserved for one-shot setup that reads no reactive prop.
- Pure transitions come from core behavior; `$state` only holds what the component owns.
- No `svelte/transition`, `svelte/animate`, or CSS-only reimplementation of an effect that core
  animates with anime.js.

## Naming

- File `Xxx.svelte`, spec `xxx.spec.ts` beside it, action `xxx.action.ts`, barrel
  `packages/ui-svelte/src/index.ts`.
- Example stems `xxx-<case>.svelte` under `apps/doc/src/examples/svelte/`.

## Tests

vitest + `@testing-library/svelte` in jsdom, same semantic scenario matrix as React and Angular,
plus `bind:` round-trips for every `$bindable` prop and action `destroy` cleanup where an action
exists. `svelte-check` is part of the typecheck gate because vitest does not prove template types.
