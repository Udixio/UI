---
name: migrate-to-udixio
description: Convert existing UI code — Material UI, Bootstrap, Ant Design, Chakra, hand-rolled Tailwind or plain HTML — over to Udixio UI components and theme tokens, discovering equivalents from the live component catalog rather than a fixed mapping table. Use to adopt Udixio UI in a project that already has its own UI, to replace a component library screen by screen, or to move hardcoded colors and typography onto theme tokens. Not for converting Udixio's own React components to Angular.
---

# Migrate existing UI to Udixio UI

Migration is incremental and verifiable. Convert one screen or component at a time, keep the app building between steps, and never silently drop behavior.

## Confirm the target is ready

1. Detect the target framework and check whether `@udixio/ui-react` or `@udixio/ui-angular` is already installed, along with `@udixio/theme` and `@udixio/tailwind`.
2. If the theme build step isn't wired yet, set it up first — a converted component renders unstyled without it. Fetch the setup walkthrough for the detected framework: `https://ui.udixio.fr/get-started/react.md` or `https://ui.udixio.fr/get-started/angular.md`. The two differ substantially; don't assume React's steps apply to Angular.
3. Agree with the user on the migration scope before editing: which screen, which components, in what order.

## Discover equivalents from the live catalog

1. Fetch `https://ui.udixio.fr/components.md` — the catalog of every documented component with its slug, category, status and one-line description.
2. Match each source component against that catalog by *role*, not by name: what the element does for the user decides the equivalent, not what its author called it.
3. Then fetch the chosen component's own document before writing anything: `https://ui.udixio.fr/components/<slug>.<framework>.md`.
4. Resolve its exact installed API from the shipped TSDoc as `consume-component` describes — the catalog tells you *which* component, the typing tells you *how* to use it.

Never migrate from memory of another library's API, and never invent a Udixio component that isn't in the catalog.

## When there is no equivalent

Say so and leave the original in place. A partial migration that keeps a few foreign components is a correct outcome; forcing a mismatched Udixio component onto a role it wasn't designed for is not. The same applies when the closest match is `beta` and the surrounding code is production-critical — surface the tradeoff instead of deciding silently.

## Preserve behavior

Map deliberately, not mechanically:

- **State** — the source's controlled/uncontrolled model onto Udixio's (`value`/`onValueChange`/`defaultValue`, or the Angular `[(value)]` equivalent). These rarely line up one to one.
- **Events** — a renamed callback is not an optional detail; find the real one in the typing.
- **Accessibility** — carry over every label, `aria-*` attribute and keyboard behavior. Check the target's `@a11y` tag: Udixio components often require an accessible name the source library supplied implicitly.
- **Form integration** — validation, submission and dirty-state wiring must keep working.
- **Layout** — Udixio components bring their own spacing and sizing; delete the source's compensating CSS rather than layering the two.

## Move styling onto theme tokens

Replace hardcoded colors, font sizes and radii with theme tokens (`bg-primary`, `text-on-surface`, the type scale) instead of porting the literals across. Where the source palette doesn't map cleanly, see `https://ui.udixio.fr/theme/introduction.md` for sub-themes and custom palettes rather than reintroducing hex values.

## Apply framework conventions

Load [react-conventions.md](../../references/react-conventions.md) or
[angular-conventions.md](../../references/angular-conventions.md) before writing the converted code.

## Verify each step

After each converted unit: the project builds, its tests pass, and the migrated markup still satisfies the accessibility it had before. Report what changed, what was intentionally left alone, and anything whose behavior you could not preserve exactly.
