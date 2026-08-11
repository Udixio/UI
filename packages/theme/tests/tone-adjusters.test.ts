/**
 * Unit tests for the tone adjusters.
 *
 * The conformance and snapshot suites compare final hex values; they say a
 * theme did not move, not why a tone is what it is. These cover the steps in
 * between, one function at a time, now that each is pure and callable on its
 * own.
 */
import { Contrast } from '@material/material-color-utilities';
import { describe, expect, it } from 'vitest';

import { Color } from '../src/color/color.js';
import {
  applyToneDelta,
  arbitrateBackgrounds,
  avoidBackgroundGap,
  BACKGROUND_TONE_GAP,
  contrastAgainst,
} from '../src/color/tone-adjusters.js';

/** A neutral colour pinned at a known tone. */
const at = (tone: number) => Color.from({ hue: 0, chroma: 0, tone });

describe('contrastAgainst', () => {
  it('leaves a tone that already meets the ratio', () => {
    const white = at(100);
    // Tone 20 against white is far past 4.5:1 already.
    expect(contrastAgainst(20, white, 4.5, 0)).toBe(20);
  });

  it('pushes a tone until it meets the ratio', () => {
    const white = at(100);
    const answer = contrastAgainst(95, white, 4.5, 0);

    expect(answer).toBeLessThan(95);
    expect(Contrast.ratioOfTones(white.tone, answer)).toBeGreaterThanOrEqual(
      4.5 - 0.05,
    );
  });

  it('recomputes below contrast level 0, so the ratio can be lowered', () => {
    const white = at(100);
    // Already sufficient, but a negative level means the curve stops being a
    // floor: the tone is recomputed rather than kept.
    expect(contrastAgainst(20, white, 3, -1)).not.toBe(20);
  });

  it('works against a dark background too', () => {
    const black = at(0);
    const answer = contrastAgainst(5, black, 7, 0);

    expect(Contrast.ratioOfTones(black.tone, answer)).toBeGreaterThanOrEqual(
      7 - 0.05,
    );
  });
});

describe('avoidBackgroundGap', () => {
  const { pivot, lightFloor, darkCeiling } = BACKGROUND_TONE_GAP;

  it('pushes a tone at or above the pivot up to the light floor', () => {
    expect(avoidBackgroundGap(pivot)).toBe(lightFloor);
    expect(avoidBackgroundGap(60)).toBe(lightFloor);
  });

  it('pushes a tone below the pivot down to the dark ceiling', () => {
    expect(avoidBackgroundGap(pivot - 1)).toBe(darkCeiling);
    expect(avoidBackgroundGap(50)).toBe(darkCeiling);
  });

  it('leaves tones already outside the gap untouched', () => {
    expect(avoidBackgroundGap(90)).toBe(90);
    expect(avoidBackgroundGap(10)).toBe(10);
    expect(avoidBackgroundGap(lightFloor)).toBe(lightFloor);
    expect(avoidBackgroundGap(darkCeiling)).toBe(darkCeiling);
  });

  it('never returns a tone inside the gap', () => {
    for (let tone = 0; tone <= 100; tone += 0.5) {
      const answer = avoidBackgroundGap(tone);
      expect(answer <= darkCeiling || answer >= lightFloor).toBe(true);
    }
  });
});

describe('applyToneDelta', () => {
  const reference = at(50);

  it('pins the tone exactly, ignoring the incoming value', () => {
    const base = {
      relativeTo: reference,
      delta: 5,
      constraint: 'exact',
    } as const;

    expect(
      applyToneDelta(80, { ...base, polarity: 'darker' }, false),
    ).toBeCloseTo(45, 1);
    expect(
      applyToneDelta(10, { ...base, polarity: 'lighter' }, false),
    ).toBeCloseTo(55, 1);
  });

  it('flips relative polarities with dark mode', () => {
    const base = {
      relativeTo: reference,
      delta: 5,
      constraint: 'exact',
      polarity: 'relative_lighter',
    } as const;

    // Light mode: surfaces trend to white, so "relative lighter" adds.
    expect(applyToneDelta(0, base, false)).toBeCloseTo(55, 1);
    // Dark mode: they trend to black, so the same declaration subtracts.
    expect(applyToneDelta(0, base, true)).toBeCloseTo(45, 1);
  });

  it('only bounds the tone with `farther`, leaving it alone when far enough', () => {
    const delta = {
      relativeTo: reference,
      delta: 5,
      polarity: 'darker',
      constraint: 'farther',
    } as const;

    // 30 is already more than 5 below 50.
    expect(applyToneDelta(30, delta, false)).toBe(30);
    // 48 is not; it gets pushed to exactly 5 below.
    expect(applyToneDelta(48, delta, false)).toBeCloseTo(45, 1);
  });

  it('keeps the tone within the delta with `nearer`', () => {
    const delta = {
      relativeTo: reference,
      delta: 5,
      polarity: 'lighter',
      constraint: 'nearer',
    } as const;

    // Beyond the allowed distance, pulled back to the far edge.
    expect(applyToneDelta(90, delta, false)).toBeCloseTo(55, 1);
    // Inside the band, untouched.
    expect(applyToneDelta(52, delta, false)).toBe(52);
  });

  it('clamps to the 0-100 range', () => {
    expect(
      applyToneDelta(
        0,
        {
          relativeTo: at(2),
          delta: 20,
          polarity: 'darker',
          constraint: 'exact',
        },
        false,
      ),
    ).toBe(0);
    expect(
      applyToneDelta(
        100,
        {
          relativeTo: at(98),
          delta: 20,
          polarity: 'lighter',
          constraint: 'exact',
        },
        false,
      ),
    ).toBe(100);
  });
});

describe('arbitrateBackgrounds', () => {
  it('keeps a tone that already clears both backgrounds', () => {
    // Tone 0 against 100 and 90 clears 4.5:1 on both.
    expect(arbitrateBackgrounds(0, at(100), at(90), 4.5)).toBe(0);
  });

  it('finds a tone clearing both when the incoming one does not', () => {
    const upper = at(100);
    const lower = at(60);
    const answer = arbitrateBackgrounds(70, upper, lower, 4.5);

    expect(Contrast.ratioOfTones(upper.tone, answer)).toBeGreaterThanOrEqual(
      4.5 - 0.05,
    );
    expect(Contrast.ratioOfTones(lower.tone, answer)).toBeGreaterThanOrEqual(
      4.5 - 0.05,
    );
  });
});
