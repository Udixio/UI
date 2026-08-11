# @udixio/ui-react

Material Design 3 components for React, on top of
[`@udixio/theme`](https://www.npmjs.com/package/@udixio/theme).

More than thirty components — buttons, text fields, tabs, menus, navigation rails,
sliders, snackbars, date pickers — that read their colours from the generated
theme rather than carrying their own, so the whole set follows your source
colour, dark mode and contrast level.

## Using an AI coding agent?

See [ui.udixio.fr/agents](https://ui.udixio.fr/agents) for a Claude Code/Codex plugin that resolves
this package's exact installed API and usage patterns — or a plain-markdown doc mirror any agent
can fetch with zero setup.

## Install

```bash
npm install @udixio/ui-react @udixio/theme @udixio/tailwind
npm install -D tailwindcss @tailwindcss/vite
```

## Set up

**1 — Describe the theme.**

```ts
// theme.config.ts
import { defineConfig } from '@udixio/tailwind';

export default defineConfig({
  sourceColor: '#6750A4',
  outFile: 'src/udixio.generated.css',
});
```

**2 — Run the generator** from your bundler:

```ts
// vite.config.ts
import tailwindcss from '@tailwindcss/vite';
import { vitePlugin } from '@udixio/theme';

export default defineConfig({ plugins: [tailwindcss(), vitePlugin()] });
```

**3 — Import the stylesheet**, and point Tailwind at the component sources so
it emits the classes they use:

```css
@import 'tailwindcss';
@import './udixio.generated.css';

@source '../node_modules/@udixio/ui-react';
@source '../node_modules/@udixio/core';
```

Both `@source` lines matter: the components are split between this package and
the framework-agnostic `@udixio/core`, and Tailwind only emits what it finds in
scanned files.

**4 — Render.**

```tsx
import { Button } from '@udixio/ui-react';

<Button variant="filled" label="Send" />;
```

Full walkthrough: [ui.udixio.fr/get-started/react](https://ui.udixio.fr/get-started/react).

## Changing the theme at runtime

`ThemeProvider` rebuilds the scheme in a worker and injects it, so switching
source colour or dark mode does not block the main thread:

```tsx
import { ThemeProvider } from '@udixio/ui-react';

<ThemeProvider config={config} onLoad={(api) => console.log(api.colors.get('primary').hex)}>
  <App />
</ThemeProvider>;
```

| Prop | Default | |
|---|---|---|
| `config` | — | The same shape `defineConfig` takes. |
| `initialCss` | — | Pre-generated CSS from the server; renders immediately instead of waiting for the worker. |
| `loadTheme` | `false` | Runs the plugins on the first pass. |
| `throttleDelay` | `100` | Milliseconds between rebuilds while a value is being dragged. |
| `onLoad` | — | Receives the `API` after each build. |

### Server-side

`generateThemeCss(config)` returns the stylesheet as a string, with no
filesystem access and no Tailwind directives — pass it to `ThemeProvider` as
`initialCss` to avoid a flash of the build-time theme:

```ts
import { generateThemeCss } from '@udixio/ui-react';

const css = await generateThemeCss(config);
```

Each call builds an isolated theme, so concurrent renders do not share state.

## What it exports

| | |
|---|---|
| Components | 36, from `Button` to `DatePicker`. |
| `ThemeProvider`, `generateThemeCss` | Runtime theming. |
| Effects | `State`, ripple, `AnimateOnScroll`, smooth scroll, scroll-driven animation, scroll locking. |
| `Icon` | The icon component, paired with the `@udixio/icons-*` packages. |
| `useControllableState`, `createUseStyle` | The hooks the components use, for building your own on the same footing. |

Everything from `@udixio/core` is re-exported, so a component's props and style
contract are reachable from here.

## Development

```bash
npx nx build ui-react
npx nx test ui-react
```

## Documentation

[ui.udixio.fr](https://ui.udixio.fr) — every component has a page with its API,
accessibility notes and known limitations.
