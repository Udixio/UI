# The /motion home and the Animation menu, regrouped: design decisions

Answers to D1 to D7 and J1, J2 of `docs/superpowers/plans/2026-11-28-motion-home-menu-regroup.md`. Decisions only; the
model spec (`2026-11-28-motion-model-design.md` §6) keeps the blocks' titles, sentences and cards. Copy between quotes is
exact. Everything is Tailwind classes and theme tokens, breakpoints are container queries on `@container/motion-root`,
and nothing here adds an animation: the marks are the existing `data-motion="rise"`.

## D1. Block layout

**The idea:** six rows, the question on the left, its answer on the right. A left column that holds the title anchors
the row, so a row of cards that does not fill its grid reads as the end of a list, not as a hole: the one-card block
(4/6) and the block with a code sample instead of cards (1/6) sit like the others.

**Section head** (unchanged place and style): `h2` "What it does" (`text-headline-medium text-on-surface`), then the lead
"A motion, a trigger, a target; then how to steer it, the tools beside it, and the system." (`text-body-large
text-on-surface-variant`, `max-w-[62ch]`). The sentence that counted the needs is gone. The head keeps
`data-motion="rise"`.

**A block** (`HomeBlock.astro`) is a `<section aria-labelledby="home-block-<id>" data-home-block="<id>">`:

- A hairline above each block, the first included: `border-t border-outline-variant pt-8` (`pt-6` at
  `@max-[560px]`). It is the hairline of the hero's facts.
- Blocks are spaced `gap-10` (`gap-8` at `@max-[560px]`); the section head sits `gap-8` above the first block. The
  `<section data-gallery>` becomes `grid gap-8` holding the head and a `<div class="grid gap-10 …">` of blocks.
- **Head of the block** (`data-motion="rise"`, `grid content-start gap-2`):
  - the title, an `h3 id="home-block-<id>"`: `m-0 text-title-large text-on-surface text-balance`. Its text is exactly
    `block.title`, in one style (no split of the question and its word).
  - the sentence, a `p`: `m-0 max-w-[44ch] text-body-medium text-pretty text-on-surface-variant`.
  - the links, when the block has some: a `<p class="m-0 mt-1 flex flex-wrap gap-x-4 gap-y-1">` of `DocLink`s
    (`data-framework-link` as the cards), each with the class of `Choice.astro`'s link: `text-label-large text-primary
underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2
focus-visible:outline-on-surface`. **The link text is the page's label** in `MOTION_NEEDS` ("Presets"), so
    `HomeLink` stays `{ slug }` and a link added later ("Write your own", "The handle") needs no copy.
- **The position is not shown** (no "1/6", no number): the questions are the order.
- **Body of the block:** the cards, a `<ul class="m-0 grid list-none gap-3 p-0 …">` whose `li` are
  `grid min-w-0` with `data-motion="rise"` as today; or the default slot (block 1/6's sample) in a `<div class="min-w-0"
data-motion="rise">`. A block renders the `ul` only when it has cards.

**Grid, by container width:**

| Container        | Block                                                 | Cards grid |
| ---------------- | ----------------------------------------------------- | ---------- |
| below 600 px     | one column: head, then body (`gap-5`)                 | 2 columns  |
| 600 to 819 px    | one column: head, then body (`gap-5`)                 | 3 columns  |
| 820 to 899 px    | `grid-cols-[15rem_minmax(0,1fr)] items-start gap-x-8` | 2 columns  |
| 900 px and wider | the same two columns                                  | 3 columns  |

So: `grid-cols-2 @min-[600px]/motion-root:grid-cols-3 @min-[820px]/motion-root:grid-cols-2
@min-[900px]/motion-root:grid-cols-3` on the `ul`. Every block uses the same grid; no block pairs with another and no
block has its own column count. The old four-column grid is gone: beside the head column a card would fall under
160 px, where it hides its chip and shrinks its preview.

**What to see at 1280 px** (container about 927 px): six rows; left a 240 px column with title, sentence and link; right
three cards a row. Rows of cards: 1/6 the code sample across the right column; 2/6 and 3/6 three then two; 4/6 one
card in the first cell; 5/6 three then one; 6/6 three. **At 375 px:** each block is its head, then cards two a row
(2/6 and 3/6: two, two, one; 4/6: one card, half the width, at the left); the sample takes the full width and wraps
its long lines as every code block of the site does. No horizontal scroll.

**Light and dark:** only tokens (`outline-variant`, `on-surface`, `on-surface-variant`, `primary`, the cards' own
`surface-container-low`); nothing is set per mode. `NeedCard` keeps its look; only `title` and `chip` are new.

## D2. Block 1/6's sample

`root/define-sample.ts`, verbatim (it compiles today, so it carries `verb`; step 3/8 removes that line with the other
pages that teach the writing):

```ts
import { defineMotion } from '@udixio/motion';

defineMotion('toast-enter', {
  verb: 'appear',
  keyframes: [
    { opacity: 0, y: 24 },
    { opacity: 1, y: 0 },
  ],
  timing: 'spring.fast.spatial',
});
```

- It shows the three things the block's sentence names: keyframes, a timing, a name. No comment in the code, no
  caption, no sentence about `verb`.
- **Presentation:** the site's static code block, `<Code data-code={sample} data-language="ts" />` from
  `@/components/Code.astro` (as `_choosing-an-api.astro` does), with its copy button, no framework tabs, no result. Its
  wrapper removes the block's own top margin so the code's top edge aligns with the title's (`[&>*]:mt-0` on the slot's
  `div`; if the margin sits elsewhere, report it instead of adding CSS).
- **The link:** in the block's head, under the sentence, the text "Presets", to `/motion/presets` (D1's link style).
  Nothing else: the sentence already says "thirteen come ready-made".

## D3. Chips in block 6/6

No chip in block 6/6: `chip: false` on `tokens`, `accessibility` and `per-breakpoint`. `defineMotion · timing` is the
last `defineMotion · <word>` chip of the page and the only chip of its row. Chips remain where the function is the
tool: `defineSequence` (4/6), `animateStyle`, `defineValue`, `defineValue · format`, `defineGesture` (5/6).

## D4. Hero wording

- **H1:** "Motion on Material&nbsp;3 tokens, the same in every framework." (a non-breaking space between "Material" and
  "3", as today; same classes).
- **Line under it:** "Define a motion once and attach it by name, to any element. The runtime takes care of
  reduced&nbsp;motion." The clause "and of focus during exits" leaves: the hero names no focus at all, so nothing reads
  as a focus trigger; the Presence and Accessibility pages keep the fact.
- **Caption of the stage:** "The bar grows into the player as a [shared element](/motion/shared-elements). Its cover,
  title and controls enter and leave with [presence](/motion/presence)." Two links, in that order. Play still dips in
  the scene; the caption no longer names it.
- The kicker, the install command, the "No Udixio component needed" line, the Getting started link and the three facts
  are unchanged.

## D5. The principle's preset

`fade`. The four `motion-principle.*` examples import the presets entry (`import '@udixio/motion/presets';`, as
`motion-presets.*` does), define nothing, and attach `fade` by name: `<Motion as="p" key="note" name="fade">`,
`udxMotion="fade"`, `motion('fade')`, `data-motion="fade"`. Same text ("Saved to your library"), same Toggle.

Since no tab shows a definition any more, the principle's sentence changes (add `root/Principle.astro` to Task 4/5's
files): the `h2` stays "One example, four frameworks"; the line under it becomes "The motion has the same name in every
tab; only the lines that attach it speak your framework." Grep the tests for the old sentence.

## D6. The home's metadata

- **`index.astro` `description`:** "@udixio/motion: motion on Material 3 tokens, the same in HTML, React, Angular and
  Svelte. What moves, when, on what and how to steer it, each with a live example."
- **Overview `summary`** (`motion-nav.ts`): "What @udixio/motion does, question by question: what moves, when, on
  what, how to steer it, the tools beside it and the system."

## D7. The side panel

Ten sections as `Sidebar.tsx` renders them today: **no change to `Navigation.tsx` or `Sidebar.tsx`**, no extra task.
A section costs one small label and one divider; the three one-page sections (Motions, Control, Interactions) add about
three such rows to a panel that already scrolls, and they fill at steps 3/8, 6/8 and 7/8. Folding them into a
neighbour now would show a menu Joël did not validate and be undone three times.

Task 5/5 looks at one thing and reports it, without fixing it: on `/motion/limits` at 1280 x 900, whether the marked
page is inside the panel's visible part on load. If it is not, that is a `Sidebar.tsx` task of its own.

## J1 and J2 (confirmed by the control session)

- **J1.** No "Write your own" and no "The handle" page, menu entry or home link now. "Write your own" ships with step
  3/8 and joins block 1/6's links after "Presets"; "The handle" ships with step 6/8 and becomes block 4/6's link. Both
  only add a `{ slug }` to `links`.
- **J2.** The menu labels "On change", "In view", "Scroll" and "Animate now" are those pages' H1 and the head of their
  title; the slugs stay; the `need` stays the subtitle. On the home, block 2/6's cards use the block's own titles
  ("With the scroll" for the Scroll page); the cards of the other blocks keep their `need`.
