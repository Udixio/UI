# React conventions for @udixio/ui-react

## Setup

- Requires `react` and `react-dom` `>19`.
- Install `@udixio/theme` and `@udixio/tailwind` alongside `@udixio/ui-react` (`npm install @udixio/ui-react @udixio/theme @udixio/tailwind`) — they power the color/typography engine. `defineConfig` (re-exported from `@udixio/ui-react`) wires `TailwindPlugin`/`FontPlugin` for you automatically — you only need to pass `sourceColor` and an `outFile`.
- Mount `ThemeProvider` (from `@udixio/ui-react`) once near the app root, passing it the `theme.config.ts` output. It recomputes and injects the *dynamic* layer (live color/dark-mode changes) at runtime — without it, the static generated CSS still applies, but nothing updates live. See `https://ui.udixio.fr/get-started/react.md` for the full build-plugin wiring.

## Props

- `className` accepts either a plain string or a `ClassNameComponent<XInterface>` map for state-aware classes (hover/focus/disabled/pressed/etc.) — the `*Interface` type is exported alongside the component; check it before assuming plain-string is the only option.
- Controlled state follows `value`/`onValueChange` (or `checked`/`onCheckedChange`, `pressed`/`onPressedChange`, etc., depending on the component) plus `default*` for uncontrolled initialization. Pick one mode per instance — don't pass a controlled prop and rely on its `default*` counterpart to reset it later.
- Some components discriminate their prop type by a required field rather than exposing every prop as optional (e.g. an action variant vs. a link variant pivoting on whether `href` is present). Read the exported prop union type, not just one branch of it, before deciding which props are valid together.

## Refs and DOM

- Ref types are typed per variant of a discriminated prop union (e.g. `Ref<HTMLButtonElement>` for the action branch vs. `Ref<HTMLAnchorElement>` for the link branch) — match the ref type to the branch actually in use.
- Only forward DOM attributes that the component's prop type explicitly allows; it already narrows which native HTML attributes are safe to pass through.
