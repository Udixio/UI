# Theme tests

Three suites, each answering a different question.

| suite | question | a failure means |
|---|---|---|
| `spec-2025-conformance.test.ts` | does the output equal Material Design 3, spec 2025? | a bug — unless the fixture is being moved on purpose |
| `contrast-invariants.test.ts` | is the output internally coherent? | a broken contract, in any variant including `udixio` |
| `udixio-output.test.ts` | did the custom variant move? | maybe nothing — confirm it was intended, then `vitest -u` |

All three share the grid in `helpers/grid.ts`: 13 seeds × light/dark × 5 contrast
levels. The seeds cover the hue circle plus the cases the spec special-cases
(yellow on both sides of its breakpoint, cyan, an achromatic colour, both tone
extremes). The full run takes about 30 seconds.

## Why the conformance fixture exists

`@udixio/theme` reimplements material-color-utilities rather than wrapping it,
because the published package did not expose what this one needs. That buys
control and costs a guarantee: nothing keeps the reimplementation aligned with
the spec it claims to follow.

The fixture is that guarantee. Four bugs found in August 2026 were invisible on
review — the code read like spec 2025 while computing spec 2021 values — and
every one of them would have failed this suite immediately.

Note the deliberate gaps in `contrast-invariants.test.ts`: the declared contrast
ratio is only a floor for roles solved from contrast alone, at contrast level 0
and above. Roles carrying a tone delta pair are resolved by the pair first, and
the T57-65 clamp runs afterwards and can undo the correction. Upstream behaves
the same way, so those are spec, not defects.

## Regenerating `fixtures/material-spec-2025.json`

Only needed when deliberately targeting a newer upstream. It is generated
output — do not hand-edit it.

1. Check out material-color-utilities at the commit recorded in the fixture's
   `_meta.commit` field, or at the newer one you are moving to.
2. For each case of the grid in `helpers/grid.ts`, build the matching upstream
   scheme — `SchemeTonalSpot`, `SchemeVibrant`, `SchemeExpressive`,
   `SchemeNeutral` — passing `'2025'` as the fourth constructor argument.
   **Passing nothing yields spec 2021**, whose output differs from 2025 on
   about 90% of values.
3. Resolve every role through `MaterialDynamicColors`, keyed by this package's
   camelCase role names, and record `hexFromArgb(role.getArgb(scheme))` plus
   each palette's `(hue, chroma)`.
4. Write `{ _meta, cases }`, updating `_meta.commit`.

Moving the fixture forward is a deliberate act: it changes what the package
promises. Pair it with a changelog entry.
