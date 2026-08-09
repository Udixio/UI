# Angular conventions for @udixio/ui-angular

## Setup

- Install `@udixio/theme` and `@udixio/tailwind` alongside `@udixio/ui-angular` (`npm install @udixio/ui-angular @udixio/theme @udixio/tailwind`). Unlike React, `@udixio/ui-angular` does **not** bundle or re-export the theme engine — both are required as direct dependencies, and there is no `defineConfig` export from `@udixio/ui-angular` itself.
- `defineConfig` is imported directly from `@udixio/theme`. Unlike React's `defineConfig` (re-exported from `@udixio/ui-react`, which wires `TailwindPlugin`/`FontPlugin` for you), Angular's call must list `plugins: [new FontPlugin({}), new TailwindPlugin({ outFile: '...' })]` explicitly.
- This generates a static CSS file at build time via a bundler plugin from `@udixio/theme` (`esbuildPlugin`/`webpackPlugin`/`rollupPlugin` — there's no single-call Vite plugin like React's `vitePlugin`), wired into the Angular build. Import the generated CSS into the project's global stylesheet (referenced from `angular.json`), alongside a Tailwind `@source` directive pointing at `node_modules/@udixio/ui-angular` so Tailwind picks up the library's utility classes.
- There is **no Angular `ThemeProvider` equivalent** — components are standalone and need no provider. This also means there is no built-in helper for live/runtime theme changes; the generated CSS only covers a fixed theme. For runtime color changes, use `@udixio/theme`'s `loader()` API directly and inject the resulting CSS yourself. See `https://ui.udixio.fr/get-started/angular.md` for the full walkthrough.

## Component selectors

- The class you import (e.g. `Switch`) and the template selector it renders under (e.g. `lib-switch`) are not the same string. Check the component's `@Component({ selector: ... })` before writing a template — don't guess the selector from the class name.

## Inputs and outputs

- Built with Angular signal `input()` / `output()`, not the `@Input()` / `@Output()` decorators — this only matters if you're reading the component's own source for its API surface (already covered by the `.d.ts`/source-reading step); it doesn't change how you consume it from a template.
- Controlled state mirrors React's pairing, Angular-flavored: a value input (e.g. `checked`), its change output (e.g. `checkedChange`), and a `default*` input for uncontrolled use. Prefer the two-way binding shorthand (`[(checked)]`) over wiring the input/output pair by hand, unless you need to intercept or reject the change.
- Boolean inputs accept the bare-attribute form (e.g. `disabled` with no value bound) — Angular's `booleanAttribute` transform handles the coercion.
