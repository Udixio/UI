import { afterEach, expect, it } from 'vitest';
import { getMotionRuntime } from './runtime.js';
import { RUNTIME_KEY } from './runtime-key.js';

afterEach(() => { delete (globalThis as Record<symbol, unknown>)[RUNTIME_KEY]; });

it('coordinates distinct module copies in one frame and drains work in read/write order', async () => {
  // The query causes Vite to load a second copy of the module.
  // @ts-expect-error Vite supports module query suffixes.
  const copy = await import('./runtime.js?second-copy');
  const runtime = getMotionRuntime();
  expect(copy.getMotionRuntime()).toBe(runtime);
  runtime.retain();
  copy.getMotionRuntime().retain();
  const order: string[] = [];
  await new Promise<void>((resolve) => {
    runtime.frame.write(() => {
      order.push('write');
      runtime.frame.read(() => { order.push('next read'); resolve(); });
    });
    copy.getMotionRuntime().frame.read(() => {
      order.push('read');
      runtime.frame.write(() => order.push('write from read'));
    });
  });
  expect(order).toEqual(['read', 'write', 'write from read', 'next read']);
  runtime.release();
  copy.getMotionRuntime().release();
});
