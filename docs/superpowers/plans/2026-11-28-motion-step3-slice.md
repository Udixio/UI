# Motion step 3/8, the end-to-end slice: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add, beside the old model and removing nothing, one end-to-end path of the new motion model (a motion without a
verb, the registry of claims, the triggers `presence`, `hover`, `press`, `scroll` and `defineTrigger`, `attach()`) in HTML
and in React, reduced motion included, with its measures, its facts in the docs and a demo page for the maintainer.

**Architecture:** New modules of `packages/motion/src`, one responsibility each, that never import `bind.ts`, `play.ts`,
`slots.ts` or `named-motion.ts` (the `core-new` size line tests it). The core holds the reader, the timing plan, the reduced
forms, the player, the registry of claims, `attach` and the presence; two new lazy entries hold the states (`states`) and the
scroll driver (`drivers`). Old bindings claim their channels through a bridge that costs the old chunks nothing. The order is
the spec's twelve blocks and three gates: the spike (gate 1/3) before the registry, the demo (gate 2/3) before the spring and
the scale are settled, and a last batch (gate 3/3) of tasks that each wait for one of Joël's answers.

**Tech Stack:** TypeScript 5.9; WAAPI and scroll-driven animations; Vite library build; Vitest (`unit` on Node, `browser` with
Playwright in Chromium, Firefox, WebKit); `size-limit`; `node --test` (Node 24); React 19 (`@udixio/ui-react`, Vitest on
jsdom); Svelte 5; Astro 7 (`apps/doc`) with `@udixio/ui-react` islands; Playwright for the doc's `*.browser.test.mjs` suites.

**Spec:** `docs/superpowers/specs/2026-11-28-motion-step3-slice-design.md` (revision 2, committed: "the spec"). It implements a
slice of `docs/superpowers/specs/2026-11-28-motion-model-design.md` (revision 2: "the model"). Review 12:
`.superpowers/sdd/2026-11-17-animation-docs/review12-step3-components-30.md`. Executors read the spec section a task names;
this plan does not repeat its rules, it fixes the files, names, signatures, tests and order.

## Global Constraints

- Repository rules: `CLAUDE.md`, `apps/doc/AGENTS.md`, `.superpowers/sdd/2026-11-17-animation-docs/rules.md` and
  `parallel-rules.md`. English in every file. Short TSDoc on every export, no comment that narrates history.
- Never `git stash`, `checkout -- <file>`, `restore`, `reset`, `clean`; never switch branch. Commit with
  `git commit -m "<conventional message>" -- <explicit paths>` (new files staged first with `git add <path>`, moves with
  `git mv`), the message ending with the session's Co-Authored-By line. No push, no `pnpm install`, no new dependency.
- **Step 3/8 only adds** (model §7.7). Removed nothing, renamed nothing public. The existing unit and browser suites of
  `packages/motion` and the React, Angular and Svelte motion suites stay green **unmodified** (U10, X6) until Task 35/35 ·
  part 1/4 (the scale), which changes only the assertions spec §5.3 lists.
- **The rule of spec §2**: no new module imports `bind.ts`, `play.ts`, `slots.ts` (its kinds) or `named-motion.ts`. What a
  new module needs from them is moved out (`resolveWaapiTiming` to `timing-plan.ts`, `MotionSource` to `define-motion.ts`,
  the presence state to `presence-state.ts`) and re-exported from the old place.
- Values copied from the spec, verbatim: `CLAIM_LEVELS = { kept: 2, driver: 3, state: 4, hover: 5, focus: 6, press: 7,
event: 8, presence: 9 }`; default timings `spring.default.*` for an event, `spring.fast.*` for a state, `spring.default.effects`
  for every property of an exit, none for `scroll`; reduced defaults `presence` `fade`, `hover` and `press` `end`, `scroll`
  `none`, manual `end`, a defined event `none`, state `end`, driver `none`; spike tolerances 0.5 px and 0.005 of a scale;
  "no jump" candidate 1.5 times the largest move of the two frames before, or 0.004 of a scale (1 px), whichever is larger.
- The `core` size line: 25 kB today. **At the first measure above 25 kB** (any group's measure), the controller raises its
  limit to 27 kB (spec §6.2's coexistence figure) and writes the figure and the task in `progress.md` (review 13, I6): no
  size-limit line is ever left red. Task 28/35 measures again and puts the figure in the step's report. Above 27 kB: spec §6.3
  (one lever, then the designer). No planner or implementer raises 27 kB.
- **Facts ship with the code** (spec §8, first table): a task that adds an export adds its TSDoc in the same commit; its README
  line, manifest field and API group are written in Task 31/35 from the TSDoc, before gate 2/3. Pages that teach the writing
  (spec §8, second table) wait for Joël's answers (Task 35/35 · part 3/4).
- Implementers are Haiku subagents (effort per task, `high` by default, `max` where marked), each under 500k tokens of
  context; a task handed back above it goes, for its fix rounds, to a fresh implementer with the brief, the report and the
  findings. Reviews: Sonnet, effort `high`, for the tasks that carry logic or an interface (marked "Review: Sonnet"). Design
  questions found by anyone go back to the Fable designer through the controller.
- **Implementers run only targeted checks**: the unit files of their task, `npx tsc --noEmit -p tsconfig.spec.json`, and at
  most one browser file in one engine (`MOTION_BROWSERS=chromium`) in a serial task, none in a parallel one. **The controller**
  runs builds, the three-engine browser runs (one file at a time, engines in series), `size-limit`, the doc build and the doc
  suites, after each group, with the recipe of Task 28/35 · Step 1 (from HANDOFF § Verification recipe). Check
  `cut -d' ' -f1 /proc/loadavg` first: wait while above 6 (a doc build: below 4 and 3 GB free).
- **Shared files**, edited by one task at a time; in a parallel group the step that edits them (marked **[shared]**) waits for
  the other task's commit: `packages/motion/src/index.ts`, `src/bind.ts`, `src/feature-loader.ts`, `src/define-motion.ts`,
  `src/manifest.ts`, `src/claims.ts`, `package.json` (both export blocks), `vite.config.mts`, `.size-limit.json`,
  `size-report.json`, `motion-manifest.json`, `scripts/generate-motion-manifest.mjs`, `scripts/package-exports.test.mjs`,
  `README.md`, `tsconfig.lib.json`; in `apps/doc`: `src/lib/motion-nav.ts`, `scripts/motion-api.groups.mjs`,
  `src/data/motion-api.json`.
- Browser tests read values with `getComputedStyle` in `requestAnimationFrame` callbacks; pointer and keyboard input through
  `userEvent` of `vitest/browser` (as `gesture-binding.browser.spec.ts` does), never dispatched by hand. "At about 40 %" is
  reached with the scale at 4 and a crossing of the 40 % value, or a paused animation and its `currentTime`: never a timer.
- Every "no jump" assertion calls `expectNoJump` (Task 6/35); no test writes its own threshold.

### Brief block (paste into every implementer brief)

> - Tests first: write the failing test, run it, see it fail for the right reason, then implement. Test behaviour through the
>   public interface (`attach`, `claimsOf`, `defineMotion`, the DOM, the events); replace with mocks or spies only what is
>   outside the repository (the clock, the network). Never mock a module of the project. The existing tests are not edited.
> - Every control in `apps/doc` (pages, examples, fixtures) is a Udixio component (`Button`, `IconButton`, `Switch`,
>   `Slider`, `Tabs`, `Chips`, `Card`…). A native element only in the HTML example and for the element that is itself the
>   animation. Before reporting, grep `<button|<input|<select|role="tab"` in the files you touched and justify each native one.
> - Style with Tailwind classes and the Udixio theme tokens (`bg-surface-container-low`, `text-on-surface`, `rounded-xl`…):
>   no `.css` file, no `<style>` block, no hard-coded colour, radius, spacing or duration; only what has no utility goes in a
>   Tailwind v4 `@utility` that reads the theme's variables.
> - Animation: `@udixio/motion` only, through WAAPI as the spec says; no other engine, no new mechanism without asking.
> - Nothing type-checks `apps/doc`: after a change of a public name, run the throwaway-tsconfig sweep of `apps/doc/AGENTS.md`
>   (outside the repository, no `references`, `paths` mapping `@udixio/*` to each package's `src/index.ts` and `@/*` to
>   `./src/*`, `src/examples/angular/**` excluded; ignore `astro:content` and `import.meta.glob` errors) and report what it
>   finds in your files.
> - Short TSDoc on every export you add. Format the files you changed with `pnpm exec prettier --write <files>` (not `pnpx`).
> - Run only the checks your task names. Never `nx build`, `astro build`, a whole suite or a second engine: the controller does.
> - Commit only your paths: `git commit -m "…" -- <paths>`. Never stash, checkout, restore, reset, clean.

## Review Focus

1. **An element whose stylesheet transforms it already** (Tailwind's `-translate-x-1/2`, a rest `scale: 1 0.5`, a third
   `translate` value): a hover on the other axis must keep that axis to the pixel, during the hold and after it, and the
   return must leave nothing inline. Pinned in Task 3/35 (U2, the parse of one, two, three values and `none`) and Task 19/35
   (A7, plus a case with `translate: 0 0 10px`).
2. **A CSS transition on the held property** (a card with Tailwind's `transition` for its colours): no frame replays from rest.
   Pinned by the spike (S 10/10), then Task 19/35 (A8) with `transition: all` as well as the utility.
3. **A re-render storm in React** (a new function or object literal at each render, `present` toggled twice in one tick): the
   play in progress is untouched and the events stay balanced. Pinned in Task 25/35 (O8) and Task 12/35 (an `update` with a
   new but equal inline spec object creates nothing; `setPresent(false)` then `setPresent(true)` in one task resolves the
   first promise `cancelled` and plays one entry).
4. **An element removed from the DOM while a claim holds or a return runs** (a list item deleted on hover, a dialog closed
   during its entry): no animation, listener or inline value stays on the detached node, and no error. Pinned in Task 12/35
   (`detach()` after `remove()` is a no-op that throws nothing) and Task 22/35 (the scanner detaches a removed element: its
   `getAnimations()` is empty and a later `pointerenter` dispatched on it creates nothing).
5. **A motion name defined late or never, under a trigger whose module also loads** (`data-motion-hover="card-lift"` defined
   after the scanner connects, while `states` is still loading): the element is never written before both have landed, then
   behaves as if both were there. Pinned in Task 15/35 (a hover whose name is defined after the module lands, and the
   reverse order) and Task 12/35 (F5).

## Mismatches between the spec and the code (2026-11-28)

Each is resolved here only where the code leaves one reasonable choice; the others are questions (end of plan).

| #   | Spec says                                                                                                                                                 | Code says                                                                                                                                                                                                                  | Plan                                                                                                                                                                                                                                                                                   |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M1  | §8: "A new page in Triggers" (`hover-press`), "Scroll (`_scrub.astro`)".                                                                                  | `apps/doc/src/lib/motion-nav.ts` has no Triggers section: `Start · Recipes · Motions · Values, gestures, sequences · Functions · System · Reference`. The model's §6.2 regrouping ("right after step 2/8") has not landed. | Settled (spec §8): `Motions`, after Emphasis, until the menu is regrouped (Task 35/35 · part 3/4).                                                                                                                                                                                     |
| M2  | §2: `scroll-progress.ts` is the measure "moved out of `value-binding.ts`".                                                                                | `value-binding.ts` (lines 368 to 384) measures the **document's** scroll only: no container, no element, no range.                                                                                                         | The move covers the document measure; the element and container measure over a range is new code (Task 17/35 gives its algorithm). `value-binding.ts` then calls `documentScrollProgress`.                                                                                             |
| M3  | §2, §3.11: React `hooks/useMotion.ts`; §7.2 "React vitest" for A3, F3, F4, O8, X1, X4.                                                                    | The hook is `packages/ui-react/src/lib/hooks/useMotion.ts`; React's Vitest runs on **jsdom** (`vite.config.ts` `environment: 'jsdom'`): no WAAPI, no layout, no frames.                                                    | React wiring and types are tested on jsdom (Task 24/35); the React browser cases run on an unlisted test fixture of the doc driven by Playwright in three engines, as `components-box.browser.test.mjs` does (Task 25/35). No test infrastructure is added to `ui-react`.              |
| M4  | §3.1 `AxisBase` has `x, y, scaleX, scaleY`; the text says "a third value (z) is carried as it is".                                                        | No field holds z.                                                                                                                                                                                                          | `AxisBase` gains `readonly z?: string` and `readonly scaleZ?: number`, written back as the third value when present.                                                                                                                                                                   |
| M5  | §3.6: the phase is read through `presencePhaseOf` in five files (`layout/flush.ts`, `box.ts`, `shared-registry.ts`, `layout/scope.ts`, `scope-entry.ts`). | Also `layout/types.ts`: `IGNORED_ATTRIBUTES = new Set(['style', 'data-motion-presence', 'inert'])` (the layout observer ignores the mark). `box.ts` and `scope-entry.ts` name the attribute in TSDoc only.                 | `IGNORED_ATTRIBUTES` gains `data-motion-phase` (Task 21/35). `box.ts` and `scope-entry.ts`: TSDoc names both marks; `scope-entry.ts`'s `revert` removes both (Task 23/35). The adapters' reads (React `Motion.tsx`, Angular `motion.ts`, Svelte attachment) are the old path and stay. |
| M6  | §2: `feature-loader.ts` "gains `loadStates` / `statesModule` and `loadDrivers` / `driversModule`".                                                        | Each of the five loaders is three functions: `provideX`, `xModule`, `loadX`.                                                                                                                                               | `provideStates` and `provideDrivers` are added too.                                                                                                                                                                                                                                    |
| M7  | §3.1: `MotionSource` is defined; §2 forbids new modules to import `bind.ts`.                                                                              | `MotionSource` is exported by `bind.ts` (line 34).                                                                                                                                                                         | It moves to `define-motion.ts`; `bind.ts` re-exports it (Task 5/35).                                                                                                                                                                                                                   |
| M8  | §3.1: `resolveWaapiTiming` "is the one thing of `play.ts` the new player needs".                                                                          | It calls `waapiSupport` (local to `play.ts`), `routeTimingWithEvaluator` and `probeWaapiEasing`, with its cache `waapiTimings`.                                                                                            | They move together to `timing-plan.ts` (Task 4/35).                                                                                                                                                                                                                                    |
| M9  | §3.1: `MotionSpec = LegacySpec \| VerblessSpec`.                                                                                                          | `MotionSpec = MotionDocument['spec']` is the parameter type of `playMotion`, `bind.ts`, `scope-entry.ts`, `presets.ts`, which read `spec.verb`.                                                                            | `LegacySpec` is exported; old code that reads a verb takes `LegacySpec`; `specOf` in `bind.ts` throws on a verbless spec (Task 5/35). Public `MotionSpec` widens as the spec says.                                                                                                     |
| M10 | §7 "no jump" helper "in one test utility"; §4.3 the spike in `src/spike/`.                                                                                | `tsconfig.lib.json` declares every non-spec `src/**/*.ts`; `src/testing/` is the public `testing` entry (1.54 of 1.7 kB).                                                                                                  | The helper lives in `src/test-utils/no-jump.ts`, excluded in `tsconfig.lib.json` (Task 6/35); not exported. The spike file is a `.browser.spec.ts`: already excluded.                                                                                                                  |
| M11 | §9: "whether `Card` animates its own `scale` was not checked".                                                                                            | `packages/core/src/lib/behaviors/card.behavior.ts` and `styles/card.style.ts` name neither `scale` nor `translate`.                                                                                                        | One React example of 9.1 may use `<Motion as={Card}>` (Task 32/35 re-reads both files before it does).                                                                                                                                                                                 |
| M12 | §6.1: `core` "without the six lazy chunks".                                                                                                               | The `ignore` list of the `core` line holds six: `layout, value, sequence, gesture, text, continuous`.                                                                                                                      | `./states.js` and `./drivers.js` are added to it (Task 15/35, Task 17/35).                                                                                                                                                                                                             |
| M13 | §3.4 `hold(source, frames, plan)`, §3.2 a driver's `timeline?()`.                                                                                         | `scroll.ts` types `ViewTimeline` itself (`ViewTimelineConstructor`, `supportsViewTimeline`); it imports `play.js` and `amplitude.js`.                                                                                      | The driver does not import `scroll.ts` (it would pull `play.ts`): `triggers/scroll.ts` types `ViewTimeline` and `ScrollTimeline` itself.                                                                                                                                               |
| M14 | §3.11: `useMotion`'s object form "is told from a source by its shape: a string, an array, or an object with `keyframes` or `spec`".                       | A legacy spec without keyframes exists: `{ verb: 'layout' }` (`reflow`).                                                                                                                                                   | An object with `verb` is today's form too (Task 24/35).                                                                                                                                                                                                                                |

---

## Groups, gates and order

| Group | Tasks (block of spec §10)                                                                                                       | Runs                                                         | Why not more parallel                                                                                                                                                                                                          |
| ----- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0     | 1/35 (block 1/12)                                                                                                               | controller                                                   | precondition of all code                                                                                                                                                                                                       |
| 1     | 2/35 (block 2/12, gate 1/3) ∥ 6/35 (calibration, block 4/12) ∥ [3/35 → 4/35 → 5/35] (block 3/12)                                | three lanes                                                  | 3, 4, 5 share `index.ts` and build on each other's types; 2 and 6 own new files only                                                                                                                                           |
| —     | **Gate 1/3**: the controller's verdict on the spike                                                                             | controller                                                   | `claims.ts` is written on it                                                                                                                                                                                                   |
| 2     | 7/35 → 8/35 → 9/35 → 10/35 (block 4/12)                                                                                         | serial                                                       | the registry uses the player; 8, 9, 10 all write `claims.ts`                                                                                                                                                                   |
| 3     | 11/35 → 12/35 → 13/35 → 14/35 (block 5/12)                                                                                      | serial                                                       | `attach` resolves triggers; 12 and 13 both write `attach.ts`; the presence plays through `attach`; 11 edits `bind.ts`                                                                                                          |
| 4     | 15/35 → 17/35 (mechanics), then 16/35 ∥ 18/35 (logic), then 19/35 (block 6/12)                                                  | the two mechanics tasks serial, the two logic tasks parallel | 15 and 17 share seven files (`feature-loader.ts`, `attach.ts`, `vite.config.mts`, `package.json`, `.size-limit.json`, `index.ts`, `package-exports.test.mjs`); 16 and 18 touch disjoint files; 19 may fix `claims.ts` for both |
| 5     | 20/35 → 21/35 (block 7/12)                                                                                                      | serial                                                       | both edit `bind.ts`                                                                                                                                                                                                            |
| 6     | 22/35 ∥ 23/35 (block 8/12) ∥ 24/35 ∥ 26/35 (block 9/12); 25/35 after 22 and 24                                                  | four parallel                                                | disjoint: `connect.ts` and a new module / `scope-entry.ts` / `ui-react` / `inserted.ts`, `ui-svelte` and the tailwind hydration test (26 is the group's only editor of `index.ts`)                                             |
| 7     | 27/35 (block 10/12)                                                                                                             | serial                                                       | edits `claims.ts`, `layout/flush.ts`, `layout.ts`                                                                                                                                                                              |
| 8     | 28/35 → 29/35 → 30/35; 31/35 ∥ [32/35 → 33/35 → 34/35] after 29 (block 11/12)                                                   | 28 and 30 are the controller's                               | 32 to 34 share the demo page; 31 edits README, manifest, API data                                                                                                                                                              |
| —     | **Gate 2/3**: Joël sees the demo; his missing answers                                                                           | controller                                                   |                                                                                                                                                                                                                                |
| 9     | 35/35, parts 1/4 and 2/4 in parallel when their answer exists, part 3/4 after part 1/4, part 4/4 last (block 12/12, "gate 3/3") | see the task                                                 | part 1 edits the old path and its tests, part 2 `state-tween.ts`, part 3 the doc pages                                                                                                                                         |

- Block 3/12 starts while the spike runs (spec §10): the reader does not depend on the mechanism.
- Joël's answers to questions 1 and 2 are asked before Task 22/35 (Task 1/35); part 1/4 of Task 35/35 may start after Task
  28/35 once question 2 is answered, part 3/4 after part 1/4.
- Task reviews (Sonnet, effort `high`): Tasks 3, 4, 5, 7 to 19, 20, 21, 22, 24, 26, 27 and Task 35/35 · part 2/4. The others
  are covered by the final review (Task 35/35 · part 4/4).
- After each group the controller builds, runs the group's new browser files in the three engines (one file at a time), runs
  `node scripts/size-report.mjs` and `npx size-limit`, and writes `core`, `states`, `drivers`, `layout`, `continuous` in the
  progress ledger (`.superpowers/sdd/2026-11-17-animation-docs/progress.md`).

---

### Task 1/35: precondition (block 1/12) — controller

- [ ] **Step 1:** In one message, ask Joël the two questions he has been shown as text but has not answered (review 13, I7):
      question 1 (the HTML writing, spec §9.3) and question 2 (what a scale between 0 and 1 is for, spec §9.4), each with its
      recommendation. **No task waits for the answers except these:** Task 22/35 (the scanner, which writes the new HTML
      writing) is not started before question 1 is answered; Task 35/35 · parts 1/4 and 3/4 wait for theirs. Tasks 2/35 to
      21/35 start at once.
- [ ] **Step 2:** Paste his answers here, verbatim, with the date:
      **Question 1 (HTML writing):** _pending_. **Question 2 (scale between 0 and 1):** _pending_. **Question 3 (spring and
      engine):** _pending (asked at gate 2/3)_.
- [ ] **Step 3:** `git status --short packages/motion packages/ui-react packages/ui-svelte apps/doc`: list the files modified by
      someone else; a task that must edit one of them waits for its commit.

### Task 2/35: the C1 spike and gate 1/3 (block 2/12)

Implementer: Haiku, effort `max`, writes the harness. **The controller** runs it in the three engines, does S 8/10 by hand,
writes the report and decides. Review: none (the report is the review).

**Files:**

- Create: `packages/motion/src/spike/c1-channels.browser.spec.ts` (DOM and WAAPI only; imports nothing from `../`)
- Create (controller): `docs/superpowers/reports/2026-11-28-motion-step3-c1-spike.md`

**Interfaces:**

- Produces: the verdict (Step 5), pasted by the controller into the briefs of Tasks 8/35 to 10/35, 18/35, 19/35, 27/35 as
  `HOLD_MODE` (`'inline'` with an order `'write-then-cancel'` or `'cancel-then-write'`, or `'filling'`), `LIVE_END` (`true`, or
  the fallback of §4.3 for S 3/10 a, b), `RETURN_TO_REST` (`'live-end'` or the S 10/10 b fallback), `HOLD_ABOVE_DRIVER`
  (`'filling'` or `'stop-driver'`), and per engine `VIEW_TIMELINE_LIVE_END` (S 3/10 d).

- [ ] **Step 1: Write the harness.** One `describe` per case, named `S 1/10` to `S 10/10`, the setups and pass criteria of
      spec §4.3 verbatim. Each case **logs** a JSON line `{ case, engine, label, values }` through `console.info` (the
      controller builds the table from them) and asserts its pass criterion; S 7/10 and S 8/10 assert nothing. S 8/10 is a
      `it.skip` with a comment that names the manual procedure (Chromium DevTools, Performance, "Animations" track, the
      "Compositing failed" reason). S 10/10 runs (a) and (b) for `transition: scale 200ms`, for the class
      `transition-[translate,scale,rotate]` written as Tailwind 4.3.3 writes its `transition` utility (copy the declared
      properties, duration and easing of the `transition` utility from `node_modules/tailwindcss` into the test, with the version in a comment),
      and for `transition: all`, each in both orders of (a), then (c) with `translate: -50% 0px`. Paused animations and
      `currentTime` wherever real time is not the subject (S 4/10 and S 9/10 are in real time).
      Helpers local to the file: `nextFrame(): Promise<number>`, `read(el, property): string`,
      `parsePair(value): [number, number]`.
- [ ] **Step 2: Implementer's check:** `cd packages/motion && MOTION_BROWSERS=chromium npx vitest run --project browser src/spike/c1-channels.browser.spec.ts`
      runs to the end (failures are data, not a reason to change the criteria). Commit
      `test(motion): the C1 channel spike in three engines`.
- [ ] **Step 3 (controller):** run the file alone in `chromium`, `firefox`, `webkit` in series; do S 8/10 by hand.
- [ ] **Step 4 (controller):** write the report: one table, case by engine, with the values read; S 7/10's three sums; S 8/10's
      composited or not with the reason shown.
- [ ] **Step 5 (controller): Gate 1/3.** Apply spec §4.3 "The verdict" and fill the Interfaces values above. A failed S 1/10, or
      fallback 2, stops the plan: it goes back to the designer (Fable) with the report. If the decision of §4.2 stands, the cases
      that state a fact are moved to `src/engine-facts.browser.spec.ts` and `src/spike/` is deleted (`git mv`, `git rm`), in
      the commit `test(motion): engine facts from the C1 spike`. If S 10/10 passes in one order only, it stays in
      `engine-facts.browser.spec.ts` as a regression test.

### Task 3/35: the reader and the axis base (block 3/12) — group 1

Implementer: Haiku, effort `high`. Review: Sonnet.

**Files:**

- Create: `packages/motion/src/keyframes.ts`, `src/axis-base.ts`, `src/keyframes.spec.ts`, `src/axis-base.spec.ts`,
  `src/axis-base.browser.spec.ts`
- Modify: `src/animate.ts` (`StyleKeyframe` imported from `keyframes.ts` and re-exported, nothing else), `src/index.ts`
  **[shared]**

**Interfaces:**

- Produces (`keyframes.ts`):
  - `export type StyleKeyframe = Record<string, string | number | null> & { offset?: number }` (moved, same type);
  - `export type Channel = string` (a CSS property in kebab-case, or `'x' | 'y' | 'scaleX' | 'scaleY'`);
  - `export const SPATIAL_PROPERTIES: ReadonlySet<string>`: the channels `x, y, scaleX, scaleY` and the kebab-case properties
    `translate, scale, rotate, transform, offset-distance`, `width, height, min-width, max-width, min-height, max-height,
inline-size, block-size, min-inline-size, max-inline-size, min-block-size, max-block-size`, `inset, top, right, bottom,
left` and the `inset-block*`, `inset-inline*` longhands, `margin` and `padding` with their `-top/-right/-bottom/-left` and
    `-block(-start|-end)`, `-inline(-start|-end)` longhands, `gap, row-gap, column-gap`, `border-radius` and its four corner
    longhands (model §3.1.3);
  - `export function readKeyframes(keyframes: StyleKeyframe | readonly StyleKeyframe[]): readonly StyleKeyframe[]` (throws
    `TypeError('A motion needs at least one keyframe')` on an empty list);
  - `export function channelsOf(frames: readonly StyleKeyframe[]): ReadonlySet<Channel>`;
  - `export function propertyOf(channel: Channel): string`: `x`, `y` give `translate`; `scaleX`, `scaleY` give `scale`; any
    other channel is its own property. **The unit of covering until step 4/8** (spec §3.4, §4.2): the one function step 4/8
    changes;
  - `export function toWaapiKeyframes(frames: readonly StyleKeyframe[], channels: ReadonlySet<Channel>, base: AxisBase): Keyframe[]`.
- Produces (`axis-base.ts`):
  - `export interface AxisBase { readonly x: string; readonly y: string; readonly z?: string; readonly scaleX: number; readonly scaleY: number; readonly scaleZ?: number }` (M4);
  - `export const NEUTRAL_AXIS_BASE: AxisBase` (`0px`, `0px`, `1`, `1`);
  - `export function parseAxisBase(translate: string, scale: string): AxisBase` (pure);
  - `export function readAxisBase(element: MotionElement): AxisBase` (`parseAxisBase` of the computed `translate` and `scale`).

- [ ] **Step 1: Write the failing tests** (U1, U2 of spec §7.1).
  - `keyframes.spec.ts`, `readKeyframes takes one keyframe or a list`; `an empty list throws`;
    `channelsOf splits the shorthands`: `{ x: 1, y: 2 }` gives `{'x','y'}`; `{ scale: 1.1 }` gives `{'scaleX','scaleY'}`;
    `{ translate: '1px 2px' }` gives `{'x','y'}`; `{ backgroundColor: 'red' }` gives `{'background-color'}`;
    `{ '--glow': 1 }` gives `{'--glow'}`; `{ rotate: 90 }` gives `{'rotate'}`; `propertyOf maps the four axis channels`.
  - `toWaapiKeyframes writes the missing axis from the base`, with `NEUTRAL_AXIS_BASE`: `{ y: 24 }` gives
    `{ translate: '0px 24px' }`; `{ x: '100%' }` gives `'100% 0px'`; `{ scaleX: 2 }` gives `{ scale: '2 1' }`; `{ rotate: 90 }`
    gives `{ rotate: '90deg' }`; with `parseAxisBase('-50% 12px', 'none')`, `[{ y: 0 }, { y: -2 }]` gives `'-50% 0px'` then
    `'-50% -2px'`; with a base of `'0px 0px 10px'` the z is kept (`'0px 4px 10px'`); `only the channels asked for are written`
    (`{ x: 8, opacity: 0 }` with `{'opacity'}` has no `translate`); `a legacy keyframe matches frameToKeyframe`: for each of
    `{ x: 4, y: -2, scale: 1.1, rotate: 30, opacity: 0.5 }`, `{ scaleX: 2 }`, `{ opacity: 0 }`, the fields equal those of
    `frameToKeyframe` (imported in the test from `./providers/waapi.js`: the comparison is the point).
  - `axis-base.spec.ts`, `parseAxisBase reads none, one, two and three values`: `('none', 'none')` is neutral; `('10px', '2')`
    gives `x '10px', y '0px', scaleX 2, scaleY 2`; `('-50% 12px', '1 0.5')`; `('1px 2px 3px', '1 2 3')` keeps z and scaleZ.
  - `axis-base.browser.spec.ts`, `readAxisBase keeps percentages`: an element with the class string
    `-translate-x-1/2`'s declaration (`translate: -50% 0px`, written inline in the test) reads `x === '-50%'`.
- [ ] **Step 2: Run:** `cd packages/motion && npx vitest run --project unit src/keyframes.spec.ts src/axis-base.spec.ts`: FAIL
      (modules missing).
- [ ] **Step 3: Implement** the Interfaces. A number keeps today's unit (px for `x`, `y`; deg for `rotate`); a string is
      written as is; `null` is left out of the keyframe; camelCase becomes kebab-case except custom properties. `draw` and
      `along` are not read here (spec §3.1).
- [ ] **Step 4 [shared]:** export from `index.ts`: `StyleKeyframe`, `Channel`, `SPATIAL_PROPERTIES`, `readKeyframes`,
      `channelsOf`, `propertyOf`, `toWaapiKeyframes`, `AxisBase`, `NEUTRAL_AXIS_BASE`, `parseAxisBase`, `readAxisBase`.
- [ ] **Step 5: Run** the two unit files: PASS; `MOTION_BROWSERS=chromium npx vitest run --project browser src/axis-base.browser.spec.ts`:
      PASS; `npx tsc --noEmit -p tsconfig.spec.json`: no new error.
- [ ] **Step 6: Commit** `feat(motion): one keyframe reader that knows channels and keeps the axis it does not name`.

### Task 4/35: the timing plan and the reduced forms (block 3/12) — group 1, after 3/35

Implementer: Haiku, effort `high`. Review: Sonnet.

**Files:**

- Create: `src/timing-plan.ts`, `src/reduced-form.ts`, `src/timing-plan.spec.ts`, `src/reduced-form.spec.ts`
- Modify: `src/play.ts` (`resolveWaapiTiming`, `waapiSupport`, `waapiTimings` moved out; `play.ts` imports and re-exports
  `resolveWaapiTiming`), `src/motion-style.ts` (`timeScaleIn` beside `motionScaleIn`, which is untouched), `src/index.ts` **[shared]**

**Interfaces:**

- Consumes: `StyleKeyframe`, `Channel`, `channelsOf`, `SPATIAL_PROPERTIES` (Task 3/35).
- Produces (`timing-plan.ts`):
  - `export type Contract = 'event' | 'state' | 'driver'`;
  - `export interface TimingGroup { readonly channels: ReadonlySet<Channel>; readonly timing: SpringRef | CurveTiming }`;
  - `export interface TimingPlan { readonly groups: readonly TimingGroup[]; readonly delay: number; readonly scale: number }`
    (`delay` already multiplied by `scale`);
  - `export function planTiming(frames: readonly StyleKeyframe[], request: { contract: Contract; exit?: boolean; timing?: SpringRef | CurveTiming; delay?: number; scale: number }): TimingPlan`
    (one or two groups; for a driver, one group with `timing` ignored and `delay: 0`);
  - `export function resolveWaapiTiming(target: MotionElement, timing: SpringRef | CurveTiming, scheme: MotionScheme): { duration: number; easing: string } | null` (moved, unchanged);
- Produces (`motion-style.ts`): `export function timeScaleIn(style: CSSStyleDeclaration): number` (reads
  `--udx-motion-scale`: 0 and above, no upper bound; negative is 0; absent or not a number is 1).
- Produces (`reduced-form.ts`):
  - `export type ReducedForm = 'fade' | 'end' | 'start' | 'none' | StyleKeyframe`;
  - `export type ReducedCause = 'policy' | 'disabled' | 'zero-scale'` (`disabled` is `--udx-motion: none`);
  - `export function readReducedWord(word: string): ReducedForm | undefined` (`instant` is `end`, `static` is `none`);
  - `export interface ReducedPlan { readonly fade: readonly StyleKeyframe[] | null; readonly set: StyleKeyframe | null }`
    (`fade`: the opacity frames to animate on `spring.default.effects`; `set`: what is written at once);
  - `export function reducedPlan(frames: readonly StyleKeyframe[], form: ReducedForm, request: { contract: Contract; phase: 'enter' | 'exit'; cause: ReducedCause }): ReducedPlan`.

- [ ] **Step 1: Write the failing tests** (U3, U4).
  - `timing-plan.spec.ts`: `an event takes spring.default per property` (`{ opacity: 0, y: 24 }`: two groups,
    `spring.default.effects` with `{'opacity'}` and `spring.default.spatial` with `{'y'}`); `a state takes spring.fast`; `an exit
takes spring.default.effects for every property`; `a timing applies to all` (one group); `an unknown property is effects`
    (`--glow`); `the scale multiplies the delay` at 0.5, 2 and 10 (`delay: 100` gives 50, 200, 1000); `a driver has no timing and no
delay`.
  - `timeScaleIn`, in the same file, on a `CSSStyleDeclaration`-like object `{ getPropertyValue }`: `'4'` gives 4, `'10'` gives
    10, `'-1'` gives 0, `''` and `'fast'` give 1.
  - `reduced-form.spec.ts`: one test per row of spec §3.8 and per form of model §3.1.4: `presence fade animates only opacity`
    (`rise`: `fade` is `[{ opacity: 0 }, { opacity: 1 }]`, `set` is `{ y: 0 }` on enter; on exit `fade` is
    `[{ opacity: 1 }, { opacity: 0 }]` and `set` is `null`); `a motion with no opacity fades 0 to 1`; `fade under a state fades
the frame's opacity and sets the rest`; `fade under a driver is none`; `start under a state is none`; `fade is end under
disabled and zero-scale`; `end, start, none, a keyframe`; `readReducedWord maps instant and static`.
- [ ] **Step 2: Run** `npx vitest run --project unit src/timing-plan.spec.ts src/reduced-form.spec.ts`: FAIL.
- [ ] **Step 3: Implement** the Interfaces. The groups follow `planGroups` of `play.ts` in spirit (read it), without importing it.
- [ ] **Step 4 [shared]:** export every name above from `index.ts`.
- [ ] **Step 5: Run** the two files and the existing `src/play.browser.spec.ts` in Chromium (the move must not change it):
      PASS; `tsc`: no new error.
- [ ] **Step 6: Commit** `feat(motion): a timing plan per property and the four reduced forms, with a scale that only slows`.

### Task 5/35: a motion without a verb, the reserved names, grow and dip (block 3/12) — group 1, after 4/35

Implementer: Haiku, effort `max`. Review: Sonnet.

**Files:**

- Modify: `src/define-motion.ts` **[shared]**, `src/manifest.ts` **[shared]** (reserved names only), `src/bind.ts`
  **[shared]** (`MotionSource` re-exported; `specOf` refuses a verbless spec), `src/presets.ts`, `src/play.ts`,
  `src/scope-entry.ts` and every other old module whose type reads `spec.verb` (`LegacySpec`), `src/index.ts` **[shared]**,
  `scripts/generate-motion-manifest.mjs` and `motion-manifest.json` (regenerated), `packages/mcp/src/bundled/motion-manifest.json`
  (`packages/mcp/scripts/snapshot.ts`, or a copy, as that script does)
- Test: `src/define-motion.spec.ts` (new `describe` blocks appended; existing ones untouched), `src/verbless.spec.ts` (new),
  `src/manifest-types.spec.ts` (T1 lines appended)

**Interfaces:**

- Consumes: `StyleKeyframe` (3/35), `ReducedForm`, `readReducedWord` (4/35).
- Produces (`define-motion.ts`):
  - `export interface VerblessSpec { keyframes: StyleKeyframe | readonly StyleKeyframe[]; timing?: SpringRef | CurveTiming; delay?: number; reduced?: 'fade' | 'end' | 'start' | 'none' | StyleKeyframe; verb?: never }`;
  - `export type LegacySpec = MotionDocument['spec']`; `export type MotionSpec = LegacySpec | VerblessSpec`;
  - `export type MotionSource = MotionName | MotionRef | Readonly<MotionSpec>` (moved from `bind.ts`, M7);
  - `export function isVerbless(spec: Readonly<MotionSpec>): spec is Readonly<VerblessSpec>`;
  - `export function validateVerblessSpec(spec: unknown): readonly string[]` (the issues; empty when valid);
  - `export function contentKeyOf(spec: Readonly<MotionSpec>): string` (`JSON.stringify` of the frozen copy);
  - `export interface MotionReading { readonly name?: string; readonly key: string; readonly frames: readonly StyleKeyframe[]; readonly timing?: SpringRef | CurveTiming; readonly delay: number; readonly reduced?: ReducedForm }`;
  - `export function readMotion(source: MotionSource, development?: boolean): MotionReading | undefined` (`undefined` for a name
    not defined yet; from a spec with a verb: `keyframes`, `timing`, `reduced` only, old `reduced` words mapped, `draw` and
    `along` skipped and reported once per motion in development; an inline spec is validated and frozen, not retained).
- Produces (`presets.ts`): `grow: MotionRef<'grow'>` (`[{ opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1 }]`) and
  `dip: MotionRef<'dip'>` (`{ keyframes: { scale: 0.96 } }`), both verbless; `MotionRegistry` gains `grow: true`, `dip: true`.
- Produces (`manifest.ts`): `reserved.names` gains `entering, present, exiting, presence, emphasis, layout, view, loop, hover,
focus, scroll, pointer, change, none` (not `press`, spec §3.1).

- [ ] **Step 1: Write the failing tests** (U6, U7, T1).
  - `define-motion.spec.ts`: `a spec without a verb is accepted and frozen`; `an invalid verbless spec throws in development`
    (no keyframe, an empty keyframe, an unknown key `stagger`, `delay: -1`, `timing: 'spring.nope'`); `a spec with a verb is
validated as today`; `each new reserved name throws` (the fourteen, one `it.each`); `press still defines`; `an inline
spec is not in the canonical cache` (`readMotion(spec)` twice leaves `definedMotions()` unchanged); `grow and dip are
defined`.
  - `verbless.spec.ts`: `under a new entry, rise gives no stagger` (`readMotion('rise')` has exactly the keys of
    `MotionReading`); `parallax gives no range`; `old reduced words are read` (a legacy spec with `reduced: 'instant'` reads
    `'end'`); `motion() refuses a verbless spec`: `motion(el, { keyframes: { opacity: 0 } })` throws `TypeError` with the exact
    message `motion() needs a spec with a verb; attach(element, { presence: … }) takes this one` (needs a DOM: if the unit
    project has none, this one case goes to `verbless.browser.spec.ts`); `contentKeyOf is equal for equal content`.
  - `manifest-types.spec.ts` (T1): compiles `defineMotion('lift', { keyframes: { scale: 1.04 } })`, a keyframe with
    `x: '100%'`, `backgroundColor`, `'--x'`, a spec with a verb; `// @ts-expect-error` on a spec without `keyframes`, a verbless
    spec with `stagger`, `reduced: 'instant'` on a verbless spec.
- [ ] **Step 2: Run** `npx vitest run --project unit src/define-motion.spec.ts src/verbless.spec.ts` and
      `npx tsc --noEmit -p tsconfig.spec.json`: FAIL.
- [ ] **Step 3: Implement.** Old code that reads `spec.verb` is typed `LegacySpec` (M9); `specOf` in `bind.ts` throws the
      message above for a verbless spec. Regenerate: `node scripts/generate-motion-manifest.mjs` then `--check`; refresh the MCP
      copy.
- [ ] **Step 4 [shared]:** export `VerblessSpec`, `LegacySpec`, `isVerbless`, `validateVerblessSpec`, `contentKeyOf`,
      `MotionReading`, `readMotion`, and `MotionSource` from `define-motion.ts` in `index.ts` (one export of each name).
- [ ] **Step 5: Run** the new files, `src/manifest.spec.ts`, `src/presets.spec.ts`, `src/define-motion.spec.ts` (whole: U10),
      `node scripts/generate-motion-manifest.mjs --check`, `tsc`: PASS, no new error.
- [ ] **Step 6: Commit** `feat(motion): a motion without a verb, reserved trigger words, and the grow and dip presets`.

### Task 6/35: the "no jump" helper and its calibration (spec §7, block 4/12) — group 1

Implementer: Haiku, effort `high`. The controller runs the calibration in three engines. Review: none.

**Files:**

- Create: `packages/motion/src/test-utils/no-jump.ts`, `src/test-utils/no-jump.browser.spec.ts`
- Modify: `tsconfig.lib.json` **[shared]** (`"src/test-utils/**"` in `exclude`, M10)

**Interfaces:**

- Produces (`no-jump.ts`, not exported by the package):
  - `export type Sample = { readonly t: number; readonly value: number }`;
  - `export async function sampleFrames(read: () => number, frames: number): Promise<Sample[]>` (one read per
    `requestAnimationFrame`);
  - `export function findJump(samples: readonly Sample[], unit: 'px' | 'scale'): { index: number; move: number } | null`;
  - `export function expectNoJump(samples: readonly Sample[], unit: 'px' | 'scale', reference?: readonly Sample[]): void`
    (throws an `Error` naming the frame); with `reference`, the reference comparison of spec §7 (1 px or 0.004 of a scale,
    frame by frame);
  - `export const NO_JUMP = { ratio: 1.5, floorPx: 1, floorScale: 0.004, referencePx: 1, referenceScale: 0.004 } as const`.
  - Tests call `expectNoJump` only; whether it uses the ratio or the reference is decided in Step 4 and never seen by them.

- [ ] **Step 1: Write the calibration** (`no-jump.browser.spec.ts`, plain WAAPI, no registry): `reports no jump on healthy
transitions` for a hover from rest (scale 1 to 1.04) and a return to rest, with the `linear()` easings of
      `spring.fast.spatial` and `spring.default.spatial` (read through `resolveWaapiTiming`), at a scale of 1 and 4 (duration
      multiplied); `reports an injected jump`: the same transition with `scale` written +0.02 by script at its tenth frame.
      Each case logs `{ engine, case, maxRatio, maxMove }` with `console.info`.
- [ ] **Step 2: Implementer's check:** Chromium only: runs; commit `test(motion): a calibrated "no jump" helper`.
- [ ] **Step 3 (controller):** run it in the three engines; copy the logged figures into the step's report
      (`docs/superpowers/reports/2026-11-28-motion-step3-slice.md`, section "No jump").
- [ ] **Step 4 (controller):** if the ratio criterion fails either way in any engine, `expectNoJump` is switched to require
      `reference` (spec §7: "the helper becomes a comparison with a reference"), and every later brief says: "pass a reference:
      the same transition on a twin element started in the same task". Paste the outcome in the briefs of Tasks 8/35 to 27/35.

### Task 7/35: the player and the events (block 4/12) — group 2

Implementer: Haiku, effort `max`. Review: Sonnet.

**Files:**

- Create: `src/player.ts`, `src/events.ts`, `src/player.browser.spec.ts`, `src/events.spec.ts`
- Modify: `src/index.ts` **[shared]**

**Interfaces:**

- Consumes: `toWaapiKeyframes`, `AxisBase` (3/35); `TimingPlan`, `resolveWaapiTiming` (4/35); `composeHandles`,
  `settledHandle` (`compose.ts`, existing); `MotionHandle`, `MotionElement` (`contract.ts`).
- Produces (`player.ts`):
  - `export interface PlayedAnimations { readonly handle: MotionHandle; readonly animations: readonly Animation[] }`;
  - `export function playPlan(element: MotionElement, frames: readonly StyleKeyframe[], channels: ReadonlySet<Channel>, plan: TimingPlan, options: { base: AxisBase; from: 'first' | 'current'; liveEnd?: boolean }): PlayedAnimations`:
    one WAAPI animation per group of `plan` restricted to `channels`, `fill: 'both'`, created in the calling task; `from:
'current'` replaces the first keyframe by the computed values read before anything is cancelled; `liveEnd` plays one
    keyframe at `offset: 0` (the current values) with no end (spec §3.4, the hand-back);
  - `export type StateTween = (request: { element: MotionElement; keyframes: Keyframe[]; timing: SpringRef | CurveTiming; scale: number; interrupted?: { handle: MotionHandle; timing: SpringRef | CurveTiming } }) => MotionHandle` (spec §3.4, verbatim);
  - `export function setStateTween(tween: StateTween): void`; `export function stateTween(): StateTween | undefined`.
- Produces (`events.ts`):
  - `export type MotionPhase = 'enter' | 'exit'`;
  - `export interface MotionStartDetail { readonly trigger: string; readonly phase: MotionPhase; readonly reduced: boolean }`;
  - `export interface MotionEndDetail extends MotionStartDetail { readonly outcome: 'finished' | 'cancelled' }`;
  - `export type MotionStartEvent = CustomEvent<MotionStartDetail>`; `export type MotionEndEvent = CustomEvent<MotionEndDetail>`;
  - `export function dispatchMotionStart(element: Element, detail: MotionStartDetail): void`;
    `export function dispatchMotionEnd(element: Element, detail: MotionEndDetail): void` (`bubbles: false`, `composed: false`,
    not cancelable);
  - `declare global { interface HTMLElementEventMap { 'motion-start': MotionStartEvent; 'motion-end': MotionEndEvent } }`
    (and `SVGElementEventMap`), so that T4's `event.detail.outcome` types.

- [ ] **Step 1: Write the failing tests.**
  - `player.browser.spec.ts`: `the first keyframe is painted in the calling task` (an element appended and played with
    `{ opacity: 0, y: 24 }`, `delay: 200`: read in the same task after `playPlan`, then at each frame of the delay: opacity 0,
    translate `0px 24px`); `from current starts where the element is` (paused lower animation at scale 1.02, then
    `from: 'current'` to 1.04: first frame reads 1.02); `liveEnd ends on the underlying value` (a class switch half-way:
    the end equals the new rest; `getAnimations()` is empty after `finished`); `two groups share one handle` (`cancel()`
    cancels both); `the scale multiplies the duration` (`plan` with scale 4: `effect.getTiming().duration` is four times
    that at 1); `setStateTween replaces the tween` (`stateTween()` returns the function set).
  - `player.browser.spec.ts`, `without WAAPI the play ends at once, events included` (review 13, B3; the rule of the old
    path, `play.ts` around line 276): with `Element.prototype.animate` deleted for the test (restored after), `playPlan` writes
    the end state in the calling task, returns a settled handle (`finished` resolves `'finished'`), and a trigger that plays
    through it dispatches `motion-start` then `motion-end` in the same task. This is what lets the React jsdom tests of Task
    24/35 run.
  - `events.spec.ts` (unit, with a minimal `EventTarget`): `motion-start and motion-end do not bubble and are not
cancelable`; `the detail is passed as is`.
- [ ] **Step 2: Run:** FAIL (modules missing).
- [ ] **Step 3: Implement** the Interfaces. No import of `play.ts`, `bind.ts`, `slots.ts`.
- [ ] **Step 4 [shared]:** export every name above from `index.ts`.
- [ ] **Step 5: Run** both files (browser: Chromium), `tsc`: PASS.
- [ ] **Step 6: Commit** `feat(motion): one player for a timing plan, a replaceable state tween, and the motion events`.

### Task 8/35: the registry of claims (a): order, hold, release, covering, kept frames (block 4/12) — group 2

Implementer: Haiku, effort `max`. Review: Sonnet. The brief carries gate 1/3's `HOLD_MODE`, `LIVE_END`, `RETURN_TO_REST`,
`HOLD_ABOVE_DRIVER` and Task 6/35's "no jump" outcome. After Task 7/35 and gate 1/3.

**Files:**

- Create: `src/claims.ts` **[shared from here on]**, `src/claims.spec.ts`, `src/claims.browser.spec.ts`
- Modify: `src/index.ts` **[shared]**

**Interfaces:**

- Consumes: `playPlan`, `stateTween` (7/35); `propertyOf`, `channelsOf`, `readAxisBase` (3/35); `TimingPlan` (4/35).
- Produces (`claims.ts`), from spec §3.4 verbatim: `CLAIM_LEVELS`, `ClaimSource`, `ClaimView`, `HeldClaim`, `ClaimRegistry`
  (this task implements `hold` and `claims`; `play` is Task 9/35, `drive`, `external`, `settle` Task 10/35: they are declared
  here and throw `Error('not implemented yet')` until then), `claimsOf(element: MotionElement): ClaimRegistry`. Added:
  - `export interface ClaimEntry { readonly level: number; readonly order: number }` (`order`: start order at level 8,
    attach order at level 4, else creation order);
  - `export function compareClaims(a: ClaimEntry, b: ClaimEntry): number` (pure: level, then `order`);
  - `export type HandBackAim = 'state' | 'kept' | 'running' | 'rest'`;
    `export function handBackAim(under: readonly { level: number; runs: boolean }[]): HandBackAim` (pure);
  - `HeldClaim.handle` settles `cancelled` when a higher claim stops its transition. The registry dispatches no event: the
    triggers do (Tasks 12/35 to 16/35).
  - Kept frames are stored here (level 2), written by `play(…, 'keep')` in Task 9/35; this task gives them an internal
    `keep(channel, frame)` that the tests reach through Task 9/35 only, so C3 lands there.

- [ ] **Step 1: Write the failing tests.**
  - `claims.spec.ts` (U5): `the top of a channel for every pair of levels` (`it.each` over the 8 × 8 pairs of `CLAIM_LEVELS`);
    `at the same level the later order wins`; `handBackAim`: a covered state under the stopping claim gives `'state'`, a kept
    frame only `'kept'`, a driver `'running'`, nothing `'rest'`, a state above a kept frame `'state'`.
  - `claims.browser.spec.ts`, through `claimsOf(el)` only, on the 200 × 120 px `article` of spec §7:
    `a hold reaches its frame and leaves it as HOLD_MODE says` (scale 1.04 read for 20 frames; inline `scale` `1.04` and
    `getAnimations()` empty when `'inline'`); `a release returns to rest with no end keyframe` (rest `scale: 1.1` from a class:
    last read 1.1, nothing inline, `getAnimations()` empty, `expectNoJump`); `a lower state that starts under a higher one is
covered` (a hold at level 7, then one at level 5: `getAnimations().length` unchanged for ten frames; `claims()` shows the
    level 5 claim not `top`); `a higher claim stops a lower transition` (I4 at registry level: level 5 hold paused at 40 %, then
    a level 7 hold: the first handle `cancelled`; at most one registry animation on `scale`; twenty frames at 0.96 once held);
    `a covered axis waits for its property until step 4/8` (a hold on `x` at level 5 under a hold on `y` at level 7: no
    animation for the lower one).
- [ ] **Step 2: Run** the unit file, then the browser file in Chromium: FAIL.
- [ ] **Step 3: Implement** spec §3.4 for states, with the gate's modes. Covering uses `propertyOf` only. A property has at most
      one inline value and one registry transition at any time. In development the registry lists its plays with
      `listRunning` of `slots.ts` (its running list, not its kinds), so that `checkSources` reports a component that animates the
      same property (spec §3.3, "A reservation").
- [ ] **Step 4 [shared]:** export every name above from `index.ts`.
- [ ] **Step 5: Run** both files (browser: Chromium), `tsc`: PASS.
- [ ] **Step 6: Commit** `feat(motion): a registry of claims per channel: order, holds, covering and hand-back`.

### Task 9/35: the registry of claims (b): events, atEnd, the exit hold (block 4/12) — group 2

Implementer: Haiku, effort `max`. Review: Sonnet. The brief carries gate 1/3's `HOLD_MODE`, `LIVE_END`, `RETURN_TO_REST`,
`HOLD_ABOVE_DRIVER` and Task 6/35's "no jump" outcome. After Task 8/35.

**Files:** Modify `src/claims.ts` **[shared]**, `src/claims.browser.spec.ts` (cases appended); `src/index.ts` **[shared]**
(`PlayedClaim`).

**Interfaces:**

- Produces: `ClaimRegistry.play(source, frames, plan, atEnd: 'release' | 'keep' | 'hold'): PlayedClaim` (spec §3.4, the
  `atEnd` table); `PlayedClaim.handle` settles `cancelled` when a higher claim stops it.

- [ ] **Step 1: Write the failing tests** (appended to `claims.browser.spec.ts`): `release writes nothing at the end`;
      `keep leaves the last keyframe as a kept frame` (C3: `play({ x: 100 }, 'keep')`, then a hold on `x` and its release: ends at
      `100px 0px`; a `null` value keeps nothing); `a kept frame survives a release and is replaced by a new keep`; `hold keeps the
    exit's last keyframe at level 9`; `an exit cancels a manual play under it and keeps its frame as data` (I5 at registry
      level: `play(…, 'keep')` at level 8 then `play(…, 'hold')` at level 9: the first handle `cancelled`, its kept frame recorded,
      the exit's last keyframe read for twenty frames); `the later started event wins at level 8`; `a play from its first
    keyframe, or from the current values when it interrupts at the same channel`.
- [ ] **Step 2: Run** in Chromium: FAIL. **Step 3: Implement.** **Step 4:** export `PlayedClaim`. **Step 5: Run:** PASS, `tsc`.
- [ ] **Step 6: Commit** `feat(motion): the registry plays events and ends them as atEnd says`.

### Task 10/35: the registry of claims (c): drivers, external claims, the hold above what runs, settle (block 4/12) — group 2

Implementer: Haiku, effort `max`. Review: Sonnet. The brief carries gate 1/3's `HOLD_MODE`, `LIVE_END`, `RETURN_TO_REST`,
`HOLD_ABOVE_DRIVER` and Task 6/35's "no jump" outcome. After Task 9/35.

**Files:**

- Create: `src/claim-bridge.ts`
- Modify: `src/claims.ts` **[shared]**, `src/claims.browser.spec.ts` (cases appended), `src/index.ts` **[shared]**

**Interfaces:**

- Produces (`claims.ts`): `drive(source, frames, timeline): DrivenClaim`, `external(source, channels): () => void`,
  `settle(channels): void` (spec §3.4); `DrivenClaim`.
- Produces (`claim-bridge.ts`, imports nothing of `claims.ts` at run time; one responsibility: what animates an element outside
  the registry):
  - `export function claimExternally(element: Element, source: ClaimSource, properties: Iterable<string>, animations?: () => readonly Animation[]): () => void`;
  - `export function externalClaimsOf(element: Element): readonly { source: ClaimSource; properties: ReadonlySet<string> }[]`;
  - `export function onExternalClaims(element: Element, listener: () => void): () => void` (the registry subscribes when it
    is created for an element).

- [ ] **Step 1: Write the failing tests** (appended): `a driver is sought by progress, or runs on its timeline`; `a hold above a
    running animation is a filling animation` (an external claim whose `animations` returns a running `scale` animation; a
      hold above it: `replaceState` `active`, value held 20 frames; the external animation created again: the hold is created
      again in the same task) — with `HOLD_ABOVE_DRIVER` `'stop-driver'`, the variant of spec §4.3 instead; `a hand-back to a
    driver ends on its live value` (`LIVE_END`); `settle finishes the transitions of the given channels`; `a legacy claim
    covers both axes of its property` (`claimExternally(el, …, ['translate'])`, then a hold on `x`: covered).
- [ ] **Step 2: Run** in Chromium: FAIL. **Step 3: Implement.** **Step 4:** exports. **Step 5: Run:** PASS, `tsc`.
- [ ] **Step 6: Commit** `feat(motion): drivers and external claims in the registry, with a bridge for legacy bindings`.
- [ ] **Step 7 (controller):** `claims.browser.spec.ts` in the three engines; build; `node scripts/size-report.mjs`;
      `npx size-limit`: record `core` in the progress ledger (the 27 kB rule of Global Constraints).

### Task 11/35: the triggers' contracts and the presence state moved out of bind.ts (block 5/12) — group 3

Implementer: Haiku, effort `high`. Review: Sonnet.

**Files:**

- Create: `src/trigger.ts`, `src/presence-state.ts`, `src/trigger.spec.ts`
- Modify: `src/bind.ts` **[shared]** (`createBinding` calls `presence-state.ts` for `inert`, the focus an exit moves and the
  mark; behaviour unchanged), `src/index.ts` **[shared]**
- Test: `src/manifest-types.spec.ts` (T3 lines appended)

**Interfaces:**

- Produces (`trigger.ts`), spec §3.2 verbatim: `EventTrigger<O>`, `StateTrigger<O>`, `DriverTrigger<O>`, `Trigger`,
  `defineTrigger<N extends string>(name: N, trigger: Trigger): N`, `resolveTrigger(name: string): Trigger | undefined`,
  `onTriggerDefined(listener: (name: string) => void): () => void`, `BUILT_IN_TRIGGERS`. Added:
  - `export interface TriggerFacts { readonly contract: 'event' | 'state' | 'driver'; readonly level: number; readonly options: readonly string[]; readonly reduced: ReducedForm; readonly module: 'core' | 'states' | 'drivers' }`
    (the rows of spec §3.2's table for `presence`, `hover`, `press`, `scroll`, `manual`);
  - `export const DEFINED_TRIGGER_FACTS: Readonly<Record<'event' | 'state' | 'driver', { level: number; reduced: ReducedForm }>>`
    (8 / `none`, 4 / `end`, 3 / `none`);
  - `export const RESERVED_TRIGGER_WORDS: readonly string[]` and `RESERVED_TRIGGER_PREFIXES: readonly string[]`: the lists of the
    model's §3.2 "Names" (copy them from there: built-in trigger names and each as a prefix with `-`, the words written after
    `data-motion-`, the CSS variable words and prefixes), plus the prefix `axis-`;
  - the registry: a `Map` on `globalThis` under `Symbol.for('udixio.motion.triggers.preview.1')` (as `define-motion.ts`'s
    `DEFINITIONS`).
- Produces (`presence-state.ts`, moved from `bind.ts`):
  - `export type PresencePhase = 'enter' | 'rest' | 'exit'`;
  - `export function presencePhaseOf(element: Element): PresencePhase | undefined` (reads `data-motion-phase`, else the old mark:
    `entering` is `enter`, `present` `rest`, `exiting` `exit`);
  - `export function writePhase(element: Element, phase: PresencePhase | null): void` (`data-motion-phase` only);
  - `export function holdInert(element: Element, restoreFocus: Element | (() => Element | null | undefined) | undefined, development: boolean): () => void`
    (the exit's focus move and `inert`, now or once focus leaves; returns the release), the code of `createBinding` moved as is.

- [ ] **Step 1: Write the failing tests** (U8, T3).
  - `trigger.spec.ts`: `defineTrigger returns its name`; `a name that is not kebab-case throws` (`myState`, `-a`, `a_b`);
    `a taken name throws`; `every reserved word and prefix throws` (`it.each` over `RESERVED_TRIGGER_WORDS`, and
    `'hover-x'`, `'state-open'`, `'duration-x'`, `'axis-x'`); `the registry is shared through globalThis` (a `Map` found at
    `globalThis[Symbol.for('udixio.motion.triggers.preview.1')]` holds the defined trigger); `onTriggerDefined is called
with the name`; `BUILT_IN_TRIGGERS has the facts of the spec table` (`hover`: state, 5, `end`, `states`…).
  - `manifest-types.spec.ts` (T3): `defineTrigger('my-state', { contract: 'state', watch })` has type `'my-state'`; the three
    contracts accept their `watch`; `@ts-expect-error` on `contract: 'gesture'` and on a state whose `set` takes a number.
- [ ] **Step 2: Run:** FAIL.
- [ ] **Step 3: Implement.** In `bind.ts`, the move is a refactoring: `bind.browser.spec.ts`, `host-state.browser.spec.ts`,
      `hidden-presence.browser.spec.ts` stay green unmodified. `bind.ts` does not write `data-motion-phase` yet (Task 21/35).
- [ ] **Step 4 [shared]:** exports from `index.ts`.
- [ ] **Step 5: Run** `trigger.spec.ts`, `tsc`, and in Chromium `bind.browser.spec.ts`, `host-state.browser.spec.ts`: PASS.
- [ ] **Step 6: Commit** `feat(motion): three trigger contracts and defineTrigger; the presence state leaves bind.ts`.

### Task 12/35: attach (a): attachments, update, detach, bindings, defined triggers (block 5/12) — group 3, after 11/35

Implementer: Haiku, effort `max`. Review: Sonnet.

**Files:**

- Create: `src/attach.ts`, `src/attach.browser.spec.ts`
- Modify: `src/index.ts` **[shared]**
- Test: `src/manifest-types.spec.ts` (T2 lines appended)

**Interfaces:**

- Consumes: `readMotion`, `contentKeyOf`, `MotionSource` (5/35); `claimsOf` (8/35); `resolveTrigger`, `onTriggerDefined`,
  `BUILT_IN_TRIGGERS`, `DEFINED_TRIGGER_FACTS` (11/35); `planTiming`, `timeScaleIn`, `reducedPlan` (4/35); `motionBox`
  (`box.ts`); `onMotionDefined` (`define-motion.ts`); the runtime policy (`runtime.policy.subscribe`, as `bind.ts` uses it).
- Produces (`attach.ts`), spec §3.3 verbatim: `Of<O>`, `Triggers`, `PresenceOptions`, `ScrollOptions`, `Live`, `Attached`,
  `AttachOptions`, `attach(element, what, options?): Attachment`, `getBinding(element, trigger): Binding | undefined`,
  `Attachment` (`update`, `setPresent`, `play`, `binding`, `detach`), `Binding`. Added:
  - `export type ViewRangeName = 'cover' | 'contain' | 'entry' | 'exit' | 'entry-crossing' | 'exit-crossing'`, and
    `ScrollOptions` as the union of spec §3.3 (`ScrollCommon & ({ track?: 'element'; range?: ViewRangeName | readonly [string, string] } | { track: 'container'; range?: 'scroll' | readonly [string, string] })`):
    a view name with `track: 'container'`, or `'scroll'` with `track: 'element'`, is a type error (T2);
  - the one seam between `attach` and a built-in trigger module (Tasks 14/35, 16/35, 18/35 use it, nothing else):
    `export interface TriggerRuntime { readonly name: string; readonly element: MotionElement; readonly box: MotionElement; readonly motion: MotionReading | undefined; readonly exit?: MotionReading | 'none'; option<T>(key: string): T | undefined; readonly claims: ClaimRegistry; reducedCause(): ReducedCause | null; onReducedChange(listener: () => void): () => void; readonly development: boolean }`
    (`element` carries the state, `box` the claims; `option` reads the latest slot; `reducedCause` is `null` when nothing
    reduces);
  - `export interface TriggerBinding { readonly binding: Binding; update(runtime: TriggerRuntime): void; setPresent?(present: boolean): Promise<'finished' | 'cancelled'>; detach(): void }`;
  - `export function registerBuiltInTrigger(name: 'presence' | 'hover' | 'press' | 'scroll', bind: (runtime: TriggerRuntime) => TriggerBinding): void`:
    how `triggers/presence.ts`, `state-entry.ts` and `driver-entry.ts` install their triggers;
  - `export function attachmentsOf(element: Element): readonly Attachment[]` (for `inspect`, Task 23/35).
- What this task attaches: the defined triggers of the three contracts. `Attachment.play`, the reduced forms, the waiting for a
  name and `boxless` are Task 13/35 (declared here, implemented there). The presence trigger is Task 14/35; `hover`, `press`
  (Tasks 15/35, 16/35) and `scroll` (Tasks 17/35, 18/35) start their module's load at `attach` and bind when it lands: this task
  stores the request and binds when `registerBuiltInTrigger` is called.

- [ ] **Step 1: Write the failing tests** (`attach.browser.spec.ts`; T2 in `manifest-types.spec.ts`).
  - `a defined trigger of each contract plays` (O3 via `attach({ triggers })`): a state on a `data-active` attribute
    (`MutationObserver`), an event on a custom DOM event `ping`, a driver on an `<input type="range">` (the animation's input in
    a test, not a doc control).
  - `update keeps what is equal and detaches what is absent` (O6 with defined triggers; the presence case is Task 14/35):
    `update({ one })` removes the other trigger and creates no animation; an equal inline spec (a new object) creates nothing;
    `update` without `present` keeps it.
  - `a function option is read when used and never re-attaches` (ten `update`s with new functions call `watch` once; the latest
    function is the one read).
  - `two attachments on one element share the registry, a trigger name is held once` (O7 with a defined trigger: the second
    `attach` naming it attaches nothing, development reports once; `detach()` of the second leaves the first).
  - `detach after remove is a no-op` (Review Focus 4: `el.remove()` during a hold, then `detach()`: no throw, `getAnimations()`
    empty, no inline value).
  - `getBinding looks through every attachment`; `a binding reports its contract, handle and active`.
  - `manifest-types.spec.ts` (T2): the compiling and failing lines of spec §7.3 T2 verbatim.
- [ ] **Step 2: Run** the browser file in Chromium and `tsc`: FAIL.
- [ ] **Step 3: Implement** spec §3.3. Value comparison: a motion by name, reference name or `contentKeyOf`; data options by
      content; elements by identity; functions never (a latest slot).
- [ ] **Step 4 [shared]:** exports from `index.ts`.
- [ ] **Step 5: Run:** PASS (Chromium), `tsc` no new error.
- [ ] **Step 6: Commit** `feat(motion): attach, update and bindings for defined triggers`.

### Task 13/35: attach (b): the manual play, the reduced forms, a name defined later, boxless (block 5/12) — group 3, after 12/35

Implementer: Haiku, effort `high`. Review: Sonnet.

**Files:** Modify `src/attach.ts`; Test `src/attach-play.browser.spec.ts` (new).

**Interfaces:**

- Consumes: Task 12/35's `attach.ts`; `reducedPlan`, `ReducedCause`, `planTiming`, `timeScaleIn` (4/35); `claimsOf(…).play` (9/35);
  `onMotionDefined`; `motionBox`; `runtime.policy.subscribe`.
- Produces: `Attachment.play(what: MotionSource, options?: { atEnd?: 'release' | 'keep' }): MotionHandle` (level 8, `keep` by
  default, events with `trigger: 'manual'`, `phase: 'enter'`); the `reducedCause` and `onReducedChange` of `TriggerRuntime`;
  the waiting for an undefined name; `boxless` and `data-motion-box="none"`.

- [ ] **Step 1: Write the failing tests:** `a manual play keeps its last keyframe` (C3: `play({ keyframes: { x: 100 } })` leaves
      `translate: 100px 0px` inline; `detach()` removes it); `a manual play with atEnd release leaves nothing`; `a manual play
    dispatches start and end with trigger 'manual' and phase 'enter'`; `a listener on the parent receives none`; `a manual play
    under reduced motion ends at once` (the `end` form, events `reduced: true` in the same task); `an entry that ends away from
    rest jumps and is reported once` (C4 with a defined event trigger; the presence case is Task 14/35; a `console` spy, the
      console being outside the repository, called once with `ends away from rest: end at rest, hold it with a state, or set
    atEnd: 'keep'`); `a scale of 4 lasts four times longer` (O4: `handle.duration` ratio within one frame); `a name defined
    later attaches then` (nothing written before `defineMotion` runs); `boxless sends claims to the box`; `a box marked none
    attaches nothing, with today's report`.
- [ ] **Step 2: Run** in Chromium: FAIL. **Step 3: Implement** spec §3.3, §3.8 (manual row). **Step 4: Run:** PASS, `tsc`.
- [ ] **Step 5: Commit** `feat(motion): the manual play, reduced forms and late names in attach`.

### Task 14/35: the presence trigger (block 5/12) — group 3, after 12/35

Implementer: Haiku, effort `max`. Review: Sonnet.

**Files:**

- Create: `src/triggers/presence.ts`, `src/triggers/presence.browser.spec.ts`
- Modify: `src/attach.ts` (registers `presence`, a core trigger), `src/index.ts` **[shared]** (`presenceTrigger` exported, model §4)

**Interfaces:**

- Consumes: `TriggerRuntime`, `registerBuiltInTrigger` (12/35); `presencePhaseOf`, `writePhase`, `holdInert` (11/35);
  `setPresentByHidden`, `PresenceTaker` (`hidden-presence.ts`, existing: an `Attachment` is a `PresenceTaker`).
- Produces: `export const presenceTrigger: EventTrigger`-shaped facts and its binder; `Attachment.setPresent` resolves
  `'finished' | 'cancelled'` and never rejects.

- [ ] **Step 1: Write the failing tests** (spec §7.2 P1 to P8, F2, F5, R2, R4 presence part, R5 entry part, O6 presence part,
      O1 during an entry, one per case, named after the case id, e.g. `P1 an entry releases`):
  - P1: after the entry no inline `opacity` nor `translate`, phase `rest`; with a class `opacity: 0.6` the last read is 0.6.
  - P2 `{ enter: 'rise', exit: 'fade' }`: the exit changes `opacity` only; its last keyframe read after it ends; once `hidden`
    (`setPresentByHidden`) nothing inline.
  - P3 `presence: 'rise'`: the exit's keyframes are the entry's reversed, its timing `spring.default.effects` (read
    `effect.getTiming()` against `resolveWaapiTiming` of that token).
  - P4 `exit: 'none'` leaves at once; `{ exit }` alone plays no entry.
  - P5: the three focus cases of `bind.browser.spec.ts`, rewritten against `attach` (read them there).
  - P6 shown again during its exit: enters from the current values (`expectNoJump`), `inert` released.
  - P7: `data-motion-phase` is `enter`, `rest`, `exit` at the three moments; an author's `data-motion-presence="rise"` is never
    rewritten (the legacy half is Task 21/35).
  - P8 is in Task 15/35 (it needs `hover`).
  - F2: `delay: 200`: every frame of the delay reads the first keyframe. F5: a name defined after `attach`: no entry; a later
    `setPresent(false)` plays the exit.
  - R2 under `data-motion-policy="reduce"`, `rise`: on the entry only `opacity` changes over time and `translate` is never
    other than rest; on the exit `translate` never changes; with `reduced: 'end'` nothing animates; events `reduced: true`.
    R4: the same under `--udx-motion: none` and under a scale of 0, `fade` read as `end`.
  - R5 (entry): the policy turns to reduced during an entry: at its end at the next read.
  - O6 (presence): `update` without the presence removes it: no exit, the mark and `inert` removed.
  - An absent element at `attach` (`present: false`): the exit's last keyframe at once, phase `exit`, `inert`.
  - `enterOnAttach: false`, and an element whose `data-motion-phase` is `rest`: no entry.
  - Review Focus 3: `setPresent(false)` then `setPresent(true)` in one task: the first promise resolves `cancelled`, one
    entry plays, events balanced.
  - I5: an exit starts while a manual play runs on the same property: the manual play ends `cancelled`; the exit's last
    keyframe is read for twenty frames after it ends.
  - C4 (presence, review 13 M1): an entry whose last keyframe is `scale: 1.1` jumps to rest at its end and is reported once with
    the model's message.
  - O1: `detach()` during an entry: nothing inline, no animation, no mark, no listener.
- [ ] **Step 2: Run** the file in Chromium: FAIL.
- [ ] **Step 3: Implement** spec §3.5, §3.7, §3.8 (presence row). A reserved `presence` kind (`reserveMotion`) refuses the
      trigger with today's report naming the owner (spec §3.3).
- [ ] **Step 4 [shared]:** export `presenceTrigger`.
- [ ] **Step 5: Run:** PASS (Chromium). **Controller:** the file in three engines; `hidden-presence.browser.spec.ts`,
      `bind.browser.spec.ts` in three engines (unmodified, green); build, size, ledger.
- [ ] **Step 6: Commit** `feat(motion): the presence trigger, with an exit written apart and a phase mark`.

### Task 15/35: the `states` entry, mechanics: entry, loader, exports, `press()` (block 6/12) — group 4

Implementer: Haiku, effort `high`. Review: Sonnet. Runs alone: it owns the seven shared files of the group until Task 17/35.

**Files:**

- Create: `src/press.ts` (the text of `packages/core/src/lib/dom/press.ts`, copied; core's file and tests untouched),
  `src/press.browser.spec.ts` (core's `press.browser.spec.ts` copied, imports repointed), `src/state-entry.ts`,
  `src/feature-loader.cold-states.browser.spec.ts`
- Modify **[shared]**: `src/feature-loader.ts` (`provideStates`, `statesModule`, `loadStates`, as the five loaders),
  `src/attach.ts` (`hover` and `press` start `loadStates`), `vite.config.mts` (entry `states: 'src/state-entry.ts'`),
  `package.json` (`./states` in `exports` and `publishConfig.exports`, written as `./continuous`), `scripts/package-exports.test.mjs`,
  `.size-limit.json` (a `states` line, 2.5 kB until its first measure; `./states.js` in the `core` line's `ignore`), `src/index.ts`
  (`PressStart`, `loadStates`)

**Interfaces:**

- Consumes: `registerBuiltInTrigger` (12/35).
- Produces: the `@udixio/motion/states` entry, `state-entry.ts`, exporting `press` and `PressStart` and calling `provideStates`;
  Task 16/35 adds the triggers and the tween to it. `loadStates(): Promise<void>`.

- [ ] **Step 1: Write the failing tests:** `press.browser.spec.ts` (core's cases, unchanged, against the copy); in
      `feature-loader.cold-states.browser.spec.ts`, written as `feature-loader.cold.browser.spec.ts` (read it):
      `attach with hover starts the load of states`, and O9 `a failed load leaves the element at rest` (the chunk made to fail
      as that file does; the network is outside the repository): nothing written, development reports once, a later
      `attach` tries again.
- [ ] **Step 2: Run** both in Chromium: FAIL. **Step 3: Implement.** **Step 4: Run:** PASS; `tsc`.
- [ ] **Step 5: Commit** `feat(motion): a lazy states entry and the press() function`.

### Task 16/35: hover, press and the shipped tween (block 6/12) — group 4, after 17/35, ∥ 18/35

Implementer: Haiku, effort `max`. Review: Sonnet. Touches no shared file.

**Files:**

- Create: `src/triggers/hover.ts`, `src/triggers/press.ts`, `src/state-tween.ts`, `src/triggers/states.browser.spec.ts`
- Modify: `src/state-entry.ts` (registers `hover` and `press`, calls `setStateTween(springStateTween)`)

**Interfaces:**

- Consumes: `registerBuiltInTrigger`, `TriggerRuntime` (12/35); `setStateTween`, `StateTween` (7/35); `claimsOf`,
  `CLAIM_LEVELS` (8/35); `presencePhaseOf` (11/35); `press` (15/35).
- Produces (from the `states` entry): `export const hoverTrigger: StateTrigger`, `export const pressTrigger: StateTrigger`,
  `export const springStateTween: StateTween` (the spring as a `linear()` easing through `resolveWaapiTiming`, from zero
  velocity; `interrupted` received and unused: candidate A, spec §9.2).

- [ ] **Step 1: Write the failing tests** (`states.browser.spec.ts`, the fixture of spec §7: the 200 × 120 px `article`,
      `lift` = `defineMotion('lift', { keyframes: { scale: 1.04 } })` on `hover`, `dip` on `press`, through `attach()`; the
      `connectMotion()` half of A3 is Task 22/35, the React half Task 25/35). One test per case, named by its id:
  - A1 hover, press, release, leave: holds 1.04 (inline `1.04` when `HOLD_MODE` is `inline`), 0.96, 1.04, rest; no jump at each
    change; at the end inline `scale` empty and `getAnimations()` empty; with a class `scale: 1.1` at rest, the last read 1.1.
  - A2 press first (Space held on the focused card), then the pointer enters: 0.96 for ten frames, `getAnimations().length`
    unchanged; key up: to 1.04, no jump.
  - A4 the list of (type, `detail.trigger`, `detail.phase`, `detail.outcome`) for A1 equals the expected list (write it out in
    the test); a parent listener receives none; a replaced transition ends `cancelled` before the next start.
  - A5 a touch pointer: `hover` never active, `press` active.
  - A6 Enter and Space start the press; key up and blur end it; a repeated keydown does not restart it.
  - R1 policy reduced, A1's sequence: each hold read in the task of its event; `getAnimations()` empty throughout; every event
    `reduced: true`, both received before the triggering handler returns.
  - R5 (hover): the policy turns to reduced during a hover transition: at its end at the next read.
  - P8 a hover on a leaving element (phase `exit`) creates nothing.
  - R4 (states): R1's assertions under `--udx-motion: none` and under `--udx-motion-scale: 0`.
  - O1 (states): `detach()` during a hold and during a return: nothing inline, no animation, no listener (a later pointer
    event changes nothing).
  - Review Focus 5: a hover whose name is defined after `states` has landed, and one whose module lands after the name is
    defined: in both, nothing is written before both, then A1's first hold.
  - `press.browser.spec.ts`: core's cases, unchanged, against the copy.
- [ ] **Step 2: Run** `MOTION_BROWSERS=chromium npx vitest run --project browser src/triggers/states.browser.spec.ts`: FAIL.
- [ ] **Step 3: Implement** spec §3.2 (`hover`: `pointerenter`, `pointerleave`, touch ignored, first `set` from
      `matches(':hover')`; `press`: a thin state on `press(element, onStart)`, pointer part only on SVG), §3.4 (levels 5 and 7),
      §3.8 (state rows).
- [ ] **Step 4: Run:** PASS (Chromium); `tsc`.
- [ ] **Step 5: Commit** `feat(motion): hover and press as state triggers`.

### Task 17/35: the `drivers` entry, mechanics: entry, loader, exports (block 6/12) — group 4, after 15/35

Implementer: Haiku, effort `high`. Review: Sonnet. Runs alone, after Task 15/35's commit (the same seven shared files).

**Files:**

- Create: `src/driver-entry.ts`, `src/feature-loader.cold-drivers.browser.spec.ts`
- Modify **[shared]**: `src/feature-loader.ts` (`provideDrivers`, `driversModule`, `loadDrivers`), `src/attach.ts` (`scroll` starts
  `loadDrivers`), `vite.config.mts` (`drivers: 'src/driver-entry.ts'`), `package.json` (`./drivers`, both blocks),
  `scripts/package-exports.test.mjs`, `.size-limit.json` (`drivers`, 4 kB until measured; `./drivers.js` in `core`'s `ignore`),
  `src/index.ts` (`loadDrivers`)

**Interfaces:**

- Consumes: `registerBuiltInTrigger` (12/35).
- Produces: the `@udixio/motion/drivers` entry (`driver-entry.ts`, calling `provideDrivers`; Task 18/35 adds the trigger);
  `loadDrivers(): Promise<void>`.

- [ ] **Step 1: Write the failing tests** (`feature-loader.cold-drivers.browser.spec.ts`, as the states one): `attach with
    scroll starts the load of drivers`; `a failed load leaves the element at rest, reports once, and a later attach tries again`.
- [ ] **Step 2: Run** in Chromium: FAIL. **Step 3: Implement.** **Step 4: Run:** PASS; `tsc`.
- [ ] **Step 5: Commit** `feat(motion): a lazy drivers entry`.
- [ ] **Step 6 (controller):** build; `node --test scripts/package-exports.test.mjs`; both cold files in three engines.

### Task 18/35: the scroll trigger and its measure (block 6/12) — group 4, after 17/35, ∥ 16/35

Implementer: Haiku, effort `max`. Review: Sonnet. Touches no shared file.

**Files:**

- Create: `src/scroll-progress.ts`, `src/triggers/scroll.ts`, `src/scroll-progress.spec.ts`, `src/triggers/scroll.browser.spec.ts`
- Modify: `src/value-binding.ts` (its document measure calls `documentScrollProgress`; behaviour unchanged, M2),
  `src/driver-entry.ts` (registers `scroll`, re-exports `scroll-progress.ts` and `scrollTrigger`)

**Interfaces:**

- Consumes: `registerBuiltInTrigger`, `TriggerRuntime`, `ScrollOptions`, `ViewRangeName` (12/35); `claimsOf(…).drive` (10/35).
- Produces (`scroll-progress.ts`):
  - `export function documentScrollProgress(view: Window, axis: 'block' | 'inline'): number` (the code moved from
    `value-binding.ts`);
  - `export type ViewOffset = { readonly name: ViewRangeName; readonly percent: number }`;
    `export function parseViewRange(range: ViewRangeName | readonly [string, string]): readonly [ViewOffset, ViewOffset]`
    (`'cover'` is `cover 0%` to `cover 100%`; each offset a name with a percentage; throws on `cross`, `enter`, `scroll`);
  - `export type ScrollOffset = { readonly percent: number } | { readonly px: number }`;
    `export function parseScrollRange(range: 'scroll' | readonly [string, string]): readonly [ScrollOffset, ScrollOffset]`
    (`'scroll'` is `0%` to `100%`; an offset is a percentage or a length, bare or after the word `scroll`: `['0%', '50%']`,
    `['scroll 10%', '400px']`; a view name throws);
  - `export function scrollRangeProgress(position: number, room: number, range: readonly [ScrollOffset, ScrollOffset]): number`
    (pure; `position` the scroll offset, `room` the scrollable length; a percentage is of `room`; clamped to 0..1);
  - `export function viewProgress(geometry: { start: number; size: number; viewport: number }, range: readonly [ViewOffset, ViewOffset]): number`
    (pure; `start` is the element's start edge relative to the scrollport's start edge, `size` its size on the axis, `viewport`
    the scrollport's size; result clamped to 0..1);
  - `export function containerProgress(container: Element, axis: 'block' | 'inline'): number` (`scrollTop / (scrollHeight -
clientHeight)`, magnitude of `scrollLeft` for RTL).
- The algorithm of `viewProgress` (CSS view-progress ranges, not fixed by the spec): with `T` = `start`, `H` = `size`,
  `S` = `viewport`, each range name is a pair of `T` values at 0 % and 100 %:

  | Range            | `T` at 0 %      | `T` at 100 %    |
  | ---------------- | --------------- | --------------- |
  | `cover`          | `S`             | `-H`            |
  | `contain`        | `max(S - H, 0)` | `min(S - H, 0)` |
  | `entry`          | `S`             | `S - min(H, S)` |
  | `exit`           | `min(0, S - H)` | `-H`            |
  | `entry-crossing` | `S`             | `S - H`         |
  | `exit-crossing`  | `0`             | `-H`            |

  An offset `(name, p)` is `T0 + (T100 - T0) * p / 100`; the progress is `(Tstart - T) / (Tstart - Tend)`, clamped. Under
  `track: 'container'` the range is `scroll` or a pair of scroll offsets (`scrollRangeProgress` over `containerProgress`'s
  position and room), spec §3.2 "The ranges, by track"; from HTML a mismatched name is reported once and the track's default
  is used (Task 22/35).

- Produces: `export const scrollTrigger: DriverTrigger`.
- **Oracle for the table** (review 13, I2): before writing it, check each row against MDN's `<timeline-range-name>` page and
  the CSS Scroll-driven Animations draft; cite both in a comment above `viewProgress`, and correct the table in this plan
  (through the controller) if a row differs.

- [ ] **Step 1: Write the failing tests.**
  - `scroll-progress.spec.ts`: `viewProgress at the two ends and the middle of each range` (`S = 800`, `H = 200` and `H = 1200`:
    `cover` at `T = 800` is 0, at `T = 300` is 0.5, at `T = -200` is 1; `contain` with `H = 1200`: 0 at `T = 0`, 1 at `T = -400`;
    one row per name); `an offset pair maps between names` (`['entry 0%', 'cover 50%']`); `parseViewRange refuses cross, enter and scroll`; `parseScrollRange reads bare and prefixed offsets, percentages and lengths, and refuses a view name`; `scrollRangeProgress at the ends and the middle of ['scroll 10%', '400px']`.
  - `scroll.browser.spec.ts`: S1 `parallax` over `cover`, forwards and backwards: `translate` at five scroll positions equals
    `48 → -48` interpolated, within 1 px; with `--udx-motion-scale: 0.5` the same distances. S2 the same five, within 1 px, one
    frame after each scroll, with `ViewTimeline` and `ScrollTimeline` deleted from `window` before `loadDrivers()` (a
    fresh module: write it as the cold specs do). S3 `container`; `track: 'container'` with its default, with `['0%', '50%']` and with
    `['scroll 10%', '400px']`; a view range pair; `axis: 'inline'`: a read at start, middle and end of each, native and
    JavaScript within 1 px of each other. S4 a hover (`states`) on `{ y: -10 }` over a scroll motion on `y`; the pointer leaves while the
    page scrolls by script: while hovered `y` is the hover's; after the leave no jump beyond the scroll's own move
    (`expectNoJump` with a reference: the driver alone on a twin); at the end the only animation is the driver's. R3 under the
    policy: no animation, rest; turning it back starts at the current position; turning it on again removes it. A `driver`
    dispatches no `motion-start`. O1 (driver): `detach()` during a hover held above the driver: nothing inline, no animation.
  - **I2, the fallback against the native timeline for every range name**: in an engine whose window has `ViewTimeline` (the
    test skips itself elsewhere, and says so), for each of `cover`, `contain`, `entry`, `exit`, `entry-crossing`,
    `exit-crossing`, with an element shorter and one taller than the scrollport: the native animation's value and the
    JavaScript fallback's (the same motion on a twin driven by `viewProgress`) at seven scroll positions, within 1 px.
- [ ] **Step 2: Run:** FAIL.
- [ ] **Step 3: Implement** spec §3.2 (`scroll`), §3.8 (scroll row): `timeline()` returns a `ViewTimeline` or `ScrollTimeline`
      when the window has them (typed locally, M13), else `null` and `watch()` measures, throttled to one read per frame on
      `scroll` and `resize`, and the registry seeks a paused animation (`currentTime = progress * duration`). Timing and delay
      ignored; `linear`, `fill: 'both'`. A reserved `view` kind refuses the trigger with today's report.
- [ ] **Step 4: Run** the unit file; the browser file in Chromium; `value-binding.browser.spec.ts` in Chromium (unmodified): PASS.
- [ ] **Step 5: Commit** `feat(motion): the scroll trigger, on native timelines or a measured fallback`.
- [ ] **Step 6 (controller, after 16, 18 and 19):** build; the new browser files and `value-binding.browser.spec.ts` in three
      engines (the I2 case runs where `ViewTimeline` exists); size and ledger.

### Task 19/35: states under interruption, transforms and CSS transitions (block 6/12) — group 4, after 16/35 and 18/35

Implementer: Haiku, effort `max`. Review: Sonnet. Fixes go in `claims.ts` **[shared]** or `player.ts` only; a fix that
changes a rule of spec §3.4 goes back to the designer.

**Files:**

- Create: `src/triggers/states-interruption.browser.spec.ts`
- Modify (only if a case fails): `src/claims.ts`, `src/player.ts`

- [ ] **Step 1: Write the tests**, one per case, through `attach()`:
  - A7: an element centred with `left: 50%` and `translate: -50% 0px` (Tailwind's `left-1/2 -translate-x-1/2` written inline:
    the motion package has no Tailwind build) and a hover on `{ y: -2 }`: its bounding rect's `x` moves less than 0.5 px at every
    frame of the hover, the hold and the return; `y` goes to -2 and back; the inline value while held is `-50% -2px` (when
    `HOLD_MODE` is `inline`); at the end nothing inline. The same with `scale: 1 0.5` at rest and `{ scaleX: 1.1 }`; and with
    `translate: 0px 0px 10px` (Review Focus 1: z kept).
  - A8: the card with `transition: scale 200ms, translate 200ms, rotate 200ms` as Tailwind's utility writes it (the values of
    Task 2/35's spike file), then `transition: all`: A1's sequence; at the hold, twenty frames at 1.04 and no `CSSTransition`
    of `scale` in `getAnimations()`; the return ends at rest with no jump.
  - I1 hover left at about 40 %: no jump, back to rest, nothing inline. I2 press released at about 40 % with the hover still
    active: no jump, ends at 1.04. I3 ten hovers and leaves within 300 ms (`userEvent` with no awaits between moves): ends at
    rest; at most one animation at any read; as many `motion-end` as `motion-start`.
  - I4 pointer down at about 40 % of the hover's transition; the press reaches its hold before the hover's transition would
    have ended: from the pointer down, at most one registry animation on `scale`; the hover's `motion-end` is `cancelled`; no
    jump; twenty frames at 0.96; pointer up: to 1.04, no jump.
  - C1 during `rise`'s entry (`y`), a hover on `{ x: 8 }`: covered (`y` and `opacity` within 1 px and 0.02 of a reference entry on a
    twin, frame by frame; `x` does not move); after the entry `x` goes to 8 with no jump; leave: rest; nothing inline.
  - C2 a hover on `scaleX` while a kept frame holds `scaleY` (`play({ keyframes: { scaleY: 0.5 } })`): both read while hovered;
    after the leave `scaleY` 0.5 and `scaleX` 1.
- [ ] **Step 2: Run** in Chromium. Expected: PASS; a failure is fixed in `claims.ts` or `player.ts` with the case as its test.
- [ ] **Step 3: Commit** `test(motion): states keep the other axis, survive CSS transitions and interruptions` (`fix(motion): …`
      for a fix, with its paths).
- [ ] **Step 4 (controller):** the file in three engines.

### Task 20/35: the old bindings claim through the bridge; a trigger given both ways (block 7/12) — group 5

Implementer: Haiku, effort `max`. Review: Sonnet.

**Files:**

- Modify: `src/bind.ts` **[shared]** (`claimExternally` where `traceSources` is called today: `createBinding`, `createRevealBinding`;
  the legacy presence is not bound, or destroyed, when the element has a new `presence`), `src/continuous.ts` (`claimExternally`
  where the scrub and the loop create and cancel their animations; the legacy `scrub` yields to a new `scroll`), `src/attach.ts`
  (the reverse: attaching `presence` or `scroll` destroys the legacy one already bound; one development report per element
  naming both), `src/claims.ts` **[shared]** (the legacy end of spec §5.2: hold written again, hand-down, or a kept frame)
- Create: `src/coexistence.browser.spec.ts`

**Interfaces:**

- Consumes: `claimExternally`, `onExternalClaims` (8/35); `getMotion` (existing); `getBinding` (12/35).
- Levels (spec §5.1): `appear`, `disappear` 9 from each entry or exit until it ends (an exit: until hidden, removed or shown);
  `emphasize` 8 per play; `reveal` 8 while it waits out of view in its first frame and per play; `scrub`, `loop` 3 while their
  animation exists; `layout` none. Source name `legacy:<verb>`. Properties: whole (`translate`, `scale`).

- [ ] **Step 1: Write the failing tests** (`coexistence.browser.spec.ts`, through `motion()` / `motionsWhenDefined()` and
      `attach()`; the HTML and React halves are Tasks 22/35 and 25/35):
  - X1 a legacy `fade` and a new `hover` `lift`: both play; `getMotion(el, 'presence')` and `getBinding(el, 'hover')` both defined.
  - X2 a legacy emphasis `press` (the preset) played while the hover holds 1.04: the emphasis is seen; at its end the scale is
    1.04 at the next read, no frame at 1 (three engines: review 12, M3).
  - X3 a legacy `slide` entry with a hover on `{ x: 8 }` starting during it: covered until the entry ends, then to 8, no jump.
  - X4 a legacy `fade` and a new presence `rise`: one entry, `rise`'s; one development report; in both orders of binding.
  - X5 a legacy entry that ends at `scale: 1.1` leaves it inline and `claims()` lists it as a kept frame (level 2).
  - A `scroll` and a legacy `parallax` scrub on one element: the scrub is not bound; one report.
- [ ] **Step 2: Run** in Chromium: FAIL.
- [ ] **Step 3: Implement** spec §5.1, §5.2. A page with no new trigger pays one `WeakMap` write per legacy play; the
      `continuous` entry imports `claim-bridge.ts` only.
- [ ] **Step 4: Run** the file in Chromium; then, unmodified, `bind.browser.spec.ts`, `scrub.browser.spec.ts`,
      `loop.browser.spec.ts`, `reveal.browser.spec.ts` in Chromium: PASS.
- [ ] **Step 5: Commit** `feat(motion): legacy bindings claim their channels, and a new trigger wins over its legacy kind`.
- [ ] **Step 6 (controller):** the coexistence file and every existing browser spec of `packages/motion` in three engines (X6);
      `continuous`'s size line stays green (ceiling 8.1 kB, at most +0.5 kB with the measure in the report).

### Task 21/35: the phase mark on both sides, and the layout tests that should fail (block 7/12) — group 5, after 20/35

Implementer: Haiku, effort `high`. Review: Sonnet.

**Files:**

- Modify: `src/bind.ts` **[shared]** (the legacy presence writes `data-motion-phase` beside its old mark, through `writePhase`),
  `src/layout/flush.ts` (`isPresenceBusy` through `presencePhaseOf`), `src/shared-registry.ts`, `src/layout/scope.ts` (through
  `presencePhaseOf`, or the presence of either attribute), `src/layout/types.ts` (`IGNORED_ATTRIBUTES` gains `data-motion-phase`,
  M5), `src/box.ts` (TSDoc names both marks)
- Create: `src/layout-held-state.browser.spec.ts`
- Test: `src/triggers/presence.browser.spec.ts` (P7's legacy half appended)

- [ ] **Step 1: Write the tests.**
  - P7 (legacy half): a legacy presence writes both marks, `data-motion-phase` `enter | rest | exit` at the three moments.
  - `layout-held-state.browser.spec.ts`, **written as `it.fails(...)`** (spec §10, 7/12): L1 a card with `reflow` (legacy) and a
    hover on `{ y: -4 }`, hovered at rest: the layout binding's handle stays `null`; then a sibling is removed: the flight ends
    with `y` at -4, no jump at its start or end. L2 the pointer enters during the flight: no jump; at the end the card is in its
    new place with `y` at -4. L3 the pointer leaves during the flight; and a flight that starts during the hover's transition:
    no jump, the card ends in place at rest, the hover's events complete.
- [ ] **Step 2: Run** in Chromium. Expected: P7 FAILS (then passes after Step 3); each L case is reported as an expected
      failure. **If an L case passes as it is** (`it.fails` turns red), report it: the controller tells the designer and its part
      of spec §3.9 is dropped from Task 27/35.
- [ ] **Step 3: Implement** spec §3.6 for the legacy side and the reader in the files above.
- [ ] **Step 4: Run** the two files and, unmodified, `layout.browser.spec.ts`, `shared-registry.browser.spec.ts`,
      `scope.browser.spec.ts`, `motion-box.browser.spec.ts` in Chromium: PASS (the L cases as expected failures).
- [ ] **Step 5: Commit** `feat(motion): both presences write data-motion-phase, read through one function`.

### Task 22/35: the HTML attributes in the scanner (block 8/12) — group 6

Implementer: Haiku, effort `max`. Review: Sonnet.

**Files:**

- Create: `src/html-triggers.ts` (the one module that reads the attributes: spec §10's "the attributes are read in one
  module"), `src/html-triggers.spec.ts`, `src/connect-triggers.browser.spec.ts`
- Modify: `src/connect.ts` (selects and observes the attributes, one `attach` per element, `update` on change, `detach` when
  the last goes; a trigger defined after connect re-calls `observe()` with the new `attributeFilter`)

**Interfaces:**

- Consumes: `attach`, `Attached`, `ViewRangeName` (12/35); `onTriggerDefined`, `BUILT_IN_TRIGGERS` (11/35).
- Produces (`html-triggers.ts`):
  - `export const OLD_PRESENCE_MARKS: ReadonlySet<string>` (`entering, present, exiting`);
  - `export function triggerAttributes(defined: Iterable<string>): string[]` (every attribute name to select and observe);
  - `export function readTriggerAttributes(element: Element, defined: Iterable<string>, report?: (message: string) => void): Attached | null`
    (pure on the attributes; `null` when the element has none; the table of spec §3.10: booleans `"true"`, `"false"`, the
    attribute alone is `true`; a range pair split on the comma; `data-motion-scroll-container` looked up in the document, a
    selector that matches nothing reported and dropped; an unknown option of a built-in trigger reported).

- [ ] **Step 1: Write the failing tests.**
  - `html-triggers.spec.ts` (U9; a minimal element with `getAttribute`, `attributes`): one test per row of spec §3.10; `an exit
alone`; `a range pair` (`'entry 0%, cover 50%'`); ``data-motion-scroll-range="cover"`with`data-motion-scroll-track="container"`is reported once and reads`scroll` (S3, HTML); an unknown option of hover is reported` (`data-motion-hover-hold`);
    `data-motion-presence="present" is the mark, not a trigger`; `a defined trigger and its options` (`data-motion-ping-count="2"`
    gives `triggers: { ping: { motion, count: '2' } }`).
  - `connect-triggers.browser.spec.ts`: F1 an `li data-motion-presence="rise"` appended to a scanned list: after one microtask
    opacity 0 and `translate` `0px 24px`; the first rAF frame has opacity under 0.1; no frame reads opacity 1 before the entry
    ends. F4 content present at connect: no animation, nothing inline, phase `rest`. A3 (HTML) A1's four holds through
    `data-motion-hover="lift" data-motion-press="dip"`. X1, X4 (HTML) with `data-motion` on the same element. O3 (HTML) the
    three defined triggers through `data-motion-<name>`. O9 removing `data-motion-hover` from a hovered element hands the scale
    back with its return; removing the last attribute detaches. `a trigger defined after connect is observed` (spec §3.10
    [Test]: `observe()` called again on the same root replaces its options, in three engines). Review Focus 4: a removed
    element is detached: `getAnimations()` empty, a later `pointerenter` creates nothing.
- [ ] **Step 2: Run:** FAIL.
- [ ] **Step 3: Implement.** The scanner passes `enterOnAttach: false` for its first scan and `true` for an insertion.
      `data-motion` keeps working beside, on the same element too.
- [ ] **Step 4: Run** the two files; `connect.browser.spec.ts` unmodified, in Chromium: PASS.
- [ ] **Step 5: Commit** `feat(motion): the scanner reads one attribute per trigger`.

### Task 23/35: inspect and revert see the new model (block 8/12) — group 6, ∥ 22/35

Implementer: Haiku, effort `high`. No task review.

**Files:**

- Modify: `src/scope-entry.ts` (`MotionInspection` gains the triggers of each attached element and its `claims()`; `revert`
  calls `detach` on every attachment and removes `data-motion-phase` with the old mark)
- Test: `src/scope.browser.spec.ts` (O2 appended as a new `describe`)

**Interfaces:**

- Consumes: `attachmentsOf` (12/35), `claimsOf` (8/35).
- Produces: `MotionInspectionBinding` unchanged; `export interface MotionInspectionAttachment { readonly element: Element; readonly triggers: readonly string[]; readonly claims: readonly ClaimView[] }`
  and `MotionInspection.attachments: readonly MotionInspectionAttachment[]`.

- [ ] **Step 1: Write the failing test:** O2 `inspect lists triggers and claims per channel` (a card with hover held: one entry
      with `triggers ['hover', 'press']` and a `scaleX` and `scaleY` claim of level 5, `top: true`); `revert detaches the new
triggers` (nothing inline, no animation, no mark, no listener).
- [ ] **Step 2: Run** in Chromium: FAIL. **Step 3: Implement.** **Step 4: Run:** PASS, the existing cases unchanged.
- [ ] **Step 5: Commit** `feat(motion): inspect and revert know triggers and claims`.

### Task 24/35: React: the props of `<Motion>` and the object form of `useMotion` (block 9/12) — group 6

Implementer: Haiku, effort `max`. Review: Sonnet.

**Files:**

- Modify: `packages/ui-react/src/lib/motion/Motion.tsx`, `packages/ui-react/src/lib/hooks/useMotion.ts` (M3),
  `packages/ui-react/src/lib/motion/index.ts` (types re-exported)
- Create: `packages/ui-react/src/tests/Motion.triggers.spec.tsx` (jsdom), `packages/ui-react/src/tests/Motion.types.spec.tsx`
  (T4, T5, T6; type-only)

**Interfaces:**

- Consumes: `attach`, `Triggers`, `Attachment`, `Binding` (Task 12/35), `MotionStartEvent`,
  `MotionEndEvent` (Task 7/35).
- Produces:
  - `MotionOwnProps` gains `presence?: Triggers['presence']`, `hover?: Triggers['hover']`, `press?: Triggers['press']`,
    `scroll?: Triggers['scroll']`, `triggers?: Triggers['triggers']`, `onMotionStart?: (event: MotionStartEvent) => void`,
    `onMotionEnd?: (event: MotionEndEvent) => void`. `name`, `present`, `restoreFocus` and every prop of today stay; `present` and
    `restoreFocus` feed both sides.
  - `export interface UseMotionTriggers extends Triggers { present?: boolean; name?: MotionSource | readonly MotionSource[]; restoreFocus?: UseMotionOptions['restoreFocus']; onMotionStart?: (event: MotionStartEvent) => void; onMotionEnd?: (event: MotionEndEvent) => void }`;
  - `useMotion<T extends MotionElement = HTMLElement>(options: UseMotionTriggers): UseMotionReturn<T>` as an overload beside
    today's `useMotion(source, options?)`. **Discrimination (M14):** today's first argument is a string, an array, or an object
    with `keyframes`, `spec` **or `verb`** (`{ verb: 'layout' }` has no keyframes); anything else is the object form.
  - `MotionControls` gains `binding(trigger: string): Binding | undefined`; `play(what?)` keeps today's meaning for no argument
    and the five kind words, otherwise calls `Attachment.play`.

- [ ] **Step 1: Write the failing tests.**
  - `Motion.triggers.spec.tsx` (jsdom; `Element.prototype.animate` is absent there, so assert wiring, not motion):
    `a trigger prop attaches once through the ref callback` (`getBinding(el, 'hover')` defined after render);
    `a changed trigger prop updates, the element is not re-attached` (`getBinding(el, 'hover')` is a new binding,
    `getBinding(el, 'presence')` the same object); `a new restoreFocus function per render does not re-attach`;
    `onMotionEnd is a listener on the rendered element` (a `motion-end` `CustomEvent` dispatched on it reaches the prop);
    `with as={Component}, hover and press go to the box`; `enterOnAttach is false while hydrating` (`hydrateRoot` on server
    HTML: `getBinding(el, 'presence').active` is true and the phase is `rest`); `useMotion({ presence })` returns `ref, mounted,
play, binding` and `getBinding`; `useMotion({ verb: 'layout' })` is today's form.
  - `Motion.types.spec.tsx`: T4 and T5 lines of spec §7.3 verbatim (`@ts-expect-error` for the failing ones); T6 one line per
    Udixio component exported by `@udixio/ui-react` through `as={Component}` with one of its native attributes and `hover="lift"`.
- [ ] **Step 2: Run** `cd packages/ui-react && npx vitest run src/tests/Motion.triggers.spec.tsx`: FAIL; and
      `NX_IGNORE_UNSUPPORTED_TS_SETUP=true node_modules/.bin/tsc -p packages/ui-react/tsconfig.spec.json --noEmit | grep Motion.types.spec.tsx`
      (from the root; `ui-react` has pre-existing errors elsewhere, `docs/component-authoring.md` §5): errors listed.
- [ ] **Step 3: Implement** spec §3.11: one ref callback attaches both sides (`motionsWhenDefined` as today, one `attach` for
      the triggers); `mounted` stays true until both exits have ended; listeners added in the ref callback.
- [ ] **Step 4: Run** both checks: PASS and no error in `Motion.types.spec.tsx`; then the whole `ui-react` suite
      (`npx vitest run` in `packages/ui-react`: it is light) unmodified: PASS.
- [ ] **Step 5: Commit** `feat(ui-react): Motion takes presence, hover, press, scroll and triggers, and useMotion an object form`.

### Task 25/35: React in a real browser: an unlisted test fixture (block 9/12) — group 6, after 22/35 and 24/35

Implementer: Haiku, effort `high`. No task review. The controller builds and runs the suite in three engines.

**Files:**

- Create: `apps/doc/src/pages/motion/fixtures/step3-react.astro` (unlisted, `noindex`, `data-pagefind-ignore="all"`, as
  `fixtures/components.astro`), `apps/doc/src/examples/react/motion-fixture-step3-react.tsx`,
  `apps/doc/tests/motion-step3-react.browser.test.mjs` (written as `components-box.browser.test.mjs`)

- [ ] **Step 1: Write the fixture and the tests.** The fixture renders, each in a `section` with an `id` the test targets: a
      card `<Motion as="article" hover="lift" press="dip">` (A3 React); a list whose Udixio `Button` "Add" appends
      `<Motion as="li" presence="rise">` and whose parent records, in a layout effect, the item's opacity and `translate` into a
      `data-first-frame` attribute (F3); the same list hydrated with items present (`client:load`) (F4); a
      `<Motion presence="rise" restoreFocus={() => opener.current}>` whose parent re-renders ten times during the entry through a
      state counter, and a `scroll={{ motion: 'parallax', container: ref.current }}` in a scrolling panel (O8); `name="fade"
hover="lift"` (X1) and `name="fade" presence="rise"` (X4). Controls are Udixio components; styles are Tailwind tokens.
      Tests, one per case id: A3 the four holds of A1; F3 `data-first-frame` reads opacity 0 and `0px 24px`; F4 no animation,
      nothing inline, phase `rest`; O8 the entry's `currentTime` only grows across the re-renders, one `motion-start` and one
      `motion-end`, the exit moves focus to the latest function's element, the scroll animation is the same object after the
      re-renders; X1 both bindings; X4 one entry, `rise`'s.
- [ ] **Step 2: Check:** `node --check tests/motion-step3-react.browser.test.mjs`; the throwaway-tsconfig sweep on the new
      `.tsx`. Commit `test(doc): React cases of the motion slice in three engines`.
- [ ] **Step 3 (controller):** build (recipe), then
      `MOTION_BROWSERS=<e> MOTION_DOC_URL=http://localhost:4322 node --test --test-concurrency=1 tests/motion-step3-react.browser.test.mjs`
      for `chromium`, `firefox`, `webkit` in series. A failure goes back to Task 24/35's implementer, fresh if needed.

### Task 26/35: Svelte attaches without an entry over page content (block 9/12) — group 6, ∥ 17, 18, 19

Implementer: Haiku, effort `max`. Review: Sonnet (`inserted.ts` is a new core interface). The mechanism is the spec's §3.7
"Svelte, and how it knows" (designer's answer to question 5): read it whole before starting.

**Files:**

- Create: `packages/motion/src/inserted.ts`, `packages/motion/src/inserted.browser.spec.ts` (the unit test of the module: it
  needs a DOM and `MutationObserver`, which the Node `unit` project lacks)
- Modify: `packages/motion/src/index.ts` **[shared]** (the only task of group 6 that edits it),
  `packages/ui-svelte/src/lib/motion/motion.attachment.svelte.ts` (calls `watchInsertions()` when the module is evaluated; the
  default of `settled` becomes `!insertedByScript(target)`; an explicit `settled` and the old mark `present` still win; the old
  writing stays)
- Create (O5): `packages/tailwind/tests/motion-svelte-hydration.browser.spec.ts`, in the form of
  `packages/tailwind/tests/switch-svelte-hydration.browser.spec.ts` (Node environment, an SSR build and a client build with
  Vite, the server markup parsed by the page, then hydrated, Playwright in `motionBrowsers`), with its fixtures
  `packages/ui-svelte/tests/fixtures/motion-hydration.svelte`, `motion-hydration-server.ts`, `motion-hydration-client.ts`
  (as `switch-hydration*`)
- Modify: `packages/tailwind/vite.config.ts` (the new file in the `exclude` list beside the other hydration specs),
  `.github/scripts/tailwind-motion-discovery.test.mjs` (the new file in its list), each as the existing hydration specs are

**Interfaces:**

- Produces (`inserted.ts`, exported from the main entry):
  - `export function watchInsertions(document?: Document): void`: once per document, a `MutationObserver` (`childList`,
    `subtree`) that records in a `WeakSet` every node added while `document.readyState !== 'loading'`;
  - `export function insertedByScript(element: Element): boolean`: drains the pending records with `takeRecords()` first, then
    true when the element or one of its ancestors is in the set; false for a document never watched.

- [ ] **Step 1: Write the failing tests.**
  - `inserted.browser.spec.ts`: `a node added while the document loads is page content` (an `iframe` whose document is
    `open()`ed: `readyState` is `'loading'` until `close()`; `watchInsertions(doc)`, a node written then, `close()`: false);
    `a node added after loading is inserted by script` (true); `a descendant of an added node is inserted` (an `li` inside an
    appended `ul`: true); `the records are drained in the same task` (append then `insertedByScript` with no await: true);
    `a node added before watchInsertions is page content` (false); `watching twice adds one observer`.
  - `motion-svelte-hydration.browser.spec.ts` (O5): server-rendered content with `{@attach motion('fade')}`, parsed by the page
    and hydrated: no animation (`getAnimations()` empty), nothing inline, old mark `present`; an element that an `{#if}`
    creates after hydration plays its entry (an animation is running at the next frame).
- [ ] **Step 2: Run** `cd packages/motion && MOTION_BROWSERS=chromium npx vitest run --project browser src/inserted.browser.spec.ts`:
      FAIL. The O5 file is run by the controller (it builds).
- [ ] **Step 3: Implement** the Interfaces and the adapter's default.
- [ ] **Step 4 [shared]:** export `watchInsertions`, `insertedByScript` from `index.ts`.
- [ ] **Step 5: Run** `inserted.browser.spec.ts` in Chromium; the motion specs of `ui-svelte` unmodified
      (`cd packages/ui-svelte && npx vitest run`); `nx typecheck ui-svelte`: PASS, no new error.
- [ ] **Step 6: Commit** `fix(ui-svelte): server content attaches without replaying its entry, from a signal of the document`
      (`inserted.ts` in the same commit, or a `feat(motion)` commit before it).
- [ ] **Step 7 (controller):** build; `inserted.browser.spec.ts` in three engines; the O5 file in three engines, run as the other
      `*-svelte-hydration.browser.spec.ts` files are; the measure of spec §7.5 "Svelte server content" (before and after) in the
      step's report; the `core` figure in the ledger (spec §6.2 counts `inserted.ts` in its 0.2 kB line).

### Task 27/35: layout with a held state (block 10/12) — group 7

Implementer: Haiku, effort `max`. Review: Sonnet. Takes only the L cases that Task 21/35 found failing. **Fallback** (review 13, I5): if a first attempt
leaves an L case failing, the controller sends the failing tests, the diff and the implementer's report to an Opus subagent
(effort `medium`) for a diagnosis of the cause; the next fix round, by a fresh Haiku, starts from that diagnosis.

**Files:**

- Modify: `src/layout/flush.ts` (at rest: when the visual box differs, compare `toLayoutBox` of it with the cached layout box;
  equal: refresh the cached rest and visual box, play nothing; before planning a flight: `settleClaims(element, ['x', 'y',
'scaleX', 'scaleY'])`), `src/layout.ts` (exports `retarget`, `isFlying`), `src/claim-bridge.ts` (`registerSettler`,
  `settleClaims`), `src/claims.ts` **[shared]** (registers its settler; while `layoutEngine()?.isFlying(element)`, a hold or
  release on the four channels applies at once and calls `layoutEngine()?.retarget(element)`)
- Test: `src/layout-held-state.browser.spec.ts` (`it.fails` turned into `it`; L4 added: the three with a press on `scale`)

**Interfaces:**

- Produces (`layout.ts`): `export function retarget(element: HTMLElement): void` (plans the flight again from where the element
  is, with its velocity, through `flyingChange`, towards the new rest); `export function isFlying(element: HTMLElement): boolean`.
- Produces (`claim-bridge.ts`): `export function registerSettler(element: Element, settle: (channels: Iterable<string>) => void): () => void`;
  `export function settleClaims(element: Element, channels: Iterable<string>): void`. The bridge's TSDoc names its two roles (what animates an element outside the registry, and how others reach the registry
  without importing it; review 13, M4). **Why the bridge and not `claimsOf`**
  [Design: spec §3.9]: `layout.js` is measured alone and has 0.76 kB free; importing `claims.ts` would put the registry in it.

- [ ] **Step 1:** turn L1 to L3 into `it`, add L4; run in Chromium: FAIL (the cases Task 21/35 found failing).
- [ ] **Step 2: Implement** spec §3.9.
- [ ] **Step 3: Run** the file and, unmodified, `layout.browser.spec.ts`, `layout-loader.browser.spec.ts`, `shared.browser.spec.ts`
      in Chromium: PASS.
- [ ] **Step 4: Commit** `fix(motion): a layout flight and a held state neither jump nor lose each other`.
- [ ] **Step 5 (controller):** the four files in three engines; `layout`'s size line green (at most +0.5 kB, with the measure).

### Task 28/35: the weight (block 11/12) — controller, with a Haiku for the edits

Implementer: Haiku, effort `high`, for Steps 2 and 4 only.

**Files:** `packages/motion/.size-limit.json`, `size-report.json`, `scripts/size-report.test.mjs` (if it lists entries),
`docs/superpowers/reports/2026-11-28-motion-step3-slice.md` (section "Weight")

- [ ] **Step 1 (controller): Build and measure** (load below 4): `npx nx build @udixio/motion --skip-sync`, `@udixio/core`,
      `@udixio/ui-react`, `ui-svelte` (each `--skip-sync`), `npx nx build ui-angular --skip-sync --exclude-task-dependencies`,
      `npx nx build @udixio/mcp --skip-sync`; in `packages/motion`: `node scripts/size-report.mjs`, `npx size-limit --json`.
- [ ] **Step 2:** `.size-limit.json`: the `core` limit is `"27 kB"` (raised at the first measure above 25 kB, Global Constraints); a line
      `{ "name": "core-new", "path": "dist/index.js", "import": "{ attach, defineMotion, defineTrigger, getBinding }", "gzip": true, "limit": "<measure × 1.05, up to 0.1 kB>" }`;
      `states` and `drivers` limits set to their measure rounded up to the next 0.1 kB plus 5 %, never above 2.5 and 4 kB
      without a line in the report.
- [ ] **Step 3 (controller): judge** (spec §6.3). `core` at most 27 kB: go on. `core-new` above 12 kB: write it in the report;
      step 4/8 starts by moving something out. `core` above 27 kB: Step 4, then measure again; still above: stop, the figures go
      to the designer.
- [ ] **Step 4 (only if above 27 kB): the lever.** `html-triggers.ts` becomes a lazy module the scanner loads when its first scan
      meets one of the attributes (a sixth loader in `feature-loader.ts`, written as the others, and its line in `ignore`); an
      element inserted before it lands attaches without an entry. Its test: F1 still passes once the module is warm; a cold
      insertion attaches without an entry.
- [ ] **Step 5:** `node scripts/size-report.mjs`; `npm run size` in `packages/motion`: PASS. Report: each entry before and after,
      and `core-new`. Commit `build(motion): the coexistence ceiling of the core and two new entries, measured`.

### Task 29/35: the candidate tweens B and C (spec §9.2) — group 8, after 28/35

Implementer: Haiku, effort `max`. No task review (fixture code; part 2/4 of Task 35/35 reviews the one that ships).

**Files:**

- Create: `apps/doc/src/examples/react/motion-fixture-step3-tweens.ts`, `packages/motion/src/state-tween-candidates.browser.spec.ts`
  (imports the fixture file by relative path: a test of fixture code, not of the package)

**Interfaces:**

- Consumes: `StateTween`, `setStateTween` (Task 7/35); `stepSpring`, `SpringState` (`spring-step.ts`); `springOffset`,
  `springVelocity` (`@udixio/motion/layout`); `springParams` (`tokens.ts`), all public today.
- Produces: `export const jsSpringTween: StateTween` (B: one write per frame with `stepSpring`, keeps its velocity when its
  target changes); `export const sampledSpringTween: StateTween` (C: a WAAPI animation whose keyframes are the spring sampled
  from the current value with the current velocity, read from `interrupted`, as `sampleFlight` and `velocityOf` do in
  `layout/flight.ts`). Neither is exported by the package.

- [ ] **Step 1: Write the failing tests:** for each of A (`springStateTween`), B, C installed with `setStateTween`: a hover on
      `{ scale: 1.12 }` with `spring.fast.spatial`, left at 40 % (scale 4, crossing): the velocity in the first frame after the
      interruption, divided by the velocity in the last frame before, is above 0.5 for B and C (kept) — A is recorded, not
      asserted; every candidate ends at rest with nothing inline.
- [ ] **Step 2: Run** in Chromium: FAIL. **Step 3: Implement.** **Step 4: Run:** PASS.
- [ ] **Step 5: Commit** `test(doc): two candidate state tweens for the demo, each a StateTween`.

### Task 30/35: the measures of spec §7.5 — controller, with a Haiku for the script

Implementer: Haiku, effort `high`, writes the script. The controller runs it.

**Files:**

- Create: `packages/motion/bench/step3-run.mjs`, `packages/motion/bench/step3-page.html` (written as `run.mjs` and
  `page.html`: a Vite server rooted at the package, `server.fs.allow` widened to the repository for the fixture tweens; the
  three engines in series)
- Modify: `packages/motion/bench/README.md` (one paragraph), `docs/superpowers/reports/2026-11-28-motion-step3-slice.md`

- [ ] **Step 1:** the script writes `bench/step3-report.json` (ignored, as `report.json`) with: the interrupted hover for A, B,
      C, with `spring.default.spatial` and `spring.fast.spatial` (the scale at each frame from 100 ms before to 400 ms after, the
      velocity per second in the last frame before and the first after, the largest change of velocity between two frames);
      S5, the first frame of a `scroll` motion while `drivers` loads, cold and warm (frames painted at rest before the first driven
      frame, size of the jump); the scale in a cascade and a sequence (whether `stagger.ts` and `sequence.ts` multiply their
      delays and offsets by the scale: one read of the code, one browser read each, answer for step 4/8, nothing changed).
- [ ] **Step 2: Check:** `node --check bench/step3-run.mjs`; commit `chore(motion): the step 3/8 measures`.
- [ ] **Step 3 (controller):** run it; write the figures in the report with the weight of B and C (esbuild, as
      `size-report.mjs` measures adapters). Not judged.

### Task 31/35: the facts in the docs, the README, the manifest (spec §8, first table) — group 8, after 29/35, ∥ 32/35 to 34/35

Implementer: Haiku, effort `high`. No task review.

**Files:**

- Modify: `apps/doc/scripts/motion-api.groups.mjs` **[shared]** (a group `{ id: 'triggers', title: 'Triggers and attach (new
model: HTML and React)' }` after `attach`, listing every export added by Tasks 3 to 23 of this plan, and the `states` and
  `drivers` entries), `apps/doc/src/data/motion-api.json` (`node scripts/motion-api.mjs`, then `--check`),
  `apps/doc/src/lib/motion-glossary.ts` (attach, binding, trigger, event contract, state contract, driver contract, channel,
  frame, rest, kept frame, phase: one to three sentences each, "HTML and React for now" where a writing is named; nothing
  removed), `apps/doc/src/lib/motion-facts.ts` and the Loading and weight page (`apps/doc/src/pages/motion/loading-and-weight.astro`,
  `components/motion/WeightTable.astro`: the two new chunks, `core-new` filtered out, one sentence on why the core is above its
  25 kB until the end of step 5/8), `apps/doc/src/pages/motion/roadmap.astro` (step 3/8 done and what it covers),
  `packages/motion/README.md` **[shared]** (a section "The new model (preview: HTML and React)": `attach`, the four triggers, the
  order of the registry, one screen, a link to the model spec), `docs/motion/reduced-render.md` (the four forms and the four
  triggers' defaults beside the old table), `packages/motion/src/manifest.ts` **[shared]** and
  `scripts/generate-motion-manifest.mjs` (fields added only, version 1 kept: `triggers` from `BUILT_IN_TRIGGERS`, `claimLevels`,
  `spatialProperties`), `motion-manifest.json` and `packages/mcp/src/bundled/motion-manifest.json` (regenerated),
  `src/manifest.spec.ts` (a test per new field)

- [ ] **Step 1: Write the failing tests:** `manifest.spec.ts` `the manifest lists the triggers, the claim levels and the spatial
properties` (equal to `BUILT_IN_TRIGGERS`, `CLAIM_LEVELS`, `[...SPATIAL_PROPERTIES]`); `apps/doc/scripts/motion-api.test.mjs`
      gains `the triggers group lists attach, defineTrigger, getBinding, claimsOf, presenceTrigger`.
- [ ] **Step 2: Run** both: FAIL. **Step 3: Write** the content above. **Step 4: Run:** PASS; `generate-motion-manifest.mjs --check`,
      `motion-api.mjs --check`; the throwaway-tsconfig sweep.
- [ ] **Step 5: Commit** `docs(motion): the facts of the new model in the API, glossary, weight, README and manifest`.

### Task 32/35: the demo page (a): the page, the bar and the slice (spec §9, §9.1) — group 8, after 29/35

Implementer: Haiku, effort `max`. No task review; **the controller looks at it** after Task 34/35.

The composition of the page (grid, hierarchy, size of the traces, where the figures sit, how the `Slider` carries the uneven
stops 0, 0.25, 0.5, 1, 2, 4) is decided by the designer (Fable) before Task 32/35 starts (review 13, I4; `CLAUDE.md`): the
controller pastes it in the three briefs. Content and words come from spec §9. One `astro dev` at a time, on port 4330, with
the load rule; never the shared `:4321` server; stop it by its PID.

**Files:**

- Create: `apps/doc/src/pages/motion/fixtures/step3-slice.astro` (unlisted, `noindex`, out of the sitemap by the existing
  `/motion/fixtures/` filter of `astro.config.ts`, `data-pagefind-ignore="all"`; four sections with `id`s `slice, spring,
html-writing, scale`, the last three empty until Tasks 33/35 and 34/35), `apps/doc/src/examples/html/motion-fixture-step3.html`,
  `apps/doc/src/examples/react/motion-fixture-step3.tsx`, `apps/doc/src/examples/react/motion-fixture-step3-bar.tsx`
- Test: `apps/doc/tests/motion-step3-demo.browser.test.mjs` (Chromium is enough: it checks the page, not the engine)

**Interfaces:**

- Produces: the page and its section `id`s; the bar island `MotionFixtureStep3Bar` (a `Switch` "Reduced motion" that sets
  `data-motion-policy="reduce"` on `<html>`, a `Slider` "Speed" that sets `--udx-motion-scale` on `main`, with the caption
  "Speed above 1 slows the new writing only.").

- [ ] **Step 1: Write the failing tests:** `the demo has its four sections and its bar`; `the bar sets the policy and the scale`
      (the stop 4 sets `--udx-motion-scale: 4` on `main`); `the live line names the top claim` (pointer down on a 9.1 card: the
      line reads `scale: press (7) over hover (5)`).
- [ ] **Step 2: Build** the bar and §9.1 (two columns HTML and React with their sources; Add and Remove `Button`s; `rise` in,
      `fade` out written apart; `lift` and `dip` on each card; a `parallax` image with `container`; the live line from
      `claims()`; the line of what to try). Cards that carry `hover` or `press` are plain `article` elements with theme tokens;
      one React example may use `<Motion as={Card}>` after re-reading `card.behavior.ts` and `card.style.ts` (M11). Legacy
      blocks carry "old writing: not slowed above 1".
- [ ] **Step 3: Check** on `npx astro dev --port 4330`: the test in Chromium PASS. **Step 4: Commit**
      `docs(motion): the step 3/8 demo page, its bar and the slice`.

### Task 33/35: the demo page (b): the spring of a held state (spec §9.2) — group 8, after 32/35

Implementer: Haiku, effort `max`. No task review.

The composition of the page (grid, hierarchy, size of the traces, where the figures sit, how the `Slider` carries the uneven
stops 0, 0.25, 0.5, 1, 2, 4) is decided by the designer (Fable) before Task 32/35 starts (review 13, I4; `CLAUDE.md`): the
controller pastes it in the three briefs. Content and words come from spec §9. One `astro dev` at a time, on port 4330, with
the load rule; never the shared `:4321` server; stop it by its PID.

**Files:** Create `apps/doc/src/examples/react/motion-fixture-step3-spring.tsx`; Modify the page (section `spring`) and the
test file.

**Interfaces:**

- Consumes: `jsSpringTween`, `sampledSpringTween` (29/35), `springStateTween` (16/35), `setStateTween` (7/35).
- Produces: the island `MotionFixtureStep3Spring`: three cards (A, B, C), each installing its tween with `setStateTween` while
  its hover runs; a `Button` "Interrupt at 40 %", a `Switch` "Repeat", a `Tabs` for `spring.fast.spatial` or
  `spring.default.spatial`; under each card the trace of its scale over the last second (inline SVG, theme token classes) and
  the velocities just before and after the interruption; the recommendation C in two lines; under reduced motion, a line that
  says nothing springs.

- [ ] **Step 1: Write the failing test:** `Interrupt at 40 % draws three traces` (three `polyline`s with points; six velocity
      figures). **Step 2: Build.** **Step 3: Check** (Chromium) and **Step 4: Commit** `docs(motion): the demo compares three
    springs for a held state`.

### Task 34/35: the demo page (c): the HTML writing and the scale (spec §9.3, §9.4), and the look — group 8, after 33/35

Implementer: Haiku, effort `max`. No task review; **the controller looks at it** (spec §9.5) before gate 2/3.

The composition of the page (grid, hierarchy, size of the traces, where the figures sit, how the `Slider` carries the uneven
stops 0, 0.25, 0.5, 1, 2, 4) is decided by the designer (Fable) before Task 32/35 starts (review 13, I4; `CLAUDE.md`): the
controller pastes it in the three briefs. Content and words come from spec §9. One `astro dev` at a time, on port 4330, with
the load rule; never the shared `:4321` server; stop it by its PID.

**Files:** Create `apps/doc/src/examples/react/motion-fixture-step3-writing.tsx`, `motion-fixture-step3-scale.tsx` (or HTML
blocks where the section is markup only); Modify the page and the test file.

- [ ] **Step 1: Write the failing tests:** `the two writings show the same list with their markup` (§9.3: "Today", "New", the
      greyed "at step 5/8" line, the block "What the old writing cannot say"); `the scale section reads distance and time`
      (§9.4: `Tabs` 1, 0.5, 0.25; "Replay"; two figures under each card); `every control is a Udixio component` (no `button`,
      `input`, `[role=tab]` outside the components' own markup and the HTML example).
- [ ] **Step 2: Build** §9.3 and §9.4 with their sentences (a 120 px rise defined for the page; the new card through `attach`,
      the legacy one through `data-motion`).
- [ ] **Step 3: Check** the test in Chromium; screenshots at 1280 and 375 px, light and dark, "Reduced motion" on; criticise them
      (spec §9.5: no layout shift when a trace updates, the keyboard path of 9.1, 9.2 under reduced motion).
- [ ] **Step 4: Commit** `docs(motion): the demo shows the two HTML writings and the scale under each rule`.
- [ ] **Step 5 (controller): Gate 2/3.** Build; open the page; walk Joël through 9.3, 9.4, then 9.2 (spec §9.5); paste his
      answers in Task 1/35 · Step 2.

### Task 35/35: what follows Joël's answers ("gate 3/3", block 12/12)

Four parts. Parts 1/4 and 2/4 run in parallel, each when its answer exists; part 3/4 after part 1/4; part 4/4 last.

#### Part 1/4: the scale (question 2)

Implementer: Haiku, effort `max`. No task review (the final review covers it).

- **If the answer is "a faster motion" (recommended):** spec §5.3 as written. Modify `src/play.ts` (`playMotion`),
  `src/bind.ts` (`writeFrame`, `playEntry`), `src/continuous.ts` (the loop), `src/scroll.ts` (the scrub): no call of
  `amplitudeOf`, `distanceScaleOf`; `motionScaleIn` loses its upper bound; `startRoutedMotion` accepts a scale above 1
  (`timing-integration.ts`, line 78); the layout flight reads the unbounded scale. `amplitudeOf`, `distanceScaleOf` keep their
  export with a TSDoc line: "No longer called; removed at the end of step 5/8." Tests: in `scrub.browser.spec.ts` ("scales the
  distance of its keyframes by --udx-motion-scale"), `loop.browser.spec.ts`, `play.browser.spec.ts`, `bind.browser.spec.ts`,
  `fallbacks.browser.spec.ts`, each assertion on a scaled distance becomes the full distance (read with the code it tests);
  assertions that only slow or stop stay; `amplitude.spec.ts` stays; `timing-integration.spec.ts`'s refusal above 1 becomes an
  acceptance. Docs: README "Document motion scale" and Loop; the doc pages that describe the scale (grep `udx-motion-scale`
  in `apps/doc/src`); the grep of model §7.3 for `amplitudeOf`, `distanceScaleOf` in `apps/doc` and the sweep. The demo's
  "old writing: not slowed above 1" labels and the caption under "Speed" go. Commit
  `feat(motion)!: the scale slows or speeds every motion and never changes a distance`. Controller: every edited spec in three
  engines.
- **If "a smaller motion":** stop; the inverse task (model §7.8) goes to the designer first.

#### Part 2/4: the state tween (question 3)

Implementer: Haiku, effort `max`. Review: Sonnet.

- **A:** nothing to change; the report says so. **C (recommended)** or **B:** `src/state-tween.ts` ships the chosen one as
  `springStateTween`, written from Task 29/35's fixture into the package (the sampler of C from `spring.ts`, not from the
  layout chunk); the fixture file then imports it. Test: Task 29/35's velocity assertion for the shipped tween, moved into
  `src/triggers/states.browser.spec.ts`. Weight: the `states` line within 2.5 kB, else the figure goes to the designer. The
  `CLAUDE.md` sentence on the engine and the fate of the `css` and `animejs` providers are **not** edited by the implementer:
  the controller proposes the sentence to Joël (CLAUDE.md is his). Commit `feat(motion): held states keep their velocity when
interrupted` (or the B wording).

#### Part 3/4: the pages that teach the writing (question 1)

Implementer: Haiku, effort `high`. After part 1/4. If the answer to question 1 is no, stop: the scanner's reading goes back to
the designer (model §5.5).

- A page `hover-press`: `apps/doc/src/pages/motion/_hover-press.astro`, served by the prefixed route as the other
  `_<slug>.astro` pages, with `apps/doc/src/examples/html/motion-hover-press.html` and `react/motion-hover-press.tsx`; the
  Angular and Svelte readings show "Arrives with step 5/8." in place of the example. Content: spec §8, second table.
  `motion-nav.ts` **[shared]**: a `MotionNeed` `{ slug: 'hover-press', label: 'Hover and press', section: 'Motions', perFramework: true, tabs: ['guide'], … }`. Sections added to `_presence.astro` ("An exit written apart (HTML and React for
  now)", the mark `data-motion-phase`), `_scrub.astro` ("The scroll trigger (HTML and React for now)"), `_accessibility.astro`
  (the reduced form of the four triggers), `_troubleshooting.astro` ("My entry jumps back when it ends"). The `/motion` home and
  "Coming from Motion" are not touched. Tests: `apps/doc/tests/framework-url.test.mjs` (the new feature's tabs and paths),
  `motion-examples.test.mjs` (the new examples). Look at the pages in a browser, light and dark, reduced motion. Commit
  `docs(motion): hover and press, the exit written apart and the scroll trigger, for HTML and React`.

#### Part 4/4: verification, the report, the model — controller

- [ ] **Step 1: Build** (Task 28/35 · Step 1) and the doc (`cd apps/doc && npm run docgen && npm run docgen:check &&
node scripts/motion-api.mjs --check && npx astro build`).
- [ ] **Step 2: Package suites:** in `packages/motion` `npx vitest run --project unit`; `node --test scripts/*.test.mjs`;
      `npm run size`; `MOTION_BROWSERS=<e> npx vitest run --project browser` per engine, in series (a file that fails alone is
      re-run alone). React `npx vitest run`; Angular `cd packages/ui-angular && npx jest -c jest.config.cjs`; Svelte vitest and
      `nx typecheck ui-svelte`; core `--project unit` and `CORE_BROWSERS=<e> --project browser` (core's `press.ts` untouched).
- [ ] **Step 3: Doc suites,** one file at a time, three engines: `motion-step3-react`, `motion-step3-demo` (Chromium),
      `motion`, `animation`, `pages`, `framework-urls`, `components-box`, `recipes` (known flakes: HANDOFF).
- [ ] **Step 3b:** regenerate the MCP's bundled copy of the docs (`packages/mcp/src/bundled/doc-src`, with `packages/mcp/scripts/snapshot.ts`, model §7.4) after the doc changes of Tasks 31/35 to 35/35.
- [ ] **Step 4: Look** at the demo and the part 3/4 pages, 1280 and 375 px, light and dark, reduced motion; criticise.
- [ ] **Step 5: Sweeps:** the throwaway-tsconfig sweep of `apps/doc`; `grep -rn "from './bind\|from './play\|from './slots\|from './named-motion" packages/motion/src/{keyframes,axis-base,timing-plan,reduced-form,claims,claim-bridge,player,trigger,attach,presence-state,events,press,state-tween,state-entry,scroll-progress,driver-entry,html-triggers}.ts packages/motion/src/triggers/*.ts` finds nothing.
- [ ] **Step 6: Report** `docs/superpowers/reports/2026-11-28-motion-step3-slice.md`: the no-jump calibration, the spike's
      verdict (a link), the weight before and after per entry and `core-new`, the measures of §7.5, the L cases that were real,
      the answers to questions 1 to 6, every acceptance case of spec §7 met or not.
- [ ] **Step 7: The model.** Carry the six deviations of spec §1.2 into `docs/superpowers/specs/2026-11-28-motion-model-design.md`
      (each a decision the model records that changed: CLAUDE.md, "The spec changes only when a decision it records changes"),
      through the designer, then a final review (Sonnet, effort `high`) of the whole step.

---

## Questions

For Joël (the controller asks; answers pasted in Task 1/35 · Step 2):

1. **The HTML writing** (spec §11.1, §9.3): one attribute per trigger instead of the list `data-motion="a b"`. Recommended:
   yes. Asked in Task 1/35; blocks Task 22/35 (the scanner) and Task 35/35 · part 3/4.
2. **What a scale between 0 and 1 is for** (spec §11.2, §9.4): a faster motion (recommended) or a smaller one. Asked in Task
   1/35; blocks Task 35/35 · part 1/4.
3. **The spring of held states and the engine** (spec §11.3, §9.2): A, B or C; recommended C; with it the `CLAUDE.md` sentence on
   anime.js and the `css` provider. Blocks Task 35/35 · part 2/4. Asked at gate 2/3.

Settled by the designer (2026-11-28, spec revision 2, the addendum of §13):

4. **Ranges by track** (Tasks 17/35, 18/35): spec §3.2 "The ranges, by track" and the `ScrollOptions` union of §3.3.
5. **The Svelte hydration signal** (Task 26/35): `inserted.ts` (`watchInsertions`, `insertedByScript`), spec §3.7.
6. **The layout reaches the registry through `claim-bridge.ts`** (Task 27/35): confirmed, spec §3.9.
7. **"Hover and press"** goes in Motions, after Emphasis (spec §8). The menu and home regrouping of the model's §6 has its own
   plan.
