/**
 * Invariants: properties the theme must hold by construction, independently of
 * any reference output.
 *
 * Where the conformance suite asks "does this equal upstream", these ask "is
 * this internally coherent". They keep their value if the fixture is ever
 * regenerated, and they cover the custom `udixio` variant, which has no
 * upstream counterpart to be measured against.
 *
 * Scoped to relations between final tones. How a tone gets there is the job of
 * the unit tests on the adjusters, see `tone-adjusters.test.ts`.
 */
import { beforeAll, describe, expect, it } from 'vitest';

import { loader } from '../src/loader/loader.js';
import { Variants } from '../src/variant/variants/index.js';
import { CONTRAST_LEVELS, MODES, SEEDS } from './helpers/grid.js';

/** Ratio slack for float and gamut rounding. */
/** A tone pinned at either end could not be pushed further; contrast is capped. */
const isSaturated = (tone: number) => tone <= 0.01 || tone >= 99.99;

const BUILD_TIMEOUT = 180_000;

const deltaFailures: string[] = [];
let deltaChecked = 0;

/** One pass over the grid feeding every invariant, since building it is the cost. */
beforeAll(async () => {
  for (const [variantKey, variant] of Object.entries(Variants)) {
    for (const isDark of MODES) {
      for (const contrastLevel of CONTRAST_LEVELS) {
        for (const sourceColor of SEEDS) {
          const api = await loader(
            { sourceColor, variant, isDark, contrastLevel },
            false,
          );
          const label = `${variantKey}|${isDark ? 'dark' : 'light'}|${contrastLevel}|${sourceColor}`;

          // ── exact tone delta pairs ─────────────────────────────────────
          for (const family of ['primary', 'secondary', 'tertiary']) {
            let fixed, dim;
            try {
              fixed = api.colors.get(`${family}Fixed`);
              dim = api.colors.get(`${family}FixedDim`);
            } catch {
              continue; // variant does not expose the fixed roles
            }
            if (isSaturated(fixed.tone) || isSaturated(dim.tone)) continue;

            deltaChecked++;
            const delta = fixed.tone - dim.tone;
            if (Math.abs(delta - 5) > 0.5) {
              deltaFailures.push(
                `${label} ${family}: delta ${delta.toFixed(2)}, expected 5`,
              );
            }
          }
        }
      }
    }
  }
}, BUILD_TIMEOUT);

describe('contrast invariants', () => {
  it('keeps *FixedDim exactly five tones below *Fixed', () => {
    // The pair is declared as ToneDeltaPair(dim, fixed, 5, 'darker', 'exact'),
    // so the constraint is part of the contract, not an observation. This is
    // the invariant a snake_case suffix check used to silently break.
    expect(deltaChecked).toBeGreaterThan(500);
    expect(deltaFailures.slice(0, 20).join('\n')).toBe('');
  });
});
