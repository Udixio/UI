/**
 * The facts of @udixio/motion that the documentation prints: how to install it per framework, the size budget of each
 * entry, and the browser verification. One source for the root page and the roadmap.
 *
 * The weights are the budgets of `packages/motion/.size-limit.json`, read at build time: `pnpm size` fails when an entry
 * grows past its budget, so a weight printed here is always an upper bound that holds.
 */
import sizeLimit from '../../../../packages/motion/.size-limit.json';
import type { ExampleFramework } from '@/stores/exampleFrameworkStore';

export const FRAMEWORK_LABELS: Record<ExampleFramework, string> = {
  html: 'HTML',
  react: 'React',
  angular: 'Angular',
  svelte: 'Svelte',
};

/**
 * The install command per framework. `animejs` is a dependency of @udixio/motion, so it comes with it; a framework
 * also needs its adapter, which holds `useMotion`, the `udxMotion` directive or the `motion` attachment.
 */
export const INSTALL: Record<ExampleFramework, string> = {
  html: 'npm i @udixio/motion',
  react: 'npm i @udixio/motion @udixio/ui-react',
  angular: 'npm i @udixio/motion @udixio/ui-angular',
  svelte: 'npm i @udixio/motion @udixio/ui-svelte',
};

type SizeLimitEntry = { name: string; limit: string };

/** The budget of each entry of `.size-limit.json`, in bytes, by its size-limit name. */
const budgets = new Map(
  (sizeLimit as SizeLimitEntry[]).map(({ name, limit }) => {
    const match = /^([\d.]+)\s*(kB|B)$/.exec(limit.trim());
    if (!match) throw new Error(`motion-facts: cannot read the size limit "${limit}" of "${name}"`);
    return [name, Number(match[1]) * (match[2] === 'kB' ? 1000 : 1)] as const;
  }),
);

function budgetOf(name: string): number {
  const bytes = budgets.get(name);
  if (bytes === undefined) throw new Error(`motion-facts: no size limit named "${name}" in packages/motion/.size-limit.json`);
  return bytes;
}

/** A weight in kB with one decimal, as size-limit prints it: `14.1 kB`. */
export function formatKb(bytes: number): string {
  return `${Number((bytes / 1000).toFixed(1))} kB`;
}

/** The figure of the root page's first fact: the budget of the core entry. */
export const coreBudget = formatKb(budgetOf('core'));

/** How an entry reaches a page: the core itself, loaded by the core the first time a motion needs it, or imported by you. */
export type EntryLoad = 'core' | 'auto' | 'import';

export type MotionEntry = {
  /** The import path. */
  path: string;
  /** Its size-limit name. */
  limit: string;
  load: EntryLoad;
  /** The slugs of the needs it serves (`MOTION_NEEDS`). */
  needs: string[];
  /** Its budget, gzipped, in bytes. */
  bytes: number;
  /** Where it behaves differently in a verified engine; empty when it is the same in all of them. */
  browsers?: string;
};

const entry = (path: string, limit: string, load: EntryLoad, needs: string[], browsers?: string): MotionEntry => ({
  path,
  limit,
  load,
  needs,
  bytes: budgetOf(limit),
  browsers,
});

/**
 * The entries a page uses, in the order a reader meets them: the core, the entries it loads by itself (the feature
 * loader and the layout loader of `@udixio/motion`), then those you import. The tooling entries (manifest, testing, the
 * providers) are left out.
 */
export const MOTION_ENTRIES: MotionEntry[] = [
  entry('@udixio/motion', 'core', 'core', ['presence', 'emphasis', 'reveal', 'accessibility']),
  entry('@udixio/motion/layout', 'layout', 'auto', ['layout', 'lists', 'shared-elements']),
  entry('@udixio/motion/value', 'value', 'auto', ['values', 'counters']),
  entry('@udixio/motion/sequence', 'sequence', 'auto', ['sequences']),
  entry('@udixio/motion/gesture', 'gesture', 'auto', ['gestures']),
  entry('@udixio/motion/text', 'text', 'auto', ['text']),
  entry(
    '@udixio/motion/continuous',
    'continuous',
    'auto',
    ['scrub', 'loop'],
    'Firefox has no view timeline yet: a scroll link shows its still state there.',
  ),
  entry('@udixio/motion/svg', 'svg', 'import', ['svg']),
  entry('@udixio/motion/scroll', 'scroll', 'import', ['scroll']),
  entry('@udixio/motion/animate', 'animate', 'import', ['animate']),
  entry('@udixio/motion/page', 'page', 'import', ['page-transitions']),
  entry('@udixio/motion/scope', 'scope', 'import', ['scopes']),
  entry('@udixio/motion/presets', 'presets', 'import', ['presence', 'lists', 'loop']),
  entry('@udixio/motion/motion.css', 'motion-css', 'import', ['tokens', 'scopes']),
];

// Browser verification, from the run of the browser suites of @udixio/motion (vitest, one engine per run).
export const verifiedOn = '2026-11-17';
export const verifiedCommit = '04f44667';
export const verifiedWith = 'Playwright 1.64.0';
/** The verified engines, with the tests that passed and were skipped on each. */
export const engines = [
  { name: 'Chromium', version: '156.0.8078.4', passed: 678, skipped: 1 },
  { name: 'Firefox', version: '157.0', passed: 673, skipped: 6 },
  { name: 'WebKit', version: '27.2', passed: 678, skipped: 1 },
];
/** The browser suites of @udixio/motion, as files. */
export const suiteFiles = 47;

// Each row: the family or provider, the browser suites that cover it, and the tests that passed on each engine.
export const familyVerification = [
  ['Presence', 'connect, bind, play', '121', '121', '121'],
  ['Emphasis', 'play, bind', '79', '79', '79'],
  ['Layout, lists and shared elements', 'layout, layout-loader (and cold), shared, shared-registry, stagger, pin', '105', '105', '105'],
  ['Reveal, scrub and loop', 'reveal, scrub, loop, continuous (cold)', '31 (1 skipped)', '26 (6 skipped)', '31 (1 skipped)'],
  ['Values and counters', 'value-binding, value-counter', '33', '33', '33'],
  ['Sequences', 'sequence', '16', '16', '16'],
  ['Gestures', 'gesture-binding', '29', '29', '29'],
  ['Page transitions', 'navigate, astro', '16', '16', '16'],
  ['Text', 'text, split (cold, play, load failure)', '41', '41', '41'],
  ['SVG', 'svg, morph', '25', '25', '25'],
  ['Scroll', 'scroll-to', '20', '20', '20'],
  ['Animate', 'animate', '19', '19', '19'],
  ['Scopes and breakpoints', 'scope, named-motion', '18', '18', '18'],
  ['Accessibility and reduced motion', 'runtime-policy, fallbacks (older browsers simulated)', '14', '14', '14'],
  ['Tokens', 'curve-tokens, motion-css, timing-integration', '7', '7', '7'],
];
export const providerVerification = [
  ['CSS', 'providers/css, css-diagnostic, leaks', '77', '77', '77'],
  ['WAAPI', 'providers/providers, waapi-probe', '49', '49', '49'],
  ['anime.js', 'providers/animejs', '29', '29', '29'],
  ['Providers compared', 'testing/conformance', '5', '5', '5'],
];
