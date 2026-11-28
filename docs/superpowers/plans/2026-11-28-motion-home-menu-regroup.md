# The /motion home and the Animation menu, regrouped: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Right after step 2/8, regroup the `/motion` home ("What it does" in six blocks, the components showcase gone,
one word per thing in the hero and the principle) and the Animation side panel (ten sections), with the pages and cards
that exist today and no promise of what is not coded.

**Architecture:** The side panel is data: `MotionSection`, `SECTION_ORDER`, each need's `section` and `label`, and the
order of `MOTION_NEEDS` in `apps/doc/src/lib/motion-nav.ts`; `Navigation.tsx` and `Sidebar.tsx` render it unchanged.
The home's six blocks are data too, in a new `apps/doc/src/lib/motion-home.ts` (title, sentence, cards with an optional
title and chip, links), rendered by `root/Gallery.astro` through a new `root/HomeBlock.astro`; the cards stay
`root/NeedCard.astro` and their previews stay `root/previews.ts`. The components showcase is deleted with its suite.

**Tech Stack:** Astro 7 (static), React 19 islands with `@udixio/ui-react`, Tailwind v4 with the Udixio theme tokens,
`node --test` (Node 24, type stripping), Playwright through the doc's `*.browser.test.mjs` suites.

**Spec:** `docs/superpowers/specs/2026-11-28-motion-model-design.md` §6 (home and menu), §2.1 (the words), §8 (Recipes and
Presets provisional), §7.3 (docs); the amendment, `.superpowers/sdd/2026-11-17-animation-docs/plan-commun-motion-components-30-94.md`
§4; the URL infrastructure of `docs/superpowers/specs/2026-11-28-framework-urls-and-motion-syntax-design.md` §2.8 and
§2.10 (in place: `DocLink`, `motionUrl`, `withFramework`, feature tabs). Its §4 and Appendix A.4 (the home "by notion",
`Notions.astro`) are superseded by the model spec §6 and are not implemented.

## Where this plan sits

- **After step 2/8, before step 3/8's doc tasks.** Step 3/8 (`docs/superpowers/plans/2026-11-28-motion-step3-slice.md`)
  touches `motion-nav.ts` in its Task 28/28 · part 3/4 and the pages that teach the writing. When this plan has landed
  first, that part puts the `hover-press` need in **Triggers**, after On change (its M1 row and question 4 assume the old
  `Motions` section "until the menu is regrouped"), and its list of pages that teach the writing gains the home's
  block 1/6 sample and the four `motion-principle.*` examples. The controller tells the step 3/8 controller; this plan
  does not edit that file.
- **Wait-free on the early track, with one wait.** Task 7/9 of `docs/superpowers/plans/2026-11-28-motion-early-track.md`
  is changing `apps/doc/src/components/Navigation.tsx` and `Sidebar.tsx` now. No task here edits those two files, but
  Task 1/5 changes what they render and checks it in a browser: **Task 1/5 starts only once Task 7/9 is committed**
  (the controller checks `git log -- apps/doc/src/components/Sidebar.tsx` and `git status`). Tasks 2/5 to 4/5 do not
  touch the navigation and need not wait for it, except through Task 1/5 where stated. If a designer answer (D7) asks
  for a change to `Sidebar.tsx`, that change is its own task, after Task 7/9, never folded into Task 1/5.
- **The removals are done** (early track Tasks 1/9 and 3/9: `scrollTo`, page transitions, `/astro`, the time value;
  their pages, cards and facts are gone). Task 5/5 re-runs the sweep to prove it.

## Interim departures from the spec (questions J1 and J2 at the end)

- **No "Write your own" and no "The handle" page yet** (spec §6.2 splits both out at the regrouping). Per the control
  session's brief, a page that does not exist gets no menu entry until the step that writes it: Motions holds Presets
  alone, Control holds Sequences alone; block 1/6 links Presets only, block 4/6 has no handle link. Hover and press
  arrive with step 3/8 (above).
- **The Hero row's "code"** (spec §6.1: "the code shown is the attach line with a preset, no `verb` on screen") is read
  as the principle's example (`examples/*/motion-principle.*`), the first code of the page: the hero itself shows only the
  install command. The principle section stays; its example drops its own `defineMotion('pop', { verb: 'appear' })`.

## Global Constraints

- Repository rules: `CLAUDE.md`, `apps/doc/CLAUDE.md` / `AGENTS.md`, `.superpowers/sdd/2026-11-17-animation-docs/rules.md`.
  English in every file.
- Never `git stash`, `checkout -- <file>`, `restore`, `reset`, `clean`; never switch branch. Commit with
  `git commit -m "<conventional message>" -- <explicit paths>` (deletions with `git rm`), the message ending with the
  session's Co-Authored-By line. No push, no `pnpm install`, no new dependency.
- **Scope (spec §6):** the pages, cards, scenes and examples that exist today, moved and relabelled. Nothing that is not
  coded is shown or named: no hover, focus or press card or sentence, no per-property timing, no events, no handle
  `speed`/`progress`/`finish`. The pages keep their slugs.
- **Menu, verbatim:** `Start · Motions · Triggers · Targets · Control · Tools · Interactions · System · Recipes · Reference`.
  Pages, in order: Start: Overview, Getting started, How it works, Choosing an API. Motions: Presets. Triggers: Presence,
  On change (`emphasis`), In view (`reveal`), Scroll (`scrub`), Loop. Targets: Lists, Text, SVG, Shared elements, Layout.
  Control: Sequences. Tools: Animate now (`animate`), Values (`counters` stays `nav: false`, `/motion/values#counters`).
  Interactions: Gestures. System: Tokens, Accessibility, Per breakpoint, Loading and weight. Recipes: Dialog, Toasts,
  Accordion, Tab indicator, Navigation menu (landing `recipes`, `nav: false`). Reference: API, Glossary, Troubleshooting,
  Inspect and revert, Limits (Roadmap stays `nav: false`).
- **Recipes and Presets are provisional** (spec §8): they stay in the menu until the Examples tabs of step 8/8; nothing in
  this plan builds on their place. `SECTION_LANDINGS` keeps `Recipes: '/motion/recipes'`.
- **Home, verbatim (spec §6.1):** section heading "What it does"; lead "A motion, a trigger, a target; then how to steer
  it, the tools beside it, and the system." Blocks, title · sentence · cards (slug):
  1/6 "What moves? The motion" · "Keyframes and a timing, written once and named; thirteen come ready-made." · no card,
  one static `defineMotion` sample, a link to Presets.
  2/6 "When? The trigger" · "It plays when the element enters or leaves, when a value changes, when it scrolls into
  view, as the page scrolls, or all the time." · `presence`, `emphasis`, `reveal`, `scrub`, `loop`, titled "Presence",
  "On change", "In view", "With the scroll", "Loop".
  3/6 "On what? The target" · "One element, each item of a list, each piece of a text, an SVG stroke, two linked
  elements, or an element that changes place." · `lists`, `text`, `svg`, `shared-elements`, `layout`.
  4/6 "How to steer it?" · "A handle plays, pauses and seeks one motion; a sequence does it for many." · `sequences`.
  5/6 "The tools apart" · "Animate any CSS property now, follow a number, move an element with the pointer." ·
  `animate`, `values`, `counters`, `gestures`.
  6/6 "The system" · "Tokens give every motion the same timing; reduced motion and the screen size change what plays." ·
  `tokens`, `accessibility`, `per-breakpoint`.
  Eighteen cards. Cards of blocks 2/6 and 3/6 carry no chip; the tools keep their function chip. Cards keep their
  scenes, sentences and links.
- "Material 3 motion" in the home's promise becomes "Material 3 tokens" (hero and page description).
- Removed (Joël): "Your Udixio components already move with it": `root/Components.astro`, `root/components/*` (seven
  files), `tests/components-showcase.browser.test.mjs`, and their tests in `animation.browser.test.mjs`.
- Every control is a Udixio component; Tailwind and theme tokens; no new `.css` file, no `<style>` block; no new
  animation: the blocks use the page's existing `data-motion="rise"` marks and the cards' existing previews.
- Implementers: Haiku, under 500k tokens each; reviews Sonnet, effort `high`. Implementers run only the checks their task
  names: never `astro build`, never a whole browser suite; at most one dev server and one browser file, Chromium, in a
  serial task. The controller builds and runs the three engines (Task 5/5). Before a dev server or a browser run:
  `cut -d' ' -f1 /proc/loadavg` below 8.
- Visual and copy decisions not fixed by the spec are the designer's (questions D1 to D7). **Tasks 3/5 and 4/5 are not
  dispatched before the designer has answered D1 to D6**; the controller pastes the answers, verbatim, into their briefs.

### Brief block (paste into every implementer brief)

> - Every control is a Udixio component (Button, IconButton, Chips, Tabs…), in examples, scenes and the site's chrome.
>   Native elements only in the HTML example and for the element that is itself the animation. Before reporting, grep
>   `<button|<input|<select|role="tab"` in the files you touched and justify each native one.
> - Style with Tailwind classes and the Udixio theme tokens: no new `.css` file, no `<style>` block, no hard-coded colour,
>   radius or spacing.
> - The copy never names or shows what the package does not do today: no hover, focus or press trigger, no per-property
>   timing, no start/end events, no handle speed or progress. When in doubt, leave the sentence out and report it.
> - Animation: reuse `data-motion="rise"` and `root/previews.ts` as they are; no new animation, engine or mechanism.
> - After a rename or a removal, grep `apps/doc/src` and `apps/doc/tests` for the old name, and run the throwaway-tsconfig
>   sweep of `apps/doc/AGENTS.md`. Report what it finds in your files.
> - Format the files you changed with `pnpm exec prettier --write <files>` (not `pnpx`).

## Review Focus

1. **A reading in another framework** (`localStorage` holds `svelte`): every card and block link of the home goes to the
   stored framework's reading, never to a bare framework page that costs a stub. Pinned in Task 3/5 (cards are
   `DocLink`s with `data-framework-link`; the test reloads with `svelte` stored and checks the prefix).
2. **Reduced motion, system or the site's policy:** the blocks change nothing: no preview plays, the player stays closed.
   Pinned by the existing tests "under reduced motion the root page is still" and "a card's preview plays again…",
   which Task 3/5 keeps green unchanged (they select `[data-need-card]` and `[data-gallery]`, which stay).
3. **A phone (375 px):** six blocks and a code sample do not scroll the page sideways and the sample is not cut. Pinned in
   Task 3/5 (`/motion/` in the 375 px "no horizontal scroll" and "no code block … is cut" lists).
4. **Copy that promises what is not coded:** no "hover", "focus" or "press" in the "What it does" section, the hero or its
   caption. Pinned in Tasks 3/5 and 4/5.
5. **A renamed page named by its old label elsewhere** ("Emphasis", "Reveal", "Scrub", "animateStyle and springs" as link
   text, a glossary `see`): the link text follows the new label. Pinned in Task 1/5 (unit test over `MOTION_GLOSSARY`
   `see` labels, and a grep in its verification step).

## Groups

| Group | Tasks     | Runs                                                  | Why                                                                                                                                             |
| ----- | --------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | 1/5 ∥ 2/5 | parallel; 1/5 after early-track Task 7/9 is committed | disjoint: 1/5 owns `motion-nav.ts`, the glossary, link texts, `motion.browser`; 2/5 owns the showcase files, `index.astro`, `animation.browser` |
| 2     | 3/5       | after 2/5 and the designer's D1 to D3                 | shares `animation.browser.test.mjs` with 2/5                                                                                                    |
| 3     | 4/5       | after 1/5 and 3/5, and the designer's D4 to D6        | shares `motion-nav.ts` with 1/5, `animation.browser.test.mjs` and `index.astro` with 2/5 and 3/5                                                |
| 4     | 5/5       | controller                                            | everything                                                                                                                                      |

---

### Task 1/5: the ten-section menu (group 1)

Implementer: Haiku, effort `high`. Review: Sonnet.

**Files:**

- Modify: `apps/doc/src/lib/motion-nav.ts` (`MotionSection`, `SECTION_ORDER`, the `section` and `label` of the needs,
  the order of `MOTION_NEEDS`, the TSDoc of the three), `apps/doc/src/lib/motion-glossary.ts` (a `target` term; `see`
  labels), `apps/doc/src/pages/motion/_how-it-works.astro:174`, `_choosing-an-api.astro:218,260,505`, `_loop.astro:68`
  (link texts naming a renamed page)
- Create: `apps/doc/tests/motion-nav.test.mjs`
- Test: `apps/doc/tests/motion.browser.test.mjs` (the side panel test, line ~140)

**Interfaces:**

- Produces: `type MotionSection = 'Start' | 'Motions' | 'Triggers' | 'Targets' | 'Control' | 'Tools' | 'Interactions' |
'System' | 'Recipes' | 'Reference'`; `SECTION_ORDER` in that order; `MOTION_SECTIONS` unchanged in shape. Labels:
  `emphasis` "On change", `reveal` "In view", `scrub` "Scroll", `animate` "Animate now"; every other label and every
  `need`, `summary`, `hints`, `href`, `scene` unchanged. Sections: `presets` Motions; `presence`, `emphasis`,
  `reveal`, `scrub`, `loop` Triggers; `lists`, `text`, `svg`, `shared-elements`, `layout` Targets; `sequences`
  Control; `animate`, `values`, `counters` Tools; `gestures` Interactions; recipes stay Recipes. `MOTION_NEEDS` is
  reordered to the menu's order (the side panel and the related cards read it in order).
- The label is also the page's H1 and the head of its title (`motionTitle`): "On change in React · Motion". The `need`
  stays the subtitle ("Draw attention").

- [ ] **Step 1: Write the failing tests.** `tests/motion-nav.test.mjs` (`node:test`, imports `../src/lib/motion-nav.ts`
      and `../src/lib/motion-glossary.ts`):
      `the side panel has ten sections in the spec's order` — `MOTION_SECTIONS.map(s => [s.category, s.pages.map(p => p.label)])`
      deep-equals the menu of Global Constraints;
      `no page of the menu is a page that does not exist` — no label among `Write your own`, `The handle`, `Hover and
    press`, `scrollTo`, `Page transitions`;
      `no section of the old menu remains` — no category `Values, gestures, sequences` or `Functions`;
      `a glossary see-link names its page by the page's label` — for each term with `see.href` equal to a need's bare
      `href`, `see.label === need.label`;
      `the glossary defines target` — a term `target` with slug `target` exists, and the terms stay in alphabetical
      order.
      In `motion.browser.test.mjs`, replace the expected array of "the side panel lists the Animation pages by mechanism"
      with the same ten sections, and rename the test "the side panel lists the Animation pages by question, each under
      its concept word".
- [ ] **Step 2: Run** `cd apps/doc && node --test tests/motion-nav.test.mjs`: FAIL on the sections, the glossary.
- [ ] **Step 3: Implement** the Interfaces above. Glossary `target` (alphabetical place, second person, true today):
      "What a motion plays on: the element, each item of a list (a cascade), each piece of a split text, the stroke of an
      SVG shape, or two elements linked by a key." with `see: { label: 'Lists', href: '/motion/lists' }`. The `motion`,
      `trigger` and `handle` terms keep their definitions (they describe the code as it is; spec §6.2: the glossary
      loses nothing the code still uses). Update the `see.label` of `emphasis` ("On change") and `view motion` ("In
      view"), and the link texts listed in Files ("Animate now", "On change"). The roadmap's rows keep their wording (out
      of the menu, history of delivery).
- [ ] **Step 4: Run** the unit test: PASS. Then
      `grep -rnE "'(Values, gestures, sequences|Functions)'|link=\"(Emphasis|animateStyle and springs)\"|label: '(Emphasis|Reveal|Scrub)'" apps/doc/src`
      finds nothing outside `roadmap.astro`. One dev server (`npx astro dev`, after the load check), Chromium:
      `MOTION_BROWSERS=chromium MOTION_DOC_URL=http://localhost:4321 node --test --test-name-pattern="side panel lists" tests/motion.browser.test.mjs`: PASS.
      Stop the server.
- [ ] **Step 5: Commit** `git commit -m "feat(doc): the Animation menu asks what moves, when, on what, and how to steer it" -- <paths>`

### Task 2/5: delete the components showcase (group 1)

Implementer: Haiku, effort `medium`. No task review (a deletion; covered by Task 5/5).

**Files:**

- Delete: `apps/doc/src/components/motion/root/Components.astro`, `root/components/NavigationRailTile.tsx`,
  `PauseTiles.tsx`, `ShowcaseTile.astro`, `SideSheetTile.tsx`, `SnackbarTile.tsx`, `TabsTile.tsx`, `autoplay.ts`;
  `apps/doc/tests/components-showcase.browser.test.mjs`
- Modify: `apps/doc/src/pages/motion/index.astro` (the import, `<Components />`, and the comment that names it)
- Test: `apps/doc/tests/animation.browser.test.mjs` (delete "the components section says its tiles play by themselves…",
  line ~1030; drop `'Your Udixio components already move with it'` from the first test's expected `h2` list)

- [ ] **Step 1:** `grep -rn "root/components\|Components.astro\|data-components-showcase\|PauseTiles\|ShowcaseTile\|autoplay'" apps/doc/src apps/doc/tests apps/doc/scripts`
      lists only the files above (`player.ts`'s `data-player-autoplay` is another thing and stays).
- [ ] **Step 2:** `git rm` the files; edit `index.astro` and the two places of `animation.browser.test.mjs`.
- [ ] **Step 3: Check:** the grep of Step 1 finds nothing; `node --check tests/animation.browser.test.mjs`; the
      throwaway-tsconfig sweep adds no error.
- [ ] **Step 4: Commit** `git commit -m "feat(doc)!: the motion home no longer shows the components showcase" -- <paths>`

### Task 3/5: "What it does" in six blocks (group 2)

Implementer: Haiku, effort `max`. Review: Sonnet. Brief carries the designer's D1 to D3.

**Files:**

- Create: `apps/doc/src/lib/motion-home.ts`, `apps/doc/src/components/motion/root/HomeBlock.astro`,
  `apps/doc/src/components/motion/root/define-sample.ts` (block 1/6's sample), `apps/doc/tests/motion-home.test.mjs`
- Modify: `apps/doc/src/components/motion/root/Gallery.astro` (renders the blocks; keeps `data-gallery` on the section and
  its lazy import of `previews.ts`), `apps/doc/src/components/motion/root/NeedCard.astro` (two props)
- Test: `apps/doc/tests/animation.browser.test.mjs` (the first test's gallery part; the 375 px lists)

**Interfaces:**

- Consumes: `MOTION_NEEDS` (slugs only; Task 1/5's labels are not needed here).
- Produces, in `motion-home.ts` (imports `./motion-nav.ts` with its extension, as `motion-nav.ts` imports `./motion-facts.ts`):

```ts
/** One card of a block: a need of MOTION_NEEDS, with the block's own title for it and whether its API chip shows. */
export type HomeCard = { slug: string; title?: string; chip: boolean };
/** A link under a block, to a page of MOTION_NEEDS. */
export type HomeLink = { slug: string };
export type HomeBlock = {
  id: 'motion' | 'trigger' | 'target' | 'control' | 'tools' | 'system';
  title: string;
  sentence: string;
  cards: readonly HomeCard[];
  links: readonly HomeLink[];
};
export const MOTION_HOME_LEAD: string;
export const MOTION_HOME_BLOCKS: readonly HomeBlock[];
```

Values verbatim from Global Constraints. `chip`: `false` in blocks 2/6 and 3/6, `true` in 4/6 and 5/6, block 6/6 per
D3. `links`: `[{ slug: 'presets' }]` on block 1/6, `[]` elsewhere unless D1 adds some. Block 2/6's card titles are set
with `title`; no other card has one.

- `NeedCard` gains `title?: string` (shown instead of `need.need ?? need.label`) and `chip?: boolean` (default `true`;
  `false` renders no `.card-api`). Every other behaviour of the card (its preview markup, `data-need-card`, `DocLink`) is
  unchanged.
- `HomeBlock.astro` props: `{ block: HomeBlock; position: number; total: number }` and a default slot (block 1/6's
  sample); heading level, layout and the sample's presentation per D1 and D2.
- `define-sample.ts`: a real module, a `defineMotion` call that compiles against today's `@udixio/motion` (the
  throwaway-tsconfig sweep checks it), content per D2; `Gallery.astro` reads it with `?raw` and renders it with the
  site's code block as D2 says. It is the one static sample; it has no live result.

- [ ] **Step 1: Write the failing tests.** `tests/motion-home.test.mjs`:
      `six blocks, in the spec's order, with its titles and sentences` (deep-equal on `id`, `title`, `sentence`);
      `eighteen cards, each a need with a scene, each once` — the flat list of card slugs has length 18, no duplicate,
      every slug is a `MOTION_NEEDS` slug with a `scene`, and the set equals `MOTION_NEEDS.filter(n => n.scene)`;
      `no card or link for a page that does not exist` — no slug `scroll`, `page-transitions`, `write-your-own`,
      `handle`, `hover-press`;
      `block 2/6 titles its cards by trigger` — `['Presence', 'On change', 'In view', 'With the scroll', 'Loop']`;
      `no chip in blocks 2/6 and 3/6`;
      `the presets count of block 1/6 is the package's` — the count of `/^export const \w+: MotionRef</gm` in
      `packages/motion/src/presets.ts` (13 today), written as its English word (a 1..20 table in the test), appears in
      block 1/6's sentence;
      `no block promises an uncoded trigger` — no title or sentence matches `/\b(hover|focus|press)\b/i`.
      In `animation.browser.test.mjs`, the first test: the gallery checks become, per block in order, the `h3` (or D1's
      heading) text equals `title`, the card slugs equal `cards`, each card's `.card-name` equals `title ?? need.need ??
    need.label`, `.card-api` is present exactly when `chip`, each `href` is `motionUrl(slug)`; the text of
      `[data-gallery]` does not match `/\b(hover|focus|press)\b/i`; then `localStorage` set to `svelte`, reload: every
      card `href` starts with `/svelte/motion/`. Rename the test "the root page: a hero, the principle, six blocks of
      cards, and the facts". Add `/motion/` to the 375 px "no horizontal scroll" and "no code block … is cut" path lists
      if it is not there.
- [ ] **Step 2: Run** `node --test tests/motion-home.test.mjs`: FAIL (no module).
- [ ] **Step 3: Implement** the Interfaces, the layout per D1 to D3. The blocks and their cards keep `data-motion="rise"`
      as the gallery's heading and cards have it today.
- [ ] **Step 4: Run** the unit test: PASS. One dev server, Chromium:
      `node --test --test-name-pattern="root page" tests/animation.browser.test.mjs` against it: the first test, "plays by
      itself", "under reduced motion the root page is still" and "a card's preview plays again" PASS. Stop the server.
- [ ] **Step 5: Look** (Playwright screenshots, read them): `/motion/` at 1280 and 375 px, light and dark. Compare with D1;
      report any gap rather than inventing a fix.
- [ ] **Step 6: Commit** `git commit -m "feat(doc): the motion home answers what moves, when, on what, and how to steer it" -- <paths>`

### Task 4/5: one word per thing in the hero and the principle (group 3)

Implementer: Haiku, effort `high`. Review: Sonnet. Brief carries the designer's D4 to D6.

**Files:**

- Modify: `apps/doc/src/components/motion/root/Hero.astro` (the H1 and the line under it per D4, "Material 3 tokens"; the
  stage's caption), `apps/doc/src/pages/motion/index.astro` (`description`, D6), `apps/doc/src/lib/motion-nav.ts` (the
  Overview need's `summary`, D6), `apps/doc/src/examples/{react,angular,svelte}/motion-principle.{tsx,ts,svelte}` and
  `apps/doc/src/examples/html/motion-principle.html`
- Test: `apps/doc/tests/animation.browser.test.mjs` (the first test's H1 and caption; "one framework for the page",
  line ~278, `udxMotion="pop"`)

**Interfaces:**

- Consumes: Task 1/5's `motion-nav.ts`; Task 3/5's `animation.browser.test.mjs`.
- The principle's four examples attach the preset of D5 by name and define no motion of their own: no `defineMotion`, no
  `verb` on screen; they import the preset entry as `src/examples/<framework>/motion-presets.*` does. Same behaviour:
  Toggle plays the exit, then the entry.
- The caption names the stage's parts with one word each: "shared element" (link `shared-elements`) and "presence" for
  the when (link `presence`), "enters" and "leaves" for what happens; no emphasis or press link (D4 gives the sentence).

- [ ] **Step 1: Write the failing tests** in `animation.browser.test.mjs`: the H1 equals D4's string and contains
      "Material 3 tokens"; the caption's links are `[motionUrl('shared-elements'), motionUrl('presence')]`; the caption's
      text does not match `/\b(press|emphasis|appear|pop|hover|focus)\b/i`; each framework's principle panel does not
      match `/defineMotion|verb:|pop/` and contains the D5 preset name (replacing the `udxMotion="pop"` assertion).
- [ ] **Step 2: Run** them on a dev server, Chromium, `--test-name-pattern="root page|one framework|principle"`: FAIL.
- [ ] **Step 3: Implement.** Keep the page's other descriptions and comments true: `index.astro`'s comment no longer
      names the components; `Principle.astro`'s TSDoc unchanged unless it names `pop`.
- [ ] **Step 4: Run** the same pattern: PASS, including "the principle's <framework> example is the file shown, and it
      runs" for the four frameworks and "before its islands hydrate, the principle shows the stored framework". Stop the
      server. `grep -rn "Material 3 motion\|Material&nbsp;3 motion\|'pop'" apps/doc/src apps/doc/tests` finds nothing.
- [ ] **Step 5: Commit** `git commit -m "docs(motion): the home names each thing once, and promises Material 3 tokens" -- <paths>`

### Task 5/5: verification (controller)

- [ ] **Step 1: Build** (load < 4, more than 3 GB free): `cd apps/doc && node scripts/motion-api.mjs --check && time npx astro build`;
      `npx nx build @udixio/mcp --skip-sync` (its snapshot of `doc-src` drops the showcase files).
- [ ] **Step 2: Unit:** `node --test tests/motion-nav.test.mjs tests/motion-home.test.mjs tests/built-site.test.mjs tests/framework-url.test.mjs`: PASS.
- [ ] **Step 3: Suites, one file at a time, Chromium, then Firefox, then WebKit**, on the built site
      (`python3 -m http.server 4322 --bind 127.0.0.1` in `.vercel/output/static`):
      `MOTION_BROWSERS=<e> MOTION_DOC_URL=http://localhost:4322 node --test --test-concurrency=1 tests/<file>` for
      `animation`, `motion`, `framework-urls`, `framework-tabs`, `pages`, `motion-page-claims`, `recipes`. Known flakes
      as in the early track's Task 9/9.
- [ ] **Step 4: Look** (Playwright screenshots, read them): `/motion/` at 1280 and 375 px, light and dark, and under
      reduced motion; the side panel open on `/react/motion/emphasis/guide` (On change marked, Triggers open) and on a
      recipe page; the phone drawer on `/motion/`. Criticise against D1 and D7 before handing back: ten section headings,
      three of them with one page.
- [ ] **Step 5: Sweeps:** `grep -rnE "Values, gestures, sequences|already move with it|data-components-showcase|press emphasis|scrollTo\(|page-transitions" apps/doc/src apps/doc/tests packages/mcp/dist/bundled`
      finds nothing but `window.scrollTo`; the throwaway-tsconfig sweep adds no error; `grep -rn "<button\|<input\|<select\|role=\"tab\"" apps/doc/src/components/motion/root`
      lists only justified native elements.
- [ ] **Step 6: Report** to the step 3/8 controller the two notes of "Where this plan sits" (Triggers for `hover-press`;
      block 1/6's sample and the principle examples in the pages that teach the writing).

---

## Questions for the designer (Fable, before Tasks 3/5 and 4/5)

Context to send: spec §6.1 and §6.2, the amendment §4, this plan's Global Constraints, `root/Gallery.astro`,
`root/NeedCard.astro`, `root/Hero.astro`, `root/Principle.astro`, the page's container breakpoints
(`@container/motion-root`, 560, 600, 680, 800, 820 px), and the rule that nothing uncoded is shown.

- **D1. Block layout.** Heading level and style of a block title (an `h3` under "What it does"?), whether the position
  (1/6…) shows, the card grid per block (today one grid: 2, 3, 4 columns at 0, 600, 800 px), how a one-card block (4/6)
  and the no-card block (1/6) sit, where block links go and how they look, and whether blocks pair in two columns.
- **D2. Block 1/6's sample.** Its code (a `defineMotion` that compiles today, so it carries `verb`; or does the block
  avoid a `verb` on screen, and how), its presentation (the site's static code block, no framework tabs: it is the same
  in every framework), and the Presets link's wording.
- **D3. Chips in block 6/6.** `tokens` carries `defineMotion · timing` today; the spec removes `defineMotion · <word>`
  chips from blocks 2/6 and 3/6 only. Keep it, or drop it as well?
- **D4. Hero wording.** The H1 with "Material 3 tokens" instead of "Material 3 motion", the line under it ("Define a
  motion once and attach it by name…": keep?), and the caption's sentence (shared element, presence, enters, leaves; no
  press).
- **D5. The principle's preset.** Recommended: `fade` (an entry preset today that keeps its name in the ten, spec §2.5;
  `scale` and `slide` are renamed or merged at step 3/8).
- **D6. Copy of the home's metadata:** `index.astro`'s `description` and the Overview need's `summary` ("What
  @udixio/motion does, need by need…"), both now organised by the six questions.
- **D7. The side panel with ten sections**, three of them holding one page (Motions, Control, Interactions) until steps
  3/8 to 7/8 fill them: acceptable as rendered by today's `Sidebar.tsx`, or a change (its own task, after early-track
  Task 7/9)?

## Questions for Joël

- **J1. Write your own and The handle.** The model spec §6.2 splits both out at the regrouping; this plan, following the
  control session, adds no page that does not exist yet, so Motions and Control hold one page each for now. Recommended:
  keep it so, and write "Write your own" with step 3/8's pages that teach the writing, "The handle" with step 6/8 (when
  the handle gains speed and progress), so neither page is written twice.
- **J2. Labels are H1s.** The menu labels "On change", "In view", "Scroll", "Animate now" are also those pages' H1 and
  title ("On change in React · Motion"); the slugs stay. Recommended: yes, one word per thing; the old words remain as
  subtitles ("Draw attention") and in the API until step 3/8.
