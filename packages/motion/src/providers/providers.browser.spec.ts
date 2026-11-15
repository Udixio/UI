import { describe, expect, it } from 'vitest';
import { waapiProvider } from './waapi.js';
import { animejsProvider } from './animejs.js';
import { cssProvider } from './css.js';

/** Scale as [x, y], whatever the browser's serialization of a one-value scale. */
const scaleOf = (element: HTMLElement) => {
  const [x = '1', y = x] = getComputedStyle(element).scale.split(' ');
  return [parseFloat(x), parseFloat(y)];
};

describe.each([waapiProvider, animejsProvider])('$backend provider', (provider) => {
  it('declares only capabilities implemented by its current request contract', () => {
    expect([...provider.capabilities]).toEqual([]);
  });

  it('reports velocity as unavailable throughout the handle lifecycle', async () => {
    const target = document.createElement('div');
    document.body.append(target);
    const handle = provider.animate({ target, keyframes: [{ opacity: 0 }, { opacity: 1 }], timing: { duration: 1000, easing: 'linear' } });
    expect(handle.velocity).toEqual({ value: 0, source: 'unavailable' });
    handle.pause();
    handle.seek(500);
    expect(handle.velocity).toEqual({ value: 0, source: 'unavailable' });
    handle.cancel();
    await handle.finished;
    expect(handle.velocity).toEqual({ value: 0, source: 'unavailable' });
    target.remove();
  });

  it('waits for the remaining delay after seeking and resuming', async () => {
    const target = document.createElement('div');
    document.body.append(target);
    const handle = provider.animate({ target, keyframes: [{ opacity: 0 }, { opacity: 1 }], timing: { duration: 400, delay: 600, easing: 'linear' } });
    try {
      handle.pause();
      handle.seek(100);
      handle.play();
      await new Promise((resolve) => setTimeout(resolve, 150));
      handle.pause();
      expect(Number(getComputedStyle(target).opacity)).toBeCloseTo(0, 2);
    } finally {
      handle.cancel();
      target.remove();
    }
  });
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
    expect(parseFloat(getComputedStyle(target).translate)).toBeCloseTo(50, 0);
    handle.cancel();
    target.remove();
  });

  it('preserves inline changes made after an animation writes its values', async () => {
    const target = document.createElement('div');
    target.style.opacity = '0.3';
    document.body.append(target);
    const handle = provider.animate({ target, keyframes: [{ opacity: 1 }], timing: { duration: 1000, easing: 'linear' } });
    handle.pause();
    handle.seek(500);
    target.style.setProperty('opacity', '0.8', 'important');
    handle.cancel();
    expect(await handle.finished).toBe('cancelled');
    expect(target.style.opacity).toBe('0.8');
    expect(target.style.getPropertyPriority('opacity')).toBe('important');
    target.remove();
  });

  it('samples the first frame at zero and applies cubic-bezier easing', () => {
    const target = document.createElement('div');
    document.body.append(target);
    const handle = provider.animate({
      target,
      keyframes: [{ opacity: 0, y: 24 }, { opacity: 1, y: 0 }],
      timing: { duration: 1000, easing: 'cubic-bezier(0.34, 0.80, 0.34, 1.00)' },
    });
    handle.pause();
    handle.seek(0);
    expect(Number(getComputedStyle(target).opacity)).toBeCloseTo(0, 2);
    expect(parseFloat(getComputedStyle(target).translate.split(' ')[1])).toBeCloseTo(24, 1);
    handle.seek(500);
    expect(Number(getComputedStyle(target).opacity)).toBeGreaterThan(0.8);
    handle.cancel();
    target.remove();
  });

});

describe('waapi provider scaleX and scaleY', () => {
  it('animates scale as a pair of values', () => {
    const target = document.createElement('div');
    document.body.append(target);
    const handle = waapiProvider.animate({ target, keyframes: [{ scaleX: 0.5, scaleY: 2 }, { scaleX: 1, scaleY: 1 }], timing: { duration: 1000, easing: 'linear' } });
    handle.pause();
    handle.seek(0);
    expect(scaleOf(target)).toEqual([0.5, 2]);
    handle.seek(1000);
    expect(scaleOf(target)).toEqual([1, 1]);
    handle.cancel();
    target.remove();
  });

  it('writes no inline scale and leaves no animation when commit is false', async () => {
    const target = document.createElement('div');
    document.body.append(target);
    const handle = waapiProvider.animate({ target, keyframes: [{ scaleX: 0 }, { scaleX: 1 }], timing: { duration: 40, easing: 'linear' }, commit: false });
    expect(await handle.finished).toBe('finished');
    expect(target.style.scale).toBe('');
    expect(target.getAnimations()).toHaveLength(0);
    target.remove();
  });

  it('commits the final scale inline when commit is omitted', async () => {
    const target = document.createElement('div');
    document.body.append(target);
    const handle = waapiProvider.animate({ target, keyframes: [{ scaleX: 0 }, { scaleX: 1 }], timing: { duration: 40, easing: 'linear' } });
    expect(await handle.finished).toBe('finished');
    expect(scaleOf(target)).toEqual([1, 1]);
    target.remove();
  });
});

describe('waapi provider styles', () => {
  /** The top-left corner radius of `element` in px, horizontal then vertical. */
  const cornerOf = (element: HTMLElement): number[] => {
    const [h, v = h] = getComputedStyle(element).borderTopLeftRadius.split(' ').map((value) => parseFloat(value));
    return [h, v];
  };

  it('applies the extra declarations of each keyframe with the visual fields', () => {
    const target = document.createElement('div');
    document.body.append(target);
    const handle = waapiProvider.animate({
      target,
      keyframes: [{ scaleX: 1 }, { scaleX: 0.5 }],
      styles: [{ borderRadius: '32px 32px 32px 32px / 16px 16px 16px 16px' }, { borderRadius: '16px' }],
      timing: { duration: 1000, easing: 'linear' },
    });
    handle.pause();
    handle.seek(0);
    expect(cornerOf(target)).toEqual([32, 16]);
    expect(scaleOf(target)).toEqual([1, 1]);
    handle.seek(500);
    expect(cornerOf(target)[0]).toBeCloseTo(24, 0);
    handle.seek(1000);
    expect(cornerOf(target)).toEqual([16, 16]);
    expect(scaleOf(target)).toEqual([0.5, 1]);
    handle.cancel();
    target.remove();
  });

  it('refuses styles that do not have one entry per keyframe', () => {
    const target = document.createElement('div');
    document.body.append(target);
    expect(() => waapiProvider.animate({ target, keyframes: [{ opacity: 0 }, { opacity: 1 }], styles: [{ borderRadius: '1px' }], timing: { duration: 100, easing: 'linear' } })).toThrow(new RangeError('styles must match keyframes'));
    target.remove();
  });

  it('writes no inline declaration at the end when commit is false', async () => {
    const target = document.createElement('div');
    document.body.append(target);
    const handle = waapiProvider.animate({ target, keyframes: [{ scaleX: 1 }, { scaleX: 0.5 }], styles: [{ borderRadius: '16px' }, { borderRadius: '8px' }], timing: { duration: 40, easing: 'linear' }, commit: false });
    expect(await handle.finished).toBe('finished');
    expect(target.style.borderRadius).toBe('');
    expect(target.style.scale).toBe('');
    expect(target.getAnimations()).toHaveLength(0);
    target.remove();
  });

  it('commits the visual fields but not the extra declarations when commit is omitted', async () => {
    const target = document.createElement('div');
    target.style.borderRadius = '4px';
    document.body.append(target);
    const handle = waapiProvider.animate({ target, keyframes: [{ scaleX: 1 }, { scaleX: 0.5 }], styles: [{ borderRadius: '16px' }, { borderRadius: '8px' }], timing: { duration: 40, easing: 'linear' } });
    expect(await handle.finished).toBe('finished');
    expect(target.style.borderRadius).toBe('4px');
    expect(scaleOf(target)).toEqual([0.5, 1]);
    target.remove();
  });
});

describe.each([waapiProvider, animejsProvider, cssProvider])('$backend provider current time', (provider) => {
  it('reports the delay-inclusive time of a paused handle', () => {
    const target = document.createElement('div');
    document.body.append(target);
    const handle = provider.animate({ target, keyframes: [{ opacity: 0 }, { opacity: 1 }], timing: { duration: 400, delay: 600, easing: 'linear' } });
    handle.pause();
    handle.seek(700);
    expect(handle.currentTime).toBeCloseTo(700, 0);
    handle.cancel();
    target.remove();
  });

  it('keeps the time at which a handle was cancelled', async () => {
    const target = document.createElement('div');
    document.body.append(target);
    const handle = provider.animate({ target, keyframes: [{ opacity: 0 }, { opacity: 1 }], timing: { duration: 1000, easing: 'linear' } });
    handle.pause();
    handle.seek(300);
    handle.cancel();
    expect(await handle.finished).toBe('cancelled');
    expect(handle.currentTime).toBeCloseTo(300, 0);
    target.remove();
  });

  it('reports the end of the timeline once finished', async () => {
    const target = document.createElement('div');
    document.body.append(target);
    const handle = provider.animate({ target, keyframes: [{ opacity: 0 }, { opacity: 1 }], timing: { duration: 40, easing: 'linear' } });
    expect(await handle.finished).toBe('finished');
    expect(handle.currentTime).toBeCloseTo(40, 0);
    target.remove();
  });
});

describe.each([animejsProvider, cssProvider])('$backend provider refusals', (provider) => {
  it('refuses scaleX and scaleY explicitly', () => {
    const target = document.createElement('div');
    document.body.append(target);
    expect(() => provider.animate({ target, keyframes: [{ scaleX: 0 }, { scaleX: 1 }], timing: { duration: 100, easing: 'linear' } })).toThrow(new RangeError('Unsupported by this provider: scaleX/scaleY'));
    target.remove();
  });

  it('refuses styles explicitly', () => {
    const target = document.createElement('div');
    document.body.append(target);
    expect(() => provider.animate({ target, keyframes: [{ opacity: 0 }, { opacity: 1 }], styles: [{ borderRadius: '1px' }, { borderRadius: '2px' }], timing: { duration: 100, easing: 'linear' } })).toThrow(new RangeError('Unsupported by this provider: styles'));
    target.remove();
  });

  it('refuses commit: false explicitly', () => {
    const target = document.createElement('div');
    document.body.append(target);
    expect(() => provider.animate({ target, keyframes: [{ opacity: 0 }, { opacity: 1 }], timing: { duration: 100, easing: 'linear' }, commit: false })).toThrow(new RangeError('Unsupported by this provider: commit'));
    target.remove();
  });

  it('refuses an iteration count other than 1 explicitly', () => {
    const target = document.createElement('div');
    document.body.append(target);
    expect(() => provider.animate({ target, keyframes: [{ opacity: 0 }, { opacity: 1 }], timing: { duration: 100, easing: 'linear', iterations: Infinity } })).toThrow(new RangeError('Unsupported by this provider: iterations'));
    target.remove();
  });
});

describe('waapi provider iterations', () => {
  it('plays an infinite iteration count, and cancelling it settles as cancelled with nothing committed', async () => {
    const target = document.createElement('div');
    document.body.append(target);
    const handle = waapiProvider.animate({ target, keyframes: [{ opacity: 0 }, { opacity: 1 }], timing: { duration: 40, easing: 'linear', iterations: Infinity } });
    let finished = false;
    void handle.finished.then(() => { finished = true; });
    try {
      // Several iterations of 40 ms later, the animation is still running.
      await new Promise((resolve) => setTimeout(resolve, 150));
      expect(finished).toBe(false);
      expect(target.getAnimations()[0]?.effect?.getTiming().iterations).toBe(Infinity);
      handle.cancel();
      expect(await handle.finished).toBe('cancelled');
      expect(target.getAnimations()).toHaveLength(0);
      expect(target.getAttribute('style')).toBeNull();
      expect(target.style.opacity).toBe('');
    } finally {
      handle.cancel();
      target.remove();
    }
  });
});

describe('waapi provider end frame', () => {
  it('a delayed animation ends in its last frame', async () => {
    const delays = [0, 50, 100, 150, 200];
    const items = delays.map(() => {
      const target = document.createElement('div');
      document.body.append(target);
      return target;
    });
    const handles = items.flatMap((target, index) => [
      waapiProvider.animate({ target, keyframes: [{ y: 16 }, { y: 0 }], timing: { duration: 120, easing: 'linear', delay: delays[index] } }),
      waapiProvider.animate({ target, keyframes: [{ opacity: 0 }, { opacity: 1 }], timing: { duration: 60, easing: 'linear', delay: delays[index] } }),
    ]);
    try {
      await Promise.all(handles.map((handle) => handle.finished));
      for (const target of items) {
        expect.soft(target.style.opacity).toBe('1');
        expect.soft(['0px 0px', '0px']).toContain(target.style.translate);
        expect.soft(getComputedStyle(target).opacity).toBe('1');
        expect.soft(target.getAnimations()).toHaveLength(0);
      }
    } finally {
      items.forEach((target) => target.remove());
    }
  });

  it('a reversed animation ends in its first frame', async () => {
    const target = document.createElement('div');
    document.body.append(target);
    const handle = waapiProvider.animate({ target, keyframes: [{ opacity: 0 }, { opacity: 1 }], timing: { duration: 120, easing: 'linear' } });
    handle.seek(60);
    handle.reverse();
    expect(await handle.finished).toBe('finished');
    expect(target.style.opacity).toBe('0');
    target.remove();
  });

  it('a reversed single-keyframe animation writes nothing', async () => {
    const target = document.createElement('div');
    target.style.opacity = '0.5';
    document.body.append(target);
    const handle = waapiProvider.animate({ target, keyframes: [{ opacity: 1 }], timing: { duration: 120, easing: 'linear' } });
    handle.seek(60);
    handle.reverse();
    expect(await handle.finished).toBe('finished');
    expect(target.style.opacity).toBe('0.5');
    target.remove();
  });
});
