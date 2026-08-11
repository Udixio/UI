# @udixio/ui-angular

Material Design 3 components for Angular, on top of
[`@udixio/theme`](https://www.npmjs.com/package/@udixio/theme).

Standalone components — buttons, text fields, tabs, menus, navigation rails,
carousels, date pickers — that read their colours from the generated theme
rather than carrying their own, so the whole set follows your source colour,
dark mode and contrast level.

> **Early days.** This package is at `0.0.1` and its API is still moving. It
> mirrors [`@udixio/ui-react`](https://www.npmjs.com/package/@udixio/ui-react),
> which is the mature one; components arrive here as they reach parity.

## Using an AI coding agent?

See [ui.udixio.fr/agents](https://ui.udixio.fr/agents) for a Claude Code/Codex plugin that resolves
this package's exact installed API and usage patterns — or a plain-markdown doc mirror any agent
can fetch with zero setup.

## Install

```bash
npm install @udixio/ui-angular @udixio/theme @udixio/tailwind
npm install -D tailwindcss @tailwindcss/postcss postcss
```

Theming is framework-agnostic — the same generator the React package uses, with
no Angular-specific runtime.

## Set up

**1 — Enable Tailwind through PostCSS**, since Angular compiles CSS that way.
A `.postcssrc.json` at the project root:

```json
{ "plugins": { "@tailwindcss/postcss": {} } }
```

**2 — Describe the theme.**

```ts
// theme.config.ts
import { defineConfig } from '@udixio/tailwind';

export default defineConfig({
  sourceColor: '#6750A4',
  outFile: 'src/udixio.generated.css',
});
```

**3 — Regenerate it from npm scripts.** Angular's application builder does not
take bundler plugins, so drive the CLI instead:

```json
{
  "scripts": {
    "theme": "udixio-theme build",
    "theme:watch": "udixio-theme build --watch",
    "start": "concurrently \"npm:theme:watch\" \"ng serve\"",
    "build": "npm run theme && ng build"
  }
}
```

`concurrently` is only there to run the watcher next to `ng serve` — a second
terminal does just as well.

**4 — Import the stylesheet**, and point Tailwind at the component sources:

```css
@import 'tailwindcss';
@import './udixio.generated.css';

@source '../node_modules/@udixio/ui-angular';
@source '../node_modules/@udixio/core';
```

Both `@source` lines matter: the components are split between this package and
the framework-agnostic `@udixio/core`, and Tailwind only emits what it finds in
scanned files.

**5 — Use a component.** They are standalone, so import the one you need:

```ts
import { Button } from '@udixio/ui-angular';

@Component({
  imports: [Button],
  template: `<lib-button label="Send" variant="filled" />`,
})
export class AppComponent {}
```

Full walkthrough: [ui.udixio.fr/get-started/angular](https://ui.udixio.fr/get-started/angular).

## What it exports

Thirty-odd standalone components, plus `createControllableState` — the helper
behind every component that accepts both a bound value and an uncontrolled one.

Shared types and style contracts live in `@udixio/core`, a peer dependency, and
are imported from there rather than re-exported here.

## Development

```bash
npx nx build ui-angular
npx nx test ui-angular
```

## Documentation

[ui.udixio.fr](https://ui.udixio.fr) — component pages carry both the React and
Angular API, with the differences called out where they exist.
