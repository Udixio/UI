import { describe, expect, it } from 'vitest';
import { waapiProvider } from './waapi.js';
import { animejsProvider } from './animejs.js';

describe.each([waapiProvider, animejsProvider])('$backend leak checks', (provider) => {
  it('releases 200 cancelled animations', async () => {
    const container = document.createElement('div');
    document.body.append(container);
    try {
      const handles = Array.from({ length: 200 }, () => {
        const target = document.createElement('div');
        container.append(target);
        return provider.animate({ target, keyframes: [{ opacity: 0 }, { opacity: 1 }], timing: { duration: 1000, easing: 'linear' } });
      });
      handles.forEach((handle) => handle.cancel());
      await Promise.all(handles.map((handle) => handle.finished));
      expect(provider.activeCount()).toBe(0);
      expect(document.getAnimations()).toHaveLength(0);
    } finally {
      container.remove();
    }
  });

  it('releases animations whose targets are removed while running', async () => {
    const container = document.createElement('div');
    document.body.append(container);
    try {
      const handles = Array.from({ length: 50 }, () => {
        const target = document.createElement('div');
        container.append(target);
        return provider.animate({ target, keyframes: [{ opacity: 0 }, { opacity: 1 }], timing: { duration: 100, easing: 'linear' } });
      });
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      container.remove();
      await Promise.all(handles.map((handle) => handle.finished));
      expect(provider.activeCount()).toBe(0);
    } finally {
      container.remove();
    }
  });

  it('releases completed effects while preserving the final visual state and settled result', async () => {
    const target = document.createElement('div');
    target.style.opacity = '0.2';
    document.body.append(target);
    try {
      const handle = provider.animate({ target, keyframes: [{ opacity: 0.2 }, { opacity: 0.8 }], timing: { duration: 50, easing: 'linear' } });
      expect(await handle.finished).toBe('finished');
      expect(provider.activeCount()).toBe(0);
      expect(Number(getComputedStyle(target).opacity)).toBeCloseTo(0.8, 2);
      expect(document.getAnimations()).toHaveLength(0);
      handle.cancel();
      expect(await handle.finished).toBe('finished');
      expect(Number(getComputedStyle(target).opacity)).toBeCloseTo(0.8, 2);
      expect(document.getAnimations()).toHaveLength(0);
    } finally {
      target.remove();
    }
  });

  it('preserves the final state when a target is detached until completion', async () => {
    const target = document.createElement('div');
    target.style.opacity = '0.2';
    document.body.append(target);
    const handle = provider.animate({ target, keyframes: [{ opacity: 0.2 }, { opacity: 0.8 }], timing: { duration: 100, easing: 'linear' } });
    target.remove();
    try {
      expect(await handle.finished).toBe('finished');
      document.body.append(target);
      expect(Number(getComputedStyle(target).opacity)).toBeCloseTo(0.8, 2);
      expect(document.getAnimations()).toHaveLength(0);
      expect(provider.activeCount()).toBe(0);
    } finally {
      handle.cancel();
      target.remove();
    }
  });
});
