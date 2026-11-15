# @udixio/motion

The animation runtime of the Udixio UI component library.

It is framework-agnostic: it has no React or other UI framework dependency or
peer dependency. Its only JavaScript animation engine is
[animejs](https://animejs.com) (`^4.5.0`), which consumers install alongside it.

This package is under construction. It exports `defineTokens`, `resolveSpring`,
`resolveCurve` and `RUNTIME_KEY`. The `Symbol.for('udixio.motion@1')` key is
reserved for the future shared runtime; this release does not register one.

The experimental manifest and validator are available from
`@udixio/motion/manifest` (`motionManifest`, `validateMotionDocument`, and their
types). The generated JSON is available at `@udixio/motion/motion-manifest.json`.
The manifest API was moved from the root entry to this subpath; update any
imports from the previous experimental root export.

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
  reverse), `emphasize` (plays the keyframes forward on each replay) and `layout`
  (moves with the layout, see [Layout](#layout)).
- Keyframe fields: `opacity`, `x`, `y`, `scale`, `rotate`.
- `timing` is optional: a spring token such as `spring.fast.spatial`, or
  `{ duration: 'duration.medium2', easing: 'easing.standard' }`. It applies to every field.
- Definitions are shared page-wide. An identical redefinition returns the existing
  definition; a different spec throws.

### Presets

```ts
import { fade, slide, scale, cascade, press, reflow } from '@udixio/motion/presets';
```

Importing the entry defines `fade`, `slide`, `scale` and `cascade` (appear), `press`
(emphasize) and `reflow` (layout), usable directly in `data-motion`. `cascade` staggers the
elements that enter together, see [Lists](#lists). Their values are provisional.

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

- React: `useMotion(['cascade', 'reflow'], { present })`
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
  that arrives after that starts at its own place.
- During the morph the content of the element is scaled with it, and its rounded corners
  stay round.
- The morph is a layout motion, so the layout engine must be loaded, as for any layout
  motion (see [Layout](#layout)). `await loadLayoutEngine()` (from `@udixio/motion`) preloads it.

Limits:

- The two elements do not cross-fade: the arriving element moves and scales from the other's box.
- The morph does not use the View Transitions API.
- An element that is bound more than 600 ms after the other holder went away, for example an
  island that hydrates late, does not morph.

### HTML

`data-motion` takes names separated by spaces, at most one per kind: a presence motion
(it enters and leaves), an emphasis, and a layout motion. A second name of a kind the
element already has is ignored.

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
  and `inert` until the exit ends.
- Removing `hidden` plays the entry.
- A `data-state` change on an `emphasize` motion replays it.
- An element present at connect is not animated. An element removed from the root is destroyed.
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
and returns a `MotionBinding` (`setPresent`, `play`, `destroy`, and `present` and `handle` getters):

- `present` (default `true`) is the initial presence; `settled` skips the entry of a present element.
- `setPresent(present)` runs the exit or entry and resolves to `'finished'` or `'cancelled'`.
  It never rejects; on any failure the element is left in its destination state.
- `play()` replays an `emphasize` motion. `setPresent` throws for an `emphasize`, and `play()` throws for the other verbs.
- `destroy()` cancels the motion and releases its inline state.
- `getMotion(element, kind?)` returns the binding of a kind (`'presence'`, `'emphasis'` or `'layout'`),
  or the first one when no kind is given. `getMotions(element)` returns all of them, in that order.

### Frameworks

Each framework adapter binds a motion to its element and forwards presence and
emphasis to the binding. The adapters hold no animation: the motion is still
defined and timed by `@udixio/motion`. They live in `@udixio/ui-react` (`useMotion`),
`@udixio/ui-angular` (the `Motion` directive, `udxMotion`) and `@udixio/ui-svelte`
(the `motion` attachment and the `presence` transition).

React:

```tsx
import { useMotion } from '@udixio/ui-react';

function Sheet({ open }: { open: boolean }) {
  const panel = useMotion<HTMLDivElement>('slide', { present: open });
  return panel.mounted && <div ref={panel.ref}>…</div>;
}
```

`mounted` stays true while the exit plays, so do not unmount the element yourself.
For an emphasis, pass `state`: it replays each time its value changes.

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

Hydrated server content: React treats it as already in place, so it plays no entry.
Angular and Svelte replay the entry of server-rendered content unless it is marked settled:
`udxMotionSettled` in Angular, `settled: true` in the options of the Svelte `motion` attachment.

### Presence state

The runtime writes `data-presence="entering" | "present" | "exiting"` on each bound
element; authors should not set it. Style it with Tailwind variants, for example
`data-[presence=exiting]:pointer-events-none`.

### Turning motion off, or reducing it

- `--udx-motion: none` on an element or an ancestor applies the end state without
  animating. Tailwind: `md:[--udx-motion:none]`.
- Under reduced motion (`prefers-reduced-motion: reduce`, or `<html data-motion-policy="reduce">`),
  entries and exits become a short opacity fade. An emphasis is not animated: it
  applies its end frame.

### Current limits

This is step 1a of the package, so:

- Four verbs exist: `appear`, `disappear`, `emphasize` and `layout`. `reveal`, `scrub`
  and `loop` come later.
- At the end of a motion, the end values stay inline on the element (`opacity`,
  `translate`, `scale`, `rotate`). A class that sets the same property on that element
  is overridden until the binding is destroyed.
- Preset values are not calibrated yet.

## Development

Inside the workspace, the `development` export condition resolves to the
TypeScript sources in `src/`. Build the published output with:

```sh
npx nx build @udixio/motion
```

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
This entry supplies token values and the scale; it does not apply them to animations or
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
