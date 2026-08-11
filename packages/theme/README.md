# @udixio/theme

Generates a full Material Design 3 colour scheme from a single source colour.

Give it one colour; it derives the tonal palettes, resolves every semantic token
— `primary`, `surface`, `onSurfaceVariant`, and the fifty-odd others — against
the current dark mode and contrast level, and hands the result to plugins that
emit CSS, Tailwind theme variables, or whatever else you write.

It reimplements [material-color-utilities](https://github.com/material-foundation/material-color-utilities)
rather than wrapping it, which buys control over every step of the resolution.
The cost is a guarantee, so the package holds one: a conformance suite compares
26 520 generated values against upstream, hex for hex, across four variants,
thirteen seeds, both modes and five contrast levels.

## Using an AI coding agent?

See [ui.udixio.fr/agents](https://ui.udixio.fr/agents) for a Claude Code/Codex plugin that resolves
this package's exact installed API and usage patterns — or a plain-markdown doc mirror any agent
can fetch with zero setup.

## Install

```bash
npm install @udixio/theme
```

Most projects want a framework package instead, which pulls this one in:
[`@udixio/ui-react`](https://www.npmjs.com/package/@udixio/ui-react),
[`@udixio/ui-angular`](https://www.npmjs.com/package/@udixio/ui-angular), or
[`@udixio/tailwind`](https://www.npmjs.com/package/@udixio/tailwind) on its own.

## Use

```ts
import { loader, FontPlugin } from '@udixio/theme';
import { TailwindPlugin } from '@udixio/tailwind';

const api = await loader({
  sourceColor: '#6750A4',
  plugins: [new FontPlugin({}), new TailwindPlugin({ outFile: 'src/theme.css' })],
});

api.colors.get('primary').hex;   // "#655789"
api.colors.get('primary').tone;  // 40.3

api.context.darkMode = true;
api.colors.get('primary').hex;   // recomputed
```

Every token is a `Color`, read as a value — each access resolves against the
context as it stands.

### From a config file

```ts
// theme.config.ts
import { defineConfig } from '@udixio/theme';

export default defineConfig({
  sourceColor: '#6750A4',
  contrastLevel: 0,
  plugins: [/* … */],
});
```

```bash
npx udixio-theme build           # once
npx udixio-theme build --watch   # rebuild on change
npx udixio-theme build -c ./path/to/theme.config
```

## What it exposes

| | |
|---|---|
| `Color` | The single colour type. `Color.from({ hue, chroma, tone })`, `.fromHex()`, the `.hue`/`.chroma`/`.tone`/`.hex`/`.rgb`/`.argb` getters, and derivations `.withHue()`, `.rotate()`, `.scaleChroma()`, `.contrastWith()`. |
| `Palette` | A hue and a chroma, spanning every tone. `palette.getColor(40)`. |
| `variant()` | How palettes are derived from the source colour. Five built-ins: `TonalSpot`, `Neutral`, `Vibrant`, `Expressive`, `Udixio`. |
| Tone adjusters | `contrastAgainst`, `onColor`, `avoidBackgroundGap`, `applyToneDelta`, `arbitrateBackgrounds` — how a token resolves its tone. |
| `PluginAbstract` | The plugin base class. `FontPlugin` ships here; `TailwindPlugin` lives in `@udixio/tailwind`. |
| `serializeThemeContext` | A snapshot of the context and palettes, for rebuilding a theme elsewhere — a worker, an SSR pass. |

Nothing is kept internal: the helpers the built-in variants use are the same
ones you get, so a variant of your own is not a second-class citizen.

## Customising

A token declares its default tone and the adjusters that turn it into the final
one. There is no hidden pipeline — what you list is what runs:

```ts
import { contrastAgainst, avoidBackgroundGap, onColor } from '@udixio/theme';

colors: ({ palettes }) => ({
  highlight: {
    palette: () => palettes.get('tertiary'),
    tone: () => 70,
    adjustTone: [contrastAgainst('surface', 3), avoidBackgroundGap()],
  },
  onHighlight: {
    palette: () => palettes.get('tertiary'),
    adjustTone: onColor('highlight', 4.5),
  },
}),
```

Full reference: [Colors API](https://ui.udixio.fr/theme/advanced/colors),
[Variants API](https://ui.udixio.fr/theme/advanced/variants),
[Palettes API](https://ui.udixio.fr/theme/advanced/palettes).

## Isolation

Each `loader()` call builds an independent theme — its own context, colours and
palettes. Several can live in one process: an SSR render per request, a worker
rebuilding from a snapshot, a test suite. To change a theme rather than build a
new one, hold its `api` and update the context:

```ts
api.context.update({ isDark: true, contrastLevel: 0.5 });
```

## Development

```bash
npx nx build theme    # build
npx nx test theme     # vitest
```

The suites answer different questions:

- **`spec-2025-conformance`** — do the standard variants equal upstream, hex for
  hex. This is the contract.
- **`contrast-invariants`** — properties that hold by construction, so they
  survive a fixture regeneration and cover `udixio`, which has no upstream
  counterpart.
- **`udixio-output`** — a drift guard for that variant. A failure is not
  automatically a bug: it means the colours changed, say whether you meant it.
- **`tone-adjusters`, `variant-isolation`** — unit level.

## Licence

The vendored colour science under `src/color/hct-math.ts` and
`src/material-color-utilities/` is Apache-2.0, © Google LLC.
