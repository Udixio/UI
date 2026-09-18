# Svelte adapter — design

Date: 2026-09-18 · Branch: `feat/svelte`

## Goal

Add Svelte as a third first-class adapter of Udixio UI (`@udixio/ui-svelte`), governed by the same
plugin, standards and quality gates as React and Angular, and roll it out to every existing
component. React remains the default product source; core stays framework-agnostic.

## Non-goals

- `@udixio/mcp` (deprecated, untouched).
- Svelte 4 / legacy syntax compatibility (`export let`, `<slot>`).
- Any change to the existing React and Angular component behavior beyond defects that an audit
  proves and that block a faithful Svelte port.

## Decisions

| Question | Decision |
| --- | --- |
| Svelte target | Svelte 5 runes only: `$props()`, `$state`, `$derived`, `$effect`, `$bindable`, snippets |
| Package | `packages/ui-svelte`, published as `@udixio/ui-svelte`, built by `@sveltejs/package` (ships `.svelte` sources + `.d.ts`) |
| Tests | vitest + `@testing-library/svelte` + jsdom + `vitest-axe`; specs colocated `packages/ui-svelte/src/lib/<component>/<component>.spec.ts` |
| Lint / typecheck | `eslint-plugin-svelte`, `svelte-check` |
| Docs | `@astrojs/svelte`; examples `apps/doc/src/examples/svelte/<component>-<case>.svelte` imported directly by MDX |
| Framework preference | `ExampleFramework = 'react' \| 'angular' \| 'svelte'`; pages render Svelte only when a payload/example exists |
| API extraction | Own extractor in `apps/doc/scripts/docgen.js`: `svelte/compiler` `parse` isolates `<script lang="ts">`, the shared TS program reads the `Svelte<Xxx>Props` interface, `$props()` destructuring defaults, `$bindable()` markers and TSDoc → `frameworks.svelte` |
| Plugin shape | Dedicated `sync-svelte-component` skill; every `audit-*`, `create-material-component`, references and scripts generalized to N adapters |
| Rollout | Phase A plugin + install → Phase B infra + Button pilot → Phase C waves |

## Svelte adapter conventions (source of truth for the plugin references)

- **Contract**: `packages/ui-svelte/src/lib/<component>/Xxx.svelte` declares
  `interface SvelteXxxProps extends XxxProps { … }` and reads it through `let { … } = $props()`.
  Defaults live in the destructuring only. No hollow prop: every declared prop is wired, as in
  `docs/component-authoring.md`.
- **Events**: shared contract callbacks keep their names (`onValueChange`) as callback props.
  Svelte 5 lowercased DOM handlers (`onclick`) are forwarded to the host element via rest props;
  they are not the component API.
- **Controlled / uncontrolled**: the core controllable-state primitive is the authority. A
  controllable value is additionally exposed with `$bindable()` so `bind:value` works, but binding
  never bypasses the pure core transition, blocked states or the `onXChange` callback.
- **Content**: snippets (`children?: Snippet`, typed `Snippet<[state]>` for render props). Never
  legacy `<slot>`.
- **Styles**: `$derived(xxxStyle({ …props, …states, className }))`; no style logic in Svelte.
- **DOM / animation**: `@udixio/core/dom` controllers created in `$effect`, destroyed in its
  cleanup. `onMount` is reserved for one-shot, prop-independent setup.
- **Delivery shape**: when the primary behavior attaches to an element the consumer owns, the
  shape is an **action** (`use:xxx`) or attachment (`{@attach}`), the Svelte counterpart of an
  Angular directive; behavior with no host is a function/store. A shape differing from the source
  adapter emits blocking `FORM-*`, exactly as for Angular.
- **Naming**: file `Button.svelte`, spec `button.spec.ts`, example `button-sizes.svelte`, public
  props `SvelteButtonProps`; exported from `packages/ui-svelte/src/index.ts`.
- **Host**: a Svelte component has no host element — the root element in the template is the
  semantic element; class/attribute forwarding uses rest props on that element.

## Phase A — plugin and installation

1. `plugins/udixio-ui-governance`
   - New `skills/sync-svelte-component/SKILL.md` + `agents/openai.yaml` (mirror of
     `sync-angular-component` with the conventions above).
   - New `references/svelte-conventions.md`; `repository-map.md` (Svelte rows, naming map),
     `quality-gates.md` (Svelte gates; "every available adapter" instead of "both"),
     `audit-contract.md` if a finding family needs an adapter dimension.
   - Generalize `audit-parity`, `audit-multiframework`, `audit-framework-quality`,
     `audit-accessibility`, `audit-documentation`, `audit-public-api`, `audit-component`
     (orchestration gets a Svelte step), `create-material-component` (three-adapter slice).
   - Scripts: `component_inventory.py` discovers Svelte artifacts; `validate_api_docs.py` accepts
     `svelte`; pytest fixtures for both passing and failing cases.
   - Manifests (Claude + Codex), README, marketplace: keyword `svelte`, version 0.4.0.
2. `plugins/udixio-ui-usage`: `references/svelte-conventions.md`, skills mention
   `@udixio/ui-svelte`, manifests/marketplace keywords, version bump.
3. Install: `claude plugin validate` → marketplace update + reinstall; Codex: cachebuster version
   suffix, `codex plugin add` for both plugins from `udixio-ui-local`, verify with the `list`
   commands of both harnesses.

## Phase B — infrastructure and pilot

1. `packages/ui-svelte`: package.json, `svelte.config.js`, `tsconfig`, `vite.config.ts` (vitest),
   eslint, `project.json` (build/test/lint/typecheck), `src/index.ts`, `src/lib/utils/`
   (style rune helper, controllable state bridge). Register in `vitest.workspace.ts`,
   `pnpm-workspace.yaml`, release config, root eslint.
2. `apps/doc`: `@astrojs/svelte`, framework store + selector, `Code`/`CodePreview`, `api.astro`,
   docgen Svelte extractor with a versioned schema, `validate_api_docs.py` in sync, examples dir.
3. Pilot `Button` through `udixio-ui-governance:sync-svelte-component`, finishing with
   `audit-parity` in validate mode and the docs gates. Plugin defects found here are fixed in the
   plugin before Phase C.

## Phase C — waves

1. Badge, Divider, StateLayer, Card, IconButton, Fab, ProgressIndicator, Tooltip
2. Checkbox, Switch, Slider, TextField, Chip, Chips, Search
3. AnchorPositioner, Menu (+ MenuItem, MenuGroup, MenuHeadline), ContextMenu, FabMenu, Snackbar,
   SideSheet, NavigationRail (+ Item, Section)
4. Tabs family (Tab, Tabs, TabGroup, TabPanel, TabPanels), Carousel (+ CarouselItem), DatePicker

Each component: sync skill → same semantic test matrix as React/Angular → export → Svelte doc
example → docgen → `audit-parity validate`. Separate commits per component or small family.

## Testing / acceptance

- Plugin: pytest on scripts, `claude plugin validate`, both harnesses list the plugins.
- Package: `pnpm nx test ui-svelte`, `pnpm nx build ui-svelte`, `svelte-check`, lint.
- Docs: `docgen` + `docgen:check`, `validate_api_docs.py --component <c>`, `astro build`, rendered
  API page check for react/angular/svelte with preference fallback.
- Definition of done per component unchanged from `quality-gates.md`, extended to three adapters.
