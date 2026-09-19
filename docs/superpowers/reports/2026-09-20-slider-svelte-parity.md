# Slider — Svelte parity

Date: 2026-09-20 · Source: `@udixio/ui-react` / `@udixio/core` · Target: `@udixio/ui-svelte`

## Delivery shape

All adapters expose a component whose root is a focusable `div[role="slider"]`. The root owns
keyboard semantics and the shared core pointer controller owns mouse/touch dragging. Svelte
exposes `$bindable value` and uses function bindings when the owner must accept or reject a
transition.

## Parity matrix

| Contract | React | Angular | Svelte | Verdict |
| --- | --- | --- | --- | --- |
| `value` / initial state | `value`, `defaultValue` | `value`, `defaultValue` | `$bindable value`, `defaultValue` | parity; Svelte binding adaptation |
| snapping | shared `getSlider*` behavior | same | same | parity |
| pointer/touch drag | shared `createSliderPointerController` | same | same | parity |
| keyboard | Arrow keys, Home/End | same | same | parity |
| indicator motion | shared `createSliderIndicatorController` | same | same | parity |
| marks/open ends | shared marks and `±Infinity` behavior | same | same | parity |
| accessible value text | `valueFormatter` or numeric string | same | same | parity; source defect fixed |
| hidden form value | hidden input, disabled excluded | same | same | parity |
| public classes | `className` / state function | `class` / `classes` | `class` / `classes` | platform adaptation |
| tests and docs | React matrix | Angular matrix | Svelte matrix + bind/rejection fixture | parity |

## Accepted platform differences

- Svelte uses `bind:value` and a function-binding setter as the owner decision point. This is the
  framework idiom corresponding to Angular's `[(value)]` and React's controlled callback.
- Svelte forwards native lower-case `onkeydown`/`onblur` callbacks while retaining the semantic
  `onChange` callback name from the shared contract.
- Svelte's `style:` directives and `bind:this` replace React inline style/ref syntax; all values,
  elements, and controllers remain shared semantically.

## Audit findings

Baseline: `320cf8e6` (`feat(ui-svelte): add Switch`). Slider's Svelte slice and the formatter
correction are new relative to that baseline.

### PARITY-A11Y-001 — fixed, major, high confidence

- Evidence: the public core contract described `valueFormatter` as formatting both the visible
  drag indicator and `aria-valuetext`, but React and Angular used `resolvedValue.toString()` for
  `aria-valuetext`; a localized/unit-formatted value therefore disappeared from the accessible
  name/value description.
- Remediation: React now stringifies `valueFormatter(resolvedValue)` for `aria-valuetext`, Angular
  uses its existing `formattedValue`, and Svelte uses the same formatted value for both the
  indicator and `aria-valuetext`.
- Regression proof: React, Angular, and Svelte Slider specs assert a `30%` formatter in the
  indicator and accessible value text.
- Disposition: fixed.

No API, state, event, DOM, style, animation, cleanup, export, or documentation parity findings
remain open. All adapters remain components, so no delivery-shape exception or `FORM-*` finding
is needed.

## Validation

### Passed

- `pnpm nx run ui-svelte:test-ci--src/lib/slider/slider.spec.ts` — 14 Svelte tests passed.
- `pnpm nx test ui-svelte` — package suite passed.
- `pnpm nx typecheck ui-svelte` — passed.
- `pnpm nx lint ui-svelte` — passed.
- `pnpm nx build ui-svelte` — passed.
- `pnpm nx run @udixio/ui-react:test-ci--src/tests/Slider.spec.tsx` — passed.
- `NX_IGNORE_UNSUPPORTED_TS_SETUP=true node_modules/.bin/tsc -p packages/ui-react/tsconfig.lib.json --noEmit` — passed.
- `pnpm --dir packages/ui-angular exec jest --config jest.config.cjs --runInBand --verbose` — 29 suites and 329 tests passed.
- `pnpm nx build ui-angular` — passed.
- `pnpm nx run @udixio/core:test-ci--src/lib/behaviors/slider.behavior.spec.ts` — passed.
- `pnpm nx run @udixio/core:test-ci--src/lib/dom/slider.spec.ts` — passed.
- `pnpm --dir apps/doc docgen` — generated 36 component API documents.
- `pnpm --dir apps/doc docgen:check` — checked 36 documents.
- `node --test apps/doc/scripts/docgen.test.js` — passed.
- `python3 plugins/udixio-ui-governance/scripts/validate_api_docs.py --component slider` — passed.
- `pnpm --dir apps/doc build` — passed with the required font-server permission; deterministic
  output checks found all five Svelte examples, 10 Svelte framework panels, `role="slider"`,
  `aria-valuetext`, and the Developer experience, Accessibility, and Limitations sections.
- `git diff --check` — passed.

The Astro build retains repository-level warnings about deprecated MDX plugin configuration,
esbuild/oxc configuration, and one pre-existing CSS `var(...)` token; none is caused by Slider.

### Not executed

- Interactive browser inspection was unavailable in this environment. The built HTML route checks
  above were executed instead; no browser-specific result is claimed.
