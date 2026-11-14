import { expect, it } from 'vitest';
import { waapiProvider, animejsProvider } from '../providers/index.js';
import { cssProvider } from '../providers/css.js';
import { compareSamples, f2FadeSlide, runScenario, TOLERANCES } from './index.js';

it('conforms across providers for F2', async () => {
  const a = await runScenario(waapiProvider, f2FadeSlide);
  const b = await runScenario(animejsProvider, f2FadeSlide);
  expect(compareSamples(a, b)).toEqual({ ok: true, failures: [] });
  for (const samples of [a, b]) {
    expect(samples[0].opacity).toBeCloseTo(0); expect(samples[0].y).toBeCloseTo(24);
    expect(samples[4].opacity).toBeCloseTo(1); expect(samples[4].y).toBeCloseTo(0);
  }
});

it('compares the experimental CSS provider with animejs for F2', async () => {
  const css = await runScenario(cssProvider, f2FadeSlide);
  const anime = await runScenario(animejsProvider, f2FadeSlide);
  expect(compareSamples(css, anime)).toEqual({ ok: true, failures: [] });
  // Independently computed by bisecting the Bézier x polynomial for each
  // progress value, then evaluating y; translation is 24 * (1 - y).
  const expected = [
    [0, 24], [0.5871299265, 9.9088817639], [0.9053371781, 2.2719077250],
    [0.9859636903, 0.3368714328], [1, 0],
  ];
  for (const samples of [css, anime]) {
    expect(samples[0].opacity).toBeCloseTo(0); expect(samples[0].y).toBeCloseTo(24);
    expect(samples[4].opacity).toBeCloseTo(1); expect(samples[4].y).toBeCloseTo(0);
    expect(samples).toHaveLength(expected.length);
    expected.forEach(([opacity, y], index) => {
      expect(Math.abs(samples[index].opacity - opacity)).toBeLessThanOrEqual(TOLERANCES.opacity);
      expect(Math.abs(samples[index].y - y)).toBeLessThanOrEqual(TOLERANCES.length);
    });
  }
});

it('uses the initial style for a single keyframe', async () => {
  for (const provider of [waapiProvider, animejsProvider]) {
    const samples = await runScenario(provider, { name: 'single', family: 'test', request: { keyframes: [{ opacity: 1 }], timing: { duration: 200, easing: 'linear' } }, initialStyle: { opacity: '0.3' }, samples: [0, 1] });
    expect(samples[0].opacity).toBeCloseTo(0.3);
  }
});

it('samples active animation progress after a positive delay', async () => {
  for (const provider of [waapiProvider, animejsProvider]) {
    const samples = await runScenario(provider, { name: 'delay', family: 'test', request: { keyframes: [{ opacity: 0 }, { opacity: 1 }], timing: { duration: 200, delay: 100, easing: 'linear' } }, samples: [0, 0.5, 1] });
    expect(samples[0].opacity).toBeCloseTo(0, 2);
    expect(samples[1].opacity).toBeCloseTo(0.5, 2);
    expect(samples[2].opacity).toBeCloseTo(1, 2);
  }
});

it('reports differences and unequal sample counts', () => {
  const state = { opacity: 1, x: 0, y: 0, scaleX: 1, scaleY: 1, rotate: 0 };
  expect(compareSamples([state], [{ ...state, y: 2 }]).failures).toEqual(['y @ 0 : 0 vs 2']);
  expect(compareSamples([state], []).ok).toBe(false);
});
