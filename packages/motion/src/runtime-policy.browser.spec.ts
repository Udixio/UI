import { afterEach, expect, it, vi } from 'vitest';
import { createMotionPolicy } from './runtime-policy.js';

afterEach(() => {
  document.documentElement.removeAttribute('data-motion-policy');
  vi.restoreAllMocks();
});

it('resolves the site policy and tracks changes to the system preference', () => {
  let systemReduced = false;
  vi.spyOn(window, 'matchMedia').mockImplementation(() => ({ get matches() { return systemReduced; } } as MediaQueryList));
  const policy = createMotionPolicy();
  expect(policy.reduced).toBe(false);
  systemReduced = true;
  expect(policy.reduced).toBe(true);
  document.documentElement.setAttribute('data-motion-policy', 'reduce');
  systemReduced = false;
  expect(policy.reduced).toBe(true);
  document.documentElement.setAttribute('data-motion-policy', 'auto');
  expect(policy.reduced).toBe(false);
});

it('notifies effective changes and cleans up on the final release', async () => {
  let systemReduced = false;
  const listeners = new Set<() => void>();
  const media = {
    get matches() { return systemReduced; },
    addEventListener: (_: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
  } as unknown as MediaQueryList;
  vi.spyOn(window, 'matchMedia').mockReturnValue(media);
  const policy = createMotionPolicy();
  policy.retain();
  policy.retain();
  const values: boolean[] = [];
  const stop = policy.subscribe(() => values.push(policy.reduced));
  systemReduced = true;
  listeners.forEach(listener => listener());
  listeners.forEach(listener => listener());
  document.documentElement.setAttribute('data-motion-policy', 'reduce');
  await new Promise(resolve => setTimeout(resolve, 0));
  systemReduced = false;
  listeners.forEach(listener => listener());
  document.documentElement.setAttribute('data-motion-policy', 'auto');
  await new Promise(resolve => setTimeout(resolve, 0));
  expect(values).toEqual([true, false]);
  policy.release();
  expect(listeners.size).toBe(1);
  policy.release();
  expect(listeners.size).toBe(0);
  stop();
  stop();
  systemReduced = true;
  policy.retain();
  expect(policy.reduced).toBe(true);
  expect(listeners.size).toBe(1);
  policy.release();
});

it('isolates listener errors and processes a reentrant policy change', () => {
  let systemReduced = false;
  let listener = () => {};
  vi.spyOn(window, 'matchMedia').mockReturnValue({
    get matches() { return systemReduced; },
    addEventListener: (_: string, callback: () => void) => { listener = callback; },
    removeEventListener: () => {},
  } as unknown as MediaQueryList);
  const reporter = vi.spyOn(globalThis, 'reportError').mockImplementation(() => { throw new Error('reporter failed'); });
  const policy = createMotionPolicy();
  policy.retain();
  const seen: boolean[] = [];
  policy.subscribe(() => { throw new Error('listener failed'); });
  policy.subscribe(() => {
    seen.push(policy.reduced);
    if (policy.reduced) { systemReduced = false; listener(); }
  });
  systemReduced = true;
  listener();
  expect(seen).toEqual([true, false]);
  expect(reporter).toHaveBeenCalledTimes(2);
  policy.release();
});

it('does not deliver a stale subscription after release and reactivation', () => {
  let systemReduced = false;
  let listener = () => {};
  vi.spyOn(window, 'matchMedia').mockReturnValue({
    get matches() { return systemReduced; },
    addEventListener: (_: string, callback: () => void) => { listener = callback; },
    removeEventListener: () => {},
  } as unknown as MediaQueryList);
  const policy = createMotionPolicy();
  policy.retain();
  const stale = vi.fn();
  policy.subscribe(() => { policy.release(); policy.retain(); });
  policy.subscribe(stale);
  systemReduced = true;
  listener();
  expect(stale).not.toHaveBeenCalled();
  policy.release();
});

it('rolls back a failed activation and permits a retry', () => {
  let installed = 0;
  const remove = vi.fn(() => { installed--; });
  vi.spyOn(window, 'matchMedia').mockReturnValue({
    matches: false,
    addEventListener: () => { installed++; },
    removeEventListener: remove,
  } as unknown as MediaQueryList);
  const observe = vi.spyOn(MutationObserver.prototype, 'observe').mockImplementationOnce(() => { throw new Error('observe failed'); });
  const policy = createMotionPolicy();
  expect(() => policy.retain()).toThrow('observe failed');
  expect(installed).toBe(0);
  expect(() => policy.subscribe(() => {})).toThrow();
  policy.retain();
  expect(installed).toBe(1);
  expect(observe).toHaveBeenCalledTimes(2);
  policy.release();
  expect(installed).toBe(0);
});

it('cleans all resources and permits retry when removal throws', () => {
  vi.spyOn(window, 'matchMedia').mockReturnValue({
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => { throw new Error('remove failed'); },
  } as unknown as MediaQueryList);
  const disconnect = vi.spyOn(MutationObserver.prototype, 'disconnect');
  const policy = createMotionPolicy();
  policy.retain();
  expect(() => policy.release()).toThrow('remove failed');
  expect(disconnect).toHaveBeenCalledOnce();
  expect(() => policy.subscribe(() => {})).toThrow();
  policy.retain();
  expect(() => policy.release()).toThrow('remove failed');
  expect(disconnect).toHaveBeenCalledTimes(2);
});

it('ignores callbacks captured before release after reactivation', () => {
  let systemReduced = false;
  const mediaCallbacks: Array<() => void> = [];
  const observerCallbacks: Array<MutationCallback> = [];
  vi.spyOn(window, 'matchMedia').mockReturnValue({
    get matches() { return systemReduced; },
    addEventListener: (_: string, callback: () => void) => { mediaCallbacks.push(callback); },
    removeEventListener: () => {},
  } as unknown as MediaQueryList);
  const NativeObserver = globalThis.MutationObserver;
  class ControlledObserver {
    constructor(callback: MutationCallback) { observerCallbacks.push(callback); }
    observe() {}
    disconnect() {}
    takeRecords() { return []; }
  }
  globalThis.MutationObserver = ControlledObserver as unknown as typeof MutationObserver;
  try {
    const policy = createMotionPolicy();
    policy.retain();
    policy.release();
    policy.retain();
    const subscriber = vi.fn();
    policy.subscribe(subscriber);
    systemReduced = true;
    mediaCallbacks[0]();
    observerCallbacks[0]([], {} as MutationObserver);
    // Reading `reduced` itself refreshes the current system preference. Check
    // the stale callbacks before that read, so the getter cannot notify us.
    expect(subscriber).not.toHaveBeenCalled();
    mediaCallbacks[1]();
    expect(policy.reduced).toBe(true);
    expect(subscriber).toHaveBeenCalledOnce();
    policy.release();
  } finally {
    globalThis.MutationObserver = NativeObserver;
  }
});
