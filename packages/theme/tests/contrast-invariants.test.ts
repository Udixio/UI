/**
 * Invariants: properties the theme must hold by construction, independently of
 * any reference output.
 *
 * Where the conformance suite asks "does this equal upstream", these ask "is
 * this internally coherent". They keep their value if the fixture is ever
 * regenerated, and they cover the custom `udixio` variant, which has no
 * upstream counterpart to be measured against.
 */
import { Contrast } from '@material/material-color-utilities';
import { beforeAll, describe, expect, it } from 'vitest';

import { ColorFromPalette } from '../src/color/color.js';
import { loader } from '../src/loader/loader.js';
import { Variants } from '../src/variant/variants/index.js';
import { CONTRAST_LEVELS, MODES, SEEDS } from './helpers/grid.js';

/** Ratio slack for float and gamut rounding. */
const EPSILON = 0.05;

/** A tone pinned at either end could not be pushed further; contrast is capped. */
const isSaturated = (tone: number) => tone <= 0.01 || tone >= 99.99;

const BUILD_TIMEOUT = 180_000;

const contrastFailures: string[] = [];
const deltaFailures: string[] = [];
let contrastChecked = 0;
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

          // ── declared contrast ratio ────────────────────────────────────
          // Scoped to what the resolver actually guarantees:
          //  - from contrast level 0 upwards, since below zero the curve
          //    stops acting as a floor;
          //  - on roles solved from contrast alone. A role carrying a tone
          //    delta pair is resolved by the pair first, and the T57-65 clamp
          //    runs after the contrast correction and can undo it. Upstream
          //    behaves identically, so a shortfall there is spec, not defect.
          // In practice this still covers every `on*` foreground role, which
          // is where the accessibility guarantee actually matters.
          if (contrastLevel >= 0) {
            for (const [name, color] of api.colors.getAll()) {
              if (!(color instanceof ColorFromPalette)) continue;
              const { background, contrastCurve, adjustTone } = color.options;
              if (!background || !contrastCurve) continue;
              if (adjustTone) continue;
              if (isSaturated(color.tone)) continue;

              const required = contrastCurve.get(contrastLevel);
              const actual = Contrast.ratioOfTones(background.tone, color.tone);
              contrastChecked++;
              if (actual < required - EPSILON) {
                contrastFailures.push(
                  `${label} ${name}: needs ${required}, got ${actual.toFixed(2)}`,
                );
              }
            }
          }

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
  it('meets the contrast ratio each role declares against its background', () => {
    expect(contrastChecked).toBeGreaterThan(5_000);
    expect(contrastFailures.slice(0, 20).join('\n')).toBe('');
  });

  it('keeps *FixedDim exactly five tones below *Fixed', () => {
    // The pair is declared as ToneDeltaPair(dim, fixed, 5, 'darker', 'exact'),
    // so the constraint is part of the contract, not an observation. This is
    // the invariant a snake_case suffix check used to silently break.
    expect(deltaChecked).toBeGreaterThan(500);
    expect(deltaFailures.slice(0, 20).join('\n')).toBe('');
  });
});
