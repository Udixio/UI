/**
 * Unit tests for the tone adjusters.
 *
 * The conformance and snapshot suites compare final hex values; they say a
 * theme did not move, not why a tone is what it is. These cover the steps in
 * between, one at a time.
 *
 * Each adjuster is a factory: it takes what it needs to know, and returns a
 * function of `API & { tone }`. So the tests build both — the factory with its
 * arguments, then a minimal API to run it against.
 */
import { Contrast } from '@material/material-color-utilities';
import { describe, expect, it } from 'vitest';

import { Color } from '../src/color/color.js';
import {
  applyToneDelta,
  arbitrateBackgrounds,
  avoidBackgroundGap,
  BACKGROUND_TONE_GAP,
  backgroundGapTone,
  contrastAgainst,
  contrastTone,
  onColor,
  type ToneAdjuster,
} from '../src/color/tone-adjusters.js';
import type { API } from '../src/API.js';

/** A neutral colour pinned at a known tone. */
const at = (tone: number) => Color.from({ hue: 0, chroma: 0, tone });

/** Only what the adjusters actually reach for. */
const stub = (
  options: {
    contrastLevel?: number;
    isDark?: boolean;
    colors?: Record<string, Color>;
  } = {},
) =>
  ({
    context: {
      contrastLevel: options.contrastLevel ?? 0,
      isDark: options.isDark ?? false,
    },
    colors: { get: (key: string) => options.colors?.[key] },
  }) as unknown as API;

/** Runs an adjuster on a tone. */
const run = (adjuster: ToneAdjuster, tone: number, api: API = stub()): number =>
  adjuster({ ...api, tone } as API & { tone: number });

describe('contrastTone', () => {
  it('leaves a tone that already meets the ratio', () => {
    // Tone 20 against white is far past 4.5:1 already.
    expect(contrastTone(20, at(100), 4.5, stub())).toBe(20);
  });

  it('pushes a tone until it meets the ratio', () => {
    const white = at(100);
    const answer = contrastTone(95, white, 4.5, stub());

    expect(answer).toBeLessThan(95);
    expect(Contrast.ratioOfTones(white.tone, answer)).toBeGreaterThanOrEqual(
      4.5 - 0.05,
    );
  });

  it('recomputes below contrast level 0, so the ratio can be lowered', () => {
    // Already sufficient, but a negative level means the curve stops being a
    // floor: the tone is recomputed rather than kept.
    expect(contrastTone(20, at(100), 3, stub({ contrastLevel: -1 }))).not.toBe(
      20,
    );
  });

  it('leaves the tone alone when the contrast resolves to undefined', () => {
    expect(contrastTone(33, at(100), () => undefined, stub())).toBe(33);
  });

  it('works against a dark background too', () => {
    const black = at(0);
    const answer = contrastTone(5, black, 7, stub());

    expect(Contrast.ratioOfTones(black.tone, answer)).toBeGreaterThanOrEqual(
      7 - 0.05,
    );
  });
});

describe('contrastAgainst', () => {
  it('resolves its background by key against the registry', () => {
    const api = stub({ colors: { surface: at(100) } });
    const answer = run(contrastAgainst('surface', 4.5), 95, api);

    expect(Contrast.ratioOfTones(100, answer)).toBeGreaterThanOrEqual(
      4.5 - 0.05,
    );
  });
});

describe('onColor', () => {
  it('ignores the incoming tone and starts from the background', () => {
    const api = stub({ colors: { primary: at(40) } });
    // 99 is deliberately absurd: onColor must not use it.
    const answer = run(onColor('primary', 6), 99, api);

    expect(Contrast.ratioOfTones(40, answer)).toBeGreaterThanOrEqual(6 - 0.05);
  });
});

describe('backgroundGapTone', () => {
  const { pivot, lightFloor, darkCeiling } = BACKGROUND_TONE_GAP;

  it('pushes a tone at or above the pivot up to the light floor', () => {
    expect(backgroundGapTone(pivot)).toBe(lightFloor);
    expect(backgroundGapTone(60)).toBe(lightFloor);
  });

  it('pushes a tone below the pivot down to the dark ceiling', () => {
    expect(backgroundGapTone(pivot - 1)).toBe(darkCeiling);
    expect(backgroundGapTone(50)).toBe(darkCeiling);
  });

  it('leaves tones already outside the gap untouched', () => {
    expect(backgroundGapTone(90)).toBe(90);
    expect(backgroundGapTone(10)).toBe(10);
    expect(backgroundGapTone(lightFloor)).toBe(lightFloor);
    expect(backgroundGapTone(darkCeiling)).toBe(darkCeiling);
  });

  it('never returns a tone inside the gap', () => {
    for (let tone = 0; tone <= 100; tone += 0.5) {
      const answer = backgroundGapTone(tone);
      expect(answer <= darkCeiling || answer >= lightFloor).toBe(true);
    }
  });

  it('is what the adjuster applies', () => {
    expect(run(avoidBackgroundGap(), 60)).toBe(backgroundGapTone(60));
  });
});

describe('applyToneDelta', () => {
  const api = stub({ colors: { ref: at(50) } });
  const dark = stub({ colors: { ref: at(50) }, isDark: true });

  it('pins the tone exactly, ignoring the incoming value', () => {
    const base = { relativeTo: 'ref', delta: 5, constraint: 'exact' } as const;

    expect(
      run(applyToneDelta({ ...base, polarity: 'darker' }), 80, api),
    ).toBeCloseTo(45, 1);
    expect(
      run(applyToneDelta({ ...base, polarity: 'lighter' }), 10, api),
    ).toBeCloseTo(55, 1);
  });

  it('flips relative polarities with dark mode', () => {
    const delta = applyToneDelta({
      relativeTo: 'ref',
      delta: 5,
      constraint: 'exact',
      polarity: 'relativeLighter',
    });

    // Light mode: surfaces trend to white, so "relative lighter" adds.
    expect(run(delta, 0, api)).toBeCloseTo(55, 1);
    // Dark mode: they trend to black, so the same declaration subtracts.
    expect(run(delta, 0, dark)).toBeCloseTo(45, 1);
  });

  it('only bounds the tone with `farther`, leaving it alone when far enough', () => {
    const delta = applyToneDelta({
      relativeTo: 'ref',
      delta: 5,
      polarity: 'darker',
      constraint: 'farther',
    });

    // 30 is already more than 5 below 50.
    expect(run(delta, 30, api)).toBe(30);
    // 48 is not; it gets pushed to exactly 5 below.
    expect(run(delta, 48, api)).toBeCloseTo(45, 1);
  });

  it('keeps the tone within the delta with `nearer`', () => {
    const delta = applyToneDelta({
      relativeTo: 'ref',
      delta: 5,
      polarity: 'lighter',
      constraint: 'nearer',
    });

    // Beyond the allowed distance, pulled back to the far edge.
    expect(run(delta, 90, api)).toBeCloseTo(55, 1);
    // Inside the band, untouched.
    expect(run(delta, 52, api)).toBe(52);
  });

  it('clamps to the 0-100 range', () => {
    const low = applyToneDelta({
      relativeTo: at(2),
      delta: 20,
      polarity: 'darker',
      constraint: 'exact',
    });
    const high = applyToneDelta({
      relativeTo: at(98),
      delta: 20,
      polarity: 'lighter',
      constraint: 'exact',
    });

    expect(run(low, 0)).toBe(0);
    expect(run(high, 100)).toBe(100);
  });
});

describe('arbitrateBackgrounds', () => {
  it('keeps a tone that already clears both backgrounds', () => {
    // Tone 0 against 100 and 90 clears 4.5:1 on both.
    expect(run(arbitrateBackgrounds(at(100), at(90), 4.5), 0)).toBe(0);
  });

  it('finds a tone clearing both when the incoming one does not', () => {
    const upper = at(100);
    const lower = at(60);
    const answer = run(arbitrateBackgrounds(upper, lower, 4.5), 70);

    expect(Contrast.ratioOfTones(upper.tone, answer)).toBeGreaterThanOrEqual(
      4.5 - 0.05,
    );
    expect(Contrast.ratioOfTones(lower.tone, answer)).toBeGreaterThanOrEqual(
      4.5 - 0.05,
    );
  });
});
