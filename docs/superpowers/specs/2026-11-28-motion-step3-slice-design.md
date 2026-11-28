# @udixio/motion: the end-to-end slice (step 3/8)

Date: 2026-11-28. Branch: `feat/anime`. Status: design, nothing coded. Revision 2, after review 12
(`.superpowers/sdd/2026-11-17-animation-docs/review12-step3-components-30.md`); what it changed is listed in §13. It implements a slice of the model spec
(`docs/superpowers/specs/2026-11-28-motion-model-design.md`, revision 2, called "the model" below) and settles the
three questions its §7.7 hands to this step (review 11: C1, C3, C4).

Tags: **[Doc]** read in the repository's code or in an official documentation (the source is named); **[Design]** a choice
of this spec; **[Hyp]** an assumption; **[Test]** to be measured before it is relied on.

Sources read. The model in full; the joint plan (§2.9 and its acceptance); reviews 10 and 11; `CLAUDE.md`. In
`packages/motion/src`: `bind.ts`, `define-motion.ts`, `motion-spec.ts`, `play.ts`, `animate.ts`, `contract.ts`,
`policy.ts`, `viewport.ts`, `flip.ts`, `hidden-presence.ts`, `slots.ts`, `presets.ts`, `feature-loader.ts`,
`continuous.ts`, `scroll.ts`, `amplitude.ts`, `motion-style.ts`, `named-motion.ts`, `timing-integration.ts`,
`compose.ts`, `spring.ts`, `spring-step.ts`, `index.ts`, `providers/waapi.ts`, the first half of `connect.ts`, the
flush of `layout/flush.ts` and the head of `layout/flight.ts`, the manifest's `spec`, `reserved` and `defaults`;
`.size-limit.json`, `size-report.json`, `vite.config.mts`; `packages/core/src/lib/dom/press.ts`; React `Motion.tsx`
and `hooks/useMotion.ts`. Official pages fetched on 2026-11-28: MDN (`KeyframeEffect.composite`, `Element.animate()`,
"Using the Web Animations API", `Animation.persist()`, `Animation.startTime`, `CSS.registerProperty()`, `@property`),
the CSS Transforms Level 2 editor's draft (drafts.csswg.org), Chrome's "non-composited animations" page. Not done: nothing
was run in a browser; `Presence.tsx`, the Angular and Svelte adapters and the rest of the layout engine were not re-read.

Positions: this is step 3/8. Inside it, the gates of §10 are written gate n/3 and the spike cases S n/10.

---

## 1. Scope

### 1.1 In the slice

One end-to-end path, in HTML and in React, reduced motion included, **beside** the old model (the model, §7.7: step 3/8
only adds).

| Part             | What the slice builds                                                                                                                                                                                                                                                               |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The motion       | A spec without a verb: `keyframes` (one or several `StyleKeyframe`s: any CSS property, the shorthands `x`, `y`, `scale`, `scaleX`, `scaleY`, `rotate`, numbers or strings with a unit), `timing` (a spring token or a curve), `delay`, `reduced`. One reader and one player for it. |
| The registry     | Claims per channel, the nine levels of the model's §3.5, hand-back without a jump, kept frames, `atEnd`.                                                                                                                                                                            |
| The triggers     | `presence` (event, two slots), `hover` and `press` (state), `scroll` (driver, with its JavaScript implementation), and `defineTrigger` with the three contracts. A manual play (`Attachment.play`).                                                                                 |
| The entry points | `attach()`, `getBinding()`; the HTML attributes of the four triggers in `connectMotion()`; the React props `presence`, `hover`, `press`, `scroll`, `triggers`, `onMotionStart`, `onMotionEnd` on `<Motion>` and the object form of `useMotion`.                                     |
| Steering         | The events `motion-start` and `motion-end`; the mark `data-motion-phase`.                                                                                                                                                                                                           |
| Reduced motion   | The four forms and a keyframe, with the default of each of the four triggers; the policy, `--udx-motion: none` and a scale of 0.                                                                                                                                                    |
| The scale        | The new path multiplies durations and delays and never a distance; it accepts a scale above 1.                                                                                                                                                                                      |
| Coexistence      | A legacy binding claims its channels in the registry (§5); a trigger given both ways is the new one.                                                                                                                                                                                |
| Layout           | A card with a legacy layout motion and a new `hover` or `press` on `y` or `scale`: neither a jump nor a lost state (the model, §3.5).                                                                                                                                               |
| Presets          | `grow` and `dip` are added; `fade`, `rise`, `shake`, `parallax`, `breathe`, `blink` keep one definition.                                                                                                                                                                            |
| Measures         | The weight of every entry; the interrupted hover (§7.5); the first frame of a `scroll` motion while its module loads, and of Svelte server content (the two gaps of the model's §7.6).                                                                                              |
| Svelte           | One change only: the attachment binds without an entry on content that was in the page before it was attached (§3.7; the model, §7.6). It stays on the old writing.                                                                                                                 |
| The demo         | A fixture page for the maintainer (§9).                                                                                                                                                                                                                                             |

### 1.2 Not in the slice

| Left out                                                                                                                                                                                                                                                                                                                                                                          | Step                   |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| `timingBy`, `iterations`, `alternate`, `offset` and `easing` per keyframe, a free spring (`SpringParams`), **the per-axis split (`channel-split.ts`, §4.2), with `timingBy`, its other user**, the keyframe shorthands `draw` and `along`, `%` in the layout engine, the `transform` warning, `animateStyle` taking a motion, `atEnd` or `events`, the presets `trace` and `spin` | 4/8                    |
| `change`, `inView`, `focus`, app `states`, `pointer`, `loop`, the new writing of `layout`; `hold: false`; the target options `stagger`, `split`, `shared`; the presence option `flow`; `--udx-motion-<trigger>` and the Tailwind utility; `reserveMotion` by channel; Angular and Svelte; every removal                                                                           | 5/8                    |
| The handle's `speed`, `progress`, `finish()`; sequences; the presence group; derived values                                                                                                                                                                                                                                                                                       | 6/8                    |
| `drag`, `swipe`, `reorder`                                                                                                                                                                                                                                                                                                                                                        | 7/8                    |
| The server render of a first keyframe (`enterOnAttach: true` on server content)                                                                                                                                                                                                                                                                                                   | 5/8, with the adapters |

**Deviations from the model**, all narrow; each is to be carried into the model spec when this one is accepted
[Design]:

1. **`trace` and `spin` are not added at step 3/8** (the model's §2.5 says the four new names arrive together). `trace`
   needs the `draw` shorthand in the new reader (4/8) and `spin` needs the new `loop` (5/8): a preset that no new
   trigger can play is a trap in the docs. `grow` and `dip` arrive now.
2. **`Attachment` gains `setPresent(present)`**, which returns the outcome of the entry or the exit (§3.3). The model's §4
   only has `update({ present })`, which returns nothing; an adapter needs the promise to keep the element rendered.
3. **The new presence never writes the old mark.** The model's §7.7 says `data-motion-presence` "keeps being written
   with its old values beside" the new one. That attribute is now the author's (`data-motion-presence="rise"`), so only
   a legacy binding writes the old values there, and the three old values become reserved motion names (§3.6).
4. **A scale above 1 is accepted by the new path from this step** (§3.1), and by the old path from the task of §5.3.
   Review 12 reads the model as keeping the scale "clamped to 0..1"; its §3.1.2, as committed, drops the upper bound.
   Listed so that the two texts are checked against each other when the model is next touched.
5. **A kept frame survives a `release`** (§3.4): the sense review 11 recommended (C2). Listed for the same reason: the
   model's §3.5 must say it in one sentence only.
6. **Until step 4/8, two claims on the two axes of one property do not run side by side**: the per-axis split is
   decided here and built with `timingBy` (§4.2). Meanwhile the higher claim holds the property, the other axis keeps
   the value it had (it is never set to 0, §3.1), and the lower claim is covered. The model's §3.5 ("a hover on `y` and
   an app state on `x` never meet") is true from step 4/8.

---

## 2. Files

New modules of `packages/motion/src` (one responsibility each). None of them imports `bind.ts`, `play.ts`, the kinds
of `slots.ts` or `named-motion.ts`: the new model must tree-shake away from the old one (§6).

| Module                                                                                   | Holds                                                                                                                                 | Entry                          |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| `keyframes.ts`                                                                           | `StyleKeyframe`, `SPATIAL_PROPERTIES`, `readKeyframes`, `channelsOf`, `toWaapiKeyframes`                                              | core                           |
| `timing-plan.ts`                                                                         | The default timing per property and per contract; the scaled duration and delay                                                       | core                           |
| `reduced-form.ts`                                                                        | The reduced form of a play: which properties animate, which are set at once                                                           | core                           |
| `claims.ts`                                                                              | The registry of claims of an element                                                                                                  | core                           |
| `axis-base.ts`                                                                           | The read of the two axes of `translate` and `scale` from the computed style (§3.1); what step 4/8 builds the split on                 | core                           |
| `player.ts`                                                                              | The one function that turns a plan into WAAPI animations and a handle; the `StateTween` type and its slot                             | core                           |
| `trigger.ts`                                                                             | The three contracts, `defineTrigger`, the registry of triggers, the reserved names                                                    | core                           |
| `attach.ts`                                                                              | `attach`, `Attachment`, `Binding`, `getBinding`, the waiting for an undefined name                                                    | core                           |
| `triggers/presence.ts`                                                                   | The presence trigger                                                                                                                  | core                           |
| `presence-state.ts`                                                                      | What the old and the new presence share, moved out of `bind.ts`: `inert`, the focus that an exit moves, the phase mark and its reader | core                           |
| `events.ts`                                                                              | `motion-start`, `motion-end`                                                                                                          | core                           |
| `inserted.ts`                                                                            | `watchInsertions`, `insertedByScript`: whether an element was added by a script or was page content (§3.7)                            | core                           |
| `triggers/hover.ts`, `triggers/press.ts`, `press.ts`, `state-tween.ts`, `state-entry.ts` | The two state triggers, `press()` (see below), and the state tween that ships (§3.4, §9.2)                                            | `states`, loaded on first use  |
| `triggers/scroll.ts`, `scroll-progress.ts`, `driver-entry.ts`                            | The scroll driver, its timeline and its JavaScript measure                                                                            | `drivers`, loaded on first use |

- `feature-loader.ts` gains `loadStates` / `statesModule` and `loadDrivers` / `driversModule`, written as the five
  loaders it has [Doc: `feature-loader.ts`].
- `scroll-progress.ts` is the measure of the scroll value, moved out of `value-binding.ts` so that both use it; the
  `value` entry keeps its behaviour and its spec.
- **`press()` is copied, not moved, at this step.** `packages/motion/src/press.ts` is the text of
  `packages/core/src/lib/dom/press.ts`, exported from the `states` entry, its types from the main entry. Core keeps
  its own file until step 5/8, where the model's move is made (core imports it from motion, and `state-layer.ts` with
  it). Reason: step 3/8 only adds, and core's file and its tests stay untouched. The two files are the same text for two
  steps; the task of step 5/8 deletes core's.
- Edited: `define-motion.ts` (a spec without a verb, the reserved names), `manifest.ts` (fields added only),
  `presets.ts`, `connect.ts`, `bind.ts` (the legacy claims and the phase mark, §5), `index.ts`, `scope-entry.ts`,
  `layout/flush.ts` and `layout.ts` (§3.9), `vite.config.mts`, `package.json` (both export blocks),
  `.size-limit.json`, `size-report.json`; React `Motion.tsx`, `hooks/useMotion.ts`; Svelte
  `motion.attachment.svelte.ts` (the hydration default only).

---

## 3. The new core surface

### 3.1 The motion

```ts
/** One keyframe: CSS values by camelCase property or custom property, and the shorthands. */
type StyleKeyframe = Record<string, string | number | null> & {
  offset?: number;
};

/** A motion of the new model: no verb. */
interface VerblessSpec {
  keyframes: StyleKeyframe | readonly StyleKeyframe[];
  timing?: SpringRef | CurveTiming;
  /** Milliseconds before it starts. */
  delay?: number;
  reduced?: 'fade' | 'end' | 'start' | 'none' | StyleKeyframe;
  verb?: never;
}
type MotionSpec = LegacySpec | VerblessSpec; // LegacySpec is today's MotionDocument['spec']
type MotionSource = MotionName | MotionRef | MotionSpec;
```

- `StyleKeyframe` moves from `animate.ts` to `keyframes.ts`; `animate.ts` re-exports it and is otherwise untouched.
  `offset` stays in the type because `animateStyle` takes it; the new triggers reject it in development until step 4/8.
- **`defineMotion(name, spec)`** accepts both shapes. A spec with a `verb` goes through today's validation, unchanged. A
  spec without one is validated structurally in development (known keys; at least one keyframe; each keyframe has at
  least one property; a timing of a known form; `delay` finite and not negative), then frozen. Named definitions keep
  the canonical cache; **an inline spec is validated and frozen, and not retained**: `attach` keeps the content key of
  the spec it holds (`JSON.stringify` of the frozen copy) and compares it at `update` (the model, §3.1).
- **What a new entry point reads from a spec that has a verb** (C3): `keyframes`, `timing` and `reduced`, and nothing
  else. `verb`, `interrupt`, `stagger`, `origin`, `split`, `exit`, `shared`, `repeat`, `axis`, `range`,
  `pause` and `reason` are ignored, silently: the presets carry some of them and a report per use would be noise.
  So `presence: 'rise'` does not cascade (`rise` carries `stagger: 'normal'`), and `scroll: 'parallax'` plays over
  the trigger's own `range`, not the spec's `'cross'` [Doc: `presets.ts`]. The old words of `reduced` are read as
  the new ones: `instant` is `end`, `static` is `none`. A legacy keyframe that carries `draw` or `along` is
  reported once per motion in development and those two fields are skipped, until step 4/8.
- **An old entry point given a spec without a verb** throws a `TypeError` that names the new one:
  `motion() needs a spec with a verb; attach(element, { presence: … }) takes this one`.
- **Reserved motion names** gain, in the manifest: `entering`, `present`, `exiting` (the words of the old mark, §3.6),
  and `presence`, `emphasis`, `layout`, `view`, `loop`, `hover`, `focus`, `scroll`, `pointer`, `change`, `none`
  (a kind or a trigger is never a motion name; `none` is a value of `exit`). `press` joins them at the end of step
  5/8, when the preset of that name becomes `dip`.
- `MotionRegistry` gains `grow` and `dip`.

#### The reader

```ts
/** The spatial properties (the model, §3.1.3), in CSS names; an unknown property is "effects". */
const SPATIAL_PROPERTIES: ReadonlySet<string>;
/** A channel: a CSS property name (kebab-case), or one of 'x', 'y', 'scaleX', 'scaleY'. */
type Channel = string;
/** The frames of a motion, as a list, shorthands kept. Throws on an empty list. */
function readKeyframes(
  keyframes: StyleKeyframe | readonly StyleKeyframe[],
): readonly StyleKeyframe[];
/** The channels a set of frames writes. */
function channelsOf(frames: readonly StyleKeyframe[]): ReadonlySet<Channel>;
/** WAAPI keyframes for the given channels only. */
function toWaapiKeyframes(
  frames: readonly StyleKeyframe[],
  channels: ReadonlySet<Channel>,
  base: AxisBase,
): Keyframe[];
/** The two axes of translate and of scale as the element shows them now, percentages kept. */
interface AxisBase {
  readonly x: string;
  readonly y: string;
  readonly scaleX: number;
  readonly scaleY: number;
}
function readAxisBase(element: MotionElement): AxisBase;
```

- Channels: `x` and `y` are the two channels of `translate`; `scaleX` and `scaleY` those of `scale`; the
  shorthand `scale` and the CSS properties `translate` and `scale` written whole claim both; `rotate` writes the
  `rotate` property; everything else is one channel per property (the model, §3.5).
- A number keeps today's unit: px for `x` and `y`, degrees for `rotate`; a string is taken as written.
- **The axis a motion does not name keeps the value it has; it is never set to 0** (review 12, B1). `x` and `y` write
  `translate: <x> <y>` and the scales write `scale: <sx> <sy>`, and the missing axis is taken from `AxisBase`: the
  computed `translate` and `scale` of the element, read once when the claim's animation is created, in the read that
  already gives the transition its start (§3.4). The computed `translate` keeps its percentages (§4.1, fact 4), so an
  element centred by `translate: -50% 0` and hovered on `y` keeps its `-50%` in every keyframe and in the hold;
  `none` reads as `0px` and `1`; a third value (z) is carried as it is.
  - Why it matters: Tailwind 4 writes its translate utilities on the `translate` property
    (`translate: var(--tw-translate-x) var(--tw-translate-y)`), and the core's own styles centre that way
    (`-translate-x-1/2 -translate-y-1/2` in `switch.style.ts`) [Doc: review 12, from `node_modules/tailwindcss` 4.3.3].
    `frameToKeyframe`'s rule of today (a missing axis is 0) [Doc: `providers/waapi.ts`] would undo the centring for as
    long as a hover holds.
  - The cost, accepted: the missing axis is the value read when the claim started. A breakpoint that changes the rest
    of that axis while a state holds is seen when the hold ends. A return to rest is not concerned: its end keyframe is
    left out (§3.4).
  - It is the same read the per-axis split will use at step 4/8 (§4.2): one function, `readAxisBase`.
- `frameToKeyframe`, `paintFrame` and `waapiKeyframe` are not touched: the old path and `animateStyle` keep their
  reading until the steps that merge them (4/8 for `animateStyle`, the end of 5/8 for the old path).

#### The default timing and the scale

- Without `timing`: a spatial property takes the spatial spring and an effects property the effects spring, at the
  speed of the contract: `spring.default.*` for an event, `spring.fast.*` for a state; every property of an exit
  takes `spring.default.effects`; the `scroll` driver takes none (the model, §3.1.3). One play is therefore one or
  two WAAPI animations, grouped by timing as `planGroups` groups them today [Doc: `play.ts`], under one handle
  (`composeHandles`).
- The timing is resolved to a duration and an easing by `resolveWaapiTiming`, which moves from `play.ts` to
  `timing-plan.ts` (`play.ts` re-exports it): it is the one thing of `play.ts` the new player needs.
- **The scale** is read by a new function, `timeScaleIn(style)`: 0 and above, no upper bound; a negative value is 0, an
  absent or non-numeric one is 1. It multiplies the duration and the `delay`. No distance is touched. At 0 the play
  takes its reduced form. `motionScaleIn` (bounded to 1) stays for the old path until gate 3/3 (§5.3).

### 3.2 The three contracts and the registry of triggers

```ts
interface EventTrigger<O = unknown> {
  readonly contract: 'event';
  watch(element: MotionElement, fire: () => void, options: O): () => void;
}
interface StateTrigger<O = unknown> {
  readonly contract: 'state';
  watch(
    element: MotionElement,
    set: (active: boolean) => void,
    options: O,
  ): () => void;
}
interface DriverTrigger<O = unknown> {
  readonly contract: 'driver';
  timeline?(element: MotionElement, options: O): AnimationTimeline | null;
  watch(
    element: MotionElement,
    set: (progress: number) => void,
    options: O,
  ): () => void;
}
type Trigger = EventTrigger | StateTrigger | DriverTrigger;

function defineTrigger<N extends string>(name: N, trigger: Trigger): N;
function resolveTrigger(name: string): Trigger | undefined;
function onTriggerDefined(listener: (name: string) => void): () => void;
/** The built-in triggers with their contract, level, options and default reduced form. */
const BUILT_IN_TRIGGERS: Readonly<Record<string, TriggerFacts>>;
```

| Trigger                    | Contract         | Level                      | Options in the slice                                                    | Default reduced form                     | Module    |
| -------------------------- | ---------------- | -------------------------- | ----------------------------------------------------------------------- | ---------------------------------------- | --------- |
| `presence`                 | event, two slots | 9                          | `enter`, `exit` (a motion or `'none'`), `enterOnAttach`, `restoreFocus` | `fade`                                   | core      |
| `hover`                    | state            | 5                          | none                                                                    | `end`                                    | `states`  |
| `press`                    | state            | 7                          | none                                                                    | `end`                                    | `states`  |
| `scroll`                   | driver           | 3                          | `track`, `container`, `range`, `axis`                                   | `none`                                   | `drivers` |
| manual (`Attachment.play`) | event            | 8                          | `atEnd` (`keep` by default)                                             | `end`                                    | core      |
| a defined trigger          | its own          | event 8, state 4, driver 3 | its own                                                                 | event `none`, state `end`, driver `none` | the app's |

- **The registry of triggers** is a map on `globalThis` under a `Symbol.for` key, as the definitions of motions are
  [Doc: `define-motion.ts`], so that every copy of the package shares it. The built-in names are not in it: `attach`
  resolves them through the loaders. `defineTrigger` throws on a name that is not kebab-case, that is taken, or that is
  reserved (the model's §3.2 list, plus the prefix `axis-`, §4).
- **A defined state** sits at level 4, with the app states, ordered among them by the order of attachment; a defined
  event at level 8; a defined driver at level 3 [Design: the model gives the levels of the built-in triggers only].
- **`hover`**: `pointerenter` and `pointerleave`, ignoring a pointer whose `pointerType` is `touch`; its first
  `set` gives `element.matches(':hover')`.
- **`press`**: a thin state on `press(element, onStart)`: `set(true)` at the start, `set(false)` in the callback
  the start returns. On an SVG element only the pointer part applies.
- **`scroll`**: `track: 'element'` (default) or `'container'`; `container` an element (default the nearest
  scroller, else the document); `range`, which depends on `track` (below);
  `axis` `'block'` (default) or `'inline'`. The old tokens `cross` and `enter` are not accepted here: they
  belong to the old spec (`rangeOf` in `scroll.ts`, untouched).
  - **The ranges, by track** [Design; plan question 5]:

    | `track`       | `range` accepted                                                                                                                                                                                    | Default    |
    | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
    | `'element'`   | One of the six view range names (`cover`, `contain`, `entry`, `exit`, `entry-crossing`, `exit-crossing`), or a pair of offsets, each a name with a percentage (`'entry 0%'`)                        | `'cover'`  |
    | `'container'` | `'scroll'` (the whole scroll of the container), or a pair of offsets along that scroll, each a percentage or a length, bare or after the word `scroll` (`['0%', '50%']`, `['scroll 10%', '400px']`) | `'scroll'` |

    A container's scroll has no view ranges: the six view names say where a subject is in the view, and there is no
    subject. A view name given with `track: 'container'`, and `'scroll'` given with `track: 'element'`, is a type
    error; from HTML, where nothing is typed, it is reported once in development and the track's default is used. MDN's
    `animation-range` page gives the forms (`normal`, a `<length-percentage>`, a range name, a name with a
    `<length-percentage>`; a bare percentage is "relative to the entire timeline") and does not say which apply to a
    scroll timeline [Doc]; that a `ScrollTimeline` takes bare offsets in the three engines is checked by case S3
    [Test], and the JavaScript implementation computes the same offsets itself.

  - `timeline()` returns a `ViewTimeline` (`track: 'element'`) or a `ScrollTimeline` (`'container'`) where the
    browser has them, else `null`; then `watch()` measures with `scroll-progress.ts`, on scroll and resize events
    throttled to one read per frame, and the player seeks a paused animation (`currentTime = progress * duration`).
  - Both give the same progress for the same scroll position, within one pixel of travel [Test].
  - The motion's `timing` and `delay` are ignored; the animation is `linear`, `fill: 'both'`.

### 3.3 `attach`

```ts
type Of<O> = MotionSource | ({ motion: MotionSource } & O);

interface Triggers {
  presence?:
    | MotionSource
    | ({
        enter?: MotionSource;
        exit?: MotionSource | 'none';
      } & PresenceOptions);
  hover?: Of<{}>;
  press?: Of<{}>;
  scroll?: Of<ScrollOptions>;
  /** Triggers defined with defineTrigger, by name. */
  triggers?: Readonly<Record<string, Of<Record<string, unknown>>>>;
}
interface PresenceOptions {
  /** Whether attaching a present element plays its entry. Default: §3.7. */
  enterOnAttach?: boolean;
  restoreFocus?: Element | (() => Element | null | undefined);
}
type ViewRangeName =
  'cover' | 'contain' | 'entry' | 'exit' | 'entry-crossing' | 'exit-crossing';
type ScrollOptions = ScrollCommon &
  (
    | { track?: 'element'; range?: ViewRangeName | readonly [string, string] }
    | { track: 'container'; range?: 'scroll' | readonly [string, string] }
  );
interface ScrollCommon {
  container?: Element;
  axis?: 'block' | 'inline';
}
interface Live {
  present?: boolean;
}
type Attached = Triggers & Live;
interface AttachOptions {
  development?: boolean;
  boxless?: boolean;
}

function attach(
  element: MotionElement,
  what: Attached,
  options?: AttachOptions,
): Attachment;
function getBinding(element: Element, trigger: string): Binding | undefined;

interface Attachment {
  /** New values: a trigger whose value changed (by content) is attached again; the others are kept. */
  update(what: Attached): void;
  /** Show or hide the element; resolves when the entry or the exit has ended. Never rejects. */
  setPresent(present: boolean): Promise<'finished' | 'cancelled'>;
  /** Play a motion now, as an event of level 8. */
  play(
    what: MotionSource,
    options?: { atEnd?: 'release' | 'keep' },
  ): MotionHandle;
  binding(trigger: string): Binding | undefined;
  detach(): void;
}
interface Binding {
  readonly trigger: string;
  readonly contract: 'event' | 'state' | 'driver';
  /** The handle of what plays or played last; null before the first play, and always for a driver. */
  readonly handle: MotionHandle | null;
  /** A state: whether it is active. A presence: whether the element is present. A driver: true. */
  readonly active: boolean;
  detach(): void;
}
```

- **An element may carry several attachments, one per caller** (the scanner's, an adapter's, a script's). Each owns the
  triggers it was given and detaches only those. **A trigger name is held once per element**: an `attach` or an
  `update` that names a trigger another attachment already holds on the element does not attach that trigger, and
  development reports it once, naming it; the first holder keeps it. So `attach(el, { hover })` on an element the scanner
  attached with a presence adds the hover and leaves the presence alone. `getBinding(element, trigger)` looks through
  every attachment of the element. All attachments of an element share one registry of claims (§3.4).
- **A name that is not defined yet** waits (`onMotionDefined`) without touching the element, and its trigger is
  attached when the name is defined; a presence then attaches without an entry, as `deferMotion` does [Doc:
  `bind.ts`]. A `setPresent(false)` asked meanwhile is applied then.
- **A built-in trigger whose module is not loaded** (`hover`, `press`, `scroll`) starts the load at `attach` and
  binds when it lands; a failed load leaves the element at rest and is reported in development. The element is never
  written before that.
- **`update(what)` takes the whole description of the attachment's triggers.** A trigger key that is absent from
  `what` is detached (its claims are handed back with their return; a presence that is removed plays no exit: it is
  not the element that leaves). A key that is there and unchanged is kept as it is: nothing is cancelled, nothing
  replays. `present` is the one field that is kept when it is absent; only a change of it calls `setPresent`. This is
  what an adapter needs, which passes a complete object at each render.
- **How a value is compared**, and what a change does:
  - a motion: a name by the string, a reference by its name, an inline spec by its content key. A change attaches that
    trigger again;
  - an option that is data (a string, a number, a boolean, a range pair): by content. A change attaches that trigger
    again;
  - an option that is an element (`container`, an element given as `restoreFocus`): by identity. A different element
    attaches that trigger again; the same element, from a ref that is stable across renders, does nothing;
  - **an option that is a function (`restoreFocus={() => …}`, a function option of a defined trigger) is never
    compared.** The attachment keeps the latest one in a slot and reads the slot when the option is used (when the exit
    starts). A new function at each render neither attaches the presence again nor touches a play in progress.
- **`detach`** cancels every play, removes every claim and every inline value the attachment wrote (kept frames
  included), removes `data-motion-phase` and the `inert` it set, and stops every watcher.
- **`boxless`** has today's meaning: the state (the mark, `inert`, the focus) stays on the element and the claims go
  to its box (`motionBox`) [Doc: `bind.ts`, `box.ts`]. A box marked `data-motion-box="none"` attaches nothing, with
  today's report.
- **A reservation.** `reserveMotion` keeps its signature by kind. Until step 5/8 the new triggers honour it this way: a
  reserved `presence` kind refuses the `presence` trigger, a reserved `view` kind refuses `scroll`, each with
  today's report naming the owner. `hover` and `press` are not refused by a kind; a component that animates the same
  property itself is reported by `checkSources` (the registry lists its plays in `running`, as `traceSources` does
  today).

### 3.4 The registry of claims

```ts
const CLAIM_LEVELS = {
  kept: 2,
  driver: 3,
  state: 4,
  hover: 5,
  focus: 6,
  press: 7,
  event: 8,
  presence: 9,
} as const;

interface ClaimSource {
  readonly level: number;
  /** The trigger, or 'legacy:<kind>'. */
  readonly name: string;
}
interface ClaimView {
  readonly channel: Channel;
  readonly level: number;
  readonly source: string;
  /** Whether it is the one seen on the channel. */
  readonly top: boolean;
}
interface HeldClaim {
  readonly handle: MotionHandle;
  /** Stop holding: hands each channel back, and returns the handle of the return. */
  release(): MotionHandle;
}
interface PlayedClaim {
  readonly handle: MotionHandle;
}
interface DrivenClaim {
  seek(progress: number): void;
  stop(): void;
}
interface ClaimRegistry {
  /** State contract: go to the last frame on every channel it is the top of, and hold it. */
  hold(
    source: ClaimSource,
    frames: readonly StyleKeyframe[],
    plan: TimingPlan,
  ): HeldClaim;
  /** Event contract: play the frames, then end as atEnd says ('hold' is the exit of a presence). */
  play(
    source: ClaimSource,
    frames: readonly StyleKeyframe[],
    plan: TimingPlan,
    atEnd: 'release' | 'keep' | 'hold',
  ): PlayedClaim;
  /** Driver contract: an animation on a timeline, or paused and sought. */
  drive(
    source: ClaimSource,
    frames: readonly StyleKeyframe[],
    timeline: AnimationTimeline | null,
  ): DrivenClaim;
  /** A claim that something else animates: a legacy binding (§5). Returns its release. */
  external(source: ClaimSource, channels: Iterable<Channel>): () => void;
  /** Finish at once every transition that runs on the given channels (the layout engine calls it, §3.9). */
  settle(channels: Iterable<Channel>): void;
  claims(): readonly ClaimView[];
}

function claimsOf(element: MotionElement): ClaimRegistry;
```

The order of two claims is their level, then, at the same level, the later started (level 8) or the later attached
(level 4).

**How a channel is shown.** Three representations, and one rule for which is used [Design]:

1. **A transition** is a WAAPI animation with `fill: 'both'`. It always starts from the current computed value of its
   properties, read before anything is cancelled (as `carriedFrames` does [Doc: `animate.ts`]), unless it is an
   event's own first keyframe. The same read gives the `AxisBase` of §3.1.
2. **A hold** is the value a finished transition leaves. It is **an inline value**, written from the keyframe and not
   committed by the browser (WebKit's `commitStyles` can persist the wrong value [Doc: the comment in
   `providers/waapi.ts`]), after which the animation is cancelled. No forwards-filling animation is kept: browsers
   remove one that a later animation overrides, and a fill is "not recommended … to persist the effect of an animation
   indefinitely" [Doc: MDN, Using the Web Animations API].
   **This representation is conditional on the spike** (S 10/10, §4.3): an inline value changes the element's base
   style, and an author's CSS transition on the same property could replay from the rest to the held value. Tailwind's
   `transition` utility covers `translate`, `scale` and `rotate` [Doc: review 12, from `node_modules/tailwindcss`
   4.3.3], and nothing in `animate.ts`, `play.ts`, `providers/waapi.ts` or `bind.ts` handles a `transition` today
   [Doc: review 12]. If the case fails, a hold is the third representation everywhere (§4.3).
3. **The exception: a hold above something that still animates the property.** An animation overrides the inline
   style, so an inline hold cannot sit above an animation on the same property. Two things keep animating under a
   hold and cannot be stopped by the registry: a driver, and a legacy binding's animation (§5.1). There, and only
   there, the hold is a filling animation of zero duration (`fill: 'forwards'`), created after the one under it and
   kept with `persist()`. If the animation under it is created again (a driver's module lands, the policy turns back, a
   legacy loop resumes), the holds above it are created again in the same task.

**A claim that starts under a higher one is covered.** The stack of WAAPI effects on a property follows the order of
creation ("the one created last overrides the other" [Doc: MDN, Using the Web Animations API]), not our levels. So the
registry never lets creation order decide:

- A claim that starts on a property whose top is higher **creates no animation for that property**; it records its
  frame. Its animation is built with its uncovered channels only (`toWaapiKeyframes` takes the channels). A covered
  state dispatches its events at once, with nothing to wait for.
- **Until step 4/8 the unit of covering is the property, not the axis** (§4.2): a claim on `x` under a higher claim on
  `y` is covered, as if both claimed `translate` whole.
- **What a claim that starts above another does to what runs under it**, by what runs (review 12, I1):
  - **a lower state whose transition is still running** (the press starts 50 ms into the hover's transition): the
    registry reads the current value, **stops that transition** (it is cancelled, and its `motion-end` is dispatched
    with `cancelled`) and records the lower state as covered, with its frame. The higher claim animates from the value
    read. Nothing of the lower state is left alive that could later pass over the higher claim's inline hold: a
    property has one inline value and, at most, one registry transition;
  - **a lower event that is still playing** (a manual play under an exit: the only case, since a presence is the only
    level above an event): it is cancelled the same way, and its `atEnd` is applied as data: with `keep`, its last
    keyframe is recorded as the kept frame of the channel, not written over the claim that covers it;
  - **a driver, or a legacy binding's animation**: it cannot be stopped and keeps running, hidden; the hold above it is
    the filling animation of point 3.
- **Hand-back.** When the top claim of a property stops, the registry removes its hold or its animation and, in the
  same task, starts the return:
  - to a covered state's frame or to a kept frame: a transition from the current value to that value, then the hold;
  - to something that runs (a driver, a legacy animation) or to rest: a transition **whose end keyframe is left
    out** (one keyframe, `offset: 0`, holding the current value), so that the browser takes the underlying, live value
    at each frame: "you can specify the offset to indicate where the provided keyframe should be placed" and "the start
    and/or end states can be filled in" [Doc: MDN, `Element.animate()`]. When it ends nothing is left: no hold, no
    inline value for rest.
  - The return uses the timing of the claim that stops.
- **Rest.** Whatever the stylesheet gives: a class, a breakpoint, a `:hover` rule. The registry never reads it to write
  it back.

**`atEnd`** (the model, §3.5), in the slice:

| Play              | At its end                                                                                                                                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `presence` enter  | `release`: the animation is cancelled and nothing is written. If its last keyframe differs from what is under it, the channel jumps; development reports it once per element with the model's message. |
| `presence` exit   | `hold`: the last keyframe stays, as the presence's own claim (level 9), until the element is hidden or removed or enters again; then everything it wrote is released.                                  |
| `Attachment.play` | `keep` by default: the last keyframe becomes the kept frame of each of its channels (level 2), inline; a `null` value keeps nothing. `release` on request.                                             |
| A legacy binding  | §5.2.                                                                                                                                                                                                  |

A kept frame is replaced by a new keep on the channel, survives a `release`, and is removed by `detach`.

**The state tween is one replaceable function** (the model, §3.9):

```ts
/** How a state goes from where a property is to where it must be. */
type StateTween = (request: {
  element: MotionElement;
  /** WAAPI keyframes: the current values, then the target; or the current values alone, for a live end. */
  keyframes: Keyframe[];
  timing: SpringRef | CurveTiming;
  scale: number;
  /** What the transition being replaced was doing, when it was a state tween: for a tween that carries velocity. */
  interrupted?: { handle: MotionHandle; timing: SpringRef | CurveTiming };
}) => MotionHandle;
function setStateTween(tween: StateTween): void;
```

The type and its slot are in the core (`player.ts`). The tween that ships is in the `states` entry (`state-tween.ts`),
which installs it when it loads: only states use it, and they load on first use. At this step it is the spring as a
`linear()` easing through `resolveWaapiTiming`, which starts at zero velocity (the existing path). `interrupted` is
passed and unused: it is what candidates B and C of §9.2 read. If the maintainer picks C, it replaces this one in
`state-tween.ts`, in the `states` entry, not in the core.

### 3.5 Presence

- **Slots.** `presence: 'rise'` enters with `rise` and exits with it backwards; `{ enter, exit }` gives each its
  motion; `{ exit }` alone has no entry; `exit: 'none'` leaves at once.
- **Backwards** (the model, §3.3): the keyframes in the reverse order. In the slice a motion has neither `offset` nor a
  keyframe `easing`, so nothing else is defined here. Its timing is the motion's `timing` when it has one, else the
  exit default (effects springs).
- **An exit written apart** plays its keyframes forwards, from the current values when it has one keyframe.
- **Enter**: `data-motion-phase="enter"`, `inert` released, the play at level 9 from its first keyframe (from the
  current values when it interrupts an exit), then `rest`.
- **Exit**: focus inside moves to `restoreFocus`; `data-motion-phase="exit"`; `inert` now, or once focus has left;
  the play; its last keyframe held. All of this is today's behaviour of `createBinding` [Doc: `bind.ts`], moved to
  `presence-state.ts` and called by both.
- **During an exit the states are not evaluated**: `set(true)` of a hover or a press on an element whose phase is
  `exit` is recorded and creates nothing.
- **`hidden`.** An element that stays in the DOM follows `setPresentByHidden(element, present, [attachment])`: an
  `Attachment` is a `PresenceTaker` [Doc: `hidden-presence.ts`], so the function is used as it is.
- **The policy turning to reduced while an entry or an exit runs** seeks it to its end, as today.

### 3.6 Events and the mark

- **`motion-start`** then **`motion-end`**, `CustomEvent`s dispatched on the element, `bubbles: false`,
  `composed: false`, not cancelable. `detail`:
  `{ trigger: string; phase: 'enter' | 'exit'; reduced: boolean }`, and `outcome: 'finished' | 'cancelled'` on
  `motion-end`.
- Who dispatches: an entry and an exit of `presence`; each transition of a state (`enter` when it becomes active,
  `exit` when it stops); a manual play (`trigger: 'manual'`, `phase: 'enter'`). A driver dispatches nothing. A
  legacy binding dispatches nothing.
- A transition that is replaced before its end dispatches `motion-end` with `cancelled`, before the `motion-start`
  of what replaces it.
- Under reduced motion both are dispatched in the task of the trigger, `motion-end` with `finished`; with the
  `fade` form, `motion-end` waits for the fade.
- **`data-motion-phase`**: `enter`, `rest`, `exit`; the presence's only. **From this step the legacy presence
  writes it too**, beside its old mark, so that an author's CSS can move to it early.
- **The old mark and the new attribute have one name**, `data-motion-presence`: the old model writes
  `entering | present | exiting` there and an author of the new HTML writes a motion name. The rule [Design]:
  - the new presence never writes `data-motion-presence`; only a legacy binding does, with its old values;
  - the three old values are reserved motion names (§3.1), and the scanner reads a `data-motion-presence` holding one
    of them as the mark, not as a trigger;
  - an element cannot have both presences (§5.1), so the two never write the same attribute;
  - one reader, `presencePhaseOf(element)`, in `presence-state.ts`, returns `enter`, `rest`, `exit` or undefined
    from either attribute. `layout/flush.ts` (`isPresenceBusy`), `box.ts`, `shared-registry.ts`, `layout/scope.ts`
    and `scope-entry.ts` read the phase through it [Doc: grep of `data-motion-presence`, 2026-11-28].

### 3.7 The first frame

- **`enterOnAttach`** defaults to true for an element inserted after the first paint and to false for content painted
  before it was attached. Who decides: the scanner passes `false` for the elements of its first scan and `true` for
  an insertion (today's `entering` [Doc: `connect.ts`]); React passes `false` while hydrating (today's `settled`
  computation [Doc: `useMotion.ts`]); a bare `attach()` defaults to true. An element whose `data-motion-phase` is
  `rest`, or whose old mark is `present`, attaches without an entry whatever the option.
- **No flash.** The entry's animation is created in the task that attaches, with `fill: 'both'`, so its first keyframe
  is what is painted first, during a `delay` too. React attaches in the commit (a callback ref); the scanner attaches
  in the `MutationObserver` callback, a microtask (the model, §7.6).
- **An absent element** (`present: false` at attach) takes the last keyframe of its exit at once (under reduced
  motion: its rest, with the opacity of that keyframe), the phase `exit` and `inert`, as today.
- **A state has no first frame. A driver** writes at its first progress; until its module lands the element is at rest.
  The slice measures the jump (§7.5) and changes nothing else.
- **Svelte, and how it knows** [Design; plan question 6]. Svelte 5 gives a component no public way to tell a hydration
  from a client mount: `hydrate()` and `mount()` are documented with their options only, `onMount` and `$effect` "do
  not run during server-side rendering" in both cases, an attachment runs "in an effect" when its element mounts with
  no word on hydration, and `svelte/reactivity` exports no such flag [Doc: svelte.dev, `svelte`, `{@attach}`,
  `svelte/reactivity`, fetched 2026-11-28]. The `hydrating` flag is in `svelte/internal`, which is not public: it is
  not used. The model's rule does not need Svelte anyway: it speaks of **content painted before it was attached**,
  which is a fact of the document.
  - **The mechanism, in the core** (`inserted.ts`, exported): `watchInsertions()` starts, once per document, a
    `MutationObserver` on the document (`childList`, `subtree`) that records in a `WeakSet` every node a script
    adds once the document is no longer loading (`document.readyState` is not `'loading'`: what the parser adds is
    page content). `insertedByScript(element)` first drains the pending records with `takeRecords()`, which "returns
    a list of all matching DOM changes that have been detected but not yet processed" [Doc: MDN], so that it is exact
    even when the attachment runs in the task that inserted the element; then it is true when the element or one of
    its ancestors is in the set.
  - **The Svelte adapter** calls `watchInsertions()` when its motion module is evaluated, and the attachment's default
    becomes: `settled: !insertedByScript(target)`. Server content that Svelte hydrates was put there by the parser and
    is reused, not inserted: no entry. An element that an `{#if}` or a client mount creates later is inserted by
    script: its entry plays. An explicit `settled`, and the old mark `present`, still win.
  - **Where it errs, and on which side.** Nodes added before the module was evaluated are unknown and count as page
    content: no entry, never a flash. Server HTML that a script injects (`innerHTML`, a fragment fetched and inserted)
    and then hydrates counts as inserted: its entry replays, which is today's behaviour, not a regression; the author
    passes `settled: true` there. A hydration that Svelte repairs by creating the nodes again plays the entry of what
    it created.
  - **The test cannot be the plan's jsdom one**: a test that writes the server HTML with `innerHTML` is the injected
    case above. Case O5 is a browser test on a page whose server HTML is parsed, in the form of the existing
    `packages/tailwind/tests/*-svelte-hydration.browser.spec.ts` [Doc: ls]. `inserted.ts` has a unit test of its own
    (a node added while loading, after loading, a descendant of an added node, the drain in the same task).
  - React and the scanner keep their own signals at this step (§3.7, first point). Step 5/8, which gives the three
    adapters and a bare `attach()` one default, may move them to this one; nothing here depends on it.
- `enterOnAttach: true` on server content is reported once in development and plays no entry, until the adapters
  render the first keyframe (step 5/8).

### 3.8 The reduced path

Reduced means: the policy is reduced, or `--udx-motion: none` applies to the element, or its scale is 0. Under the
last two, `fade` is `end`.

| Trigger          | Default | What happens                                                                                                                                                                                                                                                           |
| ---------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `presence`       | `fade`  | Only `opacity` animates, on `spring.default.effects`: the motion's opacity keyframes, or 0 to 1 (1 to 0 on an exit) when it has none. Every other property is set at once: at its end on an entry (which, at `release`, is nothing written), kept as it is on an exit. |
| `hover`, `press` | `end`   | The frame is held at once and given back at once; no animation is created.                                                                                                                                                                                             |
| `scroll`         | `none`  | No animation; the element keeps its rest. The policy turning back starts it at the current scroll position.                                                                                                                                                            |
| manual           | `end`   | The last keyframe at once, kept or released as `atEnd` says.                                                                                                                                                                                                           |

- The motion's `reduced` overrides the default under any trigger: `fade`, `end`, `start`, `none` or a keyframe.
  Under a state, `fade` animates the opacity of the frame and sets the rest at once, both ways; under a driver, `fade`
  is `none`; `start` under a state is `none` (the model, §3.1.4).
- The policy is followed while attached (`runtime.policy.subscribe`, as the bindings do today): a held state stays
  held; a running transition is finished at once.
- `resolveReducedRender` and `reduced-render.ts` stay the old path's.
- **A state that stops under `fade`** [Design; review of task 4/35]. `ReducedPlan` gains no field: neither a release
  flag nor the rest frame. It describes the held frame only, and for a state it is the same in both phases on purpose:
  it **partitions the frame's properties**, `fade` naming those that animate (the opacity) and `set` those that change
  at once. Where a property goes when the state stops is not the plan's to know and not the trigger's to read: it is
  the registry's hand-back (§3.4), whose target is a covered state's frame, a kept frame, or rest by an end keyframe
  left out. So the state trigger does not rebuild a plan from a rest it has read. It passes the partition to the
  registry, both ways:
  - becoming active: the `set` properties are held at once, the `fade` property goes to its held value on
    `spring.default.effects`;
  - stopping: the `set` properties are handed back at once (no return transition), and the `fade` property is handed
    back by the ordinary return, on `spring.default.effects`: the opacity goes back to whatever is under it.
  - For this, `ClaimRegistry.hold` and `HeldClaim.release` take the channels to change at once
    (`{ atOnce?: Iterable<Channel> }`); under `end` every channel of the frame is in it, which is the R1 path. The
    frames `reducedPlan` returns for a state's `exit` are therefore read for their keys, not their values, and its
    TSDoc says so.
- **The timing of a driver group at this step** [Design; same review]. Confirmed: for `scroll`, the only driver of
  step 3/8, the group's timing is the length of an animation that is sought or run by a timeline, and nothing else; its
  duration is never a time anyone sees and its easing is `linear` by §3.2. The constant in `timing-plan.ts` is that
  length, not a default of drivers. The model's rule that `loop`, the time driver, reads the motion's timing (its
  duration is the period) is implemented with `loop` at step 5/8: the plan then takes the motion's timing for that one
  driver, and nothing written now has to change shape for it.

### 3.9 Layout with a held state

The layout stays a legacy binding in the slice (`data-motion="reflow"`, `name="reflow"`). Three things go wrong today
when a state moves `translate` or `scale` of an element the engine follows [Doc: `layout/flush.ts`, read; Hyp for
the visible effect, each confirmed by a failing test before it is fixed]:

1. **At rest**, the engine compares the element's visual box with the one it cached, and a visual box includes the own
   transform. A hover alone therefore looks like a move, and the next flush plays a flight from the old place.
2. **A flight that starts during a transition** takes the own transform of that instant as its rest, and its animation,
   created later, hides the transition; at its end the element jumps to where the state has gone.
3. **A state that changes during a flight** is hidden by the flight, then appears at once when the flight ends.

The contract between the registry and the engine [Design]:

- **At rest, the engine compares layout boxes when the visual box differs.** If the layout box (the visual box with the
  own transform undone, `toLayoutBox`) is the cached one, nothing moved: the engine refreshes its cached rest and
  visual box and plays nothing. This costs one computed style, only for an element whose visual box changed.
- **Before a flight is planned for an element**, in the engine's write pass, it calls
  `settleClaims(element, ['x', 'y', 'scaleX', 'scaleY'])` of `claim-bridge.ts`: the transitions on those channels finish at once, so the
  rest the engine then measures is where the state is going. The flight starts from the place on the screen (measured
  before) and carries the remaining travel.
- **While an element flies**, a hold or a release on one of those four channels is applied at once (no transition of
  its own), and the registry calls `layoutEngine().retarget(element)`: the engine plans the flight again from where
  the element is, with the velocity it has (`flyingChange`), towards the new rest. `layoutEngine().isFlying(element)`
  tells the registry which case it is in.
- **The engine reaches the registry through the bridge, never through `claimsOf`** [Design; the planner's choice,
  confirmed]. `claim-bridge.ts` gains `registerSettler(settle)` and `settleClaims(element, channels)`: the registry
  registers its `settle` when it is first created, and `settleClaims` does nothing for an element that has no registry.
  The layout entry therefore imports a few lines, not the registry: it has 0.76 kB of headroom, and a page with a
  layout and no new trigger must not pay for the claims. The other direction needs no bridge: the registry, in the
  core, calls `layoutEngine()`, which the core already has (`layout-loader.ts`), and does nothing when the engine is
  not loaded.
- `retarget` and `isFlying` are added to the layout entry's public functions. The `layout` entry weighs 13.3 kB for
  a ceiling of 14.1 [Doc: `size-report.json`, `.size-limit.json`]: §6.3 applies.

### 3.10 HTML

One attribute per trigger, whose value is a motion name, and one attribute per option, named after its trigger (the
model, §5.5). The slice reads:

```html
<li data-motion-presence="rise">…</li>
<div data-motion-presence="rise" data-motion-presence-exit="fade" hidden>…</div>
<p data-motion-presence-exit="fade">…</p>
<article data-motion-hover="lift" data-motion-press="dip">…</article>
<img
  data-motion-scroll="parallax"
  data-motion-scroll-range="cover"
  data-motion-scroll-container="#feed"
/>
```

| Attribute                                             | Value                                                                                                                                            |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `data-motion-presence`                                | A motion name: the entry, and the exit backwards.                                                                                                |
| `data-motion-presence-exit`                           | A motion name, or `none`. Alone, the element has no entry.                                                                                       |
| `data-motion-presence-enter-on-attach`                | `true` or `false`.                                                                                                                               |
| `data-motion-restore-focus`                           | Unchanged: a selector.                                                                                                                           |
| `hidden`                                              | Unchanged: the presence of an element that stays in the DOM.                                                                                     |
| `data-motion-hover`, `data-motion-press`              | A motion name.                                                                                                                                   |
| `data-motion-scroll`                                  | A motion name.                                                                                                                                   |
| `data-motion-scroll-range`                            | A range name, or two offsets separated by a comma (`entry 0%, cover 50%`; with `data-motion-scroll-track="container"`: `scroll`, or `0%, 50%`).  |
| `data-motion-scroll-axis`, `data-motion-scroll-track` | The option's word.                                                                                                                               |
| `data-motion-scroll-container`                        | A selector, looked up in the document when the trigger is attached; one that matches nothing is reported in development and the default applies. |
| `data-motion-<name>`, `data-motion-<name>-<option>`   | A trigger defined with `defineTrigger`: a motion name, and its options as strings.                                                               |
| `data-motion-phase`                                   | Written by the package.                                                                                                                          |

- A boolean is `"true"` or `"false"`; the attribute alone is `"true"`.
- The scanner (`connectMotion`) selects and observes these attributes beside `data-motion`, and builds one
  `attach` per element from them; a change of one of them is an `update`; a removal of the last one is a
  `detach`. A trigger defined after the scanner connected adds its attributes to the selector and the observer
  [Test: that `observe()` called again on the same root replaces its options in the three engines].
- `data-motion` and its list keep working, on the same element too (§5.1).
- A motion is always a name in HTML.

### 3.11 React

```tsx
<Motion as="li" presence="rise">…</Motion>
<Motion presence={{ enter: 'rise', exit: 'fade' }} present={open} onMotionEnd={(event) => done(event.detail)} />
<Motion as={Card} hover={{ keyframes: { scale: 1.04 } }} press="dip" />
<Motion as="img" scroll={{ motion: 'parallax', range: 'cover' }} />
<Motion name="reflow" hover="lift" />
```

- **New props of `<Motion>`**: `presence`, `hover`, `press`, `scroll`, `triggers`, `onMotionStart`,
  `onMotionEnd`, with the core's types. `name` and every prop of today stay (the model, §7.7). None of the new names
  is a native attribute.
- **`useMotion`** gains the object form beside today's: `useMotion(options)`, where `options` is
  `Triggers & { present?, onMotionStart?, onMotionEnd?, name? }`. It is told from a source by its shape: a string, an
  array, or an object with `keyframes` or `spec` is today's first argument. It returns `ref`, `mounted`, `play`,
  `binding`, and today's `getBinding`.
- **One ref callback attaches both sides**: the legacy sources through `motionsWhenDefined`, as today, and the
  triggers through one `attach`; `present` goes to both; `mounted` stays true until both exits have ended; a
  change of a trigger prop is an `update` (no re-attach of the element).
- **`enterOnAttach`** is passed `false` while hydrating unless the prop sets it, with the computation `settled`
  uses today.
- **`motionRef`**: `play(what)` keeps today's meaning for no argument and for the five kind words (reserved motion
  names since §3.1) and otherwise is `Attachment.play`; `binding(trigger)` is new; `getBinding(kind?)` stays.
- **Events**: `onMotionStart` and `onMotionEnd` are listeners on the element `Motion` renders (for a component, on
  the box: the component's root), added in the ref callback. They receive the `CustomEvent`.
- **A component** (`as={Card}`): the wrapper carries the phase, `hidden` and `inert`; the claims and the
  listeners of `hover` and `press` go to the box, through `boxless`, as the pixels do today.
- `<Presence>` is not changed: its children's presence reaches `attach` through the same `present`.

---

## 4. C1: the mechanism of a channel

### 4.1 The facts

| #   | Fact                                                                                                                                                                                                                                                                                                                                                                | Tag                                                                                                              |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 1   | The WAAPI provider writes `translate` whole from `x` and `y` (a missing axis is 0), and `scale` whole from the scales (a missing axis is 1).                                                                                                                                                                                                                        | [Doc: `providers/waapi.ts`, `frameToKeyframe`]                                                                   |
| 2   | With the default composite operation, `replace`, "the keyframeEffect overrides the underlying value it is combined with". Two animations on `translate` therefore do not combine per axis: the one created last gives both axes ("typically, when two animations would set the same style property of the same element, the one created last overrides the other"). | [Doc: MDN, `KeyframeEffect.composite`; Using the Web Animations API]                                             |
| 3   | `composite: 'add'` adds the effect "to the underlying value"; the option is Baseline widely available (September 2022). How two `translate` values or two `scale` values add is not written for the individual properties: the draft gives their animation type ("by computed value") and defines addition and accumulation for transform lists only.               | [Doc: MDN; CSS Transforms 2 draft] then [Test]                                                                   |
| 4   | The computed value of `translate` keeps its percentages.                                                                                                                                                                                                                                                                                                            | [Doc: CSS Transforms 2 draft]                                                                                    |
| 5   | A custom property interpolates once it is registered (`CSS.registerProperty` or `@property`, Baseline 2024, since July 2024). Registering a name twice throws `InvalidModificationError`; a JavaScript registration wins over a CSS one; an initial value must be computationally independent.                                                                      | [Doc: MDN]                                                                                                       |
| 6   | An animation given one keyframe with `offset: 0` takes its end from the current state.                                                                                                                                                                                                                                                                              | [Doc: MDN, `Element.animate()`]                                                                                  |
| 7   | Browsers remove a finished, filling animation once a later one overrides every property it sets.                                                                                                                                                                                                                                                                    | [Doc: MDN, Using the Web Animations API]                                                                         |
| 8   | An animation of `translate` or `scale` with `replace` can run on the compositor; an animation of a custom property, or with another composite operation, cannot.                                                                                                                                                                                                    | [Hyp]: Chrome's page says only that the failure reasons are in the DevTools trace; not found in an official list |

### 4.2 The decision

**A property is animated whole as long as one claim holds it, and split per axis only when two claims need its two
axes.** [Design]

**What step 3/8 does with this decision** (review 12, I5): it runs the spike, which settles the mechanism, and **builds
the whole mode only**. No scenario of the slice needs the split: its own arbitration is whole, a legacy binding holds
both axes (§5.1), and the layout is apart. `channel-split.ts` is written at step 4/8 with `timingBy`, its other user,
on the verdict of the spike, and as a module loaded the first time an element needs it. Until then a second claim on
the other axis of a property is **covered at the level of the property** (§3.4), and the axis a motion does not name
keeps its value (§3.1). `claims.ts` keeps the channel as its key and the property as its unit of covering, so that step
4/8 changes one function, not the registry.

- **Whole** (the common case, and the only one for every property that has one channel): one WAAPI animation writes the
  CSS property, as today. The slice's own arbitration, hover and press both on the `scale` shorthand, is whole: both
  claim the two channels of `scale`, so the levels decide and nothing is split.
- **Split** (step 4/8): `translate` or `scale` goes to split mode on an element when a claim must animate or hold one of its
  channels while a different claim is the top of the other (a hover on `y` while a presence moves `x`). The step
  4/8 option `timingBy` with two timings on `x` and `y` will use the same mode.
- **The split mechanism is a registered custom property per axis**:

  | Channel  | Custom property             | Syntax                | Initial value |
  | -------- | --------------------------- | --------------------- | ------------- |
  | `x`      | `--udx-motion-axis-x`       | `<length-percentage>` | `0px`         |
  | `y`      | `--udx-motion-axis-y`       | `<length-percentage>` | `0px`         |
  | `scaleX` | `--udx-motion-axis-scale-x` | `<number>`            | `1`           |
  | `scaleY` | `--udx-motion-axis-scale-y` | `<number>`            | `1`           |

  All four with `inherits: false`, registered with `CSS.registerProperty` the first time a property is split in a
  window (an `InvalidModificationError` means another copy of the package did it, and is ignored). The prefix `axis-`
  is reserved for trigger names.

- **Entering split mode**, in one task: read the computed value of the property and take each axis from it; for each
  registry animation that runs on the property, create its twin on the custom properties (the same keyframes, each axis written on its custom
  property, same timing) with the same `startTime` (`startTime` is how two animations are
  synchronised [Doc: MDN, `Animation.startTime`]) and cancel the original; write inline the custom property of each
  axis that is held or at rest, and `translate: var(--udx-motion-axis-x) var(--udx-motion-axis-y)` (or the `scale`
  pair).
- **In split mode** each axis is an ordinary one-channel property: every rule of §3.4 applies to its custom property
  unchanged, the live end keyframe and the driver included.
- **Leaving split mode**: when one claim at most is left on the property and no transition runs on it, the registry
  writes the whole value inline (or nothing, at rest) and removes the custom properties, in one task.
- **Why not whole always**: two claims on two axes is the model's own example (§3.5), and `timingBy` needs it. **Why not
  split always**: fact 8, if it holds, takes every entry off the compositor, on the lists where it matters most.
  **Why custom properties rather than `add`**: each axis keeps the plain meaning of §3.4 (a value replaces what is
  under it, `x: 0` is zero and not "where the element rests", a state above a driver hides it), whereas `add` sums with
  everything under it, cannot hide a driver on the same axis, and has an unwritten rule for `scale` (fact 3).

**Costs, accepted** [Design]:

- In split mode the property is animated on the main thread [Hyp, fact 8]. It lasts as long as two claims share the
  property.
- In split mode the axis that is at rest holds the value the stylesheet gave when the split began, until the split
  ends: a breakpoint that changes the rest `translate` of a split element is seen when the split ends.
- In whole mode the axis a motion does not name keeps the value read when the claim started (§3.1): a breakpoint that
  changes it while a state holds is seen when the hold ends.
- A legacy binding animates its property whole and cannot be converted: **a legacy claim on one channel holds both
  channels of its property** (§5.1).

### 4.3 The spike, before `claims.ts` is written (gate 1/3)

One browser spec file, `packages/motion/src/spike/c1-channels.browser.spec.ts`, run alone in the three engines the
package tests (`MOTION_BROWSERS=chromium,firefox,webkit` [Doc: `vite.config.mts`]). It uses the DOM and WAAPI only,
no code of the package. Values are read with `getComputedStyle` in `requestAnimationFrame` callbacks; animations are
paused and sought (`currentTime`) wherever a case does not need real time, so that the reads are exact. Tolerances:
0.5 px, 0.005 of a scale. Its report is `docs/superpowers/reports/2026-11-28-motion-step3-c1-spike.md`: one table,
case by engine, with the values read.

| Case    | What is tested                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Pass                                                                                                                                                                                                                                                                                                                                                        |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S 1/10  | Two `replace` animations on `translate`, one to `40px 0px`, one created after it to `0px 20px`, both sought to their end.                                                                                                                                                                                                                                                                                                                                                                                                                                        | The computed value is `0px 20px`: the fact that makes the mechanism necessary. A failure here means fact 2 is wrong and the decision is reopened.                                                                                                                                                                                                           |
| S 2/10  | The four custom properties registered; inline `translate: var(…) var(…)`; two animations, one per axis, with different durations and easings, sought to 25 %, 50 %, 75 %. The same with a percentage on one axis, and with the `scale` pair.                                                                                                                                                                                                                                                                                                                     | Each axis has the value its own animation gives, at each instant.                                                                                                                                                                                                                                                                                           |
| S 3/10  | The live end keyframe: an animation of one keyframe, `offset: 0`, above (a) a lower animation of `scale` that is sought further between two reads, (b) the same on a custom property of S 2/10, (c) a stylesheet rest that a class changes half-way, (d) where the engine has `ViewTimeline`, a scroll-driven animation while the page is scrolled by script.                                                                                                                                                                                                    | At progress p the value is the mix, at p, of the held start and the underlying value **as it is at that read**; at the end it equals the underlying value, and removing the animation changes nothing.                                                                                                                                                      |
| S 4/10  | Whole to split: an animation of `translate` runs in real time; at about 40 % it is replaced, in one task, by its twins on the custom properties with the same `startTime`.                                                                                                                                                                                                                                                                                                                                                                                       | The value read just before and just after, in that task, differs by less than the tolerance; over the next ten frames it stays within 1 px of an untouched reference animation started at the same time.                                                                                                                                                    |
| S 5/10  | A hold above a driver: a zero-duration `fill: 'forwards'` animation created after a paused lower one; then the lower one is cancelled and created again, and the hold too, in one task.                                                                                                                                                                                                                                                                                                                                                                          | The hold's value is read at every frame, before, during and after; `replaceState` of the hold is `active` throughout.                                                                                                                                                                                                                                       |
| S 6/10  | `CSS.registerProperty` called twice with the same name; an unregistered custom property animated.                                                                                                                                                                                                                                                                                                                                                                                                                                                                | The second call throws `InvalidModificationError` and nothing else changes; the unregistered property does not interpolate (it is how the code detects that registration is missing).                                                                                                                                                                       |
| S 7/10  | `composite: 'add'` on `translate` (`10px 0px` on an underlying `0px 5px`) and on `scale` (`1.5` on an underlying `2`).                                                                                                                                                                                                                                                                                                                                                                                                                                           | No pass or fail: the three results are written down. They decide whether fallback 1 exists.                                                                                                                                                                                                                                                                 |
| S 8/10  | Chromium only, by hand, in the DevTools performance trace: a whole `translate` animation, then the same in split mode.                                                                                                                                                                                                                                                                                                                                                                                                                                           | No pass or fail: whether each is composited is written down, with the failure reason shown. It confirms or refutes fact 8.                                                                                                                                                                                                                                  |
| S 9/10  | The first frame: an element is inserted and, in the same task, put in split mode with an animation whose first keyframe is `opacity: 0` and `--udx-motion-axis-y: 24px`, with a delay of 200 ms.                                                                                                                                                                                                                                                                                                                                                                 | The first frame painted and every frame of the delay read the first keyframe; none reads the rest.                                                                                                                                                                                                                                                          |
| S 10/10 | An inline hold against an author's CSS transition (review 12, B2). An element with `transition: scale 200ms` (then with Tailwind's `transition` utility, then with `transition: all`). (a) A WAAPI animation of `scale` from 1 to 1.04 ends; in one task its last value is written inline and it is cancelled, in each of the two orders (write then cancel, cancel then write). (b) The return: the inline value is removed and, in the same task, an animation of one keyframe (`offset: 0`, 1.04) starts. (c) The same two with `translate` and a percentage. | (a) At each of the next twenty frames the value read is the held one, 1.04, within the tolerance, and `getAnimations()` lists no `CSSTransition`, for at least one of the two orders, the same in the three engines. (b) No frame reads a value outside the range between 1.04 and the rest, no jump, and the value ends at rest with nothing left running. |

**The verdict.**

- S 2/10, S 3/10 (a, b, c), S 4/10, S 5/10, S 6/10 and S 9/10 pass in the three engines: the decision of §4.2 stands; step
  4/8 writes `channel-split.ts` on it, and `claims.ts` is written now with the property as its unit of covering. The cases that state a fact stay as `engine-facts.browser.spec.ts`; the spike folder
  is deleted.
- **Fallback 1**, if S 2/10, S 4/10 or S 9/10 fails in an engine: the split is made with `composite: 'add'` instead: in
  split mode each axis is an animation of the property that writes its own axis and the neutral value on the other
  (`translate: 0px <y>`), added to an inline value that holds the other axis. It exists only if S 7/10 shows the same
  sum for `translate` in the three engines and one rule for `scale`. Its two limits are then written in the docs: an
  axis in split mode cannot hide a driver on the same axis, and the return to rest of a split axis aims at the rest
  read when the split began.
- **Fallback 2**, if neither holds: no split. The arbitration is per CSS property: the higher claim takes `translate`
  or `scale` whole and carries the other axis at the value it had. This changes a decision the model records (§3.5,
  the channel): it goes back to the designer, who amends the model, before anything is written.
- If S 3/10 fails for (a) or (b): the hand-back to something that runs becomes an explicit transition to the value
  read at that instant, then the release; a jump of the size of what moved underneath during the return is then
  possible, and the model's §3.5 sentence on drivers is amended. If it fails for (d) only: the scroll driver uses its
  JavaScript implementation in that engine.
- **If S 10/10 (a) fails** in an engine, in both orders: "a hold is an inline value" is dropped, **before `claims.ts` is
  written**. Every hold is then the filling animation of §3.4's point 3 (zero duration, `fill: 'forwards'`, kept with
  `persist()`, created again above whatever is created under it): the base style never changes, so no CSS transition
  can start. Its costs are written in the docs: an animation stays alive per held property, and an author's inline
  style on a held property is hidden while the state holds. Not chosen as a fallback: neutralising the author's
  `transition` on the held property, which rewrites a style the package does not own. If only one order passes, that
  order is the rule and S 10/10 stays as a regression test.
- **If S 10/10 (b) fails**: the return to rest does not remove the inline value first; it animates to the rest read at
  that instant with the element's `transition` left as it is, then removes the inline value in the task where the
  animation is cancelled; the live end keyframe is then kept for the hand-back to a driver only, and the model's §3.5
  sentence on the return to rest is amended.
- If S 5/10 fails: a state above a driver on the same property stops the driver's animation while it holds, and starts
  it again at the hand-back.
- If `CSS.registerProperty` is missing at run time (S 6/10's detection): no split on that page; the second claim is
  covered at the level of the property, and development reports it once.

---

## 5. C3: the old bindings during the coexistence

### 5.1 One element, both sides

- **A legacy binding claims, it does not animate through the registry.** Its code (`playMotion`, `startScrub`, the
  loop) is not rewritten. While it plays it holds an **external claim** on the properties it writes:

  | Legacy verb           | Level | From                                                   | Until                                                                  |
  | --------------------- | ----- | ------------------------------------------------------ | ---------------------------------------------------------------------- |
  | `appear`, `disappear` | 9     | each entry or exit starts                              | it ends (an exit: until the element is hidden, removed or shown again) |
  | `emphasize`           | 8     | each play                                              | it ends                                                                |
  | `reveal`              | 8     | it waits out of view in its first frame, and each play | it ends                                                                |
  | `scrub`, `loop`       | 3     | its animation is created                               | its animation is cancelled                                             |
  | `layout`              | none  |                                                        | the layout is apart (§3.9)                                             |

- **A legacy claim holds whole properties**: both channels of `translate` and of `scale` (§4.2).
- **The bridge is one small module**, `claim-bridge.ts`: a `WeakMap` from an element to its external claims, and
  `claimExternally(element, source, properties)`, which returns the release. `bind.ts` calls it where it calls
  `traceSources` today, and `continuous.ts` where it creates and cancels its animations. The bridge imports nothing of
  the registry: the registry reads the map when it is created for an element, and subscribes to it. So a page with no
  new trigger pays a `WeakMap` write per play, and the `continuous` entry does not grow by the registry.
- What the registry does with an external claim: a new claim under it is covered (§3.4); a new claim above it animates
  from the current value, and its animation, created later, is the one seen; a hold above a legacy `scrub` or `loop`
  on the same property is the filling animation of §3.4, created again each time the legacy animation is.
- **A trigger given both ways.** The new one wins, in the core, for every entry point:
  - `presence` and a legacy presence (`appear`, `disappear`) on one element: the legacy one is not bound, or is
    destroyed if it was bound first; development reports it once per element, naming both.
  - `scroll` and a legacy `scrub`: the same.
  - `hover` and `press` have no legacy equivalent.
- The old check "one motion of each kind, the first listed" stays, for legacy bindings only.

### 5.2 What a legacy binding leaves at its end

**Today's rule, unchanged until the end of step 5/8**: `restingFields`. The neutral values are given back to the
stylesheet (opacity 1, x and y 0, scale 1, rotate 0, a drawn shape) and a value that is not neutral stays inline
[Doc: `play.ts`]. Not the new `release`. [Design]

- Why: the Angular and Svelte adapters and their tests stay on the old path until step 5/8; the Troubleshooting page
  documents the rule; step 3/8 only adds. One element can show both rules side by side (a legacy emphasis and a new
  presence): each is the rule of its writing, and the docs of the slice say so in one sentence.
- **In the registry's terms.** When a legacy play ends, its release runs after the legacy code has written and
  released its inline values (the bridge subscribes to the handle's `finished` after `playMotion` has, so its reaction
  runs later in the same microtask checkpoint, before any paint [Doc: MDN, microtask guide]). The registry then, for
  each property the claim held:
  - if a new claim is the top there, writes that claim's hold again (the legacy release may have removed it), or starts
    the hand-down to a covered state from the current value;
  - else, if the legacy play left an inline value, records it as a **kept frame** (level 2): it is exactly what the
    model calls one. It is removed when the legacy binding is destroyed.
- The removal of `restingFields` and of this subsection is part of the single removal task that ends step 5/8.

### 5.3 The amplitude, and the step where it goes

- **The new path never has it** (§3.1): from its first task it multiplies durations and delays only.
- **The old path loses it at step 3/8, in its last task, after gate 2/3** (§10). Until then the old path is untouched,
  which is what lets the demo show the same entry under each rule with shipped code, not a mock-up (§9.4).
- That task, if the maintainer confirms the rule (question 2): `playMotion`, `bind.ts` (`writeFrame`, `playEntry`),
  `continuous.ts` (the loop) and `scroll.ts` (the scrub) stop calling `amplitudeOf` and `distanceScaleOf`;
  `motionScaleIn` loses its upper bound and `startRoutedMotion` its refusal of a scale above 1 [Doc:
  `motion-style.ts`, `timing-integration.ts`]; the layout flight reads the same unbounded scale. `amplitudeOf` and
  `distanceScaleOf` stay exported, with a TSDoc line that says they are no longer called and go at the end of step
  5/8.
- The tests concerned, each read with the code it tests: in `packages/motion/src`, `scrub.browser.spec.ts` ("scales
  the distance of its keyframes by --udx-motion-scale"), `loop.browser.spec.ts`, `play.browser.spec.ts`,
  `bind.browser.spec.ts`, `fallbacks.browser.spec.ts`: an assertion on a scaled distance becomes the full distance;
  an assertion that only slows or stops a motion stays. `amplitude.spec.ts` stays (the function still exists).
  `animate.browser.spec.ts`, `curve-tokens.browser.spec.ts`, `motion-css.browser.spec.ts` and the Search, Switch and
  Slider specs of core, the adapters and tailwind assert durations and are not touched [Doc: grep of
  `udx-motion-scale` in the spec files, 2026-11-28]. The README's "Document motion scale" and Loop sections and the
  docs pages that describe the scale are rewritten in the same task.
- If the maintainer prefers the amplitude: the task is the inverse one (the model, §7.8), and the new reader gains the
  amplitude for the shorthands only. It goes back to the designer first.

---

## 6. C4: the weight of a core that carries both models

### 6.1 The measure today

`core` weighs 21.16 kB gzipped for a ceiling of 25 kB: 3.84 kB are free. `layout` 13.34 of 14.1; `continuous` 7.70
of 8.1; `scope` 2.53 of 2.7; `presets` 2.24 of 2.4 [Doc: `size-report.json`, `.size-limit.json`]. The `core` line
measures everything `dist/index.js` exports, without the six lazy chunks.

### 6.2 The budget

| What                                                                 | Entry           | Estimate, gzipped [Hyp]         |
| -------------------------------------------------------------------- | --------------- | ------------------------------- |
| Reader, axis base, timing plan, reduced forms, player                | `core`          | 1.4 kB                          |
| Registry of claims, the hold above an animation                      | `core`          | 1.2 kB                          |
| `attach`, bindings, the waiting, events                              | `core`          | 0.9 kB                          |
| The presence trigger                                                 | `core`          | 0.5 kB                          |
| `defineTrigger` and the reserved names                               | `core`          | 0.2 kB                          |
| The scanner's new attributes                                         | `core`          | 0.6 kB                          |
| The bridge, the phase reader, `inserted.ts`                          | `core`          | 0.2 kB                          |
| **The new model in `core`**                                          |                 | **5.0 kB: `core` near 26.2 kB** |
| `hover`, `press`, `press()`, the state tween (candidate C if chosen) | `states` (new)  | 1.5 kB, ceiling 2.5 kB          |
| `scroll` with both implementations                                   | `drivers` (new) | 2.5 kB, ceiling 4 kB            |

- **The 25 kB ceiling is expected to be exceeded while the core carries both models, and this spec says so in
  advance** (review 12, I4). The sum above puts `core` near 26.2 kB. Sharing does not bring it back under 25: the code
  moved to `presence-state.ts` is already in today's 21.16 kB, so moving it saves nothing. None of the lines has a
  point of comparison yet: they are estimates, and the first measure replaces them.
- **So the `core` line of `.size-limit.json` is set to 27 kB from the end of step 3/8 to the end of step 5/8**, as the
  planned figure of the coexistence, not as a last resort. It is raised in the task that measures (§10, 11/12), with
  the measure in the step's report: no ceiling moves without one (the model, §3.9).
- **What a user sees**: the `/motion` home prints the measure as it is, "21.2 kB for the core" today [Doc: review 12].
  That figure rises to the measure of each step until the end of step 5/8, then falls with the removal. The
  "Loading and weight" page says why in one sentence: the core carries the old and the new writing until then.
- The per-axis split is out of this sum: it arrives at step 4/8 as a module loaded on first need, never in the core
  (§4.2). The state tween, candidate C included, is in the `states` entry (§3.4).
- The two new entries are added to `.size-limit.json`, to the `ignore` list of the `core` line, to `vite.config.mts`
  and to both export blocks of `package.json` (`./states`, `./drivers`). Their ceilings are set at the first green
  measure, rounded up to the next 0.1 kB plus 5 %, and never above the figure of the table without a line in the
  step's report.
- **A projection line, `core-new`**: `dist/index.js` imported as `{ attach, defineMotion, defineTrigger, getBinding }`.
  It weighs what the core will weigh without the old bindings, less the scanner. It only holds if the rule of §2 holds
  (no new module imports the old ones), which makes it a test of that rule too. Its ceiling is set from its first
  measure (plus 5 %); 12 kB is the figure above which step 4/8 must act (§6.3) [Hyp]. It is not printed by the docs.

### 6.3 Where the ceiling is judged, and what happens above 27 kB

- **The 25 kB ceiling is judged at the end of step 5/8**, after the single removal task. The `core` line goes back to
  25 kB in that task.
- At the end of steps 3/8 and 4/8, what is judged is `core` against 27 kB and `core-new` against its own ceiling. If
  `core-new` is above 12 kB at the end of step 3/8, step 4/8 starts by moving something out of the core before it adds
  to it: the model still has `change`, `inView`, the target options and `timingBy` to put there.
- **If the measure of step 3/8 is above 27 kB**, one lever, then a stop:
  - **The lever**: the scanner's reading of the new attributes becomes a module the scanner loads when its first scan
    meets one of them (it starts the load before it binds anything). An element inserted before it lands is attached
    without an entry. It is applied only then, because it weakens the first frame of the HTML writing.
  - **Still above 27 kB**: the task stops and the figures go back to the designer. 27 kB is not raised again by the
    planner or an implementer.

For the other entries the slice touches (`layout` for §3.9, `scope` for `inspect`, `presets` for two definitions,
`continuous` for the bridge calls): a ceiling moves only with the measure in the report, and by at most 0.5 kB. The
old `continuous` entry is not given the new scroll driver: it keeps its ceiling and disappears at the end of step 5/8.

---

## 7. Acceptance

The fixture of most browser tests: an `article` of 200 by 120 px with `lift` (`{ keyframes: { scale: 1.04 } }`) on
`hover` and `dip` (`{ scale: 0.96 }`) on `press`, attached once with `attach()` and once through `connectMotion()`.
Pointer and keyboard events are real ones (the browser provider's `userEvent`), not dispatched by hand. A value is
read with `getComputedStyle` at each animation frame. Browser files run one at a time, in the three engines.

**"No jump" is one helper, calibrated before any test uses it** (review 12, I6). The candidate criterion: between two
consecutive frames the value moves by no more than 1.5 times its largest move of the two frames before, or 0.004 of a
scale (1 px), whichever is larger. It is not trusted as written: a fast spring leaves rest and accelerates, and its
second frame may exceed that bound with no jump at all [Hyp].

- **The calibration**, a task of its own before the first browser test of the registry (§10, 4/12): the helper,
  `expectNoJump(samples)`, in one test utility with its constants, is run on **healthy** transitions: a hover from
  rest and a return to rest, with `spring.fast.spatial` and `spring.default.spatial`, at a scale of 1 and of 4, in the
  three engines, on plain WAAPI animations (no registry). It must report no jump on all of them, and must report one on
  a transition into which a jump of 0.02 of a scale (5 px) is injected by script.
- If the candidate fails either way, the helper becomes a comparison with a reference: the same transition played
  alone on a twin element started in the same task, the two read frame by frame, within 1 px or 0.004 of a scale (as
  case C1's reference run already does). The tests call the helper and do not know which of the two it is.
- The calibration's figures go in the step's report.

**"At about 40 %" never depends on real time.** A test that interrupts a transition part-way runs with the scale at 4
and triggers the interruption when the value read crosses the 40 % mark, or pauses the transition and sets its
`currentTime`, as the spike does.

### 7.1 Unit (node)

| #   | Subject                                       | Assertions                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| --- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| U1  | `readKeyframes`, `channelsOf`                 | One keyframe and a list; `x` and `y` are two channels, `scale` is `scaleX` and `scaleY`, `translate` written whole is `x` and `y`, `backgroundColor` is `background-color`, a custom property keeps its name; an empty list throws.                                                                                                                                                                                                                                                                                                          |
| U2  | `toWaapiKeyframes`, `readAxisBase`            | With a base of `0px 0px` and `1 1`: `{ y: 24 }` gives `translate: 0px 24px`; `{ x: '100%' }` gives `100% 0px`; `{ scaleX: 2 }` gives `scale: 2 1`; `rotate: 90` gives `90deg`. With a base of `-50% 12px`: `{ y: -2 }` gives `translate: -50% -2px` in every keyframe. The parse of a computed `none`, of one, two and three values, of a percentage. Only the channels asked for are written. A legacy numeric keyframe on a neutral base gives what `frameToKeyframe` gives for the same input, field by field (minus `draw` and `along`). |
| U3  | The timing plan                               | Event, state and exit defaults per property; `SPATIAL_PROPERTIES` decides; a `timing` applies to all; the scale multiplies the duration and the `delay`, at 0.5, 2 and 10; a negative scale is 0, a non-numeric one is 1.                                                                                                                                                                                                                                                                                                                    |
| U4  | The reduced form                              | The table of §3.8, for each trigger and each form, including `fade` under a state and under a driver, a motion with no opacity, and the old words `instant` and `static`.                                                                                                                                                                                                                                                                                                                                                                    |
| U5  | The order of claims                           | Pure functions: the top of a channel for every pair of levels; the same level; a covered claim; what the hand-back aims at (a covered state, a kept frame, something that runs, rest).                                                                                                                                                                                                                                                                                                                                                       |
| U6  | `defineMotion`                                | A spec without a verb is accepted and frozen; an invalid one throws in development; a spec with a verb is validated as today; each new reserved name throws; `press` still defines; an inline spec is not in the canonical cache.                                                                                                                                                                                                                                                                                                            |
| U7  | A spec that carries old options               | Under a new entry, `rise` gives no stagger and `parallax` no range; `motion()` given a spec without a verb throws with the message of §3.1.                                                                                                                                                                                                                                                                                                                                                                                                  |
| U8  | `defineTrigger`                               | Kebab-case; taken; each reserved word and prefix of the model's §3.2 and `axis-`; the registry is shared through `globalThis`.                                                                                                                                                                                                                                                                                                                                                                                                               |
| U9  | The HTML reading                              | The attribute table of §3.10 to an `Attached` object: booleans, an exit alone, a range pair, an unknown option of a built-in trigger reported; `data-motion-presence="present"` is the mark, not a trigger.                                                                                                                                                                                                                                                                                                                                  |
| U10 | The existing unit suites of `packages/motion` | Green, unmodified, until the task of §5.3.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |

### 7.2 Browser, in the three engines

| #                   | Case                                                                                                                                                                                                                                | Assertions                                                                                                                                                                                                                                                                                                                                                          |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Arbitration**     |                                                                                                                                                                                                                                     |                                                                                                                                                                                                                                                                                                                                                                     |
| A1                  | Hover, then press, then release, then leave                                                                                                                                                                                         | The scale settles at 1.04 and the inline `scale` is `1.04`; pointer down: it goes to 0.96 with no jump in the first frames; pointer up, still over: it returns to 1.04 with no jump; leave: it returns to rest, and at the end the inline `scale` is empty and `getAnimations()` is empty. With a class that sets `scale: 1.1` at rest, the last value read is 1.1. |
| A2                  | Press first, then hover (Space held on the focused card, then the pointer enters)                                                                                                                                                   | The scale stays at 0.96 for ten frames: the hover is covered and creates no animation (`getAnimations().length` does not change). Key up: it goes to 1.04 with no jump.                                                                                                                                                                                             |
| A3                  | Hover and press through `connectMotion()` and through React's `<Motion as={Card} hover press>`                                                                                                                                      | The same values as A1 at the four holds.                                                                                                                                                                                                                                                                                                                            |
| A4                  | Events                                                                                                                                                                                                                              | The list of (type, `detail.trigger`, `detail.phase`, `detail.outcome`) for A1 is exactly the expected one; a listener on the parent receives none; a transition that is replaced ends with `cancelled` before the next start.                                                                                                                                       |
| A5                  | A touch pointer                                                                                                                                                                                                                     | `hover` never becomes active; `press` does.                                                                                                                                                                                                                                                                                                                         |
| A6                  | Press by keyboard                                                                                                                                                                                                                   | Enter and Space start it; key up and blur end it; a repeated keydown does not restart it.                                                                                                                                                                                                                                                                           |
| A7                  | The axis a motion does not name (review 12, B1): an element centred with Tailwind's `left-1/2 -translate-x-1/2` and a hover on `{ y: -2 }`; the same with a rest of `scale: 1 0.5` and a hover on `{ scaleX: 1.1 }`                 | The horizontal position of the element (its bounding rect) is read at each frame of the hover, the hold and the return: it never moves by more than 0.5 px. `y` goes to -2 px and back. The inline value while held is `-50% -2px`. At the end nothing is inline and the centring is the stylesheet's.                                                              |
| A8                  | A hold against a CSS transition (review 12, B2): the fixture with Tailwind's `transition` utility on the card, A1's sequence                                                                                                        | At the hold, the scale never leaves 1.04 for twenty frames and no `CSSTransition` of `scale` is listed; the return ends at rest with no jump. The case S 10/10 of the spike, on the registry.                                                                                                                                                                       |
| **Interruption**    |                                                                                                                                                                                                                                     |                                                                                                                                                                                                                                                                                                                                                                     |
| I1                  | Hover left at about 40 % of its way                                                                                                                                                                                                 | No jump at the interruption; the scale returns to rest; nothing inline at the end.                                                                                                                                                                                                                                                                                  |
| I2                  | Press released at about 40 %, hover still active                                                                                                                                                                                    | No jump; ends at 1.04.                                                                                                                                                                                                                                                                                                                                              |
| I3                  | Ten hovers and leaves within 300 ms                                                                                                                                                                                                 | Ends at rest; one animation at most at any read; the events are balanced (as many ends as starts).                                                                                                                                                                                                                                                                  |
| I4                  | A higher state starts during a lower one's transition, and finishes first (review 12, I1): pointer down while the hover is at about 40 % of its way; the press reaches its hold while the hover's transition would still be running | From the pointer down, one registry animation at most on `scale` (the hover's is gone at the next read) and the hover's `motion-end` is `cancelled`. No jump. Once the press holds, the scale stays at 0.96 for twenty frames: nothing passes over the hold. Pointer up: it goes to 1.04 with no jump.                                                              |
| I5                  | An exit starts while a manual play runs on the same property                                                                                                                                                                        | The manual play ends `cancelled`; the exit's last keyframe is read for twenty frames after it ends.                                                                                                                                                                                                                                                                 |
| **Reduced motion**  |                                                                                                                                                                                                                                     |                                                                                                                                                                                                                                                                                                                                                                     |
| R1                  | Policy reduced, A1's sequence                                                                                                                                                                                                       | Each hold is read in the task of its event (no frame waited); `getAnimations()` is empty throughout; every event has `reduced: true` and both are received before the triggering handler returns.                                                                                                                                                                   |
| R2                  | Presence under the policy, `rise`                                                                                                                                                                                                   | On the entry only `opacity` changes over time, and `translate` is never other than rest; on the exit `translate` never changes; with `reduced: 'end'` nothing animates.                                                                                                                                                                                             |
| R3                  | Scroll under the policy                                                                                                                                                                                                             | No animation; rest. Turning the policy back starts it at the value of the current scroll position; turning it on again removes it.                                                                                                                                                                                                                                  |
| R4                  | `--udx-motion: none`, and a scale of 0                                                                                                                                                                                              | As R1 and R2 with `fade` read as `end`.                                                                                                                                                                                                                                                                                                                             |
| R5                  | The policy turns to reduced during an entry and during a hover transition                                                                                                                                                           | Both are at their end at the next read.                                                                                                                                                                                                                                                                                                                             |
| **The first frame** |                                                                                                                                                                                                                                     |                                                                                                                                                                                                                                                                                                                                                                     |
| F1                  | An `li data-motion-presence="rise"` appended to a scanned list                                                                                                                                                                      | After one microtask: opacity 0 and `translate` `0px 24px`. The first frame read in `requestAnimationFrame` has an opacity under 0.1. No frame ever reads opacity 1 before the entry has ended.                                                                                                                                                                      |
| F2                  | The same with a `delay` of 200 ms                                                                                                                                                                                                   | Every frame of the delay reads the first keyframe.                                                                                                                                                                                                                                                                                                                  |
| F3                  | React: an item rendered after the first commit                                                                                                                                                                                      | In a layout effect of its parent, the same reads as F1.                                                                                                                                                                                                                                                                                                             |
| F4                  | Content present when the scanner connects; a hydrated React tree                                                                                                                                                                    | No animation, nothing inline, phase `rest`.                                                                                                                                                                                                                                                                                                                         |
| F5                  | A name defined after the element is attached                                                                                                                                                                                        | No entry; a later `setPresent(false)` plays the exit.                                                                                                                                                                                                                                                                                                               |
| **Presence**        |                                                                                                                                                                                                                                     |                                                                                                                                                                                                                                                                                                                                                                     |
| P1                  | Enter releases                                                                                                                                                                                                                      | After the entry: no inline `opacity` nor `translate`, phase `rest`; an element with a class that sets `opacity: 0.6` reads 0.6: the stylesheet's rest is back.                                                                                                                                                                                                      |
| P2                  | `{ enter: 'rise', exit: 'fade' }`                                                                                                                                                                                                   | The exit changes `opacity` only; its last keyframe is still read after it has ended; once `hidden` has hidden the element, nothing inline is left.                                                                                                                                                                                                                  |
| P3                  | `presence: 'rise'`                                                                                                                                                                                                                  | The exit is the entry's keyframes reversed, on the effects spring.                                                                                                                                                                                                                                                                                                  |
| P4                  | `exit: 'none'`; `{ exit }` alone                                                                                                                                                                                                    | Leaves at once; no entry.                                                                                                                                                                                                                                                                                                                                           |
| P5                  | Focus                                                                                                                                                                                                                               | The three focus cases of `bind.browser.spec.ts` (focus moved to `restoreFocus` before `inert`; kept focusable without it, with the warning; `inert` once focus leaves), on the new presence.                                                                                                                                                                        |
| P6                  | Shown again during its exit                                                                                                                                                                                                         | Enters from the current values, no jump; `inert` released.                                                                                                                                                                                                                                                                                                          |
| P7                  | The mark                                                                                                                                                                                                                            | `data-motion-phase` is `enter`, `rest`, `exit` at the three moments; the author's `data-motion-presence="rise"` is never rewritten; a legacy presence writes both marks.                                                                                                                                                                                            |
| P8                  | A state during an exit                                                                                                                                                                                                              | A hover on a leaving element creates nothing.                                                                                                                                                                                                                                                                                                                       |
| **Scroll**          |                                                                                                                                                                                                                                     |                                                                                                                                                                                                                                                                                                                                                                     |
| S1                  | `parallax` over `cover`, forwards and backwards                                                                                                                                                                                     | `translate` follows the scroll position at five positions; with a scale of 0.5 the distances are the full ones.                                                                                                                                                                                                                                                     |
| S2                  | The JavaScript implementation (`ViewTimeline` and `ScrollTimeline` removed from the window before the module loads)                                                                                                                 | The same five positions, within 1 px, one frame after each scroll.                                                                                                                                                                                                                                                                                                  |
| S3                  | `container`; `track: 'container'` with its default, with `['0%', '50%']` and with `['scroll 10%', '400px']`; a view range pair; `axis: 'inline'`; from HTML, `data-motion-scroll-range="cover"` with `track="container"`            | Each read at the start, the middle and the end of its range, native and JavaScript within 1 px of each other. The HTML misuse plays over `scroll` and is reported once.                                                                                                                                                                                             |
| S4                  | Hand-back to a driver: a hover on `y` over a scroll motion on `y`; the pointer leaves while the page is scrolled by script                                                                                                          | While hovered, `y` is the hover's; after the leave, no jump beyond the scroll's own move; at the end the value is the driver's and the only animation is the driver's.                                                                                                                                                                                              |
| S5                  | The first frame of a scroll motion while its module loads                                                                                                                                                                           | The measure of §7.5, not a pass or fail.                                                                                                                                                                                                                                                                                                                            |
| **Channels**        |                                                                                                                                                                                                                                     |                                                                                                                                                                                                                                                                                                                                                                     |
| C1                  | Two claims on the two axes of one property, until step 4/8: during the entry of `rise` (`y`), a hover on `{ x: 8 }` starts                                                                                                          | The hover is covered: `y` and `opacity` stay within 1 px and 0.02 of a reference entry with no hover, frame by frame, and `x` does not move. When the entry has ended, `x` goes to 8 with no jump; on leave, back to rest; nothing inline at the end.                                                                                                               |
| C2                  | A hover on `scaleX` while a kept frame holds `scaleY` (a manual play of `{ scaleY: 0.5 }`)                                                                                                                                          | While hovered both are read: the kept axis is carried by the hover's keyframes (§3.1). After the leave `scaleY` is 0.5 and `scaleX` is 1.                                                                                                                                                                                                                           |
| C3                  | A kept frame                                                                                                                                                                                                                        | `play({ keyframes: { x: 100 } })` leaves `translate: 100px 0px` inline; a hover on `x` and its leave return to 100, not to rest; `detach()` removes it.                                                                                                                                                                                                             |
| C4                  | An entry that ends away from rest                                                                                                                                                                                                   | The channel jumps at the release, and development reports it once with the model's message.                                                                                                                                                                                                                                                                         |
| **Coexistence**     |                                                                                                                                                                                                                                     |                                                                                                                                                                                                                                                                                                                                                                     |
| X1                  | `data-motion="fade"` with `data-motion-hover="lift"`; React `name="fade" hover="lift"`                                                                                                                                              | Both play; the legacy binding is there (`getMotion`), the new one too (`getBinding`).                                                                                                                                                                                                                                                                               |
| X2                  | A legacy emphasis on `scale` (`press`, the preset) played while the new hover holds 1.04                                                                                                                                            | The emphasis is seen; at its end the scale is 1.04 at the next read, with no frame at 1.                                                                                                                                                                                                                                                                            |
| X3                  | A legacy entry (`slide`) with a new hover on `{ x: 8 }` that starts during it                                                                                                                                                       | The hover is covered until the entry ends (a legacy claim holds both axes), then goes to 8 with no jump.                                                                                                                                                                                                                                                            |
| X4                  | `data-motion="fade"` and `data-motion-presence="rise"` on one element                                                                                                                                                               | One entry, `rise`'s; one development report; the same in React with `name="fade" presence="rise"`.                                                                                                                                                                                                                                                                  |
| X5                  | The legacy end rule                                                                                                                                                                                                                 | A legacy entry that ends at `scale: 1.1` leaves it inline, and the registry lists it as a kept frame.                                                                                                                                                                                                                                                               |
| X6                  | Every existing browser spec of `packages/motion`, and the React, Angular and Svelte motion suites                                                                                                                                   | Green, unmodified, until the task of §5.3, which changes only the assertions it lists.                                                                                                                                                                                                                                                                              |
| **Layout**          |                                                                                                                                                                                                                                     |                                                                                                                                                                                                                                                                                                                                                                     |
| L1                  | A card with `reflow` (legacy) and a new hover on `{ y: -4 }`, hovered at rest; then a sibling is removed                                                                                                                            | The hover alone starts no flight (the layout handle stays null). The flight of the removal ends with `y` at -4, with no jump at its start or its end.                                                                                                                                                                                                               |
| L2                  | The pointer enters during the flight                                                                                                                                                                                                | No jump; at the end of the flight the card is in its new place with `y` at -4.                                                                                                                                                                                                                                                                                      |
| L3                  | The pointer leaves during the flight; the flight starts during the hover's transition                                                                                                                                               | No jump; the card ends in its place at rest; the events of the hover are complete.                                                                                                                                                                                                                                                                                  |
| L4                  | The same three with a press on `scale`                                                                                                                                                                                              | The same assertions on the scale.                                                                                                                                                                                                                                                                                                                                   |
| **Others**          |                                                                                                                                                                                                                                     |                                                                                                                                                                                                                                                                                                                                                                     |
| O1                  | `detach()` at each moment (during an entry, a hold, a return, a hold above a driver)                                                                                                                                                | Nothing inline, no animation, no mark, no listener (a later pointer event changes nothing).                                                                                                                                                                                                                                                                         |
| O2                  | `inspect()` and `revert()`                                                                                                                                                                                                          | `inspect` lists the triggers of an attached element and its claims per channel with their level and which is the top; `revert` detaches.                                                                                                                                                                                                                            |
| O3                  | A defined trigger of each contract                                                                                                                                                                                                  | A state defined on a `data-active` attribute, an event on a custom DOM event, a driver on a range input: each plays through `attach({ triggers })` and through `data-motion-<name>`.                                                                                                                                                                                |
| O4                  | A scale of 4                                                                                                                                                                                                                        | An entry lasts four times its duration at 1, within a frame.                                                                                                                                                                                                                                                                                                        |
| O5                  | Svelte server content (a page whose server HTML is parsed, then hydrated)                                                                                                                                                           | The server-rendered element with the legacy attachment has no animation and is marked present; an element an `{#if}` shows after hydration plays its entry; the same component mounted on the client (no server HTML) plays its entry; `settled: false` on the server element replays it.                                                                           |
| O6                  | `update` (review 12, I2)                                                                                                                                                                                                            | `update({ hover })` on an attachment that had `presence` and `hover` removes the presence (no exit plays, the mark and `inert` are removed) and leaves the hover's hold untouched: no animation is created. `update` with an equal inline spec creates nothing. `update` without `present` keeps the presence it had.                                               |
| O7                  | Two attachments on one element                                                                                                                                                                                                      | The scanner attaches `data-motion-presence="rise"`; then `attach(el, { hover: 'lift' })`: both triggers work, and `detach()` of the second leaves the presence. A second `attach(el, { presence: 'fade' })` attaches nothing, with one development report; the first presence still plays its exit.                                                                 |
| O8                  | Function and element options in React (review 12, I3): `<Motion presence="rise" restoreFocus={() => opener.current}>` re-rendered ten times during its entry, and a `scroll` with `container` from a ref                            | The entry is one animation from its start to its end: its `currentTime` only grows, one `motion-start` and one `motion-end`. The exit moves focus to what the latest function returns. The scroll animation is the same object after the re-renders.                                                                                                                |
| O9                  | A module that fails to load, and an attribute that is removed                                                                                                                                                                       | With the `states` import made to reject: the element stays at rest, nothing is written, development reports it once, and a later `attach` tries again. Removing `data-motion-hover` from a hovered element hands the scale back to rest with its return, and removing the last attribute detaches.                                                                  |

### 7.3 Types

In the form the package already uses (`@ts-expect-error` lines in a spec file checked by `tsc`, as
`manifest-types.spec.ts` [Doc]).

| #   | Compiles                                                                                                                                                                                                                                                                   | Does not compile                                                                                                                                                                                                                                                                               |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T1  | `defineMotion('lift', { keyframes: { scale: 1.04 } })`; a keyframe with `x: '100%'`, `backgroundColor`, `'--x'`; a spec with a verb, as today                                                                                                                              | A spec without `keyframes`; a verbless spec with `stagger`; `reduced: 'instant'` on a verbless spec                                                                                                                                                                                            |
| T2  | `attach(el, { presence: 'rise' })`; `{ presence: { enter: 'rise', exit: 'none' } }`; `{ hover: { keyframes: { y: -2 } } }`; `{ press: { motion: 'dip' } }`; `{ scroll: { motion: 'parallax', range: ['entry 0%', 'cover 50%'] } }`; `{ triggers: { 'my-state': 'lift' } }` | An unknown key (`hoverr`); `{ presence: { exit: 5 } }`; `{ scroll: { motion: 'parallax', range: 'cross' } }`; `{ scroll: { motion: 'parallax', track: 'container', range: 'cover' } }`; `{ scroll: { motion: 'parallax', range: 'scroll' } }`; `{ hover: { hold: false } }` (not in the slice) |
| T3  | `defineTrigger('my-state', { contract: 'state', watch })` returns the literal type; the three contracts each accept their `watch`                                                                                                                                          | A `contract` outside the three; a state whose `watch` takes a progress                                                                                                                                                                                                                         |
| T4  | `<Motion hover="dip" />`; `<Motion as={Button} press="dip" label="Save" />` keeps `Button`'s props; `<Motion as="a" href="/" hover="lift" />`; `<Motion name="reflow" hover="lift" />`; `onMotionEnd={(event) => event.detail.outcome}`                                    | `<Motion hover={5} />`; `<Motion as="a" hrf="/" />`; `event.detail.outcome` read in `onMotionStart`                                                                                                                                                                                            |
| T5  | `useMotion({ presence: 'rise', present })` returns `ref`, `mounted`, `play`, `binding`; `useMotion('fade', { present })` as today                                                                                                                                          | `useMotion({ presence: 'rise' }, { present })`                                                                                                                                                                                                                                                 |
| T6  | The native attributes of each Udixio component through `as` still pass with the new props present (one case per component, the model's §5.2)                                                                                                                               |                                                                                                                                                                                                                                                                                                |

### 7.4 Weight

- `pnpm --filter @udixio/motion size` (or the project's target) is green with the ceilings of §6; `size-report.json` is
  regenerated and its test passes.
- The step's report gives, for each entry, the figure before and after, and `core-new`.

### 7.5 The measures, reported and not judged

Written in `docs/superpowers/reports/2026-11-28-motion-step3-slice.md`, from a script in `packages/motion/bench`
(beside `run.mjs`), in the three engines:

- **The interrupted hover.** A hover on `{ scale: 1.12 }` with `spring.default.spatial` and with `spring.fast.spatial`,
  left at 40 % of its duration. For each of the three candidates of §9.2: the scale at each frame from 100 ms before to
  400 ms after; the velocity (per second) in the last frame before and the first after the interruption; the largest
  change of velocity between two frames. Candidate A is expected to read a velocity near 0 just after [Hyp: review 9,
  B3]; the figures are what the maintainer's choice is checked against.
- **The weight** of §7.4, and what each candidate B and C would add.
- **The first frame of a scroll motion**: with the `drivers` module not yet loaded, `parallax` on an element in view:
  how many frames are painted at rest before the first driven frame, and the size of the jump, on a cold and on a warm
  load.
- **Svelte server content**: the entry replayed on hydration before the change, and its absence after (O5).
- **The scale in a cascade and a sequence** (the model's §7.8, "to check in the code at step 3/8"): whether
  `stagger.ts` and `sequence.ts` multiply their delays and offsets by the scale today. A reading of the code and one
  browser read each; the answer goes in the report for step 4/8, and nothing is changed here.

---

## 8. Doc impact

The rule of `CLAUDE.md` (a change that adds something a user uses updates `apps/doc` in the same change) and the
model's §7.7 ("the docs of the slice say React and HTML for now") against review 11 (the maintainer sees the HTML
writing before it spreads). Resolved by two moments [Design]:

**With the code, before gate 2/3: what is fact, and nothing that teaches the writing.**

| Where                                                             | What                                                                                                                                                                                                                                     |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/doc/src/pages/motion/fixtures/step3-slice.astro`            | The demo page of §9: out of the navigation, the search index and the sitemap, as `fixtures/components.astro` is [Doc].                                                                                                                   |
| The API page (`scripts/motion-api.groups.mjs`, `motion-api.json`) | One new group, "Triggers and attach (new model: HTML and React)", with the exports of §3; regenerated.                                                                                                                                   |
| The Glossary (`motion-glossary.ts`)                               | The words that are now true in code: attach, binding, trigger, the event, state and driver contracts, channel, frame, rest, kept frame, phase. Each says "HTML and React for now" where it names a writing. No word of today is removed. |
| Loading and weight                                                | The two new chunks and their figures (the page reads `size-report.json`; `core-new` is filtered out of it). One sentence says why the core figure, here and on the home, is above its 25 kB until the end of step 5/8 (§6.2).            |
| `packages/motion/README.md`                                       | A section "The new model (preview: HTML and React)": `attach`, the four triggers, the registry's order, in one screen, with a link to the model spec.                                                                                    |
| `docs/motion/reduced-render.md`                                   | The four forms and the defaults of the four triggers, beside the old table.                                                                                                                                                              |
| The manifest and the MCP's bundled copy                           | Fields added only: `triggers` (name, contract, level, options, default reduced form), `claimLevels`, `spatialProperties`, the new reserved names. Version 1 stays. Both regenerated.                                                     |
| Roadmap page                                                      | Step 3/8 done, and what it covers.                                                                                                                                                                                                       |

**After gate 2/3, once the maintainer has answered questions 1 and 2, still inside step 3/8:**

| Page                                                                                                                                                                                                                      | What                                                                                                                                                                                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A new page, "Hover and press" (slug `hover-press`), **in the Motions section, after Emphasis** (decided by the control session, 2026-11-28), until the regrouping of the menu has its own task; it then moves to Triggers | What a state is, the two triggers, the order hover then press, when CSS is enough (the model, §7.1), reduced motion. Examples in `src/examples/html` and `src/examples/react`; the Angular and Svelte readings of the page show one sentence, "Arrives with step 5/8", in place of the example. |
| Presence                                                                                                                                                                                                                  | One section, "An exit written apart (HTML and React for now)", and the new mark `data-motion-phase` beside the old one.                                                                                                                                                                         |
| Scroll (`_scrub.astro`)                                                                                                                                                                                                   | One section, "The scroll trigger (HTML and React for now)": the container, the range names, older browsers.                                                                                                                                                                                     |
| Accessibility                                                                                                                                                                                                             | The reduced form of the four triggers.                                                                                                                                                                                                                                                          |
| Troubleshooting                                                                                                                                                                                                           | "My entry jumps back when it ends": the new `release` against the old rule, and which writing has which.                                                                                                                                                                                        |
| `motion-nav.ts`                                                                                                                                                                                                           | The new page in Motions, after Emphasis.                                                                                                                                                                                                                                                        |

- **Not shown before step 5/8**: a card on the `/motion` home (its promise is four frameworks); the "Coming from
  Motion" table; anything on app states, `change`, `inView`, `focus`.
- **No page loses a writing**: every page of today keeps its four examples, on the old writing.
- The docs rules apply to every page and to the fixture: Udixio components for every control (`Button`, `Switch`,
  `Slider`, `Tabs`, `Card`), Tailwind classes and theme tokens, no CSS file, looked at in a browser in light and
  dark and under reduced motion. Nothing type-checks `apps/doc`: no public name is renamed by this step, so the grep of
  the model's §7.3 has nothing to find; it is run all the same after the task of §5.3 for `amplitudeOf` and
  `distanceScaleOf`.

---

## 9. The demo for the maintainer (gate 2/3)

One page, `/motion/fixtures/step3-slice`, built from `src/examples/html/motion-fixture-step3.html` and
`src/examples/react/motion-fixture-step3.tsx`. Four sections, each answering one thing. Every control is a Udixio
component. A bar at the top, sticky, holds what applies to the whole page: a `Switch` "Reduced motion" (it sets
`data-motion-policy` on the document), and a `Slider` "Speed" with the stops 0, 0.25, 0.5, 1, 2, 4 (it sets
`--udx-motion-scale` on the page's main element; 4 is the slow motion the new rule allows).

Two things the page says in words, so that they are not taken for defects:

- **"Speed" above 1 slows the new writing only.** The old path is bounded to 1 until the tasks after gate 2/3 (§5.3),
  so the legacy lists of 9.1 and 9.3 and the right-hand card of 9.4 do not slow down. A caption under the slider says
  it, and each legacy block carries the label "old writing: not slowed above 1".
- **The cards that carry `hover` and `press` are plain `article` elements styled with theme tokens, not Udixio `Card`s.**
  Until `reserveMotion` works by channel (step 5/8), a state on a component that animates the same property itself is
  only reported by `checkSources` (§3.3); whether `Card` animates its own `scale` was not checked. The controls of the
  page (`Button`, `Switch`, `Slider`, `Tabs`) are Udixio components, and none of them carries a state of the demo. One
  React example of 9.1 shows `<Motion as={Card}>` only if the implementer has read `Card`'s style and controller and
  found no `scale` or `translate` of its own.

### 9.1 The slice, in HTML and in React

Two columns, "HTML" and "React", the same content, each with its source under it (the real example file, as the docs
show sources).

- A list of cards with two `Button`s, "Add" and "Remove": a card enters with `rise` and leaves with `fade`, written
  apart.
- Each card lifts on hover (`lift`, `scale: 1.04`) and dips on press (`dip`, `scale: 0.96`): the two states on one
  property.
- Each card holds an image that drifts with the scroll of a scrolling panel (`parallax`, `container` set).
- Under the hovered or focused card, a live line reads the registry: `scale: press (7) over hover (5)`, from
  `claims()`. It is what makes the arbitration visible, not only felt.
- What he should try, written on the page in one line: hover, hold the press, release while still over, leave; then the
  same with the keyboard; then with "Reduced motion" on.

### 9.2 The spring of a held state (question 3)

Three cards side by side, the same hover (`scale: 1.12`, large on purpose), one candidate each:

|     | Candidate             | What it is                                                                                                                                                                                                                                                                                                                          | Cost                                                                       |
| --- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| A   | The `linear()` easing | What the slice ships: a WAAPI animation whose easing is the spring's curve. An interrupted hover starts again at zero velocity.                                                                                                                                                                                                     | None: it is there. On the compositor.                                      |
| B   | The JavaScript spring | The spring of the gestures and the values (`stepSpring`, one write per frame): it keeps its velocity when its target changes [Doc: `spring-step.ts`, `spring-number.ts`].                                                                                                                                                           | A frame loop per moving state; on the main thread; bytes measured in §7.5. |
| C   | The sampled spring    | A WAAPI animation whose keyframes are the spring sampled from the current value **with the current velocity**, as the layout engine samples a flight that is interrupted (`springOffset` takes a velocity; `sampleFlight`, `velocityOf` [Doc: `spring.ts`, `layout/flight.ts`]). It keeps the velocity and stays a WAAPI animation. | The sampler in the core; bytes measured in §7.5.                           |

- A `Button` "Interrupt at 40 %" runs, on the three cards at once, a hover and a leave at 40 % of the way, and a
  `Switch` "Repeat" loops it. With "Speed" at 4 the difference is seen without effort.
- Under each card, the trace of its scale over the last second (one line per candidate, drawn in an inline SVG with
  theme tokens) and two figures: the velocity just before and just after the interruption. The kink of A is a corner in
  the trace.
- A `Tabs` picks the spring: `spring.fast.spatial` (the default of a state) or `spring.default.spatial`.
- B and C are fixture code, in the examples folder, each written as a `StateTween` and installed with
  `setStateTween` for its card: the demo proves at the same time that the tween is replaceable. They are not exported
  by the package.
- **Recommended: C** [Design]: it answers the reproach (the velocity is kept, as Motion keeps it) without giving up
  WAAPI, and the code it needs already exists in the layout chunk. If he picks it, it ships in the `states` entry
  (§3.4), not in the core. To be confirmed by the figures of §7.5 and by his eye.
- The same answer settles the engine sentence of `CLAUDE.md` and the fate of the `css` and `animejs` providers (the
  model, §8, question 3): the page restates the recommendation in two lines, with no demo of its own.

### 9.3 The HTML writing (question 1)

Two live lists, the same result on screen, each with its markup above it:

- "Today": `<li data-motion="slide reflow">`.
- "New": `<li data-motion-presence="rise" data-motion="reflow">` in the slice, and under it, greyed and labelled "at step
  5/8", the complete line `<li data-motion-presence="rise" data-motion-layout>`.
- A third block, "What the old writing cannot say": `data-motion-hover="lift" data-motion-press="dip"`, live, with the
  exit written apart (`data-motion-presence-exit="fade"`).
- One sentence: a name no longer says when it plays, so the attribute says it.

### 9.4 The scale at 0.5 (question 2)

Two cards that enter side by side with the same motion, a rise of 120 px (large on purpose), and a `Button` "Replay":

- Left, "Durations (the new rule)": the new path. At 0.5 it travels its 120 px in half the time.
- Right, "Amplitude (today)": the legacy path, untouched until gate 3/3. At 0.5 it travels 60 px in half the time
  [Doc: README, "Document motion scale"].
- Its own `Tabs` sets the scale of this section: 1, 0.5, 0.25.
- Under each, the two figures read from the run: distance travelled and time taken.
- One sentence under both: which one a setting between 0 and 1 should mean, a faster motion or a smaller one.

### 9.5 Before it is shown

The implementer criticises the page before the hand-off (`CLAUDE.md`): light and dark; "Reduced motion" on (every
section still makes sense: 9.2 says that nothing springs under reduced motion); a narrow viewport; the keyboard path of
9.1; no layout shift when a trace updates. The control session then walks the maintainer through 9.3, 9.4, 9.2 in that
order: the two writings he has not seen first, the engine last.

---

## 10. Order and gates

The planner sizes the tasks; this is the order the decisions impose.

| Order | What                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Depends on                            |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| 1/12  | **Before any code**: the maintainer has **seen** §9.3 and §9.4 as text (two code blocks and one sentence each). Review 12 reports that this is done: the reviewer's session showed him both; he has not answered yet. The work waits for him to have seen them, **not for his answer**: both writings are cheap to reverse (the attributes are read in one module; the scale is one function). If he answers questions 1 and 2 before the demo, only the spring is left for gate 2/3, and the tasks of 12/12 that depend on those two answers may run as soon as their code exists. |                                       |
| 2/12  | The C1 spike (§4.3), its ten cases and its report. **Gate 1/3**: the verdict of §4.3. S 10/10 decides what a hold is; a fallback 2, or a failed S 1/10, goes back to the designer.                                                                                                                                                                                                                                                                                                                                                                                                  |                                       |
| 3/12  | `keyframes.ts`, `axis-base.ts`, `timing-plan.ts`, `reduced-form.ts`; `defineMotion` without a verb; the reserved names; `grow` and `dip`.                                                                                                                                                                                                                                                                                                                                                                                                                                           |                                       |
| 4/12  | The calibration of "no jump" (§7), then `claims.ts`, `player.ts`, `events.ts`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | 2, 3                                  |
| 5/12  | `trigger.ts`, `attach.ts`, `presence-state.ts` (moved out of `bind.ts`), the presence trigger.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | 4                                     |
| 6/12  | The `states` entry (hover, press, the state tween) and the `drivers` entry (scroll, `scroll-progress.ts`). The two are independent of each other.                                                                                                                                                                                                                                                                                                                                                                                                                                   | 5                                     |
| 7/12  | The bridge and the legacy claims in `bind.ts` and `continuous.ts`; the trigger given both ways; the phase reader in the five files of §3.6. **And the three failing tests of §3.9 (L1 to L3), written now and left failing**: they tell early whether the three supposed defects are real. If one passes as it is, its part of §3.9 is dropped and the designer is told.                                                                                                                                                                                                            | 5, 6                                  |
| 8/12  | The scanner's attributes; `inspect` and `revert`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | 6, 7                                  |
| 9/12  | React: the props and the hook. The Svelte hydration default (independent).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | 6, 7                                  |
| 10/12 | Layout with a held state (§3.9): the engine's change that turns L1 to L4 green.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | 7                                     |
| 11/12 | The weight (the `core` line set to 27 kB with its measure, §6.2) and the measures (§7.4, §7.5); the docs of §8's first table; the demo page. **Gate 2/3**: the maintainer's answers that are still missing.                                                                                                                                                                                                                                                                                                                                                                         | 8, 9, 10                              |
| 12/12 | **The tasks that follow his answers** (called gate 3/3 elsewhere in this spec: it is a batch of tasks, each waiting for one answer). Question 2: the amplitude leaves the old path, or the inverse task (§5.3). Question 3: the state tween he chose becomes the shipped one, in `state-tween.ts` of the `states` entry, with its bytes against that entry's ceiling. Question 1: the docs of §8's second table. Then the step's report.                                                                                                                                            | 11, or the answer if it comes earlier |

- 3/12 can start while the spike runs: the reader does not depend on the mechanism, and the rule for the axis a motion
  does not name is decided (§3.1), not left to the spike.
- Tests are written with each task and run when a batch is finished, one browser file at a time (`CLAUDE.md`).
- Task reviews go to the tasks that carry logic or an interface (4, 5, 6, 7, 10); the others are covered by the final
  review.

---

## 11. Questions only the maintainer can settle

All three come from the model's §8; this step gives him something to look at for each. Nothing else is left open: the
rest is decided in §12.

1. **The HTML writing** (§9.3). One attribute per trigger in place of the list `data-motion="a b"`. It reverses "HTML
   `data-motion` unchanged". Recommended: yes. If no: the scanner's new reading is one module to rewrite, and the model's
   §5.5 goes back to the designer.
2. **What a scale between 0 and 1 is for** (§9.4). A faster motion (decided by delegation, recommended) or a smaller
   one. His answer chooses which of the two tasks of §5.3 runs.
3. **The spring of held states, and the engine** (§9.2). A, B or C; recommended: C. With it: `CLAUDE.md`'s sentence on
   anime.js (recommended: WAAPI plays motions, anime.js serves the SVG morph and the easings) and the removal of the
   experimental `css` provider.

---

## 12. Decisions of this spec, in one list

- **Scope**: presence, hover, press, scroll, `defineTrigger` and a manual play; HTML and React; beside the old model.
  `trace` and `spin` wait for the steps that can play them; `Attachment` gains `setPresent`.
- **The motion**: a spec without a verb, with `keyframes`, `timing`, `delay`, `reduced`; one reader that knows
  channels; the old reader untouched.
- **The registry**: nine levels; a transition is a WAAPI animation, a hold is an inline value (a filling animation
  above a driver or a legacy animation; everywhere if the spike's tenth case fails); a claim under a higher one is
  covered and creates nothing; a claim that starts above a state in transition stops that transition; a hand-back to
  something that runs, or to rest, leaves its end keyframe out; the state tween is one replaceable function, shipped in
  the `states` entry.
- **The axis a motion does not name** keeps its computed value, read when the claim starts; it is never set to 0.
- **C1**: a property is animated whole while one claim holds it, and split per axis, through four registered custom
  properties, when two claims need its two axes. A spike of ten cases in three engines comes first; two fallbacks are
  written (`composite: 'add'`, then no split, which reopens the model). **The split itself is built at step 4/8**, with
  `timingBy`; until then a second claim on the other axis is covered at the level of the property.
- **Attachments**: several per element, one per caller, a trigger name held once per element; `update` takes the whole
  description and a missing key detaches; data options are compared by content, elements by identity, and a function
  option is read when it is used and never causes a re-attach.
- **C3**: a legacy binding holds an external claim on whole properties, at the level of its new equivalent, through a
  bridge that costs the old chunks nothing; it keeps `restingFields` until the end of step 5/8, and what it leaves
  inline is a kept frame; a new entry reads only `keyframes`, `timing` and `reduced` from a spec with a verb; the
  amplitude leaves the old path in the last task of step 3/8, after the maintainer's answer.
- **C4**: the core is expected near 26.2 kB while it carries both models; its ceiling is 27 kB from the end of step 3/8
  to the end of step 5/8, where the 25 kB are judged; the docs' core figure rises until then. Two new lazy entries,
  `states` and `drivers`; a projection line, `core-new`; above 27 kB, one lever, then back to the designer.
- **The mark**: `data-motion-phase` is written by both models from now on; the old values of `data-motion-presence`
  become reserved motion names, since the attribute is now the author's.
- **Layout**: the engine compares layout boxes when a visual box differs, settles the registry's transitions before it
  plans a flight, and is asked to retarget when a state changes during one.
- **Reduced motion**: `fade` for presence, `end` for hover and press, `none` for scroll; events in the same task.
- **The first frame**: an entry's animation is created in the task that attaches; content painted before it was
  attached has no entry; Svelte gets that default now, from a signal of the document (`insertedByScript`), since Svelte has no public one.
- **Docs**: facts with the code (API, glossary, weight, README, manifest); the pages that teach the writing after the
  maintainer has seen it; nothing on the home before step 5/8.
- **The demo**: one fixture page, four sections: the slice, the spring (three candidates, C recommended), the HTML
  writing, the scale at 0.5 under each rule.
- **Tests**: "no jump" is one helper, calibrated on healthy transitions before any test uses it; no test depends on
  real time to interrupt a transition.

---

## 13. What revision 2 changed (review 12)

| Point  | Change                                                                                                                                                                                                                     |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B1     | The axis a motion does not name keeps its computed value (§3.1, `readAxisBase`); cases U2 and A7; §4.2's accepted cost rewritten.                                                                                          |
| B2     | A hold as an inline value is conditional on a tenth spike case, S 10/10, with its two fallbacks (§3.4, §4.3); case A8.                                                                                                     |
| I1     | A claim that starts above a state in transition stops it; an exit cancels a manual play under it; the filling hold covers a legacy animation as well as a driver (§3.4); cases I4 and I5.                                  |
| I2     | `update` takes the whole description and a missing key detaches; several attachments per element, a trigger name held once (§3.3); cases O6 and O7.                                                                        |
| I3     | Options compared by content, elements by identity, functions never (a latest slot) (§3.3); case O8.                                                                                                                        |
| I4     | The budget says what its estimate says: near 26.2 kB, a planned ceiling of 27 kB until the end of step 5/8, the home's figure rising until then; one lever above it, then the designer (§6.2, §6.3, §8).                   |
| I5     | The spike stays; `channel-split.ts` moves to step 4/8 with `timingBy`, as a lazy module; covering is per property until then; candidate C ships in the `states` entry (§1.2, §2, §3.4, §4.2, §6, §7 cases C1 and C2, §10). |
| I6     | "No jump" is a helper calibrated on healthy transitions, with a reference comparison as its other form; "about 40 %" never depends on real time (§7).                                                                      |
| I7     | Six deviations from the model listed in §1.2.                                                                                                                                                                              |
| M1     | 1/12 waits for the maintainer to have seen the two writings, not for his answer; an early answer frees the tasks of 12/12 (§10).                                                                                           |
| M2, M5 | The demo says that "Speed" above 1 slows the new writing only, and uses plain elements for the cards that carry a state (§9).                                                                                              |
| M3     | Not changed: the order of the two reactions at a legacy end is checked by X2 in the three engines.                                                                                                                         |
| M4     | Case O9: a module that fails to load, an attribute that is removed.                                                                                                                                                        |
| Order  | The three failing layout tests are written at 7/12; "gate 3/3" is said to be a batch of tasks (§10).                                                                                                                       |

After the plan's design questions (2026-11-28): the ranges by track, `'scroll'` and bare offsets only under
`track: 'container'` (§3.2, §3.3, §3.10, cases S3 and T2); the Svelte hydration default from `insertedByScript`, a
signal of the document, with O5 as a browser test (§3.7); the layout engine reaches the registry through
`claim-bridge.ts` (§3.9); "Hover and press" goes in Motions after Emphasis until the menu is regrouped (§8).

After the review of task 4/35: a state that stops under `fade` is the registry's hand-back with the plan's partition
(no new field in `ReducedPlan`; `hold` and `release` take the channels to change at once); the driver group's timing
is a seek length at this step, and `loop`'s own timing comes with `loop` at step 5/8 (§3.8).
