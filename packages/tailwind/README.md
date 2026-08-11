# @udixio/tailwind

Turns an [`@udixio/theme`](https://www.npmjs.com/package/@udixio/theme) colour
scheme into a Tailwind stylesheet.

It writes the semantic tokens out as `--color-*` custom properties — light,
dark, and any sub-themes — so `bg-primary`, `text-on-surface-variant` and the
rest become ordinary Tailwind utilities. It also ships a small Tailwind plugin
of its own for state layers and motion.

## Using an AI coding agent?

See [ui.udixio.fr/agents](https://ui.udixio.fr/agents) for a Claude Code/Codex plugin that resolves
this package's exact installed API and usage patterns — or a plain-markdown doc mirror any agent
can fetch with zero setup.

## Install

```bash
npm install @udixio/tailwind @udixio/theme
npm install -D tailwindcss
```

## Set up

**1 — Describe the theme.** `defineConfig` takes the theme's options and the
plugin's, flat, and wires `TailwindPlugin` and `FontPlugin` for you:

```ts
// theme.config.ts
import { defineConfig } from '@udixio/tailwind';

export default defineConfig({
  sourceColor: '#6750A4',
  outFile: 'src/udixio.generated.css',
});
```

`sourceColor` is the only required option. The variant defaults to `Udixio`.

**2 — Run the generator.** `@udixio/theme` ships bundler plugins that load the
config and regenerate the stylesheet, watching it in dev:

```ts
// vite.config.ts
import tailwindcss from '@tailwindcss/vite';
import { vitePlugin } from '@udixio/theme';

export default defineConfig({ plugins: [tailwindcss(), vitePlugin()] });
```

`webpackPlugin`, `esbuildPlugin` and `rollupPlugin` have the same signature. If
your toolchain takes none of them, `npx udixio-theme build --watch` does the
same from a script.

**3 — Import what it wrote.**

```css
@import 'tailwindcss';
@import './udixio.generated.css';
```

## Options

Everything below sits at the top level of `defineConfig`, alongside the theme's
own options.

| Option | Default | |
|---|---|---|
| `outFile` | — | Where to write the stylesheet. Also added to a sibling `.gitignore`, being a build artifact. |
| `darkMode` | `'class'` | `'class'` toggles on a selector, `'media'` follows `prefers-color-scheme`. |
| `darkSelector` | `'.dark'` | The selector that turns dark mode on. |
| `dynamicSelector` | `'.dynamic'` | Where the live variables land. Elements outside it keep the build-time values. |
| `subThemes` | `{}` | Named variants, applied with `.theme-{name}`. |
| `resetColors` | `true` | Emits `--color-*: initial`, dropping Tailwind's own palette. Set `false` to keep `red-500` and friends alongside. |
| `responsiveBreakPoints` | — | Scales the type ramp per breakpoint. |
| `ssr` | `false` | Pure CSS variables, no `@theme`/`@plugin` directives, no filesystem. Set for you by `generateThemeCss()`. |

### Sub-themes

```ts
import { Color } from '@udixio/theme';

const sourceColor = Color.from({ hue: 280, chroma: 45, tone: 75 });

subThemes: {
  green: sourceColor.withHue(155),
  cyan: 205,
  forest: '#2E7D32',
}
```

```html
<section class="theme-green">
  <button class="bg-primary text-on-primary">Green button</button>
</section>
```

Only the **hue** of each value is read — chroma and tone always come from
`sourceColor`, so every sub-theme stays in step with the rest of the scheme.
A `Color`, a bare hue, or a hex all work.

## The Tailwind plugin

Separate from the generator, and added in CSS:

```css
@plugin "@udixio/tailwind";
```

The generated stylesheet already includes this line. It provides the state
layer and motion utilities the component libraries rely on.

## Node and browser

Two entry points. The node build writes `outFile` to disk; the browser build
does everything except touch the filesystem, which is what SSR and the live
theme editor use. Your bundler picks the right one.

## Development

```bash
npx nx build tailwind
npx nx test tailwind
```

`characterization.spec.ts` holds a golden copy of the resolved CSS for a
reference config. A failure means the output moved — say whether you meant it,
then `vitest -u`.

## Documentation

[ui.udixio.fr/theme/advanced/plugins/tailwind](https://ui.udixio.fr/theme/advanced/plugins/tailwind)
