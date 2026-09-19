# Switch — Svelte parity

Date: 2026-09-19 · Source: `@udixio/ui-react` / `@udixio/core` · Target: `@udixio/ui-svelte`

## Delivery shape

All adapters expose a component whose root is a focusable `div[role="switch"]`; the semantic
state is `aria-checked`, with Space and Enter activation. Svelte exposes `$bindable checked` and
uses the shared `createSwitchThumbController` for the thumb's translate animation.

## Parity matrix

| Contract | React | Angular | Svelte | Verdict |
| --- | --- | --- | --- | --- |
| `checked` / initial state | `checked`, `defaultChecked` | `checked`, `defaultChecked` | `$bindable checked`, `defaultChecked` | parity; Svelte binding adaptation |
| transition | `getSwitchChangeTransition` + `onCheckedChange` | same core transition + `checkedChange` | same core transition + `onCheckedChange` | parity |
| semantics | `role=switch`, `aria-checked`, keyboard | same | same | parity |
| thumb geometry | `getSwitchHandleOffset` | same | same | parity |
| thumb motion | shared core controller | shared core controller | shared core controller | parity |
| icons | active/inactive resolved from checked state | same | same | parity |
| public classes | `className` / state function | `class` / `classes` | `class` / `classes` | platform adaptation |
| tests and docs | React matrix | Angular matrix | Svelte matrix + bind/rejection fixture | parity |

## Accepted platform differences

- Svelte uses `bind:checked` and a function-binding setter as the owner decision point. This is the
  framework idiom corresponding to Angular's `[(checked)]` and React's controlled callback.
- Native lower-case `onclick`/`onkeydown` callbacks are forwarded under Svelte's event naming;
  the semantic `onCheckedChange` callback keeps the cross-framework contract name.

## Audit findings

Baseline: `5fe7e6c5` (`feat(ui-svelte): add Checkbox`). The Svelte Switch slice is new relative
to that baseline; React, Angular, and core are the verified source contracts.

### PARITY-A11Y-001 — fixed, minor, high confidence

- Evidence: the initial Svelte root used `tabindex={disabled ? -1 : rest.tabindex}`. With no
  caller-provided `tabindex`, a `div[role="switch"]` was not keyboard reachable, unlike React's
  explicit `tabIndex={disabled ? -1 : 0}` and Angular's equivalent binding.
- Remediation: `packages/ui-svelte/src/lib/switch/Switch.svelte:118` now uses
  `tabindex={disabled ? -1 : 0}`; the user-provided value cannot override the component's
  required interactive semantics, matching the other adapters.
- Regression proof: `packages/ui-svelte/src/lib/switch/switch.spec.ts:25-34` and `:101-113`.
- Disposition: fixed.

No API, state, event, DOM, style, animation, cleanup, export, or documentation parity findings
remain open. Svelte's `$bindable`/function-binding surface and `class`/`classes` names are
intentional platform adaptations; all three adapters remain components, so no delivery-shape
exception is needed.

## Validation

### Passed

- `pnpm nx run ui-svelte:test-ci--src/lib/switch/switch.spec.ts` — 10 Svelte tests passed.
- `pnpm nx run @udixio/ui-react:test-ci--src/tests/Switch.spec.tsx` — passed.
- `pnpm nx run ui-angular:test --runInBand` — passed.
- `pnpm nx run @udixio/core:test-ci--src/lib/behaviors/switch.behavior.spec.ts` — passed.
- `pnpm nx run @udixio/core:test-ci--src/lib/dom/switch.spec.ts` — passed.
- `pnpm nx typecheck ui-svelte` — passed.
- `pnpm nx lint ui-svelte` — passed.
- `pnpm nx build ui-svelte` — passed.
- `pnpm --dir apps/doc docgen` — generated 36 component API documents.
- `pnpm --dir apps/doc docgen:check` — checked 36 documents.
- `node --test apps/doc/scripts/docgen.test.js` — passed.
- `python3 plugins/udixio-ui-governance/scripts/validate_api_docs.py --component switch` — passed.
- `pnpm --dir apps/doc build` — passed with the required font-server permission; deterministic
  output checks found Switch overview/API routes, Svelte examples, `tabindex=0`, and the
  Developer experience, Accessibility, and Limitations sections.
- `git diff --check` — passed.

The Astro build retains repository-level warnings about deprecated MDX plugin configuration,
esbuild/oxc configuration, and one pre-existing CSS `var(...)` token; none is caused by Switch.

### Not executed

- Interactive browser inspection was unavailable in this environment. The built HTML route checks
  above were executed instead; no browser-specific result is claimed.
