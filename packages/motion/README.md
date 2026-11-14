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
implement a motion provider or integrate the internal policy reader into a runtime.

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
