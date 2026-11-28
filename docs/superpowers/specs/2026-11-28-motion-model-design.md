# @udixio/motion: the vocabulary and the model (step 2/8)

Date: 2026-11-28. Branch: `feat/anime`. Status: design, nothing coded. Revision 2, after review 10
(`.superpowers/sdd/2026-11-17-animation-docs/review10-model-components-30.md`) and review 11. The maintainer delegated the
open choices to the control session ("fais ce qui te semble le plus recommandé"), which applied the reviews'
recommendations; he has not seen the two writings of §8 himself. What the revisions changed is listed in §10.

This spec turns the joint proposal validated by the maintainer
(`.superpowers/sdd/2026-11-17-animation-docs/plan-commun-motion-components-30-94.md`, §1 to §4) into a decided model. It is
step 2/8 of the rework. Steps 3/8 to 8/8 implement it; the regrouping of the `/motion` home and menu (§6) comes right
after this step, with the pages and cards that exist today.

Tags: **[Doc]** read in the repository's code or in an official documentation (the source is named); **[Design]** a choice
of this spec; **[Hyp]** an assumption; **[Test]** to be measured before it is relied on.

Sources read: the plan, `audit-motion-components-30.md`, `review9-plan-components-30.md`, `review10-model-components-30.md`, `handoff-audit-motion.md`,
`decisions-2026-11-28-components-f5.md`; in `packages/motion`: the README, the manifest, `define-motion.ts`,
`motion-spec.ts`, `presets.ts`, `contract.ts`, `bind.ts`, `play.ts`, `animate.ts`, `viewport.ts`, `value.ts`,
`gesture.ts`, `slots.ts`, `named-motion.ts`, `amplitude.ts`, `flip.ts`, `tokens.ts`, `policy.ts`,
`providers/waapi.ts`, the heads of `sequence.ts`, `continuous.ts` and `connect.ts`, and `gesture-binding.ts` and
`value-binding.ts` by search; `packages/core/src/lib/dom/press.ts` and `snackbar.ts`; React `Motion.tsx`,
`Presence.tsx`, `useMotion.ts`; the Angular and Svelte motion adapters by their signatures;
`docs/superpowers/specs/2026-11-28-framework-urls-and-motion-syntax-design.md` §3 and §4;
`apps/doc/src/lib/motion-nav.ts`. Third parties, official pages fetched on 2026-11-28: MDN (Keyframe formats,
`KeyframeEffect()`, `Animation`, `Element.animate()`, `IntersectionObserver()`, `ViewTimeline`, `animation-range`,
`translate`, `:focus-visible`, `linear()`, the microtask guide), motion.dev (motion component, AnimatePresence, gestures,
hover, drag, `useScroll`, `animate`), animejs.com (timeline time position, keyframes, playback settings). Not done:
nothing was run in a browser; the layout engine (`layout/`) was not re-read.

---

## 1. Principles

1. **A box of blocks, not a catalogue** (the maintainer's principle). A complete case (a toast, a dialog, a swipe, a
   reorderable list) is built with public blocks only. Closed lists become open values; the tokens are the defaults.
2. **What moves is written apart from when it moves.** A motion never names its trigger; a trigger takes any motion.
3. **Three public contracts for "when"**: event, state, driver. The inside is one player (§3.9); the three contracts are
   what a user reads and implements.
4. **One word per thing, one thing per word** (§2).
5. **The guards stay** (§3.10): they are defaults of the blocks, not closed lists.
6. **Close to Motion for React by usefulness, not by writing** (the maintainer, 2026-11-28): the same things can be done;
   each syntax stays idiomatic (§5).

---

## 2. Vocabulary

### 2.1 The public words

| Word                  | One-sentence definition                                                                                                                                                                                                        |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **motion**            | What moves: keyframes, a timing and a reduced form, written once and given a name (`defineMotion`) or written inline; it says nothing about when it plays.                                                                     |
| **keyframe**          | One step of a motion: CSS values by property name, with an optional place (`offset`) and an optional easing to the next keyframe; one type, `StyleKeyframe`.                                                                   |
| **timing**            | How a motion gets from a keyframe to the next: a spring (a token or free parameters) or a curve (a duration and an easing).                                                                                                    |
| **token**             | A named value of the system (a spring, a duration, an easing, a distance, a stagger step), which a motion refers to by name and may replace by a raw value.                                                                    |
| **preset**            | A motion that ships already written (`@udixio/motion/presets`); it has no privilege.                                                                                                                                           |
| **trigger**           | What decides when a motion plays on an element; every trigger follows one of three contracts.                                                                                                                                  |
| **event** (contract)  | A trigger that fires: the motion plays once per occurrence, from its first keyframe to its last.                                                                                                                               |
| **state** (contract)  | A trigger that is active or not: while it is active the element holds a frame, and when it stops what is under it takes over again.                                                                                            |
| **driver** (contract) | A trigger that gives a progress from 0 to 1: the motion is at that progress, forwards and backwards.                                                                                                                           |
| **frame**             | The keyframe a state holds: the last keyframe of the motion given to the state.                                                                                                                                                |
| **rest**              | What the stylesheet gives the element when no motion holds it; a motion that ends at rest leaves nothing inline. A **kept frame** is a last keyframe left inline on purpose (§3.5).                                            |
| **target**            | What a motion plays on: the element, each item of a list (a cascade), each piece of a split text, the stroke of an SVG shape, two elements linked by a key.                                                                    |
| **presence**          | The trigger of an element that enters and leaves the page; it has two slots, `enter` and `exit`.                                                                                                                               |
| **present**           | The boolean that says whether the element is there.                                                                                                                                                                            |
| **layout**            | The element follows its own box when its place or size changes; it has no keyframes, so it is not a motion but a trigger apart, with a timing.                                                                                 |
| **shared**            | A key two elements carry so that the layout travels from one to the other.                                                                                                                                                     |
| **attach**            | To give an element its triggers; the result is an attachment, made of bindings. (In Svelte, "attachment" is also the framework's own word for what `{@attach}` takes; the glossary says so.)                                   |
| **binding**           | One trigger attached to an element: its current handle, its options, its detach.                                                                                                                                               |
| **handle**            | The control of one play: play, pause, reverse, seek, speed, progress, finish, cancel, and a promise of its end.                                                                                                                |
| **sequence**          | Named steps that play in order from one root, with one handle.                                                                                                                                                                 |
| **value**             | A continuous number written to a CSS variable: from the pointer, the scroll, a drag, a number the app sets, or another value.                                                                                                  |
| **drag**              | The block that moves an element with the pointer, within bounds, and releases it on a spring.                                                                                                                                  |
| **interaction**       | A complete behaviour built on the blocks (`swipe`, `reorder`); not a motion.                                                                                                                                                   |
| **reduced form**      | What a trigger shows under the reduced-motion policy: `fade`, `end`, `start`, `none` or a keyframe.                                                                                                                            |
| **channel**           | The unit of arbitration: one CSS property, or one axis of a shorthand (`x` and `y` are two channels of `translate`).                                                                                                           |
| **phase**             | Where a presence or a state is: `enter`, `rest` or `exit`; one vocabulary for the events (presence and states) and for the mark on the element, `data-motion-phase`, **which is the presence's only**: a state writes no mark. |
| **policy**            | The page's reduced-motion switch (`@udixio/motion/policy`).                                                                                                                                                                    |

"Recipe" in the plan (French "recette") is the **motion** of this table. The public English word stays "motion" because
"Recipes" is already the name of the complete examples in the docs (dialog, toasts…), and `defineMotion` already says
it [Design]. In the conversation, "recette" and "motion" are the same thing.

### 2.2 The senses of "motion": from five to three

| Sense today                                                                                                                           | Fate                                                                                                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The package `@udixio/motion`                                                                                                          | Stays.                                                                                                                                                                                                                                            |
| The concept: keyframes + a verb                                                                                                       | Stays, narrowed: **a motion is what moves** (§2.1).                                                                                                                                                                                               |
| The core function `motion(element, source)`                                                                                           | Renamed `attach(element, triggers)` [Design]. `motionWhenDefined` and `motionsWhenDefined` merge into it: `attach` always waits for an undefined name.                                                                                            |
| The adapters' entry: React `<Motion>`, Svelte `motion()`, Angular's `udxMotion` export                                                | Stays as the third and last sense: "the adapter's entry that attaches". Same word in the three adapters.                                                                                                                                          |
| The `motion` prop of ten Udixio components (`ComponentMotion`: their timing) [Doc: `packages/core/src/lib/interfaces/*.interface.ts`] | A different thing under the same word. Decided: it is renamed `timing`, in a change of its own outside this rework. The prop exists only on `feat/anime` (`ComponentMotion` is absent from `main` [Doc: review 10]), so nothing published breaks. |

### 2.3 The seven verbs and `kind`

A verb welded the trigger, the life cycle, the allowed options and the keyframes [Doc: audit, defect 1]. The field
`verb` leaves `MotionSpec`: it becomes optional at step 3/8 and is removed at the end of step 5/8 (§7.7).

| Verb        | Becomes                                                                                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `appear`    | The trigger `presence`, slot `enter`.                                                                                                                         |
| `disappear` | The trigger `presence` with only `exit`. Gone from what a user sees at step 4/8, once the exit is written apart; from the type at the end of step 5/8 (§7.7). |
| `emphasize` | The trigger `change` (plays when a value changes), or a manual play (`animateStyle(element, motion)`, `play(motion)`).                                        |
| `reveal`    | The trigger `inView`.                                                                                                                                         |
| `scrub`     | The trigger `scroll` (a driver).                                                                                                                              |
| `loop`      | The trigger `loop` (the time driver).                                                                                                                         |
| `layout`    | The trigger `layout`, which takes no motion.                                                                                                                  |

`kind` (`presence | emphasis | layout | view | loop`) is removed as a concept and as a type. "One motion of each
kind, the first listed" is replaced by "one binding per trigger, and arbitration per channel" (§3.5). `MotionKind`,
`kindOf`, `isPresenceVerb`, `listedTarget`, `playListed`, `orderMotions`, `reportSameKind` go;
`getMotion(element, kind)` becomes `getBinding(element, trigger)`.

### 2.4 The sixteen ambiguous names

| #   | Name                                             | Problem [Doc: handoff 16, audit 12]                                     | Fate [Design]                                                                                                                                                                                                                                                                               |
| --- | ------------------------------------------------ | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `emphasize`                                      | A manual trigger named like a style                                     | Removed; the trigger is `change`.                                                                                                                                                                                                                                                           |
| 2   | "Draw attention" (the need of the Emphasis page) | A goal, for what is a trigger                                           | The page is "On change"; until step 5/8 it keeps its slug and says what it is: "replays on a change".                                                                                                                                                                                       |
| 3   | `motion`                                         | Five senses                                                             | Three (§2.2).                                                                                                                                                                                                                                                                               |
| 4   | `appear` / `presence` / `present` / `<Presence>` | Four words for entry and exit                                           | `presence` is the trigger, `enter` and `exit` its two slots, `present` the boolean, `<Presence>` the React component that keeps a leaving child. `appear` goes.                                                                                                                             |
| 5   | `reflow`                                         | A preset to name in order to turn the layout on                         | Removed. The layout is turned on by its trigger, `layout`.                                                                                                                                                                                                                                  |
| 6   | `exit`                                           | Three senses                                                            | One: the exit slot of a presence. The neighbours' flow becomes the presence option `flow: 'keep' \| 'release'` (was `exit: 'in-place' \| 'out-of-flow'`). The scroll range keeps the CSS keyword `exit` only as a value of `range`, where CSS itself names it [Doc: MDN `animation-range`]. |
| 7   | `scale` (preset)                                 | Also a keyframe field                                                   | The preset is renamed `grow`. Rule: a preset never bears the name of a property or of a trigger.                                                                                                                                                                                            |
| 8   | `draw` (preset)                                  | Also a keyframe field                                                   | The preset is renamed `trace`; the field `draw` stays.                                                                                                                                                                                                                                      |
| 9   | `axis`                                           | `block` / `inline` here, `x` / `y` there                                | One rule, written in the glossary: what follows the page (scroll, in view) is logical, `block` or `inline`; what follows the pointer (pointer, drag, swipe, reorder) is physical, `x` or `y`. The option keeps one name, `axis`.                                                            |
| 10  | `settled`                                        | Opaque                                                                  | Becomes the presence option `enterOnAttach` (boolean), with the inverse sense: `settled: true` is `enterOnAttach: false`.                                                                                                                                                                   |
| 11  | `state` (prop, `data-motion-state`)              | Replays an emphasis, replays a reveal or forces a layout, by list order | Removed in that sense. The value whose change replays is the option `watch` of the triggers `change` and `layout`. The word "state" now only means the state contract.                                                                                                                      |
| 12  | `press` (preset)                                 | Named after an event it does not listen to                              | `press` is the trigger; the preset is renamed `dip`.                                                                                                                                                                                                                                        |
| 13  | `repeat` (`once` / `always`)                     | Not a repetition                                                        | Becomes the `inView` option `once` (boolean). A repetition count is `iterations`, as in WAAPI; the word "repeat" is not used.                                                                                                                                                               |
| 14  | `range`                                          | A scroll range here, the bounds of a number there                       | `range` is the scroll range only. A value's bounds are `output`.                                                                                                                                                                                                                            |
| 15  | `reduced`                                        | Five words, two that no verb lets one choose                            | Four forms, all choosable under every trigger: `fade`, `end` (was `instant`), `none` (was `static`, `neutral`, `frozen`: the element keeps its rest), `start`, or a keyframe (as `animateStyle` takes today).                                                                               |
| 16  | `pause: 'control'`                               | A declaration, not a behaviour                                          | Removed as a word. A loop must be given `paused` (a boolean: the behaviour itself) or `essential: '<reason>'` (the WCAG 2.2.2 exception); a loop with neither is refused (§3.10).                                                                                                           |

Also settled here: `step` (React) becomes `sequenceStep`, as the syntax spec already fixed.

### 2.5 The ten presets, written out

Thirteen become ten [decided]. `slide`, `cascade` and `rise` share their keyframes [Doc: `presets.ts`] and become
`rise`; `reflow` goes with its verb. A preset is a motion like any other: the column "written for" says under which
contract its keyframes make sense, not a restriction.

| Preset     | Was                        | Keyframes                                                        | Timing                                                           | Written for                                                                      |
| ---------- | -------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `fade`     | `fade`                     | `[{ opacity: 0 }, { opacity: 1 }]`                               | default                                                          | an event: `presence`, `inView`                                                   |
| `rise`     | `slide`, `cascade`, `rise` | `[{ opacity: 0, y: 24 }, { opacity: 1, y: 0 }]`                  | default                                                          | an event: `presence`, `inView`; a cascade is `rise` plus the element's `stagger` |
| `grow`     | `scale`                    | `[{ opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1 }]`         | default                                                          | an event: `presence`, `inView`                                                   |
| `trace`    | `draw`                     | `[{ draw: 0 }, { draw: 1 }]`                                     | default                                                          | an event (`presence`, `inView`) or the `scroll` driver, on an SVG shape          |
| `dip`      | `press`                    | `{ scale: 0.96 }` (**one keyframe**)                             | default (fast, as a state)                                       | a state: `press`, `hover`, an app state                                          |
| `shake`    | `shake`                    | `[{ x: 0 }, { x: -6 }, { x: 6 }, { x: -4 }, { x: 4 }, { x: 0 }]` | `{ duration: 'duration.medium4', easing: 'easing.linear' }`      | an event: `change`, manual                                                       |
| `parallax` | `parallax`                 | `[{ y: 48 }, { y: -48 }]`                                        | none                                                             | a driver: `scroll` (range `cover`)                                               |
| `spin`     | `rotate`                   | `[{ rotate: 0 }, { rotate: 360 }]`                               | `{ duration: 'duration.extraLong4', easing: 'easing.linear' }`   | the `loop`                                                                       |
| `breathe`  | `breathe`                  | `[{ scale: 1 }, { scale: 1.04 }, { scale: 1 }]`                  | `{ duration: 'duration.extraLong4', easing: 'easing.standard' }` | the `loop`                                                                       |
| `blink`    | `blink`                    | `[{ opacity: 1 }, { opacity: 0.4 }, { opacity: 1 }]`             | `{ duration: 'duration.extraLong4', easing: 'easing.standard' }` | the `loop`                                                                       |

- **`dip` changes shape.** Today's `press` is `[{ scale: 1 }, { scale: 0.96 }, { scale: 1 }]` [Doc: `presets.ts`]: under
  the state contract (go to the last keyframe and hold it) it would hold `scale: 1`, that is nothing. `dip` is the one
  frame a press holds. The old "replay a dip when a count changes" is not a preset any more: a real press uses the
  `press` trigger, and a feedback on a change uses `shake` or a motion of the app.
- The stagger and the scroll range the old presets carried (`cascade`, `rise`, `parallax`) are options of the element
  and of the trigger now (§3.4, §3.3).
- When: the six new or changed names (`grow`, `trace`, `dip`, `spin`, and `rise` and `fade` without a verb) arrive at
  step 3/8 beside the old ones; the old names go at the end of step 5/8 (§7.7).

---

## 3. The model

### 3.1 The motion

```ts
/** One keyframe: CSS values by camelCase property or custom property, the shorthands of §3.1.1, and two reserved keys. */
type StyleKeyframe = Record<string, string | number | null> & {
  /** Where the keyframe sits, from 0 to 1; evenly spaced when left out. */
  offset?: number;
  /** The easing from this keyframe to the next: an easing token or a CSS easing. Curve timings only. */
  easing?: EasingToken | (string & {});
};

type Timing = SpringRef | SpringParams | CurveTiming;

interface MotionSpec {
  /** One keyframe (the end, from the current values) or several. */
  keyframes: StyleKeyframe | readonly StyleKeyframe[];
  /** The timing of every property; without it, the default of §3.1.3. */
  timing?: Timing;
  /** The timing of some properties, by keyframe key (opacity, x, backgroundColor). */
  timingBy?: Readonly<Record<string, Timing>>;
  /** Milliseconds before it starts. A cascade is not a delay: it is the element's stagger (§3.4). */
  delay?: number;
  /** How many times it plays; Infinity is allowed only under the loop trigger. Default 1. */
  iterations?: number;
  /** Play every second iteration backwards. Default false. */
  alternate?: boolean;
  /** The reduced form; without it, the default of the trigger (§3.3). */
  reduced?: 'fade' | 'end' | 'start' | 'none' | StyleKeyframe;
}
```

- **One keyframe type, one read path.** `VisualFrame` is removed. `defineMotion`, an inline spec and `animateStyle`
  take `StyleKeyframe` and go through one function that turns keyframes into WAAPI keyframes, one that resolves the
  timing, and one that writes the end frame and gives rest back to the stylesheet. Today these exist twice: `play.ts`
  (`paintFrame`, `planGroups`, `restingFields`) and `animate.ts` (`waapiKeyframe`, `writeFrame`, `carriedFrames`)
  [Doc]. `animateStyle` stays, with its signature: nineteen files of `packages/core/src/lib/dom` call it
  [Doc: grep, 2026-11-28]. It also takes a motion: `animateStyle(element, 'shake')` is the manual trigger.
- **Any CSS property**, as `animateStyle` already takes [Doc: `animate.ts`]. The browser judges a value; development
  reports a key that is neither a shorthand, a custom property, nor a property the element's style knows.
- **`offset` and `easing` per keyframe** are WAAPI's own: an easing on a keyframe "applies from the keyframe where it
  is specified until the next keyframe" [Doc: MDN, Keyframe formats]. With a spring timing, a keyframe easing is refused
  in development: the spring is the easing.
- **`alternate` and `iterations`** map to `direction: 'alternate'` and `iterations` of the effect
  [Doc: MDN, `KeyframeEffect()`].
- **A free spring** is `SpringParams` (`{ stiffness, dampingRatio }`), the type the tokens already resolve to
  [Doc: `tokens.ts`, `springParams`]. Its `linear()` easing is computed at run time by the analytic spring the package
  already has (`spring.ts`); `linear()` is Baseline widely available [Doc: MDN]. The cost in bytes of sampling at run
  time is measured at step 4/8 [Test].
- **A motion is frozen and canonical** as today (`validateMotionSpec`). The cache that makes structurally equal specs
  share one object is a `Map` that is never emptied [Doc: `define-motion.ts`, `canonicalSpecs`]: it is kept for
  **named definitions only**. An inline spec is validated and frozen but not retained: a binding compares the content key
  of the new spec with the one it holds, so a frame computed at each render (`{ keyframes: { x: index * 100 } }`) leaves
  nothing behind.

#### 3.1.1 Shorthands, `%` and `transform`

- The shorthands stay: `x`, `y`, `scale`, `scaleX`, `scaleY`, `rotate`, `draw`, `along`. They write the individual
  properties `translate`, `scale`, `rotate`, the stroke dash and `offset-distance`, never `transform`
  [Doc: `play.ts`, `paintFrame`].
- A number keeps its unit of today (px for `x` and `y`, degrees for `rotate`). A string is taken with its unit:
  `x: '100%'` moves the element by its own width, since a percentage of `translate` refers "to the size of bounding
  box" [Doc: MDN, `translate`]; `calc()` and `var()` are accepted.
- **`%` and the layout engine.** `flip.ts` reads a percentage of `translate` as 0 [Doc: `flip.ts`, `offset`].
  Rule: the engine reads the used translation in pixels; a percentage is resolved against the element's border box,
  measured in the same read. `parseOwnTransform` takes the box.
- **`transform`** is an ordinary CSS property of a keyframe: one property, one unit of arbitration. The package does not
  compose it with the shorthands. Development warns once per element when a motion writes `transform` on an element that
  has a layout trigger: the layout corrects the individual properties only. The core's own controllers move to the
  shorthands as they are touched (§7.1).

#### 3.1.2 `--udx-motion-scale`: one rule

Today [Doc: README, "Document motion scale"; `timing-integration.ts` (`route.duration * scale`); `amplitude.ts`;
`animate.ts`; `continuous.ts`]: a named motion multiplies **its distances and its durations** by the scale;
`animateStyle` multiplies its duration only; a loop multiplies both; and six CSS transitions of the core's styles write
`calc(<duration> * var(--udx-motion-scale, 1))`. The duration is what every path has in common; only the named motions
add the distances. (Revision 1 of this spec, after the joint plan, had the premise wrong.)

The rule [decided, review 10's recommendation]:

- **The scale multiplies durations and delays, everywhere**: a motion under any event or state trigger,
  `animateStyle`, the period of a loop, a `delay`, the delays of a cascade and its cap, the offsets of a sequence, a
  layout flight (which reads the scale today [Doc: `layout/flush.ts`]), and the CSS transitions of the core.
- **It never changes a distance.** The amplitude role is removed: `amplitudeOf` and `distanceScaleOf` go, and a keyframe
  is played as written. This is the only rule that extends to open keyframes: a colour or a width has a duration and no
  distance.
- **At 0 there is no motion**: every trigger shows its reduced form, as under the policy (today's behaviour of every
  path): nothing animates, and each element is where its trigger's reduced form puts it.
- **Above 1 it is slow motion, in JavaScript as in CSS.** Today JavaScript bounds the scale to 0..1
  [Doc: `motion-style.ts`; `timing-integration.ts` refuses a scale above 1] while a CSS `calc()` does not, so "one
  rule" was only true between 0 and 1. The upper bound goes: a scale of 10 plays everything ten times slower, to look
  at a motion. A negative value is 0; an absent or non-numeric one is 1.
- Not touched: a `scroll` or `pointer` driver, which has no duration (0 still turns it off), and the release of a drag,
  which is a spring in JavaScript (0 still writes it at once), as today.
- **What a value between 0 and 1 is for: a faster motion, never a smaller one.** 0.5 plays everything in half the time,
  at its full distance. Nothing sets such a value today outside the tests [Hyp]. This is the one point of the revision
  the maintainer may want to see (§8, question 2): if he wants the scale as a setting of amplitude, the rule is the
  other one and §7.8 says what would then migrate instead.

#### 3.1.3 The default timing

Today the default depends on the verb and splits "spatial" fields from opacity [Doc: `play.ts`, `planGroups`].
One rule [Design]:

- Each property is **spatial** or **effects**. Spatial: the shorthands except `draw`, and the CSS properties of place and
  size (`translate`, `scale`, `rotate`, `transform`, `offset-distance`, widths and heights, insets, margins, paddings,
  gaps, radii). Effects: everything else (opacity, colours, filters, clips, shadows, the stroke dash). The list is one
  exported constant, `SPATIAL_PROPERTIES`; an unknown property is effects.
- Without `timing`, a spatial property takes the spatial spring and an effects property the effects spring, of the speed
  of the trigger's contract: `default` for an event, `fast` for a state. The `scroll` and `pointer` drivers take no
  timing. The layout takes `spring.default.spatial`.
- `timing` applies to every property; `timingBy` overrides it per key. The per-verb defaults of the manifest go.
- **An exit is the exception that stays**: without a timing of its own, every property of an exit takes the effects
  spring, as today (`disappear`: `spring.default.effects` [Doc: manifest, `defaults`]), so that nothing overshoots while
  it leaves. The time driver (`loop`) takes `{ duration: 'duration.extraLong4', easing: 'easing.linear' }`, as today.

#### 3.1.4 The reduced form

| Form       | What the element shows under the policy, `--udx-motion: none` or a scale of 0                                                                                                                                                                                                                                                                                            |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `fade`     | Only `opacity` animates, on `spring.default.effects`: the opacity keyframes of the motion, or a plain fade (0 to 1 on an enter, 1 to 0 on an exit) when it has none. Every other property is set at once: to the end on an enter, kept as it is on an exit. Under `--udx-motion: none` or a scale of 0, `fade` is `end`. This generalises `fadeFrames` [Doc: `play.ts`]. |
| `end`      | The last keyframe, at once.                                                                                                                                                                                                                                                                                                                                              |
| `start`    | The first keyframe, at once.                                                                                                                                                                                                                                                                                                                                             |
| `none`     | Nothing is written: the element keeps its rest.                                                                                                                                                                                                                                                                                                                          |
| a keyframe | That keyframe, at once.                                                                                                                                                                                                                                                                                                                                                  |

The default of each trigger is in §3.3. Every form can be asked under every trigger, and `fade` is defined for each
contract: under an event or a presence, as above; under a state, the opacity of the frame animates and every other
property of the frame is set at once, in both directions; under a driver there is nothing to fade, and `fade` is `none`.

### 3.2 The three contracts

```ts
interface EventTrigger<O = unknown> {
  readonly contract: 'event';
  /** Call fire at each occurrence. Returns what stops watching. */
  watch(element: MotionElement, fire: () => void, options: O): () => void;
}
interface StateTrigger<O = unknown> {
  readonly contract: 'state';
  /** Call set when the state becomes active or stops; the first call gives the current state. */
  watch(
    element: MotionElement,
    set: (active: boolean) => void,
    options: O,
  ): () => void;
}
interface DriverTrigger<O = unknown> {
  readonly contract: 'driver';
  /** A timeline the browser runs by itself, when it has one for these options. */
  timeline?(element: MotionElement, options: O): AnimationTimeline | null;
  /** Otherwise: call set with each progress, from 0 to 1. */
  watch(
    element: MotionElement,
    set: (progress: number) => void,
    options: O,
  ): () => void;
}
function defineTrigger<N extends string>(
  name: N,
  trigger: EventTrigger | StateTrigger | DriverTrigger,
): N;
```

- The package's own triggers are written on these contracts and exported. A user defines a trigger the same way; a
  defined name is usable in `attach`, in the Svelte attachment, and as `data-motion-<name>` in HTML. React and Angular
  reach a custom trigger through their `triggers` escape (§5).
- What each contract does with a motion:
  - **event**: plays the motion once, from its first keyframe (or from the current values when it interrupts, §3.5).
  - **state**: when it becomes active, animates from the current values to the motion's last keyframe (through its
    intermediate keyframes if it has some) and holds it; when it stops, animates from the current values back to what is
    under it (a lower state, a kept frame, or rest), with the same timing. A boolean is the case with two names.
  - **driver**: holds the motion at the progress it is given: no delay, no handle to play. `scroll` and `pointer` take no
    timing at all. **The time driver, `loop`, is the one driver that reads the motion's timing**: its duration is the
    period, its easing shapes each iteration, and `alternate` applies; its `delay` is ignored.
- **Names.** A trigger name becomes an attribute (`data-motion-<name>`) and a CSS variable (`--udx-motion-<name>`,
  §5.6), so it is kebab-case and `defineTrigger` throws on a name that is taken in either space:
  - a built-in trigger, or a name that starts with a built-in trigger followed by `-` (the space of its options);
  - a word the package writes after `data-motion-`: `value`, `gesture`, `step`, `box`, `phase`, `policy`, `scope`,
    `shared`, `stagger`, `split`, `state`, `states`, `restore-focus`, `dragging`, or a name that starts with `state-`;
  - a word or a prefix of the package's CSS variables: `scale`, `enter`, `exit`, and the prefixes `duration-`,
    `easing-`, `spring-`, `distance-`, `stagger-`, `value-` [Doc: manifest, `tokens.css`].
- **The inside is one player, not one contract.** The review's lead "the driver as the base contract" [Hyp] is not
  taken: a state is not a spring between 0 and 1 over a fixed animation, because a spring that overshoots cannot be
  sought past the end of a WAAPI animation, and because a state starts from the current values, not from a fixed first
  keyframe. What is shared is §3.9.

### 3.3 The triggers

| Trigger    | Contract            | Fires or holds when                                                                                                                                                                           | Options (all optional unless said)                                                    | Default reduced form |
| ---------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | -------------------- |
| `presence` | event, in two slots | `enter`: the element is attached, or `present` turns true. `exit`: `present` turns false, or the element is removed (`<Presence>`, `animate.leave`, `transition:presence`, `hidden` in HTML). | `enter`, `exit`, `flow`, `enterOnAttach`, `restoreFocus`                              | `fade`               |
| `change`   | event               | The value `watch` changes.                                                                                                                                                                    | `watch`, `interrupt`, `atEnd`                                                         | `none`               |
| `inView`   | event               | The element enters the view; before that it waits in the motion's first keyframe.                                                                                                             | `once` (true), `root`, `margin`, `amount`, `axis`, `playWhenVisible` (false), `atEnd` | `end`                |
| `hover`    | state               | A pointer that can hover is over the element.                                                                                                                                                 | `hold` (true)                                                                         | `end`                |
| `focus`    | state               | The element matches `:focus-visible`.                                                                                                                                                         | `hold` (true), `within` (false)                                                       | `end`                |
| `press`    | state               | A primary pointer is down on the element, or Enter or Space is down while it has focus.                                                                                                       | `hold` (true)                                                                         | `end`                |
| app states | state               | The app lists the name in `state`.                                                                                                                                                            | per name: a motion                                                                    | `end`                |
| `scroll`   | driver              | Always: the progress of the element through the view, or of a container's scroll.                                                                                                             | `track`, `container`, `range`, `axis`                                                 | `none`               |
| `pointer`  | driver              | Always: the place of the pointer over an area, on one axis.                                                                                                                                   | `area`, `axis` (`x` or `y`)                                                           | `none`               |
| `loop`     | driver (time)       | Always, while it is in view, the tab is shown and it is not paused.                                                                                                                           | **required:** `paused` or `essential`                                                 | `none`               |
| manual     | event               | `animateStyle(element, motion)`, or `play(motion)` on an adapter's controls.                                                                                                                  | those of `animateStyle`                                                               | `end`                |
| `layout`   | apart               | The element's box changes; or `watch` changes; or a neighbour's presence changes the flow.                                                                                                    | `timing`, `watch`, `interrupt`                                                        | `end`                |

Every trigger value is a motion (a name, a reference, an inline spec), or an object `{ motion, …options }`; the loop
only takes the object (below).

- **presence.** `presence: 'rise'` enters with `rise` and exits with it backwards, as today. `{ enter, exit }` gives
  each its motion: **the exit is written apart**, as it plays, from rest to gone. `{ exit }` alone is an element with no
  entry (it replaces `disappear`); `{ enter, exit: 'none' }` leaves at once. `flow: 'release'` takes the leaving
  element out of the flow so that its neighbours close the gap (today's `exit: 'out-of-flow'`); `'keep'` is the
  default. `enterOnAttach`: §7.6.
- **"Backwards", defined.** The exit of `presence: 'rise'` plays the keyframes of `rise` in the reverse order; an
  `offset` becomes `1 - offset`; a keyframe `easing` stays on the interval it was written for (it is not mirrored);
  `timingBy`, `delay`, `iterations` and `alternate` are kept. Its timing is the motion's `timing` when it has one, as
  today (`planGroups`); otherwise the exit default of §3.1.3 (effects springs). An exit that needs anything else is
  written apart.
- **change.** Replaces `emphasize` and the first sense of `state`. `interrupt` is `restart` (default) or `carry`.
- **inView.** The options are those of the observer: `root` (an element; default the viewport), `margin`, `amount`
  (0 to 1, default 0), which are `root`, `rootMargin` and `threshold` of `IntersectionObserver` [Doc: MDN]. The default
  `margin` is today's fixed value, per axis: `'0px 0px -10% 0px'` on `block`, `'0px -10% 0px 0px'` on `inline`
  [Doc: `viewport.ts`]. The box that is observed stays the one of today: the nearest ancestor that clips without
  scrolling, else the element (`viewedBox`). Observers are shared per set of options. **Content in view when it is
  attached does not play and stays at rest**: this is intended, it is what keeps content above the fold from flashing
  [Doc: `bind.ts`, `createRevealBinding`]; `playWhenVisible: true` asks for the play anyway. `once: false` puts the
  element back in its first keyframe when it leaves the view, at once and unseen, and plays again at the next entry
  (today's `repeat: 'always'`).
- **hover.** Pointer enter and leave, ignoring a pointer whose `pointerType` is `touch`: Motion's hover events
  "won't fire as the result of a touch event" [Doc: motion.dev, hover], and we take the same rule [Design].
- **focus.** `:focus-visible` (Baseline widely available [Doc: MDN]), as Motion's focus gesture follows "the same rules
  as the CSS :focus-visible selector" [Doc: motion.dev, gestures]. `within: true` holds while focus is anywhere inside.
- **press.** The function `press(element, onStart)` of `packages/core/src/lib/dom/press.ts` moves into
  `@udixio/motion` unchanged (primary pointer, Enter or Space, end at release, cancel or blur [Doc]); the trigger is a
  thin state on it. `@udixio/core` imports it from motion (core already depends on motion [Doc: review 9]); its only
  callers are `state-layer.ts` and the barrel [Doc: grep]. Core keeps re-exporting `press` and `PressStart`.
- **`hold: false`** turns a state trigger into its event form: the motion plays once when the state becomes active, as
  an event of level 8 (§3.5) with `atEnd: 'release'`, and nothing plays when the state stops. Such a motion ends where
  it started (`shake`), since a release that ends away from rest jumps (§3.5). This is the "hover played once" of the
  audit; Motion has both forms too (`whileHover` and `onHoverStart`) [Doc: motion.dev].
- **app states.** `states` maps a name to a motion; `state` is the name, or the list of names, that are active. Three
  states (`closed`, `open`, `loading`) are three names; a computed frame is an inline spec
  (`{ keyframes: { x: index * 100 } }`), which is not retained (§3.1). To move an element somewhere **and leave it
  there**, use an app state, not `change`: an event gives the channel back when it ends.
- **scroll.** `track: 'element'` (default) is the element's progress through the view; `'container'` is the scroll
  progress of `container` (an element; default the nearest scroller, else the document). `range` is one of CSS's
  timeline range names (`cover`, `contain`, `entry`, `exit`, `entry-crossing`, `exit-crossing`, `scroll`) or a pair of
  CSS range offsets (`['entry 0%', 'cover 50%']`) [Doc: MDN, `animation-range`; the seven names: review 10]; today's
  tokens map as `cross` to `cover` and `enter` to `entry`, with `contain` and `exit` unchanged. **Two implementations
  of one driver**: where the browser has view and scroll timelines, the animation runs on them (`timeline()`);
  elsewhere `watch()` measures the scroll in JavaScript, with the measure the scroll value already uses
  [Doc: `value-binding.ts`], and seeks a paused animation. View timelines are Baseline "newly available" since October
  2026 [Doc: MDN, `ViewTimeline`], so the JavaScript implementation serves every older browser the package supports.
  Its weight against the `continuous` ceiling is measured at step 3/8 [Test].
- **pointer.** New as a driver of a motion (today the pointer only feeds a value). `area` is the element (default),
  another element, or `'window'`. A driver gives one progress, so `axis` is `x` (default) or `y`; there is no `both`.
  Two axes are two values (§3.6), which keep `both`.
- **loop.** The time driver (§3.2). `iterations: Infinity` is implied; the motion's timing is a curve or a spring.
  **It only takes the object form, with `paused` (a boolean) or `essential` (the reason)**:
  `{ motion: 'spin', paused: false }`. `loop: 'spin'` alone is a type error in the three adapters and a `TypeError` of
  `attach` in development; the loop is then not attached (§3.10).
- **layout.** No motion. `layout` alone, or `{ timing, watch }`; `watch` is a value whose change makes the engine
  compare the box now (the second and third senses of today's `state`). The linked pair is the element's `shared`
  (§3.4), written in one place only.
- **`atEnd`** (`'release'` or `'keep'`) says what an event leaves when it ends: §3.5.

### 3.4 The target

The options of "on what" are the element's, not a trigger's and not the motion's [Design]:

| Option    | Meaning                                                | Values                                                                                                                              |
| --------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `stagger` | The element is an item of a cascade.                   | A token (`tight`, `normal`, `loose`), milliseconds, or `{ step, origin, max }`; `max` defaults to the token `stagger.max` (400 ms). |
| `split`   | The plays of the element go to each piece of its text. | `chars`, `words`, `lines`                                                                                                           |
| `shared`  | The key of a linked pair, for the layout.              | A kebab-case key                                                                                                                    |

- **Which plays a cascade delays**: those of `presence` (enter and exit) and of `inView`, and the steps of a sequence.
  States, drivers, `change` and manual plays are never delayed by it.
- **The group of a cascade** (it was "the items of one definition that start in the same task, in the same scope"
  [Doc: Choosing an API]; the step no longer belongs to a definition): the elements that carry a `stagger`, whose
  **same trigger** starts **in the same task**, in the **same scope** (`layoutScopeOf`, as today), enter and exit apart.
  The motion plays no part: a list whose items enter with different motions is one cascade. Each element is delayed by
  its visual rank in the group times **its own** step; `origin` and `max` are read on each element too.
- **Which plays are split**: those of the event triggers (`presence`, `inView`, `change`, manual), as `appear`,
  `disappear` and `reveal` are today [Doc: manifest, `splitVerbs`]. A state or a driver on a split element plays on the
  element whole. The pieces cascade at `tight` by default, as today; the element's `stagger` replaces that step, and
  then orders the pieces, not the element among its siblings.

`draw` and `along` are keyframe shorthands: an SVG shape is a target by what the motion writes. A motion no longer
carries `stagger`, `origin` or `split`: `cascade` was `slide` plus a stagger, which is why three presets had the same
keyframes.

### 3.5 Arbitration: per channel, with a written order

Today an element holds one motion per kind and `animateStyle` interrupts per CSS property
[Doc: `slots.ts`, `animate.ts` `interrupt`]. With hover, focus, press and a presence on one element, all writing
`scale`, the kind arbitrates nothing. One registry per element replaces both mechanisms: for each channel, the claims
on it, ordered. Motion documents no order between its held states [Doc: not found on motion.dev's motion component and
gestures pages, 2026-11-28]; ours is written [Design].

**The channel.** A CSS property is one channel, except the two that the shorthands share: `translate` has the channels
`x` and `y`, and `scale` has `scaleX` and `scaleY` (the shorthand `scale` claims both) [Doc: `play.ts`: `x` and `y`
write `translate`, the scales write `scale`]. So a hover on `y` and an app state on `x` never meet: the registry
writes `translate` from the top claim of each of its two channels. A keyframe that writes the CSS property itself
(`translate: '10px 4px'`) claims both channels of it. `rotate`, `draw`, `along` and every other property are one channel
each; `transform` is one channel of its own (§3.1.1).

From the lowest to the highest, per channel:

1. **rest**: the stylesheet.
2. **kept frames**: the last keyframe an event left inline with `atEnd: 'keep'`. The last written replaces the one
   before; it claims nothing actively and is never animated to by itself.
3. **drivers**: `scroll`, `pointer`, `loop`.
4. **app states**, in the order they are listed in `state` (a later name is above). The order of the keys of `states`
   plays no part, so the rule is the same in HTML and for numeric keys.
5. **`hover`**.
6. **`focus`**.
7. **`press`**.
8. **events**: `change`, `inView`, a state with `hold: false`, manual plays and `animateStyle`. Among them, the last
   started holds the channel.
9. **presence**: an enter or an exit.

How a claim starts and ends:

- The highest claim on a channel is the one seen. A claim that starts above another animates **from the current
  value** of the channel.
- **A state that stops** hands the channel to the next claim down, with an animation from the current value to that
  claim's value: a lower state's frame, a kept frame, or rest (then the inline value is removed).
- **Handing back to a driver** does not aim at a fixed value: the driver's animation keeps running underneath, and the
  return is an animation whose end keyframe is left out, so the browser takes the underlying, live value at each frame
  ("the start or end state" is inferred "by using the current state" [Doc: MDN, `Element.animate()`]). The channel
  catches the driver up; it does not jump. Same mechanism for a return to rest. That the three engines give the live
  underlying value is checked at step 3/8 [Test].
- **An event that ends** follows its `atEnd`:
  - `'release'`: the channel is given back with **no animation**; what the event wrote is removed, and what is under it
    shows, **a kept frame included**. A motion played with `release` is therefore written to end on the value that is under it (an enter ends at
    rest, a `shake` ends where it starts). When it does not, the channel jumps, and development reports the element
    once: "ends away from rest: end at rest, hold it with a state, or set atEnd: 'keep'".
  - `'keep'`: its last keyframe becomes the kept frame of the channel (level 2). A `null` value and an `auto` size keep
    nothing, as `writeFrame` does today [Doc: `animate.ts`].
- **Defaults of `atEnd`.** `animateStyle` and a manual `play()`: **`keep`**, which is exactly what `animateStyle` does
  today ("Its end frame is written inline" [Doc: `animate.ts`, `follow`]); its nineteen callers in the core rely on it
  (the snackbar stays at opacity 0 and at its closed scale after its exit [Doc: `snackbar.ts`]), and §7.1 stays true.
  `presence` enter, `change`, `inView`, `hold: false`: **`release`**. `presence` exit: its last keyframe stays until the
  element is hidden or removed, then everything it wrote is released.
- **A behaviour change, said as one.** Today a named motion that ends releases only the fields that are neutral
  (opacity 1, x and y 0, scale 1, rotate 0), and a value that is not neutral stays inline [Doc: `play.ts`,
  `restingFields`; the Troubleshooting page]. With `release` as the default, an enter that ends at `scale: 1.1` no
  longer stays there; it asks for `atEnd: 'keep'`. In exchange an element whose stylesheet rest is not neutral (a class
  that sets `opacity: 0.6`) gets it back, which `restingFields` could not do.
- **A kept frame survives a later event that ends with `release`**: after `animateStyle(el, { x: 100 })`, a `shake`
  ends back at 100 px, not at the stylesheet's place. Only three things remove a kept frame: a new `keep` on the
  channel (it replaces it), an `animateStyle` keyframe of `null`, and the detach of the binding (or `revert()`).

Other rules:

- Why this order: what is continuous sits under what is held; what the visitor is doing now (`press`) sits above what
  merely is (`hover`, then an app state), in the order CSS authors already write (`:hover`, `:focus`, `:active`); what
  ends by itself sits above what is held, since it gives the channel back; a presence is above all, and during an exit
  the states are no longer evaluated (the element is `inert`).
- **The layout is apart.** A flight reads the element's own `translate` and `scale` when it starts and composes with
  them, as `flipFrames` takes the rest transform today [Doc: `flip.ts`]. A list card that lifts on hover and has a
  layout is the common case, so it is an **acceptance criterion of step 3/8**, not a documented limit: a state on `y` or
  `scale` that starts or stops during a flight neither jumps nor is lost [Test].
- The development report "animated by two sources" (`checkSources`) stays, with the new meaning: two claims of the same
  level on one channel.
- **A component reserves channels**, not a kind: `reserveMotion(element, { channels, presence }, owner)`. A claim on a
  reserved channel, or a presence on a reserved presence, is ignored and reported with the owner's name, as today.

### 3.6 Steering

- **Events, in the four syntaxes.** A play of `presence`, of `change`, of `inView`, and each transition of a state
  dispatches `motion-start` then `motion-end` on the element, with
  `detail: { trigger, phase, outcome, reduced }`: `phase` is `enter` or `exit` (a presence enters and exits the page;
  a state enters and exits its frame; an event trigger only has `enter`); `outcome` is `finished` or `cancelled`.
  - **They do not bubble.** A listener on an element hears that element's motions only, never its descendants'; the
    adapters listen on the element they render. (The gesture events keep bubbling, as today: their spec is unchanged.)
  - **`animateStyle` dispatches nothing** unless it is called with `events: true`: the nineteen controllers of the core
    do not start emitting events on every movement of a component. A manual `play()` of an adapter dispatches.
  - **They are dispatched under reduced motion too**, in the same task, as `finished` already resolves
    [Doc: `settledHandle`]: code that waits for the end is never blocked. Drivers dispatch nothing.
- **The handle** gains `speed` (get and set; `updatePlaybackRate()`), `progress` (get and set, 0 to 1 over delay and
  duration, computed from `currentTime`; `Animation.overallProgress` exists and is not marked as limited on MDN, but the
  computation does not depend on it), and `finish()`, which "seeks either end of an animation, depending on whether the
  animation is playing or reversing" [Doc: MDN, `Animation`]: **on a reversed handle, `finish()` goes to the start**.
  `play`, `pause`, `reverse`, `seek`, `cancel`, `finished`, `currentTime`, `duration`, `delay` stay. A settled handle's
  `play()` restarts it.
- **Sequences.** A step takes a motion (name, reference or inline spec) instead of bare keyframes, plus `at`. `at` is
  free: a number (milliseconds from the start), `'+=120'` or `'-=80'` (from the end of the previous step; a stagger
  token is still accepted: `'+=normal'`), a step name (starts with that step), or a step name with an offset
  (`'title+=120'`). Step names are the labels. Motion and anime.js both take absolute, relative and label positions
  [Doc: motion.dev `animate`; animejs.com time position]; we do not take `<`, which is the previous end in anime.js and
  not a word of ours. `verb` goes: a sequence plays on its root's `presence`, on its `inView`, or on `play()`. **How
  that is written in the four syntaxes is designed at step 6/8**, with the group below; until then the sequence keeps
  its writing of today.
- **Presence: waiting for the exit.** A public core block, `createPresenceGroup({ mode, onExitComplete })`, with
  `mode: 'sync'` (default) or `'wait'`: the entering child waits until the leaving ones are gone, as Motion's `wait`
  [Doc: motion.dev, AnimatePresence]. React's `<Presence mode onExitComplete>` is thin over it. Motion's `popLayout` is
  our `flow: 'release'`. Angular's and Svelte's writing of the group is designed at step 6/8.
- **Derived values.** `defineValue(name, { from, map, timing })`: `from` names another value, `map` is
  `[[inMin, inMax], [outMin, outMax]]` or a function, `timing` a spring that smooths it or `none`. `velocity: true`
  gives the rate of change of `from` instead of its number. Sources: `pointer` (with `area`; `axis` keeps `both`),
  `scroll` (with `container` and `track`, as the trigger), `drag`, `number` (the app sets it; was `state`), and
  `from`. `range` is renamed `output`. **`source: 'time'` is removed.**

### 3.7 Drag, a complete block

`drag` stays a gesture type of `@udixio/motion/gesture` and becomes complete [Design]; `gesture()` also takes an
inline spec.

|             | Today [Doc: `gesture.ts`, `gesture-binding.ts`] | After                                                                                                                                                      |
| ----------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Axis        | `x`, `y`, `both`                                | Unchanged, plus `lockDirection` (the first axis moved).                                                                                                    |
| Constraints | `bounds: 'parent' \| 'none'`                    | The option keeps its name, `bounds`, and widens: `'parent'`, `'none'`, an element, or `{ top, right, bottom, left }` in px. `elastic` (0 to 1) past them.  |
| Snap        | None                                            | `snap`: a list of points, `{ x: number[], y: number[] }`, or a function of the release position and velocity that gives the point.                         |
| Handle      | None                                            | `handle`: an element or a selector inside the element; the drag starts there only.                                                                         |
| Release     | A spring token                                  | A spring token or `SpringParams`; `momentum` (default true).                                                                                               |
| Events      | `motion-dragend` with `{ x, y }`                | `motion-dragstart`, `motion-drag`, `motion-dragend`, each with `{ x, y, velocityX, velocityY, progressX, progressY }`. `motion-dragend` keeps `x` and `y`. |
| Binding     | `destroy`                                       | Plus `x`, `y`, `moveTo(point, { animate })`, `cancel()`.                                                                                                   |
| Keyboard    | Arrows                                          | Unchanged.                                                                                                                                                 |

**A drag is a driver only against bounds**: `progressX` and `progressY` are 0 to 1 between the bounds, and
undefined without them. The value source `drag` publishes them, which is how a motion is driven by a drag (a derived
value, or a custom driver on it). Motion's drag has the same set: axis, constraints by object or ref, elastic, momentum,
controls for a handle, start, move and end events with point, delta, offset and velocity [Doc: motion.dev, drag]. No
drop zones and no move between lists: the docs say so.

### 3.8 Swipe and reorder, rebuilt in place

- They stay in `@udixio/motion/gesture` and leave the vocabulary of motions: they are **interactions**.
- They are rewritten on public blocks only: `drag`, `press`, the layout trigger, the spring, the live-region announcer
  (exported). No private helper: a user could write them.
- Their thresholds become options whose defaults are today's constants [Doc: `gesture-binding.ts`]: swipe `distance`
  (0.4 of the size), `velocity` (800 px/s), `overshoot` (32 px); reorder `stepWait` (1000 ms); and the keyboard nudges
  of a drag (16 and 64 px).
- `defineGesture`, `gesture()`, `data-motion-gesture`, `data-motion-dragging` and the events `motion-swipe` and
  `motion-reorder` keep their names and their details.
- **Acceptance: `gesture-binding.browser.spec.ts` stays green, unmodified.** It writes `bounds: 'none'`
  [Doc: review 10], which is why `bounds` keeps its name (§3.7). Their final package is the maintainer's
  decision at the end of step 7/8 (§8).

### 3.9 One player

- Every play is a WAAPI animation made by one function from `StyleKeyframe`s: an event runs it on the document timeline,
  a driver on a scroll timeline or paused and sought, a state as a play from the current values. `playMotion` and
  `animateStyle` already both end in `element.animate` [Doc: `providers/waapi.ts`, `animate.ts`].
- **Providers.** `MotionRequest.keyframes` becomes `StyleKeyframe[]`. The `css` provider (experimental, two frames,
  five fields [Doc: review 9]) cannot carry the open keyframe. What happens to it and to the `animejs` provider, and
  what `CLAUDE.md` should say about anime.js, is question 3 (§8). The model does not depend on the answer.
- **The spring of held states** is the maintainer's decision at the end of step 3/8, on a test he watches (§8). Until
  then a state uses the existing path: the spring as a `linear()` easing, which restarts at zero velocity when
  interrupted [Doc: review 9, B3]. The registry of §3.5 is written so that the tween of a state is one replaceable
  function.
- **The manifest.** At the end of step 5/8 (§7.7), its closed lists go (`verbs`, `visualFields`, `deferredVisualFields`, the options and reduced
  values per verb, the defaults per verb). It then becomes version 2 and publishes what is still a fact: the tokens, the
  shorthands, `SPATIAL_PROPERTIES`, the built-in triggers with their contract, options and default reduced form, the
  reduced forms, the presets, the entries and their exports. Validation in development is structural: known keys of a
  spec, at least one keyframe, a timing of a known form, a trigger that exists.
- **Weight.** The core ceiling stays 25 kB (21.2 measured [Doc: plan]) until step 3/8 measures the slice. Rule: the
  registry and `presence`, `change` and `inView` are in the core; `hover`, `focus` and `press` load on first use as
  `scroll` and `loop` do today (`feature-loader.ts`); no ceiling is raised without a measure in the step's report.

### 3.10 The guards that stay

| Guard                                                                             | Where it lives in the model                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reduced motion per trigger                                                        | The default reduced form of each trigger (§3.3), overridable per motion.                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Focus given back and `inert` at the exit                                          | The `presence` trigger, unchanged (`restoreFocus`, `inert` once focus has left) [Doc: `bind.ts`].                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| A loop must be pausable                                                           | **Guaranteed, not declared.** The `loop` trigger only takes `{ motion, paused: boolean }` or `{ motion, essential: '<reason>' }`: the type has no other form (§4), so `loop: 'spin'` does not compile in React, Angular or Svelte. In HTML a loop carries `data-motion-loop-paused="false"` (it plays, and the page can pause it by setting `"true"`) or `data-motion-loop-essential="<reason>"`. A loop with neither, in any syntax, is **not attached**, and development throws, as an invalid spec does today (the manifest's `pause: required`). |
| A loop rests out of view and in a hidden tab; three flashes a second are reported | The `loop` trigger, unchanged [Doc: `continuous.ts`].                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Rest goes back to the stylesheet                                                  | A state that stops and an event that ends with `release` remove their inline value (§3.5); replaces `restingFields`.                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Content is never left hidden                                                      | Without an `IntersectionObserver`, in view at once [Doc: `viewport.ts`]; a module that fails to load leaves the element at rest; §7.6 for the first frame.                                                                                                                                                                                                                                                                                                                                                                                           |
| Development checks, and a component's reservation                                 | `__MOTION_CHECKS__`, `checkSources`, `reserveMotion` (by channel).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Loading on demand                                                                 | `feature-loader.ts`, extended to the state triggers.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `--udx-motion-scale`                                                              | §3.1.2: durations and delays.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `inspect()` and `revert()`                                                        | They list the bindings per trigger and the claims per channel.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `--udx-motion: none`                                                              | The switch that turns every trigger of an element off (its reduced form). It no longer names a motion (§5.6).                                                                                                                                                                                                                                                                                                                                                                                                                                        |

### 3.11 Removals

Already decided by the maintainer; listed so that nothing is forgotten.

| Removed                                                                                | What goes with it                                                                                                                                                                                                                                                                                              |
| -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scrollTo`                                                                             | The entry `@udixio/motion/scroll`, `scroll-to.ts`, `scroll-entry.ts`, `timing.accepts.scrollTo`, its size-limit line, the page `scroll.astro`, its examples in four frameworks, its scene and card.                                                                                                            |
| `navigate`                                                                             | The entry `@udixio/motion/page`, `navigate.ts`, `page.ts`, the capability `view-transition`, `data-motion-direction`, the View Transition rules and the four `udx-route-*` keyframes of `motion.css`, the reserved prefix `view-transition-`, the page `page-transitions.astro`, its examples, scene and card. |
| `/astro`                                                                               | The entry `@udixio/motion/astro`, `astro.ts`, the call in `apps/doc/src/layouts/layout.astro` (lines 183 to 188) [Doc]. The doc site keeps Astro's own default transition; no local copy of the slide [Design].                                                                                                |
| `source: 'time'`                                                                       | In `value.ts` and `value-binding.ts`, `timing.accepts.timeValue`, the section of the Values page. A loop is the `loop` trigger.                                                                                                                                                                                |
| `disappear`                                                                            | From the presets, the docs and the new entry points at step 4/8, after `presence: { exit }` exists; from the type with the other verbs, at the end of step 5/8 (§7.7).                                                                                                                                         |
| The verbs, `kind`, the `data-motion` list, `state` as a replay, `--udx-motion: <name>` | §2.3, §5.                                                                                                                                                                                                                                                                                                      |
| In every case                                                                          | The bundled copy of the docs in `packages/mcp/src/bundled/doc-src`, the manifest's `entries`, the `exports` of `package.json` (both blocks), `.size-limit.json`, the README sections.                                                                                                                          |

The first three removals do not depend on the model: they can be made at once, before the regrouping of §6.

---

## 4. The public API of the core

```ts
// @udixio/motion
defineMotion(name, spec): MotionRef;                 // spec: MotionSpec of §3.1, no verb
defineTrigger(name, trigger): name;                  // §3.2
attach(element, what: Attached, options?: AttachOptions): Attachment;
getBinding(element, trigger): Binding | undefined;
press(element, onStart): () => void;                 // moved from @udixio/core
reserveMotion(element, { channels, presence }, owner): () => void;

type MotionSource = MotionName | MotionRef | MotionSpec;
type Of<O> = MotionSource | ({ motion: MotionSource } & O);
type AtEnd = { atEnd?: 'release' | 'keep' };

/** What decides when: one key per trigger. */
interface Triggers {
  presence?: MotionSource | ({ enter?: MotionSource; exit?: MotionSource | 'none' } & PresenceOptions);
  change?: Of<{ watch?: unknown; interrupt?: 'restart' | 'carry' } & AtEnd>;
  inView?: Of<InViewOptions & AtEnd>;
  hover?: Of<{ hold?: boolean }>;
  focus?: Of<{ hold?: boolean; within?: boolean }>;
  press?: Of<{ hold?: boolean }>;
  scroll?: Of<ScrollOptions>;
  pointer?: Of<PointerOptions>;
  /** No bare motion: a loop is pausable or essential. */
  loop?: { motion: MotionSource } & ({ paused: boolean } | { essential: string });
  layout?: true | { timing?: Timing; watch?: unknown; interrupt?: 'carry' | 'restart' };
  /** App states, by name. */
  states?: Readonly<Record<string, MotionSource>>;
  /** Custom triggers, by the name given to defineTrigger. */
  triggers?: Readonly<Record<string, Of<Record<string, unknown>>>>;
}
/** On what (§3.4). */
interface Target {
  stagger?: StaggerToken | number | StaggerOptions;
  split?: 'chars' | 'words' | 'lines';
  shared?: string;
}
/** What the app changes while the element lives. */
interface Live {
  /** Whether the element is there. */
  present?: boolean;
  /** The app states that are active, the lowest first. */
  state?: string | readonly string[] | null;
}
type Attached = Triggers & Target & Live;

interface AttachOptions {
  /** Report mistakes on the console; the default is the build's (__MOTION_CHECKS__). */
  development?: boolean;
  /** The element has no box: its motions go to its box (today's BindOptions.boxless). */
  boxless?: boolean;
}

interface Attachment {
  /** Give the element new values: what changed is attached again, the rest is kept. */
  update(what: Attached): void;
  /** Play a motion now (manual), or replay the motion of a trigger ('change', 'inView'). */
  play(what: MotionSource | { trigger: string }): MotionHandle;
  binding(trigger: string): Binding | undefined;
  detach(): void;
}

// @udixio/motion/animate
animateStyle(element, keyframes | MotionSource, options?): MotionHandle;   // signature kept, widened
// AnimateStyleOptions gains: atEnd ('keep' by default), events (false by default). carry, delay, iterations,
// timing and reduced keep their names and their defaults.
```

- An inline spec is known by its content, not its identity: `update` with a spec of equal content attaches nothing
  again (§3.1 for how, without a cache). Kept from the syntax spec.
- A name that is not defined yet waits for its definition, without touching the element, as `motionWhenDefined` does.
- `MotionRegistry` stays for autocompletion, with `true` as its values: a motion has no kind to type.
- **What stays as it is**: `connectMotion` (the HTML scanner, with the attributes of §5.5), `inspect` and `revert`,
  `defineValue` and `value`, `defineSequence` and `sequence`, `defineGesture` and `gesture`, `defineShared`,
  `defineTokens`, the policy entry, `watchView` and `viewedBox`, the loaders. The other fields of today's
  `BindOptions` move: `present` and `shared` to `Attached`, `settled` and `restoreFocus` to the presence options,
  `paused` to the loop.
- Everything listed is exported, with the built-in triggers themselves (`presenceTrigger`, `hoverTrigger`…), the
  registry of claims, `SPATIAL_PROPERTIES`, and the one keyframe reader.

## 5. The four syntaxes

### 5.1 What the syntax spec keeps and what changes

`docs/superpowers/specs/2026-11-28-framework-urls-and-motion-syntax-design.md`: its §2 (URLs) is independent of the model
and may proceed. Its §3 (syntax) and §4 (home) are replaced by this section and §6.

| From its §3                                                                                                                                                                                                                                                            | Fate                                                                                                                                                                                                                                                              |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| One prop per trigger, taking a name, a reference or an inline spec (the maintainer's decision)                                                                                                                                                                         | Kept. The props are the triggers of §3.3 instead of the six kinds.                                                                                                                                                                                                |
| `as` stays; no `Motion.article`, no `create()`                                                                                                                                                                                                                         | Kept.                                                                                                                                                                                                                                                             |
| Each adapter has its own natural syntax; React is not copied                                                                                                                                                                                                           | Kept.                                                                                                                                                                                                                                                             |
| No own prop of `<Motion>` collides with a native attribute; hence `looping` and `sequenceStep`                                                                                                                                                                         | Kept. None of the new props is a native attribute name.                                                                                                                                                                                                           |
| An inline spec is known by its content                                                                                                                                                                                                                                 | Kept.                                                                                                                                                                                                                                                             |
| `useMotion(options)` with one object; Angular one directive; Svelte one attachment with the sources first and a getter second                                                                                                                                          | Kept.                                                                                                                                                                                                                                                             |
| The space-separated list removed from the three adapters                                                                                                                                                                                                               | Kept, and now removed from HTML too.                                                                                                                                                                                                                              |
| Typing per kind: `MotionVerb`, `MotionSpecOf`, `MotionOf<V>`, `MotionNameOf`, the registry valued by verb, `MotionSources`, `listMotionSources`, `ExpectedSource`, `MotionPlaces`, `SOURCE_VERBS`, `reportWrongKind`, the language-service check of the strict variant | **Dropped.** Any motion fits any trigger: there is no wrong kind to refuse. This removes tasks of the paused plan rather than moving them.                                                                                                                        |
| `reveal` exclusive with `scrub`                                                                                                                                                                                                                                        | Dropped: `inView` and `scroll` are two triggers; they meet only per property (§3.5).                                                                                                                                                                              |
| `state` "unchanged; plays emphasis, else layout, else reveal, else the loop"                                                                                                                                                                                           | Dropped (§2.4, row 11).                                                                                                                                                                                                                                           |
| "HTML is unchanged" (`data-motion` keeps its list)                                                                                                                                                                                                                     | **Reversed**: §5.5. This was a decision of the maintainer (2026-11-28, and "the `data-motion` attribute is a name" on 2026-11-04); it follows from the validated model, since a name no longer carries its trigger, but it is his writing to see: §8, question 1. |
| Prop names `emphasis`, `reveal`, `scrub`                                                                                                                                                                                                                               | Become `change`, `inView`, `scroll` [decided]: a trigger is named by its "when", and these are Motion's words too (`whileInView`, `useScroll`). `loop` stays named by its effect, and is `looping` in React only.                                                 |

### 5.2 React

```tsx
<Motion as="li" presence="rise" layout stagger="normal">…</Motion>
<Motion presence={{ enter: 'rise', exit: 'fade', flow: 'release' }}>…</Motion>
<Motion as={Button} hover={{ keyframes: { y: -2 } }} press="dip" />
<Motion change={{ motion: 'shake', watch: errors }} />
<Motion as="section" inView={{ motion: 'rise', once: false, margin: '-20%' }} />
<Motion as="img" scroll={{ motion: 'parallax', range: 'cover' }} />
<Motion as="span" looping={{ motion: 'spin', paused }} />
<Motion as="svg" states={{ open: { keyframes: { rotate: 180 } } }} state={open ? 'open' : null} />
<Motion layout={{ watch: wide }} shared="cover" style={{ width }} />
<Motion presence="fade" present={open} onMotionEnd={(event) => done(event.detail)} />
```

- Props: `presence`, `change`, `inView`, `hover`, `focus`, `press`, `scroll`, `pointer`, `looping`, `layout`;
  `states`, `state`; `stagger`, `split`, `shared`; `present`; `triggers`; `sequenceStep`; `motionRef`;
  `onMotionStart`, `onMotionEnd`; `gesture` and its events (plus `onMotionDragStart`, `onMotionDrag`); `as`, `ref`.
- `looping` takes the object only, with `paused` or `essential` (§3.10): `looping="spin"` is a type error.
- `onMotionStart` and `onMotionEnd` hear the element's own motions only (the events do not bubble, §3.6).
- Removed: `name`, `state` in its old sense, `settled` (now `presence={{ …, enterOnAttach }}`), `paused` (now in
  `looping`), `restoreFocus` at the top (now in `presence`; a swipe keeps its own in the gesture).
- None of the props is a native attribute name. `states` is a field of the core's component interfaces
  (`ButtonInterface.states`), not a prop of a component [Doc: `button.interface.ts`], so `<Motion as={Button} states>`
  hides nothing; the type test of the syntax spec (native attributes through `as`) gains one case per Udixio component
  for the own props of `Motion`.
- `motionRef`: `play(what)` and `binding(trigger)`, as `Attachment`.
- `<Presence mode onExitComplete>` (§3.6). `useMotion(options)` takes the same object and returns `ref`, `mounted`,
  `play`, `binding`.
- "Coming from Motion", one table in the docs: `initial` + `animate` + `exit` is `presence={{ enter, exit }}`;
  `whileHover`, `whileTap`, `whileFocus` are `hover`, `press`, `focus`; `whileInView` + `viewport` is `inView`;
  `animate={state}` with variants is `states` + `state`; `layout` and `layoutId` are `layout` and `shared`;
  `useScroll` is `scroll` or a scroll value; `transition` is the motion's `timing` and `timingBy`;
  `AnimatePresence mode="wait"` is `<Presence mode="wait">`.

### 5.3 Angular

```html
<li udxPresence="rise" udxLayout udxMotionStagger="normal">…</li>
<div
  [udxPresence]="{ enter: 'rise', exit: 'fade' }"
  [udxMotionPresent]="open()"
  (udxMotionEnd)="done($event)"
></div>
<udx-button udxPress="dip" [udxHover]="{ keyframes: { y: -2 } }" />
<p udxChange="shake" [udxChangeWatch]="errors()"></p>
<section [udxInView]="{ motion: 'rise', once: false }"></section>
<span [udxLoop]="{ motion: 'spin', paused: paused() }"></span>
<svg
  [udxMotionStates]="{ open: openFrame }"
  [udxMotionState]="open() ? 'open' : null"
></svg>
<aside udxLayout [udxLayoutWatch]="wide()" udxMotionShared="cover"></aside>
```

- One directive, the class `Motion`, selector on the trigger inputs (`udxPresence`, `udxChange`, `udxInView`,
  `udxHover`, `udxFocus`, `udxPress`, `udxScroll`, `udxPointer`, `udxLoop`, `udxLayout`, `udxMotionStates`,
  `udxMotionTriggers`), `exportAs: 'udxMotion'` with `play(what)` and `binding(trigger)`. No collision with an existing
  input of `packages/ui-angular` [Doc: review 10, search].
- Naming rule: an input that is a trigger bears the trigger's name (`udxHover`); an input that is an option of one
  trigger is prefixed by it (`udxChangeWatch`, `udxLayoutWatch`); everything that is the element's is `udxMotion…`
  (`udxMotionStates` and `udxMotionState` as a pair, `udxMotionPresent`, `udxMotionStagger`, `udxMotionSplit`,
  `udxMotionShared`). Outputs: `udxMotionStart`, `udxMotionEnd`.
- A static name needs no brackets; an object or a reference is bound. `udxLoop` takes the object only (§3.10); `loop`
  keeps its word (an input does not hide the native attribute: `<video loop [udxLoop]="…">` sets both).
- Unchanged: `@if` / `@for` with `animate.leave`; `udxMotionGesture`, `udxMotionValue`, `udxMotionSequence`; a step is
  `data-motion-step`.

### 5.4 Svelte

```svelte
<li {@attach motion({ presence: 'rise', layout: true, stagger: 'normal' })} transition:presence>…</li>
<button {@attach motion({ press: 'dip', hover: { keyframes: { y: -2 } } })}>…</button>
<p {@attach motion({ change: 'shake' }, () => ({ change: { watch: errors } }))}>…</p>
<span {@attach motion({ loop: { motion: 'spin', paused: false } }, () => ({ loop: { paused } }))}></span>
<svg {@attach motion({ states: { open: openFrame } }, () => ({ state: open ? 'open' : null }))}></svg>
```

- `motion(what, live?)`: the first argument is the core's `Triggers & Target` as it is (an object key collides with
  nothing, so `loop` keeps its word, and a custom trigger is a key of `triggers`).
- The getter, second, carries what changes, **under the name of the trigger it belongs to**: `present` and `state` at
  the top (the core's `Live`), `change: { watch }`, `layout: { watch }`, `loop: { paused }`, and `onStart`, `onEnd`. So
  an element that has both a `change` and a `layout` sets each `watch` apart.
- The loop is written in full in the first argument (`paused: false` is its first value; the getter updates it): the
  type of the first argument refuses `loop: 'spin'`, as everywhere.
- Unchanged: `transition:presence`, `hidden={!open}` with `present`, `motionGesture`, `motionValue`, `motionSequence`.

### 5.5 HTML

**This reverses "HTML `data-motion` unchanged"** (§5.1; §8, question 1). One attribute per trigger, whose value is a
motion name; one attribute per option, named after its trigger [Design: separate attributes rather than a composed
value, so that each is read, observed and searched alone].

```html
<li data-motion-presence="rise" data-motion-layout data-motion-stagger="normal">
  …
</li>
<div data-motion-presence="rise" data-motion-presence-exit="fade" hidden>…</div>
<p data-motion-presence-exit="fade">…</p>
<button data-motion-hover="lift" data-motion-press="dip">…</button>
<p data-motion-change="shake" data-motion-change-watch="3">…</p>
<section
  data-motion-in-view="rise"
  data-motion-in-view-once="false"
  data-motion-in-view-margin="-20%"
>
  …
</section>
<img
  data-motion-scroll="parallax"
  data-motion-scroll-range="cover"
  data-motion-scroll-container="#feed"
/>
<span data-motion-loop="spin" data-motion-loop-paused="false"></span>
<svg data-motion-state-open="half-turn" data-motion-state="open"></svg>
```

Rules of the writing:

- **A motion is always a name** in HTML (defined with `defineMotion`); an inline spec is a JavaScript thing.
- **A boolean** is `"true"` or `"false"`; the attribute alone is `"true"`. One encoding, for every option.
- **An option that is an element** (`root`, `container`, `area`, the drag's `handle` and `bounds`) is a CSS selector,
  looked up in the document when the trigger is attached, as `data-motion-restore-focus` is today
  [Doc: `connect.ts`]; a selector that matches nothing is reported in development and the default applies.
- **An exit alone** is `data-motion-presence-exit` without `data-motion-presence`: the element has no entry.
- **App states**: a state is declared by `data-motion-state-<name>="<motion>"`, and `data-motion-state` lists the
  names that are active, the lowest first (§3.5): the order is in the attribute the page changes, so it needs no object.
- **A loop** carries `data-motion-loop-paused` (`"false"` while it plays) or `data-motion-loop-essential` (§3.10).
- `data-motion="a b"` is removed, with "the first listed of a kind". `data-motion-state` changes sense (above).
- **The phase.** The mark the package writes on an element leaves `data-motion-presence`, which is now the author's,
  for **`data-motion-phase`**. It is the mark of the presence only (a hover never writes `enter`), with the one
  vocabulary of §2.1: `enter` (was `entering`), `rest` (was `present`),
  `exit` (was `exiting`). The events' `detail.phase` uses the same words. What reads the old mark, all to update
  [Doc: grep, 2026-11-28]:
  - core: `bind.ts` (it writes the mark, and the hydration rule "an element marked present is settled" reads it),
    `box.ts`, `shared-registry.ts`, `scope-entry.ts` (`inspect`, `revert`), `layout/scope.ts`, `layout/flush.ts`,
    `layout/types.ts`;
  - adapters: `ui-angular/.../motion.ts` (its server render writes the mark), `ui-react/.../Motion.tsx`,
    `ui-svelte/.../motion.attachment.svelte.ts` and its fixture;
  - docs: the Presence page (it recommends `data-[motion-presence=exiting]:pointer-events-none`, which becomes
    `data-[motion-phase=exit]:…`), How it works, Choosing an API, Troubleshooting, Roadmap, `motion-glossary.ts`,
    `motion-api.json` (generated), the README, and the bundled copy of the MCP.
- The scanner watches the attributes of the built-in triggers, of the triggers defined with `defineTrigger`
  (`data-motion-<name>`; the reserved names of §3.2 keep them from colliding), and `hidden`, as it watches a fixed list
  today [Doc: `connect.ts`, `attributeFilter`].
- Events: `motion-start` and `motion-end` on the element (§3.6).
- Unchanged: `data-motion-shared`, `data-motion-step`, `data-motion-value`, `data-motion-gesture`,
  `data-motion-restore-focus`, `data-motion-box`, `data-motion-policy`, `data-motion-scope`, `data-motion-dragging`.

### 5.6 Per breakpoint, in the four syntaxes

Today one variable, `--udx-motion`, replaces the bound motion if it is of the same kind [Doc: `named-motion.ts`].
After [Design]:

- One variable per trigger names the motion that trigger plays in place of its own, read at each play:
  `--udx-motion-enter`, `--udx-motion-exit`, `--udx-motion-change`, `--udx-motion-in-view`, `--udx-motion-hover`,
  `--udx-motion-focus`, `--udx-motion-press`, `--udx-motion-scroll`, `--udx-motion-pointer`, `--udx-motion-loop`;
  `--udx-motion-state-<name>` for an app state; `--udx-motion-<name>` for a trigger defined with `defineTrigger`.
  The value `none` turns that trigger off. The "same kind" limit disappears: any motion fits.
- The layout has no motion to name: `--udx-motion-layout` only takes `none`, which turns it off.
- `--udx-motion: none` stays the switch of the whole element (and of its descendants).
- Being CSS, they are written the same way in the four syntaxes. Tailwind: `motion-none` stays; `motion-[name]`
  becomes `motion-<trigger>-[name]` (`md:motion-enter-[fade]`, `md:motion-in-view-none`).
- A trigger's options are not CSS: they are written per syntax (§5.2 to §5.5), and change per breakpoint through the
  framework's own means.

---

## 6. The `/motion` home and menu, regrouped right after this step

Scope (the amendment): the pages, cards, scenes and examples that exist today, moved and relabelled. **Nothing that is
not coded is shown or named**: no hover, focus or press card, no per-property timing, no events. The three removals of
§3.11 are made before or with this change, so that no page leaves the menu while its function still ships.

### 6.1 Home

| Section                                                                                    | Fate                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hero                                                                                       | Stays. **One word per thing**: the caption and the code use one word for the entry. Until step 3/8 the code shown is the attach line with a preset (no `verb` on screen), and the caption says "presence" for the when and "enters" and "leaves" for what happens; `appear`, `pop` and "press emphasis" leave the hero. |
| "One example, four frameworks" (`Principle.astro`)                                         | Stays.                                                                                                                                                                                                                                                                                                                  |
| "Your Udixio components already move with it" (`Components.astro` and `root/components/*`) | Removed (decided on 2026-11-28).                                                                                                                                                                                                                                                                                        |
| "What it does" (`Gallery.astro`)                                                           | Twenty flat cards become six blocks, below.                                                                                                                                                                                                                                                                             |
| "Browsers and weight" (`Facts.astro`)                                                      | Stays; its lines for `scroll`, `page` and `astro` go with the removals.                                                                                                                                                                                                                                                 |

"What it does", lead: "A motion, a trigger, a target; then how to steer it, the tools beside it, and the system."

| Block | Title                  | Sentence                                                                                                                           | Current cards (slug)                                                                                |
| ----- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| 1/6   | What moves? The motion | Keyframes and a timing, written once and named; thirteen come ready-made.                                                          | No scene card: one static code sample of a `defineMotion`, and links to Presets and Write your own. |
| 2/6   | When? The trigger      | It plays when the element enters or leaves, when a value changes, when it scrolls into view, as the page scrolls, or all the time. | `presence`, `emphasis`, `reveal`, `scrub`, `loop`                                                   |
| 3/6   | On what? The target    | One element, each item of a list, each piece of a text, an SVG stroke, two linked elements, or an element that changes place.      | `lists`, `text`, `svg`, `shared-elements`, `layout`                                                 |
| 4/6   | How to steer it?       | A handle plays, pauses and seeks one motion; a sequence does it for many.                                                          | `sequences`; a link to The handle                                                                   |
| 5/6   | The tools apart        | Animate any CSS property now, follow a number, move an element with the pointer.                                                   | `animate`, `values`, `counters`, `gestures`                                                         |
| 6/6   | The system             | Tokens give every motion the same timing; reduced motion and the screen size change what plays.                                    | `tokens`, `accessibility`, `per-breakpoint`                                                         |

- Eighteen cards: the twenty of today less "Scroll to a target" and "Change pages".
- The chips `defineMotion · <word>` leave blocks 2 and 3: the block's title says what the card is, and twelve cards no
  longer read as twelve features of one function. The tools keep their function chip (`defineValue`, `defineGesture`,
  `defineSequence`, `animateStyle`).
- The cards keep their scenes, their sentences and their links. Card titles in block 2 until step 5/8: "Presence",
  "On change" (was "Draw attention"), "In view" (was "Reveal on scroll"), "With the scroll" (was "Link to the scroll"),
  "Loop". The pages keep their slugs until the URL migration.
- "Material 3 motion" in the home's promise becomes "Material 3 tokens": the Limits page says that distances and
  cascades do not come from M3 and that the presets are not calibrated [Doc: audit, defect 10].
- The docs rules apply: Udixio components for every control, Tailwind and theme tokens, no new CSS file, the page
  checked in a browser in light and dark and under reduced motion.

### 6.2 Menu

`Start · Motions · Triggers · Targets · Control · Tools · Interactions · System · Recipes · Reference`

| Section      | Pages, in order                                                                | From                                                                                                                                                                                                                                                                                                 |
| ------------ | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Start        | Overview, Getting started, How it works, Choosing an API                       | Start, unchanged                                                                                                                                                                                                                                                                                     |
| Motions      | Presets, Write your own                                                        | Presets from System; **provisional** as a page: its gallery moves into Examples tabs at step 8/8 (§8), the import stays. **Write your own is split** out of How it works and the README ("Define", "Timing", "Names"): the keyframes, the fields and the timing of `defineMotion` as they are today. |
| Triggers     | Presence, On change (`emphasis`), In view (`reveal`), Scroll (`scrub`), Loop   | Motions                                                                                                                                                                                                                                                                                              |
| Targets      | Lists, Text, SVG, Shared elements, Layout                                      | Motions                                                                                                                                                                                                                                                                                              |
| Control      | The handle, Sequences                                                          | Sequences from "Values, gestures, sequences". **The handle is split** out of How it works and the API page: `play`, `pause`, `reverse`, `seek`, `cancel`, `finished` as they are today.                                                                                                              |
| Tools        | Animate now (`animate`), Values (with its `#counters` section)                 | Functions; "Values, gestures, sequences"                                                                                                                                                                                                                                                             |
| Interactions | Gestures                                                                       | "Values, gestures, sequences". One page now; **it splits** into Drag, Swipe and Reorder at step 7/8.                                                                                                                                                                                                 |
| System       | Tokens, Accessibility, Per breakpoint, Loading and weight                      | System, less Presets                                                                                                                                                                                                                                                                                 |
| Recipes      | Dialog, Toasts, Accordion, Tab indicator, Navigation menu (landing: `recipes`) | Recipes, moved after System. **Provisional**: its pages move into the Examples tabs of the features they show at step 8/8 (§8).                                                                                                                                                                      |
| Reference    | API, Glossary, Troubleshooting, Inspect and revert, Limits                     | Reference, unchanged; Roadmap stays out of the menu                                                                                                                                                                                                                                                  |

- **Go**: `scroll` (scrollTo) and `page-transitions`, with their examples, scenes and `related` links (`reveal`,
  `scrub`, `shared-elements` and `scroll` point to them today [Doc: `motion-nav.ts`]).
- **Merge**: none now. Shared elements stays its own page beside Layout: the amendment lists "linked elements" and
  "change of place" as two targets.
- **Split**: Write your own and The handle (above); Gestures later.
- The sections "Values, gestures, sequences" and "Functions" disappear. `MotionSection`, `SECTION_ORDER` and the
  `section` of each need change in `apps/doc/src/lib/motion-nav.ts`; `SECTION_LANDINGS` keeps Recipes.
- The Glossary takes §2.1 as it becomes true, step by step; at the regrouping it gains only the four question words
  (motion, trigger, target, handle) and loses nothing that the code still uses.
- How it works keeps "its seven verbs" until step 3/8 removes the first of them: the regrouping changes where pages
  are, not what the package does.

---

## 7. Migration

### 7.1 `packages/core/src/lib/dom` and `animateStyle`

- Nineteen files call `animateStyle` [Doc: grep]: `circular-progress`, `date-picker`, `fab-menu`, `fab`,
  `linear-indeterminate`, `menu-motion`, `navigation-rail-item`, `navigation-rail`, `progress-loop`, `search`,
  `side-sheet`, `slider`, `snackbar`, `split-button`, `state-layer`, `switch`, `tabs`, `text-field`, `tooltip`.
- **They compile and behave unchanged**, because every default of `animateStyle` is today's: it keeps its last frame
  inline (`atEnd: 'keep'`, §3.5), it multiplies its duration by the scale (§3.1.2, now the rule of every path), it
  dispatches no event (§3.6), and two calls on one channel still resolve as "the last started wins" (level 8).
- What is new under them, with no effect on a call of today: a call may pass a motion, `atEnd: 'release'` or
  `events: true`; the delay is multiplied by the scale too (§7.8).
- `reserveMotion(element, 'presence', 'Snackbar')` becomes a reservation by channel; every caller of `reserveMotion`
  in core and in the three adapters is updated in the step that changes it.
- `press` moves to motion (step 5/8); `state-layer.ts` imports it from there.
- **Acceptance of step 5/8** (the plan): the snackbar's entry and exit are rebuilt on a motion and the `presence`
  trigger in place of its two direct `animateStyle` calls and its hand-written reduced branch [Doc: `snackbar.ts`],
  with `{ opacity, scale }` and `timingBy` for its two springs, behaviour and tests unchanged. Its
  `transform: scale()` string becomes the `scale` shorthand. Its closed state after the exit (opacity 0, the closed
  scale, then height 0) is the kept last keyframe of the exit, until the panel is hidden.
- The components' hover and focus stay CSS (`state-group.ts`, transitions on the tokens [Doc: review 9]). The docs say
  when CSS is enough: a state that changes one or two properties on a token's curve needs no trigger.

### 7.2 Adapters

- React: `Motion.tsx`, `Presence.tsx`, `presence-context.ts`, `hooks/useMotion.ts`, `useMotionGesture`,
  `useMotionSequence`, `useMotionValue`, and their tests.
- Angular: `motion.ts`, `motion-gesture.ts`, `motion-sequence.ts`, `motion-value.ts`, their unit and integration specs;
  the server render writes `data-motion-phase`.
- Svelte: `motion.attachment.svelte.ts`, `motion.types.ts`, the gesture, value and sequence attachments, their fixtures
  and specs.
- Order (the plan): HTML and React at step 3/8, Angular and Svelte at step 5/8. How the old and the new live side by
  side between the two is §7.7.
- The `motion` prop of the components is renamed `timing` in a change of its own (§2.2), not in this rework.

### 7.3 Docs

- `apps/doc`: 32 pages under `src/pages/motion` and 5 recipes, each example in
  `src/examples/{html,react,angular,svelte}`, the scenes, `src/lib/motion-nav.ts`, `scripts/motion-api.groups.mjs`, the
  home's `root/*`.
- **Nothing type-checks `apps/doc`** (`apps/doc/AGENTS.md`). After each step, grep it for the names that step removed.
  The cumulative list: `verb:`, `name=` on `<Motion`, `udxMotion=`, `motion('` with a string, `data-motion="`,
  `data-motion-state`, `state=`, `settled`, `step=`, `repeat:`, `range:` on a value, `exit: '`, `pause: '`,
  `source: 'time'`, `source: 'state'`, `reflow`, `slide`, `cascade`, `press` as a motion name, `scale`, `draw` and
  `rotate` as motion names, `kindOf`, `getMotion(`, `motionWhenDefined`, `scrollTo`, `navigate`,
  `connectAstroTransitions`, `--udx-motion:` with a name, `motion-[`, `motion-presence` (the old mark, in attributes and
  in Tailwind `data-[…]` variants), `amplitudeOf`, `distanceScaleOf`.
- Each step updates the pages of what it changes, in the same change; step 8/8 is only the restructuring that the
  regrouping of §6 has not done (tabs, the split of Gestures, slugs with the URL migration).
- `packages/motion/README.md` and `docs/motion/reduced-render.md` follow each step.
  `docs/superpowers/specs/2026-11-03-udixio-motion-design.md` is superseded by this spec for the vocabulary and the
  model.

### 7.4 MCP

`packages/mcp/src/bundled` holds a copy of the docs sources (`doc-src`) and of `motion-manifest.json` [Doc: ls]. Both
are regenerated after each step. Version 2 of the manifest is a breaking change for a client that reads
`domains.verbs` or `spec.*Verbs`: the MCP tools that read them are updated at the end of step 5/8, when the manifest
changes version (§7.7); until then the manifest only gains fields.

### 7.5 Tailwind

`packages/tailwind/src/plugins-tailwind/motion-name.ts` and its spec: `motion-[name]` becomes
`motion-<trigger>-[name]`, `motion-none` stays, and `motion-<trigger>-none` is added (§5.6), at step 5/8 with the
Per breakpoint page. `state-group.ts` is untouched.

### 7.6 The first frame

**How an entry avoids a flash before it is attached, today** [Doc, read in the code]:

1. **An entry never plays on content that was already painted.**
   - HTML: "An element present at connect plays no entry" [README, HTML]; only an insertion, or the removal of
     `hidden`, plays one.
   - React: hydrated content is settled (`useSyncExternalStore` reads "hydrated" on the first render) [`useMotion.ts`].
   - Any framework: an element the server marked `data-motion-presence="present"` is bound settled; Angular's server
     render writes the mark [`bind.ts`, `createBinding`; README].
   - A name defined after the element was bound binds settled [`bind.ts`, `deferMotion`].
2. **When an entry does play, the element is attached before its first paint.**
   - React attaches in a callback ref, in the commit [`useMotion.ts`]; the HTML scanner reacts to insertions with a
     `MutationObserver` [`connect.ts`], whose callbacks run as microtasks, before the browser "may choose to update
     rendering" [Doc: MDN, microtask guide].
   - The animation starts in that same task with `fill: 'both'` [`providers/waapi.ts`, `animate.ts`], so its first
     keyframe is what is painted first, during a delay too.
3. **An in-view motion** leaves content already in view at rest, and writes the first keyframe only on content that is
   out of view, where it cannot be seen [`bind.ts`, `createRevealBinding`].
4. **A split text** paints its first keyframe on the whole element while the text module loads [`bind.ts`, `playEntry`].

**Two gaps** [Doc for the facts, Hyp for the visible effect, to be confirmed in a browser at step 3/8]:

- Svelte server content replays its entry on hydration unless `settled: true` is passed, because the server runs no
  attachment and writes no mark [`motion.attachment.svelte.ts`]: the server paints the element at rest, then the entry
  starts from its first keyframe. The same happens anywhere with `settled: false`.
- A scroll or loop motion waits for its module at rest [`bind.ts`, `createContinuousBinding`]: a scroll motion whose
  first keyframe differs from rest may jump when the module arrives.

**The rule of the model** [Design]:

- `enterOnAttach` defaults to true for an element inserted in the page after its first paint, and to false for content
  that was painted before it was attached (server HTML, hydration, HTML present at connect). The Svelte adapter gets
  the same default as React and Angular: it attaches without an entry while the component hydrates.
- `enterOnAttach: true` on server content is allowed only with the first keyframe in the server HTML, so that there is
  nothing to flash: the React, Angular and Svelte adapters render the first keyframe of the `enter` motion as inline
  style on the server, when the motion is known at render (a reference, an inline spec, or a name defined at module
  scope). Motion renders `initial` on the server the same way [Doc: motion.dev, motion component]. In HTML the author
  writes that style. Without it, development reports the element once and plays no entry.
- This option leaves content hidden if the script never runs. It is opt-in for that reason, the docs say it beside the
  option, and no rule of `motion.css` ever hides content.
- A state trigger has no first frame: rest is the stylesheet. A driver writes its frame at its first progress; the
  scroll driver's module is preloaded when the scanner or an adapter sees a `scroll` trigger in the first HTML
  [Test: the jump, and the cost of the preload].
- Not in the slice of step 3/8, except the Svelte default and the browser confirmation of the two gaps.

### 7.7 The old and the new, from step 3/8 to the end of step 5/8

The plan puts HTML and React at step 3/8 and Angular and Svelte at step 5/8. Between them the three adapters must all
work, and a docs page must never be without a writing in one framework. The bridge [Design]:

- **Step 3/8 adds; it removes nothing.** The new model arrives beside the old one: `attach`, the registry of claims,
  the one keyframe reader, the triggers of the slice (`presence`, `hover`, `press`, `scroll`), `defineTrigger`.
- **`verb` becomes optional, not absent.** A spec with a `verb` is a legacy definition: the old entry points
  (`motion()`, `motionWhenDefined`, `motionsWhenDefined`, `data-motion`, React's `name`, `udxMotion`, Svelte's
  `motion('name')`) read it as today. The new entry points take any spec and ignore its verb. A spec without a verb is
  refused by an old entry point, with a message that names the new one.
- **The keyframe type widens in place**: a legacy keyframe (numbers on the nine fields) is a valid `StyleKeyframe`, so
  the old definitions and presets are read by the new reader from step 3/8.
- **Presets**: the thirteen of today keep their names and verbs until the end of step 5/8. `grow`, `trace`, `dip` and
  `spin` are added at step 3/8; `fade`, `rise`, `shake`, `parallax`, `breathe` and `blink` keep one definition, usable
  by both sides.
- **React between the two steps**: the props of the slice are added to `<Motion>`; `name` stays for everything the
  slice does not cover (emphasis, reveal, loop, layout), so no page loses its React writing. An element may carry both;
  a trigger given both ways is reported in development and the prop wins.
- **HTML between the two steps**: the scanner reads the new attributes of the slice and `data-motion`.
- **One element, both sides**: a legacy binding claims its channels in the registry at the level of its new equivalent
  (an `appear` at level 9, an `emphasize` and a `reveal` at level 8, a `scrub` and a `loop` at level 3), so the
  arbitration is one from step 3/8. The old "one motion per kind" check stays for legacy bindings only.
- **The mark**: `data-motion-phase` is written from step 3/8; `data-motion-presence` keeps being written with its old
  values beside it until the end of step 5/8, since HTML authors and the Angular server render still read it.
- **Parity** (`CLAUDE.md`: a change keeps the three adapters in parity): between the two steps the three adapters are
  in parity on the old writing, which stays complete; React and HTML are ahead on the slice only, and the docs of the
  slice say "React and HTML for now" on the pages concerned.
- **The end of step 5/8 removes, in one task, once the three adapters have every trigger**: `verb` and the legacy
  reading, `kind` and its functions, the `data-motion` list, `name` / `udxMotion="…"` / `motion('…')`, `state` as a
  replay, the old preset names, the old mark, `--udx-motion: <name>`; the manifest becomes version 2.
- `disappear` follows the plan in what a user sees (gone from the presets, the docs and the new entry points at step
  4/8) and leaves the type with the other verbs. This is the one place where this spec reads the plan's "then the
  removal of `disappear`" narrowly.

**Questions the step 3/8 spec must settle** (review 11; they are in the scope of its slice, not of this model):

1. **C1, the mechanism of a channel.** Two WAAPI animations on the same `translate` do not combine per axis, and
   `frameToKeyframe` writes `translate` whole (`${x ?? 0}px ${y ?? 0}px`) [Doc: `providers/waapi.ts`]. "Per channel"
   (§3.5) therefore needs a mechanism: an additive composition of the effect, or a custom property per axis, each with
   a cost (the sense of `x: 0`, the compositor) [Hyp]. A spike in the three engines comes before the registry is
   written [Test].
2. **C3, the old bindings during the coexistence.** What a legacy binding leaves when it ends: today's
   `restingFields` (the neutral is given back, the rest stays) or the new `release`; the Angular and Svelte tests
   depend on it until step 5/8. That the new entry points ignore the old options a shared spec still carries
   (`stagger`, `split`, `exit`, `repeat`, `range`, `pause`: `rise` carries a stagger, `parallax` a range). And the
   step at which the amplitude disappears for the old path: the reader is common from step 3/8, so it is step 3/8, with
   the tests concerned.
3. **C4, the weight of a core that carries both models.** The ceiling is 25 kB for 21.2 measured (§3.9). Say in advance
   whether a temporary overrun is allowed between step 3/8 and the end of step 5/8, and at which step the ceiling is
   judged [Test].

### 7.8 What the scale rule changes

The rule of §3.1.2 (durations and delays, never distances) against today [Doc: review 10, B2; greps of 2026-11-28]:

| Where                                                                                                                                                         | Today                                                   | After                                                                                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A named motion (`playMotion`)                                                                                                                                 | Distances and durations are multiplied                  | Durations and delays only. **Changes**: at a scale between 0 and 1, an entry travels its full distance.                                                        |
| `animateStyle`                                                                                                                                                | Its duration                                            | Unchanged; its `delay` is multiplied too.                                                                                                                      |
| A loop                                                                                                                                                        | Its duration and its distances [Doc: `continuous.ts`]   | Its period only. **Changes** likewise.                                                                                                                         |
| A cascade, a sequence                                                                                                                                         | To check in the code at step 3/8 [Test]                 | Their delays and offsets are multiplied.                                                                                                                       |
| A layout flight                                                                                                                                               | Reads the scale [Doc: `layout/flush.ts`]; real geometry | Its duration; real geometry. To confirm against the code [Test].                                                                                               |
| The core's CSS transitions: `search.style.ts` (2), `switch.style.ts` (1), `slider.style.ts` (3)                                                               | `calc(<duration> * var(--udx-motion-scale, 1))`         | **Unchanged**: they already are the rule, written in CSS.                                                                                                      |
| The pattern the README recommends (`transition-duration: calc(var(--udx-motion-duration-medium2) * var(--udx-motion-scale))`)                                 | Recommended                                             | **Unchanged**, and now the same rule as every motion.                                                                                                          |
| `amplitudeOf`, `distanceScaleOf` (exported)                                                                                                                   | Used by `play.ts`, `bind.ts`, `continuous.ts`           | Removed.                                                                                                                                                       |
| The README: "Document motion scale", the Loop section, the Switch and Slider notes                                                                            | Describe distances and durations                        | Describe durations and delays.                                                                                                                                 |
| About twenty test files set the scale (22 by grep across `packages`; the review counts 19: motion 8, tailwind 6, ui-react 2, core, angular and svelte 1 each) |                                                         | Those that assert a scaled distance change; those that set the scale to slow or stop a motion do not. Each is read at step 3/8 or 4/8, with the code it tests. |

If the maintainer prefers the scale as an amplitude (§8, question 2), the table inverts: the six CSS transitions and the
README pattern are what migrates, and the open keyframes stay unscaled outside the shorthands.

---

## 8. For the maintainer

Decided since revision 1, by the maintainer or by the control session to which he delegated the open choices, on the
reviews' recommendations (not reopened):
"motion" for the plan's "recipe"; `attach()`; `change`, `inView`, `scroll`; `data-motion-phase`; thirteen presets to
ten; the components' `motion` prop renamed `timing` in a separate change (unpublished, so nothing breaks);
`sequenceStep`; the scale as durations and delays.

**The showcase is decided**, in the maintainer's own words, relayed by the control session on 2026-11-28: « les
showcase doivent être un simple tabs example ». The showcase is the Examples tab of the feature pages (syntax spec,
§2.10). The recipes with no Udixio component (Dialog, Accordion…) live in Examples tabs too, and the presets are an
ordinary import. Consequence for §6.2: **the Recipes section and the Presets page are provisional in the menu**. They
stay at the regrouping, because the tabs do not exist yet, and move into the Examples tabs at step 8/8.

What is left for him:

1. **The HTML writing** (§5.5). It reverses his decision "HTML `data-motion` unchanged": one attribute per trigger
   (`data-motion-presence="rise"`, `data-motion-hover="lift"`) replaces the list `data-motion="rise reflow"`. It follows
   from the model he validated (a name no longer says when it plays), and it is recommended; but it is a writing his
   users type, and he has not seen it.
2. **What a scale between 0 and 1 is for** (§3.1.2, §7.8). Decided by delegation: a faster motion, never a smaller one.
   If he wants `--udx-motion-scale` as a setting of amplitude, it is the other rule. This is the one point of the
   revision worth showing him: the same entry at a scale of 0.5 under each rule.
3. **The engine**, at the end of step 3/8, on a test he watches: the spring of held states (WAAPI's `linear()` easing,
   which restarts at zero velocity when a hover is left half-way, or the JavaScript spring of the gestures, which keeps
   the velocity; Motion keeps it [Doc: plan]), and with it what `CLAUDE.md` says of anime.js and the fate of the `css`
   and `animejs` providers. Recommended for the latter: WAAPI plays motions, anime.js serves the SVG morph and the
   easings; the experimental `css` provider, which cannot carry an open keyframe, goes.
4. **The final package of `swipe` and `reorder`**, at the end of step 7/8.

## 9. Decisions of this spec, in one list

- A motion is what moves; it has no verb. One keyframe type (`StyleKeyframe`), one read path, shared with
  `animateStyle`, which stays and keeps every default it has.
- Three contracts (event, state, driver), public and implementable (`defineTrigger`); one player inside. The loop is
  the time driver, the one driver that reads a timing.
- Triggers: `presence` (`enter`, and `exit` written apart; "backwards" defined), `change`, `inView`, `hover`, `focus`,
  `press`, app `states`, `scroll` (with a JavaScript implementation), `pointer`, `loop`, manual; `layout` apart.
- A state is a name to a frame. Arbitration per channel (a property, or an axis of `translate` and `scale`); order:
  rest, kept frames, drivers, app states, hover, focus, press, events, presence. An event ends with `atEnd`: `release`
  for the triggers, `keep` for `animateStyle`.
- The target's options (`stagger`, `split`, `shared`) are the element's, with written rules for the group of a cascade
  and for what is split.
- `--udx-motion-scale` multiplies durations and delays, never distances; the default timing is by property (spatial or
  effects) and by contract, with the exit on effects springs; four reduced forms, defined per contract.
- A loop is pausable or essential by its type and by a refusal to attach, in the four syntaxes.
- Start and end events that do not bubble, under reduced motion too, not from `animateStyle`; a handle with speed,
  progress and finish; sequences with a free `at`; a presence group with `wait`; derived values; scroll containers.
- `drag` complete (`bounds` widened); `swipe` and `reorder` rebuilt in place on public blocks, thresholds as options,
  the browser spec green and unmodified.
- Ten presets, written out; `dip` is one keyframe.
- Removed: `scrollTo`, `navigate`, `/astro`, `source: 'time'`, `disappear`, the verbs, `kind`, the `data-motion` list,
  `state` as a replay, `--udx-motion: <name>`, the amplitude of the scale. Nothing old is removed before the end of
  step 5/8 (§7.7).
- Syntax: one prop, input, key or attribute per trigger; `--udx-motion-<trigger>` per breakpoint; the mark is
  `data-motion-phase` (`enter`, `rest`, `exit`); the typing per kind of the syntax spec is dropped.
- Home in six blocks and a ten-section menu, with today's pages; two pages go, two are split out, none merges.

## 10. What revision 2 changed (review 10), then review 11

| Point    | Change                                                                                                                                                                                                           |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B1       | §3.5: `atEnd` (`release` or `keep`), a level for kept frames, the defaults (`animateStyle` keeps, as today), the behaviour change for named motions said as one; §3.3 (`hold: false`, `change`) and §7.1 follow. |
| B2       | §3.1.2 rewritten on the README's premise; the scale is durations and delays; §7.8 lists what changes and what does not.                                                                                          |
| I1       | §5.1, §5.5 and §8 (question 1) say that the HTML writing reverses a decision.                                                                                                                                    |
| I2       | The loop only takes `{ motion, paused }` or `{ motion, essential }` (§3.3, §3.10, §4, §5); HTML's `data-motion-loop-paused="false"`; refusal to attach.                                                          |
| I3       | `loop` is the time driver and reads the timing (§3.2, §3.1.3); `pointer`'s `axis` is `x` or `y` (§3.3).                                                                                                          |
| I4       | The channel (§3.5); the return to a driver catches it up; layout with a hover is a criterion of step 3/8.                                                                                                        |
| I5       | §7.7, the bridge; the manifest's version 2 moves to the end of step 5/8.                                                                                                                                         |
| I6       | §2.5: the ten presets with keyframes, timing and contract; `dip` is one keyframe.                                                                                                                                |
| I7       | "Backwards" defined (§3.3); the exit's default timing stays on effects springs (§3.1.3).                                                                                                                         |
| I8       | The events do not bubble; `animateStyle` dispatches none unless asked (§3.6).                                                                                                                                    |
| I9       | The group of a cascade and what is split (§3.4); `shared` in one place.                                                                                                                                          |
| I10      | The canonical cache is for named definitions only (§3.1).                                                                                                                                                        |
| Citation | `finish()` quoted exactly, with its consequence on a reversed handle; seven range names; `overallProgress`.                                                                                                      |
| M1       | Reserved trigger names (§3.2); HTML rules for elements, booleans, an exit alone and the order of app states (§5.5, §3.5).                                                                                        |
| M2       | The Svelte getter is keyed by trigger (§5.4).                                                                                                                                                                    |
| M3       | Angular's naming rule, `udxMotionStates`, `udxLayoutWatch` (§5.3).                                                                                                                                               |
| M4       | `states` is not a component prop; a type test per component (§5.2).                                                                                                                                              |
| M5       | `flow: 'keep'`; `watch` instead of `on`; "active" for a state; one phase vocabulary; `Triggers`, `Target` and `Live` apart (§4).                                                                                 |
| M6       | `fade` per contract (§3.1.4).                                                                                                                                                                                    |
| M7       | `delay` is a number (§3.1).                                                                                                                                                                                      |
| M8       | `AttachOptions`, and what stays exported (§4).                                                                                                                                                                   |
| M9       | The writing of a sequence's trigger is designed at step 6/8 (§3.6).                                                                                                                                              |
| M10      | Variables for app states and custom triggers; `--udx-motion-layout: none` (§5.6).                                                                                                                                |
| M11      | `bounds` keeps its name (§3.7, §3.8).                                                                                                                                                                            |
| M12      | §8 no longer says the words may be refused "before step 3/8".                                                                                                                                                    |
| M13      | `inView`'s default margin per axis, and `viewedBox` stays (§3.3).                                                                                                                                                |

After review 11 (no blocker): the provenance of the delegation and of the showcase answer (header, §8); Recipes and
Presets said provisional (§6.2); the reserved trigger names cover the CSS variables (§3.2); `verb`, "channel" and
`reserveMotion`'s `channels` aligned (§2.3, §3.10, §4); `data-motion-phase` is the presence's mark only (§2.1, §5.5);
the scale admits values above 1 (§3.1.2); a kept frame survives a `release` (§3.5); three questions handed to the
step 3/8 spec (§7.7).
