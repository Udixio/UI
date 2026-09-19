# TextField — Svelte parity

Date: 2026-09-20 · Baseline: `27a76e61` (`feat(ui-svelte): add Slider`) · Source: `@udixio/ui-react` / `@udixio/core` · Targets: `@udixio/ui-angular`, `@udixio/ui-svelte`

## Scope inspected

The audit covered the shared TextField contract, pure behavior and styles, React and Angular
source adapters, the Svelte adapter and fixture, all three adapter test matrices, public exports,
direct-source documentation examples, generated API data, and the shared label, textarea
autosize, anchor-positioning, and month-transition controllers.

All adapters deliver TextField as a component whose field root is a `div`; the input or textarea
is the labelled native control. Svelte uses `$bindable value` and function bindings for the owner
decision point, which is a framework adaptation rather than a second state model.

## Parity matrix

| Contract | React | Angular | Svelte | Verdict |
| --- | --- | --- | --- | --- |
| Controlled/uncontrolled value | `value` / `defaultValue` | `value` / `defaultValue` + `valueChange` | `$bindable value` / `defaultValue` + `onChange` | parity; Svelte binding adaptation |
| Input, textarea, variants, masks | shared TextField contract | same | same | parity |
| Supporting/error text and ARIA | native labelled control + `aria-describedby` / `aria-invalid` | same | same | parity |
| Select surface | `Menu` / projected `MenuItem` or `options` | internal `Menu` / `options` | internal listbox / `options` | parity; documented content limitation |
| Date surface | `DatePicker` popup | `DatePicker` popup | internal calendar popup | parity of TextField behavior; documented delivery limitation |
| Date calendar navigation | month/year view, roving day focus, shared month transition | same | same | parity |
| Label notch and textarea resize | shared core DOM controllers | same | same | parity |
| Root/internal class customization | `className` / `classes` | `class` / `classes` | `class` / `classes` | platform adaptation |
| Tests, export, docs | existing React artifacts | existing Angular artifacts | Svelte matrix, fixture, examples, API payload | parity |

## Audit findings

### PARITY-DOM-001 — fixed, major, high confidence

- Evidence: the initial Svelte date popup rendered month navigation only. The current repair uses
  `getYearRange` and the year view at `packages/ui-svelte/src/lib/text-field/TextField.svelte:655-702`,
  and connects `createMonthTransitionController` at `:278-301`.
- Expected contract: the React and Angular date surfaces provide year selection, roving focus,
  and the shared month animation controller.
- Impact: before the repair, users could reach the same date values only by repeated month
  navigation, and Svelte did not receive the shared month transition behavior.
- Remediation: add the year/month toggle, scroll the selected year into view, preserve a
  focusable day after year selection, and use the core controller for forward/backward month
  transitions.
- Regression proof: `text-field.spec.ts:260-282` covers year selection, month direction, and a
  remaining `tabindex="0"` day.
- Disposition: fixed.

### PARITY-API-001 — accepted, platform-adaptation, high confidence

- Evidence: Svelte declares `value = $bindable()` and retains the shared callback name
  `onChange`; the fixture exercises both `bind:value` and a rejecting function binding.
- Expected contract: the owner controls accepted controlled transitions, with exactly one
  notification per accepted request.
- Actual shape: Svelte's binding syntax gives the owner the setter decision point, while React
  uses `value`/`onChange` and Angular uses `[(value)]`/`valueChange`.
- Impact: none; this is the idiomatic Svelte delivery of the same controlled contract.
- Disposition: accepted and documented in the Svelte TSDoc and overview.

### PARITY-DOC-001 — accepted, documented-exception, high confidence

- Evidence: React and Angular expose date/select surfaces through public `DatePicker`/`Menu`
  components; this TextField Svelte slice owns equivalent popup markup internally and exposes
  `options` for select mode.
- Expected invariant: keyboard behavior, value transitions, semantics, styles, and tests remain
  equivalent even when the framework delivery shape differs.
- Impact: standalone Svelte `DatePicker` and `Menu` are not yet public exports; consumers cannot
  compose those surfaces independently from TextField.
- Disposition: accepted for this slice, documented as a limitation, with standalone Svelte
  `DatePicker`/`Menu` remaining in the later rollout scope. This is an internal implementation
  exception rather than a public TextField delivery-shape change, so no `FORM-*` finding applies.

### PARITY-QUALITY-001 — fixed, minor, high confidence

- Evidence: the first targeted ESLint run reported a mutable derived error-icon state and missing
  keys on the weekday/week loops at `TextField.svelte:106`, `:672`, and `:677`.
- Impact: the calendar could compile and test while violating the package's Svelte lint quality
  rules.
- Remediation: derive the error icon from focus/error state and key the rendered calendar lists.
- Disposition: fixed. `pnpm nx lint ui-svelte` and the direct package ESLint run are clean; the
  remaining `.eslintignore` deprecation is a repository warning only.

No other API, state, event, semantic DOM, accessibility, style, animation cleanup, export, test,
or documentation parity finding remains open. The unrelated one-line normalization in
`apps/doc/src/data/api/tooltip.json` is preserved but excluded from the TextField commit.

## Changes made

- Added the Svelte TextField component, public types, binding fixture, 18-test semantic matrix,
  package export, nine direct-source documentation examples, overview sections, and generated
  API payload.
- Added the missing date year view, roving focus repair, and shared month transition controller
  integration to the internal Svelte date surface.
- Kept the transcript file `2026-09-19-231557-ce-projet-contient-un-plugin-interne-pour-la-gest.txt`
  outside the commit.

## Validation

### Passed

- `pnpm --dir packages/ui-svelte exec vitest run src/lib/text-field/text-field.spec.ts` — 18 tests.
- `pnpm nx test ui-svelte` — package suite passed.
- `pnpm nx typecheck ui-svelte` — `svelte-check`, zero errors and warnings.
- `pnpm nx build ui-svelte` — passed.
- `pnpm nx lint ui-svelte` — passed; only the repository's `.eslintignore` deprecation warning remains.
- Core TextField behavior, label controller, textarea autosize, and DOM-controller tests — passed.
- React TextField tests — passed.
- Angular TextField tests — 16 tests passed.
- `pnpm --dir apps/doc docgen` — generated 36 API documents.
- `pnpm --dir apps/doc docgen:check` — checked 36 documents.
- `node --test apps/doc/scripts/docgen.test.js` — passed.
- `python3 plugins/udixio-ui-governance/scripts/validate_api_docs.py --component text-field` — passed.
- `pnpm --dir apps/doc build` — passed with the required permission for the local font server;
  the generated TextField overview/API routes contain the Svelte examples, framework panel,
  `bind:value`, Developer experience, Accessibility, and Known limitations sections.
- `git diff --check` — passed.

### Not executed

- Interactive browser inspection was not available. The deterministic built-route checks above
  were executed instead; no browser-specific pass is claimed.

## Remaining risk

Standalone Svelte `DatePicker` and menu-family components are intentionally deferred to their
rollout waves; TextField's current internal surfaces are documented and tested for the behavior
they expose.
