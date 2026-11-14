# Internal reduced-render resolution

`src/reduced-render.ts` resolves a verb's reduced rendering from the manifest's
per-verb defaults, or from a validated explicit `reduced` override. It returns
whether the result is subject to `--udx-motion-scale`: the `disappear` fade is
not scaled, including when explicitly selected. Other results carry the normal
scaling policy. Invalid verbs and overrides throw a `TypeError`.

This is an internal pure decision, not a public API or an animation. Nothing in
this slice applies the result to the DOM, providers, or runtime; the actual
reduced rendering and the fade exception must be implemented by future consumers.
