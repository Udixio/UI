# @udixio/motion

The animation runtime of the Udixio UI components. It is framework-agnostic: it
has no React or other UI framework dependency or peer dependency. It defines
motions (named keyframes with a timing and a verb), binds them to elements with
`data-motion`, `motion()` or a component's `motion` prop, and plays them through
the Web Animations API, CSS or [animejs](https://animejs.com) (`^4.5.0`), which
consumers install alongside it.

The package is under construction: [Current limits](#current-limits) lists what
is not done yet. The root entry exports the runtime API. Each feature a page may
not use (layout, values, sequences, gestures, text, SVG, scroll, page transitions,
scopes, continuous motions) has a subpath entry that the root entry does not
bundle. Every entry, with its public exports, the presets, the verbs and the
tokens is listed in the manifest: `motionManifest` from `@udixio/motion/manifest`,
also published as `@udixio/motion/motion-manifest.json`.
The manifest and its validator are experimental. `RUNTIME_KEY`
(`Symbol.for('udixio.motion@1')`) is reserved for a future shared runtime; this
release does not register one.

## Writing a motion

A motion is a named, validated description of how an element enters, leaves or
emphasizes. Define it once, then attach it with `data-motion` in HTML or `motion()` in JavaScript.

### Define

```ts
import { defineMotion } from '@udixio/motion';

defineMotion('card-enter', {
  verb: 'appear',
  keyframes: [
    { opacity: 0, y: 24 },
    { opacity: 1, y: 0 },
  ],
  timing: 'spring.default.spatial',
});
```

- The name is kebab-case; reserved names are rejected.
- Verbs: `appear` (enters through the keyframes, leaves backward), `disappear` (the
  reverse), `emphasize` (plays the keyframes forward on each replay), `layout`
  (moves with the layout, see [Layout](#layout)), `reveal` (plays when the element
  scrolls into view, see [Reveal](#reveal)), `scrub` (follows the scroll position, see
  [Scrub](#scrub)) and `loop` (plays forever, see [Loop](#loop)).
- Keyframe fields: `opacity`, `x`, `y`, `scale`, `scaleX`, `scaleY`, `rotate`. `scale`
  scales both axes; `scaleX` and `scaleY` scale one axis each (1 by default), and a
  `scale` in the same frame wins over them. `draw` and `along` are for shapes and
  paths, see [SVG](#svg).
- `timing` is optional: a spring token such as `spring.fast.spatial`, or
  `{ duration: 'duration.medium2', easing: 'easing.standard' }`. It applies to every field.
- Definitions are shared page-wide. An identical redefinition returns the existing
  definition; a different spec throws.

### Presets

```ts
import { fade, slide, scale, draw, cascade, press, shake, reflow, rise, parallax, rotate, breathe, blink } from '@udixio/motion/presets';
```

Importing the entry defines `fade`, `slide`, `scale`, `draw` and `cascade` (appear), `press` and
`shake` (emphasize), `reflow` (layout), `rise` (reveal), `parallax` (scrub), and `rotate`,
`breathe` and `blink` (loop), usable directly in `data-motion`. `draw` draws a path or a
basic shape from nothing to its whole stroke, see [SVG](#svg). `cascade` and `rise` stagger
the elements that enter together, see [Lists](#lists) and [Reveal](#reveal). Their values are provisional.

### Names

The names of the presets autocomplete, and so do the names you define. `MotionRegistry` lists them, and `MotionName`
is a registered name or any string, so a name that is not registered still works. Add your own names with declaration
merging, in a `.d.ts` file of your project:

```ts
declare module '@udixio/motion' {
  interface MotionRegistry {
    'card-enter': true;
  }
}
```

### Layout

A layout motion has no keyframes. Its element moves from where it was to its new
place and size when the layout around it changes, and nothing is left inline at the end:

```ts
defineMotion('card-move', { verb: 'layout' }); // timing is optional
```

The layout engine is loaded the first time a layout motion is bound: it is not in the main entry. A change made before it is loaded is not animated. `await loadLayoutEngine()` (from `@udixio/motion`) preloads it, and `@udixio/motion/layout` exports the engine's functions for advanced use.

The preset `reflow` is a layout motion:

```html
<ul>
  <li data-motion="reflow"><span>One</span></li>
  <li data-motion="reflow"><span>Two</span></li>
</ul>
```

A change inside the scope triggers the move: a class or `data-*` attribute changes on
an element of the scope, a child is added, removed or reordered, or `hidden` changes.
An element that appears or disappears does not animate itself: it has no earlier box to
move from or to.

An interrupted move restarts with the velocity it had.

The scope is the closest ancestor with `data-motion-scope`, or else the element's parent.
Only changes inside the scope are seen. An inline `style` change is not observed: after
one, call `play()` on the binding to compare the layout and move now:

```ts
import { getMotion } from '@udixio/motion';

item.style.width = '50%'; // an inline style is not observed
getMotion(item)?.play(); // compares the layout now and plays the move
```

In the frameworks, use the same name: `useMotion('reflow')` (attach its `ref`),
`udxMotion="reflow"` in Angular, or `{@attach motion('reflow')}` in Svelte. The adapters
need nothing else.

Limits:

- Elements inside a resizing element keep their natural size during the move, up to three levels deep and 24 elements. An element that contains text directly keeps its final size, and its start edge is interpolated.
- Text placed directly in the followed element, with no element around it, is stretched during the move: wrap it in an element, as in `<li data-motion="reflow"><span>One</span></li>`.
- `transform-origin` must stay at the centre, where the move scales the element.
- A move caused by something outside the scope is not animated.
- Under reduced motion, or with `--udx-motion: none`, the new layout applies at once.

### Lists

A list item names two motions in `data-motion`: a presence motion, which makes it enter
and leave, and `reflow`, which makes it follow its neighbours. The preset `cascade` is a
presence motion with `stagger: 'normal'`:

```html
<ul>
  <li data-motion="cascade reflow"><span>One</span></li>
  <li data-motion="cascade reflow"><span>Two</span></li>
</ul>
```

- `stagger` makes the elements that enter in the same task (several items added at once)
  start one step after the previous one, in visual order. The steps are `tight` (20 ms),
  `normal` (50 ms) and `loose` (100 ms), and the delay is capped at 400 ms. These are the `--udx-motion-stagger-*` tokens
  of `motion.css`. Entries and exits cascade separately, and reduced motion drops the delays.
- `origin` chooses where the cascade starts: `first` (the default), `last`, or `center`,
  which starts in the middle and spreads both ways.
- `exit` chooses how a leaving element moves its neighbours. The default, `in-place`, keeps
  the element where it is until its exit ends, and the neighbours move once it is gone.
  `out-of-flow` takes the element out of the flow when its exit starts, so the neighbours
  close the gap while it fades. The parent must be positioned (`position: relative`) for
  `out-of-flow`. Under reduced motion the exit is `in-place`.

`stagger`, `origin` and `exit` belong to the `appear` and `disappear` verbs:

```ts
import { defineMotion } from '@udixio/motion';

defineMotion('list-item', {
  verb: 'appear',
  keyframes: [
    { opacity: 0, y: 16 },
    { opacity: 1, y: 0 },
  ],
  stagger: 'normal',
  exit: 'out-of-flow',
});
```

In the frameworks, each adapter takes several motions for one element, as a list or as
names separated by spaces. A list item that enters, leaves and follows its neighbours names
a presence and a layout:

- React: `<Presence>` around `<Motion key={item.id} as="li" name="cascade reflow">`
- Angular: `<li udxMotion="cascade reflow">`
- Svelte: `{@attach motion(['cascade', 'reflow'])} transition:presence`

### Shared element

Two elements that carry the same shared key are one thing for the eye. When one of them
appears while the other is gone, it starts from the other's last position and size and
travels to its own place. A thumbnail that opens into a detail card is the typical case:

```html
<button type="button" data-motion="reflow" data-motion-shared="shot-1">1</button>
<div data-motion="reflow" data-motion-shared="shot-1" hidden>Detail of 1</div>
```

```ts
// Open the detail in place of the thumbnail: both changes in the same task
thumbnail.hidden = true;
detail.hidden = false;
```

The key is a kebab-case name, and it applies to a layout motion. Give it in one of these ways:

- the attribute `data-motion-shared="<key>"`, on an element that has a layout motion;
- the option `shared`: of `motion(element, 'reflow', { shared: 'shot-1' })`, of React's
  `useMotion('reflow', { shared: 'shot-1' })`, of Angular's `udxMotionShared` input
  (`<div udxMotion="reflow" udxMotionShared="shot-1">`), or of the Svelte `motion`
  attachment (`{@attach motion('reflow', () => ({ shared: 'shot-1' }))}`);
- `shared` in a layout definition, which gives every element bound to it the same key.
  `defineShared` returns the name, typed, for a shared identity used in several places:

```ts
import { defineMotion, defineShared } from '@udixio/motion';

defineMotion('hero-move', { verb: 'layout', shared: defineShared('hero') });
```

The `shared` option takes precedence over the key of the definition.

Rules:

- One live element holds a key at a time. An element holds its key while it is displayed.
  When two elements with the same key are displayed, the second does not morph, and in
  development an error is reported.
- The last box of a holder is kept for 600 ms after the holder is hidden or removed. The
  600 ms are counted from the moment the layout engine learns that it is gone. An element
  that arrives after that starts at its own place. While it is kept, the box follows the
  element the holder sat in: when the page scrolls, or a sticky or scrolled ancestor moves,
  the box moves with it.
- During the morph the content of the element is scaled with it, and its rounded corners
  stay round.
- The morph is a layout motion, so the layout engine must be loaded, as for any layout
  motion (see [Layout](#layout)). `await loadLayoutEngine()` (from `@udixio/motion`) preloads it.

Limits:

- The two elements do not cross-fade: the arriving element moves and scales from the other's box.
- The morph does not use the View Transitions API.
- An element that is bound more than 600 ms after the other holder went away, for example an
  island that hydrates late, does not morph.

### Reveal

A reveal plays when its element scrolls into view. Until then the element waits in its
first frame, so it is not seen half-way through its entry. The preset `rise` fades in
while rising 24px:

```html
<div data-motion="rise">…</div>
```

An element counts as in view as soon as any part of it is in the top 90 % of the viewport.
An element that is in view when it is bound is left in its natural state.

Options, given in the definition with the verb `reveal`:

- `stagger` (`tight`, `normal` or `loose`), and `origin`, as for lists: elements that enter
  the view together start one step apart, in visual order. `rise` has `stagger: 'normal'`.
- `repeat`: `once` (the default) plays the reveal the first time the element enters the view,
  then stops watching it. `always` puts the element back in its first frame when it leaves
  the view, and plays it again on each entry.
- `axis`: `block` (the default) watches the vertical view, `inline` the horizontal one.

```ts
import { defineMotion } from '@udixio/motion';

defineMotion('rise-again', {
  verb: 'reveal',
  keyframes: [
    { opacity: 0, y: 24 },
    { opacity: 1, y: 0 },
  ],
  stagger: 'normal',
  repeat: 'always',
});
```

Under reduced motion a reveal shows its element at once, unless its definition sets another
`reduced` value. `play()` on the binding replays a reveal from its first frame.

### Scrub

A scrub links its keyframes to the scroll position: as the element crosses the viewport its
keyframes play forward, and scrolling back plays them backward. The preset `parallax` moves
its element from 48px below its place to 48px above it:

```html
<div data-motion="parallax">…</div>
```

Options, given in the definition with the verb `scrub`:

- `range` chooses the part of the scroll the keyframes span: `enter` (the element entering the
  viewport), `cross` (the default: its crossing of the viewport), `exit` (the element leaving it)
  or `contain` (its containment in the viewport).
- `axis`: `block` (the default) follows the vertical scroll, `inline` the horizontal one.

The keyframes are interpolated linearly across the range. Before the range the first keyframe
holds, and after it the last one. A scrub has no timing and no presence.

```ts
import { defineMotion } from '@udixio/motion';

defineMotion('drift-in', {
  verb: 'scrub',
  keyframes: [
    { opacity: 0, y: 48 },
    { opacity: 1, y: 0 },
  ],
  range: 'enter',
});
```

`--udx-motion-scale` scales the distances of the keyframes: `x`, `y`, `rotate`, and a scale's distance from 1.
At 0.5 the element travels half as far, so its `x` at the end of the range is half the keyframe value. A scrub has no
duration, so the scale does not shorten it. It is read when the scrub starts (at bind, or when reduced motion is turned
off), not while it runs.

The scroll link is made by the browser, on a view timeline. `supportsViewTimeline()` (from
`@udixio/motion/continuous`) tells whether the browser has one. Where it has none (Firefox at the time of
writing), under reduced motion and under `--udx-motion: none`, the element keeps its stylesheet
state and nothing is written inline. Turning reduced motion on stops the scroll link, and
turning it off resumes it at the current scroll position.

### Loop

A loop plays its keyframes forever, from the moment it is bound. The scrub and the loop are the
`@udixio/motion/continuous` entry, which the main entry loads the first time one is bound: until it has
loaded, the element keeps its stylesheet state, and a pause asked meanwhile holds once the loop starts. It pauses by itself while its
element is out of view or its tab is hidden, and plays again once it is in view with the tab shown. An element that an ancestor clips
with `overflow: hidden` is in view while that ancestor is, so its own motion can bring it into view. The presets `rotate` (a
full turn each second), `breathe` (swells to 104 % and back) and `blink` (one dim flash each
second) are loops:

```html
<span data-motion="rotate" class="spinner"></span>
```

WCAG 2.2.2 asks that moving, blinking or scrolling content which starts by itself, lasts more
than five seconds and runs beside other content can be paused, stopped or hidden, unless it is
essential. A loop never ends, so each loop states in its definition how it is paused:

- `pause: 'control'`: the page offers a visible control that pauses the loop. The presets
  `rotate`, `breathe` and `blink` use it.
- `pause: 'essential'` with a `reason`: the loop is the content itself, such as an indeterminate
  progress indicator, and the page does not offer to pause it. The validator requires the
  `reason`, and refuses it on a `control` loop.

The page pauses a loop on demand:

- From script, `getMotion(element, 'loop')?.pause()` pauses the loop, and `play()` resumes it.
  `play()` clears the pause, but the loop still waits while its element is out of view.
- With the attribute `data-motion-paused`, the loop pauses while the attribute is present, and
  plays again when it is removed.
- In the frameworks, with the option `paused`: React `useMotion('rotate', { paused })`, Angular
  `<span udxMotion="rotate" [udxMotionPaused]="paused">`, and Svelte
  `{@attach motion('rotate', () => ({ paused }))}`.

Under reduced motion, or with `--udx-motion: none`, a loop does not play: the element keeps its
stylesheet state. `--udx-motion-scale` scales its duration and the distances of its keyframes, and 0 stops it. Its `timing` is a
curve only, `{ duration, easing }`, not a spring. Without `timing` it runs for one second, linearly.

```ts
import { defineMotion } from '@udixio/motion';

defineMotion('spin', {
  verb: 'loop',
  keyframes: [{ rotate: 0 }, { rotate: 360 }],
  pause: 'control',
});
```

### Values

A value is a continuous number that CSS can use. An element names the values it uses in
`data-motion-value`, and the runtime writes each one on that element as
`--udx-motion-value-<name>`, for as long as the element is bound. Define a value once, from
`@udixio/motion/value`:

```ts
import { defineValue } from '@udixio/motion/value';

defineValue('tilt-x', { source: 'pointer', axis: 'x', range: [-8, 8], unit: 'deg' });
```

- `source` says where the number comes from:
  - `pointer`: the place of the pointer across the element, on `axis` `x` (the default), `y`, or `both`
    (see below). The value goes back to the middle when the pointer leaves the element.
  - `scroll`: the progress of the page's scroll, on `axis` `block` (the default) or `inline`.
  - `state`: a number the page sets, with the `value` attribute or `set()`, clamped to `range`.
  - `time`: a loop, whose period is its `timing` duration. It pauses while its element is out
    of view.
- `range` gives the two ends, `[from, to]`, and defaults to `[0, 1]`.
- `spring` is a spring token, or `'none'` to write the value at once. By default the value
  moves with `spring.default.spatial` (a counter: `spring.default.effects`), and keeps its
  velocity when its target moves again.
- `timing` is a curve, `{ duration, easing }`, for `time` only. Its duration is the period,
  and its easing is not applied to the progress. Without `timing`, the period is one second:
  `{ duration: 'duration.extraLong4', easing: 'easing.linear' }`.
- `format` and `currency` make a `state` value a counter, see [Counters](#counters).
- `unit` (`deg`, `px`, `rem` or `%`) also writes the number with its unit, in a second variable named after the unit:
  `--udx-motion-value-tilt-x-deg` holds `0deg` at rest and `-8deg` at the left edge (`%` is named `percent`). The
  unitless variable is written too, so the unit goes in the CSS, with no `calc()`.
- `axis: 'both'`, for a `pointer` only, writes two variables, `--udx-motion-value-<name>-x` and `-y`, each on its own
  spring. One value with one name covers both axes: two values would need two names, and in HTML a nested element for
  the second. In JavaScript, the listeners are told the axis of each number, `(number, axis)`, and `current` is the x
  number.

In HTML, list the values of the element, separated by spaces:

```html
<div data-motion-value="tilt-x" style="transform: rotateY(var(--udx-motion-value-tilt-x-deg))">…</div>
<!-- defined with axis both and unit deg: -->
<div data-motion-value="tilt" style="transform: rotateX(var(--udx-motion-value-tilt-y-deg)) rotateY(var(--udx-motion-value-tilt-x-deg))">…</div>
```

In JavaScript, bind a value to an element yourself:

```ts
import { defineValue, value } from '@udixio/motion/value';

defineValue('level', { source: 'state', range: [0, 1] });
const meter = value(bar, 'level'); // bar: an HTMLElement; it writes --udx-motion-value-level on it
meter.set(0.8);                    // moves to 0.8, clamped to the range
meter.subscribe(number => console.log(number)); // each frame; returns the unsubscribe function
meter.subscribe(number => save(number), { perFrame: false }); // at rest, and at each change of target
meter.destroy();                   // stops writing and removes the variable
```

In the frameworks: `useMotionValue` and `useMotionValueSnapshot` (React), `[udxMotionValue]`
(Angular) and the `motionValue` attachment (Svelte). `udxMotionValueChange` (Angular) emits when the
value comes to rest and when its target changes, not on each frame: to follow each frame, read the
variable, or call `subscribe()`.

Under reduced motion, or with `--udx-motion: none`, a smoothed value is written at once, and a
`time` value holds the first end of its range.

### Counters

A counter is a `state` value with a `format`. Its number is written as the variable, and also as
the text of the element that names it, formatted in the language of the nearest `lang` attribute:

```html
<data value="12480" data-motion-value="visitors">12480</data>
```

```ts
import { defineValue } from '@udixio/motion/value';

defineValue('visitors', { source: 'state', format: 'integer', range: [0, 100000] });
```

- `integer`: whole numbers.
- `decimal`: as many decimals as the `value` attribute has when the element is bound: `12.50`
  has two, and at least one is written.
- `percent`: a fraction shown as a percentage, with no decimals: `0.42` is `42%`.
- `currency`: an amount in the currency named by `currency`, an ISO 4217 code such as `EUR`,
  which is required with this format and refused without it.

A counter that is out of view when the page loads starts at 0, and counts up when it scrolls
into view. A counter that is in view at load keeps its text until its value changes. A change
of its `value` attribute, or a `set()`, counts to the new number, with a spring that does not
overshoot (`spring.default.effects`).

While it counts, the element holds the number shown in an `aria-hidden` span and the final
number in a visually hidden span, so that a screen reader reads the final number. When the count
ends, the element holds one text node again. `destroy()` leaves the element on its final number.

In JavaScript, bind the counter element with `value()` as for any value, and call `set()`:

```ts
import { value } from '@udixio/motion/value';

const visitors = value(counter, 'visitors'); // counter: the <data> element above
visitors.set(13480);                         // counts up to 13,480 when it is in view
```

### Sequences

A sequence plays the children of one root in steps, with one handle for the whole
choreography. Define it from `@udixio/motion/sequence`:

```ts
import { defineSequence } from '@udixio/motion/sequence';

defineSequence('intro', {
  verb: 'reveal',
  steps: {
    title: { keyframes: [{ opacity: 0, y: 24 }, { opacity: 1, y: 0 }] },
    subtitle: { keyframes: [{ opacity: 0 }, { opacity: 1 }], at: '+=normal' },
    actions: { keyframes: [{ opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1 }], stagger: 'tight' },
  },
});
```

- `verb`: `appear` (the default) plays when the root is bound while inserted, or on `play()`.
  `reveal` plays when the root enters the view, and waits in the first frames of its steps until then.
- `steps`: each named step has `keyframes` (non-empty, as for an appear motion) and, optionally,
  `timing`, `reduced`, `stagger` and `origin`, which mean what they mean for an appear motion.
  The elements of a step are the children that carry `data-motion-step="<name>"`; the elements
  of a step with `stagger` cascade in visual order.
- `at` places a step on the timeline:
  - without `at`, the step starts when everything before it has ended;
  - `at: '<step>'` starts it with an earlier step;
  - `at: '+=tight'`, `'+=normal'` or `'+=loose'` starts it that long after the previous step
    starts: the `--udx-motion-stagger-*` tokens, 20, 50 and 100 ms by default.

In HTML, the root names the sequence in `data-motion`, as it names a motion:

```html
<div data-motion="intro">
  <h3 data-motion-step="title">…</h3>
  <p data-motion-step="subtitle">…</p>
  <button type="button" data-motion-step="actions">…</button>
  <button type="button" data-motion-step="actions">…</button>
</div>
```

In JavaScript, bind it to a root, and play it when you want:

```ts
import { sequence } from '@udixio/motion/sequence';

const binding = sequence(panel, 'intro', { settled: true }); // bound: no entry yet
const handle = binding.play();                              // plays the steps from the start
await handle.finished;                                      // 'finished' or 'cancelled'
```

`binding.handle` is the handle of the latest play. `getSequence(root)` returns the binding of a
root, and `destroy()` releases the inline styles. In the frameworks: `useMotionSequence` (React),
`[udxMotionSequence]` (Angular) and the `motionSequence` attachment (Svelte).

Under reduced motion every delay is 0, so the steps play together, each with its reduced render.

### Gestures

A gesture moves an element with the pointer, and gives it a keyboard alternative. Define it once, from `@udixio/motion/gesture`:

```ts
import { defineGesture } from '@udixio/motion/gesture';

defineGesture('dismiss', { kind: 'swipe', alternative: 'action' });
```

- `kind` says what the pointer does with the element:
  - `drag` follows the pointer on `axis`: `x`, `y` or `both` (the default). It stays within its parent
    (`bounds: 'parent'`, the default), or moves freely with `bounds: 'none'`. Released, it is thrown on by
    0.2 s of its velocity, within its bounds, and glides there with the release spring.
  - `swipe` follows the pointer on `axis` `x` (the default) or `y`. Released past 40 % of its size, or at more
    than 800 px/s in its direction, it flies out and fades; released sooner, it springs back.
  - `reorder` moves the element among its siblings that carry the same gesture, on `axis` `y` (the default)
    or `x`, past each neighbour its centre crosses.
- `release` is the spring of the release: `spring.default.spatial` by default.
- `afterFlyOut` (`swipe` only) says what happens to a swiped element once it has flown out: `hide` (the default)
  keeps it in the DOM, `aria-hidden` for assistive technology, and `remove` takes it out of the DOM, so a list needs no
  `MutationObserver`. The `motion-swipe` event comes before the flight: with `remove`, move focus to another element in
  that listener, since the element leaves with the focus.
- `alternative` is optional: it is the one of its kind, which is inferred when the spec leaves it out, and another one
  is refused. It is the keyboard alternative, which makes the gesture operable without a pointer (WCAG 2.1.1 Keyboard;
  WCAG 2.5.7 Dragging Movements requires a single-pointer alternative to a dragging movement):
  - `drag` with `arrows`: the arrow keys move the element 16 px, or 64 px with Shift.
  - `swipe` with `action`: Delete or Backspace swipes the focused element towards the end.
  - `reorder` with `grab`: Space or Enter grabs the focused element, the arrow keys of its axis move it,
    Space or Enter drops it, and Escape puts it back where it was.

The gestures module is not in the main entry: the scanner of `connectMotion()` loads it the first time a page
meets a `data-motion-gesture`, and `loadGestures()`, exported from `@udixio/motion`, loads it ahead of time.

A gesture reports through events that bubble from the element:

- `motion-dragend`, with `detail: { x, y }`, when a released drag has come to rest. It cannot be prevented.
- `motion-swipe`, with `detail: { direction }` (`'start'` or `'end'`), when a swipe is released far or fast
  enough, or Delete is pressed. It is cancelable: `preventDefault()` keeps the element where it is, and it
  springs back. Without it, the element flies out and is `aria-hidden="true"` once out of sight; removing it
  from the list is the page's job.
- `motion-reorder`, with `detail: { from, to }` (positions among the siblings that carry the gesture), before
  each step of a reorder, by pointer or by keyboard, Escape included. It is cancelable: `preventDefault()`
  refuses the step, and the element stays where it is. An app that renders its list from its state refuses the
  step and moves the item in that state; without `preventDefault()`, the binding moves the element in the DOM,
  as the demo does.

A reorder announces each keyboard step in a visually hidden live region (`[data-udx-motion-live]`, with
`role="status"`), which exists while a reorder is bound: `Grabbed. Position 2 of 5.`, `Moved. Position 3 of 5.`,
`Dropped. Position 3 of 5.` or `Cancelled. Position 2 of 5.`.

In HTML, `data-motion-gesture` names the gesture of the element, and `connectMotion()` binds it as it binds
`data-motion`. An element carries one gesture at a time:

```html
<div data-motion-gesture="dismiss">…</div>
```

In JavaScript, bind a gesture to an element yourself:

```ts
import { gesture, getGesture } from '@udixio/motion/gesture';

const binding = gesture(card, 'dismiss'); // card: an HTMLElement; throws for a name that is not defined
binding.offset;                            // { x, y }, in px: where the element is held
binding.reset();                           // back to its place, with the release spring, and visible again
getGesture(card);                          // the binding of the element, if any
binding.destroy();                         // gives back what the gesture set on the element
```

In the frameworks: `useMotionGesture` (React), `[udxMotionGesture]` (Angular), with its `udxDragEnd`,
`udxSwipe` and `udxReorder` outputs, and the `motionGesture` attachment (Svelte).

### Page transitions

`navigate(update, { direction })`, exported from `@udixio/motion/page`, changes the page inside a native View
Transition. The page entry is not in the main entry: a site that never changes its page does not load it. `update` makes the change, and may be async. `direction` is where the page goes: `forward` (the
default) or `back`. The route rules of `motion.css`, which the document imports, slide the old view out and the
new one in, both fading, over the slow spatial spring. The direction is also set as `data-motion-direction` on the
`html` element, and the transition's type is `udx-forward` or `udx-back`.

```ts
import { navigate } from '@udixio/motion/page';

await navigate(() => showPage('roadmap'), { direction: 'forward' });
await navigate(() => showPage('home'), { direction: 'back' });
```

For Astro's ClientRouter, call `connectAstroTransitions()`, from `@udixio/motion/astro`, once in the layout. It
gives each navigation of the router the direction that Astro reports, and starts no transition of its own: the
router's transition runs with the route rules. It returns a function that disconnects it. The documentation site
does this in its layout.

Under reduced motion, or with `--udx-motion: none`, `navigate()` runs the update alone, and
`connectAstroTransitions()` does nothing. Where the browser has no View Transitions, `navigate()` runs the update
alone too.

### Text

A definition with `split` cuts the text of its element into pieces, and plays its keyframes on the pieces in a
cascade, in the order of the text. `split` is `words`, `chars` (the letters, as graphemes) or `lines`, and it applies
to `appear`, `disappear` and `reveal`. Without a `stagger` the pieces cascade `tight`, and `origin` applies to them:

```ts
import { defineMotion } from '@udixio/motion';

defineMotion('headline', {
  verb: 'reveal',
  split: 'words',
  keyframes: [{ opacity: 0, y: 12 }, { opacity: 1, y: 0 }],
});
```

In HTML, the element names the motion as any other: `<h2 data-motion="headline">…</h2>`.

The original nodes move into a visually hidden copy, which keeps their semantics (`em`, `strong`, `abbr`), and the
cut copy that the eye sees is `aria-hidden="true"`: a screen reader reads the text once, as written. A change of the
text is cut again. An element that holds an interactive descendant (`a[href]`, `button`, `input`, `select`,
`textarea`, `[tabindex]`, `[contenteditable]`) is not split: it plays whole, and a development warning says why.
`lines` groups the words by their position, and a resize rebuilds the lines once the motion in progress has ended.

Under reduced motion, or with `--udx-motion: none`, the text is not split: the element plays whole, with the reduced
rule of its verb.

The split lives in `@udixio/motion/text`, which the main entry loads the first time a split definition is bound.
`loadText()`, exported from `@udixio/motion`, loads it ahead of time. `splitText(element, { by })` cuts an element by
hand and returns `undefined` when it has no text or an interactive descendant; `getSplit(element)` returns its split,
and `revert()` puts the original nodes back in place. Both come from `@udixio/motion/text`.

### SVG

A motion binds on an SVG element as it does on an HTML one, with three exceptions: a layout motion is refused there,
since it needs a box; a split plays the element whole, since its text is not cut; and values, sequences and gestures
bind to HTML elements only. Two visual fields are for shapes and paths:

- `draw`, from 0 to 1, draws a path or a basic shape from nothing to its whole stroke. It sets `pathLength` to 1 and
  the dash of the stroke. A finished draw at 1 gives both back to the author at rest, and a binding gives them back when
  it is destroyed. Two motions that draw one shape share its `pathLength`: it stays 1 while either draws, and the dash
  of the last one written stays. The `draw` preset is an `appear` from nothing to the whole stroke. Another element
  keeps its stroke, with a development warning.
- `along`, from 0 to 1, moves an element along the `offset-path` its CSS gives it, by writing `offset-distance`.

Under reduced motion an entry or an exit with `draw` sets its stroke at once and fades only the opacity, and an `along`
moves at once and fades in place.

```ts
import { defineMotion } from '@udixio/motion';
import { morph } from '@udixio/motion/svg';

// Along: the element travels from the start of its offset path to its end
defineMotion('travel', { verb: 'appear', keyframes: [{ along: 0 }, { along: 1 }] });

// Morph: the d of the path becomes the d of another shape
const handle = morph(icon, 'M7 5 H10 V19 H7 Z M14 5 H17 V19 H14 Z');
await handle.finished; // 'finished' once the shape is there
```

`morph(path, to, { timing, precision })`, from `@udixio/motion/svg`, morphs the `d` of a path into the `d` of another
path element, or into a `d` string. Both shapes are resampled with anime.js, which the consumer installs alongside the
package, so they need not have the same number of points. The default timing is `spring.default.spatial`; a curve is
its own easing. `precision` is the number of points per unit of length the shapes are sampled at, and 0 morphs the two
strings as they are. The handle ends when the shape is there, and then the path carries exactly the `d` of the target.
`cancel()` leaves the shape where it is. Under reduced motion, with `--udx-motion: none` or a zero motion scale, the
shape is set at once. The path must be inside an SVG.

An element that is already on the page when the runtime connects keeps the `offset-distance` its CSS gives it, which is
the start of its path unless the CSS says otherwise: set `offset-distance: 100%` on a travel that should rest at its end.

### Scroll

`scrollTo(target, { container, timing, offset, focus })`, from `@udixio/motion/scroll`, scrolls an element into place
over a spring. The target is an element or a `{ x, y }` position. By default the nearest scrollable ancestor of the
element scrolls, or the page; `container` names another scroller. The start edge of the element is brought to the start
of the visible area, past the `scroll-padding` of the scroller and the `scroll-margin` of the element. `offset` adds
pixels to the destination, in scroll units. The spring is `spring.slow.spatial` unless `timing` says otherwise, and the
destination is read on each frame, so the scroll follows a layout that moves while it runs.

```ts
import { scrollTo } from '@udixio/motion/scroll';

const { finished } = scrollTo(document.getElementById('pricing')!, { focus: true });
await finished; // 'finished' at the destination, or 'cancelled' when the user scrolled
```

The scroll returns `{ finished, cancel() }`. A wheel turn, a touch, a pointer press or a key press of the user cancels
it, and so does a new scroll of the same container. `focus: true` gives the focus to the target on arrival, without
scrolling again; a target that cannot take focus gets `tabindex="-1"`. While it runs, the `overflow-anchor` of the
scroller is `none`, and it is given back at the end. Under reduced motion, or with `--udx-motion: none`, the scroll
jumps to its destination. `scrollDestination(target, options)` reads where the same scroll would stop, without scrolling.

### HTML

`data-motion` takes names separated by spaces, at most one per kind: a presence motion
(it enters and leaves), an emphasis, a layout motion, a view motion (`reveal` or `scrub`)
and a loop. A second name of a kind the element already has is ignored.

```html
<section data-motion="slide">Enters when inserted</section>
<button type="button" data-motion="press">Save</button>
```

A list item that enters and leaves with `cascade`, and follows its neighbours with `reflow`:

```html
<li data-motion="cascade reflow">…</li>
```

```ts
import { connectMotion } from '@udixio/motion';
import '@udixio/motion/presets';

// Once per page. Returns a function that disconnects and destroys the bindings.
const disconnect = connectMotion();

// Later, to apply the press emphasis:
document.querySelector('button')!.dataset.state = 'pressed';
```

`connectMotion()` binds the `data-motion` elements under `document` and keeps them in step with the DOM:

- An inserted element plays its entry, unless it is inserted with `hidden`.
- Setting `hidden` plays the exit. The attribute stays, and the element remains displayed
  and `inert` until the exit ends. With focus inside the element, `data-motion-restore-focus="<selector>"`
  names where focus goes: the exit moves it to the element the selector matches, outside the element, before
  `inert` is set (WCAG 2.4.3). Without a match, `inert` waits until focus leaves the element or the exit ends.
- Removing `hidden` plays the entry.
- A `data-state` change on an `emphasize` motion replays it.
- Adding or removing `data-motion-paused` pauses or resumes a `loop`.
- An element present at connect plays no entry. A `reveal` waits in its first frame while it is
  out of view, and a `loop` or a `scrub` starts at once. An element removed from the root is destroyed.
- An unknown name leaves the element untouched. With `connectMotion({ development: true })`
  an error names the missing motion, and the element is bound once that name is defined.

### JavaScript

```ts
import { motion } from '@udixio/motion';
import '@udixio/motion/presets';

const binding = motion(panel, 'slide', { settled: true });
console.log(await binding.setPresent(false)); // 'finished' or 'cancelled'
```

`motion(element, source, options)` accepts a defined name, a `MotionRef` or a raw spec,
and returns a `MotionBinding` (`setPresent`, `play`, `pause`, `destroy`, and `present` and `handle` getters):

- `present` (default `true`) is the initial presence; `settled` skips the entry of a present element.
- `setPresent(present)` runs the exit or entry and resolves to `'finished'` or `'cancelled'`.
  It never rejects; on any failure the element is left in its destination state.
- `play()` replays an `emphasize` motion or a `reveal` from its first frame, resumes a `loop`,
  and compares a `layout` and moves it now. A `scrub` has nothing to replay. `play()` throws for
  `appear` and `disappear`, which take `setPresent`. `pause()` applies to a `loop` only, and
  `setPresent` applies to `appear` and `disappear` only.
- `destroy()` cancels the motion and releases its inline state.
- `getMotion(element, kind?)` returns the binding of a kind (`'presence'`, `'emphasis'`, `'layout'`, `'view'` for a reveal or a scrub, or `'loop'`),
  or the first one when no kind is given. `getMotions(element)` returns all of them, in that order.

Values and sequences have entries of their own, which the main entry does not hold:
`defineValue`, `value` and `getValue` come from `@udixio/motion/value`, and `defineSequence`,
`sequence` and `getSequence` from `@udixio/motion/sequence`. The scanner of `connectMotion()`
loads the values module the first time a page meets a `data-motion-value`, and the sequences
module when a `data-motion` names a sequence. `loadValues()` and `loadSequences()`, exported from
`@udixio/motion`, load them ahead of time, as `loadLayoutEngine()` does for layout.

### Without a bundler

The built files run in a page with no bundler. Serve `dist/` with the page (or from a CDN that mirrors the
package), and map the specifiers of the entries you import in an import map:

```html
<script type="importmap">
  {
    "imports": {
      "@udixio/motion": "/vendor/motion/dist/index.js",
      "@udixio/motion/presets": "/vendor/motion/dist/presets.js"
    }
  }
</script>
<script type="module">
  import { connectMotion } from '@udixio/motion';
  import '@udixio/motion/presets';

  connectMotion();
</script>
```

- The other files of `dist/` are imported by the entries, relative to their own URL: they need no mapping.
- anime.js is needed only by the entries that animate with it (`svg`, `providers/animejs`); map `animejs`
  (and `animejs/svg`, at `dist/modules/svg/index.js`) when you import them.
- A page has no `process`, so the development checks (the spec validation, and the warnings of the build-time
  checks) are off there, as in a production build. A development build of a bundler keeps them on, see
  [Development](#development). `connectMotion({ development: true })` still reports the runtime messages.

### Frameworks

Each framework adapter binds a motion to its element and forwards presence and
emphasis to the binding. The adapters hold no animation: the motion is still
defined and timed by `@udixio/motion`. They live in `@udixio/ui-react` (the `Motion` and
`Presence` components, and `useMotion`), `@udixio/ui-angular` (the `Motion` directive, `udxMotion`)
and `@udixio/ui-svelte` (the `motion` attachment and the `presence` transition).

React, with the `Motion` component. `as` is the element to render (a `div` by default), and its props are
the props of that element:

```tsx
import { Motion, Presence } from '@udixio/ui-react';

function Sheet({ open }: { open: boolean }) {
  return (
    <Presence>
      {open && <Motion key="sheet" name="slide">…</Motion>}
    </Presence>
  );
}
```

`Presence` keeps a child that leaves rendered until its exit has played, then removes it. A list exits item by item:

```tsx
<ul>
  <Presence>
    {items.map((item) => (
      <Motion key={item.id} as="li" name="cascade reflow">{item.text}</Motion>
    ))}
  </Presence>
</ul>
```

Outside a `Presence`, `present` does the same for one element: `<Motion name="slide" present={open}>`. `name` is
optional: `<Motion gesture="drag-card">` binds a gesture alone. A `gesture` binds to the same element, and its events
reach `onMotionSwipe`, `onMotionReorder` and `onMotionDragEnd`. The gesture events, by framework:

| Event | `<Motion>` (React) | `useMotionGesture` (React) | Angular | Svelte |
| --- | --- | --- | --- | --- |
| Drag released | `onMotionDragEnd` | `onDragEnd` | `udxDragEnd` | `onDragEnd` |
| Swipe | `onMotionSwipe` | `onSwipe` | `udxSwipe` | `onSwipe` |
| Reorder step | `onMotionReorder` | `onReorder` | `udxReorder` | `onReorder` |
 For an
emphasis, `state` replays it each time its value changes. `useMotion` is unchanged, and keeps the handle that `Motion`
does not give: `play()` replays an emphasis on demand, and `getBinding()` returns a binding. An element that a `Motion` or
`useMotion` manages is rendered while it is present or leaving, so do not unmount it yourself.

Angular:

```html
@if (open()) {
  <div udxMotion="slide">…</div>
}
```

Add `Motion` to the component's `imports`. Angular keeps the element until its exit
has played, then removes it. For an emphasis, bind `[udxMotionState]` to the value that changes.

Svelte, on an element of an `{#if}` block:

```svelte
<script lang="ts">
  import { motion, presence } from '@udixio/ui-svelte';
</script>

{#if open}<div {@attach motion('slide')} transition:presence>…</div>{/if}
```

`presence` keeps the element until its exit has played. For an emphasis, pass `state`
in the options: `{@attach motion('press', () => ({ state: count }))}`.

Hydrated server content: React treats it as already in place, so it plays no entry. An element already marked
`data-presence="present"` (the Angular server render marks its present elements) is bound settled by the core binding,
whatever the framework, so no entry replays on hydration; a `motion()` call on it does the same. `settled: false` asks for
the entry anyway; `udxMotionSettled` in Angular and `settled: true` in the options of the Svelte `motion` attachment
settle an element that is not marked.

### Presence state

The runtime writes `data-presence="entering" | "present" | "exiting"` on each element bound
to a presence motion; authors should not set it. Style it with Tailwind variants, for example
`data-[presence=exiting]:pointer-events-none`.

**At rest.** When a presence, emphasis or reveal motion ends, the fields that rest at their neutral
value leave the element's inline style, and the stylesheet supplies them: `opacity` 1, `x` and `y` 0,
`scale` 1, `rotate` 0, and `draw` 1 for a shape. So `hover:scale-105` and an author class such as
`scale-[1.05]` apply at rest. A value that is not neutral stays inline: the opacity 0 of an exit until
`hidden` takes over, or the first frame of a reveal that is still out of view. A cancelled motion
releases nothing, so the next motion carries from where it stopped. Under reduced motion, or with
`--udx-motion: none`, the destination is released at once.

**Focus (WCAG 2.4.3).** An exit sets `inert` on the element, and the browser then drops focus that was
inside it. When the exit starts with focus inside, pass `restoreFocus`: the element, or a function that
gives it when the exit starts (`motion(panel, 'fade', { restoreFocus: () => opener })`). Focus moves there
before `inert` is set; a target that cannot take focus gets `tabindex="-1"` for that move, and it is taken
back when focus leaves the target. Without a target, the element stays focusable until focus leaves it or
the exit ends, and development logs a warning once per element. The adapters take the same name:
`useMotion(source, { restoreFocus })`, `udxMotionRestoreFocus` and `motion(source, () => ({ restoreFocus }))`.
In HTML, `data-motion-restore-focus="<selector>"` is the same option: the selector is looked up in the document when the
exit starts, and an invalid selector or a match inside the element gives no target.
Focus outside the element is not moved, and the exit sets `inert` at once.

### Turning motion off, or reducing it

- `--udx-motion: none` on an element or an ancestor applies the end state without
  animating. Tailwind: `md:motion-none`.
- Under reduced motion (`prefers-reduced-motion: reduce`, or `<html data-motion-policy="reduce">`),
  entries and exits become a short opacity fade. An emphasis is not animated: it
  applies its end frame.
- Under reduced motion a reveal shows its element at once, a scrub stays still and a loop
  does not play.
- Under reduced motion, or with `--udx-motion: none` on the element, a gesture's release is written at once,
  with no glide. A page transition runs its update alone, see [Page transitions](#page-transitions).

### Motion per breakpoint

`--udx-motion` may name a defined motion as well as `none`. At each trigger (an entry, an exit, a replay, a loop that starts
or resumes), the element plays the named motion in place of its own, when the name is a defined motion of the same kind (a
presence, an emphasis, a reveal or a loop). Tailwind picks the motion by breakpoint:

```html
<div data-motion="rise" class="md:motion-[fade]"></div>
```

Here the element rises on small screens and fades from `md` up. A name of another kind, or one that is not defined, is
ignored: the element plays its own motion, and a development build reports it once. `none` still turns the motion off.
The binding's own triggers and its view options (`axis`, `repeat`) stay those of its definition.

### Scope: inspect and revert

`@udixio/motion/scope` holds two functions that the main entry does not load:

- `revert(root = document.documentElement)` destroys every motion under `root`, the root included: presence, emphasis,
  layout, reveal, scrub, loop, values, gestures and sequences. Each element is left in its stylesheet state. A connection
  that covers `root` stops observing it, and a connection made afterwards binds it again. Use it to tear down a section of
  a page, or in a test.
- `inspect(root = document.documentElement)` returns a plain report for development: the reduced-motion policy (and its
  source), each binding with its element (a short CSS path), kind, name, verb and state, and the defined motions. It changes
  nothing. Importing the entry also sets it as `udixio.motion.inspect` in development builds.

### Current limits

The package is under construction, so:

- All seven verbs exist: `appear`, `disappear`, `emphasize`, `reveal`, `scrub`, `loop` and `layout`.
- At the end of a presence, emphasis or reveal motion, the end values stay inline on the element
  (`opacity`, `translate`, `scale`, `rotate`). A class that sets the same property on that element
  is overridden until the binding is destroyed. A loop and a scrub write nothing inline: while
  they run, their animation overrides the same property.
- Preset values are not calibrated yet.
- A value's number is rounded to four decimals. A `pointer` value is read over its element only.
  A `scroll` value follows the scroll of the window, not that of a scrolling element inside the page.
- A `time` value keeps the clock of its binding: after a pause it resumes at the phase of the
  clock, not where it stopped. Its `--udx-motion` is read at each frame, so `none` holds it at the
  start of its range at once, and removing `none` runs it again at once.
- A counter's number is the only text of its element: once the counter moves, the content of the
  element is replaced by it.
- A sequence is validated in development only, as a motion is. Within a step, the delays of a
  cascade are capped at `--udx-motion-stagger-max`, as for lists; the delays of `at` are not.
- A child that belongs to a nested sequence is not a step of the outer one.
- A gesture writes the `translate` of its element, and its `opacity` while a swipe flies out. An author's
  `translate` on that element is overwritten while it is bound, and `destroy()` gives back what the gesture wrote.
- `touch-action` is set when the gesture is bound (`none` for a free drag, `pan-y` on the x axis, `pan-x` on the y
  axis), so a touch screen does not scroll the page instead of moving the element; it is given back on `destroy()`.
  `user-select` is `none` only while a pointer holds the element.
- A keyboard nudge of a drag moves the element at once, without a glide; a keyboard step of a reorder glides.
- A drag is bounded by the content box of its parent, measured when the pointer grabs the element and at each
  nudge of a key. A reorder moves an element among the siblings that carry the same gesture, under the same
  parent: an element with no parent cannot be reordered, and development reports it.
- A swipe that is not prevented stays in the DOM, with `aria-hidden="true"`; removing it is the page's job.
- A gesture's spec is validated in development only, as a motion is; its name is checked always.
- `navigate()` needs the View Transitions API: where it is missing, the update runs alone.
  `connectAstroTransitions()` starts no transition; it sets the direction only.
- A split element's children must not be added or removed by a framework: its text changes are followed, its
  elements are not.
- `lines` falls back to `words` when the text holds an element other than `br`.
- Joining scripts (Arabic, Indic, Thai and the like) are split by words in `chars`, so that no letter loses its form.
- `scrollTo` cancels when the user scrolls, and scroll anchoring is off on the scroller while it runs.

## Development

Inside the workspace, the `development` export condition resolves to the
TypeScript sources in `src/`. Build the published output with:

```sh
npx nx build @udixio/motion
```

The published output has two builds. The default build (`dist/`) runs the development checks only where
`process.env.NODE_ENV` is not `production`. The `development` build (`dist/development/`), which the `development`
export condition selects (Vite's dev server, webpack in development mode, `node --conditions=development`), always runs
them, even in a browser with no `process`. Both are built by the same command (`vite build`, then
`vite build --mode development`).

Run the tests with:

```sh
npx nx test @udixio/motion
```

### Experimental M3 spring tokens

`defineTokens()` returns the expressive scheme; `defineTokens({ scheme: 'standard' })`
selects the standard scheme for a product. Access the physical parameters as,
for example, `tokens.spring.fast.spatial.dampingRatio` and `.stiffness`.
`fallback.duration` is in milliseconds and `fallback.easing` is the official
M3 CSS cubic-bezier approximation. It is a last-resort approximation for
uninterrupted motion, not an equivalent physical spring. `linear.duration` (ms)
and `linear.easing` give a CSS `linear()` approximation of the unit-mass,
zero-initial-velocity analytical response. Its duration bounds the remaining
settling error to 0.1%; the 26 stops approximate the response to 0.2% for
each official token, with an exact final value of 1. The curves are generated
from `scripts/spring-source.json` by `node scripts/generate-springs.mjs`;
`node scripts/generate-springs.mjs --check` verifies they are current. Use the official fallback where `linear()` is unavailable.

This is a provisional token-data foundation, not a complete F1 implementation:
automatic runtime resolution of timing references, custom easings, Tailwind and framework syntaxes remain future work. The API shape may change
when the shared motion model and provider contracts are designed.

Choosing a spring. The fast spatial spring overshoots its target by about 9.5 %, the default and slow spatial springs
by about 1.5 %, and the effects springs not at all. Use the fast spatial spring only on transforms of small pieces: a
switch thumb, a small scale, the items of a FAB menu. Do not use it on layout edges with clipped content (height or
width), on corner radii, or on an indicator that travels more than about 50 px: the overshoot reads as a glitch there.
A property that collapses to 0 (height, width or scale) never uses an underdamped spring, spatial ones included: it
reaches 0 at full speed, where the overshoot is clamped, so it moves on the effects spring of the same speed.

### Static CSS spring tokens

Import `@udixio/motion/motion.css` in the document to expose six pairs:
`--udx-motion-spring-{fast,default,slow}-{spatial,effects}-{duration,easing}`.
For example, use `transition-duration: var(--udx-motion-spring-fast-spatial-duration)`
and `transition-timing-function: var(--udx-motion-spring-fast-spatial-easing)`.
The document defaults to expressive; set `data-motion-scheme="standard"` on
`<html>` to select standard. The CSS scheme and the scheme passed to
`defineTokens()` are independent; configure both when using both APIs.

The stylesheet starts with official cubic-bezier fallback pairs and switches both
values to the generated `linear()` pair when the browser accepts that syntax.
This detection concerns CSS only. Consumers must apply their own reduced-motion
policy before using these values; the tokens do not disable animations.
The stylesheet is static and works in server-rendered HTML without JavaScript.

The `motion-css` size-limit check budgets the built stylesheet separately from
the JavaScript CSS provider. The curve tokens increased the single-preset baseline to 2.276 kB minified
and gzipped; the limit was revised from 2.2 to 2.6 kB (10% headroom, rounded
up to 0.1 kB). The manifest grew to 2.031 kB and its limit was revised from
1.9 to 2.3 kB on the same basis. The motion package selects its own size-limit
preset so esbuild runs once; the former inherited root configuration loaded it twice. Run
`npm run size --workspace @udixio/motion` after building to enforce it.

### Experimental spring resolution

`resolveSpring` selects the complete duration and easing pair for a `SpringRef`.
The product chooses one scheme and supplies explicit support for both exact curves;
`linear` is preferred, and an error is thrown if neither is supported. `source` is
metadata, not part of `MotionTiming`. For example, with the CSS provider:

```ts
import { defineTokens, resolveSpring, type MotionScheme, type MotionTiming } from '@udixio/motion';
import { cssProvider } from '@udixio/motion/providers/css';

const scheme: MotionScheme = 'expressive'; // product configuration
const token = defineTokens({ scheme }).spring.fast.spatial;

function animateIfAllowed(target: HTMLElement, reducedMotion: boolean) {
  // Apply the product's reduced-motion policy before using the raw provider.
  if (reducedMotion) return;
  const css = target.ownerDocument.defaultView?.CSS;
  if (!css || typeof css.supports !== 'function') return; // support unknown
  let linear: boolean;
  let fallback: boolean;
  try {
    linear = css.supports('animation-timing-function', token.linear.easing);
    fallback = css.supports('animation-timing-function', token.fallback.easing);
  } catch { return; } // support unknown
  const resolved = resolveSpring('spring.fast.spatial', { scheme, support: { linear, fallback } });
  const timing: MotionTiming = { duration: resolved.duration, easing: resolved.easing, delay: 0 };
  return cssProvider.animate({ target, keyframes: [{ x: 0 }, { x: 100 }], timing });
}
```

CSS detection establishes syntax acceptance in that document, not rendering fidelity
or support by WAAPI, anime.js, or another backend. Check those backends separately.
On the server provide a known backend policy or defer resolution until the client;
unknown support is neither true nor false. Server and hydration choices can differ.
A stale capability can be rejected by the CSS provider before mutation; detect again
and resolve again when appropriate. The raw provider does not apply reduced-motion policy.

The generated `linear()` curve's 0.2% error bound applies to the analytical
zero-initial-velocity response over its own duration, not to the official cubic-bezier
fallback (approximately 6–10% error in the examined cases). Neither promises velocity
continuity on interruption. SpringRef runtime integration remains future work.

### Experimental distance and stagger tokens

`defineTokens()` exposes `distance.sm`, `distance.md`, and `distance.lg`
(8, 24, and 64 CSS pixels), and `stagger.tight`, `stagger.normal`,
`stagger.loose`, and `stagger.max` (20, 50, 100, and 400 milliseconds).
These values are provisional, have low confidence, and require visual calibration;
they do not come from M3. The stylesheet exposes the same values as inherited
`--udx-motion-distance-{sm,md,lg}` and
`--udx-motion-stagger-{tight,normal,loose,max}` custom properties. These are
registered as inherited `<length>` and `<time>` properties at document level,
with root declarations as a fallback where `@property` is unsupported. They may
be overridden through the CSS cascade. `stagger.max` caps relative start delay,
not the end time of the last animation.

Tokens alone do not implement motion policy: consumers must suppress nonessential
translation and stagger under reduced motion, rather than relying on a smaller
distance. The stylesheet supplies `--udx-motion-scale` for policy-aware consumers.

### Document motion scale

Import `@udixio/motion/motion.css` once in the document stylesheet (outside
shadow roots). It registers `--udx-motion-scale` as an inherited number,
defaulting to `1` and to `0` when `prefers-reduced-motion: reduce` is active or
`data-motion-policy="reduce"` is set on `<html>`. The value `auto`, an absent
attribute, and unrecognized values follow the system preference; `auto` does not
override a reduced system preference. A plain
`:root` declaration supplies the same values in browsers without `@property`.
The CSS is static and can be included in server-rendered HTML without JavaScript.
This entry supplies token values and the scale. A motion multiplies the distances of its keyframes and its durations by the
scale, as a presence, an emphasis, a reveal, a scrub or a loop does; a layout flight keeps its real geometry, and a gesture its
own release. `animateStyle` multiplies its duration only, since the distances of arbitrary CSS are not scaled, and a scale of 0 shows
its end frame at once. The entry does not apply the scale to animations or
implement a motion provider or integrate the policy reader (`@udixio/motion/policy`) into a runtime.

The public motion vocabulary includes `Verb`, `SpringRef`, and `ReducedRender`.
The complete declarative `MotionSpec` is not exported yet: the domains of scroll ranges and shared keys remain unspecified, and the
stagger vocabulary is provisional. These types do not add a runtime API or
implement the defaults in the motion design specification.

### Anime.js provider easing migration

`animejsProvider` accepts the CSS `linear` keyword and valid `cubic-bezier()`
values with finite decimal coordinates and x coordinates in `[0, 1]`. Each
coordinate is limited to 15 significant decimal digits (leading zeros excluded),
nonzero underflow is rejected, and y coordinates must be in `[-1000000, 1000000]`
to keep the Anime.js polynomial finite. This is a subset of CSS numeric syntax. Unsupported
or malformed easings, including `steps()` and `linear()` stop lists, now throw
synchronously before reading styles or starting an animation. Previously they
silently animated with `linear`. Direct callers must select a supported curve
explicitly; for spring tokens, use the complete `fallback` duration and easing
pair when targeting this provider. The provider reads computed styles in the
target document's window, including for iframe targets.

### Experimental CSS provider

Import `cssProvider` from `@udixio/motion/providers/css`. It supports exactly two
complete frames with matching finite `opacity`, `x`, `y`, `scale` and `rotate`
fields, positive finite duration, nonnegative finite delay and browser-accepted
standard easing keywords, `steps()` or `cubic-bezier()`. Nested functions in
their arguments are excluded, including otherwise valid `calc()` expressions.
The exact `linear.easing` strings returned by `defineTokens()` are accepted; modified
or custom `linear()` curves, CSS substitutions and CSS-wide values are rejected.
The provider checks support in the target document and throws before mutation if unsupported.
It creates a CSS keyframe animation, one per connected light-DOM
HTMLElement. The consumer must control the target and ensure no author animation
configuration or `!important` rule masks the animated properties. Inline important
styles are rejected, and detectable endpoint masking causes cancellation or a
creation error. Cascade changes and writes that occur between synchronous checks
cannot be reliably detected. Detached targets, shadow roots, automatic backend
selection, state transitions and scroll timelines are outside this experiment.
The handle reports no capabilities and unavailable velocity; seek includes delay.

### Duration and easing tokens

`defineTokens()` returns fresh `duration` (milliseconds) and `easing` (CSS
strings) tables for either scheme. `DurationToken`, `EasingToken` and
`CurveTiming` describe references; the experimental manifest validates these
references without executing them. Existing spring references remain supported.
`resolveCurve({ duration: 'duration.medium2', easing: 'easing.standard' })`
explicitly returns the initial `{ duration: 300, easing: 'cubic-bezier(0.2, 0, 0, 1)' }`
pair. Invalid references and malformed records throw. It does not execute motion
or apply policy, CSS overrides or scaling.
Older manifest validators reject the new object form. These initial values are
available during SSR without browser globals; the effective client policy and
CSS overrides are not automatically resolved into JavaScript timings.

CSS consumers can apply the policy scale once, for example:

```css
transition-duration: calc(var(--udx-motion-duration-medium2) * var(--udx-motion-scale));
transition-timing-function: var(--udx-motion-easing-standard);
```

Local CSS overrides do not change the JavaScript table. The caller applies
reduced rendering, including the disappearance fade exception; a zero scale
alone does not implement static, neutral or frozen rendering. Do not pass a
zero duration to the CSS provider; apply the appropriate reduced rendering.

The document stylesheet imports generated spring and curve stylesheets. Keep
these sibling CSS files together when serving or copying the package assets.

### Search outline transitions

Search works without importing motion CSS: its outlines use 200 ms, `cubic-bezier(0, 0, 0.2, 1)`, and scale 1. Import `@udixio/motion/motion.css` explicitly at the document level to provide `--udx-motion-duration-short4`, `--udx-motion-easing-standard-decelerate`, and `--udx-motion-scale`. The token easing differs from the historical fallback. Valid local variable overrides inherit according to the CSS cascade; custom classes may also replace the transition.

System reduced motion removes the transition even without motion CSS and inside shadow roots. `html[data-motion-policy="reduce"]` removes it in ordinary DOM; this selector cannot cross a shadow boundary. In a shadow tree, document-level motion CSS supplies an inherited zero scale for that policy, unless a local override replaces it. Avoid such overrides when reduction must be enforced. Missing, `auto`, and unknown policy values follow the system preference.

### Switch motion

Switch uses the shared system and document motion policy for its thumb movement. A reduction applied during movement immediately settles the thumb at its latest target; returning to normal does not restart it. Its size transition also respects reduced motion and uses `--udx-motion-scale` when this optional stylesheet is loaded. After mount, the shared controller applies the document policy inside Shadow DOM without requiring the stylesheet. Before hydration the document attribute selector cannot cross the shadow boundary; the system preference still applies. Custom classes can override the CSS transition rule. This describes Switch only, not all components.

### Slider motion

Slider's value indicator and track/handle transitions follow the shared system
and document policy. Reduction during motion settles the latest target; normal
motion does not resume an interrupted effect. Once mounted, each slider marks
its own root, so its default transition rules work inside Shadow DOM without
`motion.css`. Before hydration, the document attribute cannot cross a shadow
boundary, although the system media query applies. `--udx-motion-scale` changes
the default transition duration, while a custom class can override the default
transition rules, including reintroducing motion. The optional core controller
`reducedMotion` callback is sampled on each visibility request and policy
notification; it cannot report changes by itself and does not update the CSS
marker. These guarantees concern Slider only.
