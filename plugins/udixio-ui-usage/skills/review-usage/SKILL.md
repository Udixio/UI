---
name: review-usage
description: Check existing code that already uses Udixio UI (@udixio/ui-react or @udixio/ui-angular) against the API actually installed, reporting invented props, wrong selectors, controlled/uncontrolled mistakes, unmet accessibility requirements and violated limitations. Use to review or audit component usage in a downstream project, to check a diff or pull request touching Udixio components, or when a component behaves unexpectedly and the markup may be at fault. Not for auditing the component library's own source.
---

# Review Udixio UI usage

Reviews code that already exists. To write new component code instead, use `consume-component`.

## Establish the ground truth

1. Detect the framework from the project's `package.json`: `@udixio/ui-react` or `@udixio/ui-angular`.
2. Collect every Udixio component used in the files under review (imports from either package, and — Angular only — the selectors those classes render under).
3. For each distinct component, read its installed API exactly as `consume-component` does: the shipped `.d.ts` (`node_modules/@udixio/ui-react/dist/…`, or `node_modules/@udixio/ui-angular/index.d.ts` for Angular's single root type-entry), including the `@status`, `@parent`, `@devx`, `@a11y` and `@limitations` TSDoc tags.
4. Optionally fetch `https://ui.udixio.fr/components/<slug>.<framework>.md` for usage prose. The installed typing still wins on every conflict.

Review only against this ground truth. Never flag a prop as wrong because it is unfamiliar — confirm it is absent from the installed typing first.

## What to check

Report a finding only when you can point at the specific line and the specific rule it breaks.

- **Invented or misspelled members** — a prop/input/output that does not exist in the installed typing.
- **Wrong Angular selector** — using the exported class name as a tag (`<Switch>`) instead of the selector declared in `@Component({ selector: … })` (`<lib-switch>`), or importing the class without adding it to the standalone component's `imports`.
- **Controlled/uncontrolled confusion** — passing a controlled value (`checked`, `value`, `pressed`) together with its `default*` counterpart on the same instance; or passing a controlled value with no change handler wired, which silently freezes the component.
- **Unmet `@a11y` requirements** — most often a missing accessible name on a component that renders no visible label of its own.
- **Violated `@limitations`** — the tag states what the component deliberately does not support; using it that way anyway is a defect, not a style preference.
- **Deprecated or unstable usage** — a component whose `@status` is not `stable` used in a place the project treats as stable, worth flagging as a risk rather than an error.
- **Wrong prop-union branch** — mixing props from two branches of a discriminated union (e.g. link-only and action-only props on the same element).
- **Hardcoded values that should be theme tokens** — literal hex colors or font sizes where the design system exposes a token.

## Report

Group findings by file, most severe first. For each: the line, what the installed API actually declares, and the corrected code. Separate genuine defects from risks and style observations — don't inflate the list.

If the code is correct, say so plainly rather than manufacturing findings.

## Fixing

Apply fixes only when asked. When you do, re-read the installed typing for each component you touch and follow the framework conventions in
[react-conventions.md](../../references/react-conventions.md) or
[angular-conventions.md](../../references/angular-conventions.md).
