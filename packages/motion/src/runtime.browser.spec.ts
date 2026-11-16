import { sharedOf } from './shared-registry.js';
import { afterEach, expect, it, vi } from 'vitest';
import { getMotionRuntime } from './runtime.js';
const FRAME_RUNTIME_KEY = Symbol.for('udixio.motion.frame-runtime.preview.7');

afterEach(() => { delete (globalThis as Record<symbol, unknown>)[FRAME_RUNTIME_KEY]; });

it('coordinates distinct module copies in one frame and drains work in read/write order', async () => {
  // The query causes Vite to load a second copy of the module.
  // @ts-expect-error Vite supports module query suffixes.
  const copy = await import('./runtime.js?second-copy');
  const runtime = getMotionRuntime({ development: false });
  expect(copy.getMotionRuntime({ development: false })).toBe(runtime);
  runtime.retain();
  copy.getMotionRuntime({ development: false }).retain();
  const order: string[] = [];
  await new Promise<void>((resolve) => {
    runtime.frame.write(() => {
      order.push('write');
      runtime.frame.read(() => { order.push('next read'); resolve(); });
    });
    copy.getMotionRuntime({ development: false }).frame.read(() => {
      order.push('read');
      runtime.frame.write(() => order.push('write from read'));
    });
  });
  expect(order).toEqual(['read', 'write', 'write from read', 'next read']);
  runtime.release();
  copy.getMotionRuntime({ development: false }).release();
});

it('shares policy and registry across copies until the last owner releases', async () => {
  // @ts-expect-error Vite supports module query suffixes.
  const copy = await import('./runtime.js?integrated-copy');
  const runtime = getMotionRuntime({ development: false });
  const other = copy.getMotionRuntime({ development: false });
  const endFirst = (await import('./runtime.js')).retainMotionRuntime(runtime);
  const endSecond = copy.retainMotionRuntime(other);
  const element = document.createElement('div');
  document.body.append(element);
  const removeOld = sharedOf(runtime).register('integration', element);
  expect(sharedOf(other).resolve('integration')).toBe(element);
  const changed = vi.fn();
  other.policy.subscribe(changed);
  document.documentElement.setAttribute('data-motion-policy', 'reduce');
  await vi.waitFor(() => expect(runtime.policy.reduced).toBe(true));
  expect(changed).toHaveBeenCalledOnce();
  endFirst(); endFirst();
  expect(sharedOf(other).resolve('integration')).toBe(element);
  endSecond();
  expect(sharedOf(other).resolve('integration')).toBeUndefined();
  const endThird = copy.retainMotionRuntime(other);
  const removeNew = sharedOf(other).register('integration', element);
  removeOld();
  expect(sharedOf(runtime).resolve('integration')).toBe(element);
  removeNew(); endThird();
  element.remove();
  document.documentElement.removeAttribute('data-motion-policy');
});

it('uses adapter-provided development mode across module copies', async () => {
  // @ts-expect-error Vite supports module query suffixes.
  const copy = await import('./runtime.js?development-copy');
  const runtime = getMotionRuntime({ development: true });
  expect(copy.getMotionRuntime({ development: true })).toBe(runtime);
  expect(() => copy.getMotionRuntime({ development: false })).toThrow(/development/i);
  runtime.retain();
  const first = document.createElement('div');
  const second = document.createElement('div');
  document.body.append(first, second);
  sharedOf(runtime).register('duplicate', first);
  expect(() => sharedOf(copy.getMotionRuntime({ development: true })).register('duplicate', second)).toThrow(/Multiple live/);
  runtime.release();
  first.remove(); second.remove();
});

it('creates the runtime with development off when the option is omitted, then adopts it', async () => {
  // @ts-expect-error Vite supports module query suffixes.
  const copy = await import('./runtime.js?omitted-development-copy');
  const runtime = copy.getMotionRuntime();
  expect(runtime.development).toBe(false);
  expect(getMotionRuntime()).toBe(runtime);
  expect(() => getMotionRuntime({ development: true })).toThrow(/development/i);
});

it('shares reduced-motion scheduling across module copies', async () => {
  // @ts-expect-error Vite supports module query suffixes.
  const copy = await import('./runtime.js?reduced-copy');
  const runtime = getMotionRuntime({ development: false });
  const other = copy.getMotionRuntime({ development: false });
  document.documentElement.setAttribute('data-motion-policy', 'reduce');
  runtime.retain();
  other.retain();
  const optional = vi.fn();
  const essential = vi.fn();
  const stopOptional = other.subscribe('optional', { tick: optional }, { pauseWhenReduced: true });
  const stopEssential = runtime.subscribe('essential', { tick: essential });
  await vi.waitFor(() => expect(essential).toHaveBeenCalled());
  expect(optional).not.toHaveBeenCalled();
  document.documentElement.removeAttribute('data-motion-policy');
  await vi.waitFor(() => expect(optional).toHaveBeenCalled());
  stopOptional(); stopEssential();
  runtime.release(); other.release();
});

it('starts rooted ticks only after the browser reports the target in view', async () => {
  const runtime = getMotionRuntime({ development: false });
  const root = document.createElement('div');
  Object.assign(root.style, { position: 'fixed', top: '-1000px', left: '0', width: '20px', height: '20px' });
  document.body.append(root);
  runtime.retain();
  const tick = vi.fn();
  const stop = runtime.subscribe('visible-root', { tick }, { root });
  try {
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(tick).not.toHaveBeenCalled();
    root.style.top = '0';
    await vi.waitFor(() => expect(tick).toHaveBeenCalled());
  } finally {
    stop(); runtime.release(); root.remove();
  }
});
