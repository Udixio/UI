import { afterEach, expect, it, vi } from 'vitest';
import { motionPolicy, watchMotionPolicy } from './policy.js';

/** A system preference the test sets, with the listeners the policy installed on it. */
function systemPreference() {
  const state = { reduced: false, listeners: new Set<() => void>() };
  vi.spyOn(window, 'matchMedia').mockReturnValue({
    get matches() { return state.reduced; },
    addEventListener: (_: string, listener: () => void) => state.listeners.add(listener),
    removeEventListener: (_: string, listener: () => void) => state.listeners.delete(listener),
  } as unknown as MediaQueryList);
  return {
    get listeners() { return state.listeners; },
    set(reduced: boolean) {
      state.reduced = reduced;
      for (const listener of [...state.listeners]) listener();
    },
  };
}

/** The MutationObserver of the policy delivers its records in a microtask. */
const records = () => new Promise(resolve => setTimeout(resolve, 0));

afterEach(() => {
  document.documentElement.removeAttribute('data-motion-policy');
  vi.restoreAllMocks();
});

it('reports the current policy at once, then each change of the document attribute', async () => {
  systemPreference();
  const seen: boolean[] = [];
  const stop = watchMotionPolicy(reduced => seen.push(reduced));
  try {
    expect(seen).toEqual([false]);
    document.documentElement.setAttribute('data-motion-policy', 'reduce');
    await records();
    expect(seen).toEqual([false, true]);
    expect(motionPolicy.reduced).toBe(true);
    // `auto` and an unknown value follow the system preference.
    document.documentElement.setAttribute('data-motion-policy', 'auto');
    await records();
    document.documentElement.setAttribute('data-motion-policy', 'whatever');
    await records();
    expect(seen).toEqual([false, true, false]);
  } finally { stop(); }
});

it('reports each change of the system preference, and the attribute wins over it', async () => {
  const system = systemPreference();
  const seen: boolean[] = [];
  const stop = watchMotionPolicy(reduced => seen.push(reduced));
  try {
    system.set(true);
    system.set(true);
    system.set(false);
    expect(seen).toEqual([false, true, false]);
    document.documentElement.setAttribute('data-motion-policy', 'reduce');
    await records();
    system.set(true);
    system.set(false);
    expect(seen).toEqual([false, true, false, true]);
  } finally { stop(); }
});

it('stops calling back once stopped, and removes its listeners when the last watcher stops', async () => {
  const system = systemPreference();
  const first = vi.fn();
  const second = vi.fn();
  const stopFirst = watchMotionPolicy(first);
  const stopSecond = watchMotionPolicy(second);
  expect(system.listeners.size).toBe(1);
  stopFirst();
  stopFirst();
  system.set(true);
  expect(first).toHaveBeenCalledTimes(1);
  expect(second).toHaveBeenLastCalledWith(true);
  expect(system.listeners.size).toBe(1);
  stopSecond();
  expect(system.listeners.size).toBe(0);
  document.documentElement.setAttribute('data-motion-policy', 'reduce');
  await records();
  expect(second).toHaveBeenCalledTimes(2);
});

it('does not hold the policy when its first report throws', () => {
  const system = systemPreference();
  expect(() => watchMotionPolicy(() => { throw new Error('first report failed'); })).toThrow('first report failed');
  expect(system.listeners.size).toBe(0);
});

it('keeps the lease of another owner: a watcher that stops does not release it', () => {
  const system = systemPreference();
  motionPolicy.retain();
  try {
    const owner = vi.fn();
    const stopOwner = motionPolicy.subscribe(owner);
    watchMotionPolicy(() => {})();
    system.set(true);
    expect(owner).toHaveBeenCalledOnce();
    stopOwner();
  } finally { motionPolicy.release(); }
  expect(system.listeners.size).toBe(0);
});
