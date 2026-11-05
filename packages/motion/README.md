# @udixio/motion

The animation runtime of the Udixio UI component library.

It is framework-agnostic: it has no React or other UI framework dependency or
peer dependency. Its only JavaScript animation engine is
[animejs](https://animejs.com) (`^4.5.0`), which consumers install alongside it.

This package is under construction. For now it exports only `RUNTIME_KEY`, the
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
uninterrupted motion, not an equivalent physical spring. The planned native
fallback uses a generated `linear()` curve; it is not implemented yet.

This is a provisional token-data foundation, not a complete F1 implementation:
provider integration, custom easings, duration tokens, generated spring curves,
Tailwind and framework syntaxes remain future work. The API shape may change
when the shared motion model and provider contracts are designed.
