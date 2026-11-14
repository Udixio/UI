import { afterEach, describe, expect, it, vi } from 'vitest';
import { getMotionRuntime } from './runtime.js';
import { RUNTIME_KEY } from './runtime-key.js';

afterEach(() => {
  delete (globalThis as Record<symbol, unknown>)[RUNTIME_KEY];
  delete (globalThis as Record<symbol, unknown>)[Symbol.for('udixio.motion.frame-runtime.preview')];
  delete (globalThis as Record<symbol, unknown>)[Symbol.for('udixio.motion.frame-runtime.preview.2')];
  delete (globalThis as Record<symbol, unknown>)[Symbol.for('udixio.motion.frame-runtime.preview.3')];
  delete (globalThis as Record<symbol, unknown>)[Symbol.for('udixio.motion.frame-runtime.preview.4')];
  delete (globalThis as Record<symbol, unknown>)[Symbol.for('udixio.motion.frame-runtime.preview.5')];
  delete (globalThis as Record<symbol, unknown>)[Symbol.for('udixio.motion.frame-runtime.preview.6')];
  vi.unstubAllGlobals();
});

describe('motion runtime', () => {
  it('does not install shared process state during SSR', () => {
    const first = getMotionRuntime({ development: false });
    expect(getMotionRuntime({ development: false })).not.toBe(first);
    expect((globalThis as Record<symbol, unknown>)[RUNTIME_KEY]).toBeUndefined();
    expect(() => first.frame.read(() => {})).not.toThrow();
    first.retain();
    expect(first.policy.reduced).toBe(false);
    expect(first.shared.resolve('server')).toBeUndefined();
    first.release();
  });

  it('shares a versioned runtime and cleans pending work after the last release', () => {
    const callbacks = new Map<number, FrameRequestCallback>();
    let id = 0;
    vi.stubGlobal('window', globalThis);
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { callbacks.set(++id, cb); return id; });
    vi.stubGlobal('cancelAnimationFrame', (handle: number) => callbacks.delete(handle));
    const first = getMotionRuntime({ development: false });
    const second = getMotionRuntime({ development: false });
    expect(second).toBe(first);
    expect(first.version).toBe('1');
    first.retain(); second.retain();
    const work = vi.fn();
    first.frame.read(work);
    first.release();
    expect(callbacks.size).toBe(1);
    second.release();
    expect(callbacks.size).toBe(0);
    first.retain();
    first.frame.write(work);
    const callback = [...callbacks.values()][0];
    callbacks.clear(); callback(0);
    expect(work).toHaveBeenCalledTimes(1);
    first.release();
  });
  it('defers reads and writes queued during their own phases and stops when empty', () => {
    const callbacks = new Map<number, FrameRequestCallback>();
    let id = 0;
    vi.stubGlobal('window', globalThis);
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { callbacks.set(++id, cb); return id; });
    vi.stubGlobal('cancelAnimationFrame', (handle: number) => callbacks.delete(handle));
    const runtime = getMotionRuntime({ development: false });
    runtime.retain();
    const order: string[] = [];
    runtime.frame.read(() => {
      order.push('read');
      runtime.frame.read(() => order.push('next read'));
    });
    runtime.frame.write(() => {
      order.push('write');
      runtime.frame.write(() => order.push('next write'));
    });
    expect(callbacks.size).toBe(1);
    const tick = () => { const callback = [...callbacks.values()][0]; callbacks.clear(); callback(0); };
    tick();
    expect(order).toEqual(['read', 'write']);
    expect(callbacks.size).toBe(1);
    tick();
    expect(order).toEqual(['read', 'write', 'next read', 'next write']);
    expect(callbacks.size).toBe(0);
    runtime.release();
  });

  it('does not publish the incomplete runtime under the stable v1 key', () => {
    vi.stubGlobal('window', globalThis);
    getMotionRuntime({ development: false });
    expect((globalThis as Record<symbol, unknown>)[RUNTIME_KEY]).toBeUndefined();
  });

  it('does not reuse an older preview runtime lacking subscriptions', () => {
    vi.stubGlobal('window', globalThis);
    const host = globalThis as Record<symbol, unknown>;
    const oldKey = Symbol.for('udixio.motion.frame-runtime.preview');
    const oldRuntime = { version: '1', frame: {} };
    host[oldKey] = oldRuntime;
    const previous = { version: '1', frame: {}, subscribe() {} };
    host[Symbol.for('udixio.motion.frame-runtime.preview.2')] = previous;
    const previousIntegrated = { version: '1', policy: {}, shared: {} };
    host[Symbol.for('udixio.motion.frame-runtime.preview.3')] = previousIntegrated;
    const previousFrame = { version: '1', subscribe() {} };
    host[Symbol.for('udixio.motion.frame-runtime.preview.4')] = previousFrame;
    const runtime = getMotionRuntime({ development: false });
    expect(runtime).not.toBe(oldRuntime);
    expect(typeof runtime.subscribe).toBe('function');
    expect(host[oldKey]).toBe(oldRuntime);
    expect(host[Symbol.for('udixio.motion.frame-runtime.preview.2')]).toBe(previous);
    expect(host[Symbol.for('udixio.motion.frame-runtime.preview.3')]).toBe(previousIntegrated);
    expect(host[Symbol.for('udixio.motion.frame-runtime.preview.4')]).toBe(previousFrame);
    expect(host[Symbol.for('udixio.motion.frame-runtime.preview.6')]).toBe(runtime);
    expect(host[RUNTIME_KEY]).toBeUndefined();
  });

  it('continues both phases after callback errors and reports each error', () => {
    let frame!: FrameRequestCallback;
    vi.stubGlobal('window', globalThis);
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { frame = cb; return 1; });
    const report = vi.fn();
    vi.stubGlobal('reportError', report);
    const runtime = getMotionRuntime({ development: false });
    runtime.retain();
    const first = new Error('read');
    const second = new Error('write');
    const order: string[] = [];
    runtime.frame.read(() => { throw first; });
    runtime.frame.read(() => order.push('read'));
    runtime.frame.write(() => { throw second; });
    runtime.frame.write(() => order.push('write'));
    frame(0);
    expect(order).toEqual(['read', 'write']);
    expect(report.mock.calls.map(([error]) => error)).toEqual([first, second]);
    runtime.release();
  });

  it('keeps new work queued after release and retain during a read', () => {
    const callbacks = new Map<number, FrameRequestCallback>();
    let id = 0;
    vi.stubGlobal('window', globalThis);
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { callbacks.set(++id, cb); return id; });
    vi.stubGlobal('cancelAnimationFrame', (handle: number) => callbacks.delete(handle));
    const runtime = getMotionRuntime({ development: false });
    runtime.retain();
    const order: string[] = [];
    runtime.frame.read(() => {
      runtime.release();
      runtime.retain();
      runtime.frame.write(() => order.push('new write'));
    });
    runtime.frame.write(() => order.push('old write'));
    const tick = () => { const cb = [...callbacks.values()][0]; callbacks.clear(); cb(0); };
    tick();
    expect(order).toEqual([]);
    expect(callbacks.size).toBe(1);
    tick();
    expect(order).toEqual(['new write']);
    runtime.release();
  });

});

describe('preview runtime ownership', () => {
  it('keeps another owner active when a lease is released twice and ignores work at zero', async () => {
    const { retainMotionRuntime } = await import('./runtime.js');
    const callbacks = new Map<number, FrameRequestCallback>();
    let id = 0;
    vi.stubGlobal('window', globalThis);
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { callbacks.set(++id, cb); return id; });
    vi.stubGlobal('cancelAnimationFrame', (handle: number) => callbacks.delete(handle));
    const runtime = getMotionRuntime({ development: false });
    const endFirst = retainMotionRuntime(runtime);
    const endSecond = retainMotionRuntime(runtime);
    endFirst(); endFirst();
    const work = vi.fn();
    runtime.frame.read(work);
    expect(callbacks.size).toBe(1);
    endSecond();
    expect(callbacks.size).toBe(0);
    runtime.frame.read(work);
    runtime.frame.write(work);
    expect(callbacks.size).toBe(0);
    const endThird = retainMotionRuntime(runtime);
    expect(callbacks.size).toBe(0);
    endThird();
  });

  it('ignores server frame requests even with a global raf polyfill', () => {
    const raf = vi.fn();
    vi.stubGlobal('requestAnimationFrame', raf);
    const runtime = getMotionRuntime({ development: false });
    runtime.retain();
    runtime.frame.read(vi.fn());
    runtime.frame.write(vi.fn());
    expect(raf).not.toHaveBeenCalled();
    runtime.release();
  });

  it('isolates a throwing reporter and preserves the original and reporter errors', () => {
    let frame!: FrameRequestCallback;
    const deferred: Array<() => void> = [];
    vi.stubGlobal('window', globalThis);
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { frame = cb; return 1; });
    vi.stubGlobal('setTimeout', (cb: () => void) => { deferred.push(cb); return 1; });
    const reportFailure = new Error('report');
    vi.stubGlobal('reportError', () => { throw reportFailure; });
    const runtime = getMotionRuntime({ development: false });
    runtime.retain();
    const original = new Error('original');
    const work = vi.fn();
    runtime.frame.read(() => { throw original; });
    runtime.frame.write(work);
    frame(0);
    expect(work).toHaveBeenCalledOnce();
    expect(deferred).toHaveLength(2);
    expect(deferred[0]).toThrow(original);
    expect(deferred[1]).toThrow(reportFailure);
    runtime.release();
  });

  it('ignores a captured frame from a previous generation after reactivation', () => {
    const callbacks: FrameRequestCallback[] = [];
    vi.stubGlobal('window', globalThis);
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { callbacks.push(cb); return callbacks.length; });
    vi.stubGlobal('cancelAnimationFrame', () => {});
    const runtime = getMotionRuntime({ development: false });
    runtime.retain();
    runtime.frame.read(vi.fn());
    runtime.release();
    runtime.retain();
    const work = vi.fn();
    runtime.frame.read(work);
    callbacks[0](0);
    expect(work).not.toHaveBeenCalled();
    callbacks[1](1);
    expect(work).toHaveBeenCalledOnce();
    runtime.release();
  });
});

describe('frame subscriptions', () => {
  it('shares one frame and respects phase ordering and subscription snapshots', () => {
    const frames = new Map<number, FrameRequestCallback>();
    let id = 0;
    vi.stubGlobal('window', globalThis);
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { frames.set(++id, cb); return id; });
    vi.stubGlobal('cancelAnimationFrame', (handle: number) => frames.delete(handle));
    const runtime = getMotionRuntime({ development: false });
    runtime.retain();
    const order: string[] = [];
    let stopLate = () => {};
    runtime.subscribe('same', { tick: timestamp => {
      order.push(`tick ${timestamp}`);
      runtime.frame.read(() => order.push('next read'));
      runtime.frame.write(() => order.push('tick write'));
      stopLate = runtime.subscribe('same', { tick: () => order.push('late') });
    } });
    runtime.frame.read(() => order.push('read'));
    runtime.frame.write(() => order.push('write'));
    expect(frames.size).toBe(1);
    const tick = (timestamp: number) => { const cb = [...frames.values()][0]; frames.clear(); cb(timestamp); };
    tick(42);
    expect(order).toEqual(['read', 'tick 42', 'write', 'tick write']);
    tick(43);
    expect(order.slice(4)).toEqual(['next read', 'tick 43', 'late', 'tick write']);
    stopLate();
    runtime.release();
    expect(frames.size).toBe(0);
  });

  it('cancels only unnecessary frames and prevents removed or stale subscribers from ticking', () => {
    const frames = new Map<number, FrameRequestCallback>();
    let id = 0;
    vi.stubGlobal('window', globalThis);
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { frames.set(++id, cb); return id; });
    vi.stubGlobal('cancelAnimationFrame', (handle: number) => frames.delete(handle));
    const runtime = getMotionRuntime({ development: false });
    expect(() => runtime.subscribe('unowned', { tick() {} })).toThrow();
    runtime.retain();
    const work = vi.fn();
    const stop = runtime.subscribe('same', { tick: work });
    runtime.frame.read(stop);
    const cb = [...frames.values()][0]; frames.clear(); cb(10);
    expect(work).not.toHaveBeenCalled();
    expect(frames.size).toBe(0);
    const stale = runtime.subscribe('same', { tick: work });
    runtime.release();
    runtime.retain();
    runtime.subscribe('same', { tick: work });
    runtime.frame.write(() => {});
    stale(); stale();
    expect(frames.size).toBe(1);
    const next = [...frames.values()][0]; frames.clear(); next(11);
    expect(work).toHaveBeenCalledOnce();
    runtime.release();
  });
});

describe('frame subscription lifecycle', () => {
  it('isolates tick errors and preserves queued work after the last unsubscribe', () => {
    const frames = new Map<number, FrameRequestCallback>();
    let id = 0;
    vi.stubGlobal('window', globalThis);
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { frames.set(++id, cb); return id; });
    vi.stubGlobal('cancelAnimationFrame', (handle: number) => frames.delete(handle));
    const report = vi.fn();
    vi.stubGlobal('reportError', report);
    const runtime = getMotionRuntime({ development: false });
    runtime.retain();
    const failure = new Error('tick');
    const later = vi.fn();
    const stopFirst = runtime.subscribe('first', { tick: () => { throw failure; } });
    const stopSecond = runtime.subscribe('second', { tick: later });
    const cb = [...frames.values()][0]; frames.clear(); cb(9);
    expect(report).toHaveBeenCalledWith(failure);
    expect(later).toHaveBeenCalledWith(9);
    const write = vi.fn();
    runtime.frame.write(write);
    stopFirst(); stopSecond();
    expect(frames.size).toBe(1);
    const next = [...frames.values()][0]; frames.clear(); next(10);
    expect(write).toHaveBeenCalledOnce();
    expect(frames.size).toBe(0);
    runtime.release();
  });

  it('does not execute old subscribers after release and reactivation during a frame', () => {
    const frames = new Map<number, FrameRequestCallback>();
    let id = 0;
    vi.stubGlobal('window', globalThis);
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { frames.set(++id, cb); return id; });
    vi.stubGlobal('cancelAnimationFrame', (handle: number) => frames.delete(handle));
    const runtime = getMotionRuntime({ development: false });
    runtime.retain();
    const old = vi.fn();
    const fresh = vi.fn();
    runtime.subscribe('old', { tick: old });
    runtime.frame.read(() => { runtime.release(); runtime.retain(); runtime.subscribe('new', { tick: fresh }); });
    const cb = [...frames.values()][0]; frames.clear(); cb(1);
    expect(old).not.toHaveBeenCalled();
    expect(fresh).not.toHaveBeenCalled();
    const next = [...frames.values()][0]; frames.clear(); next(2);
    expect(fresh).toHaveBeenCalledWith(2);
    runtime.release();
  });
});

describe('frame cancellation failures', () => {
  it('cleans policy and shared state and can resume when cancellation throws', () => {
    const frames: FrameRequestCallback[] = [];
    const removeListener = vi.fn();
    const doc = { documentElement: { getAttribute: () => null } };
    const element = { ownerDocument: doc, isConnected: true, getAttribute: () => null } as unknown as Element;
    vi.stubGlobal('document', doc);
    vi.stubGlobal('window', { matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener: removeListener }) });
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { frames.push(cb); return frames.length; });
    const failure = new Error('cancel failed');
    vi.stubGlobal('cancelAnimationFrame', () => { throw failure; });
    const runtime = getMotionRuntime({ development: false });
    runtime.retain();
    runtime.shared.register('test', element);
    runtime.frame.read(() => {});
    expect(() => runtime.release()).toThrow(failure);
    expect(runtime.shared.resolve('test')).toBeUndefined();
    expect(removeListener).toHaveBeenCalledOnce();
    runtime.retain();
    const work = vi.fn();
    runtime.frame.read(work);
    expect(frames).toHaveLength(2);
    frames[0](0);
    expect(work).not.toHaveBeenCalled();
    frames[1](1);
    expect(work).toHaveBeenCalledOnce();
    runtime.release();
  });

  it('invalidates a frame when cancellation is unavailable or fails on unsubscribe', () => {
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal('window', globalThis);
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { frames.push(cb); return frames.length; });
    vi.stubGlobal('cancelAnimationFrame', undefined);
    const runtime = getMotionRuntime({ development: false });
    runtime.retain();
    const stop = runtime.subscribe('old', { tick() {} });
    expect(stop).not.toThrow();
    const work = vi.fn();
    runtime.frame.read(work);
    expect(frames).toHaveLength(2);
    frames[0](0);
    expect(work).not.toHaveBeenCalled();
    frames[1](1);
    expect(work).toHaveBeenCalledOnce();
    const failure = new Error('cancel failed');
    vi.stubGlobal('cancelAnimationFrame', () => { throw failure; });
    const stopSecond = runtime.subscribe('second', { tick() {} });
    expect(stopSecond).toThrow(failure);
    runtime.frame.read(work);
    expect(frames).toHaveLength(4);
    frames[2](2);
    expect(work).toHaveBeenCalledOnce();
    frames[3](3);
    expect(work).toHaveBeenCalledTimes(2);
    runtime.release();
  });
});

it('uses the explicit adapter development setting and rejects incompatible copies', () => {
  vi.stubGlobal('window', globalThis);
  const runtime = getMotionRuntime({ development: true });
  expect(getMotionRuntime({ development: true })).toBe(runtime);
  expect(() => getMotionRuntime({ development: false })).toThrow(/development/i);
});

it('releases and reactivates when frame cancellation is unavailable', () => {
  const frames: FrameRequestCallback[] = [];
  vi.stubGlobal('window', globalThis);
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { frames.push(cb); return frames.length; });
  vi.stubGlobal('cancelAnimationFrame', undefined);
  const runtime = getMotionRuntime({ development: false });
  runtime.retain();
  runtime.frame.read(() => {});
  expect(() => runtime.release()).not.toThrow();
  runtime.retain();
  const work = vi.fn();
  runtime.frame.read(work);
  frames[0](0);
  expect(work).not.toHaveBeenCalled();
  frames[1](1);
  expect(work).toHaveBeenCalledOnce();
  runtime.release();
});

describe('reduced motion frame subscriptions', () => {
  function setup(initialReduced = false) {
    const frames = new Map<number, FrameRequestCallback>();
    const listeners = new Set<() => void>();
    let reduced = initialReduced;
    let id = 0;
    const media = {
      get matches() { return reduced; },
      addEventListener(_type: string, listener: () => void) { listeners.add(listener); },
      removeEventListener(_type: string, listener: () => void) { listeners.delete(listener); },
    };
    vi.stubGlobal('document', { documentElement: { getAttribute: () => null } });
    vi.stubGlobal('window', { matchMedia: () => media });
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { frames.set(++id, cb); return id; });
    vi.stubGlobal('cancelAnimationFrame', (handle: number) => frames.delete(handle));
    const runtime = getMotionRuntime({ development: false });
    const setReduced = (value: boolean) => { reduced = value; for (const listener of [...listeners]) listener(); };
    const tick = () => { const cb = [...frames.values()][0]; frames.clear(); cb(1); };
    return { runtime, frames, listeners, setReduced, tick };
  }

  it('pauses opted-in subscribers initially and resumes them when the policy changes', () => {
    const { runtime, frames, listeners, setReduced, tick } = setup(true);
    runtime.retain();
    const work = vi.fn();
    const stop = runtime.subscribe('optional', { tick: work }, { pauseWhenReduced: true });
    expect(frames.size).toBe(0);
    setReduced(false);
    expect(frames.size).toBe(1);
    tick();
    expect(work).toHaveBeenCalledOnce();
    setReduced(true);
    expect(frames.size).toBe(0);
    stop();
    runtime.release();
    expect(listeners.size).toBe(0);
    setReduced(false);
    expect(frames.size).toBe(0);
  });

  it('checks policy after reads and between ticks while preserving essential and one-shot work', () => {
    const { runtime, frames, setReduced, tick } = setup();
    runtime.retain();
    const optional = vi.fn();
    const essential = vi.fn(() => setReduced(true));
    const write = vi.fn();
    runtime.subscribe('essential', { tick: essential });
    runtime.subscribe('optional', { tick: optional }, { pauseWhenReduced: true });
    runtime.frame.read(() => setReduced(true));
    runtime.frame.write(write);
    expect(frames.size).toBe(1);
    tick();
    expect(optional).not.toHaveBeenCalled();
    expect(essential).toHaveBeenCalledOnce();
    expect(write).toHaveBeenCalledOnce();
    setReduced(false);
    tick();
    expect(optional).not.toHaveBeenCalled();
    expect(essential).toHaveBeenCalledTimes(2);
    runtime.release();
  });

  it('forgets suspended subscribers on last release and observes the new initial policy on reactivation', () => {
    const { runtime, frames, listeners, setReduced, tick } = setup(true);
    runtime.retain();
    const old = vi.fn();
    const stopOld = runtime.subscribe('old', { tick: old }, { pauseWhenReduced: true });
    runtime.release();
    expect(listeners.size).toBe(0);
    setReduced(false);
    runtime.retain();
    const fresh = vi.fn();
    runtime.subscribe('fresh', { tick: fresh }, { pauseWhenReduced: true });
    stopOld();
    expect(frames.size).toBe(1);
    tick();
    expect(old).not.toHaveBeenCalled();
    expect(fresh).toHaveBeenCalledOnce();
    runtime.release();
  });
});
