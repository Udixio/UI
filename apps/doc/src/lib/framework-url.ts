/**
 * The URL rule of the documentation (framework-urls spec §2): which motion pages have a reading per framework, which tab
 * a feature's address resolves to, and the redirects, links and canonicals that follow from it. The routes, the links, the
 * redirects, the sitemap and the tests call these functions; none of them repeats the rule.
 *
 * Plain Node loads this module (`node --test`): its runtime imports are relative `.ts` paths.
 */
import {
  EXAMPLE_FRAMEWORKS,
  type ExampleFramework,
} from '../stores/exampleFrameworkStore.ts';
import {
  FEATURE_TABS,
  MOTION_NEEDS,
  type FeatureTab,
  type MotionNeed,
} from './motion-nav.ts';

export { FEATURE_TABS, type FeatureTab } from './motion-nav.ts';

/** The labels of a feature's tabs, as its tab header shows them. */
export const FEATURE_TAB_LABELS: Record<FeatureTab, string> = {
  overview: 'Overview',
  guide: 'Guide',
  api: 'API',
  examples: 'Examples',
};

/** The reading that a bare link to a framework-dependent page opens on a neutral page. */
export const DEFAULT_FRAMEWORK: ExampleFramework = 'react';

/** The number of recipes that name a feature before its Examples tab appears. */
const RECIPES_FOR_EXAMPLES = 2;

/** The frameworks that have pages outside motion: the HTML reading exists for motion pages only (§2.6). */
const PAGE_FRAMEWORKS = EXAMPLE_FRAMEWORKS.filter(
  (framework) => framework !== 'html',
);

function isExampleFramework(value: unknown): value is ExampleFramework {
  return (EXAMPLE_FRAMEWORKS as readonly unknown[]).includes(value);
}

function isFeatureTab(value: string): value is FeatureTab {
  return (FEATURE_TABS as readonly string[]).includes(value);
}

function findNeed(slug: string): MotionNeed | undefined {
  return MOTION_NEEDS.find((need) => need.slug === slug);
}

/** Splits an address into its path and the query and hash after it, both kept as written. */
function splitSuffix(href: string): { base: string; suffix: string } {
  const at = href.search(/[?#]/);
  return at === -1
    ? { base: href, suffix: '' }
    : { base: href.slice(0, at), suffix: href.slice(at) };
}

/** The path without its trailing slashes; the root stays `/`. */
function trimSlash(path: string): string {
  const trimmed = path.replace(/\/+$/, '');
  return trimmed === '' ? '/' : trimmed;
}

/** The reading of a framework id, or undefined for anything else: what the components read from `Astro.params.framework`. */
export function readingFramework(value: unknown): ExampleFramework | undefined {
  return isExampleFramework(value) ? value : undefined;
}

/**
 * Strips a leading framework id from a pathname. The path keeps its query and hash and loses its trailing slash; a
 * pathname with no framework comes back without the `framework` key.
 */
export function splitFramework(pathname: string): {
  framework?: ExampleFramework;
  path: string;
} {
  const { base, suffix } = splitSuffix(pathname);
  const [head = '', ...rest] = trimSlash(base).split('/').slice(1);
  if (!isExampleFramework(head)) return { path: trimSlash(base) + suffix };
  return { framework: head, path: `/${rest.join('/')}${suffix}` };
}

/**
 * The motion page of a path: its slug and, for a feature's tab, the tab (`/motion/presence/guide` gives
 * `{ slug: 'presence', tab: 'guide' }`). Query and hash are ignored; a path outside `/motion` has no motion page.
 */
export function splitMotionPath(
  path: string,
): { slug: string; tab?: FeatureTab } | undefined {
  const bare = trimSlash(splitSuffix(path).base);
  if (bare !== '/motion' && !bare.startsWith('/motion/')) return undefined;
  const slug = bare === '/motion' ? '' : bare.slice('/motion/'.length);
  const at = slug.lastIndexOf('/');
  if (at !== -1) {
    const tab = slug.slice(at + 1);
    const feature = slug.slice(0, at);
    if (isFeatureTab(tab) && findNeed(feature)?.tabs !== undefined)
      return { slug: feature, tab };
  }
  return { slug };
}

/** The tabs of a feature: its authored tabs, and Examples once enough recipes name it. A page that is no feature has none. */
export function featureTabs(slug: string): FeatureTab[] {
  const authored: readonly string[] | undefined = findNeed(slug)?.tabs;
  if (authored === undefined) return [];
  const recipes = MOTION_NEEDS.filter(
    (need) => need.features?.includes(slug) === true,
  ).length;
  return FEATURE_TABS.filter((tab) =>
    tab === 'examples'
      ? recipes >= RECIPES_FOR_EXAMPLES
      : authored.includes(tab),
  );
}

/** The tab that a feature's address without a tab resolves to: its first tab. Undefined for a page that is no feature. */
export function defaultTab(slug: string): FeatureTab | undefined {
  return featureTabs(slug)[0];
}

/** Whether a bare path has a reading per framework. Query and hash are ignored; a prefixed path is not bare. */
export function hasFrameworkVariants(path: string): boolean {
  const found = splitMotionPath(path);
  return found !== undefined && findNeed(found.slug)?.perFramework === true;
}

/** Whether a path is the bare address of a framework-dependent page, which redirects to a reading or to its default tab. */
export function isFrameworkStub(path: string): boolean {
  return hasFrameworkVariants(path);
}

/** A bare path with a feature's default tab added when it has none; any other path unchanged. */
function resolveTab(bare: string): string {
  const found = splitMotionPath(bare);
  if (found === undefined || found.tab !== undefined) return bare;
  const tab = defaultTab(found.slug);
  return tab === undefined ? bare : `${bare}/${tab}`;
}

/**
 * The address of a page in a framework: `/react/motion/presence/guide` for a framework-dependent page (a feature without its
 * tab gets its default one). A neutral page, or no framework, is returned unchanged. Query and hash are kept.
 */
export function withFramework(
  path: string,
  framework: ExampleFramework | undefined,
): string {
  if (framework === undefined || !hasFrameworkVariants(path)) return path;
  const { base, suffix } = splitSuffix(path);
  return `/${framework}${resolveTab(trimSlash(base))}${suffix}`;
}

/**
 * A link as a page renders it. On a reading it is the reading's own. On a neutral page, a link to a framework-dependent
 * page goes to the default framework and is marked, so that the page can send it to the stored framework. Any other
 * href is unchanged.
 */
export function docLink(
  href: string,
  framework: ExampleFramework | undefined,
): { href: string; frameworkLink: boolean } {
  if (framework !== undefined)
    return { href: withFramework(href, framework), frameworkLink: false };
  if (hasFrameworkVariants(href))
    return {
      href: withFramework(href, DEFAULT_FRAMEWORK),
      frameworkLink: true,
    };
  return { href, frameworkLink: false };
}

/**
 * The bare path of every page that has a reading per framework: one per tab of a feature, one for any other page. A need
 * whose `href` holds an anchor is a section of another page, not a page.
 */
export function motionPagePaths(): {
  path: string;
  slug: string;
  tab?: FeatureTab;
}[] {
  return MOTION_NEEDS.filter(
    (need) => need.perFramework && !need.href.includes('#'),
  ).flatMap((need) =>
    need.tabs === undefined
      ? [{ path: need.href, slug: need.slug }]
      : featureTabs(need.slug).map((tab) => ({
          path: `${need.href}/${tab}`,
          slug: need.slug,
          tab,
        })),
  );
}

/** A bare path under a framework prefix; `/` under a prefix is the prefix alone (`/react`). */
function prefixed(framework: ExampleFramework, path: string): string {
  return path === '/' ? `/${framework}` : `/${framework}${path}`;
}

/**
 * The 301 redirects of the prefixed addresses that are not readings (framework-urls spec §2.6): each neutral motion page
 * under every framework, each page outside motion (`neutralPaths`) under every framework but HTML, and each feature
 * without its tab under every framework, to its default tab.
 */
export function frameworkRedirects(
  neutralPaths: readonly string[],
): Record<string, string> {
  const redirects: Record<string, string> = {};
  for (const need of MOTION_NEEDS) {
    if (need.href.includes('#')) continue;
    if (!need.perFramework) {
      for (const framework of EXAMPLE_FRAMEWORKS)
        redirects[prefixed(framework, need.href)] = need.href;
      continue;
    }
    const tab = defaultTab(need.slug);
    if (tab === undefined) continue;
    for (const framework of EXAMPLE_FRAMEWORKS) {
      redirects[prefixed(framework, need.href)] =
        `${prefixed(framework, need.href)}/${tab}`;
    }
  }
  for (const path of neutralPaths) {
    for (const framework of PAGE_FRAMEWORKS)
      redirects[prefixed(framework, path)] = path;
  }
  return redirects;
}

/**
 * The canonical address of a pathname: its URL without the trailing slash, the root keeping its own (framework-urls spec
 * §2.9). Internal links, redirects and sitemap entries use this form.
 */
export function canonicalUrl(pathname: string, site: string | URL): string {
  const url = new URL(pathname, site);
  url.pathname = trimSlash(url.pathname);
  return url.href;
}
