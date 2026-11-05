# @udixio/motion

The animation runtime of the Udixio UI component library.

It is framework-agnostic: it has no React or other UI framework dependency or
peer dependency. Its only JavaScript animation engine is
[animejs](https://animejs.com) (`^4.5.0`), which consumers install alongside it.

This package is under construction. It exports `defineTokens` and `RUNTIME_KEY`, the
`Symbol.for('udixio.motion@1')` key under which the per-page runtime is shared
through `globalThis`.

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
provider integration, custom easings, duration tokens, additional CSS property
registration, Tailwind and framework syntaxes remain future work. The API shape may change
when the shared motion model and provider contracts are designed.

### Experimental distance and stagger tokens

`defineTokens()` exposes `distance.sm`, `distance.md`, and `distance.lg`
(8, 24, and 64 CSS pixels), and `stagger.tight`, `stagger.normal`,
`stagger.loose`, and `stagger.max` (20, 50, 100, and 400 milliseconds).
These values are provisional, have low confidence, and require visual calibration;
they do not come from M3. The stylesheet exposes the same values as inherited
`--udx-motion-distance-{sm,md,lg}` and
`--udx-motion-stagger-{tight,normal,loose,max}` custom properties. They may
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
The complete declarative `MotionSpec` is not exported yet: the domains of curve
tokens, scroll ranges, and shared keys remain unspecified, and the
stagger vocabulary is provisional. These types do not add a runtime API or
implement the defaults in the motion design specification.
