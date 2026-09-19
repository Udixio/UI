# Svelte Phase B — infrastructure and Button pilot — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `@udixio/ui-svelte` as a buildable, tested, documented third adapter, with the Button slice (StateLayer, Icon, ProgressIndicator, Button) as the pilot that proves the chain end to end.

**Architecture:** `packages/ui-svelte` is a Svelte 5 runes library built by `@sveltejs/package`, tested by vitest + `@testing-library/svelte` in jsdom, typed by `svelte-check`, wired into Nx like the other packages. `apps/doc` gains `@astrojs/svelte`, a `svelte` entry in the framework preference store and every framework-keyed renderer, and a Svelte extractor in `docgen.js` producing `frameworks.svelte` under API schema version 5, validated by `validate_api_docs.py`.

**Tech Stack:** svelte ^5.57, @sveltejs/package ^2.5, @sveltejs/vite-plugin-svelte ^7.3 (vite 8), @astrojs/svelte ^9 (astro 7), @testing-library/svelte ^5.4, svelte-check ^4.7, eslint-plugin-svelte ^3.23, jest-axe (already used by React), vitest 4, Nx 23.

**Spec:** `docs/superpowers/specs/2026-09-18-svelte-adapter-design.md` — plus two amendments locked in by this plan (Task 0).

## Global Constraints

- Svelte 5 runes only; legacy syntax is a defect (`svelte-conventions.md`).
- React stays the default source adapter; core stays framework-agnostic; no Svelte type in core.
- Every animated/imperative effect goes through `@udixio/core/dom`; no `svelte/transition`.
- Package name `@udixio/ui-svelte`, Nx project name `ui-svelte`, source root `packages/ui-svelte/src`.
- API schema bump 4 → 5 happens in one commit with the extractor and the validator (Task 6).
- No generated build output committed; `apps/doc/src/data/api/*.json` are versioned and must pass `docgen:check`.
- Commit after every task; attribution trailer `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.

---

### Task 0: Lock the two design amendments in the spec and plugin conventions

Two decisions surfaced while reading the code and must be written down before any Svelte code exists.

**Amendment A — customization prop.** Angular already split React's `className` into `class` (string, root element, merged) + `classes` (`ElementClasses<I> | ClassNameComponent<I>`), merged with `mergeClassNames` from `@udixio/core`. Svelte adopts the same split: `class` is a string (HTML idiom, works with `class:` directives on the consumer side), `classes` carries the state-aware map. Not `class` as a function.

**Amendment B — controlled model.** A Svelte child cannot know whether a `$bindable` prop is bound. The idiomatic Svelte 5 controlled surface is the **function binding** `bind:pressed={() => value, (next) => { if (accept(next)) value = next }}` (Svelte ≥ 5.9). Therefore:
- `pressed = $bindable()` + `defaultPressed` + `onPressedChange`.
- Uncontrolled (`pressed === undefined` at init): the component owns an internal `$state` seeded once from `defaultPressed`.
- Controlled (`pressed !== undefined` at init): every accepted transition calls `onPressedChange(next)` **and assigns `pressed = next`**. With `bind:` the owner's variable follows; with a function binding the owner's setter decides; with a plain value prop Svelte applies its own prop-override semantics until the owner passes a different value.
- Mode is fixed for the component lifetime; switching logs the same `console.error` as React/Angular.
- Parity verdict: `platform-adaptation` (binding syntax at equal shape). Test scenario 2 ("controlled request without local mutation") is expressed with a rejecting function binding.

**Files:**
- Modify: `docs/superpowers/specs/2026-09-18-svelte-adapter-design.md` (Conventions section: replace the `class` bullet and the "Controlled / uncontrolled" bullet)
- Modify: `plugins/udixio-ui-governance/references/svelte-conventions.md` (same two bullets; add "function binding" to Tests)
- Modify: `plugins/udixio-ui-usage/references/svelte-conventions.md` (Props: `class` + `classes`; controlled via function binding)
- Modify: `plugins/udixio-ui-governance/skills/sync-svelte-component/SKILL.md` (bullet "Declare every controllable value `$bindable()`…" → describe the assign-on-accept rule and function-binding control)

- [ ] **Step 1: Edit the four files** with the wording above (keep each bullet ≤ 4 lines).
- [ ] **Step 2: Bump governance plugin to 0.4.1 and usage to 0.2.1** in both manifests of each; `claude plugin validate .`.
- [ ] **Step 3: Commit** — `docs(spec,plugins): Svelte class/classes split and function-binding controlled model`.

---

### Task 1: Scaffold `packages/ui-svelte` (build, typecheck, lint, empty test)

**Files:**
- Create: `packages/ui-svelte/package.json`, `svelte.config.js`, `vite.config.ts`, `tsconfig.json`, `tsconfig.lib.json`, `tsconfig.spec.json`, `project.json`, `README.md`, `src/index.ts`, `src/tests/setup.ts`, `src/lib/utils/smoke.spec.ts`
- Modify: root `package.json` (devDependencies), `pnpm-lock.yaml` (via install), `.github/workflows/*.yml` only if a package list is hardcoded (grep first: `grep -rn "ui-angular" .github`).

**Interfaces:**
- Produces: package `@udixio/ui-svelte` (peer `svelte ^5.46.4`, `@udixio/core`), Nx targets `build`, `test`, `typecheck`, `lint` on project `ui-svelte`; `src/index.ts` barrel.

- [ ] **Step 1: Install dependencies at the workspace root**

```bash
pnpm add -Dw svelte@^5.57.1 @sveltejs/package@^2.5.8 @sveltejs/vite-plugin-svelte@^7.3.0 @testing-library/svelte@^5.4.2 svelte-check@^4.7.6 eslint-plugin-svelte@^3.23.0
```

- [ ] **Step 2: `packages/ui-svelte/package.json`**

```json
{
  "name": "@udixio/ui-svelte",
  "version": "0.1.0",
  "type": "module",
  "svelte": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    "./package.json": "./package.json",
    ".": { "types": "./dist/index.d.ts", "svelte": "./dist/index.js", "default": "./dist/index.js" }
  },
  "files": ["dist", "!dist/**/*.spec.*"],
  "sideEffects": ["**/*.css"],
  "peerDependencies": { "svelte": "^5.46.4", "@udixio/core": "0.2.2-next.9" },
  "dependencies": { "@udixio/icons-rounded-400": "0.2.2-next.3" },
  "devDependencies": { "@types/jest-axe": "^3.5.9", "jest-axe": "^10.0.0" },
  "repository": { "type": "git", "url": "https://github.com/Udixio/UI.git" },
  "publishConfig": { "provenance": true, "access": "public" },
  "license": "Apache-2.0"
}
```

(`@udixio/core` is a peer, like Angular, because `.svelte` sources are compiled by the consumer and must resolve one core instance.)

- [ ] **Step 3: `svelte.config.js`**

```js
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
export default { preprocess: vitePreprocess(), compilerOptions: { runes: true } };
```

- [ ] **Step 4: `vite.config.ts`** — vitest only (the build is `svelte-package`, not Vite lib mode):

```ts
/// <reference types='vitest' />
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/packages/ui-svelte',
  plugins: [svelte({ hot: false })],
  resolve: { conditions: ['browser', 'development'] },
  test: {
    name: 'ui-svelte',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.spec.ts'],
    setupFiles: ['src/tests/setup.ts'],
    reporters: ['default'],
    coverage: { reportsDirectory: './test-output/vitest/coverage', provider: 'v8' as const },
  },
});
```

`resolve.conditions: ['browser']` is required: Svelte 5 ships a server build under the default condition and `@testing-library/svelte` needs the client runtime in jsdom.

- [ ] **Step 5: `src/tests/setup.ts`**

```ts
import '@testing-library/jest-dom/vitest';
import { toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);
```

- [ ] **Step 6: tsconfigs**

`tsconfig.json`: same shape as `packages/ui-react/tsconfig.json` (references lib + spec).
`tsconfig.lib.json`: extends base; `"rootDir": "src"`, `"outDir": "dist"`, `"lib": ["es2022","dom","dom.iterable"]`, `"types": ["svelte","node","vite/client"]`, `"include": ["src/**/*.ts","src/**/*.svelte"]`, exclude specs, references `../core/tsconfig.lib.json` and `../icons/icons-rounded-400/tsconfig.lib.json`. Remove `emitDeclarationOnly`/`composite` conflicts if `svelte-package` complains (it generates its own d.ts with `svelte2tsx`; the tsconfig is for `svelte-check` and editor).
`tsconfig.spec.json`: like React's with `"types": ["vitest/globals","vitest/importMeta","vite/client","node","vitest","svelte"]`, include `src/**/*.spec.ts`, `src/tests/setup.ts`.

- [ ] **Step 7: `project.json`**

```json
{
  "name": "ui-svelte",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "packages/ui-svelte/src",
  "projectType": "library",
  "release": { "version": { "currentVersionResolver": "git-tag", "fallbackCurrentVersionResolver": "disk" } },
  "tags": [],
  "targets": {
    "build": {
      "executor": "nx:run-commands",
      "outputs": ["{projectRoot}/dist"],
      "options": { "cwd": "packages/ui-svelte", "command": "svelte-package -i src -o dist && cp ../../LICENSE dist/" },
      "dependsOn": ["^build"]
    },
    "typecheck": {
      "executor": "nx:run-commands",
      "options": { "cwd": "packages/ui-svelte", "command": "svelte-check --tsconfig ./tsconfig.lib.json --fail-on-warnings" }
    },
    "test": {
      "executor": "@nx/vite:test",
      "outputs": ["{projectRoot}/test-output/vitest/coverage"],
      "options": { "configFile": "packages/ui-svelte/vite.config.ts" }
    },
    "lint": { "executor": "@nx/eslint:lint" }
  }
}
```

- [ ] **Step 8: ESLint** — root `eslint.config.mjs`: add `...svelte.configs['flat/recommended']` scoped to `packages/ui-svelte/**/*.svelte` with `parserOptions.parser: tseslint.parser` and `svelteConfig` import; mirror how the Angular block is scoped.

- [ ] **Step 9: Smoke test** `src/lib/utils/smoke.spec.ts`:

```ts
import { render } from '@testing-library/svelte';
import Smoke from './Smoke.svelte';
it('renders a Svelte 5 component in jsdom', () => {
  const { getByText } = render(Smoke, { props: { label: 'hi' } });
  expect(getByText('hi')).toBeInTheDocument();
});
```

`src/lib/utils/Smoke.svelte`: `<script lang="ts">let { label }: { label: string } = $props();</script><span>{label}</span>`. Delete both in Task 3 once real specs exist.

- [ ] **Step 10: Run the four gates**

```bash
pnpm nx test ui-svelte      # PASS 1 test
pnpm nx typecheck ui-svelte # 0 errors
pnpm nx build ui-svelte     # dist/index.js + index.d.ts + Smoke.svelte + Smoke.svelte.d.ts
pnpm nx lint ui-svelte
```

- [ ] **Step 11: Commit** — `build(ui-svelte): scaffold the Svelte 5 adapter package`.

---

### Task 2: Runes utilities — style derivation and controllable state

**Files:**
- Create: `packages/ui-svelte/src/lib/utils/create-controllable-state.svelte.ts`, `create-controllable-state.spec.ts`, `create-style.svelte.ts`, `create-style.spec.ts`, `index.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface ControllableStateOptions<T> { value: () => T | undefined; defaultValue: () => T; onChange?: (next: T) => void; assign?: (next: T) => void; componentName?: string; stateName?: string }
  export interface ControllableState<T> { readonly current: T; set(next: T | ((current: T) => T)): void }
  export function createControllableState<T>(options: ControllableStateOptions<T>): ControllableState<T>
  export function createStyle<S extends object>(styleFn: (s: S) => Record<string,string>, state: () => S): { readonly current: Record<string,string> }
  ```
  `assign` is what the component passes to write back a bindable prop (`(next) => (pressed = next)`), called only in controlled mode.

- [ ] **Step 1: Failing tests** `create-controllable-state.spec.ts` — port the four Angular scenarios (`packages/ui-angular/src/lib/utils/create-controllable-state.spec.ts`) using `$state` wrappers: uncontrolled owns and updates; controlled requests without mutating (`assign` receives the value, `current` stays until the getter changes); `defaultValue` read once; mode change reported once via `console.error`. Wrap reactive reads in `$effect.root` or use `flushSync` from `svelte`.

- [ ] **Step 2: Run** `pnpm nx test ui-svelte` → FAIL (module missing).

- [ ] **Step 3: Implement** `create-controllable-state.svelte.ts`:

```ts
const UNINITIALIZED = Symbol('uninitialized');
export function createControllableState<T>({ value, defaultValue, onChange, assign, componentName = 'Component', stateName = 'value' }: ControllableStateOptions<T>): ControllableState<T> {
  let internal = $state<T | typeof UNINITIALIZED>(UNINITIALIZED);
  const initialControlled = value() !== undefined;
  let warned = false;
  const checkMode = (controlled: boolean) => {
    if (controlled === initialControlled || warned) return;
    warned = true;
    console.error(`Udixio UI: <${componentName}> changed ${stateName} from ${initialControlled ? 'controlled' : 'uncontrolled'} to ${controlled ? 'controlled' : 'uncontrolled'}. Choose one mode for the component lifetime.`);
  };
  const current = $derived.by(() => {
    const controlled = value();
    checkMode(controlled !== undefined);
    if (controlled !== undefined) return controlled;
    return internal === UNINITIALIZED ? defaultValue() : (internal as T);
  });
  return {
    get current() { return current; },
    set(next) {
      const previous = current;
      const resolved = typeof next === 'function' ? (next as (c: T) => T)(previous) : next;
      if (Object.is(previous, resolved)) return;
      if (value() === undefined) internal = resolved; else assign?.(resolved);
      onChange?.(resolved);
    },
  };
}
```
Seed `internal` from `defaultValue()` at creation when uncontrolled (so later `defaultValue` changes are ignored, matching Angular's `initialize`).

- [ ] **Step 4: `create-style.svelte.ts`** — `$derived.by(() => styleFn(state()))` behind a `current` getter; spec: recomputes when a state field changes, returns the same object for equal state (use `shallowEqual` copied from React utils).

- [ ] **Step 5: Run tests → PASS. Commit** — `feat(ui-svelte): controllable state and style runes`.

---

### Task 3: Pilot slice part 1 — StateLayer and Icon

**Files:**
- Create: `packages/ui-svelte/src/lib/state-layer/StateLayer.svelte`, `state-layer.spec.ts`; `src/lib/icon/Icon.svelte`, `icon.spec.ts`
- Modify: `src/index.ts` (`export { default as StateLayer } from './lib/state-layer/StateLayer.svelte'; export type { SvelteStateLayerProps } …` — types are exported from a sibling `state-layer.types.ts` because a `.svelte` module cannot re-export a type through the barrel without `svelte2tsx` support; keep `Svelte<X>Props` in `<x>.types.ts` and import it in the `.svelte` script).
- Delete: `src/lib/utils/Smoke.svelte`, `smoke.spec.ts`

**Interfaces:**
- Produces: `SvelteStateLayerProps = StateLayerProps & { class?: string; classes?: ElementClasses<StateLayerInterface> | ClassNameComponent<StateLayerInterface> }`; `SvelteIconProps = { icon: Icon; colors?: readonly string[]; class?: string; classes?: … }`.

- [ ] **Step 1: Read** `packages/ui-react/src/lib/components/StateLayer.tsx`, `packages/ui-angular/src/lib/state-layer/state-layer.ts`, the React spec `packages/ui-react/src/tests/StateLayer.spec.tsx`, and the Angular spec. Copy the TSDoc block verbatim onto the Svelte component's script (above `$props()` — docgen reads the doc comment attached to the `Svelte<X>Props` interface declaration in `<x>.types.ts`, see Task 6; put the component TSDoc there).

- [ ] **Step 2: Failing spec** `state-layer.spec.ts` — port the React matrix: renders `aria-hidden` span with `--state-color`; attaches controller to the `group/name` trigger and destroys it on unmount (spy on `@udixio/core/dom` `createStateLayerController` via `vi.mock`); `updateShape` on `shapeTransition` change; `transitionDuration` style.

- [ ] **Step 3: Implement** `StateLayer.svelte`:

```svelte
<script lang="ts">
  import { stateLayerStyle, mergeClassNames } from '@udixio/core';
  import { createStateLayerController, findStateLayerTrigger, type StateLayerController } from '@udixio/core/dom';
  import { createStyle } from '../utils/create-style.svelte';
  import type { SvelteStateLayerProps } from './state-layer.types';

  let { colorName, stateClassName = 'state-ripple-group', shapeTransition, transitionDuration, class: hostClass = '', classes }: SvelteStateLayerProps = $props();
  let layer: HTMLSpanElement | undefined = $state();
  let controller: StateLayerController | undefined;
  const styles = createStyle(stateLayerStyle, () => ({ colorName, stateClassName, shapeTransition, transitionDuration, className: mergeClassNames('stateLayer', classes, hostClass) }));

  $effect(() => {
    if (!layer) return;
    const trigger = findStateLayerTrigger(layer, stateClassName);
    if (!trigger) return;
    const created = createStateLayerController({ trigger, layer, disabled: () => trigger.matches(':disabled, [aria-disabled="true"]') });
    controller = created;
    created.updateShape(untrack(() => shapeTransition));
    return () => { created.destroy(); if (controller === created) controller = undefined; };
  });
  $effect(() => { controller?.updateShape(shapeTransition); });
</script>

<span bind:this={layer} aria-hidden="true" class={styles.current.stateLayer}
  style:--state-color={`var(--color-${colorName}, var(--color-on-surface))`}
  style:transition={transitionDuration === undefined ? undefined : `${transitionDuration}s`}></span>
```

- [ ] **Step 4: Icon** — same procedure from `packages/ui-angular/src/lib/icon/icon.ts` (three branches `raw` / `image` / `fontawesome` via `resolveIconKind`; raw SVG through `{@html}` — trusted static asset per `docs/component-authoring.md`). Spec ports `Icon.spec.tsx`.

- [ ] **Step 5: Gates** `pnpm nx test ui-svelte && pnpm nx typecheck ui-svelte && pnpm nx lint ui-svelte`. **Commit** — `feat(ui-svelte): StateLayer and Icon`.

---

### Task 4: Pilot slice part 2 — ProgressIndicator and Button

**Files:**
- Create: `src/lib/progress-indicator/ProgressIndicator.svelte`, `progress-indicator.types.ts`, `progress-indicator.spec.ts`; `src/lib/button/Button.svelte`, `button.types.ts`, `button.spec.ts`
- Modify: `src/index.ts`

**Interfaces:**
- Produces: `SvelteButtonProps` = `Omit<ButtonProps,'label'> & { label?: string; children?: Snippet; class?: string; classes?: …; pressed?: boolean /* $bindable */; onPressedChange?: (pressed: boolean) => void; href?: string; onclick?: MouseEventHandler; ...HTMLButtonAttributes | HTMLAnchorAttributes }`.

- [ ] **Step 1: Run the plugin** — `udixio-ui-governance:sync-svelte-component Button` is the procedure for this task: inventory, public-API check (Button is `@status stable`; no `API-DESIGN-*` expected — the Angular sync already passed it), delivery shape = component (nothing attaches to a foreign host), parity matrix.

- [ ] **Step 2: ProgressIndicator first** (Button's loading state renders it). Port from `packages/ui-angular/src/lib/progress-indicator/progress-indicator.ts` and the React spec (`ProgressIndicator.spec.tsx`).

- [ ] **Step 3: Failing Button spec** — port the 37 React scenarios of `packages/ui-react/src/tests/Button.spec.tsx` (names kept), plus Svelte-specific:
  - `bind:pressed` round-trip (wrapper component `button-bind.fixture.svelte` with `let pressed = $state(false)`);
  - controlled rejection through a function binding: setter ignores → `aria-pressed` stays `false`, `onPressedChange` called with `true`;
  - `children` snippet renders and `label` + `children` together logs the same error as React;
  - `class` lands on the root element and `classes` reaches the style function.

- [ ] **Step 4: Implement `Button.svelte`** following `Button.tsx` line by line for semantics: `type="button"` default, `href` → `<a>` with `aria-disabled`/`tabindex=-1`/`href` removed when blocked, `aria-pressed` only for toggle action buttons, `aria-busy` while loading, `getButtonPressTransition` guards the click (`event.preventDefault(); event.stopPropagation()` when blocked, else call `onclick` from rest props), `StateLayer` with `getButtonStateColor`, loading `ProgressIndicator` with `--button-progress-color`, `touchTarget`/`label`/`icon` element classes from `buttonStyle`. Controlled state:

```ts
let { pressed = $bindable(), defaultPressed = false, onPressedChange, ... } = $props();
const pressedState = createControllableState({ value: () => pressed, defaultValue: () => defaultPressed, onChange: onPressedChange, assign: (next) => (pressed = next), componentName: 'Button', stateName: 'pressed' });
```
Strip contract props from rest before spreading (destructuring already does it; spread `...rest` last but before the props the component owns, as React does).

- [ ] **Step 5: Gates + axe** — every spec file runs `expect(await axe(container)).toHaveNoViolations()` on a representative render. `pnpm nx test ui-svelte`, `typecheck`, `lint`, `build`; confirm `dist/lib/button/Button.svelte.d.ts` declares `SvelteButtonProps`.

- [ ] **Step 6: Commit** — `feat(ui-svelte): ProgressIndicator and Button`.

---

### Task 5: Documentation site — Svelte islands, store, renderers, examples

**Files:**
- Modify: `apps/doc/package.json` (+`@astrojs/svelte`, `svelte`), `apps/doc/astro.config.ts` (integration + alias `@udixio/ui-svelte` → `../../packages/ui-svelte/src/index.ts`), `apps/doc/src/stores/exampleFrameworkStore.ts`, `apps/doc/src/components/Code.astro`, `CodePreview.tsx`, `apps/doc/src/components/api/ApiFrameworkSelector.tsx`, `apps/doc/src/lib/componentApi.ts`, `component-md-routes.ts`, `component-markdown.ts`, `component-catalog.ts`, `apps/doc/src/layouts/components.astro`, `apps/doc/src/examples/README.md`, `apps/doc/src/data/components/button.overview.mdx`
- Create: `apps/doc/src/examples/svelte/button-{variants,sizes,toggle,states,icons,actions}.svelte`

**Interfaces:**
- Produces: `ExampleFramework = 'react' | 'angular' | 'svelte'`; `FRAMEWORK_ORDER = ['react','angular','svelte']`; `Code.astro` accepts `codes.svelte` + `<X slot="svelte" client:load />` with language `svelte`.

- [ ] **Step 1: Store** — extend the union and `isExampleFramework`. Grep the whole app for `'angular'` literals in framework arrays: `grep -rn "'react', 'angular'\|react: 'React'" apps/doc/src` and add `svelte` to each (labels `Svelte`, language `svelte`, order last).
- [ ] **Step 2: Astro** — `pnpm --dir apps/doc add @astrojs/svelte@^9 svelte@^5.57.1`; add `svelte()` to `integrations` after `angular()`; add the alias. Run `pnpm --dir apps/doc build` once now to catch integration conflicts before writing examples (the `mixedFrameworkJsxCompatibility` plugin only touches esbuild JSX; Svelte is unaffected).
- [ ] **Step 3: `Code.astro`** — third panel pair for `svelte` (copy the Angular block; `hidden={frameworks[0] !== 'svelte'}`); `frameworkLanguages.svelte = 'svelte'` (Shiki has a `svelte` grammar).
- [ ] **Step 4: Six Svelte examples** mirroring the Angular ones one to one (same case names, same markup structure), e.g. `button-sizes.svelte`:

```svelte
<script lang="ts">
  import { Button } from '@udixio/ui-svelte';
</script>
<div class="flex flex-wrap items-end justify-center gap-3">
  <Button label="XS" size="xSmall" />
  <Button label="S" size="small" />
  <Button label="M" size="medium" />
  <Button label="L" size="large" />
  <Button label="XL" size="xLarge" />
</div>
```
- [ ] **Step 5: `button.overview.mdx`** — import each `.svelte` example + `?raw` source, add `svelte:` to every `codes` and a `slot="svelte"` child; update the "Import `Button` from …" sentence to name the three packages and Svelte's `children` snippet.
- [ ] **Step 6: Markdown mirror** — `component-md-routes.ts` `frameworkVariants` derives from present payloads (not the `angular` boolean); `component-markdown.ts` gets `renderSvelteSection` (Props table with a `Bindable` column, Snippets table) once Task 6 defines the payload — leave a compile-safe stub that returns `''` for now only if Task 6 is not yet merged; otherwise do it there.
- [ ] **Step 7: Gate** — `pnpm --dir apps/doc build`; open `/components/button` and `/components/button/api` in the built preview (`pnpm --dir apps/doc preview`), select Svelte in the example selector: preview renders, code tab shows `.svelte` source, preference persists on reload.
- [ ] **Step 8: Commit** — `feat(doc): Svelte examples, framework preference and code panels`.

---

### Task 6: docgen Svelte extractor + API schema v5 + validator

**Files:**
- Modify: `apps/doc/scripts/docgen.js`, `apps/doc/scripts/docgen.test.js`, `apps/doc/src/content.config.ts`, `apps/doc/src/types/component-api.ts`, `apps/doc/src/components/api/ComponentApiReference.tsx`, `apps/doc/src/lib/component-markdown.ts`, `plugins/udixio-ui-governance/scripts/validate_api_docs.py`, `test_validate_api_docs.py`, `plugins/udixio-ui-governance/references/repository-map.md` (schema note), all `apps/doc/src/data/api/*.json` (regenerated)

**Interfaces:**
- Produces `frameworks.svelte` payload:
  ```json
  { "filePath": "packages/ui-svelte/src/lib/button/Button.svelte",
    "tags": { "status": "...", "category": "...", "devx": "...", "a11y": "...", "limitations": "..." },
    "props": { "<name>": { "name", "description", "required", "type", "defaultValue", "bindable": true } },
    "snippets": { "children": { "name": "children", "description": "...", "parameters": "[]" } } }
  ```
  `bindable` is an optional boolean item field (only Svelte emits it); `snippets` is optional. `schemaVersion: 5`.

- [ ] **Step 1: Failing docgen test** — `test('extracts Svelte props, bindables, defaults, snippets and TSDoc', …)`: write a temp `Example.svelte` + `example.types.ts` fixture, call `extractSvelteComponent({ svelteFilePath, typesFilePath, checker, reactComponent })`, assert the payload above.
- [ ] **Step 2: Implement** in `docgen.js`:
  - `svelteSourceRoot = packages/ui-svelte/src/lib`; `getSvelteComponents()` globs `**/*.svelte`, keys by basename (`Button`), and locates `<dir>/<kebab>.types.ts` (the `Svelte<Name>Props` declaration owns the TSDoc and member docs).
  - Build one TS program over `packages/ui-svelte/src/lib/**/*.ts` (tsconfig.lib.json) — same as `createAngularProgram`.
  - Script extraction: `import { parse } from 'svelte/compiler'`; `parse(source, { modern: true }).instance.content` gives the script AST span; take `source.slice(start, end)`, wrap as a virtual `.ts` in an in-memory `ts.createSourceFile`, find the `VariableDeclaration` whose initializer is `CallExpression $props()` and whose name is an `ObjectBindingPattern`; per element: default = `initializer.getText()`, `bindable = initializer is CallExpression '$bindable'` (default is `$bindable(x)`'s argument if any), rest element = ignored (native attributes).
  - Members: from the checker, `interface Svelte<Name>Props` in the types file → `getPropertiesOfType`; for each: name, `getSymbolDocumentation`, required = not optional, type via `checker.typeToString`, description fallback `getReactFallbackDescription`. Members whose type is `Snippet` / `Snippet<[...]>` (alias symbol name `Snippet` from `svelte`) go to `snippets` with `parameters` = the type-argument text.
  - Tags: `getSharedCatalogTags(react.tags)` + the interface's JSDoc tags.
  - `frameworks: { react, angular?, svelte? }`, `schemaVersion: 5`.
- [ ] **Step 3: Validator** — `KNOWN_FRAMEWORKS |= {'svelte'}`; `ITEM_FIELDS |= {'bindable'}` (must be `true` when present, and only under `frameworks.svelte.props`); `validate_framework('svelte')`: allowed `{filePath, tags, props, snippets}`, `snippets` optional record with `name`, `description`, optional `parameters` string; `schemaVersion` must equal 5. Tests: passing Svelte payload; failing: `bindable: false`, `bindable` under react, missing `props`, snippet key ≠ name.
- [ ] **Step 4: Doc app types** — `SvelteComponentApi` in `component-api.ts`, `schemaVersion: 5`, zod schema in `content.config.ts`, renderer branch in `ComponentApiReference.tsx` (Props table with Bindable column; Snippets table titled "Snippets"), `renderSvelteSection` in `component-markdown.ts`.
- [ ] **Step 5: Regenerate** `pnpm --dir apps/doc docgen && pnpm --dir apps/doc docgen:check && python3 plugins/udixio-ui-governance/scripts/validate_api_docs.py --all` (the `--all` debt list must not grow; Button/StateLayer/Icon/ProgressIndicator must pass). `node --test apps/doc/scripts/docgen.test.js`, `python3 -m pytest plugins/udixio-ui-governance/scripts`.
- [ ] **Step 6: Build + browser check** — `pnpm --dir apps/doc build`; `/components/button/api` shows the Svelte tab with props, `pressed` marked bindable, `children` under Snippets, and the three note sections; `/components/button/api.svelte.md` mirror exists.
- [ ] **Step 7: Commit** — `feat(doc): Svelte API extraction, schema v5`.

---

### Task 7: Repository wiring and plugin forward-test

**Files:**
- Modify: `docs/component-authoring.md` (new section "3 bis. Svelte (`@udixio/ui-svelte`)" mirroring the Angular one: `$props()`, `class`/`classes`, `createStyle`, `createControllableState`, snippets, `$effect`), `docs/component-behavior.md` §5 ("dans chaque package"), `README.md` (package list), `CONTRIBUTING.md` if it lists packages, `.github/workflows/release.yml` only if per-package steps are hardcoded, `plugins/udixio-ui-governance/references/repository-map.md` (`<x>.types.ts` naming), `plugins/udixio-ui-governance/references/svelte-conventions.md` (`<x>.types.ts` holds the props interface and the component TSDoc).

- [ ] **Step 1: Docs + plugin naming fix** as listed.
- [ ] **Step 2: Forward-test the plugin** — run `udixio-ui-governance:audit-parity` in `validate` mode with Svelte as target on Button; every finding is either fixed in this task or recorded as accepted `platform-adaptation` in the report.
- [ ] **Step 3: Full gate** — `pnpm nx run-many -t test,typecheck,build -p @udixio/core @udixio/ui-react ui-angular ui-svelte`, `pnpm --dir apps/doc docgen:check`, `pnpm --dir apps/doc build`, `git diff --check`.
- [ ] **Step 4: Bump plugin** governance → 0.5.0 (a workflow-affecting change), reinstall in Claude (`claude plugin update … --scope project` and `--scope user`) and Codex (`codex plugin remove` + `add`), verify `list` on both.
- [ ] **Step 5: Commit** — `docs: Svelte adapter authoring standard; plugins: 0.5.0`.

---

## Self-review

- Spec coverage: package (T1), utils (T2), pilot Button incl. its sub-components (T3–T4), Astro/store/renderers/examples (T5), docgen + schema v5 + validator (T6), authoring docs + forward-test (T7). Release config: `nx.json` release globs `packages/*`, so `ui-svelte` is picked up without edits; `project.json` carries the version resolver like Angular.
- Amendments A and B are recorded in Task 0 before any component is written; they supersede the corresponding spec bullets.
- Names used consistently: `createControllableState` (`current`/`set`/`assign`), `createStyle` (`current`), `Svelte<X>Props` in `<x>.types.ts`, `frameworks.svelte.{props,snippets}`, `bindable`, `schemaVersion: 5`, `ExampleFramework` union.
