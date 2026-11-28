# Framework URLs and the per-kind motion syntax: design

Date: 2026-11-28 · Branch: `feat/anime` · Status: URLs and pages ready for implementation; syntax and home on hold
Source: `.superpowers/sdd/2026-11-17-animation-docs/design-2026-11-28-url-props-home.md` (designer), decisions of the
maintainer in `.superpowers/sdd/2026-11-17-animation-docs/decisions-2026-11-28-components-f5.md` and in §6 of the design.

This spec supersedes, in `docs/superpowers/specs/2026-11-17-animation-docs-design.md`: G6 (all URLs under `/motion/...`),
the redirects of §2.3, the root page of §3 and §9.1 (the gallery of 20 cards), §9.2 (`<Motion as name>`) and §9.3 (pages
driven by the stored framework through `ForFramework` / `ApiName` toggles and a radio switch).

**Cut in two (2026-11-28),** as the common plan of components-30 and components-94 validated by the maintainer asks
(`.superpowers/sdd/2026-11-17-animation-docs/plan-commun-motion-components-30-94.md`, §2.9, "hors séquence"): the
framework URLs, routing, redirects, MDX infrastructure and feature tabs (§1 item 1, §2, §5 Pages and Toggles, the URL
criteria of §7) go ahead, planned in `docs/superpowers/plans/2026-11-28-motion-early-track.md`. The motion syntax and
the home by notion wait for the model; their decided content is kept, unchanged, in Appendix A, "Syntax decisions on
hold". The removals of that common plan (§2.6 there) take `scroll` (`scrollTo`) and `page-transitions` out of the
pages of §2.2 and the features of §2.10.

Nothing here is published yet: every change is free to break. Tags: [Doc] checked in official docs, [Test] measured by the
pilot or to be measured by the verification.

---

## 1. Scope

1. The framework a motion page is read in becomes an optional first segment of its URL; the motion pages move to MDX and
   render one framework's prose and code each.
2. The motion syntax of the adapters. Superseded: waits for `docs/superpowers/specs/2026-11-28-motion-model-design.md` (step 2/8). Decided content: Appendix A.1.
3. The `/motion` home by notion. Superseded: waits for `docs/superpowers/specs/2026-11-28-motion-model-design.md` (step 2/8). Decided content: Appendix A.1.

Components pages, theme pages and the component docs keep their URLs, tabs and stored preference.

---

## 2. URLs

### 2.1 Scheme

The framework is a reading, not a place: it prefixes the whole path, `/<framework>/<section>/<page>`.

| Page                    | Canonical URL                   | Other forms                                                  |
| ----------------------- | ------------------------------- | ------------------------------------------------------------ |
| Presence, in React      | `/react/motion/presence/overview` | `/react/motion/presence` is a 301 to it; `/motion/presence[/<tab>]` resolve to the reader's framework (§2.5, §2.10) |
| Presence API, in HTML   | `/html/motion/presence/api`     |                                                              |
| A recipe, in Svelte     | `/svelte/motion/recipes/dialog` |                                                              |
| Glossary (neutral)      | `/motion/glossary`              | `/react/motion/glossary` is a 301 to it (§2.6)               |
| Motion home (neutral)   | `/motion`                       | `/react/motion` is a 301 to it                               |
| Theme page (neutral)    | `/theme/…`                      | `/react/theme/…` is a 301 to it                              |
| Component page          | `/components/button/overview`   | `/react/components/…` is a 404 until components move (§2.6)  |

- The prefixes are the `ExampleFramework` ids of `apps/doc/src/stores/exampleFrameworkStore.ts`: `react`, `angular`,
  `svelte`, `html`. They are reserved first segments: no page of `src/pages` or `src/data/pages` may use one.
- A prefixed URL exists only where the page has that reading. `/html/` exists for motion pages only; a prefixed URL of a
  page with no variant in that framework is a 404. Every framework-dependent motion page has the four readings (the doc
  rule that each example exists for React, Angular, Svelte and HTML).
- The bare path is the identity of a page: every helper, nav entry, `MOTION_NEEDS[].href` and authored link is written
  bare, and one function adds the prefix (§2.8).

### 2.2 Neutral and framework-dependent pages

A page is neutral when neither its prose nor its code differs by framework. `MotionNeed` gains
`perFramework: boolean` (`apps/doc/src/lib/motion-nav.ts`).

- Neutral (canonical without prefix): every page of the `pages` collection (theme, get-started, agents, mcp), the site
  home, `/themes`, `/motion` (home), `glossary`, `limits`, `roadmap`, `loading-and-weight` and `api`.
- `api` is the neutral index of the exports and `api/tooling` a neutral reference page; the reference of each feature
  is its API tab, and `api/core` is framework-dependent (§2.10).
- Component pages are neither for now: they keep their bare URLs, their tabs and the store, and have no prefixed form
  until the components section moves (§2.6).
- Framework-dependent (canonical with prefix): every other motion page: the tabs of each feature (§2.10),
  `getting-started`, `how-it-works`, `choosing-an-api`, `troubleshooting`, `recipes` (landing), the five recipes and
  `api/core`. The `counters` entry (`href: '/motion/values#counters'`) follows `values`.
- The home stays neutral: it shows the four frameworks side by side, and its code tabs keep following the stored
  preference.

### 2.3 Routing

| File                                                          | Paths it generates                                                                  |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `src/pages/[framework]/motion/[...path].astro`                | the four prefixed URLs of each framework-dependent motion page                      |
| `src/pages/motion/[...path].astro`                            | each neutral motion page, and the bare stub of each framework-dependent page (§2.5) |
| `src/pages/motion/index.astro`, `src/pages/motion/fixtures/*` | unchanged files                                                                     |
| `src/pages/[...url].astro`                                    | unchanged: the `pages` collection (theme, get-started, agents, mcp)                 |

- Both motion routes render `src/components/motion/MotionEntry.astro` with the entry and the framework (or none); no page
  logic lives in a route file.
- `getStaticPaths()` of the prefixed route returns the four ids only. Coexistence follows Astro's priority rules [Doc]:
  more segments first, static before dynamic, named parameters before rest parameters [Test: pilot passed].
- The pages are MDX entries of a content collection `motion` (`src/data/motion/**/*.mdx`, glob loader), rendered with
  `render(entry)` and routed from `getStaticPaths()` with the entry as a prop. Title, description and slug stay in
  `MOTION_NEEDS`; the entry id is the slug (`presence`, `recipes/dialog`).
- A route generates a path only for a slug that has an entry in the collection.

### 2.4 MDX rules

- **Prose by framework:** `MotionEntry` renders `<Content framework={framework} />`; MDX reads it as `props.framework`
  [Doc: mdxjs.com; Test: pilot passed]. Prose differs with plain conditions on `props.framework`. These conditions hold
  prose only.
- **`.astro` components** (`MotionUsage`, `Code`, `Choice`, `MotionRelated`, `DocLink`, `Step`, `Fact`) read
  `Astro.params.framework`; no prop drilling, no parsing of the path.
- **Islands:** a `client:*` island that depends on the framework is chosen inside an `.astro` component that reads
  `Astro.params.framework` and conditions in its own template (`MotionUsage` is that component for the examples; a page
  that needs another one adds its own `.astro` component). Never by an MDX expression
  (`{props.framework === 'react' && <X client:visible />}`) and never inside a wrapper component: the island is then
  missing, or rendered and never hydrated, with no error [Test: pilot]. A page's live demo is therefore an `.astro`
  component that imports the framework islands statically and renders, inside `MotionUsage`, only the island of
  `Astro.params.framework` (the pilot's `PresenceDemo` pattern).
- **No `<Only for>` component:** `props.framework` is the one way to condition prose.
- **Headings stay outside every condition:** `getHeadings()` lists a heading inside a condition, so the table of contents
  would show other frameworks' headings, and the switch (§2.7) needs equal heading ids across the four readings.
- **Component mapping:** `MotionEntry` alone passes `components={{ a: DocLink, pre: Code }}`; the motion MDX files export
  no `components` (a passed mapping replaces an exported one).
- **Braces:** `{#if}` and `@if` are written in Markdown code spans, not inside a JSX `<code>`; a conditional block is
  JSX, since Markdown is not parsed inside `{…}`.
- **Links:** Markdown links are written bare (`[Layout](/motion/layout#x)`) and mapped by `a: DocLink`; JSX blocks use
  `<DocLink href="/motion/layout#x">` (the mapping does not reach a literal `<a>` [Doc: mdxjs.com]).
- `MotionUsage` on a prefixed page renders the code and the preview of that framework only, without framework tabs; on a
  neutral page it keeps its tabs, which follow the stored preference.

### 2.5 The bare URL of a framework-dependent page

`/motion/presence` is the address for links written outside the site (README, error messages, the MCP server, a chat).
It resolves to the reader's last chosen framework, React by default.

- It is a generated static stub: an inline head script reads `localStorage['udixio:docs:preferred-example-framework']`
  checks it against the four ids (anything else, a missing value or a storage that throws gives `react`), and calls
  `location.replace('/<framework>/motion/presence' + location.search + location.hash)`; a `<noscript>` meta
  refresh goes to the React page; the body lists the four readings as links. `<link rel="canonical">` points to
  `/react/motion/presence`. No `noindex`. The stub is left out of the sitemap and carries `data-pagefind-ignore`.
- Not a server redirect: the choice is in `localStorage`, which no redirect rule can read.
- Nothing inside the site links to a stub (§2.8, link classification).

### 2.6 Redirects

The prefixed URL of a neutral page answers 301 to its bare URL; no rendered copy.

- The list is generated one by one in `astro.config.ts` by one function of `src/lib/framework-url.ts`:
  - each neutral motion page of `MOTION_NEEDS` (the home, `api` and `api/tooling` included) under the four prefixes;
  - each page of the `pages` collection (`src/data/pages/**`: theme, get-started, agents, mcp), `/theme/builder`,
    `/themes` and the site home (`/react` to `/`) under `react`, `angular` and `svelte`; `/html/` is generated for
    motion pages only, so `/html/theme/colors` and `/html` are 404s.
- Which prefixed paths exist, now that only motion moves:

  | Prefixed path                                             | Answer                                   |
  | --------------------------------------------------------- | ---------------------------------------- |
  | a reading of a framework-dependent motion page            | 200, canonical                           |
  | a neutral motion page, four prefixes                      | 301 to the bare URL                      |
  | a page of the `pages` collection, `/themes`, the site home, three prefixes | 301 to the bare URL       |
  | `/html/…` outside motion                                  | 404                                      |
  | `/<framework>/components/…`                               | 404                                      |
  | anything else                                             | 404                                      |

- `/<framework>/components/…` is a 404 on purpose, not a redirect: component pages differ by framework, so when the
  section moves these become real pages, and a 301 served today would stay cached in browsers against them. A component
  page is not a neutral page, so "a neutral page is never a 404 under a prefix" holds. The link classification (§2.8)
  counts a link to one as an error. A page that changes its
  `perFramework` flag changes its redirects with it.
- No dynamic redirect: `'/[framework]/theme/[...path]': '/theme/[...path]'` drops a parameter and fails the build with
  `InvalidRedirectDestination` [Test: pilot].
- Never `Astro.redirect()` for these: in a static build it writes a meta-refresh page, not an HTTP redirect [Test: pilot].
  The stubs of §2.5 are the only pages that redirect in the browser.
- On Vercel each redirect is an entry of `apps/doc/.vercel/output/config.json` of the form
  `{ "src": "^/react/motion/glossary$", "headers": { "Location": "/motion/glossary" }, "status": 301 }`, before
  `handle: filesystem`, with no HTML file [Test: pilot].
- No file route generates a redirected path.
- The four current `redirects` of `astro.config.ts` (`/motion/reveal-scrub-loop`, `/motion/demo`, `/motion/counters`,
  `/motion/scopes`) are removed: they point at URLs that were never published.

### 2.7 The framework switch is a navigation

- "Written for" keeps its look and sits in the page header (`MotionPage.astro`), on every framework-dependent page; on
  a feature page it is the lesser of two rows (§2.10) and keeps the tab: it swaps the prefix only.
  Each choice is a link to the same bare path under another prefix, built from the Udixio `Tab` in link mode (`href`);
  the current one carries `aria-current="page"`. It works without JavaScript and offers only the readings the page has.
- The URL is the truth of the page; the stored preference is the truth of the reader. Opening `/react/motion/x` does not
  change the stored preference; a click on the switch, or on a code tab of a neutral page or a component page, does.
- Scroll keeping: on click, the script keeps the ids of the headings above the reading line, nearest first, and the
  nearest one's offset in the viewport, then calls `navigate(href + location.hash)` (`astro:transitions/client`). In
  `astro:after-swap` it scrolls the first of those ids that exists to the same offset. The URL's hash is kept as it was.
  `history` stays `auto`: Back returns to the framework just left.

### 2.8 Links, navigation, search, sitemap

`src/lib/framework-url.ts` holds the whole rule, for the site and for the tests:

| Function                                                                                                    | Contract                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `splitFramework(pathname: string): { framework?: ExampleFramework; path: string }`                          | strips a leading framework id                                                                                                   |
| `hasFrameworkVariants(path: string): boolean`                                                               | whether a bare path is framework-dependent (motion: `perFramework`; query and hash ignored)                                     |
| `withFramework(path: string, framework: ExampleFramework \| undefined): string`                             | the prefixed URL of a framework-dependent page, the bare path of a neutral one; query and hash kept                             |
| `frameworkRedirects(neutralPaths: readonly string[]): Record<string, string>`                               | the redirects of §2.6; `neutralPaths` are the bare paths outside motion (the `pages` collection, `/themes`, `/theme/builder`, `/`) |
| `docLink(href: string, framework: ExampleFramework \| undefined): { href: string; frameworkLink: boolean }` | a link as a page renders it: prefixed by the page's framework, or, on a neutral page, by React and marked `data-framework-link` |
| `isFrameworkStub(path: string): boolean`                                                                    | whether a path is the bare stub of a framework-dependent page                                                                   |

- The module is loadable by plain Node (`node --test`, type stripping): runtime imports are relative `.ts` paths only.
- On a prefixed page every internal link goes through `withFramework(href, Astro.params.framework)` at build time: related
  cards, `Choice`, glossary back-links, `DocLink`.
- On a neutral page, links to framework-dependent pages are rendered with the React prefix and marked
  `data-framework-link`; the layout's head script rewrites their prefix to the stored framework before the first paint
  and on `astro:before-swap`. Without JavaScript they open React.
- Navigation rail and side panel (`Navigation.tsx`, `Sidebar.tsx`): the section is read from
  `splitFramework(pathname).path` (`sectionFromPathname` keeps its patterns); the active page is found by comparing bare
  paths (`basePath: '/motion'` stays); each link is `withFramework(href, current)`.
- Hydration rule for these islands, and for any island that renders a link to a framework-dependent page:
  - the first render, on the server and at hydration, uses props only: `current` is the prefix of the `pathname` prop,
    else `react`. It never reads the store, so the server HTML and the first client render are equal;
  - after mount, an effect sets `current` to the pathname's prefix, else the stored choice, and follows the store and
    client navigations from then on. On a prefixed page nothing changes: the URL is the truth;
  - an island never renders `data-framework-link`, and the layout's head script rewrites only the static links that
    carry it: it does not touch the HTML of an island, which would differ from its first render;
  - the cost, accepted: on a neutral page, until its islands hydrate, their links open the React reading.
- Pagefind: `layouts/layout.astro` declares the filter for every page of the site, in the `<head>`
  (`<meta data-pagefind-filter="framework[content]" content="<id>">`; the attribute "does not need to be within the
  body" and "filters can have multiple values per page" [Doc: pagefind.app, filtering]). A prefixed reading declares its
  one id. Every other page declares the four: neutral motion pages, the `pages` collection, component pages, the site
  home, `/themes`, the 404. The rule is "not a prefixed reading", from `splitFramework`, never a list of sections, so a
  new page is findable by default. Pagefind's docs do not say what a filtered search does with a page that has no value
  [Doc: not stated], which is why none is left without. `DocumentationSearch` filters on the stored framework. Stubs
  are ignored.
- Sitemap: the prefixed URLs and the neutral pages; not the stubs, the fixtures (`/motion/fixtures/`), the roadmap.
- Doc tests build their URLs with `motionUrl(slug, framework = 'react')` (`apps/doc/tests/motion-url.mjs`, built on
  `framework-url.ts`), not string literals.

**Link classification (built site):** every internal `href` of every built HTML file is classified with
`framework-url.ts`:

- bare URL of a neutral page: correct;
- bare URL of a framework-dependent page: error (a `data-framework-link` is rendered prefixed, so it passes);
- prefixed URL of a framework-dependent page: correct; on a prefixed page its prefix must be the page's own, except in
  the switch and in a stub's list of four;
- prefixed URL of a neutral page: error;
- a `/motion/…` path that is no page of `MOTION_NEEDS` (and no fixture): error.

### 2.9 SEO

- `layouts/layout.astro` emits a self-referencing `<link rel="canonical">` on every page, built by
  `canonicalUrl(pathname, site)` of `framework-url.ts`: `new URL(pathname, site)` without its trailing slash (the root
  keeps its own). The site sets no `trailingSlash` and builds `<path>/index.html`, so both forms answer; the one
  without the slash is the canonical, the one every internal link, redirect `Location` and sitemap entry uses (the
  sitemap's `serialize` strips it the same way); each reading of a framework-dependent page is indexable and its own canonical.
- A neutral page has one URL; its prefixed forms are 301s.
- Title: `motionTitle(need, framework?)` (`motion-nav.ts`); the layout appends " — Udixio UI". A reading is
  `<label> in <Framework> · Motion` ("Presence in Svelte · Motion — Udixio UI"), a neutral page `<label> · Motion`, the
  home "Motion". The per-page `title=` props go.
- Description: `MotionNeed.summary` keeps its contract (one sentence, no code, the same in every framework). A reading's
  description is `summary + ' ' + FRAMEWORK_LINES[framework]`, one fixed sentence per framework in
  `lib/motion-facts.ts`: "In React, with the Motion and Presence components and the hooks of @udixio/ui-react.", "In
  Angular, with the directives of @udixio/ui-angular.", "In Svelte, with the attachments of @udixio/ui-svelte.", "In plain
  HTML, with data-motion attributes and no framework." A neutral page's description is its summary; the per-page
  `description=` props go; the page header shows the summary alone.
- No `hreflang`, no `rel="alternate"` between frameworks.

### 2.10 Feature pages: four tabs

Decided by Joël (2026-11-28), on components-42's revised proposal. An Overview is an introduction, neither a showcase
nor the complete documentation; the complete usage is the Guide.

**Which pages.** `MotionNeed` gains `tabs: true` for a feature: `presence`, `emphasis`, `layout`, `lists`,
`shared-elements`, `reveal`, `scrub`, `loop`, `text`, `svg`, `values`, `gestures`, `sequences`, `animate`,
`scroll`, `page-transitions`, `tokens`, `presets`, `accessibility`, `per-breakpoint`, `inspect` (21). The other
pages have no tabs and keep a plain URL: `getting-started`, `how-it-works`, `choosing-an-api`, `glossary`,
`troubleshooting`, `limits`, `loading-and-weight`, `roadmap`, `recipes` and the five recipes, `api`, `api/core`,
`api/tooling`. `counters` follows `values` (`/motion/values/guide#counters`).

| Tab      | Holds                                                                                              | Present                                            | Source                                  |
| -------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------- | --------------------------------------- |
| Overview | the summary, ONE demo (the simplest, with its short code), "When to use it", "At a glance", links to Guide and API | always                             | `src/data/motion/<feature>/overview.mdx` |
| Guide    | "How it behaves", every variant, "Accessibility", "Timing", "Limits"; framework specifics by `props.framework` | always                          | `src/data/motion/<feature>/guide.mdx`    |
| API      | "Options", "In your framework", "Functions and types", "Attributes, variables and events"          | when at least one export maps to the feature       | generated (`motion-api.json`)           |
| Examples | the recipes that use the feature, as cards linking to them                                         | when at least two recipes carry the feature's tag  | generated (`MOTION_NEEDS`)              |

- An Overview is one or two screens. It holds no variant, no option table and no rule; its only `h2` are "When to use
  it" and "At a glance".
- The Guide's "Accessibility", "Timing" and "Limits" are the three parts of today's "Good to know", each under its own
  `h2`; "Limits" links to Troubleshooting. An option named in a variant links to its anchor in the API tab
  (`/motion/presence/api#stagger`).
- The API tab's four `h2` are the same, in that order, in the four readings; one with nothing under it in a reading
  says so in one line rather than disappearing. "Options" is `MotionOptions.astro` (it reads the manifest); "In your
  framework" is the adapter's surface for the feature (the props of `<Motion>`, the `udx*` inputs, the keys of the
  attachment, the HTML attributes); "Functions and types" lists the essentials, then the advanced ones folded.
- Examples today: Presence (Dialog, Toasts, Accordion, Navigation menu) and Layout (Accordion, Tab indicator). Lists
  and Shared elements have one recipe each, so no tab yet: the rule is read from the data and the tab appears with the
  second recipe. A recipe exists once, in the Recipes section; the tab only links to it.

**URLs, as component pages.**

| URL                                            | Answer                                                        |
| ---------------------------------------------- | ------------------------------------------------------------- |
| `/<fw>/motion/<feature>/overview`              | the Overview; the canonical address of the feature            |
| `/<fw>/motion/<feature>/guide`, `/api`, `/examples` | the other tabs, each its own canonical; only those that exist |
| `/<fw>/motion/<feature>`                       | 301 to `/overview`, generated one by one with the redirects of §2.6 |
| `/motion/<feature>`, `/motion/<feature>/<tab>` | stubs (§2.5); the tab-less one goes to `/<fw>/motion/<feature>/overview` |

- The routes of §2.3 generate these paths from the entry ids (`presence/overview`, `presence/guide`) and, for the two
  generated tabs, from the data; the API and Examples tabs have no MDX entry.
- A link to a section names its tab: `/motion/layout/guide#rules`. A tab-less link to a feature (`/motion/layout`) is
  sent to `/overview` by `docLink` (§2.8), so no internal link costs a redirect. `MOTION_NEEDS[].href` of a feature
  stays its bare, tab-less path; `framework-url.ts` gains `featureTabs(slug): Tab[]` and resolves through it.
- The link classification (§2.8) adds: a built `href` to a tab-less feature, to a tab the feature does not have, or to
  a prefixed tab-less feature is an error.
- The side panel has one entry per feature, linking to its Overview, and marks it on any of its tabs
  (`findActivePage` already treats sibling routes of an `/overview` link as the same entry).
- Sitemap and Pagefind take each tab as its own page.

**Titles and descriptions (§2.9), per tab,** so that search tells them apart: Overview "Presence in Svelte · Motion";
Guide "Presence guide in Svelte · Motion"; API "Presence API in Svelte · Motion"; Examples "Presence examples in Svelte ·
Motion". The description is the summary and the framework's sentence, preceded on the three other tabs by "The complete
guide.", "The API reference." or "Complete examples."

**The tab header is a shared component,** `src/components/PageTabs.tsx`: Udixio `Tabs` in its `secondary` variant with
one `Tab` per page as a link (`href`), the look `ComponentNavigation` has today. It takes `tabs: { label, href }[]`
and the server's `pathname`, and selects from that prop, never from `window`, so it hydrates clean (§2.8). The labels
are "Overview", "Guide", "API", "Examples". It is the last row of the page's header, full width, under the title, the
need and the summary. "Written for" is a setting, not the navigation: it keeps the small look of the code tabs, on the
title's row at the right from `lg`, under the summary below. Component pages do not change now;
`ComponentNavigation` will become a use of `PageTabs`, with the same four tabs, when components move.

**"At a glance".** The block's name, in the Overview and in the code (`src/components/motion/AtAGlance.astro`): a
description list of five rows, in this order, the same for every feature.

| Row            | Says                                                              | From                                                                                         |
| -------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| You write      | the shortest form, in the reading's framework, as code            | authored: `src/lib/motion-glance.ts`, one string per feature and framework                   |
| Import         | the import line of the reading's framework                        | authored beside it; the path must be one of `MOTION_ENTRIES` or an adapter of `ADAPTERS`    |
| Weight         | what the feature adds to a page, gzipped, and when it loads       | generated: the entries of `MOTION_ENTRIES` whose `needs` hold the feature, and their `load` |
| Browsers       | "Every supported browser", or the feature it needs and what happens without it | generated: `FEATURES`, which gains `needs: string[]` as `MOTION_ENTRIES` has   |
| Reduced motion | what the motion becomes under the reduced-motion policy           | authored: one sentence per feature, the same in every framework                               |

No weight and no browser version is typed by hand. Under the list, two links: "Read the guide" and "See the API" (the
second only when the tab exists).

The code of the two blocks below is written in the syntax on hold (Appendix A.3): the five rows stand, their code follows
the model spec.

The model, Presence in React (the weight is the measured figure of the `core` entry at build time, shown here as a
placeholder):

```text
At a glance

You write        <Presence>{open && <Motion key="toast" presence="slide">…</Motion>}</Presence>
Import           import { Motion, Presence } from '@udixio/ui-react';
Weight           Nothing to add: presence is in the core (<coreWeight> gzipped), loaded with your first motion.
Browsers         Every supported browser.
Reduced motion   The entry and the exit become a short fade: nothing moves.

Read the guide · See the API
```

The same block in the three other readings changes its first two rows only:

```text
Angular   @if (open()) { <div udxPresence="slide">…</div> }
          import { Motion } from '@udixio/ui-angular';
Svelte    {#if open}<div {@attach motion({ presence: 'slide' })} transition:presence>…</div>{/if}
          import { motion, presence } from '@udixio/ui-svelte';
HTML      <div data-motion="slide" hidden>…</div>
          import { connectMotion } from '@udixio/motion';
```

**The reference outside the features.**

- `/motion/api`, neutral, becomes an index: the existing filter field, the names grouped by feature, then Core, then
  Tooling and internals; per name one line and a link to its entry (a `data-framework-link`). Each name has its id on
  the index, so `/motion/api#getMotion` is the stable address for links written outside the site. No entry is detailed
  there, and each is detailed once.
- `/<fw>/motion/api/core`, framework-dependent: what serves every feature (`defineMotion`, `connectMotion`,
  `motion`, `getMotion`, bindings, handles, the registry, and `<Motion>`, `useMotion` or their counterpart), with the
  API tab's `h2` minus "Options". An export mapped today to a page that is not a feature (`getting-started`,
  `how-it-works`, `choosing-an-api`, `troubleshooting`) goes here.
- `/motion/api/tooling`, neutral, "Tooling and internals": the exports mapped to no page (runtime, providers,
  testing, manifest). Everything stays exported and documented; the page only ranks it.
- Data (`apps/doc/scripts/motion-api.groups.mjs`): every export of `ADAPTER_GROUPS` and every entry of `HTML_GROUP`
  gets its page, as `GROUPS` has; `motion-api.mjs` writes the list by slug; a check fails the generation when an
  export maps to a slug that is neither a feature, nor `core`, nor `tooling`. Each recipe of `MOTION_NEEDS` gains
  `features: string[]` (Dialog: presence; Toasts: presence, lists; Accordion: presence, layout; Tab indicator:
  shared-elements, layout; Navigation menu: presence).
- The runtime reordering of `motion/api/apiPage.ts` goes with the single page; its filter stays, for the index.

---
## 3. The motion syntax

Superseded: waits for `docs/superpowers/specs/2026-11-28-motion-model-design.md` (step 2/8). Decided content: Appendix A.3.

---

## 4. The `/motion` home: "What it does", by notion

Superseded: waits for `docs/superpowers/specs/2026-11-28-motion-model-design.md` (step 2/8). Decided content: Appendix A.4.

---

## 5. Deletions

- Pages: `src/pages/motion/*.astro` except `index.astro` and `fixtures/`, once their MDX entry exists.
- Toggles: `ForFramework.astro`, `ApiName.astro`, the `[data-framework-variant]` contract (`lib/framework-choice.ts`, the
  layout's head script) and their tests, once the last page has moved and the home uses panels (Appendix A.4): the code-block
  contract, the store and `data-docs-framework` stay; `MotionPage`'s `frameworkSwitch` prop (the switch
  shows on every framework-dependent page).
- Home components section and gallery: Superseded: waits for `docs/superpowers/specs/2026-11-28-motion-model-design.md` (step 2/8). Decided content: Appendix A.5.
- Adapters: Superseded: waits for `docs/superpowers/specs/2026-11-28-motion-model-design.md` (step 2/8). Decided content: Appendix A.5.

---
## 6. Consumers updated in the same change

Superseded: waits for `docs/superpowers/specs/2026-11-28-motion-model-design.md` (step 2/8). Decided content: Appendix A.6. The consumers of the URL change are listed by the plan.

---

## 7. Acceptance criteria

1. Superseded: waits for `docs/superpowers/specs/2026-11-28-motion-model-design.md` (step 2/8). Appendix A.7.
2. Superseded: waits for `docs/superpowers/specs/2026-11-28-motion-model-design.md` (step 2/8). Appendix A.7.
3. Superseded: waits for `docs/superpowers/specs/2026-11-28-motion-model-design.md` (step 2/8). Appendix A.7.
4. Superseded: waits for `docs/superpowers/specs/2026-11-28-motion-model-design.md` (step 2/8). Appendix A.7.
5. Every motion page is an MDX entry; the four readings of a framework-dependent page have equal heading ids; each reading
   shows one framework's prose and code; no `ForFramework`/`ApiName` left.
6. The link classification of §2.8 finds no error in the built site.
7. Built output: `.vercel/output/config.json` holds every redirect of §2.6 as a 301 before `handle: filesystem`; the
   sitemap lists the prefixed and neutral pages and no stub, fixture or roadmap; Pagefind returns one reading per page for
   the stored framework; every page has its canonical.
8. Browser (Chromium, Firefox, WebKit): the stub with and without a stored choice; the switch navigates, keeps the
   reading position by heading and the hash, and Back returns; the rail and side panel on a prefixed URL; islands hydrate
   on prefixed pages; light and dark, 1280 and 375 px, reduced motion. (The
   home's clause: Appendix A.7.)
9. Build time with four readings per page is measured and reported.
10. Search: with Svelte stored, a search finds a component page (`/components/button/overview`) and a theme page
    (`/theme/colors`), and one reading, the Svelte one, of a framework-dependent motion page.
11. Hydration (Chromium, Firefox, WebKit): on `/motion/glossary` with Svelte stored, the console holds no error and no
    warning, and after hydration the side panel's links to framework-dependent pages start with `/svelte/`; on
    `/angular/motion/presence` with Svelte stored they start with `/angular/`.
12. Prefixed paths: `config.json` holds a 301 for `/react/get-started/introduction`, `/svelte/agents`, `/angular/mcp`,
    `/react/themes` and `/react`; no file and no redirect exists for `/react/components/button/overview` nor
    `/html/theme/colors`.
13. Feature tabs (§2.10): every feature has `/overview` and `/guide`, `/api` exactly when exports map to it,
    `/examples` exactly when two recipes or more carry its tag; `/<fw>/motion/<feature>` is a 301 to `/overview` in
    `config.json`; each tab has equal heading ids in its four readings; an Overview holds one demo and no `h2` other
    than "When to use it" and "At a glance"; the switch keeps the tab; the side panel marks the feature on each of its
    tabs; `/motion/api` lists every export once, each linking to an entry that exists; no export is detailed twice.
17. Build time with the feature tabs (about 250 pages for the features alone) is measured on the pilot, Presence with its
    four tabs, before the other features move. [Test]
14. Stub: with `vue`, an empty string, no value, or a storage that throws, it goes to `/react/motion/presence`; the
    address never holds `undefined` or `null`.
15. Canonical: no canonical ends with a slash except the root's, and each page's canonical is equal, as a string, to its
    sitemap entry.
16. Superseded: waits for `docs/superpowers/specs/2026-11-28-motion-model-design.md` (step 2/8). Appendix A.7.

---
## 8. Open points

The three points the plan raised are settled by the designer (2026-11-28):

1. **`listMotionSources` and the deferred check:** Superseded: waits for `docs/superpowers/specs/2026-11-28-motion-model-design.md` (step 2/8). Appendix A.8.
2. **Title and description of a reading:** §2.9.
3. **The variant contract and the home:** the variant contract, §5 (Toggles); the home, superseded: waits for `docs/superpowers/specs/2026-11-28-motion-model-design.md` (step 2/8).
   Appendix A.8.

The maintainer's decision on the Angular inputs: Superseded: waits for `docs/superpowers/specs/2026-11-28-motion-model-design.md` (step 2/8). Appendix A.8. No open point is left for the URLs.

---

## Appendix A. Syntax decisions on hold

Decided on 2026-11-28 and kept for reuse, unchanged. Superseded: waits for `docs/superpowers/specs/2026-11-28-motion-model-design.md` (step 2/8). Nothing here is implemented before that spec settles
the model, which may keep, change or drop each decision. Inside this appendix, "§3.x", "§4", "§5" and "§6" mean
A.3.x, A.4, A.5 and A.6; "§2.x" still means the sections of this spec.

### A.1 Scope (items 2 and 3 of §1)

2. The motion syntax of the adapters says one motion per kind: React gets one prop per kind, Angular one input per kind,
   Svelte one object of kinds. HTML is unchanged.
3. The `/motion` home replaces its gallery and its components section with six blocks, one per notion.

### A.3 The motion syntax

#### A.3.1 Model

One motion per kind, written as such, in every adapter. The space-separated list (`name="cascade reflow"`,
`udxMotion="cascade reflow"`, `motion('cascade reflow')`), its array form and "first listed wins" are removed from React,
Angular and Svelte. Each adapter takes its own natural syntax; React's props are not copied to Angular and Svelte.

#### A.3.2 Core types (`packages/motion/src/define-motion.ts`, type-only)

```ts
export type MotionVerb = MotionSpec['verb'];

/** The specs of some verbs; a branch holding several verbs is narrowed to the ones asked. */
export type MotionSpecOf<V extends MotionVerb> = MotionSpec extends infer S
  ? S extends { verb: infer X }
    ? [Extract<X, V>] extends [never]
      ? never
      : Omit<S, 'verb'> & { verb: Extract<X, V> }
    : never
  : never;

export interface MotionRef<
  N extends string = string,
  V extends MotionVerb = MotionVerb,
> {
  readonly name: N;
  readonly spec: Readonly<MotionSpecOf<V>>;
}

export function defineMotion<N extends string, const S extends MotionSpec>(
  name: N,
  spec: S,
): MotionRef<N, S['verb']>;

export interface MotionRegistry {
  fade: 'appear';
  slide: 'appear';
  cascade: 'appear';
  scale: 'appear';
  draw: 'appear';
  press: 'emphasize';
  shake: 'emphasize';
  reflow: 'layout';
  rise: 'reveal';
  parallax: 'scrub';
  rotate: 'loop';
  breathe: 'loop';
  blink: 'loop';
}

export type MotionNameOf<V extends MotionVerb> = {
  [K in keyof MotionRegistry]: MotionRegistry[K] extends V ? K : never;
}[keyof MotionRegistry];

export type MotionName = keyof MotionRegistry | (string & {}); // unchanged

export type MotionOf<V extends MotionVerb> =
  | MotionNameOf<V>
  | (string & {})
  | MotionRef<string, V>
  | Readonly<DistributiveOmit<MotionSpecOf<V>, 'verb'> & { verb?: V }>;

export type MotionSources = {
  presence?: MotionOf<'appear' | 'disappear'>;
  emphasis?: MotionOf<'emphasize'>;
  layout?: MotionOf<'layout'>;
  loop?: MotionOf<'loop'>;
} & (
  | { reveal?: MotionOf<'reveal'>; scrub?: never }
  | { scrub?: MotionOf<'scrub'>; reveal?: never }
);

/** The keys of MotionSources. */
export type MotionSourceKey = 'presence' | 'emphasis' | 'layout' | 'reveal' | 'scrub' | 'loop';

/** How an adapter writes each key, for the development messages: React's `looping`, Angular's `udxPresence`. */
export type MotionPlaces = Readonly<Record<MotionSourceKey, string>>;

/** A source with the key it was given under: it binds only if its motion has a verb of that key. */
export interface ExpectedSource {
  readonly source: MotionSource;
  readonly key: MotionSourceKey;
  readonly places: MotionPlaces;
}

/** The verbs of each key: presence takes appear and disappear, the others their one verb. */
export const SOURCE_VERBS: Readonly<Record<MotionSourceKey, readonly MotionVerb[]>>;

/**
 * The sources as the list the core binds: presence, emphasis, layout, reveal, scrub, loop, the keys that are given.
 * An inline spec takes the verb of its key (appear for a presence that names none). Pure: no element, no report.
 */
export function listMotionSources(sources: MotionSources, places?: MotionPlaces): ExpectedSource[];

// bind.ts: the one signature that widens
export function motionsWhenDefined(
  target: MotionElement,
  sources: readonly (MotionSource | ExpectedSource)[],
  options?: BindOptions,
): DeferredMotion[];
```

- `DistributiveOmit<T, K>` is a new exported helper of `@udixio/motion` (the repository has none today).
- Registry: an app adds its names by declaration merging with their verb,
  `declare module '@udixio/motion' { interface MotionRegistry { 'card-enter': 'appear' } }` (the value was `true`). A
  name left out still works everywhere, as a string. `SequenceStepRegistry`, gestures and values are unchanged.
- Presets: each annotation gains its verb (`export const fade: MotionRef<'fade', 'appear'>`). A type test asserts, for
  every preset, that `MotionRegistry[name]` is the verb of its reference.
- `MotionSource`, `resolveMotion`, `kindOf` and the core's binding functions keep their signatures;
  `motionsWhenDefined` widens its `sources` to `MotionSource | ExpectedSource` (§3.3) and is otherwise unchanged; `MotionRef` without arguments means "of any verb".
- Everything is exported: `MotionVerb`, `MotionSpecOf`, `MotionNameOf`, `MotionOf`, `MotionSources`,
  `listMotionSources`, `MotionSourceKey`, `MotionPlaces`, `ExpectedSource`, `SOURCE_VERBS`, `DistributiveOmit`, and `ReactMotionSources` from `@udixio/ui-react`.

#### A.3.3 `listMotionSources`: the shared rules

The three adapters call it and drop their own `motionsOf`; the rules exist once.

- **Order:** the list is `presence`, `emphasis`, `layout`, `reveal` or `scrub`, `loop`. With the core's
  `listedTarget`, a `play()` without a kind, and so `state`, plays the emphasis, else the layout, else the reveal (or
  scrub), else the loop.
- **Inline spec:** the key gives the verb. A presence spec defaults to `appear` and may say `verb: 'disappear'`; the
  other keys take a spec without `verb`.
- **Wrong kind:** a value whose verb is not one of its key's (`layout: 'slide'`, a presence; a scrub name under
  `reveal`) is not bound: the key is as if absent, and development reports it once per element, naming the right
  place in the adapter's words. The contract:
  - `listMotionSources` only lists: it knows no element, so it reports nothing. `places` defaults to the keys
    themselves, which is Svelte's wording; React passes `{ …, loop: 'looping' }`, Angular `{ presence: 'udxPresence', … }`.
  - The check is in `motionsWhenDefined`, at the one point where the core already decides whether a source binds:
    its `admit(verb)` callback (`bind.ts`, around line 337), which runs when the verb is known, at the bind for a
    defined name, a reference or a spec, and from `onMotionDefined` for a name defined later. For an `ExpectedSource`
    whose verb is not in `SOURCE_VERBS[key]`, `admit` returns false before the same-kind rule: the motion has no
    binding, as a source left out has none today, and it does not take the kind from another source. [Doc: read in
    `packages/motion/src/bind.ts`]
  - The report is the core's, `reportWrongKind(target, name, place, kind, verb, rightPlace)` in `slots.ts` beside
    `reportSameKind`, through the same once-per-element `reportIgnored`, under `options.development`:
    `"slide" ignored in layout: it is a presence (verb appear). Pass it to presence.` The words in `layout` and
    `presence` are `places[key]` and `places[the key of the verb]`, so React says `looping` and Angular `udxPresence`.
  - A reveal given a scrub name (and the reverse) is a wrong verb too, though the kind is the same: refused, and the
    message names the other key.
  - `reveal` and `scrub` both given (Angular, or JavaScript callers): both are listed, reveal first, and the core's
    existing rule of one motion per kind binds the reveal and reports the scrub (`reportSameKind`).
  - A plain `MotionSource` in the list binds under its own kind, as today: the HTML scanner, `motionWhenDefined` and
    every existing caller are unchanged. `BindOptions`, `DeferredMotion`, `playListed`, `listedTarget` are unchanged.
  - Tests, in `packages/motion` (unit, real DOM, `console.error` spied as the existing report tests do):
    1. `listMotionSources`: the order; only the given keys; a spec gets its key's verb; a presence spec keeps
       `disappear`; default and custom `places`.
    2. Wrong kind, name defined before the bind: no binding for it, the other keys bound, one report with both places.
    3. Wrong kind, name defined after the bind: nothing bound before; at the definition, still no binding, one report;
       another source of that kind keeps its binding.
    4. Once per element: two wrong sources on one element report once; two elements report twice.
    5. A scrub name under `reveal` is refused and the message names the scrub place.
    6. `reveal` with `scrub`: the reveal is bound, the scrub reported by the same-kind rule.
    7. No report without `development`; a plain `MotionSource` list behaves as before (the existing tests stay green).
    8. `state` order through `playListed`: emphasis, else layout, else reveal, else loop.
    One spec per adapter asserts its own places in the message (`looping`, `udxLayout`, `layout`).
- **Reveal and scrub:** given both at run time, `reveal` is bound and development reports `scrub`, by the core's
  existing rule of one motion per kind.

#### A.3.4 React (`@udixio/ui-react`)

`name` is removed; six props replace it, named as the six pages of the Motions section.

| Prop       | Kind (`play(kind)`) | Verb of an inline spec              | Type                                         |
| ---------- | ------------------- | ----------------------------------- | -------------------------------------------- |
| `presence` | `presence`          | `appear` unless `verb: 'disappear'` | `MotionOf<'appear' \| 'disappear'>`          |
| `emphasis` | `emphasis`          | `emphasize`                         | `MotionOf<'emphasize'>`                      |
| `layout`   | `layout`            | `layout`                            | `MotionOf<'layout'>`                         |
| `reveal`   | `view`              | `reveal`                            | `MotionOf<'reveal'>`, exclusive with `scrub` |
| `scrub`    | `view`              | `scrub`                             | `MotionOf<'scrub'>`, exclusive with `reveal` |
| `looping`  | `loop`              | `loop`                              | `MotionOf<'loop'>`                           |

```ts
export type ReactMotionSources = DistributiveOmit<MotionSources, 'loop'> & {
  looping?: MotionOf<'loop'>;
};
```

Other props of `<Motion>`:

| Prop                                                                                                                                    | Change                                                                          |
| --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `as` (`MotionTag`, default `'div'`), `ref`                                                                                              | unchanged                                                                       |
| `name`                                                                                                                                  | removed: it is the element's own attribute again                                |
| `step`                                                                                                                                  | renamed `sequenceStep` (`SequenceStepName`); it still writes `data-motion-step` |
| `state`                                                                                                                                 | unchanged; plays emphasis, else layout, else reveal, else the loop              |
| `present`, `motionRef`, `settled`, `shared`, `paused`, `restoreFocus`, `gesture`, `onMotionDragEnd`, `onMotionSwipe`, `onMotionReorder` | unchanged                                                                       |

- **No own prop collides with a native attribute.** No own prop of `Motion` except `as` is the name of an attribute of any
  member of `JSX.IntrinsicElements` (HTML and SVG). Hence `looping` (`loop` is native on `<video>` and `<audio>`) and
  `sequenceStep` (`<input step>`). `as` stays although `<link as>` is native: `<Motion as="link">` cannot set the native
  `as`, documented as a limitation.
- With `as={Component}`, an own prop of `Motion` hides a prop of the same name on the component (`state`, `layout`…):
  documented; wrap the component in a `<Motion>` instead.
- No `Motion.article`, no `create()`.
- **An inline spec is known by its content, not its identity.** `<Motion presence={{ keyframes: […] }}>` gives a new
  object at each render; `useMotion` keys its binding on the content of each source (`sourceKey`, already so today).
  A render with an equal spec does not bind again and replays nothing; a spec whose content changed binds again, settled.
  The same holds for the Angular inputs and the Svelte argument.
- **A reference of an unknown verb is a type error on a prop.** `const ref: MotionRef = slide` compiles, but
  `<Motion presence={ref}>` does not: `MotionRef<string, MotionVerb>` is not a `MotionRef<string, 'appear' | 'disappear'>`.
  That is intended: the prop cannot vouch for the kind. The ways out are a reference that kept its verb, or its name
  (`presence={ref.name}`), which compiles as a string and is checked when it binds (§3.3).
- **No source at all is not an error.** `<Motion>` with no kind prop and no gesture renders its element and binds
  nothing, with no report: a step of a sequence (`sequenceStep`) and props that are conditionally undefined are
  legitimate. `present` still shows and hides it, at once, since there is no exit to play. `useMotion({})` returns a
  `ref` that binds nothing, `mounted` equal to `present`, and a `play()` that returns undefined.
- **Strictness:** the types above ship (references and inline specs of another kind are type errors; a registered name of
  another kind compiles as a string and is reported in development). The stricter variant (a type parameter per prop,
  checked against the registry, refusing a registered name of another kind and keeping unknown strings) is decided by the
  controller, not by an implementer, after Tasks 1 and 3, with a script on TypeScript's language service
  (`ts.createLanguageService`) run on the real types with the variant applied. Three checks:
  1. the completions at `presence="|"` list exactly the presences of the registry;
  2. `layout="slide"` gives a diagnostic whose message names `layout`;
  3. `presence="not-registered"` compiles.
  The variant is taken only if all three hold; otherwise the shipped types stay, and the report says which check failed.
  The same decision applies to the Svelte argument; an Angular input cannot carry the variant.

What the types give:

| Written                                                          | Result                                             |
| ---------------------------------------------------------------- | -------------------------------------------------- |
| `presence="`                                                     | offers the presences of the registry               |
| `presence={slide}`, `layout={reflow}`                            | compile                                            |
| `layout={slide}`                                                 | type error                                         |
| `emphasis={{ verb: 'appear', … }}`, `layout={{ keyframes: [] }}` | type errors                                        |
| `reveal="rise" scrub="parallax"`                                 | type error                                         |
| `presence="not-registered"`                                      | compiles; reported in development if never defined |
| `layout="slide"`                                                 | compiles; not bound, reported in development       |
| `const ref: MotionRef = slide`                                   | compiles                                           |
| `<Motion as="input" name="email" type="number" step={5} />`      | compiles; `name` and `step` reach the input        |
| `<Motion as="video" loop looping="pulse" />`                     | compiles; sets both                                |
| `<Motion as="circle" r={4} reveal="rise" />`                     | compiles                                           |

**`useMotion`** stays public and takes the component's words in one object:

```ts
function useMotion<T extends MotionElement = HTMLElement>(
  options: UseMotionOptions,
): UseMotionReturn<T>;
type UseMotionOptions = ReactMotionSources & {
  present?;
  state?;
  settled?;
  shared?;
  paused?;
  restoreFocus?;
};
```

`UseMotionReturn` (`ref`, `mounted`, `play(kind?)`, `getBinding(kind?)`), `MotionControls`, `useMotionSequence`,
`useMotionGesture`, `useMotionValue` are unchanged.

Before / after:

```tsx
<Motion key="toast" name="slide">                       ->  <Motion key="toast" presence="slide">
<Motion as="li" name="cascade reflow">                  ->  <Motion as="li" presence="cascade" layout="reflow">
<Motion as="li" name="reflow" gesture="reorder">        ->  <Motion as="li" layout="reflow" gesture="reorder">
<Motion as="span" name={name} paused={paused} />        ->  <Motion as="span" looping={name} paused={paused} />
<Motion as={Button} name="press" state={likes} />       ->  <Motion as={Button} emphasis="press" state={likes} />
<Motion name="reflow" state={wide} style={{ width }} /> ->  <Motion layout="reflow" state={wide} style={{ width }} />
<Motion as="h3" step="title">                           ->  <Motion as="h3" sequenceStep="title">
<Motion as="li" name="rise">                            ->  <Motion as="li" reveal="rise">
<Motion as="article" name="parallax">                   ->  <Motion as="article" scrub="parallax">
<Motion as={Snackbar} name="fade press" state={pulses}> ->  <Motion as={Snackbar} presence="fade" emphasis="press" state={pulses}>
<Motion presence={{ keyframes: [{ opacity: 0, y: 16 }, { opacity: 1, y: 0 }] }}>Saved</Motion>   // new in the docs
useMotion('slide', { present: open })                   ->  useMotion({ presence: 'slide', present: open })
useMotion(['fade', 'reflow'], { present })              ->  useMotion({ presence: 'fade', layout: 'reflow', present })
```

The inline spec is shown once on the Presence page and once in Choosing an API.

#### A.3.5 Angular (`@udixio/ui-angular`)

One directive, the `Motion` class, selector
`[udxPresence], [udxEmphasis], [udxLayout], [udxReveal], [udxScrub], [udxLoop]`, `exportAs: 'udxMotion'`.

| Input                                                                                                                   | Kind     | Type                                |
| ----------------------------------------------------------------------------------------------------------------------- | -------- | ----------------------------------- |
| `udxPresence`                                                                                                           | presence | `MotionOf<'appear' \| 'disappear'>` |
| `udxEmphasis`                                                                                                           | emphasis | `MotionOf<'emphasize'>`             |
| `udxLayout`                                                                                                             | layout   | `MotionOf<'layout'>`                |
| `udxReveal`                                                                                                             | view     | `MotionOf<'reveal'>`                |
| `udxScrub`                                                                                                              | view     | `MotionOf<'scrub'>`                 |
| `udxLoop`                                                                                                               | loop     | `MotionOf<'loop'>`                  |
| `udxMotionPresent`, `udxMotionState`, `udxMotionSettled`, `udxMotionShared`, `udxMotionPaused`, `udxMotionRestoreFocus` |          | unchanged                           |

- `udxMotion="…"` and the `source` input are removed, with no shorthand.
- A static name needs no brackets (`udxLayout="reflow"`); a reference or a spec is bound (`[udxPresence]="toastIn"`).
- Signal inputs typed with `MotionOf`; `strictTemplates` makes `[udxLayout]="slide"` with a presence reference a template
  error. A static `udxLayout="slide"` compiles and is reported in development. `udxReveal` with `udxScrub` cannot be
  refused by the template: the reveal is bound and development reports the scrub.
- `<video loop udxLoop="pulse">` sets both.
- `udxPresence` beside `udxMotionPresent`: the Angular Presence page says, where it first shows the two together,
  "`udxPresence` names the motion the element enters and leaves with; `udxMotionPresent` is the switch that says
  whether it is shown."
- Unchanged: `@if` / `@for` with `animate.leave`; `[udxMotionPresent]`; `#m="udxMotion"` with `m.play(kind?)` and
  `m.bindingOf(kind)`; `udxMotionGesture` with `(udxDragEnd)`, `(udxSwipe)`, `(udxReorder)`; `udxMotionValue`;
  `udxMotionSequence`; a step is the plain attribute `data-motion-step="title"`. An element holding only a gesture
  carries no kind input. No `hostDirectives`.

```text
<div udxMotion="slide">                         ->  <div udxPresence="slide">
<li udxMotion="cascade reflow">                 ->  <li udxPresence="cascade" udxLayout="reflow">
<li udxMotion="reflow" udxMotionGesture="reorder" (udxReorder)="reorder($event)">
                                                ->  <li udxLayout="reflow" udxMotionGesture="reorder" (udxReorder)="reorder($event)">
<udx-button udxMotion="press" [udxMotionState]="likes()">
                                                ->  <udx-button udxEmphasis="press" [udxMotionState]="likes()">
<span [udxMotion]="beat.name" [udxMotionPaused]="paused()">
                                                ->  <span [udxLoop]="beat.name" [udxMotionPaused]="paused()">
<div udxMotion="slide" [udxMotionPresent]="open()">
                                                ->  <div udxPresence="slide" [udxMotionPresent]="open()">
<li udxMotion="rise">, <article udxMotion="parallax">
                                                ->  <li udxReveal="rise">, <article udxScrub="parallax">
<udx-snackbar udxMotion="fade press" …>        ->  <udx-snackbar udxPresence="fade" udxEmphasis="press" …>
<p [udxPresence]="{ keyframes: [{ opacity: 0 }, { opacity: 1 }] }">   <!-- new -->
```

#### A.3.6 Svelte (`@udixio/ui-svelte`)

```ts
function motion(
  sources: MotionSources,
  options?: () => MotionAttachmentOptions,
): Attachment<MotionElement>;
```

- The first argument is the core's `MotionSources` as it is (`presence`, `emphasis`, `layout`, `reveal`, `scrub`,
  `loop`): an object key cannot collide with an attribute, so the loop keeps its word, and the object literal gets the
  whole of §3.2 from the compiler.
- One attachment per element; the options stay a getter, second (`present`, `state`, `settled`, `shared`, `paused`,
  `restoreFocus`). The sources are matched by content, as in §3.4: when the attachment runs again with sources
  of equal content, it neither binds again nor replays; sources whose content changed bind again, settled.
- Unchanged: `transition:presence`; `hidden={!open}` with `present`; `motionGesture`, `motionValue`, `motionSequence`;
  `data-motion-step`; `bind:this` and `getMotion(element, kind)?.play()`.

```svelte
motion('slide')                                  ->  motion({ presence: 'slide' })
motion('cascade reflow')                         ->  motion({ presence: 'cascade', layout: 'reflow' })
motion('press', () => ({ state: likes }))        ->  motion({ emphasis: 'press' }, () => ({ state: likes }))
motion(name, () => ({ paused }))                 ->  motion({ loop: name }, () => ({ paused }))
motion('fade', () => ({ present: open }))        ->  motion({ presence: 'fade' }, () => ({ present: open }))
motion('reflow', () => ({ shared: 'cover' }))    ->  motion({ layout: 'reflow' }, () => ({ shared: 'cover' }))
motion('rise'), motion('parallax')               ->  motion({ reveal: 'rise' }), motion({ scrub: 'parallax' })
motion('fade press', () => ({ state: pulses }))  ->  motion({ presence: 'fade', emphasis: 'press' }, () => ({ state: pulses }))
motion({ presence: { keyframes: [{ opacity: 0 }, { opacity: 1 }] } })   // new
```

#### A.3.7 HTML and the four syntaxes

HTML is unchanged: `data-motion="cascade reflow"` keeps its list and its "first listed of a kind" rule, the only place a
list in a string remains. The core's runtime is unchanged.

```text
HTML     <li data-motion="cascade reflow">
React    <Motion as="li" presence="cascade" layout="reflow">
Angular  <li udxPresence="cascade" udxLayout="reflow">
Svelte   <li {@attach motion({ presence: 'cascade', layout: 'reflow' })} transition:presence>
```

The loop is `looping` in React only; the Loop page says so once.

### A.4 The `/motion` home: "What it does", by notion

Section heading "What it does"; lead: "Five kinds of motion an element can carry, and three families beside them."
Six blocks, in the side panel's order:

| #   | Title                       | Sentence                                                                                                                                  | Demo (existing React example, live) | Links                                     |
| --- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | ----------------------------------------- |
| 1/6 | Presence                    | An element that appears plays its entry, and one that leaves plays its exit before it is gone.                                            | `motion-presence`                   | Presence, Lists, Text                     |
| 2/6 | Emphasis                    | A short motion replays each time a state changes.                                                                                         | `motion-emphasis`                   | Emphasis                                  |
| 3/6 | Layout and shared elements  | An element that changes place or size travels there, and two elements that share a key morph into each other.                             | `motion-shared-elements`            | Layout, Shared elements, Page transitions |
| 4/6 | Reveal and scrub            | A motion waits for its element to enter the view, or follows the scroll frame by frame.                                                   | `motion-reveal`                     | Reveal, Scrub, scrollTo                   |
| 5/6 | Loop                        | A motion plays forever, rests off-screen, and comes with a way to pause it.                                                               | `motion-loop`                       | Loop, SVG                                 |
| 6/6 | Values, gestures, sequences | Beyond motions: a value follows the pointer or counts to a number, a gesture drags, swipes and reorders, a sequence plays steps in order. | `motion-gesture`                    | Values, Counters, Gestures, Sequences     |

- Under block 6, one plain row of links, "Also": animateStyle and springs, Tokens, Presets, Accessibility, Per breakpoint.
- Demos are the React examples the need pages show (`client:visible`), on the demo surface; no new demo code. Block 2's
  Like demo carries the reader's `press` motion on a Udixio `Button` (`as={Button}`): the docs rule, not a showcase.
- Each block: title (h3), sentence, demo, links; links go through `withFramework` with `data-framework-link` (§2.8). Two
  columns from 800 px of page, one below. Blocks rise with the `rise` preset, as the page's sections do.
- Files: `root/Notions.astro` (the section) and `root/Notion.astro` (one block) replace `root/Gallery.astro`.
- The rest of the home follows the stored framework by the code-block contract (`[data-code-frameworks]` around
  `[data-example-panel][data-framework]`), which the site keeps for every code block; `[data-framework-variant]` is
  deleted with no exception for neutral pages:
  - `root/Hero.astro`: the four install commands and the four adapter lines are `data-view="code"` panels of one
    group without tabs. No single neutral command: `npm i @udixio/motion` alone is wrong for the three adapters.
  - `root/Principle.astro`: its four results are the `data-view="preview"` panels of its code block, marked
    `data-code-layout="split"` and `data-code-previews`. Its look and toolbar do not change.
  - `lib/framework-choice.ts`: `showChosenFramework` applies the panel rule, shared with the layout's head script,
    instead of the variant rule; `root/framework.ts` stays.
  - `GettingStartedLink` carries `data-framework-link`.

### A.5 Deletions (from §5)

- Home components section: `apps/doc/src/components/motion/root/Components.astro`, the folder
  `apps/doc/src/components/motion/root/components/` (`TabsTile.tsx`, `SnackbarTile.tsx`, `SideSheetTile.tsx`,
  `NavigationRailTile.tsx`, `PauseTiles.tsx`, `ShowcaseTile.astro`, `autoplay.ts`),
  `apps/doc/tests/components-showcase.browser.test.mjs`, and its test and heading in `animation.browser.test.mjs`.
- Gallery: `root/Gallery.astro`, `root/NeedCard.astro`, `root/previews.ts`, `MotionNeed.scene` (the `counters` entry
  stays); the gallery's preview tests in `animation.browser.test.mjs`.
- Adapters: `name` and `step` (React), `udxMotion` / `source` (Angular), the string and array forms of `motion()`
  (Svelte), the three `motionsOf`.

### A.6 Consumers updated in the same change

`packages/motion/README.md` (registry, React, Angular and Svelte passages), `apps/doc/scripts/motion-api.groups.mjs` and
the regenerated `apps/doc/src/data/motion-api.json`, `apps/doc/src/lib/motion-facts.ts`, `root/Hero.astro`,
`root/Principle.astro`, `apps/doc/src/components/motion/scenes/PlayerOpen.tsx`, the usage
skill `plugins/udixio-ui-usage/skills/consume-component/SKILL.md`, and every example of `apps/doc/src/examples/{react,angular,svelte}/motion-*`.
The MCP server's doc snapshot (`packages/mcp/src/bundled`) is generated at its build; its own sources read the manifest
only.

### A.7 Acceptance criteria (from §7)

1. `listMotionSources` and the check in `motionsWhenDefined`: the eight unit tests of §3.3 pass, and one spec per
   adapter asserts its own places in the message.
2. Type tests pass: registry against presets; the table of §3.4; the native-attribute collision test over every member of
   `JSX.IntrinsicElements`, `as` excluded; reveal/scrub exclusivity; per-kind references and specs; Angular input types
   under `strictTemplates`; Svelte `svelte-check` on a fixture using every key.
3. Adapter specs pass in React, Angular and Svelte, with no `motionsOf` left and no `name`, `step`, `udxMotion` or
   string `motion(` in their sources, TSDoc included.
4. `apps/doc`: no `name=`, `step=` on `<Motion>`, no `useMotion('`, `udxMotion=`, `[udxMotion]` or `motion('` left
   (grep, and the throwaway-tsconfig sweep of `apps/doc/AGENTS.md`).
16. React: a parent re-render that passes an equal inline spec neither binds again nor replays the entry; a changed spec
    binds again settled; `<Motion>` with no source renders and reports nothing; a type test refuses
    `presence={ref}` for a `MotionRef` of unknown verb and accepts `presence={ref.name}`.
- From criterion 8: in Chromium, Firefox and WebKit, the home's six blocks in order with their links.

### A.8 Open points (from §8)

1. **`listMotionSources` and the deferred check:** settled by the designer: §3.2 (signatures) and §3.3 (where the
   check runs, the message, the tests).
3. **The home:** settled by the designer: §4 and §5.

DECIDED by Joël: the Angular inputs are `udxPresence`, `udxEmphasis`, `udxLayout`, `udxReveal`, `udxScrub`, `udxLoop`
(§3.5).
