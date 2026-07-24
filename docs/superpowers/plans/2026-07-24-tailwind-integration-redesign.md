# @udixio/tailwind Integration Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the fragility of `@udixio/tailwind` (filesystem scanning, mutation of the user's source CSS, committed generated file, and the `@plugin { colorKeys… }` string serialize/reparse round-trip) by generating a single static CSS artifact the user imports explicitly, keeping only `animation` as a config-less Tailwind v4 plugin.

**Architecture:** The theme's JS side emits the full theme CSS (colors + font + state + shadow, all as `@theme`/`@utility` blocks) plus a `@plugin "@udixio/tailwind";` line for animation. A build plugin writes this to a deterministic, gitignored `udixio.generated.css` (no FS scan, no source mutation). The user adds one `@import`. `font`/`state`/`shadow` become pure CSS-string helpers; `animation` stays a Tailwind JS plugin because it needs `matchUtilities` with arbitrary values.

**Tech Stack:** TypeScript, Tailwind CSS v4.1.14, Vitest (node env), `@tailwindcss/node` (programmatic compile for tests), pnpm workspace + Nx, `@udixio/theme` loader/plugin system.

## Global Constraints

- Tailwind CSS floor: `^4.1.12` (installed 4.1.14). Copied from `packages/tailwind/package.json`.
- Package manager: pnpm workspaces; run tests via `npx nx run @udixio/tailwind:vitest:test` (node env, config in `packages/tailwind/vite.config.ts`).
- Do NOT break current consumers: `apps/doc` (Astro) and `@udixio/ui-react` must build green.
- Behavior preservation: the resolved CSS (utilities `.text-*`, `.state-*`, `.shadow-*`, and `@theme --color-*`) for a fixed reference config must be equivalent before and after (verified by compile-based golden tests).
- **Reference config (CORRECTED in Task 2 — do NOT use `ssr: true`):** `ssr: true` makes the browser plugin emit **colors only** (no `@plugin`, no font/state/shadow), which would make the golden a near-empty safety net. Tests MUST use the **node** `TailwindPlugin` (from `../node/tailwind.plugin`) with an explicit sandboxed `styleFilePath` under `packages/tailwind/.tmp-test/`. The explicit `styleFilePath` is what prevents `_doNodeLoad()` from running its `findTailwindCssFile()` scan-and-overwrite on a real project CSS file. The canonical implementation is `packages/tailwind/src/emit/test-utils.ts` — read it rather than re-deriving. Its exported signatures (`referenceConfig()`, `generateReferenceCss(): Promise<string>`, `buildResolvedCss(generatedCss, candidates): Promise<string>`, `GOLDEN_CANDIDATES`) are stable and reused by Tasks 3–7.
- **`@plugin` resolves through `packages/tailwind/dist/`, not live `src/`** (`@tailwindcss/node`'s `compile()` uses standard Node export conditions, not Vite's `development` condition). Any task that changes `src/main.ts` or `src/plugins-tailwind/*` AND relies on a compile-based test MUST rebuild first: `npx nx run @udixio/tailwind:build`. Otherwise the test silently exercises stale `dist/`. This applies to Task 6 (cutover) and Task 7 (equivalence + builds) in particular.
- **Task 1 spike results (VALIDATED — these parameterize later tasks, no contingency branches remain):**
  - `NESTED_PLUGIN_OK = true` → the generated CSS emits `@plugin "@udixio/tailwind";` itself (Task 6 keeps that line; Task 7 needs no explicit `@plugin` in user CSS).
  - `UTILITY_IN_IMPORT_OK = true` → `@utility` in an imported file works and supports variants.
  - `THEME_IN_MEDIA_OK = true` → Task 4's font helper MUST use `@media (min-width: theme(--breakpoint-<name>))`. Do NOT use the hardcoded rem table.
- **Test harness constraints (discovered in Task 1 — both already applied):**
  - `@tailwindcss/node` is a `devDependency` of `packages/tailwind` (added in Task 1). Import `compile` from it.
  - `compile()` resolves `@import "tailwindcss"` relative to its `base`. A `base` in `os.tmpdir()` FAILS with `Can't resolve 'tailwindcss'`. Every test that compiles CSS MUST create its temp dir **inside the repo** (e.g. under `packages/tailwind/.tmp-test/`) and clean it up afterwards.
- Commit message trailer for every commit: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- Branch: work continues on `feat/angular` (already checked out).

---

## Task 1: Spike — de-risk the three load-bearing Tailwind v4 assumptions

Throwaway experiment. Produces a committed decision note. No production code changes.

Three assumptions the design depends on, all verified with one compile harness:
1. **Nested `@plugin`**: Tailwind v4 processes `@plugin "pkg";` when it appears inside an `@import`ed CSS file (not only in the entry CSS).
2. **`@utility` in imported CSS**: a `@utility foo { … }` defined in an `@import`ed file produces a working utility that supports variants (e.g. `hover:foo`).
3. **Responsive font media query**: a nested `@media (min-width: theme(--breakpoint-lg)) { … }` inside a `@utility` resolves the breakpoint value (today `plugins-tailwind/font.ts` reads `theme('screens.lg')`; static CSS loses that access).

**Files:**
- Create (throwaway): `packages/tailwind/src/__spike__/nested-plugin.spike.spec.ts`

**Interfaces:**
- Consumes: `compile` from `@tailwindcss/node` — `compile(css: string, opts: { base: string; onDependency: (p: string) => void }): Promise<{ build(candidates: string[]): string }>`.
- Produces: a documented decision recorded in the design/plan (see Step 5). No exported code.

- [ ] **Step 1: Write the spike probe**

Create `packages/tailwind/src/__spike__/nested-plugin.spike.spec.ts`:

```ts
import { describe, it } from 'vitest';
import { compile } from '@tailwindcss/node';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

async function build(entryCss: string, base: string, candidates: string[]) {
  const { build } = await compile(entryCss, { base, onDependency: () => {} });
  return build(candidates);
}

describe('SPIKE: Tailwind v4 assumptions', () => {
  it('probe 1: nested @plugin + probe 2: @utility in imported file + probe 3: theme() in @media', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'udixio-spike-'));

    // An imported file that (a) registers a plugin and (b) defines a @utility
    // with a nested responsive @media referencing a breakpoint token.
    const imported = `
@utility probe-box {
  color: red;
  @media (min-width: theme(--breakpoint-lg)) { color: blue; }
}
`;
    writeFileSync(join(dir, 'imported.css'), imported);

    const entry = `@import "tailwindcss";\n@import "./imported.css";`;
    const out = await build(entry, dir, ['probe-box', 'hover:probe-box']);

    // Print so the runner shows what resolved. Read this output to decide.
    // eslint-disable-next-line no-console
    console.log('=== SPIKE OUTPUT START ===\n' + out + '\n=== SPIKE OUTPUT END ===');
  });
});
```

- [ ] **Step 2: Run the spike and read the output**

Run: `npx vitest run --root packages/tailwind src/__spike__/nested-plugin.spike.spec.ts 2>&1 | sed -n '/SPIKE OUTPUT START/,/SPIKE OUTPUT END/p'`

Inspect the printed CSS for:
- **Probe 2 (utility)**: a `.probe-box { color: red }` rule is present → `@utility` in imported CSS works.
- **Probe 2 (variant)**: a `.hover\:probe-box:hover { color: red }` rule is present → variants work on generated utilities.
- **Probe 3 (media)**: the nested `@media (min-width: 64rem)` (or `theme(--breakpoint-lg)` resolved) block is present → `theme()` in `@media` works for responsive font.

- [ ] **Step 3: Probe nested `@plugin` separately**

Because `@plugin` needs a resolvable JS module, add a second `it` block that writes a tiny local plugin file and imports it nested. Append to the same spike file:

```ts
  it('probe: nested @plugin resolves', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'udixio-spike-plg-'));
    writeFileSync(
      join(dir, 'plg.js'),
      `module.exports = ({ addUtilities }) => addUtilities({ '.plg-mark': { outline: '1px solid green' } });\nmodule.exports.__esModule = false;`,
    );
    writeFileSync(join(dir, 'imported.css'), `@plugin "./plg.js";`);
    const entry = `@import "tailwindcss";\n@import "./imported.css";`;
    const { build } = await compile(entry, { base: dir, onDependency: () => {} });
    // eslint-disable-next-line no-console
    console.log('=== PLUGIN PROBE ===\n' + build(['plg-mark']) + '\n=== END ===');
  });
```

Run: `npx vitest run --root packages/tailwind src/__spike__/nested-plugin.spike.spec.ts 2>&1 | sed -n '/PLUGIN PROBE/,/END/p'`

If `.plg-mark { outline: 1px solid green }` appears → nested `@plugin` works.

- [ ] **Step 4: Record decisions and delete the spike**

Update the design doc `docs/superpowers/specs/2026-07-24-tailwind-integration-redesign-design.md`, section "Risque principal", replacing it with the observed results. Record three booleans and the chosen branch:

- `NESTED_PLUGIN_OK` — if true, the generated CSS emits `@plugin "@udixio/tailwind";` itself (one user import). If false, the user setup requires an explicit `@plugin "@udixio/tailwind";` line (documented in Task 7); the generated file omits it. [Moot: NESTED_PLUGIN_OK validated true.]
- `UTILITY_IN_IMPORT_OK` — expected true; if false, escalate (blocks the static-CSS approach) and stop.
- `THEME_IN_MEDIA_OK` — if true, font helper (Task 4) emits `@media (min-width: theme(--breakpoint-<name>))`. If false, font helper emits resolved rem widths for standard Tailwind breakpoints (`sm 40rem, md 48rem, lg 64rem, xl 80rem, 2xl 96rem`) and documents that custom screen widths are not tracked.

Then delete the spike: `git rm -f packages/tailwind/src/__spike__/nested-plugin.spike.spec.ts` (and remove the now-empty `__spike__` dir).

- [ ] **Step 5: Commit the decision**

```bash
git add docs/superpowers/specs/2026-07-24-tailwind-integration-redesign-design.md
git commit -m "docs(tailwind): record spike results for CSS generation approach

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Characterization golden of the CURRENT resolved CSS

Capture the current behavior as a golden before any refactor, so later tasks prove equivalence.

**Files:**
- Create: `packages/tailwind/src/emit/characterization.spec.ts`
- Create: `packages/tailwind/src/emit/test-utils.ts`

**Interfaces:**
- Consumes: `loader` and `TailwindPlugin` from the current packages; `compile` from `@tailwindcss/node`.
- Produces: `buildResolvedCss(generatedCss: string, candidates: string[]): Promise<string>` and `generateReferenceCss(): Promise<string>` in `test-utils.ts`, reused by Task 6 and Task 7.

- [ ] **Step 1: Write the shared test util**

Create `packages/tailwind/src/emit/test-utils.ts`:

```ts
import { compile } from '@tailwindcss/node';
import { mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig, FontPlugin, loader } from '@udixio/theme';
import { TailwindPlugin } from '../browser/tailwind.plugin';

/** The single reference config used by all emit tests. */
export function referenceConfig() {
  return defineConfig({
    sourceColor: '#6750A4',
    plugins: [new FontPlugin({}), new TailwindPlugin({ ssr: true })],
  });
}

/** Runs the theme and returns the TailwindPlugin's generated CSS string. */
export async function generateReferenceCss(): Promise<string> {
  const config = referenceConfig();
  const api = await loader(config, false);
  await api.load();
  return api.plugins.getPlugin(TailwindPlugin).getInstance().outputCss;
}

/** Compiles `@import "tailwindcss"` + generated CSS, returns resolved CSS for candidates. */
export async function buildResolvedCss(
  generatedCss: string,
  candidates: string[],
): Promise<string> {
  // The temp dir MUST live inside the repo: compile() resolves
  // `@import "tailwindcss"` from `base`, and an os.tmpdir() base fails with
  // "Can't resolve 'tailwindcss'".
  const { writeFileSync, mkdirSync } = await import('node:fs');
  const root = join(__dirname, '..', '..', '.tmp-test');
  mkdirSync(root, { recursive: true });
  const dir = mkdtempSync(join(root, 'emit-'));
  writeFileSync(join(dir, 'generated.css'), generatedCss);
  const entry = `@import "tailwindcss";\n@import "./generated.css";`;
  const { build } = await compile(entry, { base: dir, onDependency: () => {} });
  return build(candidates);
}

/** Candidate utility classes exercised by the golden tests. */
export const GOLDEN_CANDIDATES = [
  'text-display-large',
  'text-body-medium',
  'lg:text-display-large',
  'state-primary',
  'state-layer',
  'shadow-1',
  'hover:shadow-2',
  'bg-primary',
  'text-on-surface',
];
```

- [ ] **Step 2: Write the characterization test (auto-snapshot)**

Create `packages/tailwind/src/emit/characterization.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildResolvedCss, generateReferenceCss, GOLDEN_CANDIDATES } from './test-utils';

describe('current @udixio/tailwind resolved CSS (characterization)', () => {
  it('golden resolved utilities + color vars for the reference config', async () => {
    const generated = await generateReferenceCss();
    const resolved = await buildResolvedCss(generated, GOLDEN_CANDIDATES);
    expect(resolved).toMatchSnapshot();
  });
});
```

- [ ] **Step 3: Run to capture the golden snapshot**

Run: `npx vitest run --root packages/tailwind src/emit/characterization.spec.ts`
Expected: PASS, and a new file `packages/tailwind/src/emit/__snapshots__/characterization.spec.ts.snap` is created containing the resolved CSS.

- [ ] **Step 4: Sanity-check the snapshot**

Open `packages/tailwind/src/emit/__snapshots__/characterization.spec.ts.snap` and confirm it contains `.text-display-large`, `.state-primary`, `.shadow-1`, and `--color-primary`. If any section is missing, the reference config or candidate list is wrong — fix `test-utils.ts` and re-run before proceeding.

- [ ] **Step 5: Commit**

```bash
git add packages/tailwind/src/emit/test-utils.ts packages/tailwind/src/emit/characterization.spec.ts packages/tailwind/src/emit/__snapshots__/
git commit -m "test(tailwind): characterize current resolved CSS as golden baseline

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: `shadow` → pure CSS-string helper

Convert `shadow.ts` (a Tailwind plugin, 6 static box-shadow utilities) into a function returning `@utility` CSS. No config, no runtime dependency.

**Files:**
- Create: `packages/tailwind/src/emit/shadow.css.ts`
- Test: `packages/tailwind/src/emit/shadow.css.spec.ts`

**Interfaces:**
- Produces: `shadowCss(): string` — returns `@utility` blocks for `shadow`, `shadow-1`..`shadow-4`, `box-shadow-5`.

- [ ] **Step 1: Write the failing test**

Create `packages/tailwind/src/emit/shadow.css.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildResolvedCss } from './test-utils';
import { shadowCss } from './shadow.css';

describe('shadowCss', () => {
  it('emits shadow utilities that resolve and support variants', async () => {
    const resolved = await buildResolvedCss(shadowCss(), ['shadow-1', 'hover:shadow-2']);
    expect(resolved).toContain('box-shadow');
    expect(resolved).toMatch(/\.shadow-1\s*\{/);
    expect(resolved).toMatch(/\.hover\\:shadow-2:hover\s*\{/);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run --root packages/tailwind src/emit/shadow.css.spec.ts`
Expected: FAIL with "Cannot find module './shadow.css'".

- [ ] **Step 3: Write the helper**

Create `packages/tailwind/src/emit/shadow.css.ts`:

```ts
const SHADOWS: Record<string, string> = {
  shadow: '0 4px 10px #00000008, 0 0 2px #0000000f, 0 2px 6px #0000001f',
  'shadow-1':
    '0px 1px 3px 1px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.30)',
  'shadow-2':
    '0px 2px 6px 2px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.30)',
  'shadow-3':
    '0px 1px 3px 0px rgba(0, 0, 0, 0.30), 0px 4px 8px 3px rgba(0, 0, 0, 0.15)',
  'shadow-4':
    '0px 2px 3px 0px rgba(0, 0, 0, 0.30), 0px 6px 10px 4px rgba(0, 0, 0, 0.15)',
  'box-shadow-5':
    '0px 4px 4px 0px rgba(0, 0, 0, 0.30), 0px 8px 12px 6px rgba(0, 0, 0, 0.15)',
};

export function shadowCss(): string {
  return Object.entries(SHADOWS)
    .map(([name, value]) => `@utility ${name} {\n  box-shadow: ${value};\n}`)
    .join('\n');
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run --root packages/tailwind src/emit/shadow.css.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/tailwind/src/emit/shadow.css.ts packages/tailwind/src/emit/shadow.css.spec.ts
git commit -m "feat(tailwind): shadow utilities as pure CSS helper

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: `font` → pure CSS-string helper

Convert the `.text-{role}-{size}` generation from `plugins-tailwind/font.ts` into a helper returning `@utility` CSS, including responsive scaling. Use the `THEME_IN_MEDIA_OK` decision from Task 1 to pick the media-query form.

**Files:**
- Create: `packages/tailwind/src/emit/font.css.ts`
- Test: `packages/tailwind/src/emit/font.css.spec.ts`

**Interfaces:**
- Consumes: `FontRole`, `FontSize`, `FontStyle` types from `@udixio/theme`.
- Produces: `fontCss(args: { fontStyles: Record<FontRole, Record<FontSize, FontStyle>>; responsiveBreakPoints: Record<string, number>; fontFamily: { expressive: string[]; neutral: string[] } }): string`.

- [ ] **Step 1: Write the failing test**

Create `packages/tailwind/src/emit/font.css.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildResolvedCss } from './test-utils';
import { fontCss } from './font.css';

const args = {
  fontStyles: {
    display: {
      large: {
        fontWeight: 400,
        fontSize: 3.5625,
        lineHeight: 4,
        letterSpacing: -0.015625,
        fontFamily: 'expressive',
      },
    },
  } as any,
  responsiveBreakPoints: { lg: 1.125 },
  fontFamily: { expressive: ['Roboto', 'sans-serif'], neutral: ['Roboto', 'sans-serif'] },
};

describe('fontCss', () => {
  it('emits .text-display-large with size, family and a responsive media rule', async () => {
    const css = fontCss(args);
    const resolved = await buildResolvedCss(css, ['text-display-large', 'lg:text-display-large']);
    expect(resolved).toMatch(/\.text-display-large\s*\{/);
    expect(resolved).toContain('font-size: 3.5625rem');
    expect(resolved).toContain('"Roboto", "sans-serif"');
    // responsive: fontSize * 1.125 = 4.008046875rem at the lg breakpoint
    expect(resolved).toContain('4.008046875rem');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run --root packages/tailwind src/emit/font.css.spec.ts`
Expected: FAIL with "Cannot find module './font.css'".

- [ ] **Step 3: Write the helper**

Create `packages/tailwind/src/emit/font.css.ts`. Use `theme(--breakpoint-<name>)` if `THEME_IN_MEDIA_OK` is true (Task 1); otherwise use the resolved-rem table.

```ts
import type { FontRole, FontSize, FontStyle } from '@udixio/theme';

// Standard Tailwind v4 breakpoint widths, used only as the fallback when
// theme() is not usable inside @media (see Task 1 THEME_IN_MEDIA_OK).
const BREAKPOINT_REM: Record<string, string> = {
  sm: '40rem',
  md: '48rem',
  lg: '64rem',
  xl: '80rem',
  '2xl': '96rem',
};

function minWidth(name: string): string {
  // If THEME_IN_MEDIA_OK: return `theme(--breakpoint-${name})`
  return BREAKPOINT_REM[name] ?? '64rem';
}

export interface FontCssArgs {
  fontStyles: Record<FontRole, Record<FontSize, FontStyle>>;
  responsiveBreakPoints: Record<string, number>;
  fontFamily: { expressive: string[]; neutral: string[] };
}

export function fontCss({
  fontStyles,
  responsiveBreakPoints,
  fontFamily,
}: FontCssArgs): string {
  const family = (key: string) =>
    (fontFamily[key as keyof typeof fontFamily] ?? [])
      .map((f) => (f.trim().startsWith('var(') ? f : `"${f}"`))
      .join(', ');

  const blocks: string[] = [];
  for (const [role, sizes] of Object.entries(fontStyles)) {
    for (const [size, style] of Object.entries(sizes as Record<string, FontStyle>)) {
      const decls = [
        `font-size: ${style.fontSize}rem;`,
        `font-weight: ${style.fontWeight};`,
        `line-height: ${style.lineHeight}rem;`,
        style.letterSpacing ? `letter-spacing: ${style.letterSpacing}rem;` : '',
        `font-family: ${family(style.fontFamily as string)};`,
      ].filter(Boolean);

      const media = Object.entries(responsiveBreakPoints)
        .map(
          ([bp, ratio]) =>
            `  @media (min-width: ${minWidth(bp)}) {\n` +
            `    font-size: ${style.fontSize * ratio}rem;\n` +
            `    line-height: ${style.lineHeight * ratio}rem;\n` +
            `  }`,
        )
        .join('\n');

      blocks.push(
        `@utility text-${role}-${size} {\n  ${decls.join('\n  ')}\n${media}\n}`,
      );
    }
  }
  return blocks.join('\n');
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run --root packages/tailwind src/emit/font.css.spec.ts`
Expected: PASS. If the responsive assertion fails because `@media` inside `@utility` is not supported, apply the Task 1 `THEME_IN_MEDIA_OK=false` contingency AND, if `@utility` cannot nest `@media` at all, emit the responsive rule as a sibling `@media (min-width: …) { .text-<role>-<size> { … } }` plain rule instead of nesting; update the test to match the sibling form.

- [ ] **Step 5: Commit**

```bash
git add packages/tailwind/src/emit/font.css.ts packages/tailwind/src/emit/font.css.spec.ts
git commit -m "feat(tailwind): typography utilities as pure CSS helper

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: `state` → pure CSS-string helper

Convert `plugins-tailwind/state.ts` into a helper returning `@utility` CSS. Reuse the existing `@apply` bodies verbatim so behavior is preserved. `state-{colorKey}` is enumerated over the theme's color keys; `state-group` and `state-layer` are single utilities.

**Files:**
- Create: `packages/tailwind/src/emit/state.css.ts`
- Test: `packages/tailwind/src/emit/state.css.spec.ts`

**Interfaces:**
- Produces: `stateCss(colorKeys: string[]): string`.

- [ ] **Step 1: Write the failing test**

Create `packages/tailwind/src/emit/state.css.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildResolvedCss } from './test-utils';
import { stateCss } from './state.css';

describe('stateCss', () => {
  it('emits state-layer, state-group and per-color state utilities', async () => {
    const css = stateCss(['primary', 'secondary']);
    const resolved = await buildResolvedCss(css, ['state-layer', 'state-primary', 'state-group']);
    expect(resolved).toMatch(/\.state-primary\s*\{/);
    expect(resolved).toContain('--state-color: var(--color-primary)');
    expect(resolved).toMatch(/\.state-layer\s*\{/);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run --root packages/tailwind src/emit/state.css.spec.ts`
Expected: FAIL with "Cannot find module './state.css'".

- [ ] **Step 3: Write the helper**

Create `packages/tailwind/src/emit/state.css.ts`. The `@apply` strings are copied verbatim from the current `plugins-tailwind/state.ts` (duration 150, text opacity 0.38, bg opacity 0.1).

```ts
const DURATION = 150;
const TEXT_OPACITY = 0.38;
const BG_OPACITY = 0.1;

const groupBody = (extraFocusHover: boolean) =>
  [
    `@apply group-hover:bg-[var(--state-color)]/[0.08];`,
    extraFocusHover ? `@apply group-active:bg-[var(--state-color)]/[0.10];` : '',
    `@apply group-focus-visible:bg-[var(--state-color)]/[0.10];`,
    `@apply transition-colors;`,
    `@apply duration-${DURATION};`,
    `@apply group-disabled:text-on-surface/[${TEXT_OPACITY}];`,
    `@apply group-disabled:bg-on-surface/[${BG_OPACITY}];`,
  ]
    .filter(Boolean)
    .map((l) => `  ${l}`)
    .join('\n');

export function stateCss(colorKeys: string[]): string {
  const blocks: string[] = [];

  blocks.push(`@utility state-group {\n${groupBody(true)}\n}`);
  blocks.push(`@utility state-ripple-group {\n${groupBody(false)}\n}`);

  blocks.push(
    `@utility state-layer {\n` +
      [
        `@apply hover:bg-[var(--state-color)]/[0.08];`,
        `@apply active:bg-[var(--state-color)]/[0.10];`,
        `@apply focus-visible:bg-[var(--state-color)]/[0.10];`,
        `@apply transition-colors;`,
        `@apply duration-${DURATION};`,
        `@apply disabled:text-on-surface/[${TEXT_OPACITY}];`,
        `@apply disabled:bg-on-surface/[${BG_OPACITY}];`,
      ]
        .map((l) => `  ${l}`)
        .join('\n') +
      `\n}`,
  );

  for (const key of colorKeys) {
    blocks.push(`@utility state-${key} {\n  --state-color: var(--color-${key});\n}`);
  }

  return blocks.join('\n');
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run --root packages/tailwind src/emit/state.css.spec.ts`
Expected: PASS. If `@apply group-*` inside `@utility` fails to compile, replace the `state-group`/`state-ripple-group` `@apply` bodies with their resolved CSS equivalents (e.g. `.group:hover & { background-color: color-mix(in oklab, var(--state-color) 8%, transparent); }`) and update the test accordingly; the per-color `state-<key>` and `state-layer` cases are the critical ones.

- [ ] **Step 5: Commit**

```bash
git add packages/tailwind/src/emit/state.css.ts packages/tailwind/src/emit/state.css.spec.ts
git commit -m "feat(tailwind): state utilities as pure CSS helper

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: Internal cutover — static emitter + animation-only plugin + gitignored file write

> **ATOMIC TASK — do not split.** Tasks 6, 7, and 8 of the original plan were mutually
> dependent and produced broken intermediate states if done separately (an empty
> `@plugin` while `main.ts` still expects options; font/state/shadow defined twice; the
> node file-path not calling the browser emitter). They are merged here into ONE cutover,
> verified together against the Task 2 golden.

**Corrections baked in from Tasks 1–5 findings:**
- **Colors MUST be emitted as `@theme { --color-* }`** (the `loadColor({ isDynamic: false })`
  path), NOT the browser `onLoad`'s `.dynamic { --color-* }` (`isDynamic: true`). Only `@theme`
  registers Tailwind color utilities, which `text-primary`/`bg-primary`/`text-on-surface`
  need — and which `state`'s disabled `@apply text-on-surface`/`bg-on-surface` need to
  resolve. Using `.dynamic` here silently breaks every color utility and the state layer.
- The full static CSS is produced by a new `emitStaticCss()` method and used by the **node
  file path** (`_doNodeLoad`). The browser `onLoad` (SSR / `generateThemeCss`, `isDynamic: true`,
  colors-only `.dynamic`) is **left unchanged** — SSR injects color vars at runtime; build-time
  utilities do not belong there.
- The emitted `@plugin "@udixio/tailwind";` carries **no options block**, so `main.ts` must be
  reduced to animation-only in this same task or the plugin errors on missing `ConfigCss`.
- `@plugin` resolves through `packages/tailwind/dist/`, so **rebuild before the compile-based
  tests**: `npx nx run @udixio/tailwind:build`.

**Files:**
- Modify: `packages/tailwind/src/browser/tailwind.plugin.ts` (add `emitStaticCss()`; add `outFile?: string` to `TailwindPluginOptions`; keep `loadColor`, `getColors`, and `onLoad` unchanged)
- Modify: `packages/tailwind/src/node/tailwind.plugin.ts` (rewrite `_doNodeLoad`: call `emitStaticCss()`, write to `outFile`, gitignore it, no scan/mutation)
- Modify: `packages/tailwind/src/main.ts` (animation-only)
- Modify: `packages/tailwind/src/plugins-tailwind/index.ts` (export only `animation`)
- Delete: `packages/tailwind/src/node/file.ts`, `packages/tailwind/src/plugins-tailwind/{font,state,shadow}.ts`
- Modify: `packages/tailwind/package.json` (drop `replace-in-file`; drop `chalk` if unused)
- Test: `packages/tailwind/src/emit/emitter.spec.ts`, `packages/tailwind/src/node/node-plugin.spec.ts`

**Interfaces:**
- Consumes: `shadowCss()` (Task 3), `fontCss(FontCssArgs)` (Task 4), `stateCss(colorKeys)` (Task 5); `getColors()` (kebab keys); `FontPlugin.getFonts()` → `{ fontStyles, fontFamily }`.
- Produces: `emitStaticCss(): void` setting `this.outputCss` to the full static CSS; node plugin writing `<outFile>` (gitignored). Default `outFile` = `<cwd>/udixio.generated.css`; `options.outFile` overrides (absolute or cwd-relative).

- [ ] **Step 1: Write the failing emitter test**

Create `packages/tailwind/src/emit/emitter.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { generateReferenceCss } from './test-utils';

describe('theme CSS emitter', () => {
  it('emits @theme colors, font, state, shadow and the animation @plugin line', async () => {
    const css = await generateReferenceCss();
    expect(css).toContain('@theme');                      // colors registered as theme
    expect(css).toContain('--color-primary:');            // colors
    expect(css).toContain('@utility text-display-large'); // font (static)
    expect(css).toContain('@utility state-primary');      // state (static)
    expect(css).toContain('@utility shadow-1');           // shadow (static)
    expect(css).toContain('@plugin "@udixio/tailwind"');  // animation
    // the old string round-trip block must be gone
    expect(css).not.toContain('colorKeys:');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run --root packages/tailwind src/emit/emitter.spec.ts`
Expected: FAIL — current `_doNodeLoad` emits the `@plugin { colorKeys: … }` block and no `@utility` lines, so `@utility text-display-large` is missing and `colorKeys:` is present.

- [ ] **Step 3: Add `emitStaticCss()` to the browser plugin**

In `packages/tailwind/src/browser/tailwind.plugin.ts`, add imports near the top:

```ts
import { fontCss } from '../emit/font.css';
import { stateCss } from '../emit/state.css';
import { shadowCss } from '../emit/shadow.css';
import { FontPlugin } from '@udixio/theme';
```

Add `outFile?: string;` to the `TailwindPluginOptions` interface. Add this method to `TailwindImplPluginBrowser` (do NOT change `onLoad`, `loadColor`, or `getColors`):

```ts
  /**
   * Assembles the full static theme CSS for the build-time generated file:
   * @theme colors (registers Tailwind color utilities) + static font/state/shadow
   * utilities + @theme font families + the animation plugin. NOT used by the SSR
   * onLoad path, which stays colors-only under `.dynamic`.
   */
  emitStaticCss() {
    this.outputCss = '';
    this.loadColor({ isDynamic: false }); // @theme { --color-* } + dark @layer + subThemes
    const colorKeys = Object.keys(this.getColors()); // kebab keys
    const { fontStyles, fontFamily } = this.api.plugins
      .getPlugin(FontPlugin)
      .getInstance()
      .getFonts();

    this.outputCss += '\n' + shadowCss();
    this.outputCss += '\n' + stateCss(colorKeys);
    this.outputCss +=
      '\n' +
      fontCss({
        fontStyles,
        responsiveBreakPoints: this.options.responsiveBreakPoints ?? { lg: 1.125 },
        fontFamily,
      });
    this.outputCss += `\n@theme {\n  ${Object.entries(fontFamily)
      .map(
        ([key, values]) =>
          `--font-${key}: ${(values as string[])
            .map((v) => (v.trim().startsWith('var(') ? v : `"${v}"`))
            .join(', ')};`,
      )
      .join('\n  ')}\n}`;
    this.outputCss += '\n@plugin "@udixio/tailwind";';
  }
```

- [ ] **Step 4: Rewrite `_doNodeLoad` (node plugin) to use `emitStaticCss` and write the gitignored file**

In `packages/tailwind/src/node/tailwind.plugin.ts`, replace `_doNodeLoad` with:

```ts
  private async _doNodeLoad() {
    const { dirname, isAbsolute, join, resolve } = await import('pathe');
    const { existsSync, readFileSync, writeFileSync, mkdirSync } = await import(
      'node:fs'
    );

    // Full static CSS via the shared emitter (colors + font + state + shadow + @plugin).
    this.emitStaticCss();

    const cwd = resolve();
    const outFile = this.options.outFile
      ? isAbsolute(this.options.outFile)
        ? this.options.outFile
        : join(cwd, this.options.outFile)
      : join(cwd, 'udixio.generated.css');

    const dir = dirname(outFile);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(outFile, this.outputCss);

    // Ensure the generated file is gitignored (idempotent).
    const gitignore = join(dir, '.gitignore');
    const base = outFile.slice(dir.length + 1);
    const current = existsSync(gitignore) ? readFileSync(gitignore, 'utf8') : '';
    if (!current.split(/\r?\n/).includes(base)) {
      writeFileSync(
        gitignore,
        (current && !current.endsWith('\n') ? current + '\n' : current) +
          base +
          '\n',
      );
    }
  }
```

The node override no longer needs `findTailwindCssFile`, `replaceFileContent`, `createOrUpdateFile`, `getFileContent`, or the `ConfigCss` block — remove those imports. Keep the `nodeOnLoadPromise` dedup and the `isNodeJs()`/`ssr` branch in `onLoad`.

- [ ] **Step 5: Reduce `main.ts` to animation-only and delete superseded files**

Replace `packages/tailwind/src/main.ts`:

```ts
import plugin from 'tailwindcss/plugin';
import { animation, AnimationPluginOptions } from './plugins-tailwind/animation';

export const main = plugin.withOptions<AnimationPluginOptions>((options = {}) => {
  return (api) => {
    animation(options).handler(api);
  };
});
```

Set `packages/tailwind/src/plugins-tailwind/index.ts` to `export * from './animation';`.

Delete superseded files:

```bash
git rm packages/tailwind/src/node/file.ts \
       packages/tailwind/src/plugins-tailwind/font.ts \
       packages/tailwind/src/plugins-tailwind/state.ts \
       packages/tailwind/src/plugins-tailwind/shadow.ts
```

Remove `replace-in-file` from `packages/tailwind/package.json` dependencies. Run `grep -rn "chalk" packages/tailwind/src`; if no hits, remove `chalk` too. Then `pnpm install --offline`.

- [ ] **Step 6: Write the node-plugin write test**

Create `packages/tailwind/src/node/node-plugin.spec.ts`. NOTE: the temp dir must be inside the repo (compile isn't used here, but keep parity and avoid tmpdir surprises):

```ts
import { describe, expect, it } from 'vitest';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { defineConfig, FontPlugin, loader } from '@udixio/theme';
import { TailwindPlugin } from './tailwind.plugin';

describe('node TailwindPlugin', () => {
  it('writes udixio.generated.css and gitignores it, without touching other CSS', async () => {
    const root = join(__dirname, '..', '..', '.tmp-test');
    mkdirSync(root, { recursive: true });
    const dir = mkdtempSync(join(root, 'node-'));
    try {
      const userCss = join(dir, 'global.css');
      writeFileSync(userCss, '@import "tailwindcss";\n');
      const outFile = join(dir, 'udixio.generated.css');

      const config = defineConfig({
        sourceColor: '#6750A4',
        plugins: [new FontPlugin({}), new TailwindPlugin({ outFile })],
      });
      const api = await loader(config, false);
      await api.load();

      expect(existsSync(outFile)).toBe(true);
      expect(readFileSync(outFile, 'utf8')).toContain('--color-primary:');
      // user CSS untouched
      expect(readFileSync(userCss, 'utf8')).toBe('@import "tailwindcss";\n');
      // gitignore updated
      expect(readFileSync(join(dir, '.gitignore'), 'utf8')).toContain(
        'udixio.generated.css',
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
```

- [ ] **Step 7: Rebuild, then run the emitter + node tests**

```bash
npx nx run @udixio/tailwind:build
npx vitest run --root packages/tailwind src/emit/emitter.spec.ts src/node/node-plugin.spec.ts
```
Expected: both PASS. The rebuild is REQUIRED — `@plugin "@udixio/tailwind"` resolves through `dist/`, and the emitter test asserts the animation plugin registers. If the `animation` name assertion is added later (Task 7), confirm a real animation name from `plugins-tailwind/animation.ts`.

- [ ] **Step 8: Run the whole tailwind suite**

Run: `npx nx run @udixio/tailwind:vitest:test`
Expected: all PASS (shadow, font, state, characterization, emitter, node-plugin). The characterization golden (Task 2) still describes the OLD dist behavior at snapshot time; it should remain green because it re-runs `generateReferenceCss` — if it now diverges, that is the equivalence signal Task 7 formalizes; investigate before forcing an update.

- [ ] **Step 9: Commit**

```bash
git add packages/tailwind/src packages/tailwind/package.json pnpm-lock.yaml
git status --short   # confirm ONLY packages/tailwind + pnpm-lock are staged (no carousel bleed)
git commit -m "refactor(tailwind)!: generate static theme CSS, drop FS scan, string round-trip and source mutation

The theme now emits one static CSS artifact (@theme colors + @utility
font/state/shadow + @plugin animation) written to a gitignored file. Removes
the filesystem scan, the user-CSS mutation, and the @plugin { colorKeys… }
serialize/reparse round-trip. main.ts is reduced to the animation plugin.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>" -- packages/tailwind/src packages/tailwind/package.json pnpm-lock.yaml
```

---

## Task 7: Equivalence proof + consumer migration + green builds

Prove the new emitter reproduces the golden baseline, migrate `apps/doc` and `ui-react`, and verify both build.

**Files:**
- Create: `packages/tailwind/src/emit/equivalence.spec.ts`
- Modify: `apps/doc/src/styles/global.css`
- Modify: `packages/ui-react/src/index.css`
- Delete (git rm): `apps/doc/src/styles/udixio.css`, `packages/ui-react/src/udixio.css`
- Modify: `apps/doc/.gitignore` (or root) and `packages/ui-react/.gitignore`

**Interfaces:**
- Consumes: `buildResolvedCss`, `generateReferenceCss`, `GOLDEN_CANDIDATES` (Task 2).

- [ ] **Step 1: Write the equivalence test against the Task 2 golden**

Create `packages/tailwind/src/emit/equivalence.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildResolvedCss, generateReferenceCss, GOLDEN_CANDIDATES } from './test-utils';

describe('new emitter equivalence', () => {
  it('resolved CSS matches the characterization golden', async () => {
    const generated = await generateReferenceCss();
    const resolved = await buildResolvedCss(generated, GOLDEN_CANDIDATES);
    expect(resolved).toMatchSnapshot();
  });
});
```

- [ ] **Step 2: Run and compare to the baseline snapshot**

Run: `npx vitest run --root packages/tailwind src/emit/equivalence.spec.ts`
This creates `equivalence.spec.ts.snap`. Diff it against the Task 2 baseline:

Run: `diff <(sed -n '/`;$/!p' packages/tailwind/src/emit/__snapshots__/characterization.spec.ts.snap) <(sed -n '/`;$/!p' packages/tailwind/src/emit/__snapshots__/equivalence.spec.ts.snap) || true`

Expected: the resolved utilities for `.text-*`, `.state-*`, `.shadow-*`, and `--color-*` are equivalent. Semantic differences to investigate: any missing utility, a changed color value, or a dropped responsive rule. Cosmetic ordering differences are acceptable; a missing/changed rule is not — if found, fix the responsible helper (Task 3–5) before continuing.

- [ ] **Step 3: Migrate the consumers**

Edit `apps/doc/src/styles/global.css`: change `@import "./udixio.css";` to `@import "./udixio.generated.css";`.

Edit `packages/ui-react/src/index.css`: change `@import "./udixio.css";` to `@import "./udixio.generated.css";`.

Remove the committed generated files and gitignore the new ones:

```bash
git rm apps/doc/src/styles/udixio.css packages/ui-react/src/udixio.css
printf 'udixio.generated.css\n' >> apps/doc/src/styles/.gitignore
printf 'udixio.generated.css\n' >> packages/ui-react/src/.gitignore
```

Point each `theme.config.ts` plugin at the right `outFile` so the generated file lands next to the `@import`. In `apps/doc/theme.config.ts` and `packages/ui-react/theme.config.ts`, pass `outFile` to `TailwindPlugin` (paths relative to project cwd):

```ts
// apps/doc/theme.config.ts
plugins: [new FontPlugin({}), new TailwindPlugin({ outFile: 'src/styles/udixio.generated.css' })],
```

```ts
// packages/ui-react/theme.config.ts
plugins: [new FontPlugin({}), new TailwindPlugin({ outFile: 'src/udixio.generated.css' })],
```

- [ ] **Step 4: Build both consumers**

Run: `npx nx run @udixio/ui-react:build`
Expected: success.

Run: `npx nx run apps-doc:build` (Astro build)
Expected: success; confirm `apps/doc/src/styles/udixio.generated.css` was produced and is gitignored (`git status --short apps/doc/src/styles/` shows nothing).

If a build fails because Tailwind cannot find `udixio.generated.css` on the first run (generated during `buildStart` but imported earlier), document the ordering fix: ensure `vitePlugin()` runs before `@tailwindcss/vite` in the plugin array (it already precedes it in `apps/doc/astro.config.ts`), or generate the file once via `generateThemeCss` in a prebuild step.

- [ ] **Step 5: Commit**

```bash
git add -A packages/tailwind/src/emit apps/doc packages/ui-react
git commit -m "feat(tailwind)!: migrate consumers to explicit udixio.generated.css import

BREAKING CHANGE: @udixio/tailwind no longer scans the filesystem or injects an
@import into the user's CSS. Consumers must import the generated file explicitly
(@import \"./udixio.generated.css\") and set TailwindPlugin({ outFile }). The
generated file is gitignored and rebuilt each run.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review

**Task structure (after the Tasks 1–5 rework):** Task 1 spike, Task 2 golden, Tasks 3–5 the
three CSS helpers, **Task 6 the atomic internal cutover** (emitter + node write + main.ts
animation-only + dead-code deletion — merged because splitting produced broken intermediates),
**Task 7 the equivalence proof + consumer migration + builds**.

**Spec coverage:**
- Explicit import (spec decision 1) → Task 7 (consumer migration) + Task 6 (no scan/mutation). ✓
- Static CSS for colors/font/state/shadow (decision 2) → Tasks 3–5 (helpers) + Task 6 (assembly, `@theme` colors). ✓
- animation stays a plugin (decision 2) → Task 6 (main.ts animation-only). ✓
- Gitignored generated file (decision 3) → Task 6. ✓
- Round-trip removal → Task 6 (main.ts reduced, `ConfigCss`/string block deleted). ✓
- `generateThemeCss` (SSR) still works → left unchanged (browser `onLoad`, `.dynamic`); exercised via `generateReferenceCss` (node path) in Tasks 2/6/7. ✓
- Delete `node/file.ts`, reduce `main.ts` → Task 6. ✓
- Consumer migration (apps/doc, ui-react) → Task 7. ✓
- Nested `@plugin` risk (spec "Risque principal") → Task 1 spike (validated true). ✓
- Tests: golden snapshot + equivalence + green builds → Tasks 2, 7. ✓

**Placeholder scan:** No "TBD"/"handle edge cases"/"similar to". Task 1 contingency branches are moot (all three assumptions validated true); the plan now states the single chosen path. ✓

**Type consistency:** `generateReferenceCss()`, `buildResolvedCss()`, `GOLDEN_CANDIDATES` defined in Task 2, reused with identical names in Tasks 3–7. `shadowCss()`, `fontCss(FontCssArgs)`, `stateCss(colorKeys)` defined in Tasks 3–5 and consumed by `emitStaticCss()` in Task 6 with matching signatures. `outFile` option added and used in Task 6. ✓

**Known residual risk:** the Task 6 cutover is the one high-coupling change; the Task 2 golden + Task 7 equivalence test + consumer builds are the safety net. Task 6 must be verified as a whole (rebuild `dist/` before its compile tests).
