import { describe, expect, it, vi } from 'vitest';
import { animejsProvider } from './animejs.js';
import { defineTokens } from '../index.js';

describe('animejs easing validation', () => {
  it.each([
    'linear(0, 1)', 'steps(2)', 'ease', '', 'cubic-bezier(, 0, 1, 1)',
    'cubic-bezier(0x0, 0, 1, 1)', 'cubic-bezier(NaN, 0, 1, 1)',
    'cubic-bezier(-1e-999, 0, 1, 1)', 'cubic-bezier(1.0000000000000001, 0, 1, 1)',
    'cubic-bezier(1e-999, 0, 1, 1)', 'cubic-bezier(0, 0.1234567890123456, 1, 1)',
    'cubic-bezier(0, 1e308, 1, 1)', 'cubic-bezier(0, 1000001, 1, 1)',
    'cubic-bezier(0, -1000001, 1, 1)',
    'cubic-bezier(0, Infinity, 1, 1)', 'cubic-bezier(0, 1e999, 1, 1)', 'cubic-bezier(-.1, 0, 1, 1)',
    'cubic-bezier(0, 0, 1.1, 1)', 'cubic-bezier(0, calc(1), 1, 1)',
    'cubic-bezier(0, 0, 1, 1) trailing', 'cubic-bezier(0, 0, 1, 1.)',
  ])('rejects %s before reading style or starting an animation', (easing) => {
    const target = document.createElement('div');
    target.style.setProperty('opacity', '0.4', 'important');
    document.body.append(target);
    const before = target.getAttribute('style');
    const active = animejsProvider.activeCount();
    const computed = vi.spyOn(window, 'getComputedStyle');
    try {
      expect(() => animejsProvider.animate({ target, keyframes: [{ opacity: 1 }], timing: { duration: 1000, easing } })).toThrow();
      expect(computed).not.toHaveBeenCalled();
      expect(target.getAttribute('style')).toBe(before);
      expect(animejsProvider.activeCount()).toBe(active);
      expect(document.getAnimations()).toHaveLength(0);
    } finally {
      computed.mockRestore();
      target.remove();
    }
  });

  it.each(['linear', 'cubic-bezier( +.34e0, 8E-1, .34e0, +1.0 )', '\tCUBIC-BEZIER(\n0,\f0,\r1, 1\t)\n'])('accepts %s', async (easing) => {
    const target = document.createElement('div');
    document.body.append(target);
    const handle = animejsProvider.animate({ target, keyframes: [{ opacity: 0 }, { opacity: 1 }], timing: { duration: 1000, easing } });
    handle.pause();
    handle.seek(500);
    const opacity = Number(getComputedStyle(target).opacity);
    expect(opacity).toBeGreaterThan(0);
    if (easing === 'linear') expect(opacity).toBeCloseTo(0.5, 2);
    if (easing.includes('8E-1')) expect(opacity).toBeGreaterThan(0.8);
    handle.cancel();
    expect(await handle.finished).toBe('cancelled');
    expect(animejsProvider.activeCount()).toBe(0);
    target.remove();
  });

  it.each([
    'cubic-bezier(0, 1000000, 1, -1000000)',
    'cubic-bezier(0.123456789012345, 0, 1, 1)',
  ])('accepts boundary coordinates in %s', async (easing) => {
    const target = document.createElement('div');
    document.body.append(target);
    try {
      const handle = animejsProvider.animate({ target, keyframes: [{ x: 0 }, { x: 100 }], timing: { duration: 1000, easing } });
      handle.pause();
      handle.seek(500);
      expect(Number.isFinite(parseFloat(getComputedStyle(target).translate))).toBe(true);
      handle.cancel();
      expect(await handle.finished).toBe('cancelled');
      expect(animejsProvider.activeCount()).toBe(0);
    } finally { target.remove(); }
  });

  it.each(['expressive', 'standard'] as const)('executes every %s spring fallback pair', async (scheme) => {
    const target = document.createElement('div');
    document.body.append(target);
    try {
      const springs = defineTokens({ scheme }).spring;
      for (const speed of ['fast', 'default', 'slow'] as const) {
        for (const kind of ['spatial', 'effects'] as const) {
          const timing = springs[speed][kind].fallback;
          const handle = animejsProvider.animate({ target, keyframes: [{ opacity: 0 }, { opacity: 1 }], timing });
          expect(handle.duration).toBe(timing.duration);
          handle.pause();
          handle.seek(timing.duration / 2);
          expect(Number(getComputedStyle(target).opacity)).toBeGreaterThan(0);
          handle.cancel();
          expect(await handle.finished).toBe('cancelled');
          expect(animejsProvider.activeCount()).toBe(0);
        }
      }
    } finally { target.remove(); }
  });

  it('reads and animates the target in its own iframe and cleans up', async () => {
    const iframe = document.createElement('iframe');
    document.body.append(iframe);
    const view = iframe.contentWindow!;
    const target = view.document.createElement('div');
    target.style.opacity = '0.2';
    view.document.body.append(target);
    const ownComputed = vi.spyOn(view, 'getComputedStyle');
    try {
      const handle = animejsProvider.animate({ target, keyframes: [{ opacity: 0.8 }], timing: { duration: 1000, easing: 'linear' } });
      expect(ownComputed).toHaveBeenCalledWith(target);
      handle.pause();
      handle.seek(500);
      expect(Number(view.getComputedStyle(target).opacity)).toBeCloseTo(0.5, 1);
      handle.cancel();
      expect(await handle.finished).toBe('cancelled');
      expect(target.style.opacity).toBe('0.2');
      expect(animejsProvider.activeCount()).toBe(0);
    } finally {
      ownComputed.mockRestore();
      iframe.remove();
    }
  });
});
