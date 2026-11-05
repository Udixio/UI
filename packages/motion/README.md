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
provider integration, custom easings, duration tokens, CSS property registration,
Tailwind and framework syntaxes remain future work. The API shape may change
when the shared motion model and provider contracts are designed.

### Document motion scale

Import `@udixio/motion/motion.css` once in the document stylesheet (outside
shadow roots). It registers `--udx-motion-scale` as an inherited number,
defaulting to `1` and to `0` under `prefers-reduced-motion: reduce`. A plain
`:root` declaration supplies the same values in browsers without `@property`.
The CSS is static and can be included in server-rendered HTML without JavaScript.
This entry supplies the scale only; it does not apply it to animations or
implement a motion provider or policy override.
