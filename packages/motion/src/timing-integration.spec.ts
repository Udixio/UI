import { describe, expect, it, vi } from 'vitest';
import { startRoutedMotion } from './timing-integration.js';
import type { MotionProvider } from './contract.js';
import type { ManifestReduced } from './manifest.js';

const handle = { backend: 'waapi', delay: 0, duration: 100, currentTime: 0, finished: Promise.resolve<'finished' | 'cancelled'>('finished'), velocity: { value: 0, source: 'unavailable' }, play() {}, pause() {}, reverse() {}, seek() {}, cancel() {} } as const;
function setup() {
  const target = { ownerDocument: {} } as HTMLElement;
  const input = { target, keyframes: [{ opacity: 0 }, { opacity: 1 }], timing: { duration: 'duration.medium1', easing: 'easing.standard' }, scheme: 'standard', verb: 'appear', policy: 'normal', scale: 0.5, delay: 20, backend: 'waapi' } as const;
  const provider = { backend: 'waapi', capabilities: new Set(), animate: vi.fn(() => handle), activeCount: () => 0 } as MotionProvider;
  return { target, input: { ...input, keyframes: input.keyframes.map(f => ({ opacity: f.opacity as number })) }, provider };
}
describe('startRoutedMotion', () => {
  it('copies frames and scales duration once', () => {
    const { input, provider, target } = setup();
    const result = startRoutedMotion(input, provider, () => 'supported');
    expect(result.status).toBe('started');
    if (result.status !== 'started') return;
    const request = vi.mocked(provider.animate).mock.calls[0][0];
    expect(request.target).toBe(target);
    expect(request.keyframes).toEqual(input.keyframes);
    expect(request.keyframes).not.toBe(input.keyframes);
    expect(request.keyframes[0]).not.toBe(input.keyframes[0]);
    expect(request.timing).toEqual({ duration: result.route.duration * 0.5, easing: result.route.easing, delay: 20 });
  });
  it('validates even when policy prevents animation', () => {
    const { input, provider } = setup();
    const evaluate = vi.fn(() => 'supported' as const);
    expect(() => startRoutedMotion({ ...input, policy: 'unknown', scale: NaN }, provider, evaluate)).toThrow();
    expect(evaluate).not.toHaveBeenCalled();
  });
  it('uses snapshots despite mutation during evaluation', () => {
    const { input, provider, target } = setup();
    const animate = provider.animate;
    const result = startRoutedMotion(input, provider, () => {
      input.keyframes[0].opacity = 0.8;
      input.keyframes.push({ opacity: 0.7 });
      Object.assign(input, { target: null, backend: 'css', policy: 'unknown' });
      provider.animate = vi.fn(() => { throw Error('mutated'); });
      return 'supported';
    });
    expect(result.status).toBe('started');
    expect(vi.mocked(animate).mock.calls[0][0]).toMatchObject({ target, keyframes: [{ opacity: 0 }, { opacity: 1 }] });
  });
  it('rejects reentrance and releases the guard after exceptions', () => {
    const { input, provider } = setup();
    const boom = new Error('boom');
    expect(() => startRoutedMotion(input, provider, () => { expect(() => startRoutedMotion(input, provider, () => 'supported')).toThrow(); throw boom; })).toThrow(boom);
    expect(startRoutedMotion(input, provider, () => 'supported').status).toBe('started');
    expect(provider.animate).toHaveBeenCalledTimes(1);
  });
});

it('returns reduced decisions for every verb without evaluating or animating', async () => {
  const { motionManifest } = await import('./manifest.js');
  const { resolveReducedRender } = await import('./reduced-render.js');
  const { input, provider } = setup();
  const evaluate = vi.fn(() => 'supported' as const);
  const takes: Record<string, readonly ManifestReduced[]> = motionManifest.spec.reducedValues;
  for (const verb of motionManifest.domains.verbs) for (const reduced of [undefined, ...(takes[verb] ?? [])]) {
    expect(startRoutedMotion({ ...input, verb, reduced, policy: 'reduced' }, provider, evaluate)).toEqual({ status: 'reduced', ...resolveReducedRender(verb, reduced) });
  }
  expect(evaluate).not.toHaveBeenCalled();
  expect(provider.animate).not.toHaveBeenCalled();
});
it('returns early for unknown policy, missing target, and zero scale', () => {
  const { input, provider } = setup();
  const evaluate = vi.fn(() => 'supported' as const);
  expect(startRoutedMotion({ ...input, target: null, policy: 'unknown' }, provider, evaluate)).toEqual({ status: 'unavailable', reason: 'policy-unknown' });
  expect(startRoutedMotion({ ...input, target: null }, provider, evaluate)).toEqual({ status: 'unavailable', reason: 'no-target' });
  expect(startRoutedMotion({ ...input, scale: 0 }, provider, evaluate)).toEqual({ status: 'instant', reason: 'zero-scale' });
  expect(evaluate).not.toHaveBeenCalled();
  expect(provider.animate).not.toHaveBeenCalled();
});
it('validates frame fields and timing before all early returns', () => {
  const { input, provider } = setup();
  const evaluate = vi.fn(() => 'supported' as const);
  for (const patch of [{ timing: 'bad' }, { scheme: 'bad' }, { verb: 'bad' }, { reduced: 'bad' }, { policy: 'bad' }, { backend: 'css' }, { keyframes: [{ opacity: Infinity }] }, { keyframes: [{ unknown: 1 }] }, { scale: -1 }, { scale: 2 }, { delay: -1 }]) {
    expect(() => startRoutedMotion({ ...input, policy: 'unknown', ...patch } as typeof input, provider, evaluate)).toThrow();
  }
  expect(evaluate).not.toHaveBeenCalled();
});
it('preserves unknown and refused sources and only falls back after refusal', () => {
  const { input, provider } = setup();
  const spring = { ...input, timing: 'spring.fast.spatial' as const };
  const unknown = vi.fn(() => 'unknown' as const);
  expect(startRoutedMotion(spring, provider, unknown)).toEqual({ status: 'unavailable', reason: 'support-unknown', source: 'linear' });
  expect(unknown).toHaveBeenCalledTimes(1);
  const refused = vi.fn(() => 'refused' as const);
  expect(startRoutedMotion(spring, provider, refused)).toEqual({ status: 'unavailable', reason: 'support-refused', source: 'fallback' });
  expect(refused).toHaveBeenCalledTimes(2);
  expect(startRoutedMotion(input, provider, refused)).toEqual({ status: 'unavailable', reason: 'support-refused', source: 'curve' });
  const fallback = vi.fn().mockReturnValueOnce('refused').mockReturnValueOnce('supported');
  const result = startRoutedMotion(spring, provider, fallback);
  expect(result.status === 'started' && result.route.source).toBe('fallback');
});
it('propagates evaluator and provider errors, and rejects a changed document', () => {
  const { input, provider, target } = setup();
  const error = new Error('failure');
  let effect = 0;
  expect(() => startRoutedMotion(input, provider, () => { effect++; throw error; })).toThrow(error);
  expect(effect).toBe(1);
  expect(provider.animate).not.toHaveBeenCalled();
  expect(() => startRoutedMotion(input, provider, () => { Object.assign(target, { ownerDocument: {} }); return 'supported'; })).toThrow('document');
  expect(provider.animate).not.toHaveBeenCalled();
  vi.mocked(provider.animate).mockImplementation(() => { throw error; });
  expect(() => startRoutedMotion(input, provider, () => 'supported')).toThrow(error);
  expect(provider.animate).toHaveBeenCalledTimes(1);
});

it('supports an SSR decision followed by a call with a target fixture', () => {
  const { input, provider } = setup();
  const evaluate = vi.fn(() => 'supported' as const);
  expect(typeof globalThis.document).toBe('undefined');
  expect(startRoutedMotion({ ...input, target: null, policy: 'unknown' }, provider, evaluate)).toEqual({ status: 'unavailable', reason: 'policy-unknown' });
  expect(evaluate).not.toHaveBeenCalled();
  expect(startRoutedMotion(input, provider, evaluate).status).toBe('started');
});
it('rejects frame accessors before evaluation', () => {
  const { input, provider } = setup();
  const evaluate = vi.fn(() => 'supported' as const);
  const frame = Object.defineProperty({}, 'opacity', { enumerable: true, get() { throw new Error('getter called'); } });
  expect(() => startRoutedMotion({ ...input, keyframes: [frame] }, provider, evaluate)).toThrow('Invalid opacity');
  expect(evaluate).not.toHaveBeenCalled();
  expect(provider.animate).not.toHaveBeenCalled();
});

it('rejects provider accessors without executing their side effects', () => {
  const { input, provider } = setup();
  const getter = vi.fn(() => { input.keyframes[0].opacity = 0.9; return 'waapi'; });
  Object.defineProperty(provider, 'backend', { get: getter });
  expect(() => startRoutedMotion(input, provider, () => 'supported')).toThrow();
  expect(getter).not.toHaveBeenCalled();
  expect(input.keyframes[0].opacity).toBe(0);
});
it('captures timing and calls the original method with the provider receiver', () => {
  const { input, provider } = setup();
  const timing = { ...input.timing };
  let receiver: unknown;
  const original = provider.animate;
  provider.animate = function(request) { receiver = this; return original.call(this, request); };
  const result = startRoutedMotion(input, provider, () => {
    Object.assign(input.timing, { duration: 'duration.long1', easing: 'easing.emphasized' });
    provider.animate = () => { throw Error('changed'); };
    return 'supported';
  });
  const baseline = setup();
  const expected = startRoutedMotion({ ...baseline.input, timing }, baseline.provider, () => 'supported');
  expect(result.status === 'started' && result.route).toEqual(expected.status === 'started' && expected.route);
  expect(receiver).toBe(provider);
});
it('rejects invalid data before every early return', () => {
  const { input, provider } = setup();
  const evaluate = vi.fn(() => 'supported' as const);
  const invalid = [{ timing: 'bad' }, { scheme: 'bad' }, { verb: 'bad' }, { reduced: 'bad' }, { policy: 'bad' }, { backend: 'bad' }, { keyframes: [{ opacity: NaN }] }, { scale: Infinity }, { scale: -1 }, { scale: 2 }, { delay: NaN }, { delay: Infinity }, { delay: -1 }];
  for (const early of [{ policy: 'reduced' }, { policy: 'unknown' }, { target: null }, { scale: 0 }]) {
    for (const patch of invalid) expect(() => startRoutedMotion({ ...input, ...early, ...patch } as typeof input, provider, evaluate)).toThrow();
  }
  expect(evaluate).not.toHaveBeenCalled();
  expect(provider.animate).not.toHaveBeenCalled();
});

it('accepts a provider with an inherited animate method', () => {
  const { input } = setup();
  class Provider {
    readonly backend = 'waapi' as const;
    readonly capabilities = new Set<never>();
    count = 0;
    activeCount() { return this.count; }
    animate() { this.count++; return handle; }
  }
  const provider = new Provider();
  expect(startRoutedMotion(input, provider, () => 'supported').status).toBe('started');
  expect(provider.count).toBe(1);
});
