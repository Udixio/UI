# @udixio/ui-svelte

Svelte 5 adapter of the Udixio UI component library: thin runes-based bindings over the
framework-agnostic contracts, styles, behaviors and DOM controllers of `@udixio/core`.

- Components ship as `.svelte` sources plus `.d.ts` (built by `svelte-package`); the consumer's
  Vite/SvelteKit build compiles them. Requires `svelte` `^5.46`.
- `@udixio/core` is a peer dependency so the consumer resolves one core instance.
- Controllable values are `$bindable`; owners that need to reject a change use a Svelte 5 function
  binding. Content goes through snippets.

See `docs/component-authoring.md` at the repository root for the authoring standard.
