import { describe, expect, it } from 'vitest';
import { waapiProvider } from './waapi.js';
import { animejsProvider } from './animejs.js';

describe.each([waapiProvider, animejsProvider])('$backend provider', (provider) => {
  it('finishes and releases its active animation', async () => {
    const target = document.createElement('div');
    document.body.append(target);
    const handle = provider.animate({ target, keyframes: [{ opacity: 0 }, { opacity: 1 }], timing: { duration: 40, easing: 'linear' } });
    expect(handle.backend).toBe(provider.backend);
    expect(provider.activeCount()).toBe(1);
    expect(await handle.finished).toBe('finished');
    expect(provider.activeCount()).toBe(0);
    handle.seek(10);
    handle.play();
    expect(provider.activeCount()).toBe(0);
    target.remove();
  });

  it('settles cancellation and ignores later seek and play', async () => {
    const target = document.createElement('div');
    document.body.append(target);
    const handle = provider.animate({ target, keyframes: [{ opacity: 0 }, { opacity: 1 }], timing: { duration: 1000, easing: 'linear' } });
    handle.cancel();
    expect(await handle.finished).toBe('cancelled');
    expect(() => { handle.seek(100); handle.play(); }).not.toThrow();
    expect(provider.activeCount()).toBe(0);
    target.remove();
  });

  it('animates individual visual properties from the current value', async () => {
    const target = document.createElement('div');
    target.style.opacity = '0.2';
    document.body.append(target);
    const handle = provider.animate({ target, keyframes: [{ opacity: 0.8, x: 100, y: 20, scale: 2, rotate: 90 }], timing: { duration: 1000, easing: 'linear' } });
    handle.pause();
    handle.seek(500);
    const style = getComputedStyle(target);
    expect(Number(style.opacity)).toBeCloseTo(0.5, 1);
    expect(parseFloat(style.translate)).toBeCloseTo(50, 0);
    expect(parseFloat(style.scale)).toBeCloseTo(1.5, 1);
    expect(parseFloat(style.rotate)).toBeCloseTo(45, 0);
    handle.cancel();
    target.remove();
  });

  it('restores pre-existing inline styles when cancelled partway through', async () => {
    const target = document.createElement('div');
    target.style.setProperty('opacity', '0.3', 'important');
    target.style.translate = '12px 4px';
    document.body.append(target);
    const handle = provider.animate({ target, keyframes: [{ opacity: 0.9, x: 100, scale: 2 }], timing: { duration: 1000, easing: 'linear' } });
    handle.pause();
    handle.seek(500);
    handle.cancel();
    expect(await handle.finished).toBe('cancelled');
    expect(target.style.getPropertyValue('opacity')).toBe('0.3');
    expect(target.style.getPropertyPriority('opacity')).toBe('important');
    expect(target.style.translate).toBe('12px 4px');
    expect(target.style.scale).toBe('');
    target.remove();
  });

  it('interpolates omitted endpoint properties against their underlying values', () => {
    const target = document.createElement('div');
    target.style.opacity = '1';
    document.body.append(target);
    const handle = provider.animate({ target, keyframes: [{ opacity: 0 }, { x: 100 }], timing: { duration: 1000, easing: 'linear' } });
    handle.pause();
    handle.seek(500);
    expect(Number(getComputedStyle(target).opacity)).toBeCloseTo(0.5, 1);
    handle.cancel();
    target.remove();
  });
});
