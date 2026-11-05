import { expect, it } from 'vitest';
import { waapiProvider, animejsProvider } from '../providers/index.js';
import { compareSamples, f2FadeSlide, runScenario } from './index.js';

it('conforms across providers for F2', async () => {
  const a = await runScenario(waapiProvider, f2FadeSlide);
  const b = await runScenario(animejsProvider, f2FadeSlide);
  expect(compareSamples(a, b)).toEqual({ ok: true, failures: [] });
  for (const samples of [a, b]) {
    expect(samples[0].opacity).toBeCloseTo(0); expect(samples[0].y).toBeCloseTo(24);
    expect(samples[4].opacity).toBeCloseTo(1); expect(samples[4].y).toBeCloseTo(0);
  }
});

it('uses the initial style for a single keyframe', async () => {
  for (const provider of [waapiProvider, animejsProvider]) {
    const samples = await runScenario(provider, { name: 'single', family: 'test', request: { keyframes: [{ opacity: 1 }], timing: { duration: 200, easing: 'linear' } }, initialStyle: { opacity: '0.3' }, samples: [0, 1] });
    expect(samples[0].opacity).toBeCloseTo(0.3);
  }
});

it('reports differences and unequal sample counts', () => {
  const state = { opacity: 1, x: 0, y: 0, scaleX: 1, scaleY: 1, rotate: 0 };
  expect(compareSamples([state], [{ ...state, y: 2 }]).failures).toEqual(['y @ 0 : 0 vs 2']);
  expect(compareSamples([state], []).ok).toBe(false);
});
