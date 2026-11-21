/**
 * The facts of @udixio/motion that the documentation prints: how to install it per framework, the weight of each entry and
 * of each adapter, and the browsers it supports with what degrades on the oldest of them.
 *
 * The weights are measured by `packages/motion/scripts/size-report.mjs` and committed in `packages/motion/size-report.json`
 * (a node test fails when that file is stale). They are gzipped sizes of what the bundles weigh. The budgets of
 * `.size-limit.json` are ceilings, not measures, and are not printed.
 *
 * The browsers are the oldest releases of browserslist's `defaults` query, the support rule of the package, and the first
 * release of each engine that has a feature the package falls back from. Every version below is cited where it is written.
 */
import sizeReport from '../../../../packages/motion/size-report.json';
import type { ExampleFramework } from '@/stores/exampleFrameworkStore';

export const FRAMEWORK_LABELS: Record<ExampleFramework, string> = {
  html: 'HTML',
  react: 'React',
  angular: 'Angular',
  svelte: 'Svelte',
};

/**
 * The install command per framework: `@udixio/motion`, then the adapter, and `@udixio/core` where the adapter declares it as
 * a peer dependency (ui-angular and ui-svelte; ui-react depends on it). `animejs` is a dependency of @udixio/motion, so it
 * comes with it. The adapter adds `Motion`, `Presence` and `useMotion` in React, the `udxMotion` directive, or the `motion`
 * attachment.
 * Sources: packages/ui-angular/package.json and packages/ui-svelte/package.json (peerDependencies), packages/ui-react/package.json.
 */
export const INSTALL: Record<ExampleFramework, string> = {
  html: 'npm i @udixio/motion',
  react: 'npm i @udixio/motion @udixio/ui-react',
  angular: 'npm i @udixio/motion @udixio/core @udixio/ui-angular',
  svelte: 'npm i @udixio/motion @udixio/core @udixio/ui-svelte',
};

/** A weight in kB with one decimal, as size-limit prints it: `14.1 kB`. */
export function formatKb(bytes: number): string {
  return `${Number((bytes / 1000).toFixed(1))} kB`;
}

type SizeReport = {
  node: string;
  entries: Record<string, number>;
  adapters: Record<'react' | 'angular' | 'svelte', number>;
};
const report = sizeReport as SizeReport;

/** The measured gzipped size of an entry, in bytes, by its name in `size-report.json`. */
function measuredOf(name: string): number {
  const bytes = report.entries[name];
  if (bytes === undefined) throw new Error(`motion-facts: no measured size named "${name}" in packages/motion/size-report.json`);
  return bytes;
}

/** The measured gzipped size of the core, as the root page prints it. */
export const coreWeight = formatKb(measuredOf('core'));

/** How an entry reaches a page: the core itself, loaded by the core the first time a motion needs it, or imported by you. */
export type EntryLoad = 'core' | 'auto' | 'import';

export type MotionEntry = {
  /** The import path. */
  path: string;
  /** Its name in `size-report.json` and `.size-limit.json`. */
  name: string;
  load: EntryLoad;
  /** The slugs of the needs it serves (`MOTION_NEEDS`). */
  needs: string[];
  /** Its gzipped size, in bytes, as measured. */
  bytes: number;
};

const entry = (name: string, path: string, load: EntryLoad, needs: string[] = []): MotionEntry => ({
  path,
  name,
  load,
  needs,
  bytes: measuredOf(name),
});

/**
 * Every entry of the package that a page can name, in the order a reader meets them: the core, the entries the core loads
 * on first use (`packages/motion/src/feature-loader.ts` and `layout-loader.ts`), then those you import. The check below
 * makes a new entry of `size-report.json` fail until it is listed here.
 */
export const MOTION_ENTRIES: MotionEntry[] = [
  entry('core', '@udixio/motion', 'core', ['presence', 'emphasis', 'reveal', 'accessibility']),
  entry('layout', '@udixio/motion/layout', 'auto', ['layout', 'lists', 'shared-elements']),
  entry('value', '@udixio/motion/value', 'auto', ['values', 'counters']),
  entry('sequence', '@udixio/motion/sequence', 'auto', ['sequences']),
  entry('gesture', '@udixio/motion/gesture', 'auto', ['gestures']),
  entry('text', '@udixio/motion/text', 'auto', ['text']),
  entry('continuous', '@udixio/motion/continuous', 'auto', ['scrub', 'loop']),
  entry('svg', '@udixio/motion/svg', 'import', ['svg']),
  entry('scroll', '@udixio/motion/scroll', 'import', ['scroll']),
  entry('animate', '@udixio/motion/animate', 'import', ['animate']),
  entry('page', '@udixio/motion/page', 'import', ['page-transitions']),
  entry('scope', '@udixio/motion/scope', 'import', ['scopes']),
  entry('presets', '@udixio/motion/presets', 'import', ['presence', 'lists', 'loop']),
  entry('motion-css', '@udixio/motion/motion.css', 'import', ['tokens', 'scopes']),
  entry('policy', '@udixio/motion/policy', 'import', ['accessibility']),
  entry('active', '@udixio/motion/active', 'import'),
  entry('astro', '@udixio/motion/astro', 'import', ['page-transitions']),
  entry('manifest', '@udixio/motion/manifest', 'import', ['manifest']),
  entry('testing', '@udixio/motion/testing', 'import'),
  entry('css', '@udixio/motion/providers/css', 'import'),
  entry('waapi', '@udixio/motion/providers/waapi', 'import'),
  entry('animejs', '@udixio/motion/providers/animejs', 'import'),
];

for (const name of Object.keys(report.entries)) {
  if (!MOTION_ENTRIES.some((listed) => listed.name === name)) {
    throw new Error(`motion-facts: "${name}" is measured in size-report.json but not listed in MOTION_ENTRIES`);
  }
}

/**
 * The adapters' motion parts, on top of the core, gzipped: `size-report.mjs` bundles each one with esbuild, on its source,
 * with `@udixio/*` and the framework external. An application's own bundle can differ (Angular's compiler and Svelte's
 * compiler are not run).
 */
export const ADAPTERS = [
  { name: 'React', package: '@udixio/ui-react', bytes: report.adapters.react },
  { name: 'Angular', package: '@udixio/ui-angular', bytes: report.adapters.angular },
  { name: 'Svelte', package: '@udixio/ui-svelte', bytes: report.adapters.svelte },
];

type Engine = 'Chrome' | 'Firefox' | 'Safari';

/**
 * The oldest release of each browser the package supports: the oldest version of its browserslist `defaults` query
 * (`> 0.5%, last 2 versions, Firefox ESR, not dead`), read in docs/motion/research/R1-native-support.md §0.1 (the query at
 * caniuse-lite 1.0.30001820, 2026-10-29). The rule is spec C13 (docs/superpowers/specs/2026-11-03-udixio-motion-design.md,
 * line 101); the same spec says R1 is the reference for versions (line 208). Chrome 109 is `chrome 109` (0.60%); Firefox 153
 * is `firefox 153 (ESR)`; Safari 26.6 is the older of `safari 27 26.6`; iOS Safari 18.5 is `ios_saf 18.5-18.7` (WebKit 621).
 * Caveat: `pnpm-lock.yaml` pins caniuse-lite 1.0.30001810, and `browserslist defaults` with that pin resolves to Firefox ESR 140
 * and Safari 26.5 instead. Re-check these figures whenever caniuse-lite is updated. The entries of `defaults` with no
 * browserslist data (Opera Mini, KaiOS, UC, QQ: R1 §0.1, group G0) cannot run these APIs and are not listed.
 */
export const MINIMUM_BROWSERS: { name: string; engine: Engine; version: number; note?: string }[] = [
  { name: 'Chrome', engine: 'Chrome', version: 109 },
  { name: 'Firefox', engine: 'Firefox', version: 153, note: 'ESR' },
  { name: 'Safari', engine: 'Safari', version: 26.6, note: 'macOS' },
  { name: 'iOS Safari', engine: 'Safari', version: 18.5, note: 'iPhone and iPad' },
];

type Feature = {
  name: string;
  /** The first stable release of each engine that has it, without a flag. */
  first: Record<Engine, number>;
  /** What the package does where the feature is missing, in a few words. */
  without: string;
};

/**
 * The features the package falls back from, with the first release of each engine that has one (R1 §1, the row named in
 * each comment; Safari's figure is the same on macOS and iOS in R1). Each `without` is what the package's README says it does.
 * `sibling-index()` is not here: the package does not use it (no match in packages/motion/src), so it has no fallback to state.
 */
export const FEATURES: Feature[] = [
  {
    // R1 §1 "linear() easing": Chrome 113, Firefox 112, Safari 17.2.
    name: 'linear() easing',
    first: { Chrome: 113, Firefox: 112, Safari: 17.2 },
    // README "Static CSS spring tokens": the stylesheet starts with cubic-bezier pairs and switches to linear() when accepted.
    without: 'eases fall back to a cubic-bezier pair',
  },
  {
    // R1 §1 "View Transitions same-document": Chrome 111, Firefox 144, Safari 18.
    name: 'View Transitions',
    first: { Chrome: 111, Firefox: 144, Safari: 18 },
    // README "Page transitions": "Where the browser has no View Transitions, navigate() runs the update alone."
    without: 'navigate() updates the page without a transition',
  },
  {
    // R1 §1 "animation-timeline: scroll() / view()" and ViewTimeline: Chrome 115, Firefox 159, Safari 26.
    name: 'view timeline',
    first: { Chrome: 115, Firefox: 159, Safari: 26 },
    // README "Scrub" (the scroll link is made on a view timeline; where there is none, the element keeps its stylesheet state);
    // roadmap "Link to the scroll": "a stylesheet state where it has none".
    without: 'a scroll link keeps its stylesheet state',
  },
  {
    // R1 §1 "@property / CSS.registerProperty": Chrome 85, Firefox 128, Safari 16.4.
    name: '@property',
    first: { Chrome: 85, Firefox: 128, Safari: 16.4 },
    // README "Document motion scale": "A plain :root declaration supplies the same values in browsers without @property."
    without: 'a token keeps its :root value',
  },
];

/**
 * The features each minimum browser lacks, with the versions in which it lacks them (`from` the minimum, `to` the release
 * before the feature's first one). Computed from the two tables above, so a change to either is reflected here.
 */
export const DEGRADATIONS = MINIMUM_BROWSERS.map((browser) => ({
  browser,
  lacks: FEATURES.filter((feature) => browser.version < feature.first[browser.engine]).map((feature) => ({
    feature,
    from: String(browser.version),
    to: String(Math.ceil(feature.first[browser.engine]) - 1),
  })),
}));

/** The engines the browser suites ran on, as Playwright 1.64.0 installs them. Versions only: the suites are not counted here. */
export const VERIFIED_ENGINES = [
  { name: 'Chromium', version: '156.0.8078.4' },
  { name: 'Firefox', version: '157.0' },
  { name: 'WebKit', version: '27.2' },
];
export const verifiedWith = 'Playwright 1.64.0';
