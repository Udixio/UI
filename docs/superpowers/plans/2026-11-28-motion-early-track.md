# Motion early track (removals and framework URLs) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Before the motion model is redesigned, remove from `@udixio/motion` what the common plan retires, and serve the
motion pages at `/<framework>/motion/<page>` (stubs, generated redirects, a switch that navigates, feature tabs) without
rewriting their content.

**Architecture:** Track A deletes `scrollTo`, `navigate`, the `page` and `astro` entries, the View Transition rules of
`motion.css` and the value source `'time'`, with every consumer. Track B adds one URL module
(`apps/doc/src/lib/framework-url.ts`) that the routes, links, navigation, redirects, sitemap and tests share; two route
files serve the current `.astro` pages once per framework (renamed `_<slug>.astro` so that Astro does not route them
itself), and the components that today hide the other frameworks' variants render only the reading's framework.

**Tech Stack:** TypeScript 5.9, Astro 7 (static output, Vercel adapter, `@astrojs/sitemap`, `astro-pagefind`, ClientRouter),
React 19 islands with `@udixio/ui-react`, Vite library build, Vitest (unit and browser), `size-limit`, `node --test` (Node 24,
type stripping), Playwright through the doc's `*.browser.test.mjs` suites.

**Spec:** `docs/superpowers/specs/2026-11-28-framework-urls-and-motion-syntax-design.md` (§1 item 1, §2, §5 Pages and
Toggles, §7; its Appendix A, the syntax, is on hold and out of this plan), and the common plan
`.superpowers/sdd/2026-11-17-animation-docs/plan-commun-motion-components-30-94.md` (§2.6 removals, §2.9 order, "hors
séquence"). Reasons and pilot results: `.superpowers/sdd/2026-11-17-animation-docs/design-2026-11-28-url-props-home.md`
§1 (pilot §1.9), §7, §8.

This plan replaces, for the URL work, Tasks 10a to 12 of `docs/superpowers/plans/2026-11-28-framework-urls-and-motion-syntax.md`;
that plan's syntax tasks (1 to 9), MDX moves (13 to 20) and home (21, 22) wait for the model.

## How the current pages are served until the model

Decision: **no MDX in this track. The current `.astro` pages are rendered once per framework** by the prefixed route;
the MDX collection, `MotionEntry.astro` and the Overview pages arrive when the pages are rewritten after the model
(common plan, step 8/8, or the home regrouping after step 2/8).

Why, from the pilot (design §1.3 and §1.9) and the spec:

1. The pilot proved that `Astro.params.framework` reaches every `.astro` component of the page [Test: pilot], so the
   components that choose a variant today at run time (`ForFramework`, `ApiName`, `Choice`, `Code`, `MotionUsage`) can
   choose it at build time with no change to the pages that use them.
2. The pilot's islands rule (an island chosen inside an `.astro` component's own template hydrates; one chosen by an MDX
   expression or a wrapper does not) is met as is: every live demo of the current pages is a slot of `MotionUsage`, and an
   unrendered Astro slot is not rendered at all, so a reading holds the island of its framework only.
3. The headings rule (equal heading ids in the four readings) already holds: `ForFramework` forbids headings inside it.
   The built-site test checks it.
4. An MDX pilot on one page would be written now in the old syntax and the one-page layout, then rewritten after the model
   into Overview and Guide: the same content twice, which the brief forbids.

What this costs, all removed with the MDX rewrite: the pages keep their `title=` and `description=` props (ignored on a
reading, where `MotionPage` computes them, spec §2.9); their internal `<a href>` become `<DocLink href>` (a mechanical
codemod, no wording change); `ForFramework`, `ApiName` and the variant contract stay for the bare neutral pages.

### Interim departures from the spec (questions 2 to 4 at the end)

- **Default tab.** Spec §2.10 makes Overview the canonical tab of a feature. No Overview exists until the pages are
  rewritten, so a feature's authored tabs are `['guide']` (the current page is the complete usage, which is the Guide's
  definition), `/<fw>/motion/<feature>` answers 301 to its first existing tab, and the Overview becomes first by data when
  it is written. No URL of a Guide changes then.
- **API tab and reference.** Deferred with the model: the export-to-feature mapping, the `/motion/api` index, `api/core`
  and `api/tooling` are rebuilt once, on the model's export list. `/motion/api` stays as it is (neutral).
- **Examples tab.** Built now: it is generated from `MOTION_NEEDS` (recipes tagged with `features`), so it costs no content.

## Global Constraints

- Repository rules: `CLAUDE.md`, `apps/doc/AGENTS.md`, `.superpowers/sdd/2026-11-17-animation-docs/rules.md` and
  `parallel-rules.md`. English in every file.
- Never `git stash`, `checkout -- <file>`, `restore`, `reset`, `clean`; never switch branch. Commit with
  `git commit -m "<conventional message>" -- <explicit paths>` (new files staged with `git add <path>`, renames with
  `git mv`), the message ending with the session's Co-Authored-By line. No push, no `pnpm install`, no new dependency.
- `apps/doc/src/pages/motion/gestures.astro` carries an uncommitted change owned by someone else: Tasks 4/9 and 5/9 do not
  start until it is committed (the controller checks `git status`).
- Nothing is published: breaking changes need no warning (maintainer, 2026-11-28).
- Removed, with no replacement and no deprecation: `scrollTo`, `scrollDestination`, `ScrollToOptions`, `ScrollPosition`,
  `ScrollHandle`, `navigate`, `NavigationDirection`, `connectAstroTransitions`, the entries `@udixio/motion/scroll`,
  `/page`, `/astro`, the `data-motion-direction` attribute, the `::view-transition-*` rules and `@keyframes udx-route-*` of
  `motion.css`, and `'time'` in `ValueSource`. `disappear` is NOT removed (it waits for the separately written exit,
  common plan step 4/8). The reserved name prefix `view-transition-` of `src/manifest.ts` stays (a naming guard, not the
  feature).
- Prefixes: `react`, `angular`, `svelte`, `html` (`EXAMPLE_FRAMEWORKS`, `src/stores/exampleFrameworkStore.ts`); storage key
  `udixio:docs:preferred-example-framework`; React is the default reading.
- Neutral motion pages (bare URL, 301 under the four prefixes): `''` (home), `glossary`, `limits`, `roadmap`,
  `loading-and-weight`, `api`. Every other motion page is framework-dependent. Outside motion, every page of the `pages`
  collection, `/themes`, `/theme/builder` and `/` are neutral (301 under `react`, `angular`, `svelte`); component pages
  and `/html/…` outside motion have no prefixed form (404).
- Features (`tabs`): `presence`, `emphasis`, `layout`, `lists`, `shared-elements`, `reveal`, `scrub`, `loop`, `text`,
  `svg`, `values`, `gestures`, `sequences`, `animate`, `tokens`, `presets`, `accessibility`, `per-breakpoint`, `inspect`.
  Tab labels "Overview", "Guide", "API", "Examples", in that order.
- Recipe features (spec §2.10): Dialog `['presence']`; Toasts `['presence', 'lists']`; Accordion `['presence', 'layout']`;
  Tab indicator `['shared-elements', 'layout']`; Navigation menu `['presence']`. Examples tab: two recipes or more.
- Titles and descriptions (spec §2.9, §2.10), verbatim: a reading "Presence in Svelte · Motion", its Guide "Presence guide
  in Svelte · Motion", its Examples "Presence examples in Svelte · Motion"; a neutral page "Glossary · Motion"; the home
  "Motion"; the layout appends " — Udixio UI". Description: `summary + ' ' + FRAMEWORK_LINES[framework]`, preceded by
  "The complete guide." on a Guide and "Complete examples." on Examples. `FRAMEWORK_LINES`: "In React, with the Motion and
  Presence components and the hooks of @udixio/ui-react.", "In Angular, with the directives of @udixio/ui-angular.", "In
  Svelte, with the attachments of @udixio/ui-svelte.", "In plain HTML, with data-motion attributes and no framework."
- Implementers are Haiku subagents (effort per task), each under 500k tokens; reviews Sonnet, effort `high`.
  Implementers run only the checks their task names: never `astro build`, never a whole browser suite, at most one dev
  server and one browser file in a serial task, none in a parallel one. The controller builds and runs the three-engine
  verification (Task 9/9).
- Load: check `cut -d' ' -f1 /proc/loadavg` before a browser run or a dev server (wait while above 8; the controller's
  `astro build` waits for load < 4 and more than 3 GB free).
- No build between Task 1/9 and Task 3/9: the doc imports `@udixio/motion/astro` and the removed examples until Task 3/9.

### Brief block (paste into every implementer brief)

> - Every control is a Udixio component (Button, IconButton, Chips, Tabs, Switch, Slider, TextField…), in examples, scenes
>   and the site's chrome. Native elements only in the HTML tab and for the element that is itself the animation. Before
>   reporting, grep `<button|<input|<select|role="tab"` in the files you touched and justify each native one.
> - Style with Tailwind classes and the Udixio theme tokens: no new `.css` file, no `<style>` block, no hard-coded colour,
>   radius or spacing; only what has no utility goes in a Tailwind v4 `@utility` reading the theme's variables.
> - `apps/doc` changes with the code it documents, in the same task: pages, examples, API data, nav, llms.txt.
> - After a removal or a rename, grep `apps/doc` (and `packages/*/README.md`, `plugins/`) for the old name, and run the
>   throwaway-tsconfig sweep of `apps/doc/AGENTS.md` (outside the repo, no `references`, `paths` mapping `@udixio/*` to each
>   package's `src/index.ts` and `@/*` to `./src/*`, `src/examples/angular/**` excluded; ignore `astro:content` and
>   `import.meta.glob` errors). Report what it finds in your files.
> - Animation: `@udixio/motion` only; no new engine or mechanism without asking.
> - Format the files you changed with `pnpm exec prettier --write <files>` (not `pnpx`).

## Review Focus

1. **A current page read in a framework its `ForFramework` does not name** (only a default slot, or no slot for `html`):
   the reading shows the default variant, or nothing, never another framework's text, and holds no `hidden` variant.
   Pinned in Task 5/9 (`built-site.test.mjs`, "no reading holds a framework variant").
2. **A code block without the reading's framework** (a CSS or HTML-only block on the React reading): it shows its first
   framework's code without tabs, never an empty card. Pinned in Task 5/9 ("every code block of a reading shows code").
3. **A tab-less link with a hash** (`/motion/layout#rules`): it is rendered `/<fw>/motion/layout/guide#rules`, costs no
   redirect, and the anchor exists in the target. Pinned in Task 2/9 (unit) and Task 5/9 ("every internal hash names an id
   of its target page").
4. **A trailing slash, a query or a hash** (`/react/motion/presence/guide/`, `?x=1#y`): `splitFramework`, `withFramework`,
   the stub and the side panel's active page compare without the slash and keep query and hash. Pinned in Task 2/9 and
   Task 4/9 (stub) and Task 7/9 (side panel).
5. **A stored framework that is not one of the four** (`vue`, `''`, none, a storage that throws): the stub goes to React and
   the address never holds `undefined` or `null`. Pinned in Task 4/9.

## Parallel groups

| Group | Tasks         | Runs                                                 | Why not more parallel                                                                                                                        |
| ----- | ------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | 1/9, 2/9      | parallel                                             | disjoint: 1/9 owns `packages/motion`, 2/9 owns the URL module, `motion-nav.ts`, `motion-facts.ts`, `astro.config.ts`                         |
| 2     | 3/9           | serial, after group 1 and Q1                         | shares `motion-nav.ts`, `motion-facts.ts` with 2/9 and needs 1/9's exports to regenerate `motion-api.json`                                   |
| 3     | 4/9, then 5/9 | serial, after 3/9 and the commit of `gestures.astro` | 4/9 renames the pages 5/9 edits; both edit `MotionPage.astro`                                                                                |
| 4     | 6/9, 7/9, 8/9 | parallel, after 5/9                                  | disjoint: 6/9 the switch and `framework-tabs` suite; 7/9 nav, layout, search, `framework-urls` and `built-site` suites; 8/9 the other suites |
| 5     | 9/9           | controller                                           | everything                                                                                                                                   |

---

### Task 1/9: remove scrollTo, page transitions and the time value from the package (group 1)

Implementer: Haiku, effort `high`. Review: Sonnet.

**Files:**

- Delete: `packages/motion/src/scroll-to.ts`, `scroll-entry.ts`, `scroll-to.browser.spec.ts`, `navigate.ts`,
  `navigate.browser.spec.ts`, `page.ts`, `astro.ts`, `astro.browser.spec.ts`, `packages/motion/scripts/route-css.test.mjs`
- Modify: `packages/motion/package.json` (`./scroll`, `./page`, `./astro` out of `exports` and `publishConfig.exports`;
  `route-css.test.mjs` out of the `nx.targets.test` command), `vite.config.mts` (the three entries), `.size-limit.json`
  (`scroll`, `page`, `astro`), `size-report.json` (the same three keys), `public/motion.css` (the "Page transitions" block:
  the `::view-transition-*` rules and `@keyframes udx-route-*`), `src/value.ts`, `src/value-binding.ts`,
  `src/value.spec.ts`, `src/value-binding.browser.spec.ts` (`'time'` out), `src/contract.ts` (`'view-transition'` out of
  `Capability` when no other source names it after the deletions; else keep it and say where it is used),
  `scripts/generate-motion-manifest.mjs` (`scrollTo` at line 101, `timeValue` at line 99, and any page or astro entry) and
  the regenerated `motion-manifest.json`, `src/manifest.spec.ts`, `scripts/package-exports.test.mjs` (the tests whose subject
  is a removed entry), `README.md` ("Page transitions", "Scroll", the time source in "Values", every other mention)
- Test: `scripts/package-exports.test.mjs`, `src/value.spec.ts`, `src/motion-css.browser.spec.ts`

**Interfaces:**

- Produces: `ValueSource = 'pointer' | 'scroll' | 'state'`; no `@udixio/motion/scroll`, `/page`, `/astro`. Task 3/9 relies
  on these names being gone when it regenerates `apps/doc/src/data/motion-api.json`.

- [ ] **Step 1: Write the failing tests**
  - `package-exports.test.mjs`, `the retired entries are in neither export map`: for `./scroll`, `./page`, `./astro`,
    `pkg.exports[entry]` and `pkg.publishConfig.exports[entry]` are `undefined`.
  - `value.spec.ts`, `a time source is refused`: `defineValue('t', { source: 'time' } as never)` throws
    `/\/source: invalid_value/`; `validateValueSpec({ source: 'time' })` reports the same issue. Delete the tests that
    define a time value (lines 83, 84, 95, 104 to 111, 180, 218 today) and the three `bv-loop*` definitions of
    `value-binding.browser.spec.ts` with their tests.
  - `motion-css.browser.spec.ts` (or the existing CSS spec that loads `public/motion.css`), `motion.css writes no page
transition`: the stylesheet text matches neither `/view-transition/` nor `/udx-route-/`.
- [ ] **Step 2: Run them to see them fail:** `cd packages/motion && npx vitest run --project unit src/value.spec.ts`
      (FAIL: a time source is accepted). The export-map test is run by the controller after the build (it reads `dist`).
- [ ] **Step 3: Implement** the deletions above. In `value-binding.ts` remove the period branch and every `source === 'time'`
      test; in `value.ts` remove `'time'` from `ValueSource` and `SOURCES` and the `time`-only validation. Grep
      `packages/motion packages/ui-react/src packages/ui-angular/src packages/ui-svelte/src packages/core/src` for
      `scrollTo|scrollDestination|ScrollToOptions|ScrollPosition|ScrollHandle|navigate\(|NavigationDirection|connectAstroTransitions|data-motion-direction|udx-route|'time'|timeValue`
      and remove each hit that names the removed API (`window.scrollTo` in browser specs and `packages/core` custom scroll are
      not it). Regenerate: `node scripts/generate-motion-manifest.mjs`, then `--check`.
- [ ] **Step 4: Run the targeted checks:** `npx vitest run --project unit src/value.spec.ts src/manifest.spec.ts` PASS;
      `npx tsc --noEmit -p tsconfig.spec.json` no new error; `node scripts/generate-motion-manifest.mjs --check` PASS;
      `MOTION_BROWSERS=chromium npx vitest run --project browser src/motion-css.browser.spec.ts src/value-binding.browser.spec.ts`
      PASS.
- [ ] **Step 5: Commit**
      `git commit -m "feat(motion)!: remove scrollTo, page transitions, the astro adapter and the time value" -- <paths>`

### Task 2/9: the framework URL module and the page data (group 1)

Implementer: Haiku, effort `high`. Review: Sonnet.

**Files:**

- Create: `apps/doc/src/lib/framework-url.ts`, `apps/doc/tests/framework-url.test.mjs`, `apps/doc/tests/motion-url.mjs`
- Modify: `apps/doc/src/lib/motion-nav.ts`, `apps/doc/src/lib/motion-facts.ts` (`FRAMEWORK_LINES`; the `size-report.json`
  import gains `with { type: 'json' }` so that Node loads it), `apps/doc/astro.config.ts` (the four `redirects` removed;
  `redirects: frameworkRedirects(neutralPaths)` where `neutralPaths` are the URLs of `src/data/pages/**` computed as
  `[...url].astro` computes them, read with `node:fs`, plus `/themes`, `/theme/builder`, `/`; the sitemap `filter` also drops
  `isFrameworkStub` paths, and a `serialize` strips the trailing slash as `canonicalUrl` does)

**Interfaces:**

- Produces (`motion-nav.ts`):
  - `MotionNeed.perFramework: boolean` (false for the six neutral slugs of Global Constraints, true for every other entry,
    `counters` included);
  - `type AuthoredTab = 'overview' | 'guide'`; `MotionNeed.tabs?: readonly AuthoredTab[]`, `['guide']` on every feature of
    Global Constraints and, until Task 3/9 deletes them, on `scroll` and `page-transitions`;
  - `MotionNeed.features?: readonly string[]` on the five recipes (values of Global Constraints);
  - `motionTitle(need: MotionNeed, framework?: ExampleFramework, tab?: FeatureTab): string` and
    `motionDescription(need: MotionNeed, framework?: ExampleFramework, tab?: FeatureTab): string` (Global Constraints).
- Produces (`framework-url.ts`; runtime imports are relative `.ts` paths only, so `node --test` loads it; the store module is
  imported as `../stores/exampleFrameworkStore.ts`):
  - `type FeatureTab = 'overview' | 'guide' | 'api' | 'examples'`; `FEATURE_TABS: readonly FeatureTab[]` in that order;
    `FEATURE_TAB_LABELS: Record<FeatureTab, string>`;
  - `readingFramework(value: unknown): ExampleFramework | undefined` (one of the four ids, else undefined: what
    components call on `Astro.params.framework`);
  - `splitFramework(pathname: string): { framework?: ExampleFramework; path: string }` (strips a leading id and a trailing
    slash; `/svelte` gives `{ framework: 'svelte', path: '/' }`);
  - `splitMotionPath(path: string): { slug: string; tab?: FeatureTab }` (`/motion/presence/guide` gives
    `{ slug: 'presence', tab: 'guide' }`; `/motion/recipes/dialog` gives `{ slug: 'recipes/dialog' }`; query and hash ignored);
  - `featureTabs(slug: string): FeatureTab[]` (`FEATURE_TABS` filtered to the need's authored tabs, plus `examples` when two
    recipes or more list the slug in `features`; `[]` for a page that is not a feature);
  - `defaultTab(slug: string): FeatureTab | undefined` (`featureTabs(slug)[0]`);
  - `hasFrameworkVariants(path: string): boolean`;
  - `withFramework(path: string, framework: ExampleFramework | undefined): string` (a framework-dependent path gets the
    prefix, and a tab-less feature path its default tab, before query and hash; a neutral path, or no framework, is
    returned unchanged);
  - `docLink(href: string, framework: ExampleFramework | undefined): { href: string; frameworkLink: boolean }` (on a reading,
    `withFramework(href, framework)`; on a neutral page, a framework-dependent target is `withFramework(href, 'react')` with
    `frameworkLink: true`; any other href, external ones included, unchanged);
  - `motionPagePaths(): { path: string; slug: string; tab?: FeatureTab }[]` (bare path of every framework-dependent page:
    one per tab of a feature, one for any other page; entries whose `href` holds a `#` are not pages);
  - `frameworkRedirects(neutralPaths: readonly string[]): Record<string, string>` (neutral motion pages under the four
    prefixes, `neutralPaths` under three, `/<fw>` to `/`, and `/<fw>/motion/<feature>` to its default tab under the four);
  - `isFrameworkStub(path: string): boolean` (a bare framework-dependent path, with or without its tab, or a tab-less
    feature path);
  - `canonicalUrl(pathname: string, site: string | URL): string` (`new URL(pathname, site)` without its trailing slash, the
    root keeping its own).
- Produces (`tests/motion-url.mjs`): `motionUrl(slug: string, framework = 'react', tab?: FeatureTab): string` (bare for a
  neutral slug; a feature without `tab` gets its default tab).

- [ ] **Step 1: Write the failing tests** in `framework-url.test.mjs` (node, imports `../src/lib/framework-url.ts` and
      `../src/lib/motion-nav.ts`):
  - `splitFramework strips a framework prefix only`: `/react/motion/presence/guide/` gives
    `{ framework: 'react', path: '/motion/presence/guide' }`; `/motion/glossary` gives `{ path: '/motion/glossary' }`;
    `/reactive/x` has no framework; `/svelte` gives `{ framework: 'svelte', path: '/' }`.
  - `featureTabs reads the data`: `featureTabs('presence')` is `['guide', 'examples']`; `featureTabs('layout')` is
    `['guide', 'examples']`; `featureTabs('emphasis')` is `['guide']`; `featureTabs('getting-started')` is `[]`.
  - `withFramework prefixes, resolves the default tab, keeps query and hash`: `('/motion/layout?x=1#rules', 'angular')` gives
    `/angular/motion/layout/guide?x=1#rules`; `('/motion/presence/examples', 'svelte')` gives
    `/svelte/motion/presence/examples`; `('/motion/recipes/dialog', 'html')` gives `/html/motion/recipes/dialog`;
    `('/motion/values#counters', 'react')` gives `/react/motion/values/guide#counters`; `('/motion/glossary', 'react')`
    gives `/motion/glossary`; `('/motion/presence', undefined)` gives `/motion/presence`.
  - `docLink marks a framework link on a neutral page only`: `docLink('/motion/presence', undefined)` is
    `{ href: '/react/motion/presence/guide', frameworkLink: true }`; `docLink('/motion/presence', 'svelte')` is
    `{ href: '/svelte/motion/presence/guide', frameworkLink: false }`; `docLink('/motion/glossary#term-box', 'svelte')`
    and `docLink('https://example.com', undefined)` are unchanged with `frameworkLink: false`.
  - `frameworkRedirects covers neutral pages and tab-less features`: for `['/theme/colors', '/get-started/introduction',
'/agents', '/mcp', '/themes', '/theme/builder', '/']`, it maps `/react/motion/glossary` to `/motion/glossary`,
    `/html/motion/api` to `/motion/api`, `/svelte/motion` to `/motion`, `/angular/theme/colors` to `/theme/colors`,
    `/react/get-started/introduction`, `/svelte/agents`, `/angular/mcp`, `/react/themes` to their bare paths, `/react` to `/`,
    `/react/motion/presence` to `/react/motion/presence/guide`; it holds no `/html/theme/colors`, no `/html`, no
    `/react/components/…`, and no key that is a path of `motionPagePaths()` under a prefix.
  - `motionPagePaths lists every reading once`: holds `/motion/presence/guide`, `/motion/presence/examples`,
    `/motion/recipes/dialog`, `/motion/getting-started`; holds no `/motion/presence`, no neutral path, no `#`.
  - `isFrameworkStub`: true for `/motion/presence`, `/motion/presence/guide`, `/motion/recipes/dialog`; false for
    `/react/motion/presence/guide` and `/motion/glossary`.
  - `canonicalUrl drops the trailing slash but the root's`: `('/react/motion/presence/guide/', 'https://ui.udixio.fr/')` gives
    `https://ui.udixio.fr/react/motion/presence/guide`; `('/', …)` gives `https://ui.udixio.fr/`.
  - `readingFramework accepts the four ids only`: `'svelte'` gives `'svelte'`; `'vue'`, `''`, `undefined` give `undefined`.
  - `titles and descriptions name the reading and the tab`: presence in svelte, no tab: `'Presence in Svelte · Motion'`;
    guide: `'Presence guide in Svelte · Motion'`; examples: `'Presence examples in Svelte · Motion'`; glossary:
    `'Glossary · Motion'`; home: `'Motion'`; the guide's description starts with `'The complete guide. '` and ends with
    `FRAMEWORK_LINES.svelte`; `FRAMEWORK_LINES.angular` is `'In Angular, with the directives of @udixio/ui-angular.'`.
  - `the neutral motion pages are the six of the spec`: the slugs with `perFramework: false` are, as a set,
    `['', 'glossary', 'limits', 'roadmap', 'loading-and-weight', 'api']`.
- [ ] **Step 2: Run it to see it fail:** `cd apps/doc && node --test tests/framework-url.test.mjs` (FAIL: module missing).
- [ ] **Step 3: Implement** the Interfaces above (spec §2.6, §2.8, §2.9, §2.10). `framework-url.ts` holds the whole rule;
      `astro.config.ts` and the tests only call it.
- [ ] **Step 4: Run it:** PASS. Then
      `node -e "import('./src/lib/framework-url.ts').then(m => console.log(Object.keys(m.frameworkRedirects([])).length))"` prints
      a number above 0.
- [ ] **Step 5: Commit** `git commit -m "feat(doc): one module for framework URLs, feature tabs, redirects and reading titles" -- <paths>`

### Task 3/9: remove the retired pages and mentions from the doc (group 2)

Implementer: Haiku, effort `high`. Review: none (mechanical; the final review covers it). Starts after Tasks 1/9 and 2/9,
and after Joël has answered Q1 (the controller pastes the answer in the brief).

**Files:**

- Delete: `apps/doc/src/pages/motion/scroll.astro`, `page-transitions.astro`; `apps/doc/src/examples/{react,angular,svelte,html}/motion-scroll.*`,
  `motion-page-transitions-player.*`, `motion-page-transitions-router.*` (12 files); any scene, demo or preview used by
  these two pages only (grep first)
- Modify: `apps/doc/src/lib/motion-nav.ts` (the `scroll` and `page-transitions` entries, and their slugs in every
  `related`), `apps/doc/src/lib/motion-facts.ts` (entries `scroll`, `page`, `astro`; the "View Transitions" row of
  `FEATURES` when nothing else cites it), `apps/doc/scripts/motion-api.groups.mjs` (the removed exports, the
  `data-motion-direction` attribute row, `scrollTo` in the essentials list, the intros that name scrolling to a target,
  changing pages or the time) and the regenerated `apps/doc/src/data/motion-api.json`,
  `apps/doc/src/components/motion/MotionOptions.astro` (the `scrollTo` rows), `components/motion/root/NeedCard.astro` and
  `root/previews.ts` (the `scroll` and `page-transitions` branches), `apps/doc/src/styles/global.css` (the page-transitions
  demo block), `apps/doc/public/llms.txt` (two lines), the prose of `accessibility`, `choosing-an-api` (`source: 'time'`
  card and the loops section: its heading text loses "or a time value", its id `loops` stays), `how-it-works`, `limits`,
  `roadmap`, `scrub`, `tokens`, `values` (the `time` source, option rows and reduced-motion sentence), `loop` (the
  `source: 'time'` card); tests: `pages.browser.test.mjs` (the two URLs), `motion.browser.test.mjs` (the `/motion/scroll/`
  test), `motion-page-claims.browser.test.mjs` (B8), `animation.browser.test.mjs` (`navigate` and `scrollTo` in the
  functions list, the two gallery cards), `motion-examples.test.mjs` when it lists the deleted examples
- Modify per Q1: `apps/doc/src/layouts/layout.astro` (lines 182 to 188: the `@udixio/motion/astro` import and the
  `connectAstroTransitions()` call), and, under answer A only, the doc's own slide (see Step 3)

**Interfaces:**

- Consumes: Task 1/9's removed names; Task 2/9's `MotionNeed` fields (the two deleted entries carry them).

- [ ] **Step 1: Write the failing check**: in `apps/doc/tests/framework-url.test.mjs` add `no retired page or export is
referenced`: `MOTION_NEEDS` has no slug `scroll` or `page-transitions` and no `related` naming them, and the text of
      `src/data/motion-api.json` matches neither `/"(scrollTo|navigate|connectAstroTransitions|NavigationDirection)"/` nor
      `/'time'/`. Run `node --test tests/framework-url.test.mjs`: FAIL.
- [ ] **Step 2: Remove** the files and passages above. Keep each page's other content as it is: delete the sentence, row or
      card that names the removed API; rewrite a sentence only where removing a clause leaves it wrong.
- [ ] **Step 3: Apply Q1** in `layout.astro`: answer A, keep the slide locally (the direction listener of the removed
      `astro.ts` as a few lines of the layout's script, and the route rules in a Tailwind v4 `@utility` of the doc reading
      the theme's motion variables); answer B, delete the import and the call (Astro's default ClientRouter animation remains);
      answer C, delete them and set the ClientRouter's animation to none on the root. Then grep `apps/doc/src` for
      `data-motion-direction|view-transition` and leave only what the answer keeps.
- [ ] **Step 4: Regenerate and check:** `node scripts/motion-api.mjs`, then `node scripts/motion-api.mjs --check` and
      `node --test scripts/motion-api.test.mjs` PASS; `node --test tests/framework-url.test.mjs tests/motion-examples.test.mjs`
      PASS; `grep -rnE "scrollTo\(|@udixio/motion/(scroll|page|astro)|connectAstroTransitions|source: 'time'" apps/doc/src apps/doc/public plugins`
      finds nothing but `window.scrollTo`; the throwaway-tsconfig sweep adds no error.
- [ ] **Step 5: Commit** `git commit -m "docs(motion)!: drop scrollTo, page transitions and the time value from the docs" -- <paths>`

### Task 4/9: routes, stubs, readings of the current pages, the tab header (group 3)

Implementer: Haiku, effort `max`. Review: Sonnet. Starts once `gestures.astro` is committed.

**Files:**

- Create: `apps/doc/src/pages/[framework]/motion/[...path].astro`, `apps/doc/src/pages/motion/[...path].astro`,
  `apps/doc/src/components/motion/FrameworkStub.astro`, `apps/doc/src/components/motion/MotionExamples.astro`,
  `apps/doc/src/components/motion/MotionNeedLink.astro` (the card `<li>` of `MotionRelated`, extracted so that both use it),
  `apps/doc/src/components/PageTabs.tsx`, `apps/doc/tests/framework-urls.browser.test.mjs`
- Rename (`git mv`, content unchanged): every framework-dependent page `src/pages/motion/<slug>.astro` to
  `_<slug>.astro`, and `src/pages/motion/recipes/<name>.astro` to `recipes/_<name>.astro`. The neutral pages
  (`glossary`, `limits`, `roadmap`, `loading-and-weight`, `api`), `index.astro` and `fixtures/` keep their names and URLs.
- Modify: `apps/doc/src/components/MotionPage.astro`, `apps/doc/src/components/motion/MotionRelated.astro`,
  `apps/doc/scripts/motion-api.mjs` (line 577: `hasPage` reads `MOTION_NEEDS` through `motionPagePaths()` instead of the
  file system), `apps/doc/tests/motion-examples.test.mjs` (the page paths), `apps/doc/AGENTS.md` (one line: where the
  motion pages live and that the prefixed route serves them per framework)

**Interfaces:**

- Consumes: Task 2/9's `framework-url.ts` and `motion-nav.ts`.
- Produces:
  - the prefixed route: `getStaticPaths()` returns, for each of the four ids and each `motionPagePaths()` entry,
    `{ params: { framework, path }, props: { slug, tab } }`; it renders `MotionExamples` for the `examples` tab, else the
    page component of the slug from `import.meta.glob('/src/pages/motion/**/_*.astro', { eager: true })`, and fails the
    build for a slug with no component. Files prefixed with `_` are not routed by Astro [Doc: docs.astro.build, routing,
    "Excluding pages"; check it before relying on it].
  - the bare route: one `FrameworkStub` per `motionPagePaths()` path and per tab-less feature path.
  - `FrameworkStub.astro` props `{ path: string }`: a document of its own, not the site `Layout` (spec §2.5): `<title>` from
    `motionTitle`, `<link rel="canonical">` to `canonicalUrl(withFramework(path, 'react'), Astro.site)`, an `is:inline` head
    script that reads the storage key in a `try`, checks it against the four ids (anything else gives `react`) and calls
    `location.replace(target + location.search + location.hash)` with the four targets written at build time, a
    `<noscript>` meta refresh to the React target, a body with `data-pagefind-ignore` listing the four readings as links,
    styled with the site's stylesheet and tokens.
  - `PageTabs.tsx`: `PageTabs({ tabs, pathname, label }: { tabs: readonly { label: string; href: string }[]; pathname: string; label: string })`:
    Udixio `Tabs` variant `secondary`, one `Tab` with `href` per tab (the look of `ComponentNavigation`); the selected tab is
    the one whose `href` equals `pathname` without its trailing slash, computed from the prop, never from `window`, so it
    hydrates clean. Labels from `FEATURE_TAB_LABELS`.
  - `MotionPage.astro`: on a reading (`readingFramework(Astro.params.framework)` set), the tab comes from
    `splitMotionPath('/motion/' + Astro.params.path)`; `Layout` gets `motionTitle(need, framework, tab)` and
    `motionDescription(need, framework, tab)` (the page's `title` and `description` props are ignored there); the header is
    eyebrow, H1, need, summary, chips; "Written for" (`FrameworkSwitch`) sits on the title's row at the right from `lg`,
    under the summary below; `PageTabs` is the last row, full width, when `featureTabs(slug).length >= 2` (Q3); the
    switch shows on every reading whatever the page's `frameworkSwitch` prop says. On a bare page nothing changes.
  - `MotionExamples.astro` props `{ slug: string }`: `MotionPage` for the need, then one `MotionNeedLink` per recipe whose
    `features` hold the slug, in `MOTION_NEEDS` order, linked with `withFramework(href, framework)`.

- [ ] **Step 1: Write the failing tests** in `framework-urls.browser.test.mjs` (Playwright, `MOTION_DOC_URL`,
      `MOTION_BROWSERS`, URLs from `tests/motion-url.mjs`):
  - `each reading of Presence answers with its framework in the title`: `/react|angular|svelte|html/motion/presence/guide`
    answer 200 and their titles are `motionTitle(presence, fw, 'guide') + ' — Udixio UI'`.
  - `a page without tabs answers at its reading`: `/svelte/motion/getting-started` and `/html/motion/recipes/dialog` answer
    200 with an H1.
  - `the stub goes to the stored framework, keeping query and hash`: with `svelte` stored, `/motion/presence?x=1#options`
    ends at `/svelte/motion/presence/guide?x=1#options`; `/motion/presence/examples` ends at
    `/svelte/motion/presence/examples`.
  - `the stub without a stored choice goes to React`: `/motion/recipes/dialog` ends at `/react/motion/recipes/dialog`.
  - `the stub goes to React for anything else`: for `vue`, `''`, and a storage whose `getItem` throws (an init script), the
    address ends at the React reading and never contains `undefined` or `null`.
  - `a feature's tab header marks its tab and opens the other`: on `/react/motion/presence/guide` the header has two tabs,
    "Guide" selected and "Examples" linking to `/react/motion/presence/examples`; `/react/motion/emphasis/guide` has no tab
    header (Q3).
  - `the Examples tab lists the recipes of the feature`: `/angular/motion/presence/examples` lists Dialog, Toasts, Accordion,
    Navigation menu, each linking under `/angular/`; `/angular/motion/layout/examples` lists Accordion and Tab indicator.
- [ ] **Step 2: Run to see them fail:** one `npx astro dev --port 4330` (load < 8), then
      `MOTION_BROWSERS=chromium MOTION_DOC_URL=http://localhost:4330 node --test --test-concurrency=1 tests/framework-urls.browser.test.mjs`: FAIL.
- [ ] **Step 3: Implement** the Interfaces above (spec §2.3, §2.5, §2.9, §2.10). Do not edit the renamed pages beyond the
      rename.
- [ ] **Step 4: Run them:** PASS on Chromium, same server. Also: `/motion/glossary`, `/motion` and `/motion/api` still
      answer 200 at their bare URLs; `node --test tests/motion-examples.test.mjs` and `node scripts/motion-api.mjs --check`
      PASS. Screenshots of `/react/motion/presence/guide` header at 1280 and 375 px, light and dark, in the report. Stop the
      server by its PID.
- [ ] **Step 5: Commit** `git commit -m "feat(doc): motion pages answer under a framework prefix, with stubs and tabs" -- <paths>`

### Task 5/9: one framework per reading, links through DocLink, the built-site test (group 3, after 4/9)

Implementer: Haiku, effort `max`. Review: Sonnet.

**Files:**

- Create: `apps/doc/src/components/DocLink.astro`, `apps/doc/tests/built-site.test.mjs`
- Modify: `apps/doc/src/components/ForFramework.astro`, `ApiName.astro`, `components/motion/Choice.astro`,
  `components/Code.astro`, `components/motion/MotionUsage.astro` (one framework on a reading), every renamed page
  `src/pages/motion/**/_*.astro` and the neutral pages `glossary`, `limits`, `roadmap`, `loading-and-weight`, `api`
  (codemod: an internal `<a href=…>…</a>` becomes `<DocLink href=…>…</DocLink>`, attributes kept), `MotionPage.astro` (the
  eyebrow link), `MotionNeedLink.astro`, `motion/Choices.astro`, `motion/MotionTokens.astro`,
  `motion/api/ApiSpecFields.astro`, `motion/root/Facts.astro`, `motion/root/Hero.astro`, `motion/scenes/Presets.astro`,
  `motion/root/NeedCard.astro` (their static links to motion pages through `DocLink` or `docLink()`), `src/pages/[...url].astro`
  and `src/pages/components/[component]/overview.astro` (`components={{ pre: Code, a: DocLink }}`)

**Interfaces:**

- Consumes: Task 2/9 (`readingFramework`, `docLink`, `withFramework`, `splitFramework`, `isFrameworkStub`,
  `motionPagePaths`, `frameworkRedirects`, `canonicalUrl`, `motionTitle`, `motionDescription`), Task 4/9 (the routes).
- Produces:
  - `DocLink.astro` props `{ href: string } & HTMLAttributes<'a'>`: renders `docLink(href, readingFramework(Astro.params.framework))`,
    with `data-framework-link` when `frameworkLink`.
  - The reading rule, the same in the five components: on a reading, `ForFramework` renders only the reading's slot, else
    its default slot, else nothing, with no `data-framework-variant` and no `hidden`; `ApiName` renders the reading's name
    (or `fallback`) as plain `<code>`; a `Choice` with `frameworks` renders only when they include the reading; `Code`
    renders the reading's framework when the block has it, else its first framework, with no framework tabs; `MotionUsage`
    passes only the reading's code and slot to `Code`. Without a reading, all five behave as today.

- [ ] **Step 1: Write the failing tests** in `built-site.test.mjs` (node; reads `apps/doc/.vercel/output`; skips with a
      message when it is absent; HTML parsed with the parser already in the doc's dependencies, or regular expressions on
      attributes):
  - `every internal link is classified correct` (spec §2.8 and §2.10): a bare neutral URL is correct; a bare
    framework-dependent URL is an error; a prefixed framework-dependent URL is correct, and on a reading its prefix is the
    page's own except inside the switch; a prefixed neutral URL is an error; a tab-less feature, a tab the feature lacks,
    a `/motion/…` path that is no page (fixtures aside) and `/<fw>/components/…` are errors. Stubs are not scanned.
  - `every internal hash names an id of its target page` (motion pages only).
  - `the four readings of a page have equal heading ids`.
  - `no reading holds a framework variant`: no `data-framework-variant` and no `[data-code-tab]` in a reading.
  - `every code block of a reading shows code`: each `[data-example-panel]` group holds one panel with non-empty code.
  - `a reading's title is motionTitle and its description ends with its FRAMEWORK_LINES sentence`.
  - `a stub lists four readings, points its canonical to React, and is ignored by Pagefind`.
  - `config.json holds the redirects` (spec §2.6, criteria 7 and 12): 301 for `/react/get-started/introduction`,
    `/svelte/agents`, `/angular/mcp`, `/react/themes`, `/react`, `/svelte/motion/glossary`, `/react/motion/presence`
    (to `/react/motion/presence/guide`), each before `handle: filesystem` and with no HTML file; nothing for
    `/react/components/button/overview` nor `/html/theme/colors`.
  - `the sitemap lists readings and neutral pages, no stub, fixture or roadmap`.
- [ ] **Step 2: Implement** the reading rule and `DocLink`; run the codemod as a script outside the repository (scratchpad),
      on the files listed above, then read its diff: only `<a`/`</a>` of internal links change, and an import of `DocLink` is
      added where needed. External links, `#…` links and links inside code examples stay `<a>`.
- [ ] **Step 3: Check** on one `npx astro dev --port 4330` (load < 8), with `curl`: `/svelte/motion/presence/guide` holds no
      `data-framework-variant`, no `[data-code-tab]`, its links to motion pages start with `/svelte/motion/`; `/motion/glossary`
      links to framework pages start with `/react/motion/` and carry `data-framework-link`; `/components/menu/overview` links to
      motion pages the same way. Then Chromium:
      `MOTION_BROWSERS=chromium MOTION_DOC_URL=http://localhost:4330 node --test --test-concurrency=1 tests/framework-urls.browser.test.mjs`
      still PASSes. Stop the server.
- [ ] **Step 4: Commit** `git commit -m "feat(doc): each reading shows one framework and links within it" -- <paths>`
- [ ] **Step 5 (controller): build check.** Build per Task 9/9's recipe, timing `npx astro build` against the last build
      before Task 4/9; `node --test tests/built-site.test.mjs`: PASS, except links rendered by the rail, the side panel and `GettingStartedLink` (islands, fixed by Task 7/9), which it lists; report both build times and the page count.

### Task 6/9: the framework switch is a navigation (group 4)

Implementer: Haiku, effort `max`. Review: Sonnet.

**Files:**

- Create: `apps/doc/src/lib/reading-position.ts`
- Modify: `apps/doc/src/components/FrameworkSwitch.astro`, `apps/doc/src/components/FrameworkTabs.tsx`
- Test: `apps/doc/tests/framework-tabs.browser.test.mjs` (rewritten for the switch as links)

**Interfaces:**

- Consumes: `withFramework`, `splitFramework`, `readingFramework` (Task 2/9); `MotionPage` places the switch (Task 4/9).
- Produces: `type ReadingPosition = { ids: string[]; offset: number }`, `rememberReadingPosition(): ReadingPosition`,
  `restoreReadingPosition(position: ReadingPosition): void`; `FrameworkSwitchLinks({ labelledBy, current, hrefs }: { labelledBy: string; current: ExampleFramework; hrefs: Record<ExampleFramework, string> })`
  replaces `FrameworkSwitchRadios` (removed: `FrameworkSwitch.astro` is its only user): Udixio `Tab` with `href`,
  `aria-current="page"` on the current one; a click stores the choice (`setPreferredExampleFramework`), remembers the
  position and calls Astro's `navigate(href + location.hash)` (`astro:transitions/client`, not the removed motion one); on
  `astro:after-swap` the position is restored. `FrameworkSwitch.astro` builds `hrefs` at build time from the page's bare
  path and the four ids, is visible without JavaScript, and shows only on a reading.

- [ ] **Step 1: Write the failing tests**: `the switch is four links, the current one aria-current`; `the switch works
without JavaScript` (`javaScriptEnabled: false`: clicking Svelte on `/react/motion/presence/guide` opens
      `/svelte/motion/presence/guide`); `a switch keeps the tab` (on `/react/motion/presence/examples` Svelte opens
      `/svelte/motion/presence/examples`); `a switch keeps the heading under the reading line and the hash` (scroll to the
      page's third `h2`, switch, the same heading is within 4 px of its offset; with `#options` in the URL the hash stays);
      `Back returns to the framework left`; `a click on the switch stores the choice`.
- [ ] **Step 2: Run to see them fail** (one dev server, Chromium, this file only): FAIL.
- [ ] **Step 3: Implement** spec §2.7 with the Interfaces above.
- [ ] **Step 4: Run them:** PASS on Chromium, then the same file on WebKit (scroll keeping). Stop the server.
- [ ] **Step 5: Commit** `git commit -m "feat(doc): the framework switch navigates between readings and keeps the place" -- <paths>`

### Task 7/9: rail, side panel, head script, canonical and search (group 4)

Implementer: Haiku, effort `max`. Review: Sonnet.

**Files:**

- Modify: `apps/doc/src/components/Navigation.tsx` (`sectionFromPathname` on `splitFramework(pathname).path`),
  `apps/doc/src/components/Sidebar.tsx` (active page on bare paths, a feature marked on any of its tabs; links through
  `withFramework`), `apps/doc/src/components/motion/root/GettingStartedLink.tsx` (an island: the same hydration rule),
  `apps/doc/src/layouts/layout.astro` (canonical; Pagefind filter; head script), `apps/doc/src/lib/framework-choice.ts`,
  `apps/doc/src/components/DocumentationSearch.tsx` (`filters: { framework: <stored> }`)
- Test: `apps/doc/tests/framework-urls.browser.test.mjs` (extended), `apps/doc/tests/built-site.test.mjs` (three subtests
  added)

**Interfaces:**

- Consumes: Task 2/9 (`splitFramework`, `splitMotionPath`, `withFramework`, `canonicalUrl`, `readingFramework`).
- Produces, the hydration rule (spec §2.8) for every island that renders a link to a framework-dependent page: its first
  render, on the server and at hydration, uses props only (the prefix of its `pathname` prop, else `react`) and never the
  store; after mount it takes the pathname's prefix, else the stored choice, and follows the store and client navigations;
  an island never renders `data-framework-link`. The layout: `<link rel="canonical" href={canonicalUrl(Astro.url.pathname, Astro.site)}>`
  on every page; in the `<head>`, `<meta data-pagefind-filter="framework[content]" content="<id>">`, one for a reading,
  four on every page that is not a reading (rule from `splitFramework`, never a list of sections); the head script
  rewrites the prefix of static `[data-framework-link]` links to the stored framework before the first paint and on
  `astro:before-swap`, and touches no island's HTML. `framework-choice.ts`: nothing on a reading writes the store.

- [ ] **Step 1: Write the failing tests**: browser: `the rail opens Animation on a prefixed URL and marks the page`;
      `the side panel marks a feature on each of its tabs` (`/react/motion/presence/examples` marks Presence); `rail and side
panel links keep the reading's prefix`; `a neutral page rewrites its static framework links to the stored choice before
the first paint`; `on /motion/glossary with Svelte stored, no console error or warning, and after hydration the side
panel's framework links start with /svelte/`; `on /angular/motion/presence/guide with Svelte stored they start with
/angular/`; `opening a reading does not change the stored choice`; `with Svelte stored, search finds
/components/button/overview and /theme/colors, and only the Svelte reading of a framework page` (skips on a dev server:
      it needs the Pagefind index). `built-site.test.mjs`: `every page has a canonical equal to canonicalUrl of its path`;
      `each canonical equals its sitemap entry as a string`; `a reading declares its one framework filter, every other page the
four`.
- [ ] **Step 2: Run to see them fail** (one dev server, Chromium, `framework-urls.browser.test.mjs` only): FAIL.
- [ ] **Step 3: Implement** spec §2.8 and §2.9 with the Interfaces above (canonical through `astro-seo`'s `canonical` if the
      layout uses it, else a `<link>`).
- [ ] **Step 4: Run them:** PASS on Chromium, then the same file on WebKit and Firefox (hydration). Stop the server.
- [ ] **Step 5: Commit** `git commit -m "feat(doc): navigation, search and canonical follow the reading" -- <paths>`

### Task 8/9: test URLs through motionUrl (group 4)

Implementer: Haiku, effort `high`. No task review.

**Files:** Modify `apps/doc/tests/motion.browser.test.mjs`, `pages.browser.test.mjs`, `animation.browser.test.mjs`,
`motion-page-claims.browser.test.mjs`, `recipes.browser.test.mjs`, `components-box.browser.test.mjs`,
`components-showcase.browser.test.mjs`, `sequences-hydration.browser.test.mjs` (not the two suites of Tasks 6/9 and 7/9).

- [ ] **Step 1:** Replace each literal URL of a framework-dependent motion page with `motionUrl('<slug>')` (a framework or a
      tab argument where the test means one; a feature without `tab` gets its default tab); a check on `location.pathname`
      of such a page compares `splitFramework(location.pathname).path` (and `splitMotionPath` for the slug); neutral pages
      (`/motion`, `/motion/glossary`, `/motion/limits`, `/motion/api`, `/motion/loading-and-weight`, `/motion/roadmap`) and
      fixtures stay literal.
- [ ] **Step 2: Check:** `node --check` on each file; `grep -nE "'/motion/[a-z]" apps/doc/tests/*.mjs` lists only neutral
      pages and fixtures.
- [ ] **Step 3: Commit** `git commit -m "test(doc): motion URLs come from motionUrl" -- <paths>`

### Task 9/9: verification (controller)

- [ ] **Step 1: Build** (load < 4, more than 3 GB free): `npx nx build @udixio/motion --skip-sync`, `@udixio/core`,
      `@udixio/ui-react`, `ui-svelte` (each `--skip-sync`), `npx nx build ui-angular --skip-sync --exclude-task-dependencies`,
      `npx nx build @udixio/mcp --skip-sync`; `cd apps/doc && npm run docgen && npm run docgen:check && node scripts/motion-api.mjs --check && time npx astro build`.
- [ ] **Step 2: Package checks:** in `packages/motion`: `npx vitest run --project unit`, `MOTION_BROWSERS=<e> npx vitest run --project browser`
      for each engine in series, `node --test scripts/*.test.mjs`, `node scripts/size-report.mjs` then `npx size-limit`
      (the three removed entries gone, every limit kept). React `npx vitest run`, Angular
      `cd packages/ui-angular && npx jest -c jest.config.cjs`, Svelte vitest, core `--project unit` and
      `CORE_BROWSERS=<e> --project browser`: no change expected, run to prove it. MCP: `grep -rE "scrollTo|navigate\(|page-transitions|connectAstroTransitions" packages/mcp/dist/bundled` finds nothing.
- [ ] **Step 3: Built site:** `node --test tests/framework-url.test.mjs tests/built-site.test.mjs tests/motion-examples.test.mjs`
      PASS; serve `apps/doc/.vercel/output/static` with `python3 -m http.server 4322 --bind 127.0.0.1`; the Pagefind output
      lists the four readings of a page with their filter.
- [ ] **Step 4: Suites, one file at a time, Chromium, then Firefox, then WebKit:**
      `MOTION_BROWSERS=<e> MOTION_DOC_URL=http://localhost:4322 node --test --test-concurrency=1 tests/<file>` for
      `framework-urls`, `framework-tabs`, `motion`, `animation`, `pages`, `motion-page-claims`, `recipes`, `components-box`,
      `components-showcase`; `sequences-hydration` on a dev server. Known flakes (pass alone): root "plays by itself" long task
      (Chromium), core navigation-rail width (Firefox), WebKit "written for the chosen framework" first paint.
- [ ] **Step 5: Look** (Playwright screenshots, read them): `/react/motion/presence/guide`, `/svelte/motion/presence/examples`,
      `/html/motion/recipes/dialog`, `/motion/glossary`, a stub without JavaScript, at 1280 and 375 px, light and dark; a
      switch under reduced motion; the doc's page change per the Q1 answer. Criticise the header (two rows of choices) before
      handing back.
- [ ] **Step 6: Sweeps:** `grep -rnE "scrollTo\(|@udixio/motion/(scroll|page|astro)|connectAstroTransitions|NavigationDirection|source: 'time'" packages apps plugins --include='*.{ts,tsx,astro,mdx,md,mjs,svelte,html,json}'`
      (outside `node_modules`, `dist`, `docs/motion/research`) finds only `window.scrollTo` and history; the throwaway-tsconfig
      sweep adds no error.
- [ ] **Step 7: Report** the build times (before Task 4/9, after Task 5/9, page count) and the spec criteria 6, 7, 9 to 15
      and 17 met or not, with the interim departures named.

---

## Questions for Joël

1. **Q1, the doc's own page slide** (blocks Task 3/9, Step 3). The site's ClientRouter navigations slide forward and back
   today through `connectAstroTransitions` and the route rules of `motion.css`, both removed. A: keep the slide in the doc
   (a few local lines in the layout and one `@utility`, which the common plan allows); B: Astro's default ClientRouter
   animation; C: no animation between pages. Nothing is decided here.
2. **Q2, the default tab until the model:** a feature's address lands on its Guide (today's page) until its Overview is
   written; spec §2.10 makes Overview the canonical tab. Recommendation: yes, the Guide URLs then never change.
3. **Q3, a feature with one tab:** no tab header until a second tab exists (today only Presence and Layout have
   Examples). Recommendation: hide it; a lone "Guide" tab says nothing. A design point: the designer may settle it instead.
4. **Q4, the API tab and the reference:** built after the model, on its export list, with the `/motion/api` index,
   `api/core` and `api/tooling`. Recommendation: yes; the export-to-feature mapping would otherwise be written twice.

**Answers (Joël, 2026-11-28):** Q1 B — delete the import and the call; Astro's default ClientRouter animation remains.
Q2 yes. Q3 yes, hidden. Q4 yes.
