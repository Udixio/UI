# @udixio/ui-svelte

Svelte 5 adapter of the Udixio UI component library: thin runes-based bindings over the
framework-agnostic contracts, styles, behaviors and DOM controllers of `@udixio/core`.

- Components ship as `.svelte` sources plus `.d.ts` (built by `svelte-package`); the consumer's
  Vite/SvelteKit build compiles them. Requires `svelte` `^5.46`.
- `@udixio/core` is a peer dependency so the consumer resolves one core instance.
- Controllable values are `$bindable`; owners that need to reject a change use a Svelte 5 function
  binding. Content goes through snippets.

See `docs/component-authoring.md` at the repository root for the authoring standard.

## Build notes

`svelte-package` emits declarations through `svelte2tsx`, whose virtual `.svelte.ts` files trip
`noUnusedLocals` and reference `svelteHTML` outside its own type environment. The base tsconfig's
`noEmitOnError` would therefore emit nothing, so `tsconfig.package.json` relaxes those two options
for the emit only; `svelte-check` (the `typecheck` target) remains the real type gate. It also
drops the `development` export condition so `@udixio/core` is resolved through its built typings,
a real package boundary, rather than its sources.
