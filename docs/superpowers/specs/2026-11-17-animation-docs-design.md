# The "Animation" section of the documentation site: design

Date: 2026-11-17 · Branch: `feat/anime` · Status: design, ready for implementation
Brief: `.superpowers/sdd/2026-11-17-animation-docs/design-brief.md`
Revised 2026-11-18 after the maintainer's review: the root page is a showcase of the real features by need (§3);
the first concept, a motion-design spectacle, is parked for the future home page (§8).
Prototypes (throwaway, not to be copied verbatim), in
`/tmp/claude-1000/-home-joel-Documents-projets-udixio-ui-components/94acf95f-06e9-4435-8104-8114a215e776/scratchpad/anim-design/`:
`landing2.html` + `landing2.js` (the root page, §3.9) and `index.html` + `app.js` (the parked concept, §8.4);
screenshots in `shots/`.

Words used here: **root page** = `/motion`. **Need page** = one page of the section that answers one need
("Make a list appear"). **Tile** = one need on the root page: its demo, its code, its link. **Scene** = one live,
interactive example (a tile's demo, or the hero of a need page: the same module). **Stage** = the framed surface that
holds a scene.

---

## 1. Intent and the bar

### 1.1 Intent

`@udixio/motion` can now do motion design (presence, lists, layout FLIP with velocity kept on interruption,
undistorted content and corrected corners, shared elements, reveal, native scrub, loops, spring values, counters,
scrubbable sequences, gestures with keyboard alternatives, page transitions, text split, SVG draw/along/morph,
scrollTo, tokens, reduced-motion policy). The current section does not show it: 21 pages behind a line of
underlined links, small demos, and the best material buried in `/motion/demo`.

The redesign has two jobs:

1. **Show what the library really does, need by need, and how.** The root page `/motion` is a showcase of the
   real features, classified by need: each need has a live, polished demo you can use, its code right next to it
   (HTML, React, Angular, Svelte) and a link to its page. Clarity and usefulness come before effect.
2. **Get the visitor to the right documentation by need.** The rail tab "Animation" opens a side panel organised
   by what people want to do ("Make a list appear", "Link to the scroll"…). Every need page opens on the same live
   scene, larger, then shows how to use it in HTML/JS, React, Angular and Svelte.

The spectacle (a motion-design piece that puts the theme system and the ecosystem forward) belongs to the site's
home page, which will be redesigned later. The concept prototyped for it is parked in §8.

### 1.2 The bar

- A visitor finds the need they have in seconds, sees it working, and leaves with code that runs.
- Each demo is a small, finished piece of interface (a notification list, a gallery, a release card), not a grey
  box moving: the maintainer, who has a designer's eye, should find every tile well composed, in dark and light.
- Every effect is done with `@udixio/motion` and CSS, and the code next to it is an excerpt of a tested example.
- Calm by default: nothing plays on load; a demo plays when the visitor acts, or when playing on view is the
  feature itself (reveal, counters, scrub).

### 1.3 Goals

- G1. Rail tab label "Animation"; a pinned side panel with need-based sections (§2).
- G2. A root page with a header, a section bar, and one tile per need in five sections (§3).
- G3. One page template for all need pages: hero scene, usage in four frameworks, options generated from the
  manifest, tokens, reduced motion, limits, related needs (§4).
- G4. A designed reduced-motion version of every scene; a page-level "Reduce motion" switch.
- G5. Shared scene modules: a root-page tile and its need page mount the same module (one implementation, two places).
- G6. Keep all URLs under `/motion/...`. `/motion/demo` (a test bench that grew step by step, not documentation) is
  removed: every demo lives in its need page and its root tile; `/motion/demo` redirects to `/motion` (maintainer
  decision, 2026-11-18).

### 1.4 Non-goals

- No change to `@udixio/motion` itself. Where a prototype hit a missing capability, this spec works around it or
  lists it as a follow-up (§3.9, §8).
- No new framework adapter APIs. No markdown (`.md`) export of motion pages.
- No redesign of the component or theme sections, beyond the shared `Code.astro` extension (§4.3) and the
  `NavSidebar` fixes (§2.4).
- No home-page work: §8 only records the parked concept.

### 1.5 Anti-goals (do not do)

- Spectacle on the root page: no intro animation, no hero piece pushing the needs below the fold.
- Tiny demos without code, or code without a demo; a tile whose demo cannot be used.
- Scroll-jacking: no pinned "scroll to advance" sequences, no wheel interception, no smooth-scroll library.
- Autoplay loops without a visible pause control; anything that flashes more than three times per second.
- Motion on content that was already on the page, except where it is the feature (reveal, counters, scrub).
- Videos, GIFs or Lottie files standing in for motion: everything is live.
- Hard-coded colours. Every colour is a theme token or derived from one with CSS.
- Any other animation library (no Motion, GSAP, CSS animation libraries).
- Numbers that can go stale: figures shown on the pages are computed from the manifest at build time.

### 1.6 References: what we take, what we avoid

| Reference | Take | Avoid |
|---|---|---|
| Motion (motion.dev) | "Small APIs, expressive interfaces": each block = live demo + snippet + doc link. The root page's tile is this block. | Image galleries of motion, upsell sections, organisation by API name. |
| anime.js landing (animejs.com) | Each feature block links to precise doc entries; modular entries loaded on demand (ours too). | Static code snippets in place of live demos. |
| GSAP (gsap.com) | The same categories in the nav, the root page and the footer links. | Showreels and brand logos as proof; videos of motion. |
| Josh Comeau, "A friendly introduction to spring physics" | Demo before theory; each demo isolates one variable (the six spring lanes); widgets operable with the keyboard. | His motion-heavy demos stay on under reduced motion; ours do not. |
| react-spring (react-spring.dev) | The argument "springs, not durations", shown rather than told. | A page that is only a tagline and an install command. |

---

## 2. Information architecture

### 2.1 Rail and side panel

- `apps/doc/src/components/Navigation.tsx`: the rail item `href="/motion"` keeps its `href` and icons; its label
  becomes **"Animation"**. It gets the same behaviour as the other sections: `{...previewProps('motion')}` (hover
  dwell preview, focus preview) instead of `onMouseEnter={endPreview}`.
- `FlyoutId` gains `'motion'`; `flyouts.motion = { title: 'Animation', sections: MOTION_SECTIONS, basePath: '/motion' }`.
- `sectionFromPathname`: `/^\/motion(\/|$)/` returns `'motion'`, so the panel is pinned open on every motion page
  from the `lg` breakpoint, like Components and Theme (the root page included).
- `RAIL_INDEX` gains `motion: 1`; the special case `/^\/motion(?:\/|$)/.test(pathname) ? 1 : …` is removed
  (the pinned id now covers it).
- The panel's title is "Animation"; its `<nav>` is labelled "Animation documentation" (§2.4).

### 2.2 Side panel sections (exact labels and targets)

Source of truth: a new file `apps/doc/src/lib/motion-nav.ts` exporting `MOTION_NEEDS` (rich data, below) and
`MOTION_SECTIONS: NavSection[]` derived from it. The root page's sections and tiles, the related-needs blocks and
`llms.txt` use the same data (llms.txt is static: update it by hand from this table).

Labels are ≤ 24 characters so they fit the 256 px panel.

| Section (category) | Label | Target | API hint (root-page tiles and page chips) |
|---|---|---|---|
| Start | Overview | `/motion` | — |
| Start | Getting started | `/motion/getting-started` | `connectMotion` |
| Start | Presets and verbs | `/motion/presets` | `defineMotion` |
| Appear & leave | Show and hide | `/motion/presence` | `fade` `slide` `scale` |
| Appear & leave | Make a list appear | `/motion/lists` **(new)** | `cascade` `stagger` |
| Appear & leave | Draw attention | `/motion/emphasis` | `press` `shake` |
| Move | Move to a new place | `/motion/layout` | `reflow` |
| Move | Morph one into another | `/motion/shared-elements` **(new)** | `data-motion-shared` |
| Move | Drag, swipe, reorder | `/motion/gestures` | `defineGesture` |
| Move | Change pages | `/motion/page-transitions` | `navigate` |
| Follow the scroll | Reveal on scroll | `/motion/reveal` **(new)** | `rise` |
| Follow the scroll | Link to the scroll | `/motion/scrub` **(new)** | `parallax` |
| Follow the scroll | Scroll to a target | `/motion/scroll` | `scrollTo` |
| Respond & tell | Follow pointer or state | `/motion/values` | `defineValue` |
| Respond & tell | Count a number | `/motion/counters` **(new)** | `format` |
| Respond & tell | Choreograph steps | `/motion/sequences` | `defineSequence` |
| Respond & tell | Animate text | `/motion/text` | `split` |
| Respond & tell | Draw or morph SVG | `/motion/svg` | `draw` `morph` |
| Respond & tell | Loop, and pause it | `/motion/loop` **(new)** | `rotate` `breathe` |
| Fine-tune | Springs and tokens | `/motion/tokens` | `spring.*` |
| Fine-tune | Per breakpoint | `/motion/scopes` | `--udx-motion` |
| Fine-tune | Animate any CSS | `/motion/animate` | `animateStyle` |
| Fine-tune | Reduced motion | `/motion/accessibility` | `data-motion-policy` |
| Reference | Limits | `/motion/limits` | — |
| Reference | Roadmap | `/motion/roadmap` | — |
| Reference | Manifest (JSON) | `/motion-manifest.json` | — |

`MOTION_NEEDS` entry shape:

```ts
export type MotionNeed = {
  slug: string;            // 'lists' — '' for the overview
  label: string;           // side-panel label (table above)
  section: 'Start' | 'Appear & leave' | 'Move' | 'Follow the scroll' | 'Respond & tell' | 'Fine-tune' | 'Reference';
  href: string;            // '/motion/lists'
  hints: string[];         // API chips, as in the table
  summary: string;         // one sentence for the index and related cards
  related: string[];       // slugs of related needs, 2 to 3
  scene?: string;          // scene module shared by the root-page tile and the page's hero ('inbox'); none for Start and Reference
  feature?: boolean;       // a full-width tile on the root page (one per section)
};
```

### 2.3 Page map: kept, split, renamed, added

| Today | After | What happens |
|---|---|---|
| `index` | `/motion` | Rewritten as the root page: every need, live, with its code (§3). |
| `getting-started`, `presets`, `presence`, `emphasis`, `gestures`, `page-transitions`, `text`, `svg`, `scroll`, `animate`, `scopes`, `accessibility`, `tokens`, `limits`, `roadmap` | same URL | Moved onto the template (§4); titles become the need labels. |
| `layout` | `/motion/layout` + `/motion/lists` + `/motion/shared-elements` | Split: layout keeps reflow, resize, scope, `play()`; lists take cascade, stagger, origin, exit; shared elements take keys, rules, limits. |
| `reveal-scrub-loop` | `/motion/reveal` + `/motion/scrub` + `/motion/loop` | Split by need. The old URL becomes a redirect to `/motion/reveal` (Astro `redirects` in `astro.config.ts`; static output writes a meta-refresh page). |
| `values` | `/motion/values` + `/motion/counters` | Split: values keep pointer, scroll, state, time; counters take formats, locale, accessible text. |
| `demo` | `/motion/demo` | **Removed**: redirect to `/motion`. Its demos move to their need pages (heroes) and root tiles; its tests move with them (task 8). |

Route list after the change (26 pages + 1 redirect), all with a trailing slash in the built site:

```
/motion  /motion/getting-started  /motion/presets
/motion/presence  /motion/lists  /motion/emphasis
/motion/layout  /motion/shared-elements  /motion/gestures  /motion/page-transitions
/motion/reveal  /motion/scrub  /motion/scroll
/motion/values  /motion/counters  /motion/sequences  /motion/text  /motion/svg  /motion/loop
/motion/tokens  /motion/scopes  /motion/animate  /motion/accessibility
/motion/limits  /motion/roadmap
redirect: /motion/reveal-scrub-loop → /motion/reveal
```

### 2.4 `NavSidebar` changes (`apps/doc/src/components/Sidebar.tsx`)

- `NavSidebar` takes an optional `label` prop and renders `<nav aria-label={label}>`; `Navigation.tsx` passes
  `` `${flyout.title} documentation` `` ("Animation documentation", "Components documentation"…).
- `findActivePage` normalises a trailing slash on both sides before comparing (`/motion/lists/` matches
  `/motion/lists`; `/motion/` matches `/motion`). Today exact matches only work by luck of the `/overview` rule.
- External link "Manifest (JSON)": a `NavPage` with `href: '/motion-manifest.json'`; `Button` renders a plain link.

### 2.5 `MotionPage.astro` and the in-page link line

The line of underlined links (`<nav aria-label="Motion documentation">`) is removed: the side panel replaces it.
Below `lg`, where the panel is not pinned, each need page ends with "Related needs" and a "All needs" link
to `/motion`, and the rail's burger menu shows the panel (existing behaviour).

---

## 3. The root page `/motion`: what you can do, need by need

### 3.1 Concept

One page that answers "what can I do with it, and how?". A short header (what the library is, the three lines to
start), a sticky bar of five sections, then **one tile per need**: a live demo on top, then the need's name, one
sentence, its code in four frameworks, what reduced motion does, and a link to its page. Five tiles, one per
section, are **feature tiles** (full width, demo beside the code): the five richest scenes. The others sit two per
row. The tiles use the same scene modules as the need pages, in a compact variant: the root page is the index of
the need pages' heroes.

Prototype: `landing2.html` / `landing2.js` (scratchpad, §3.9). It was checked inside a mock of the doc chrome
(96 px rail + 256 px pinned panel), so at a 1280 px window the content is about 900 px wide, as in the site.

Container: the page renders inside `#doc-content`, next to the rail and the pinned panel (pinned on `/motion` like
the other sections). **All breakpoints are container queries** on the page root (`@container/motion-root`):

| Container width | Tiles | Feature tile |
|---|---|---|
| ≥ 760 px | 2 per row | full row; stage 7fr, body 5fr side by side |
| < 760 px | 1 per row | stage above body |
| < 560 px | 1 per row, mobile rules (§3.7) | stage above body |

Page width cap 1120 px; side padding 32 px (16 px under 560 px). No TOC sidebar (`docSidebar` false): the section
bar plays that role.

### 3.2 Header

- Eyebrow `@udixio/motion` (`text-label-large`, letter-spacing .1em, uppercase, `text-primary`).
- `<h1>` "Animation" (`text-display-small` up to `text-display-medium`: `font-size: clamp(44px, 7cqi, 64px)`,
  Montserrat, `letter-spacing: -0.02em`). No animation.
- Lede (`text-body-large`, `text-on-surface-variant`, max 60ch): "Define a motion once, attach it by name in HTML,
  React, Angular or Svelte. Here is what it does, need by need: try each one, copy its code, open its page."
- Start line: three code chips `npm i @udixio/motion animejs` · `connectMotion()` · `data-motion="slide"`, then the
  link **Getting started →** (`/motion/getting-started`).

### 3.3 Section bar

`<nav aria-label="Sections of this page">`, `position: sticky; top: 0`, background
`color-mix(in oklab, var(--color-surface-container) 88%, transparent)` with `backdrop-filter: blur(12px)`:

- Five links to the section anchors: **Appear & leave** `#appear`, **Move** `#move`, **Follow the scroll**
  `#scroll`, **Respond & tell** `#tell`, **Fine-tune** `#tune` (the side panel's sections, without Start and
  Reference). `text-label-large`, 36 px tall, `rounded-full`.
- The current section is marked by a filled pill (`bg-secondary-container`, text `on-secondary-container`) that is
  a **shared element**: each link holds a `<span class="ind" data-motion="reflow"
  data-motion-shared="motion-sections">`, all `hidden` but the current one; changing section hides the old one and
  shows the new one in the same task, and the pill travels (the doc's TOC highlight uses the same mechanism).
  The current link has `aria-current="true"`. It follows the scroll through one IntersectionObserver on the
  sections (`rootMargin: '-30% 0px -60% 0px'`).
- A click scrolls with `scrollTo(section, { focus: true, offset: -64 })` (the section's `<h2>` gets the focus);
  without JS the anchors work.
- On the right: the **Reduce motion** switch (§3.4). Under 560 px the switch moves to the header (below the start
  line) and the links scroll horizontally (`overflow-x: auto`, no scrollbar, a 24 px fade mask on the right); the
  current link is kept in view by scrolling the list, not the page. (The prototype cut "Follow the scroll" behind
  the switch at 375 px.)

### 3.4 Reduce motion switch

The Udixio `Switch` (React island, `client:idle`), label "Reduce motion", helper text "Applies to this
documentation site."

- On: `document.documentElement.setAttribute('data-motion-policy', 'reduce')`; off: remove it.
- Persisted in `localStorage['udixio:docs:motion-policy']` (`'reduce'` or absent), re-applied on
  `astro:after-swap` (the client router replaces `<html>` attributes). The same switch is in the header of every
  motion page (§4.1).
- When the system asks for reduced motion (`matchMedia('(prefers-reduced-motion: reduce)')`), it is shown checked
  and disabled, with the helper text "Your system asks for reduced motion."
- It lets a visitor compare every tile with its reduced version in place: each tile states what changes (§3.5).

### 3.5 The tile

`apps/doc/src/components/motion/NeedTile.astro`, props `slug` (key of `MOTION_NEEDS`), `feature?: boolean`,
`scene` (scene module), `size?: 'md' | 'lg'`; slots `controls` and default (the scene markup).

```
<article class="need-tile" id="need-<slug>" aria-labelledby="need-<slug>-title">
  <div class="stage" role="group" aria-label="Live example: <label>" data-motion-scene="<scene>" data-size="tile">
    controls row · scene (centred) · hint line
  </div>
  <div class="body">
    <h3>label</h3> <a>Page →</a>
    one sentence (MOTION_NEEDS.summary)
    code tabs HTML · React · Angular · Svelte + copy button
    "Reduced motion: …" (one phrase)
  </div>
</article>
```

- Tile: `rounded-[28px] bg-surface-container-low`, `overflow: hidden`. Stage: inset 6 px, `rounded-[22px]
  bg-surface-container-lowest`, padding 20 px, `min-height: 260px` (feature 420 px; 220 px under 560 px),
  `overflow: clip`, `data-motion-scope`. Its content is a column: controls row at the top (left-aligned,
  `gap-2`), the scene **centred in the remaining space** (`flex: 1; display: grid; place-items: center`), the hint
  (`text-body-small text-on-surface-variant`) at the bottom. The prototype left the scenes top-aligned in tall
  stages and the small tiles looked empty: scenes must fill their stage (objects sized for it: loops 40–56 px,
  counters `text-display-small`).
- Body: padding 18–22 px; title `text-headline-small`; the page link `text-label-large text-primary`
  ("Lists →", "Presence →", the short page name); summary `text-body-medium text-on-surface-variant`.
- Code: a tablist per tile (WAI-ARIA tabs pattern: roving `tabindex`, arrow keys, Home/End), tabs **HTML ·
  React · Angular · Svelte**. All four snippets are rendered at build time with Shiki (`astro:components` `Code`,
  `theme="css-variables"`, inside a `card-code` wrapper so the colours of `Code.astro` apply); only the selected one
  is shown. The selection is **one preference for the whole page and the site**: it is stored under the same
  `localStorage` key as `exampleFrameworkStore` (`udixio:docs:preferred-example-framework`, now accepting
  `html`, §4.3); choosing React in one tile shows React in every tile. A copy button (`IconButton`-styled, label
  "Copy <framework> code") copies the visible snippet and announces "Code copied" in a polite live region.
  The tabs are vanilla (no island per tile).
- Snippets: `apps/doc/src/examples/motion-snippets/<slug>.ts` exports `{ html, react, angular, svelte }`. Each
  snippet is **an excerpt of the need page's example sources** (`examples/html/motion-<x>.html`,
  `examples/react/motion-<x>.tsx`, …): lines are copied, never edited; an elision is a line `// …` or `<!-- … -->`.
  At most 10 lines; at most 44 characters per line in a regular tile, 56 in a feature tile (the prototype's
  longer lines were cut); `overflow-x: auto` as a fallback. A node test checks the excerpt rule (§6, task 8).
- Controls that change an option (an origin, a preset, a split) update a small mono chip in the stage's control
  row (`origin: 'center'`), not the snippet: the snippet stays the static, copyable excerpt.
- "Reduced motion: …" — `text-body-small`, a 6 px `outline` dot before it, one phrase from §3.6.

### 3.6 Sections and their tiles

20 tiles. ★ = feature tile (first of its section). "Scene" = module in `apps/doc/src/components/motion/scenes/`,
shared with the need page's hero (§5). Each section opens with an `<h2>` and one sentence.

**Appear & leave** — "Elements that enter, leave, and call for attention."

| Need (tile) | Scene, compact variant | Plays | Reduced motion |
|---|---|---|---|
| ★ Make a list appear | `inbox`: **Add one**, **Add three**, origin group **First · Center · Last**; a notification list (max 5 visible; older ones leave out of flow and are removed); swipe or Delete to dismiss. | On press, swipe, Delete. | "A short fade, no cascade." |
| Show and hide | `presence`: a "Saved to your library" snackbar-like card; **Hide/Show** (`aria-expanded`), preset group **fade · slide · scale**. | On press. | "A short fade." |
| Draw attention | `emphasis`: a code field + **Check** (`press`); a wrong code (anything but 1234) shakes the field (`shake`, `aria-invalid`); hint "Try 0000". | On press, Enter. | "No movement; the end state applies." |

`inbox` definitions (shared with `/motion/lists`):

```ts
for (const origin of ['first', 'center', 'last'] as const)
  defineMotion(`inbox-${origin}`, { verb: 'appear', stagger: 'normal', origin, exit: 'out-of-flow',
    keyframes: [{ opacity: 0, y: -16, scale: 0.96 }, { opacity: 1, y: 0, scale: 1 }] });
defineGesture('dismiss', { kind: 'swipe', alternative: 'action' });
```

Items: 36 px avatar (`bg-primary-container`), name (`text-title-small`), message (`text-body-small`), time;
`rounded-2xl bg-surface-container-high`, `tabindex="0"`, `data-motion="inbox-<origin> reflow"`,
`data-motion-gesture="dismiss"`; the `<ul>` is `position: relative` (needed by `out-of-flow`) with a fixed
`min-height` for five items, so adding never pushes the page. `motion-swipe` not prevented → remove the item once it
is `aria-hidden="true"`. Hint: "Swipe an item away, or focus it and press Delete."

**Move** — "Elements that travel to their new place, morph, or follow the hand."

| Need (tile) | Scene, compact variant | Plays | Reduced motion |
|---|---|---|---|
| ★ Morph one into another | `gallery`: **Grid · List**; six thumbnails (role colours: `primary-container`, `tertiary-container`, `secondary-container`, `primary`, `tertiary`, `surface-container-highest`, each with its `on-` colour; an M3 shape glyph and a name); a thumbnail opens into its detail (shared key), **Close** or Escape morphs it back. | On press. | "Opens and closes at once." |
| Move to a new place | `resize`: a card with **Widen** (its chip and text keep their shape while it resizes), a pill with **Start · End**, a three-row list with **Shuffle**. | On press. | "The new layout applies at once." |
| Drag, swipe, reorder | `gestures`: four tasks; reorder by drag or Space + arrows; swipe a task to complete it; event chip shows the last event (`motion-reorder 2 → 3`). | On gesture or key. | "Moves at once, no glide." |
| Change pages | `pages`: a small two-frame diagram (SVG, drawn on reveal) and the real link **Go to "Scroll to a target" →**: the page slides forward; Back slides back. | On navigation. | "The page changes without sliding." |

`gallery` (shared with `/motion/shared-elements`): each thumbnail is a `<button type="button"
aria-expanded="false" aria-controls="gallery-detail" data-motion="reflow" data-motion-shared="shape-<i>">`; the
detail `<div id="gallery-detail" data-motion="reflow" data-motion-shared="" hidden>` is absolutely positioned over
the gallery (inset 20 px, `rounded-[28px]`), with the large shape, the name (`<h4>` in a tile, `<h3>` on the page),
one sentence in the `on-` colour at full opacity, and **Close**. Open: in one task copy key and colours to the
detail, `thumbnail.hidden = true`, `detail.hidden = false`, `aria-expanded="true"`, then focus Close on the next
frame. Close (button or Escape): `detail.hidden = true`, `thumbnail.hidden = false`, focus the thumbnail. The detail
is a disclosure, not a modal (no focus trap). Grid · List toggles a class: thumbnails become 56 px rows, shapes and
names keep their size. Shapes come from `apps/doc/src/lib/m3-shapes.ts` (generator in §8.3, run at build time).

**Follow the scroll** — "Reveal on entry, follow the scroll, scroll to a place."

| Need (tile) | Scene, compact variant | Plays | Reduced motion |
|---|---|---|---|
| ★ Link to the scroll | `thread`: a curve drawn by the page scroll through the tile, with three cards (reveal, scrub, value) alternating beside it; a support chip from `supportsViewTimeline()`. | With the scroll. | "Shown whole and still." |
| Reveal on scroll | `reveal`: a 220 px scrollable feed (`tabindex="0"`, `aria-label="Feed"`) of ten `rise` cards; group **Once · Always** (`repeat`). | When cards enter the feed's view. | "Shown at once." |
| Scroll to a target | `scroll`: a scroll box with five sections and buttons 1–5 that `scrollTo` them (`container`, `focus: true`); hint "Turn the wheel during the scroll: it stops." | On press. | "Jumps to the target." |

`thread` (shared with `/motion/scrub`): an SVG behind the cards, `viewBox="0 0 100 1000"
preserveAspectRatio="none"`, two copies of `M50 0 C 95 120, 5 250, 50 380 S 95 640, 50 760 S 5 920, 50 1000`: a
dashed ghost (`--color-outline-variant`, `stroke-dasharray: 2 8`) and the drawn line (`--color-primary`, width 3),
both `vector-effect: non-scaling-stroke`. Definition `{ verb: 'scrub', range: 'cross', keyframes: [{ draw: 0 },
{ draw: 1 }] }` in the tile (the stage crosses the viewport), `range: 'contain'` on the page. A 4 px progress bar
bound to a `scroll` value (`scale: var(--udx-motion-value-<name>, 0) 1`) sits above the cards. Support chip:
"Scroll-linked in this browser" or "No ViewTimeline here: shown whole" (Firefox at the time of writing).

**Respond & tell** — "React to the pointer and to state, count, choreograph, write, draw and loop."

| Need (tile) | Scene, compact variant | Plays | Reduced motion |
|---|---|---|---|
| ★ Choreograph steps | `launch`: a release card (kicker, title, sparkline, two counters) played as a sequence, with a play/pause button and a ruler that seeks it, and a timecode. | Once when 50 % in view; then on the ruler and the button. | "All steps at once; the ruler still seeks." |
| Follow pointer or state | `pointer`: a card that tilts with the pointer (two `pointer` values), and a range input "Level" driving a `state` value that fills a gauge over a spring. | On pointer and input. | "Written at once; no tilt." |
| Count a number | `counters`: visitors (integer) and returning (percent), **Add 1,000**. | When they enter the view, then on press. | "The number is written at once." |
| Animate text | `text`: the sentence "Every word arrives in turn, and is read once."; group **chars · words · lines**; **Replay**. | Once in view (a `reveal` with `split`), then on Replay/choice (`play()`). | "Not split; a short fade." |
| Draw or morph SVG | `svg`: an M3 shape morphing on **Cookie · Flower · Clover · Sunny** (`morph`), and a check mark drawn once in view (`draw`), **Draw again**. | Draw once in view; morph on press. | "Set at once." |
| Loop, and pause it | `loop`: a spinner (`rotate`), a live dot (`breathe`), a recording light (`blink`), 40–56 px; **Pause loops**. | While visible (the library rests them off-screen). | "Still." |

`launch` (shared with `/motion/sequences`):

```ts
defineSequence('launch', { verb: 'appear', steps: {
  kicker: { keyframes: [{ opacity: 0, x: -12 }, { opacity: 1, x: 0 }] },
  title:  { keyframes: [{ opacity: 0, y: 24 }, { opacity: 1, y: 0 }], at: '+=normal', timing: 'spring.slow.spatial' },
  chart:  { keyframes: [{ draw: 0 }, { draw: 1 }], at: 'title',
            timing: { duration: 'duration.extraLong2', easing: 'easing.standard' } },
  stats:  { keyframes: [{ opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1 }], stagger: 'loose' },
} });
```

Card: left `bg-primary-container rounded-3xl` (kicker "Release", title "Seven verbs, one runtime.", sparkline
stroke `--color-primary`); right two stat cards with counters whose numbers come from the manifest at build time
(`Object.keys(motionManifest.verbs).length` "verbs", `Object.keys(motionManifest.presets).length` "presets").
Timeline: 48 px icon button (triangle ⇄ bars, `morph(path, …, { timing: 'spring.fast.spatial' })`, `aria-label`
"Play the sequence" / "Pause the sequence"), range input (`aria-label="Sequence time"`, `min=0 max=1000`,
`aria-valuetext="412 of 1385 milliseconds"`), timecode `0412 / 1385 ms` (tabular nums, `aria-hidden`).
Bound with `sequence(root, 'launch', { settled: true })`; first play when 50 % visible (one IntersectionObserver,
then disconnected), counters `set()` at the same moment; a rAF loop moves the ruler while playing; ruler input =
pause then `handle.seek(fraction × (delay + duration))`; **a finished handle is frozen**: play again, pause, seek.

**Fine-tune** — "Timing, breakpoints, any CSS property, and reduced motion."

| Need (tile) | Scene, compact variant | Plays | Reduced motion |
|---|---|---|---|
| ★ Springs and tokens | `springs`: six lanes (`fast.spatial` … `slow.effects`, with damping ratio and stiffness from `motionManifest.tokens.springs[token].expressive`), balls driven by `createSpring`; **Send / Send back**. | On press. | "The balls jump to their target." |
| Per breakpoint | `scopes`: three cards with `rise`: plain, `[--udx-motion:fade-on-view]`, `[--udx-motion:none]`; **Replay**. | On press. | "All three appear at once." |
| Animate any CSS | `animate`: a card whose background colour, corner radius and `clip-path` change with `animateStyle` on **Next state**. | On press. | "The end state applies." |
| Reduced motion | `policy`: a mini scene (a card entry, a reflow, a loop) and a pointer to the page's switch; the three lines of what changes. | On press. | (it is the subject) |

The springs scene shows six lanes on the root page and on `/motion/tokens`; the drag "throw" tile from the first
concept moves to `/motion/gestures` (the sticker).

### 3.7 What plays when, performance, accessibility, responsive, dark mode

**What plays when**

| Moment | What runs |
|---|---|
| Load | Nothing. No intro. |
| Idle | Nothing, except the loop tile while it is visible (it has a pause control). |
| Scrolling | The thread scrub (compositor), reveals and counters entering the view once, the launch sequence once, the section bar's pill. |
| A press, a key, a gesture | The scene of that control only. |

- Scenes are mounted on demand by the shared loader (`scenes/loader.ts`, §4.2): each stage has
  `data-motion-scene="<name>"`; an IntersectionObserver (`rootMargin: '50% 0px'`) imports and mounts a scene when it
  first nears the view. Sub-entries (`value`, `sequence`, `gesture`, `svg`, `text`, `scroll`, `animate`) are imported
  by the scenes that need them, never by the page shell. The layout engine is preloaded by the first scene that
  binds a layout (`await loadLayoutEngine()`).
- Lifecycle with the client router: each scene exports `mount(root: HTMLElement): () => void`; the loader mounts on
  `astro:page-load` and tears down on `astro:before-swap` (`revert(root)` from `@udixio/motion/scope`, `destroy()` of
  value bindings, `stop()` of springs, cancel morphs, disconnect observers).
- No island per tile: tiles, tabs and copy buttons are vanilla; the only island is the Reduce motion switch.
- No layout shift: stage heights are fixed by `min-height` and by the scenes' own fixed sizes (inbox list, feed box,
  gallery aspect); nothing is hidden at load.
- Budget: no long task over 50 ms while loading the page in Chromium desktop (PerformanceObserver `longtask`), and
  no running time-based animation at the top of the page one second after load (§6, task 8).

**Accessibility**

- Headings: `<h1>` Animation, `<h2>` per section (`tabindex="-1"` for the section bar's focus), `<h3>` per tile.
- Each stage is `role="group"` with `aria-label="Live example: <need>"`. Controls are native buttons, inputs and
  links with visible labels; toggle groups use `aria-pressed`; focus ring `focus-visible:outline-2
  outline-offset-2 outline-on-surface`.
- Every gesture has its keyboard alternative and a visible hint in its stage (swipe → Delete, reorder → Space and
  arrows). The pointer tilt is decorative: the "Level" input is the operable part of that tile.
- Code tabs follow the tabs pattern; the copy confirmation is the only page-level live region (plus the library's own
  reorder region).
- One loop tile, with **Pause loops** (WCAG 2.2.2), `pause: 'control'` presets; `blink` is one dim flash per second.
- Decorative graphics (shapes, the thread, the sparkline, the balls) are `aria-hidden`.

**Responsive** (container widths, §3.1): under 560 px stage min-height 220 px, one tile per row, feature tiles
stacked, section bar scrolls horizontally and the switch moves to the header, gallery 2 columns, lanes with the label
above the track, release card one column. **No horizontal page scroll at 375 px** (checked in the prototype:
`scrollWidth` 375): every grid column is `minmax(0, 1fr)`, snippets scroll inside their block.

**Dark mode**: theme tokens only. Tile `surface-container-low`, stage `surface-container-lowest` (deeper in dark,
white in light), code `surface-container-high`, Shiki colours from `Code.astro`'s `.card-code` variables (light and
dark already defined). Checked in both modes in the prototype.

### 3.8 Copy

Section sentences and tile summaries are in `MOTION_NEEDS` (`summary`), one sentence each, present tense, no
marketing adjectives. Examples: "Items added together cascade in visual order; a leaving item lets its neighbours
close the gap." · "Set `hidden`: the exit plays, then the element is gone. Remove it: the entry plays." ·
"Waits in its first frame until it enters the view, then plays once." · "A formatted value that counts to each new
number; screen readers get the final one." · "Plays forever, rests off-screen, and always comes with a way to pause
it."

### 3.9 Prototype findings and screenshots

Root page prototype (`…/anim-design/landing2.html`), at 1280 × 900 inside a mock rail + pinned panel (content
≈ 900 px), at 375 × 812, dark and light:

- Header, section bar, first feature tile: `…/anim-design/shots/l2/l2-top.png`
- Add three with origin Center, mid-cascade: `…/anim-design/shots/l2/l2-add3-130ms.png`
- Presence tile hiding, emphasis tile: `…/anim-design/shots/l2/l2-presence-hide-120ms.png`, `l2-shake.png`
- Follow the scroll section (the pill has travelled to it): `…/anim-design/shots/l2/l2-scroll.png`
- Respond & tell tiles: `…/anim-design/shots/l2/l2-tell.png`
- Mobile: `…/anim-design/shots/sheet-l2-mobile.png`; light: `…/anim-design/shots/sheet-l2-light.png`
- Scenes from the first prototype that the tiles reuse (shown there larger): `…/anim-design/shots/desk/20-act-presence.png`,
  `20-act-layout.png`, `20-act-scroll.png`, `20-act-physics.png`, `20-act-story.png`, `32-shared-120ms.png`,
  `33-shared-open.png`, `37-seek-25.png`

(`…` = `/tmp/claude-1000/-home-joel-Documents-projets-udixio-ui-components/94acf95f-06e9-4435-8104-8114a215e776/scratchpad`.)

What the prototypes taught, to respect:

1. Small tiles with top-aligned scenes look empty: centre the scene and size it for the stage (§3.5).
2. Snippet lines longer than ~44 characters are cut in a regular tile at 900 px content width (§3.5).
3. At 375 px the switch hid the section links: move it out of the bar (§3.3).
4. A presence name in `data-motion` on an element inserted after `connectMotion()` plays its entry at insertion.
   To control when an entry plays, bind with `motion(el, name, { settled: false })` at that moment.
5. At rest the runtime removes neutral inline values (opacity 1): a stylesheet rule that hides an element must be
   removed before its entry ends.
6. An author `display` rule beats the `hidden` attribute: Tailwind's preflight covers it in the site; custom CSS on a
   toggled element needs `[hidden] { display: none !important }`.
7. A sequence handle seeks backwards and forwards, `draw` steps included; once finished it is frozen: play again,
   pause, seek.
8. `scrub` + `draw` works on a `preserveAspectRatio="none"` SVG with `vector-effect: non-scaling-stroke`.
9. Shared element in a grid: hiding the thumbnail reflows its neighbours; an absolute detail over the grid hides that
   reflow on open and shows it on close (keep it).
10. A section-bar pill as a shared element moves cleanly between links while the page scrolls.
11. Easing tokens that exist: `easing.linear`, `easing.standard`, `easing.standardAccelerate`,
    `easing.standardDecelerate` (`easing.emphasized` does not: the validator throws).

Library follow-up (not in this pass, record it in the motion spec's open points): per-step timing on a sequence
handle, to draw step marks on the ruler.

---

## 4. The need-page template

### 4.1 Structure (every need page, in this order)

1. **Header**: section name as eyebrow (`text-label-large text-primary`), `<h1>` = the need label ("Make a list
   appear"), a one-sentence lede, API chips (the `hints` of the need, mono, `bg-surface-container-high`), and the
   **Reduce motion** switch on the right (§3.2).
2. **Hero scene**: a `MotionStage` with the page's live example (the same scene module as its root-page tile, larger), controls and a live code readout. It is the first
   thing under the header, before any prose.
3. **How to use**: `MotionUsage` — tabs **HTML · React · Angular · Svelte** (order fixed), each with code, and a live
   preview where the framework example exists (§4.3, §5).
4. **Options**: `MotionOptions` — generated from the manifest for the page's verb(s) (name, values, default,
   description).
5. **Timing and tokens**: `MotionTokens` — the tokens the page's motions use, with their values from the manifest.
6. **Reduced motion**: what this need shows under the policy (one short table or list) and how to turn it off per
   element (`--udx-motion: none`).
7. **Limits**: the limits of this need (moved from `/motion/limits`, which keeps the full list).
8. **Related needs**: `MotionRelated` — two or three cards from `MOTION_NEEDS[slug].related`.

The TOC sidebar is on (`docSidebar: true`) for need pages. Reference pages (limits, roadmap) keep their
current body and only take the header (no hero scene).

### 4.2 Shared components to build

All in `apps/doc/src/components/motion/` unless stated.

| Component | Props / API | Notes |
|---|---|---|
| `MotionPage.astro` (`src/components/`) | `title`, `description`, `slug` (key of `MOTION_NEEDS`), `docSidebar?` | Header from `MOTION_NEEDS[slug]`; slot for the body; no underlined link line. |
| `MotionStage.astro` | `scene` (scene module name), `label` (aria-label), `height?: 'sm' \| 'md' \| 'lg'` (240/360/480 px min), `replay?: boolean`; slots `controls`, default (scene markup), `readout` | `<section aria-label>` + controls row + body `rounded-[28px] bg-surface-container-low p-5 overflow-clip` + readout `<pre>` (mono, `bg-surface-container-high rounded-2xl`, `overflow-x:auto`). `data-motion-scene={scene}` for the loader. |
| `scenes/loader.ts` | — | §3.7: lazy import + mount/teardown on router events. Included once by `MotionPage.astro` and the root page. |
| `NeedTile.astro` | `slug`, `feature?`, `scene`, `size?`; slots `controls`, default | The root page's tile (§3.5). |
| `root/tabs.ts` | — | Vanilla code tabs + copy for the tiles, sharing the framework preference (§3.5). |
| `m3-shapes.ts` (`src/lib/`) | `shapePath(n, d, phi)` | Build-time M3 shape paths (formula in §8.3) for the gallery and SVG scenes. |
| `scenes/<name>.ts` | `export function mount(root: HTMLElement): () => void` | One per scene; options read from `data-*` on the stage. |
| `MotionUsage.astro` | `name` (example base name, e.g. `motion-list`), `live?: boolean` (default true) | Wraps `Code.astro` with the four sources (§4.3). |
| `MotionOptions.astro` | `verb?`, `rows?` | Rows from `motionManifest.verbs[verb].options`, values from `motionManifest.domains`, defaults from `motionManifest.defaults[verb]`; descriptions from `motionDocs.ts`. `rows` for non-verb APIs (values, gestures, sequences, scrollTo). |
| `MotionTokens.astro` | `tokens: string[]` | Spring: damping ratio and stiffness (expressive and standard) from `motionManifest.tokens.springs`; curves: ms and easing from `tokens.duration` / `tokens.easing`. |
| `MotionRelated.astro` | `slug` | Cards with label, summary and first hint. |
| `motionDocs.ts` (`src/lib/`) | `optionDocs: Record<string, string>` | One-sentence description per option name (stagger, origin, exit, split, repeat, axis, range, pause, reason, reduced, interrupt, shared, timing). |
| `motionDemo.ts` (existing) | add `segmentedClass`, `segmentedButtonClass`, `chipClass`, `stageControlsClass` | Keep the existing exports unchanged (demo pages use them). |

### 4.3 Code tabs: adding HTML to `Code.astro`

- `apps/doc/src/stores/exampleFrameworkStore.ts`: `ExampleFramework` becomes `'html' | 'react' | 'angular' |
  'svelte'`; `EXAMPLE_FRAMEWORKS = ['html', 'react', 'angular', 'svelte']`; the default preference stays `'react'`.
  Component pages are unaffected: they provide no `html` source, and `resolveExampleFramework` falls back to an
  available framework.
- `Code.astro`: `frameworkLanguages.html = 'html'`; render the `html` panels like the others; a framework is listed
  when it has a source; its **preview** panel exists only when its slot exists. When the active framework has no
  preview, `CodePreview` hides the Preview/Code switch and shows the code.
- `CodePreview.tsx`: `frameworkLabels.html = 'HTML'`.
- Sources: `apps/doc/src/examples/html/motion-<name>.html` (new folder: markup + `<script type="module">`, written
  as a reader would paste it), and the existing `examples/{react,angular,svelte}/motion-<name>.*`, imported `?raw`.
  The HTML tab's live preview is the page's hero scene, not repeated.
- React/Angular/Svelte previews are islands with `client:visible` (not `client:load`/`client:only` eagerly), so a
  page does not boot three frameworks before the visitor scrolls to them. Keep `client:only` where SSR of the
  example is impossible.

---

## 5. Per-page content

"New" = new example files `examples/{html,react,angular,svelte}/motion-<x>.*`; "code" = framework tabs code-only
(the API is a plain function call); "live" = live previews for React/Angular/Svelte. Every page gets an HTML source.

| Page | Hero scene (stage) | Usage examples | Frameworks |
|---|---|---|---|
| `/motion/getting-started` | `start`: a card stack; **Show a card** inserts a card with `slide`; readout = the three lines (install, `connectMotion()`, `data-motion`). | Install + connect + attach, per framework (HTML: module script; React `useMotion`; Angular `Motion` import + `udxMotion`; Svelte attachment + `transition:presence`). | existing presence examples, live |
| `/motion/presets` | `presets`: a wall of the 13 presets, one tile each (name + verb chip). Appear presets replay on click (exit then entry); `press`/`shake` on click (`data-state`); `rise` replays (`play()`); `parallax` tile links to `/motion/scrub`; loops run with one **Pause loops** button. | `data-motion="<preset>"`; `defineMotion` with each of the seven verbs (table of verbs kept). | code |
| `/motion/presence` | `presence`: a sheet/toast card; group **fade · slide · scale · pop** (`pop` = custom definition shown in readout); **Hide/Show** toggle with `aria-expanded`; focus restore shown with a button inside the card. | HTML `hidden`; `data-motion-restore-focus`; React `present`/`mounted`; Angular `@if` + `udxMotion`; Svelte `transition:presence`. | existing `motion-presence`, live |
| `/motion/lists` (new) | `inbox` with an extra **Stagger tight · normal · loose** group and an **Exit in place · out of flow** group. | `cascade reflow`; `stagger`/`origin`/`exit` definition; React `useMotion(['cascade','reflow'], { present })`; Angular `udxMotion="cascade reflow"` in `@for`; Svelte `motion(['cascade','reflow'])` + `transition:presence`. | new `motion-list`, live |
| `/motion/emphasis` | `emphasis`: a **Save** button with `press`; a code field that `shake`s on a wrong code (type anything but 1234, Enter); a notification badge whose count increments with a custom `pop` emphasis. | `data-state`; React `state`; Angular `[udxMotionState]`; Svelte `state`. | existing `motion-emphasis`, live |
| `/motion/layout` | `resize`: a card with **Widen** (its chip and text keep their shape while it resizes), a pill **Start · End**, a five-row list with **Shuffle** and **Move first to end**. | `reflow`; scope (`data-motion-scope`); `getMotion(el)?.play()` after an inline style. | existing `motion-layout`, live |
| `/motion/shared-elements` (new) | `gallery` (thumbnails open into their detail; **Grid · List**) plus a tab bar whose indicator is a shared element ("the highlight of this page's table of contents is one too"). | `data-motion-shared`; `useMotion('reflow', { shared })`; `udxMotionShared`; Svelte option; `defineShared`. | new `motion-shared`, live |
| `/motion/gestures` | `gestures`: one "Today" board: reorder tasks (grab), swipe to complete (action), a sticker you throw (drag, `release: 'spring.slow.spatial'`, arrows). Event log line under the stage (`motion-reorder`, `motion-swipe`, `motion-dragend`), `aria-live="off"`. | `defineGesture` per kind; events; React `useMotionGesture`; Angular `[udxMotionGesture]` + outputs; Svelte `motionGesture`. | existing `motion-gesture`, live |
| `/motion/page-transitions` | `pages`: two real links **Forward to "Scroll" →** and **← Back** (history), and an SVG diagram of two page frames drawn on reveal showing the slide direction. | `navigate(update, { direction })`; `connectAstroTransitions()`; React Router / Angular Router / SvelteKit hooks calling `navigate` (code). | code |
| `/motion/reveal` (new) | `reveal`: a 360 px scroll box (a feed) with `rise` cards; toggle **Once · Always** (`repeat`). Reveal tracks the viewport through the box's clipping. | `data-motion="rise"`; reveal definition (`stagger`, `origin`, `repeat`, `axis`); `useMotion('rise')`; `udxMotion="rise"`; Svelte. | new `motion-reveal`, live |
| `/motion/scrub` (new) | `thread` + three `parallax` tiles; a status chip from `supportsViewTimeline()`: "Scroll-linked in this browser" or "This browser has no ViewTimeline: shown still". | scrub definition (`range`, `axis`); `--udx-motion-scale`; React/Angular/Svelte with `parallax`. | new `motion-scrub`, live |
| `/motion/scroll` | `scroll`: a scroll container with five sections and a row of buttons that `scrollTo` them inside the container (`container`, `focus: true`); a note "Turn the wheel during the scroll: it stops." | `scrollTo`, `scrollDestination`, handle `finished`/`cancel`. | code |
| `/motion/values` | `pointer`: a card that tilts with the pointer (two `pointer` values), a range input "Level" driving a `state` value that fills a gauge over a spring, and a reading bar on a `scroll` value. | `defineValue` sources; `data-motion-value`; `value()`/`subscribe`; `useMotionValue`; `[udxMotionValue]`; `motionValue`. | new `motion-pointer`, live |
| `/motion/counters` (new) | `counters`: four counters (integer visitors, percent returning, currency EUR revenue, decimal rating 4.8) counting on reveal; **Add 1,000**; a language group **en · fr · de** that sets `lang` on the stage (formats change). | `format`, `currency`, `<data value>`; screen reader text; React/Angular/Svelte. | existing `motion-values`, live |
| `/motion/sequences` | `launch` with the ruler and timecode. | `defineSequence` + `data-motion-step`; `sequence()`; `useMotionSequence`; `[udxMotionSequence]`; `motionSequence`. | existing `motion-sequence`, live |
| `/motion/text` | `text`: one sentence ("Every word arrives in turn, and is read once."); groups **chars · words · lines** × **first · center · last**, and **appear · reveal**; **Replay**; readout = the definition. | `split` definitions; React `useMotion('headline')` etc.; semantics kept, read once. | new `motion-text`, live |
| `/motion/svg` | `svg`: the four M3 shapes morphing on a group **Cookie · Flower · Clover · Sunny**; a check mark drawn with `draw` (**Draw again**); a dot travelling `along` an arc (**Move again**). | `draw` preset; `along` definition with `offset-path`; `morph()` (code in frameworks). | new `motion-svg`, live (draw/along), code (morph) |
| `/motion/loop` (new) | `loop`: a spinner (`rotate`), a live dot (`breathe`), a recording light (`blink`), an indeterminate bar (custom loop, `pause: 'essential'` + reason); one **Pause loops** button for the three `control` loops. | `pause: 'control' \| 'essential'`; `data-motion-paused`; `paused` option per framework. | existing `motion-loop`, live |
| `/motion/tokens` | `springs` with the six lanes and token values; a curve list (durations, easings) with a bar animated by each curve on **Play curves**. | timing in definitions; CSS variables `--udx-motion-spring-*`; `defineTokens`, `resolveSpring`. | code |
| `/motion/scopes` | `scopes`: two identical cards with `rise`: one plain, one with `[--udx-motion:fade-on-view]`, and a third with `[--udx-motion:none]`; **Replay**; an **Inspect this page** button printing `inspect()` (from `@udixio/motion/scope`) into the readout. | Tailwind per breakpoint (`md:[--udx-motion:fade-on-view]`); `revert`; `inspect`. | code |
| `/motion/animate` | `animate`: a card whose background colour, corner radius and `clip-path` animate with `animateStyle` on a token; a dot following a pointer drag with `createSpring`. | `animateStyle`, `createSpring`, `cssTiming`, `composeHandles`, stagger helpers. | code |
| `/motion/accessibility` | `policy`: a mini scene (a card entry, a reflow, a loop) and the page's **Reduce motion** switch next to it; the table "what each verb shows" kept. **The existing no-JS swatch demo is kept with its labels** ("Reduce motion in this demonstration", "Change the decorative swatch", `.swatch`): a test depends on it. | `data-motion-policy`; `motionPolicy` from `@udixio/motion/policy`; `--udx-motion: none`; `restoreFocus`. | code |
| `/motion/limits`, `/motion/roadmap` | none (reference). | — | — |

Scene modules are shared: every hero scene above is also the demo of its root-page tile, mounted with
`data-size="tile"` (compact sizes, fewer items) — except getting-started and presets, which have no tile (the root
page's header covers them). A scene reads its variant from `data-*` on its stage (`data-size`, `data-mode`…).

Every hero scene has a reduced-motion version: state changes apply at once, loops stay still, scrubs show their
stylesheet state, reveals show content; controls keep working. The page's "Reduced motion" section says which.

---

## 6. Implementation breakdown

Rules for every task: do not modify files outside the task's list; never `git stash`, `checkout`, `reset` or
`restore` (the repository is shared); commit only with paths (`git commit -m … -- <paths>`) when the controller asks;
check the load (`cut -d' ' -f1 /proc/loadavg`, wait if > 6) before a build or a browser suite; run tests in
batches at the end of a task, one suite at a time, never in parallel. Doc browser tests run against the **built**
site (`npx astro build` in `apps/doc`, then `npx astro preview --port 4322`; stop the server afterwards).
`apps/doc` is not typechecked: open every changed page in a browser and check the console.

1. **Navigation and IA.**
   Files: `src/lib/motion-nav.ts` (new), `src/components/Navigation.tsx`, `src/components/Sidebar.tsx`
   (`NavSidebar` label, trailing-slash `findActivePage`), `astro.config.ts` (`redirects`), `public/llms.txt`.
   Acceptance: rail label "Animation"; hovering it previews the panel; on `/motion/` and every motion page at
   1280 px the panel is pinned with "Animation documentation"; the current page's button has
   `aria-current="page"`; Components/Theme panels unchanged. Tests: update `tests/motion.browser.test.mjs`
   (nav name `Motion documentation` → `Animation documentation`; link `Demo` removed (the page is gone); rail link name
   `Motion` → `Animation`; the no-JS focus test: from "Overview", Tab reaches "Getting started", and Enter on
   "Roadmap" still navigates) and the `motionPages` list in `tests/pages.browser.test.mjs` (§2.3, plus the redirect
   lands on `/motion/reveal/`).
2. **Template components and shared infrastructure.**
   Files: `src/components/MotionPage.astro`, `src/components/motion/{MotionStage,MotionUsage,MotionOptions,MotionTokens,MotionRelated}.astro`,
   `src/components/motion/scenes/loader.ts`, `src/lib/motionDocs.ts`, `src/lib/m3-shapes.ts`,
   `src/components/motionDemo.ts`, `src/components/Code.astro`, `src/components/CodePreview.tsx`,
   `src/stores/exampleFrameworkStore.ts` (`html` added site-wide), the Reduce motion switch island
   (`src/components/motion/MotionPolicySwitch.tsx`).
   Acceptance: a component page (e.g. `/components/switch/overview/`) shows the same tabs as before; a motion page
   with an `html` source shows HTML first when preferred and hides Preview/Code for it; the switch persists across
   a client navigation and is disabled under system reduce. Tests: keep all existing; add one test that the
   framework preference `html` falls back on a component page.
3. **Root page shell and the two reference tiles** (sets the quality bar for the groups).
   Files: `src/pages/motion/index.astro`, `src/components/motion/NeedTile.astro`,
   `src/components/motion/root/{Header,SectionBar,Section}.astro`, `src/components/motion/root/tabs.ts`
   (code tabs + copy, vanilla), `src/examples/motion-snippets/` (folder + `lists.ts`, `presence.ts`),
   `src/components/motion/scenes/{inbox,presence}.ts`, and the example sources those two tiles excerpt
   (`examples/{html,react,angular,svelte}/motion-list.*`, `examples/html/motion-presence.html`).
   The page lists all five sections and all 20 tiles from `MOTION_NEEDS`; tiles whose scene is not built yet render
   their body and a stage placeholder (`Coming in this release`) so the groups only add scenes and snippets.
   Acceptance: §3.1–3.5 at 1280 px (with the pinned panel), 1024, 760 and 375 px, dark and light; the section bar's
   pill travels; tabs switch every tile at once and persist across reload; copy works and announces; no running
   animation one second after load; no horizontal scroll at 375 px.
4. **Group A** — scenes, need pages, root tiles and snippets for: presence (page), lists (page), emphasis, layout
   (`resize`), shared-elements (`gallery`). Files: `scenes/{emphasis,resize,gallery}.ts`, the pages, the example
   files of §5, `motion-snippets/{emphasis,layout,shared-elements}.ts`.
5. **Group B** — gestures, page-transitions, reveal, scrub (`thread`), scroll, loop.
6. **Group C** — values (`pointer`), counters, sequences (`launch`), text, svg.
7. **Group D** — getting-started, presets, tokens (`springs`), scopes, animate, accessibility (`policy`), and the
   template header on limits and roadmap. `/motion/demo`: removed, redirect to `/motion` (see task 8 for its tests); the following check is obsolete: verify every `data-demo-*`
   selector and id still exists (`git show HEAD:apps/doc/src/pages/motion/demo.astro` vs the new file, body
   identical).
   For each of tasks 4–7, acceptance per need: the scene works with pointer and keyboard in its tile and on its page;
   its reduced version checked with `html[data-motion-policy=reduce]` and matches the tile's "Reduced motion"
   phrase; the four tabs and the snippets are present; live previews hydrate without console errors; the options
   table matches the manifest; no horizontal scroll at 375 px; the tile's stage looks composed (scene centred,
   no empty half).
8. **Tests.**
   - `apps/doc/tests/motion-snippets.test.mjs` (node, no browser): for each `motion-snippets/<slug>.ts` and each
     framework, every line that is not an elision (`// …`, `<!-- … -->`) appears, trimmed, in the matching example
     file; no line exceeds 44 characters (56 for the five feature tiles).
   - `apps/doc/tests/animation.browser.test.mjs` (same runner and env as the others), on the built site:
     - root page: `getByRole('heading', { level: 1, name: 'Animation' })`; five `<h2>`; 20 `article[id^="need-"]`,
       each with a link to the href of its need in `MOTION_NEEDS`;
     - calm: one second after load at the top of `/motion/`, no running time-based animation
       (`document.getAnimations()` filtered on `playState === 'running' && a.timeline === document.timeline` is
       empty; scroll-driven animations are excluded) and no long task over 50 ms during load (Chromium);
     - code tabs: choosing React in one tile shows the React snippet in every tile; after a reload React is still
       selected; keyboard: arrow keys move between tabs;
     - section bar: after scrolling `#tell` into the middle of the view, its link has `aria-current="true"` and only
       its pill is not hidden;
     - lists tile: **Add three** with origin Center adds three items; within 100 ms an item has an inline transform
       (Chromium); at rest none has; Delete on a focused item removes it;
     - reduced context (`reducedMotion: 'reduce'`): **Add three** leaves no inline transform after one frame; the
       loop tile has no running animation;
     - 375 px: `document.documentElement.scrollWidth <= innerWidth` on `/motion/`, `/motion/lists/`,
       `/motion/sequences/`;
     - sequence: on `/motion/sequences/`, after the play ends, set the ruler to 10 % → the title step's opacity is
       below 1; set it to 100 % → 1;
     - gallery: keyboard open/close on `/motion/shared-elements/`, focus ends on the thumbnail;
     - side panel: on `/motion/lists/` the link "Make a list appear" in "Animation documentation" has
       `aria-current="page"`.
   Move every test of `/motion/demo` to the need page that now hosts its demo (same behaviour checked, new selectors), then delete `apps/doc/src/pages/motion/demo.astro` and add the redirect `/motion/demo` → `/motion`; no test may visit `/motion/demo` any more. Run Chromium first, then Firefox and WebKit, one at a time.
9. **Final visual review** (a design reviewer, not the implementer): screenshots of `/motion/` at 1280 × 900 with
   the pinned panel, 1024, 760 and 375 px, dark and light, reduced; each tile at rest and mid-interaction (burst
   every 50 ms for 1 s on its main control); five need pages. Check: every tile is a composed piece of interface
   (no empty stage, consistent control row, hint at the bottom); alignment of the two-column grid (equal stage
   heights per row); the section bar's pill never jumps; snippets readable without horizontal scroll at 900 px;
   text contrast on every role colour (the gallery detail's body text uses the `on-` colour at full opacity);
   nothing moves at idle except the loop tile while visible. Report with the screenshot paths; fix, then re-shoot.

Suggested model per task (per the maintainer's preference): tasks 3 and 9 are design work; the others are
implementation.

---

Note (2026-11-18, found in task 7): a `--udx-motion: <name>` override only takes a definition of the same family as
the bound one (a reveal takes a reveal), so the breakpoint example uses a reveal-kind definition, `fade-on-view`.

## 7. Open points for the maintainer

Settled on 2026-11-17: the side panel stays pinned on `/motion`; `html` joins the example frameworks site-wide;
the spectacle moves to the future home page (§8).

Settled on 2026-11-17 (controller, on the maintainer's delegation):

- The root page shows **all 20 needs** as live tiles. The point of the section is that people SEE what the library
  can do; the sticky section bar makes the length easy to navigate.
- The tile's code follows the visitor's preferred framework, chosen once for the whole site; until they choose, the
  site default (React) applies, as on every other page.

---

## 8. Parked for the future home page

Not to implement in this pass. This section keeps the first concept, prototyped and measured on 2026-11-17, so that
the home-page redesign can pick it up.

### 8.1 The product it should serve (the maintainer's view)

- Udixio is a **design ecosystem**, not only a component library. Its **theme system is its most advanced part**
  (dynamic colour from one source colour, tonal palettes, variants, sub-themes, Tailwind tokens), and it makes
  design coherence simple.
- Its UI library is **simpler than shadcn** and is customised **through props only**: no copying components into
  the project without a wrapper.
- The product may be renamed and leave beta; its positioning is not settled. The home page will be redesigned then.
- The home page should use motion design to put **the theme system and the ecosystem** forward. The concept below
  does that by construction: its colours are the theme's palettes, computed by CSS from the theme tokens, so they
  recolour live when the source colour changes; and its motion is `@udixio/motion`, one more part of the ecosystem.

Directions for the home page (suggestions, not decisions):

- Let the visitor change the source colour next to the field (the theme builder's colour picker): the 96 swatches
  recolour at once, the arrangements keep working; this shows the theme system and the motion runtime together.
- Arrangements can tell the theme's story: by palette (primary, secondary, tertiary, neutral, neutral variant), by
  tone, as the roles of a real screen (surface, container, on-colours), or re-tiled into an actual component
  (a card, a navigation rail) whose colours come from the same swatches.
- Keep the title letters as layout elements: on a home page a re-sorting product name is a signature moment.
- Keep the root animation page (§3) as the place where each motion feature is explained; the home page links to it.

### 8.2 Concept: "The field"

The page opens on a large word and a field of the theme's colours: six tonal rows (primary, secondary, tertiary,
neutral, neutral variant, primary container) × 16 tones. One row of four toggle buttons re-arranges it. Each press
flies 96 elements to new places on one attribute, `data-motion="reflow"`; pressing again mid-flight turns them with
the velocity they had. The letters of the title are layout elements too: they re-sort with the field (alphabetical,
stacked, shuffled). A large M3 Expressive shape morphs to the shape of each arrangement. Under the pointer the
swatches swell and round into circles, through one spring-smoothed CSS variable. A short intro (under a second):
letters cascade from the centre, the lede comes in word by word, the field ripples out from its centre.

The detailed specification below was written for `/motion`; ids and names say "landing", read "home". On the home
page the same container-query rules apply (the home has no pinned panel, so it will be wider).

### 8.3 Hero specification

Markup order: eyebrow, `<h1>`, lede, shape, stage (controls, field, caption), need strip.

**Eyebrow**: `@udixio/motion`, `text-label-large`, letter-spacing .1em, uppercase, `text-primary`.

**Title**: `<h1 id="landing-title"><span class="sr-only">Animation</span><span class="letters" aria-hidden="true">…9 spans…</span></h1>`.
Montserrat (`text-display-large` family), `font-size: clamp(56px, 12cqi, 168px)`, `line-height: .9`,
`letter-spacing: -0.04em`, `text-on-surface`. `.letters` is `display:flex; flex-wrap:wrap; min-height:1em`.
Each letter is `<span data-letter="i">A</span>` (one glyph per span) bound to `reflow`.

**Lede**: "Name a motion. The runtime plays it: entries, layouts, gestures, scroll, text and SVG, in HTML or in
React, Angular and Svelte." `text-headline-small` (18 px under 560 px), `text-on-surface-variant`, max 34ch.

**Shape**: an inline SVG (`viewBox="0 0 100 100"`, `aria-hidden`), `fill: var(--color-tertiary-container)`,
`width: clamp(96px, 18cqi, 220px)`, at the right of the title block (grid `1fr auto`, aligned to the title's
baseline). Under 560 px: 96 px, top-right on the eyebrow line, never behind the title; the hero has
`overflow-x: clip` (the prototype overflowed by 8 px at 375 px).
Shapes are generated at build time in the Astro frontmatter (no runtime cost), 96 points, closed polyline:
`r(θ) = 46 · (1 − d · (0.5 − 0.5·cos(n·θ + φ)))`, centre (50, 50):

| Arrangement | Shape | n | d | φ |
|---|---|---|---|---|
| Palettes | cookie | 9 | 0.12 | 0 |
| Weave | flower | 6 | 0.32 | 0.3 |
| Bands | clover | 4 | 0.22 | 0 |
| Shuffle | sunny | 12 | 0.06 | 0 |

**Stage** (`role="group"`, `aria-label="Colour field"`): `rounded-[28px] bg-surface-container-low p-5`.
Top row: the arrangement buttons (left) and a code chip (right):
`<span data-motion="reflow"> × 96` (the count is the live number of swatches).

- Arrangement buttons: a connected button group (M3 Expressive "connected buttons"): four `<button type="button"
  aria-pressed>` inside `<div role="group" aria-label="Arrange the field">`, labels **Palettes · Weave · Bands ·
  Shuffle**, 40 px tall, outline `--color-outline`, pressed = `bg-secondary-container text-on-secondary-container`.
  Classes live in `apps/doc/src/components/motionDemo.ts` as `segmentedClass` / `segmentedButtonClass` so every
  scene uses the same control.
- **Field**: `<div class="field" aria-hidden="true" data-motion-scope data-intro>`; CSS grid
  `grid-template-columns: repeat(var(--cols), 1fr); grid-template-rows: repeat(var(--rows), 1fr)`, gap 6 px
  (4 px under 560 px), **fixed `aspect-ratio: var(--cols) / 6.4`** so no arrangement changes its height (the
  prototype's first "Bands" doubled the field height and pushed the page).
  Swatch: `<span class="sw" data-motion="reflow" data-row data-tone><i></i></span>`; the `<i>` fills it
  (`position:absolute; inset:0; border-radius:12px`, 8 px under 560 px) and carries colour and lens.
- Colour (no JS, follows the theme, light and dark):
  `background: oklch(from var(--src) var(--l) calc(min(c, .16) * var(--c) + .015) h)` with per swatch
  `--src: var(--color-<role>)` (row role, in order: `primary`, `secondary`, `tertiary`, `outline`,
  `on-surface-variant`, `primary-container`), `--l` = `0.22 + 0.72 · tone/(cols−1)`, `--c` =
  `1.3 − |tone/(cols−1) − 0.5|`. **`h` is a number in relative colour syntax: never add a `deg` value to it**
  (the prototype's swatches turned transparent). Fallback under
  `@supports not (color: oklch(from red l c h))`: `color-mix(in oklab, var(--src), black|white X%)` from the tone.
- Caption under the field, `text-body-medium text-on-surface-variant`, two items that wrap:
  "Re-arrange while they fly: they turn without stopping." and, only for `(hover:hover) and (pointer:fine)`,
  "Point at the field: a spring follows you."

**Need strip**: `<nav aria-label="Jump to a need">` with six outlined chips (real anchors, work without JS):
"Make a list appear" `#act-presence`, "Move to a new place" `#act-layout`, "Follow the scroll" `#act-scroll`,
"Feel physical" `#act-physics`, "Choreograph a story" `#act-story`, "Everything, by need" `#by-need`.
(These anchors pointed to the five acts of the first concept; on a home page they would point to the sections
that follow the hero, or to the animation section.)

#### 8.3.1 Behaviour

Intro (plays once per page load, under reduced motion it does not play):

1. An inline script at the top of the landing (`<script is:inline>`, re-run on client navigation) sets
   `document.documentElement.dataset.landingIntro = 'pending'` unless reduced motion applies (system query or the
   stored policy). CSS: `html[data-landing-intro=pending] .letters > span, html[data-landing-intro=pending] .lede
   { visibility: hidden; animation: landing-gate 0s 2.5s forwards }` with `@keyframes landing-gate { to {
   visibility: visible } }`: content never stays hidden more than 2.5 s if the script fails. `.field[data-intro] .sw
   { opacity: 0 }` hides the swatches until their ring is bound.
2. The scene script sets `landingIntro = 'done'` and binds each letter with `motion(letter, 'landing-letter',
   { settled: false })` in the same task, so they cascade **from the centre** (stagger `normal`, origin `center`).
3. 260 ms later: `motion(lede, 'landing-words', { settled: false })` (split by words).
4. 180 ms after step 2, the field ripples out from its centre **ring by ring**: ring of a swatch =
   `round(hypot((col − cx)·0.8, (row − cy)·1.2))`; each ring is bound with `motion(sw, 'landing-swatch',
   { settled: false })` in its own task, 34 ms apart. After the last ring is bound (before any entry ends) remove
   `data-intro` from the field. Total about 0.9 s at 16 × 6.
   Why rings: the library's stagger orders by reading order (`visualRanks`), so `origin: 'center'` on a grid is a
   zipper, not a ripple; separate tasks make separate cascades.
   Do **not** put the presence name in `data-motion` of the swatches or letters: an element inserted after
   `connectMotion()` plays its entry at insertion (the prototype played every swatch twice).

Definitions (in `apps/doc/src/components/motion/scenes/landing-hero.ts`):

```ts
defineMotion('landing-letter', { verb: 'appear', stagger: 'normal', origin: 'center',
  keyframes: [{ opacity: 0, y: 72, rotate: -8 }, { opacity: 1, y: 0, rotate: 0 }], timing: 'spring.slow.spatial' });
defineMotion('landing-letter-compact', { verb: 'appear', stagger: 'normal', origin: 'center',
  keyframes: [{ opacity: 0, y: 36, rotate: -6 }, { opacity: 1, y: 0, rotate: 0 }], timing: 'spring.slow.spatial' });
defineMotion('landing-words', { verb: 'appear', split: 'words',
  keyframes: [{ opacity: 0, y: 12 }, { opacity: 1, y: 0 }], timing: 'spring.default.effects' });
defineMotion('landing-swatch', { verb: 'appear',
  keyframes: [{ opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1 }], timing: 'spring.default.spatial' });
```

The letters carry the Tailwind class `max-sm:[--udx-motion:landing-letter-compact]`: motion per breakpoint, used
for real (smaller travel on phones).

Arrangements (one click handler; a press on the pressed button does nothing):

| Button | Swatch DOM order | Field class | Title letters |
|---|---|---|---|
| Palettes (default) | row, then tone | — | `Animation` |
| Weave | tone, then row (each column = one tone of the six roles) | — | sorted alphabetically: `Aaiimnnot` |
| Bands | row, then tone | `bands` (`--cols` halved, `--rows: 12`: swatches become wide pills) | `Anima` / `tion` (class `stack` on `.letters`: a `max-width` that wraps the word after "Anima"; `3.4em` in the prototype's font) |
| Shuffle | random, never equal to the current order | — | random permutation, never equal to the current one |

The handler appends the swatches in the new order (`field.append(...order)`), toggles the classes, appends the
letters in their new order, and morphs the shape: `morph(shapePath, SHAPES[kind], { timing: 'spring.slow.spatial' })`
(cancel the previous morph first). The layout engine flies everything; nothing is measured by hand.
After the frame, the script writes each swatch's centre `--cx`/`--cy` (fractions of the field, from its grid
index) and the field's `--ar` (height/width) for the lens; these inline writes are not observed by the engine.

Lens (pointer-fine only, decorative):

```ts
defineValue('landing-lens-x', { source: 'pointer', axis: 'x', range: [0, 1] });
defineValue('landing-lens-y', { source: 'pointer', axis: 'y', range: [0, 1] });
defineValue('landing-lens-on', { source: 'state', range: [0, 1], spring: 'spring.default.effects' });
```

Bound with `value(field, …)`; `pointerenter` → `lensOn.set(1)`, `pointerleave` → `set(0)` (the pointer value
returns to the middle on leave, so the lens must fade, not sit in the centre). CSS on `.sw > i`:

```css
--dx: calc(var(--udx-motion-value-landing-lens-x, .5) - var(--cx, .5));
--dy: calc((var(--udx-motion-value-landing-lens-y, .5) - var(--cy, .5)) * var(--ar, .4));
--near: max(0, 1 - hypot(var(--dx), var(--dy)) / .16);
--k: calc(var(--near) * var(--udx-motion-value-landing-lens-on, 0) * var(--udx-motion-scale, 1));
scale: calc(1 + .55 * var(--k));
border-radius: calc(12px + 40% * var(--k));
```

The lens styles the inner `<i>`, never the swatch: the swatch's `translate`/`scale` belong to the layout engine.

#### 8.3.2 Reduced motion

No intro (letters, lede and field are simply there). An arrangement applies at once, the shape is set at once
(`morph` sets it under reduced motion), the lens is off (`--udx-motion-scale` is 0). The field still re-sorts:
the scene stays meaningful as a colour chart.

### 8.4 Prototype findings and screenshots (the field)

Field size by container width: 16 × 6 at ≥ 840 px, 12 × 6 at 560–839 px, 8 × 6 below.

Measured on this machine, 96 swatches, re-arrangement: first frame 31–47 ms in Chromium, 30–50 ms in Firefox, 62 ms
then 50/41 ms in WebKit; the other frames at 16.7 ms. Budget proposed: in Chromium at most 2 frames over 34 ms per
arrangement, in WebKit at most 4; if WebKit is over, drop to 12 × 6 rather than slowing the springs. No inline
`translate`/`scale` was left on any swatch at rest.

1. Grid ripple: stagger ranks are 1-D reading order (`visualRanks`), so `origin: 'center'` on a grid is a zipper; a
   2-D ripple needs one binding task per ring (§8.3.1). Library follow-up worth considering: a radial `origin`.
2. Relative colour syntax: `h` is a number; `calc(h + 30deg)` is invalid and the colour becomes transparent.
3. A "Bands" re-flow that changes the field's height pushes the page: fix the field's aspect ratio.
4. The lens styles the swatch's inner element; the swatch's own `translate`/`scale` belong to the layout engine.
5. In light mode the error role was too loud as a row; it was replaced by neutral variant.
6. The hero shape overflowed by 8 px at 375 px: clip the hero horizontally.
7. The intro gate must never hide content for long: a CSS animation reveals it after 2.5 s whatever happens.

Screenshots (`…` = `/tmp/claude-1000/-home-joel-Documents-projets-udixio-ui-components/94acf95f-06e9-4435-8104-8114a215e776/scratchpad`;
1280 × 900 without the doc chrome, and 375 × 812):

- Hero at rest, dark / light / 375 px: `…/anim-design/shots/hero-desktop.png`, `hero-light.png`, `hero-375.png`
- Intro frames: `…/anim-design/shots/sheet-intro.png`
- Weave in flight (letters sorting, flower morph): `…/anim-design/shots/sheet-hue.png`
- Bands and Shuffle mid-flight, lens: `…/anim-design/shots/sheet-sort-midflight.png`, `…/anim-design/shots/desk/04-lens.png`
- Reduced and light: `…/anim-design/shots/sheet-light-reduce.png`

---

## 9. Review of 2026-11-20 and the next round

A review relayed from another session at the maintainer's request (kept in the repo's working notes,
`.superpowers/sdd/2026-11-17-animation-docs/review-components-1f.md`) found the root page cluttered ("trop fouillis, loin
de me conquérir"): showcase, doc and sandbox at once (10,231 px, 80 code blocks, 153 buttons), truncated snippets with a
copy button, four vocabularies per need, React well behind Angular and Svelte. Maintainer decisions:
1. The root becomes a short showcase (2–3 screens): value sentence, one signature demo, copyable install, three figures,
   one complete runnable example with framework tabs, a gallery of 20 cards without code linking to the need pages, facts
   (browsers, weight). This supersedes §3's 20 code tiles. Snippets shown with a copy button must be complete and runnable
   (the "copied lines with `// …`" rule is dropped).
2. React gets `<Presence>` and `<Motion as name>` in @udixio/ui-react.
3. Sub-pages are driven by the chosen framework (prose included); option tables per verb; a readable API reference,
   recipes per component and a troubleshooting page.
4. API irritants (gestures' `alternative` inferred, prefixed attributes, values with units and `axis: 'both'`, a
   Tailwind utility for motion per breakpoint — relaxing R11 —, typed names, install).
