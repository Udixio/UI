# The "Animation" section of the documentation site: design

Date: 2026-11-17 · Branch: `feat/anime` · Status: design, ready for implementation
Brief: `.superpowers/sdd/2026-11-17-animation-docs/design-brief.md`
Prototype (throwaway, not to be copied verbatim):
`/tmp/claude-1000/-home-joel-Documents-projets-udixio-ui-components/94acf95f-06e9-4435-8104-8114a215e776/scratchpad/anim-design/`
(`index.html`, `app.js`; screenshots in `shots/`, listed in §3.11).

Words used here: **landing** = `/motion` (the root page). **Need page** = one page of the section that answers one
need ("Make a list appear"). **Scene** = one live, interactive example (a landing act or the hero of a need page).
**Stage** = the framed surface that holds a scene.

---

## 1. Intent and the bar

### 1.1 Intent

`@udixio/motion` can now do motion design (presence, lists, layout FLIP with velocity kept on interruption,
undistorted content and corrected corners, shared elements, reveal, native scrub, loops, spring values, counters,
scrubbable sequences, gestures with keyboard alternatives, page transitions, text split, SVG draw/along/morph,
scrollTo, tokens, reduced-motion policy). The current section does not show it: 21 pages behind a line of
underlined links, small demos, and the best material buried in `/motion/demo`.

The redesign has two jobs:

1. **Show what the library can really do**, on a landing page that a motion designer would screenshot. Its
   centre is not a grid of demos but one living object: a field of the theme's own colours, 96 elements that fly
   between arrangements on one attribute, with the page title obeying the same control.
2. **Get the visitor to the right documentation by need.** The rail tab "Animation" opens a side panel organised
   by what people want to do ("Make a list appear", "Link to the scroll"…). Every need page opens on a live scene,
   then shows how to use it in HTML/JS, React, Angular and Svelte.

### 1.2 The bar

- The maintainer (who wrote the engine) must find something he did not expect: the title letters re-sorting with
  the field, the lens that rounds swatches under the pointer through one CSS variable, a declarative sequence
  scrubbed like a video timeline, a scroll-drawn line, a theme-coloured field that recolours with the theme builder.
- Every effect on the page is done with `@udixio/motion` and CSS, and the code next to it is the real code.
- Calm by default: one intro (under a second), then nothing moves unless the visitor acts or scrolls.

### 1.3 Goals

- G1. Rail tab label "Animation"; a pinned side panel with need-based sections (§2).
- G2. A landing page in six parts: hero, five acts, "by need" index, start band (§3).
- G3. One page template for all need pages: hero scene, usage in four frameworks, options generated from the
  manifest, tokens, reduced motion, limits, related needs (§4).
- G4. A designed reduced-motion version of every scene; a page-level "Reduce motion" switch.
- G5. Shared scene modules: a landing act and its need page mount the same module (one implementation, two places).
- G6. Keep `/motion/demo` and its test selectors; keep all URLs under `/motion/...`.

### 1.4 Non-goals

- No change to `@udixio/motion` itself. Where the prototype hit a missing capability, this spec works around it or
  lists it as a follow-up (§3.10).
- No new framework adapter APIs. No markdown (`.md`) export of motion pages.
- No redesign of the component or theme sections, beyond the shared `Code.astro` extension (§4.3) and the
  `NavSidebar` fixes (§2.4).

### 1.5 Anti-goals (do not do)

- A grid of identical demo cards, one per feature, as the landing.
- Scroll-jacking: no pinned "scroll to advance" sequences, no wheel interception, no smooth-scroll library.
- Autoplay loops without a visible pause control; anything that flashes more than three times per second.
- Motion on content that was already on the page, except the landing intro.
- Videos, GIFs or Lottie files standing in for motion: everything is live.
- Hard-coded colours. Every colour is a theme token or derived from one with CSS.
- Any other animation library (no Motion, GSAP, CSS animation libraries).
- Marketing numbers that can go stale: figures shown on the page are computed from the manifest at build time.

### 1.6 References: what we take, what we avoid

| Reference | Take | Avoid |
|---|---|---|
| anime.js landing (animejs.com) | Each feature block links to 2–3 precise doc entries; the bundle shown per module (our sub-entries loaded on demand are the same story). | Static code snippets in place of live demos. |
| GSAP (gsap.com) | The same categories in nav, landing and footer; headline text split as the first impression. | Showreels and brand logos as proof; videos of motion. |
| Motion (motion.dev) | "Small APIs, expressive interfaces": each block = live demo + snippet + doc link; an interactive spring block. | Image galleries of motion, upsell sections, organisation by API name. |
| Josh Comeau, "A friendly introduction to spring physics" | Demo before theory; each demo isolates one variable (the six spring lanes); widgets operable with the keyboard. | His motion-heavy demos stay on under reduced motion; ours do not. |
| react-spring (react-spring.dev) | The argument "springs, not durations", shown rather than told. | A hero that is only a tagline and an install command. |

---

## 2. Information architecture

### 2.1 Rail and side panel

- `apps/doc/src/components/Navigation.tsx`: the rail item `href="/motion"` keeps its `href` and icons; its label
  becomes **"Animation"**. It gets the same behaviour as the other sections: `{...previewProps('motion')}` (hover
  dwell preview, focus preview) instead of `onMouseEnter={endPreview}`.
- `FlyoutId` gains `'motion'`; `flyouts.motion = { title: 'Animation', sections: MOTION_SECTIONS, basePath: '/motion' }`.
- `sectionFromPathname`: `/^\/motion(\/|$)/` returns `'motion'`, so the panel is pinned open on every motion page
  from the `lg` breakpoint, like Components and Theme (the landing included).
- `RAIL_INDEX` gains `motion: 1`; the special case `/^\/motion(?:\/|$)/.test(pathname) ? 1 : …` is removed
  (the pinned id now covers it).
- The panel's title is "Animation"; its `<nav>` is labelled "Animation documentation" (§2.4).

### 2.2 Side panel sections (exact labels and targets)

Source of truth: a new file `apps/doc/src/lib/motion-nav.ts` exporting `MOTION_NEEDS` (rich data, below) and
`MOTION_SECTIONS: NavSection[]` derived from it. The landing's "by need" index, the related-needs blocks and
`llms.txt` use the same data (llms.txt is static: update it by hand from this table).

Labels are ≤ 24 characters so they fit the 256 px panel.

| Section (category) | Label | Target | API hint (landing index and page chips) |
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
| Reference | Every demo | `/motion/demo` | — |
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
  landingAct?: 'presence' | 'layout' | 'scroll' | 'physics' | 'story'; // the act that shows it
};
```

### 2.3 Page map: kept, split, renamed, added

| Today | After | What happens |
|---|---|---|
| `index` | `/motion` | Rewritten as the landing (§3). |
| `getting-started`, `presets`, `presence`, `emphasis`, `gestures`, `page-transitions`, `text`, `svg`, `scroll`, `animate`, `scopes`, `accessibility`, `tokens`, `limits`, `roadmap` | same URL | Moved onto the template (§4); titles become the need labels. |
| `layout` | `/motion/layout` + `/motion/lists` + `/motion/shared-elements` | Split: layout keeps reflow, resize, scope, `play()`; lists take cascade, stagger, origin, exit; shared elements take keys, rules, limits. |
| `reveal-scrub-loop` | `/motion/reveal` + `/motion/scrub` + `/motion/loop` | Split by need. The old URL becomes a redirect to `/motion/reveal` (Astro `redirects` in `astro.config.ts`; static output writes a meta-refresh page). |
| `values` | `/motion/values` + `/motion/counters` | Split: values keep pointer, scroll, state, time; counters take formats, locale, accessible text. |
| `demo` | `/motion/demo` | Kept, all ids and `data-demo-*` selectors unchanged; side-panel label "Every demo"; its `<h1>` stays "Motion demo" (a test reads the title). |

Route list after the change (26 pages + 1 redirect), all with a trailing slash in the built site:

```
/motion  /motion/getting-started  /motion/presets
/motion/presence  /motion/lists  /motion/emphasis
/motion/layout  /motion/shared-elements  /motion/gestures  /motion/page-transitions
/motion/reveal  /motion/scrub  /motion/scroll
/motion/values  /motion/counters  /motion/sequences  /motion/text  /motion/svg  /motion/loop
/motion/tokens  /motion/scopes  /motion/animate  /motion/accessibility
/motion/limits  /motion/roadmap  /motion/demo
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
Below `lg`, where the panel is not pinned, each need page ends with "Related needs" and a "Browse all needs" link
to `/motion#by-need`, and the rail's burger menu shows the panel (existing behaviour).

---

## 3. The landing page `/motion`

### 3.1 Concept: "The field"

The page opens on the word **Animation** and a field of the theme's colours: six tonal rows (primary, secondary,
tertiary, neutral, neutral variant, primary container) × 16 tones. One row of four toggle buttons re-arranges it.
Each press flies 96 elements to new places on one attribute, `data-motion="reflow"`; pressing again mid-flight
turns them with the velocity they had. The nine letters of the title are layout elements too: they re-sort with
the field (alphabetical, stacked, shuffled). A large M3 Expressive shape morphs to the shape of each arrangement.
Under the pointer the swatches swell and round into circles, through one spring-smoothed CSS variable.

Below, five acts, each a need with a full scene and the few lines of code that make it, then the index by need,
then a start band. Text is short; the scenes carry the message.

Container: the landing renders inside `#doc-content`, next to the rail and the pinned panel. At a 1280 px window
the content is about 900 px wide. **All landing breakpoints are container queries** on the landing root
(`@container/landing`), never viewport media queries, so the page adapts to the pinned panel:

| Container width | Hero field | Acts layout |
|---|---|---|
| ≥ 1040 px | 16 × 6 | copy column (5fr, sticky) + stage (7fr) |
| 560–1039 px | 12 × 6 | copy above stage, full width |
| < 560 px | 8 × 6 | copy above stage; mobile rules (§3.8) |

Page width cap 1240 px, side padding 24 px (16 px under 560 px). No TOC sidebar on the landing (`docSidebar` false).

### 3.2 Global controls

A slim bar at the top of the landing content, `position: sticky; top: 0`, right-aligned:
**Reduce motion** — the Udixio `Switch` (React island, `client:idle`), label "Reduce motion".

- On: `document.documentElement.setAttribute('data-motion-policy', 'reduce')`; off: remove it.
- Persisted in `localStorage['udixio:docs:motion-policy']` (`'reduce'` or absent), re-applied on
  `astro:after-swap` (the client router replaces `<html>` attributes), so the choice holds across the section.
  The same switch appears in the header of every motion page (§4.1). It applies to the whole documentation site;
  its helper text says so: "Applies to this documentation site."
- When the system asks for reduced motion (`matchMedia('(prefers-reduced-motion: reduce)')`), the switch is shown
  checked and disabled, with the helper text "Your system asks for reduced motion."

### 3.3 Hero

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

#### 3.3.1 Hero behaviour

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

#### 3.3.2 Hero, reduced motion

No intro (letters, lede and field are simply there). An arrangement applies at once, the shape is set at once
(`morph` sets it under reduced motion), the lens is off (`--udx-motion-scale` is 0). The field still re-sorts:
the scene stays meaningful as a colour chart.

### 3.4 Act 01 · Appear and leave (`#act-presence`, need: Make a list appear)

Copy: number "01 · Appear and leave"; `<h2>` "Lists that arrive, and leave, in order."; body "Items added together
cascade in visual order. Swipe one away, or focus it and press Delete: it flies out and its neighbours close the
gap."; live code block (below); link "Lists and presence →" to `/motion/lists`.

Stage (scene module `scenes/inbox.ts`, shared with `/motion/lists`): buttons **Add one** (filled), **Add five**
(tonal), a connected group "Cascade origin" **First · Center · Last**; below, `<ul class="inbox" data-motion-scope>`
(`position: relative`, needed by `out-of-flow`) with three notifications at load (present, no entry). Each item:
avatar circle (`bg-primary-container`), name (`text-title-small`), message (`text-body-small`), time; 64 px tall,
`rounded-2xl bg-surface-container-high`, `tabindex="0"`, `data-motion="inbox-<origin> reflow"`,
`data-motion-gesture="dismiss"`. Visible hint under the list: "Swipe an item away, or focus it and press Delete."

```ts
for (const origin of ['first', 'center', 'last'] as const)
  defineMotion(`inbox-${origin}`, { verb: 'appear', stagger: 'normal', origin, exit: 'out-of-flow',
    keyframes: [{ opacity: 0, y: -16, scale: 0.96 }, { opacity: 1, y: 0, scale: 1 }] });
defineGesture('dismiss', { kind: 'swipe', alternative: 'action' });
```

- Add one / Add five prepend new items (one task). The list keeps at most 6 visible items: after adding, items past
  the sixth get `hidden` (exit plays, out of flow) and are removed when their exit ends. The stage has a fixed
  `min-height` for six items: adding never pushes the page.
- Choosing an origin rewrites `data-motion` on every item and updates the code block.
- `motion-swipe` (not prevented): remove the item once it is `aria-hidden="true"` (as `/motion/demo` does).
- The code block shows the real markup and definition and highlights the chosen origin:

```html
<li data-motion="cascade reflow" data-motion-gesture="dismiss">…</li>
```
```ts
defineMotion('cascade', { verb: 'appear', stagger: 'normal', origin: 'center', exit: 'out-of-flow', keyframes: […] })
```

Reduced motion: items appear and leave with a short fade, no cascade delay; the exit is in place; a swipe release
is written at once.

### 3.5 Act 02 · Move (`#act-layout`, needs: Move to a new place, Morph one into another)

Copy: "02 · Move"; `<h2>` "Things travel to their new place."; body "Change a class: the layout engine flies every
element there, and their content keeps its shape. A thumbnail opens into its detail: one key, two elements, one
object for the eye."; code `data-motion="reflow" data-motion-shared="shape-3"`; links "Layout →" and "Shared
elements →".

Stage (scene `scenes/gallery.ts`, shared with `/motion/layout` and `/motion/shared-elements`): a connected group
**Grid · List**, a grid of six thumbnails (3 columns; 2 under 560 px), each a `<button type="button"
aria-expanded="false" aria-controls="gallery-detail">` with a role colour background (`primary-container`,
`tertiary-container`, `secondary-container`, `primary`, `tertiary`, `surface-container-highest` with their `on-`
colours), an M3 shape (§3.3 generator) and a name (Cookie, Flower, Clover, Sunny, Puffy, Gem). Each thumbnail:
`data-motion="reflow" data-motion-shared="shape-<i>"`. The detail: `<div id="gallery-detail" data-motion="reflow"
data-motion-shared="" hidden>` absolutely positioned over the gallery area (inset 20 px, `rounded-[28px]`), with the
big shape, the name as `<h3>`, a sentence and a **Close** button.

- Open: in one task, copy the thumbnail's key and colours to the detail, set `thumbnail.hidden = true`,
  `detail.hidden = false`; set `aria-expanded="true"` on the thumbnail; move focus to Close on the next frame. The
  detail morphs out of the thumbnail; the grid reflows under it, hidden by the detail.
- Close (button or Escape inside the detail): `detail.hidden = true`, `thumbnail.hidden = false`, focus back to the
  thumbnail: it morphs back from the detail's box and its neighbours make room.
- Grid · List toggles a class: thumbnails become 56 px rows; shapes and names keep their size (content projection).
- The detail is a disclosure, not a modal dialog: no focus trap; Tab from Close goes on through the page.

Reduced motion: open/close and grid/list apply at once; focus behaviour unchanged.

### 3.6 Act 03 · Follow the scroll (`#act-scroll`, needs: Reveal, Link to the scroll, Scroll to a target)

Copy: "03 · Follow the scroll"; `<h2>` "The page is the timeline."; body "The line is drawn by your scroll, by the
browser, off the main thread. The cards rise as they enter. The bar reads your progress."; a 4 px progress bar
(`data-motion-value="landing-reading"`, `scale: var(--udx-motion-value-landing-reading, 0) 1`, origin left);
code `verb: 'scrub', keyframes: [{ draw: 0 }, { draw: 1 }]`; links to reveal, scrub, scroll.

Stage (scene `scenes/thread.ts`, shared with `/motion/scrub`): no panel background; a column of four cards
(reveal, scrub, value, scrollTo; one sentence each), alternating left/right, 140 px apart, each `data-motion="rise"`.
Behind them an SVG spanning the column: `viewBox="0 0 100 1000" preserveAspectRatio="none"`, two copies of the
path `M50 0 C 95 120, 5 250, 50 380 S 95 640, 50 760 S 5 920, 50 1000`: a dashed ghost (`--color-outline-variant`,
`stroke-dasharray: 2 8`) and the drawn line (`--color-primary`, width 3), both `vector-effect: non-scaling-stroke`.

```ts
defineMotion('landing-thread', { verb: 'scrub', range: 'contain', keyframes: [{ draw: 0 }, { draw: 1 }] });
defineValue('landing-reading', { source: 'scroll' });
```

The prototype confirmed that `draw` on a stretched SVG (`preserveAspectRatio="none"` + non-scaling stroke) is
drawn correctly by the scroll in Chromium. Under 560 px the cards take the full width and the path is drawn
behind them at 30 % opacity.

No ViewTimeline (Firefox at the time of writing) and reduced motion: the line is shown whole (the scrub keeps the
stylesheet state, a full stroke) and the cards are simply there; the progress bar still reflects the scroll
(written at once).

### 3.7 Act 04 · Feel physical (`#act-physics`, needs: Springs and tokens, Drag)

Copy: "04 · Feel physical"; `<h2>` "Springs, not durations."; body "Six Material 3 Expressive springs. Spatial
springs overshoot a little; effects springs never do. Throw the tile: it glides on with its momentum."; code
`timing: 'spring.fast.spatial'`; links to tokens and gestures.

Stage (scene `scenes/springs.ts`, shared with `/motion/tokens`):

- **Send** button (label becomes **Send back**) and the chip `createSpring(0, { timing })`.
- Six lanes: label (mono `text-label-small`: `fast.spatial` … `slow.effects`, plus the damping ratio and stiffness
  read from `motionManifest.tokens.springs[token].expressive`), a 28 px track, a 24 px ball (`bg-primary` for
  spatial, `bg-tertiary` for effects). Each ball is driven by `createSpring(0, { timing: token, onUpdate: v =>
  ball.style.translate = `${v}px 0` })`; Send calls `to(trackWidth − 28)` on all six at once.
- A "pit" below (180 px, `rounded-[20px]`, faint 24 px grid of `--color-surface-container-high`), with a 64 px
  `tertiary-container` tile button "Throw me" bound to
  `defineGesture('landing-throw', { kind: 'drag', alternative: 'arrows', release: 'spring.slow.spatial' })`, and the
  visible hint "Drag and release, or focus it and use the arrow keys." (`aria-describedby`).

Reduced motion: the balls jump to their target, the throw lands at once. Lanes under 560 px: label above track.

### 3.8 Act 05 · Choreograph (`#act-story`, needs: Sequences, Text, SVG, Counters, Loop)

Copy: "05 · Choreograph"; `<h2>` "A story, with one handle." (this heading is split by words with a `reveal`
definition, the only split heading below the hero); body "Name the steps; the sequence plays them in order. Its
handle seeks like a timeline: drag the ruler."; code `steps: { kicker, title, chart: { at: 'title' }, stats }`;
links to sequences, text, svg, counters.

Stage (scene `scenes/launch.ts`, shared with `/motion/sequences`): a "release card" composition, two columns
(one under 560 px):

- Left, `bg-primary-container rounded-3xl`: kicker "Release" with a live dot (`data-motion="blink"`, the loop) and
  a **Pause loops** text button (label stays, `aria-pressed`); title "Seven verbs, one runtime." (`text-headline-medium`);
  a sparkline `<path>` (stroke `--color-primary`).
- Right: two stat cards with counters whose numbers come from the manifest at build time:
  `Object.keys(motionManifest.verbs).length` ("verbs") and `Object.keys(motionManifest.presets).length`
  ("presets, ready by name"). `<data value="13" data-motion-value="landing-presets">13</data>`, `format: 'integer'`.
- Under the card, the **timeline**: a 48 px icon button (play triangle ⇄ pause bars, morphed with
  `morph(path, …, { timing: 'spring.fast.spatial' })`, `aria-label` "Play the sequence" / "Pause the sequence"),
  a range input (`aria-label="Sequence time"`, `min=0 max=1000`, `aria-valuetext="412 of 1385 milliseconds"`),
  and a timecode `0412 / 1385 ms` (`font-variant-numeric: tabular-nums`, mono, `aria-hidden`).

```ts
defineSequence('landing-launch', { verb: 'appear', steps: {
  kicker: { keyframes: [{ opacity: 0, x: -12 }, { opacity: 1, x: 0 }] },
  title:  { keyframes: [{ opacity: 0, y: 24 }, { opacity: 1, y: 0 }], at: '+=normal', timing: 'spring.slow.spatial' },
  chart:  { keyframes: [{ draw: 0 }, { draw: 1 }], at: 'title',
            timing: { duration: 'duration.extraLong2', easing: 'easing.standard' } },
  stats:  { keyframes: [{ opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1 }], stagger: 'loose' },
} });
```

Behaviour: bound with `sequence(root, 'landing-launch', { settled: true })`; plays when the card is 50 % in view
(one IntersectionObserver, disconnected after the first play), and the counters `set()` their value at the same
moment. While it plays, a rAF loop moves the ruler from `handle.currentTime / (handle.delay + handle.duration)`.
Ruler input: pause, then `handle.seek(fraction × total)`. **A finished handle is frozen**: if the last handle has
finished, call `binding.play()` again, pause it, then seek (verified in the prototype: seeking back and forth then
works, the SVG `draw` step included). Play after a seek resumes from there; Play at the end replays.

Easing tokens that exist: `easing.linear`, `easing.standard`, `easing.standardAccelerate`,
`easing.standardDecelerate` (`easing.emphasized` does not: the validator throws).

Reduced motion: the sequence plays all steps at once with their reduced render; the ruler still seeks (all
states are final); the blink loop does not play; the icon is set at once.

### 3.9 By need, and the start band

**`#by-need`** — `<h2>` "Find it by need"; a grid of six section cards (`repeat(auto-fill, minmax(260px, 1fr))`,
gap 12 px) built from `MOTION_NEEDS` (all sections except Start and Reference): section name (`text-label-large`
uppercase `text-primary`), then one row per need: label (`text-body-large`) and the first API hint (mono
`text-label-small text-on-surface-variant`), separated by `outline-variant` hairlines; each row is a link to the
need page. Cards are `data-motion="rise"` (they cascade as they enter).

**Start band** — `rounded-[32px] bg-primary-container text-on-primary-container p-10` (p-6 under 560 px):
`<h2>` "Three lines to start."; a code block with copy button:

```
npm i @udixio/motion animejs
connectMotion();
<div data-motion="slide">…</div>
```

Links: **Get started** (filled, `/motion/getting-started`) and **Every demo** (text, `/motion/demo`), and the
small line "These links slide forward: that is `connectAstroTransitions()`." (page transitions, shown for real).

### 3.10 Performance, accessibility, responsive, dark mode

**What plays when**

| Moment | What runs |
|---|---|
| Load | Hero intro (≈ 0.9 s), once. Nothing else. |
| Idle | Nothing. The blink loop in act 05 runs only while visible (the library pauses it off-screen). |
| Pointer over the field | Two pointer values + one state value (one CSS variable write per frame on the field). |
| A press | The scene of that press only. |
| Scroll | The thread scrub (compositor), reveals, the reading value. |

- Scene scripts are loaded on demand: each stage has `data-motion-scene="<name>"`; a loader
  (`apps/doc/src/components/motion/scenes/loader.ts`) uses `import.meta.glob('./*.ts')`, observes stages with an
  IntersectionObserver (`rootMargin: '50% 0px'`), imports and mounts a scene when it first nears the view. The hero
  scene mounts at once. Sub-entries (`value`, `sequence`, `gesture`, `svg`, `text`, `animate`) are imported by the
  scenes that need them, never by the page shell. Preload the layout engine in the hero
  (`await loadLayoutEngine()` before the first arrangement).
- Lifecycle with the client router: each scene module exports `mount(root: HTMLElement): () => void`. The loader
  mounts on `astro:page-load` (scripts do not re-run on client navigation) and calls the teardowns on
  `astro:before-swap`: `revert(root)` from `@udixio/motion/scope`, `destroy()` of value bindings, `stop()` of
  springs, cancel morphs, disconnect observers.
- No layout shift: the field has a fixed aspect ratio; the inbox stage has a fixed min-height; the letters
  container has `min-height: 1em`; the intro hides with `visibility`/`opacity`, never `display`.
- Budgets (measured in the prototype on this machine, 96 swatches): a re-arrangement's first frame took 31–47 ms
  in Chromium, 30–50 ms in Firefox, 62 ms then 50/41 ms in WebKit; other frames at 16.7 ms. Acceptance: in
  Chromium at most 2 frames over 34 ms per arrangement; in WebKit at most 4. If WebKit is over, drop the ≥ 1040 px
  field to 12 × 6 rather than slowing the springs.
- Fonts: only the two families already loaded (Montserrat, Roboto). No new web font.

**Accessibility**

- Landmarks and headings: one `<h1>`, an `<h2>` per act, "Find it by need" and the start band; `<h3>` per need card.
- Decorative: the field, the shape, the thread, the sparkline, the balls are `aria-hidden`. The title's letters are
  `aria-hidden` with an `sr-only` "Animation".
- Every control is a native `<button>`/`<input>`/`<a>` with a visible label and `focus-visible:outline-2
  outline-offset-2 outline-on-surface`. Toggle groups use `aria-pressed`. No live region except the library's own
  (reorder) — the arrangement change is not announced.
- Pointer-only effects are decorative (lens). Every functional gesture has its keyboard alternative and a visible
  hint (swipe → Delete, drag → arrows).
- Loops: one (act 05), with **Pause loops** (WCAG 2.2.2); `pause: 'control'` (the `blink` preset).
- No flashing: the blink preset is one dim flash per second.
- Focus on scroll: the need strip uses real anchors; the scene script enhances them with
  `scrollTo(target, { focus: true, offset: -72 })` (focus moves to the act's `<section tabindex="-1">`).

**Responsive** (container widths, §3.1): at < 560 px the field is 8 × 6; acts stack (copy, then stage); sticky copy
off; gallery 2 columns; lanes stacked; pit 160 px; release card one column; by-need one column; start band
stacked. **No horizontal scroll at 375 px**: code blocks scroll inside (`overflow-x: auto`), every grid column is
`minmax(0, 1fr)` (the prototype overflowed with `1fr` and `white-space: pre`). Touch: the lens is off; the caption
line about the pointer is hidden.

**Dark mode**: the site defaults to dark (`body.dark`). Everything uses theme tokens; the field derives its colours
from role tokens through relative colour syntax, so it follows light/dark and the theme builder's source colour.
Checked in the prototype in both modes (light keeps the rows readable; the error role was removed from the rows
because it was too loud in light mode).

### 3.11 Prototype findings and screenshots

Screenshots (desktop 1280 × 900 viewport without the doc chrome, so the content is wider than in the site; mobile
375 × 812):

- Hero at rest, dark: `…/anim-design/shots/hero-desktop.png`
- Hero at rest, light: `…/anim-design/shots/hero-light.png`
- Hero at 375 px: `…/anim-design/shots/hero-375.png`
- Intro frames (letters from the centre, ring ripple): `…/anim-design/shots/sheet-intro.png`
- Weave in flight (letters sorting, flower morph): `…/anim-design/shots/sheet-hue.png`
- Bands and Shuffle mid-flight (pills stretching, interrupted flight, lens): `…/anim-design/shots/sheet-sort-midflight.png`
- Lens: `…/anim-design/shots/desk/04-lens.png`
- Acts: `…/anim-design/shots/desk/20-act-presence.png`, `20-act-layout.png`, `20-act-scroll.png`,
  `20-act-physics.png`, `20-act-story.png`, `20-by-need.png`
- Shared element mid-morph and open: `…/anim-design/shots/desk/32-shared-120ms.png`, `33-shared-open.png`
- Sequence seeked to 25 %: `…/anim-design/shots/desk/37-seek-25.png`
- Mobile acts: `…/anim-design/shots/sheet-mobile.png`; light + reduced: `…/anim-design/shots/sheet-light-reduce.png`

(`…` = `/tmp/claude-1000/-home-joel-Documents-projets-udixio-ui-components/94acf95f-06e9-4435-8104-8114a215e776/scratchpad`.)

Findings that the implementation must respect:

1. Grid ripple: stagger ranks are 1-D reading order; a 2-D ripple needs one binding task per ring (§3.3.1).
2. A presence name in `data-motion` on an element inserted after `connectMotion()` plays at insertion: for a
   choreographed intro, bind with `motion(el, name, { settled: false })` at the chosen moment.
3. At rest the runtime removes neutral inline values (opacity 1), so any stylesheet rule that hides an element
   for the intro must be removed before the entry ends.
4. An author `display` rule beats the `hidden` attribute: Tailwind's preflight covers it in the site; any custom
   CSS on a toggled element needs `[hidden] { display: none !important }`.
5. Relative colour syntax: `h` is a number; `calc(h + 30deg)` is invalid and the colour becomes transparent.
6. A sequence handle seeks backwards and forwards, `draw` steps included; once finished it is frozen: play again,
   pause, seek.
7. `scrub` + `draw` works on a `preserveAspectRatio="none"` SVG with `vector-effect: non-scaling-stroke`.
8. Shared element in a grid: hiding the thumbnail reflows its neighbours; an absolutely positioned detail over the
   grid hides that reflow on open and shows it on close (pleasing, keep it).
9. A single "Bands" re-flow that changes the field's height pushes the whole page; fix the field's aspect ratio.
10. The reflow + lens on 96 elements stays within budget in Chromium and Firefox; WebKit is the limit (§3.10).

Library follow-ups (not in this pass, record them in the motion spec's open points): per-step timing on a
sequence handle (to draw step marks on the ruler); a radial `origin` for 2-D stagger.

---

## 4. The need-page template

### 4.1 Structure (every need page, in this order)

1. **Header**: section name as eyebrow (`text-label-large text-primary`), `<h1>` = the need label ("Make a list
   appear"), a one-sentence lede, API chips (the `hints` of the need, mono, `bg-surface-container-high`), and the
   **Reduce motion** switch on the right (§3.2).
2. **Hero scene**: a `MotionStage` with the page's live example, controls and a live code readout. It is the first
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

The TOC sidebar is on (`docSidebar: true`) for need pages. Reference pages (limits, roadmap, demo) keep their
current body and only take the header (no hero scene).

### 4.2 Shared components to build

All in `apps/doc/src/components/motion/` unless stated.

| Component | Props / API | Notes |
|---|---|---|
| `MotionPage.astro` (`src/components/`) | `title`, `description`, `slug` (key of `MOTION_NEEDS`), `docSidebar?` | Header from `MOTION_NEEDS[slug]`; slot for the body; no underlined link line. |
| `MotionStage.astro` | `scene` (scene module name), `label` (aria-label), `height?: 'sm' \| 'md' \| 'lg'` (240/360/480 px min), `replay?: boolean`; slots `controls`, default (scene markup), `readout` | `<section aria-label>` + controls row + body `rounded-[28px] bg-surface-container-low p-5 overflow-clip` + readout `<pre>` (mono, `bg-surface-container-high rounded-2xl`, `overflow-x:auto`). `data-motion-scene={scene}` for the loader. |
| `scenes/loader.ts` | — | §3.10: lazy import + mount/teardown on router events. Included once by `MotionPage.astro` and the landing. |
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
| `/motion/lists` (new) | `inbox` (act 01) with an extra **Stagger tight · normal · loose** group and an **Exit in place · out of flow** group. | `cascade reflow`; `stagger`/`origin`/`exit` definition; React `useMotion(['cascade','reflow'], { present })`; Angular `udxMotion="cascade reflow"` in `@for`; Svelte `motion(['cascade','reflow'])` + `transition:presence`. | new `motion-list`, live |
| `/motion/emphasis` | `emphasis`: a **Save** button with `press`; a code field that `shake`s on a wrong code (type anything but 1234, Enter); a notification badge whose count increments with a custom `pop` emphasis. | `data-state`; React `state`; Angular `[udxMotionState]`; Svelte `state`. | existing `motion-emphasis`, live |
| `/motion/layout` | `gallery` in layout mode: **Grid · List**, a **Widen** toggle on the first card (resize without distortion), a pill **Align start · end**. | `reflow`; scope (`data-motion-scope`); `getMotion(el)?.play()` after an inline style. | existing `motion-layout`, live |
| `/motion/shared-elements` (new) | `gallery` in shared mode (act 02) plus a tab bar whose indicator is a shared element ("the highlight of this page's table of contents is one too"). | `data-motion-shared`; `useMotion('reflow', { shared })`; `udxMotionShared`; Svelte option; `defineShared`. | new `motion-shared`, live |
| `/motion/gestures` | `gestures`: one "Today" board: reorder tasks (grab), swipe to complete (action), a draggable sticker (arrows). Event log line under the stage (`motion-reorder`, `motion-swipe`, `motion-dragend`), `aria-live="off"`. | `defineGesture` per kind; events; React `useMotionGesture`; Angular `[udxMotionGesture]` + outputs; Svelte `motionGesture`. | existing `motion-gesture`, live |
| `/motion/page-transitions` | `pages`: two real links **Forward to "Scroll" →** and **← Back** (history), and an SVG diagram of two page frames drawn on reveal showing the slide direction. | `navigate(update, { direction })`; `connectAstroTransitions()`; React Router / Angular Router / SvelteKit hooks calling `navigate` (code). | code |
| `/motion/reveal` (new) | `reveal`: a 360 px scroll box (a feed) with `rise` cards; toggle **Once · Always** (`repeat`). Reveal tracks the viewport through the box's clipping. | `data-motion="rise"`; reveal definition (`stagger`, `origin`, `repeat`, `axis`); `useMotion('rise')`; `udxMotion="rise"`; Svelte. | new `motion-reveal`, live |
| `/motion/scrub` (new) | `thread` (act 03) + three `parallax` tiles; a status chip from `supportsViewTimeline()`: "Scroll-linked in this browser" or "This browser has no ViewTimeline: shown still". | scrub definition (`range`, `axis`); `--udx-motion-scale`; React/Angular/Svelte with `parallax`. | new `motion-scrub`, live |
| `/motion/scroll` | `scroll`: a scroll container with five sections and a row of buttons that `scrollTo` them inside the container (`container`, `focus: true`); a note "Turn the wheel during the scroll: it stops." | `scrollTo`, `scrollDestination`, handle `finished`/`cancel`. | code |
| `/motion/values` | `field` (the hero field at 12 × 4, Palettes only) for pointer values, a tilt card, and a range input driving a `state` value `level` that moves a gauge over a spring. | `defineValue` sources; `data-motion-value`; `value()`/`subscribe`; `useMotionValue`; `[udxMotionValue]`; `motionValue`. | new `motion-pointer`, live |
| `/motion/counters` (new) | `counters`: four counters (integer visitors, percent returning, currency EUR revenue, decimal rating 4.8) counting on reveal; **Add 1,000**; a language group **en · fr · de** that sets `lang` on the stage (formats change). | `format`, `currency`, `<data value>`; screen reader text; React/Angular/Svelte. | existing `motion-values`, live |
| `/motion/sequences` | `launch` (act 05) with the ruler and timecode. | `defineSequence` + `data-motion-step`; `sequence()`; `useMotionSequence`; `[udxMotionSequence]`; `motionSequence`. | existing `motion-sequence`, live |
| `/motion/text` | `text`: one sentence ("Every word arrives in turn, and is read once."); groups **chars · words · lines** × **first · center · last**, and **appear · reveal**; **Replay**; readout = the definition. | `split` definitions; React `useMotion('headline')` etc.; semantics kept, read once. | new `motion-text`, live |
| `/motion/svg` | `svg`: the four M3 shapes morphing on a group **Cookie · Flower · Clover · Sunny**; a check mark drawn with `draw` (**Draw again**); a dot travelling `along` an arc (**Move again**). | `draw` preset; `along` definition with `offset-path`; `morph()` (code in frameworks). | new `motion-svg`, live (draw/along), code (morph) |
| `/motion/loop` (new) | `loop`: a spinner (`rotate`), a live dot (`breathe`), a recording light (`blink`), an indeterminate bar (custom loop, `pause: 'essential'` + reason); one **Pause loops** button for the three `control` loops. | `pause: 'control' \| 'essential'`; `data-motion-paused`; `paused` option per framework. | existing `motion-loop`, live |
| `/motion/tokens` | `springs` (act 04) with the six lanes and token values; a curve list (durations, easings) with a bar animated by each curve on **Play curves**. | timing in definitions; CSS variables `--udx-motion-spring-*`; `defineTokens`, `resolveSpring`. | code |
| `/motion/scopes` | `scopes`: two identical cards with `rise`: one plain, one with `[--udx-motion:fade]`, and a third with `[--udx-motion:none]`; **Replay**; an **Inspect this page** button printing `inspect()` (from `@udixio/motion/scope`) into the readout. | Tailwind per breakpoint (`md:[--udx-motion:fade]`); `revert`; `inspect`. | code |
| `/motion/animate` | `animate`: a card whose background colour, corner radius and `clip-path` animate with `animateStyle` on a token; a dot following a pointer drag with `createSpring`. | `animateStyle`, `createSpring`, `cssTiming`, `composeHandles`, stagger helpers. | code |
| `/motion/accessibility` | `policy`: a mini scene (a card entry, a reflow, a loop) and the page's **Reduce motion** switch next to it; the table "what each verb shows" kept. **The existing no-JS swatch demo is kept with its labels** ("Reduce motion in this demonstration", "Change the decorative swatch", `.swatch`): a test depends on it. | `data-motion-policy`; `motionPolicy` from `@udixio/motion/policy`; `--udx-motion: none`; `restoreFocus`. | code |
| `/motion/limits`, `/motion/roadmap` | none (reference). | — | — |
| `/motion/demo` | unchanged content and selectors; header from the template. | — | — |

Scene modules are shared: `inbox` (landing act 01, lists), `gallery` (act 02, layout, shared-elements),
`thread` (act 03, scrub), `springs` (act 04, tokens), `launch` (act 05, sequences), `field` (hero, values).
A scene reads its variant from `data-*` on its stage (`data-mode="shared"`, `data-cols="12"`…).

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
   (nav name `Motion documentation` → `Animation documentation`; link `Demo` → `Every demo`; rail link name
   `Motion` → `Animation`; the no-JS focus test: from "Overview", Tab reaches "Getting started", and Enter on
   "Roadmap" still navigates) and the `motionPages` list in `tests/pages.browser.test.mjs` (§2.3, plus the redirect
   lands on `/motion/reveal/`).
2. **Template components.**
   Files: `src/components/MotionPage.astro`, `src/components/motion/{MotionStage,MotionUsage,MotionOptions,MotionTokens,MotionRelated}.astro`,
   `src/components/motion/scenes/loader.ts`, `src/lib/motionDocs.ts`, `src/components/motionDemo.ts`,
   `src/components/Code.astro`, `src/components/CodePreview.tsx`, `src/stores/exampleFrameworkStore.ts`,
   the Reduce motion switch island (`src/components/motion/MotionPolicySwitch.tsx`).
   Acceptance: a component page (e.g. `/components/switch/overview/`) shows the same tabs as before; a motion page
   with an `html` source shows HTML first when preferred and hides Preview/Code for it; the switch persists across
   a client navigation and is disabled under system reduce. Tests: keep all existing; add one test that the
   framework preference `html` falls back on a component page.
3. **Landing hero.**
   Files: `src/pages/motion/index.astro`, `src/components/motion/landing/Hero.astro`,
   `src/components/motion/scenes/{landing-hero,field}.ts`, `src/lib/m3-shapes.ts` (shape generator).
   Acceptance: §3.3 at 1280 (with the pinned panel), 900 and 375 px, dark and light; the intro under 1 s and once;
   no CLS (Lighthouse CLS < 0.02 or Playwright `layout-shift` entries sum < 0.02); re-arrangements within the
   budgets of §3.10; no inline `translate`/`scale` left on any swatch at rest; lens off after the pointer leaves.
4. **Acts 01 and 02.**
   Files: `landing/ActPresence.astro`, `landing/ActLayout.astro`, `scenes/{inbox,gallery}.ts`.
   Acceptance: §3.4–3.5; keyboard-only run (Tab, Space, Delete, Escape) completes every interaction; focus returns
   to the thumbnail after closing.
5. **Acts 03–05, by need, start band.**
   Files: `landing/{ActScroll,ActPhysics,ActStory,ByNeed,StartBand}.astro`, `scenes/{thread,springs,launch}.ts`.
   Acceptance: §3.6–3.9; thread drawn by scroll in Chromium and WebKit, whole in Firefox; ruler seeks back after
   the end; counters show manifest numbers; Pause loops works.
6. **Need pages, group A** (presence, lists, emphasis, layout, shared-elements) with their examples (§5).
7. **Need pages, group B** (gestures, page-transitions, reveal, scrub, scroll, loop).
8. **Need pages, group C** (values, counters, sequences, text, svg).
9. **Need pages, group D** (getting-started, presets, tokens, scopes, animate, accessibility) and the header on
   limits, roadmap and demo. `/motion/demo`: no change to its body; verify every `data-demo-*` selector and id
   still exists (`git show HEAD:apps/doc/src/pages/motion/demo.astro` vs the new file, body identical).
   For each of tasks 6–9, acceptance per page: hero scene works with pointer and keyboard, reduced version
   checked with `html[data-motion-policy=reduce]`, all four tabs present, live previews hydrate without console
   errors, options table matches the manifest, no horizontal scroll at 375 px.
10. **Tests.** Add `apps/doc/tests/animation.browser.test.mjs` (same runner and env as the others):
    - landing: `getByRole('heading', { level: 1, name: 'Animation' })`; nine letters; after `networkidle` + 1.5 s
      every `.sw` has empty inline `translate`/`scale` and computed opacity 1;
    - press **Weave**: the first swatch's `data-tone` order changes; within 100 ms some swatch has an inline
      `translate` (Chromium only); at rest none has;
    - reduced context (`reducedMotion: 'reduce'`): the intro does not hide anything (letters visible at load) and an
      arrangement leaves no inline transform after one frame;
    - 375 px: `document.documentElement.scrollWidth <= innerWidth` on `/motion/`, `/motion/lists/`,
      `/motion/sequences/`;
    - sequence: on `/motion/sequences/`, after the play ends, set the ruler to 10 % → the title step's opacity is
      below 1; set it to 100 % → 1;
    - gallery: keyboard open/close, focus ends on the thumbnail;
    - side panel: on `/motion/lists/` the link "Make a list appear" in "Animation documentation" has
      `aria-current="page"`.
    Keep every existing test of `/motion/demo` unchanged. Run Chromium first, then Firefox and WebKit, one at a
    time.
11. **Final visual review** (a design reviewer, not the implementer): screenshots of `/motion/` at 1280 × 900 with
    the pinned panel, 1024, 768 and 375 px, dark and light, reduced; burst frames of the intro and of each
    arrangement (every 50 ms for 1 s); each act at rest and mid-interaction; three need pages. Check: the hero
    reads as one composition (title, shape, field aligned on one grid; the shape never collides with the title);
    letter flights have no visible jump at the start; swatch pills in Bands keep round corners; no element
    clipped by the stage during a morph that should not be; text contrast on every role colour (detail card body
    text failed in the prototype: use the `on-` colour at full opacity); nothing moves at idle except the act 05
    loop while visible. Report with the screenshot paths; fix, then re-shoot.

Suggested model per task (per the maintainer's preference): tasks 3–5 and 11 are design work; the others are
implementation.

---

## 7. Open points for the maintainer

- The landing keeps the pinned panel at `lg` (consistent with the other sections; the hero is designed for about
  900 px). The alternative is to not pin it on `/motion` only, giving the hero the full width.
- The title letters re-sort with the field (alphabetical, stacked, shuffled). If it reads as a gimmick, one flag
  in `landing-hero.ts` keeps the title still; the field is unaffected.
- `ExampleFramework` gains `html` site-wide (§4.3); the alternative is a motion-only tab component.
