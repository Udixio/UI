# Internal reduced-render resolution

`src/reduced-render.ts` resolves a verb's reduced rendering from the manifest's
per-verb defaults, or from a validated explicit `reduced` override. It returns
whether the result is subject to `--udx-motion-scale`: a `fade` is never scaled,
whatever the verb and whether the fade is a default or an explicit override.
Other results carry the normal scaling policy. Invalid verbs and overrides throw
a `TypeError`.

This is an internal pure decision, not a public API or an animation. `playMotion`
(`src/play.ts`) applies it: a reduced fade plays at scale 1 because
`--udx-motion-scale` is 0 under reduced motion, which would otherwise make the
fade instant.
