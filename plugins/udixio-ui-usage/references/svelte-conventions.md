# Svelte conventions for @udixio/ui-svelte

## Setup

- Requires `svelte` `^5` — the components are written with runes and ship as `.svelte` sources plus `.d.ts` (standard Svelte library packaging), so the consumer's own Vite/SvelteKit build compiles them. There is no Svelte 4 build.
- Install `@udixio/theme` and `@udixio/tailwind` alongside `@udixio/ui-svelte` (`npm install @udixio/ui-svelte @udixio/theme @udixio/tailwind`). Like Angular — and unlike React — `@udixio/ui-svelte` does **not** re-export the theme engine: `defineConfig` comes from `@udixio/theme`, and the theme CSS is produced at build time by the `@udixio/theme` Vite plugin wired into `vite.config`. Add a Tailwind `@source` directive pointing at `node_modules/@udixio/ui-svelte` so Tailwind picks up the library's utility classes. See `https://ui.udixio.fr/get-started/svelte.md` for the full walkthrough; if that page does not exist yet for the installed version, follow the Angular page's build-plugin steps and say so.
- There is no Svelte `ThemeProvider` — components need no provider. Runtime color changes go through `@udixio/theme`'s `loader()` API, as in Angular.

## Props

- The public props type is exported as `Svelte<Component>Props` (e.g. `SvelteButtonProps`) next to the component; read it from the shipped `.d.ts` rather than the `.svelte` file's script block when both exist.
- `class` is a plain string applied to the root element; `classes` takes the state-aware `ClassNameComponent<XInterface>` map (or a per-element record) — the same split as Angular.
- Callback props keep the React names: `onValueChange`, `onPressedChange`, `onCheckedChange`… They are plain callback props, **not** Svelte custom events — there is no `on:valuechange`, no `event.detail`.
- Controlled state: a value prop (`checked`, `value`, `pressed`) is `$bindable`, so `bind:checked` keeps it in sync; `default*` props initialize uncontrolled use. To intercept or reject a change, use a function binding: `bind:checked={() => checked, (next) => { if (allowed) checked = next }}` — passing a plain value without `bind:` does not reject anything. Never combine `bind:` with the same prop's `default*` counterpart on one instance.
- Boolean props are plain booleans: `disabled={true}` or the shorthand `disabled` — there is no attribute coercion beyond Svelte's own.

## Content and DOM

- Content goes through snippets: `children` for the default slot, named snippets (`leadingIcon`, …) for the others — `{#snippet leadingIcon()}…{/snippet}` inside the component tag. Legacy `<slot>` / `slot="…"` syntax is not supported.
- Native attributes and DOM handlers (`aria-*`, `data-*`, `onclick`, `onkeydown`) are forwarded to the component's root element through rest props. Use Svelte 5's lowercased handler form for those (`onclick`), and the camelCase callback form for the component's own callbacks (`onPressedChange`).
- To reach the rendered element, use `bind:this` on the component only where its props type declares a bindable element ref; otherwise wrap it and query the wrapper.
- Some components are delivered as actions (`use:tooltip={…}`) rather than components when their job is to attach behavior to an element you own — the docs page states the shape. Actions are imported from the same package barrel.
