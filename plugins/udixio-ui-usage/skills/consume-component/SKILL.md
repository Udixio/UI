---
name: consume-component
description: Resolve the exact installed API and current usage guidance for a Udixio UI component (@udixio/ui-react or @udixio/ui-angular) from its shipped TSDoc and the live documentation, for both React and Angular. Use when adding a component to a downstream project, wiring its props/inputs/outputs, fixing incorrect or outdated component usage, or checking what an installed version actually supports. Not for maintaining the component library itself.
---

# Consume a Udixio UI component

## Detect the framework

1. Check the target project's `package.json` for a dependency on `@udixio/ui-react` or `@udixio/ui-angular` (a project normally has only one). If neither is present, this skill doesn't apply — tell the user to install the package first.
2. Note which one is present; it decides which reference file you load later and which package you read types from.

## Resolve the exact API from the installed package (source of truth)

The shipped `.d.ts` (React) / component source (Angular) is authoritative for the API shape — it is exactly what's installed, never stale, and works offline.

1. Find the component's export:
   - React: `node_modules/@udixio/ui-react/dist/index.d.ts` (or the individual component's `.d.ts` under `dist/lib/components/`).
   - Angular: `node_modules/@udixio/ui-angular/index.d.ts` — ng-packagr publishes a single root type-entry (Angular Package Format), not per-component files, so grep that one file for the component's exported class.
   - Inside this monorepo (workspace consumers), read the source directly instead: `packages/ui-react/src/index.ts` / `packages/ui-angular/src/index.ts` and the component file they re-export.
2. Read the full prop/input/output surface: name, type, required/optional, default value.
3. Read the TSDoc block above the component export — `@status`, `@category`, `@parent`, `@devx`, `@a11y`, `@limitations`. These carry constraints the type signature alone doesn't show: controlled/uncontrolled pairing, discriminated prop unions (e.g. an action vs. a link variant), required companion props, accessibility requirements. `@parent` names the family a sub-component belongs to (e.g. `Tab` → `Tabs`) and tells you where its guide lives in the next step.
4. Never invent a prop/input/output that isn't in this typing.

## Get usage patterns and examples from the live docs

Every documentation page is mirrored as plain markdown at its own URL suffixed with `.md`. Inserting `.react` or `.angular` before that suffix narrows the document to a single framework — always request the one detected in step 1. The unfiltered documents carry both APIs side by side, which is exactly where cross-framework mistakes come from (React's `onPressedChange` vs. Angular's `pressedChange`).

1. Fetch `https://ui.udixio.fr/components/<kebab-case-component-name>.<framework>.md` (e.g. `IconButton` in a React project → `https://ui.udixio.fr/components/icon-button.react.md`). It holds the usage prose, the runnable examples and the API tags for that framework alone.
2. Sub-components have no guide of their own — theirs is written under the family named by `@parent`, so fetch that one instead: `Tab` (`@parent Tabs`) → `https://ui.udixio.fr/components/tabs/overview.react.md`.
3. Narrower documents exist when you only want one half: `.../components/<name>/overview.<framework>.md` (guide and examples) and `.../components/<name>/api.<framework>.md` (props table).
4. Use these for prose guidance and multi-prop combinations the typing alone doesn't make obvious — not for the list of props itself.
5. If the fetch fails or no fetch tool is available, continue with the TSDoc alone and say so. Don't block on it.

## Resolve conflicts

If the fetched doc contradicts the installed `.d.ts` — a prop/input/output it doesn't have (or vice versa), or usage prose that conflicts with a `@devx`/`@a11y`/`@limitations` tag — the installed `.d.ts` wins on all of it. The live doc reflects the latest published version, which can be ahead of (or behind) what's actually installed. Mention the discrepancy to the user instead of silently picking one side.

## Apply framework conventions

Before writing code, load the reference matching the detected framework:

- React → [react-conventions.md](../../references/react-conventions.md)
- Angular → [angular-conventions.md](../../references/angular-conventions.md)

## Write the code

- Use only props/inputs/outputs confirmed in the steps above.
- Follow the controlled/uncontrolled pairing exactly as documented (e.g. a value prop + its change callback/event + a `default*` prop for uncontrolled use) — don't mix controlled and uncontrolled usage on the same instance.
- Carry over `@a11y` and `@limitations` constraints into the generated markup (e.g. a required `aria-label` when the component renders no visible label of its own).
