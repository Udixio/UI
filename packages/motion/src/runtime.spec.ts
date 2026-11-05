import { afterEach, describe, expect, it, vi } from 'vitest';
import { getMotionRuntime } from './runtime.js';
import { RUNTIME_KEY } from './runtime-key.js';

afterEach(() => {
  delete (globalThis as Record<symbol, unknown>)[RUNTIME_KEY];
  vi.unstubAllGlobals();
});

describe('motion runtime', () => {
  it('does not install shared process state during SSR', () => {
    const first = getMotionRuntime();
    expect(getMotionRuntime()).not.toBe(first);
    expect((globalThis as Record<symbol, unknown>)[RUNTIME_KEY]).toBeUndefined();
    expect(() => first.frame.read(() => {})).not.toThrow();
  });

  it('shares a versioned runtime and cleans pending work after the last release', () => {
    const callbacks = new Map<number, FrameRequestCallback>();
    let id = 0;
    vi.stubGlobal('window', globalThis);
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { callbacks.set(++id, cb); return id; });
    vi.stubGlobal('cancelAnimationFrame', (handle: number) => callbacks.delete(handle));
    const first = getMotionRuntime();
    const second = getMotionRuntime();
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
    const runtime = getMotionRuntime();
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

});
