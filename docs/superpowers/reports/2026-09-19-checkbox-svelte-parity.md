# Checkbox — Svelte parity

Date: 2026-09-19 · Source: `@udixio/ui-react` / `@udixio/core` · Target: `@udixio/ui-svelte`

## Delivery shape

All adapters own the visual checkbox and render a native input. Svelte uses a component with a
root touch-target wrapper and an input child because the checkbox needs a state layer, visual box,
and icon around the native control. `checked` is `$bindable`; a function binding is the supported
way for an owner to reject a transition.

## Parity matrix

| Contract | React | Angular | Svelte | Verdict |
| --- | --- | --- | --- | --- |
| `checked` / initial state | `checked`, `defaultChecked` | `checked`, `defaultChecked` | `$bindable checked`, `defaultChecked` | parity; Svelte binding adaptation |
| transition | `getCheckboxChangeTransition` + `onCheckedChange` | same core transition + `checkedChange` | same core transition + `onCheckedChange` | parity |
| mixed state | native `indeterminate` property | input binding | `$effect` writes native property | platform adaptation |
| semantics | native input | native input | native input | parity |
| styling | `checkboxStyle` | `checkboxStyle` | `checkboxStyle` | parity |
| interaction feedback | shared `StateLayer` | shared `StateLayer` | shared `StateLayer` | parity |
| public classes | `className` / state function | `class` / `classes` | `class` / `classes` | platform adaptation |
| tests and docs | React matrix | Angular matrix | Svelte matrix + bind/rejection fixture | parity |

## Accepted platform differences

- Svelte uses `bind:checked` and `onCheckedChange`, with the function-binding setter as the owner
  decision point. The child cannot detect whether a prop is bound, so it restores the native input
  when the owner rejects a transition.
- Svelte forwards native input attributes to the semantic `<input>` and applies `class`/`style`
  to the touch-target root, matching the React `className`/`style` split.

## Validation

- `pnpm exec vitest run src/lib/checkbox/checkbox.spec.ts` — 10 tests passed
- `pnpm nx typecheck ui-svelte` — passed, 0 diagnostics
- `pnpm nx test ui-svelte` — passed
- `pnpm nx build ui-svelte` — passed
- `pnpm nx lint ui-svelte` — passed
- `pnpm --dir apps/doc docgen` / `docgen:check` — passed; Svelte payload includes `checked` with `bindable: true`
- `python3 plugins/udixio-ui-governance/scripts/validate_api_docs.py --component checkbox` — passed
- `pnpm --dir apps/doc build` — passed; rendered Checkbox overview/API routes contain the Svelte panel and documentation notes
- Browser interactive route check — not run; no browser page was available in the session
