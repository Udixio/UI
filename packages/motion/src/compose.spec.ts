import { describe, expect, it, vi } from 'vitest';
import type { MotionBackend, MotionHandle } from './contract.js';
import { composeHandles, settledHandle, splitFrames } from './compose.js';

type Fake = MotionHandle & { resolve(result: 'finished' | 'cancelled'): void };

function fakeHandle(
  duration: number,
  backend: MotionBackend = 'css',
): Fake {
  let resolve!: (result: 'finished' | 'cancelled') => void;
  const finished = new Promise<'finished' | 'cancelled'>(done => {
    resolve = done;
  });
  return {
    backend,
    duration,
    currentTime: 0,
    finished,
    velocity: { value: 0, source: 'unavailable' },
    play: vi.fn(),
    pause: vi.fn(),
    reverse: vi.fn(),
    seek: vi.fn(),
    cancel: vi.fn(),
    resolve,
  };
}

describe('composeHandles', () => {
  it('takes the longest duration and the backend of the first handle', () => {
    const composed = composeHandles([
      fakeHandle(200, 'css'),
      fakeHandle(500, 'waapi'),
    ]);
    expect(composed.duration).toBe(500);
    expect(composed.backend).toBe('css');
    expect(composed.velocity).toEqual({ value: 0, source: 'unavailable' });
  });

  it('shows the largest current time of its handles', () => {
    const a = fakeHandle(100);
    const b = fakeHandle(300);
    const composed = composeHandles([a, b]);
    expect(composed.currentTime).toBe(0);
    (a as { currentTime: number }).currentTime = 120;
    (b as { currentTime: number }).currentTime = 80;
    expect(composed.currentTime).toBe(120);
  });

  it('finishes when every handle finished', async () => {
    const a = fakeHandle(100);
    const b = fakeHandle(300);
    const composed = composeHandles([a, b]);
    a.resolve('finished');
    b.resolve('finished');
    await expect(composed.finished).resolves.toBe('finished');
  });

  it('is cancelled when any handle was cancelled', async () => {
    const a = fakeHandle(100);
    const b = fakeHandle(300);
    const composed = composeHandles([a, b]);
    a.resolve('cancelled');
    b.resolve('finished');
    await expect(composed.finished).resolves.toBe('cancelled');
  });

  it('relays play, pause, reverse and cancel to every handle', () => {
    const a = fakeHandle(100);
    const b = fakeHandle(300);
    const composed = composeHandles([a, b]);
    composed.play();
    composed.pause();
    composed.reverse();
    composed.cancel();
    for (const handle of [a, b]) {
      expect(handle.play).toHaveBeenCalledOnce();
      expect(handle.pause).toHaveBeenCalledOnce();
      expect(handle.reverse).toHaveBeenCalledOnce();
      expect(handle.cancel).toHaveBeenCalledOnce();
    }
  });

  it('clamps seek to the duration of each handle', () => {
    const short = fakeHandle(200);
    const long = fakeHandle(500);
    composeHandles([short, long]).seek(400);
    expect(short.seek).toHaveBeenCalledWith(200);
    expect(long.seek).toHaveBeenCalledWith(400);
  });

  it('is equivalent to a settled handle when empty', async () => {
    const composed = composeHandles([]);
    const settled = settledHandle();
    expect(composed.duration).toBe(settled.duration);
    expect(composed.backend).toBe(settled.backend);
    expect(composed.velocity).toEqual(settled.velocity);
    await expect(composed.finished).resolves.toBe('finished');
  });
});

describe('settledHandle', () => {
  it('is already finished with no duration and no effect', async () => {
    const handle = settledHandle();
    expect(handle.backend).toBe('waapi');
    expect(handle.duration).toBe(0);
    expect(handle.currentTime).toBe(0);
    await expect(handle.finished).resolves.toBe('finished');
    expect(() => {
      handle.play();
      handle.pause();
      handle.reverse();
      handle.seek(100);
      handle.cancel();
    }).not.toThrow();
  });
});

describe('splitFrames', () => {
  it('separates opacity from the spatial fields', () => {
    expect(
      splitFrames([
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0 },
      ]),
    ).toEqual({
      effects: [{ opacity: 0 }, { opacity: 1 }],
      spatial: [{ y: 24 }, { y: 0 }],
    });
  });

  it('returns an empty list for a group no keyframe uses', () => {
    expect(splitFrames([{ x: 0 }, { x: 10 }])).toEqual({
      effects: [],
      spatial: [{ x: 0 }, { x: 10 }],
    });
    expect(splitFrames([{ opacity: 0 }, { opacity: 1 }])).toEqual({
      effects: [{ opacity: 0 }, { opacity: 1 }],
      spatial: [],
    });
  });
});
