import { describe, expect, it } from 'vitest';
import { defineTokens, resolveCurve } from './tokens.js';
import type { CurveTiming } from './tokens.js';
import { routeTiming } from './timing-routing.js';

const refs = ['spring.fast.spatial', 'spring.fast.effects', 'spring.default.spatial', 'spring.default.effects', 'spring.slow.spatial', 'spring.slow.effects'] as const;
const states = ['supported', 'refused', 'unknown'] as const;
describe('routeTiming', () => {
  it('selects complete spring pairs for every backend and support combination', () => {
    for (const ref of refs) for (const scheme of ['expressive', 'standard'] as const) for (const backend of ['css', 'waapi', 'animejs'] as const) for (const linear of states) for (const fallback of states) {
      const [, speed, role] = ref.split('.') as ['spring', 'fast' | 'default' | 'slow', 'spatial' | 'effects'];
      const token = defineTokens({ scheme }).spring[speed][role];
      const result = routeTiming(ref, { scheme, backend, support: { linear, fallback } });
      if (backend !== 'animejs' && linear === 'supported') expect(result).toEqual({ status: 'resolved', backend, ...token.linear, source: 'linear' });
      else if (backend !== 'animejs' && linear === 'unknown') expect(result).toEqual({ status: 'unknown', backend, source: 'linear' });
      else if (fallback === 'supported') expect(result).toEqual({ status: 'resolved', backend, ...token.fallback, source: 'fallback' });
      else expect(result).toEqual({ status: fallback, backend, source: 'fallback' });
    }
  });
  it('routes every explicit curve only when its exact representation is supported', () => {
    const tokens = defineTokens();
    for (const duration of Object.keys(tokens.duration)) for (const easing of Object.keys(tokens.easing)) for (const backend of ['css', 'waapi', 'animejs'] as const) for (const support of states) {
      const timing = { duration: `duration.${duration}`, easing: `easing.${easing}` } as CurveTiming;
      const result = routeTiming(timing, { scheme: 'standard', backend, support: { curve: support } });
      if (support === 'supported') expect(result).toEqual({ status: 'resolved', backend, ...resolveCurve(timing), source: 'curve' });
      else expect(result).toEqual({ status: support, backend, source: 'curve' });
    }
  });
  it('rejects invalid inputs without evaluating curve getters', () => {
    let read = false;
    const timing = { get duration() { read = true; return 'duration.short1'; }, easing: 'easing.linear' };
    expect(() => routeTiming(timing as CurveTiming, { scheme: 'standard', backend: 'css', support: { curve: 'supported' } })).toThrow();
    expect(read).toBe(false);
    const call = routeTiming as unknown as (timing: unknown, options: unknown) => unknown;
    for (const [ref, options] of [
      ['spring.invalid', { scheme: 'standard', backend: 'css', support: { linear: 'supported', fallback: 'refused' } }],
      [refs[0], { scheme: 'bad', backend: 'css', support: { linear: 'supported', fallback: 'refused' } }],
      [refs[0], { scheme: 'standard', backend: 'bad', support: { linear: 'supported', fallback: 'refused' } }],
      [refs[0], { scheme: 'standard', backend: 'css', support: { linear: 'unknown' } }],
      [{ duration: 'duration.bad', easing: 'easing.linear' }, { scheme: 'standard', backend: 'css', support: { curve: 'supported' } }],
    ]) expect(() => call(ref, options)).toThrow();
  });
});

it('accepts dynamically selected correlated timing arguments', () => {
  const springArgs = ['spring.fast.spatial', { scheme: 'standard', backend: 'css', support: { linear: 'supported', fallback: 'refused' } }] as const;
  const curveArgs = [{ duration: 'duration.short1', easing: 'easing.linear' }, { scheme: 'standard', backend: 'css', support: { curve: 'supported' } }] as const;
  for (const args of [springArgs, curveArgs]) expect(routeTiming(...args).status).toBe('resolved');
  if (false) {
    // @ts-expect-error A spring requires spring support flags.
    routeTiming(springArgs[0], curveArgs[1]);
    // @ts-expect-error A curve requires its own support flag.
    routeTiming(curveArgs[0], springArgs[1]);
  }
});

it('evaluates the exact candidate in priority order for the selected backend', async () => {
  const { routeTimingWithEvaluator } = await import('./timing-routing.js');
  const seen: Array<{ backend: string; easing: string }> = [];
  const result = routeTimingWithEvaluator('spring.fast.spatial', { scheme: 'standard', backend: 'waapi' }, candidate => {
    seen.push(candidate);
    return seen.length === 1 ? 'refused' : 'supported';
  });
  const pair = defineTokens({ scheme: 'standard' }).spring.fast.spatial;
  expect(seen).toEqual([{ backend: 'waapi', easing: pair.linear.easing }, { backend: 'waapi', easing: pair.fallback.easing }]);
  expect(result).toEqual({ status: 'resolved', backend: 'waapi', ...pair.fallback, source: 'fallback' });
});

it('does not evaluate a fallback while the preferred semantic support is unknown', async () => {
  const { routeTimingWithEvaluator } = await import('./timing-routing.js');
  let calls = 0;
  const result = routeTimingWithEvaluator('spring.fast.spatial', { scheme: 'standard', backend: 'waapi' }, () => { calls++; return 'unknown'; });
  expect(result).toEqual({ status: 'unknown', backend: 'waapi', source: 'linear' });
  expect(calls).toBe(1);
});

it('evaluates only the official fallback for animejs and the exact explicit curve', async () => {
  const { routeTimingWithEvaluator } = await import('./timing-routing.js');
  const seen: string[] = [];
  const evaluate = ({ easing }: { easing: string }) => { seen.push(easing); return 'supported' as const; };
  const spring = routeTimingWithEvaluator('spring.fast.spatial', { scheme: 'standard', backend: 'animejs' }, evaluate);
  const curve = routeTimingWithEvaluator({ duration: 'duration.short1', easing: 'easing.linear' }, { scheme: 'standard', backend: 'animejs' }, evaluate);
  expect(spring.status === 'resolved' && spring.source).toBe('fallback');
  expect(seen).toEqual([defineTokens({ scheme: 'standard' }).spring.fast.spatial.fallback.easing, 'linear']);
  expect(curve.status === 'resolved' && curve.easing).toBe('linear');
});

it('rejects invalid timing before evaluating support and rejects invalid evaluator results', async () => {
  const { routeTimingWithEvaluator } = await import('./timing-routing.js');
  let calls = 0;
  expect(() => routeTimingWithEvaluator('spring.invalid' as never, { scheme: 'standard', backend: 'waapi' }, () => { calls++; return 'supported'; })).toThrow();
  expect(calls).toBe(0);
  expect(() => routeTimingWithEvaluator('spring.fast.spatial', { scheme: 'standard', backend: 'waapi' }, () => 'accepted' as never)).toThrow();
});

it('returns the curve evaluated even when the callback mutates the input', async () => {
  const { routeTimingWithEvaluator } = await import('./timing-routing.js');
  const timing: CurveTiming = { duration: 'duration.short1', easing: 'easing.linear' };
  const expected = resolveCurve(timing);
  const result = routeTimingWithEvaluator(timing, { scheme: 'standard', backend: 'waapi' }, candidate => {
    expect(candidate.easing).toBe(expected.easing);
    timing.duration = 'duration.long1';
    timing.easing = 'easing.standard';
    return 'supported';
  });
  expect(result).toEqual({ status: 'resolved', backend: 'waapi', ...expected, source: 'curve' });
});

it('reads each curve input descriptor once despite callback execution', async () => {
  const { routeTimingWithEvaluator } = await import('./timing-routing.js');
  const reads: string[] = [];
  const timing = new Proxy({ duration: 'duration.short1', easing: 'easing.linear' } as CurveTiming, {
    getOwnPropertyDescriptor(target, key) { reads.push(String(key)); return Reflect.getOwnPropertyDescriptor(target, key); },
  });
  routeTimingWithEvaluator(timing, { scheme: 'standard', backend: 'css' }, () => 'supported');
  expect(reads).toEqual(['duration', 'easing']);
});
