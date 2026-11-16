import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { animateStyle } from './animate.js';
import type { MotionHandle } from './contract.js';
import { resolveWaapiTiming } from './play.js';
import { createSpring, type SpringNumber } from './spring-number.js';

/** A length of the computed style, in px. */
const px = (element: Element, property: string) => parseFloat(getComputedStyle(element).getPropertyValue(property));

/**
 * Pauses a motion at a share of its duration, delay included: the computed style then shows that moment. The default spring
 * crosses its target near half its duration, so the "between" checks freeze a quarter of the way.
 */
function freeze(handle: MotionHandle, share: number): void {
  handle.pause();
  handle.seek(handle.delay + handle.duration * share);
}

let target: HTMLElement;
let mounted: Element[];
let springs: SpringNumber[];

/** A spring that the afterEach stops, so that no frame outlives its test. */
function track(spring: SpringNumber): SpringNumber {
  springs.push(spring);
  return spring;
}

beforeEach(() => {
  target = document.createElement('div');
  document.body.append(target);
  mounted = [target];
  springs = [];
});

afterEach(() => {
  for (const spring of springs.splice(0)) spring.stop();
  for (const node of mounted.splice(0)) node.remove();
  delete document.documentElement.dataset.motionPolicy;
  document.documentElement.style.removeProperty('--udx-motion');
  vi.restoreAllMocks();
});

/** Makes the target an inline box whose content is a block of `width` px: its auto width is that width. */
function inlineBoxOf(width: number): void {
  target.style.display = 'inline-block';
  const content = document.createElement('div');
  content.style.width = `${width}px`;
  content.style.height = '10px';
  target.append(content);
}

describe('animateStyle', () => {
  it('tweens a border radius from its computed value, and leaves its last frame inline', async () => {
    target.style.borderRadius = '8px';
    const handle = animateStyle(target, { borderRadius: '24px' });
    freeze(handle, 0.25);
    const middle = px(target, 'border-top-left-radius');
    expect(middle).toBeGreaterThan(8);
    expect(middle).toBeLessThan(24);
    handle.play();
    expect(await handle.finished).toBe('finished');
    expect(target.style.borderRadius).toBe('24px');
    expect(target.getAnimations()).toHaveLength(0);
  });

  it('measures an auto width, ends at the content width with no inline width, and then grows with its content', async () => {
    inlineBoxOf(200);
    target.style.width = '0px';
    const handle = animateStyle(target, { width: 'auto' });
    freeze(handle, 0.25);
    const middle = px(target, 'width');
    expect(middle).toBeGreaterThan(0);
    expect(middle).toBeLessThan(200);
    handle.play();
    expect(await handle.finished).toBe('finished');
    expect(target.style.width).toBe('');
    expect(target.getBoundingClientRect().width).toBe(200);
    (target.firstElementChild as HTMLElement).style.width = '320px';
    expect(target.getBoundingClientRect().width).toBe(320);
  });

  it('leaves no inline value for a property whose last frame is null', async () => {
    target.style.opacity = '0.5';
    const handle = animateStyle(target, [{ opacity: 0 }, { opacity: null }], { timing: { duration: 40, easing: 'linear' } });
    expect(await handle.finished).toBe('finished');
    expect(target.style.opacity).toBe('');
  });

  it('measures the content width of a padded box, not its border box', () => {
    inlineBoxOf(200);
    target.style.padding = '10px';
    target.style.width = '0px';
    const handle = animateStyle(target, { width: 'auto' });
    // The last frame of the motion holds the measured width: the content width, without the 20 px of padding.
    freeze(handle, 1);
    expect(px(target, 'width')).toBe(200);
    handle.cancel();
  });

  it('starts an interrupted motion from the size the element has at that moment', async () => {
    target.style.width = '0px';
    const first = animateStyle(target, { width: '200px' });
    freeze(first, 0.25);
    const before = px(target, 'width');
    expect(before).toBeGreaterThan(0);
    expect(before).toBeLessThan(200);
    const second = animateStyle(target, { width: '0px' });
    freeze(second, 0);
    expect(Math.abs(px(target, 'width') - before)).toBeLessThanOrEqual(1);
    expect(await first.finished).toBe('cancelled');
    second.cancel();
    expect(await second.finished).toBe('cancelled');
  });

  it('lasts the duration of a spring token, routed as the verbs route it', () => {
    const route = resolveWaapiTiming(target, 'spring.fast.effects', 'expressive');
    if (route === null) throw new Error('the spring has no route in this browser');
    const handle = animateStyle(target, { opacity: 0.5 }, { timing: 'spring.fast.effects' });
    expect(handle.duration).toBe(route.duration);
    expect(target.getAnimations()[0].effect?.getTiming().duration).toBe(route.duration);
    handle.cancel();
  });

  it('plays a raw timing as given, and cancel() stops a loop', async () => {
    const handle = animateStyle(target, [{ opacity: 0 }, { opacity: 1 }], { timing: { duration: 1500, easing: 'linear' }, iterations: Infinity });
    expect(handle.duration).toBe(1500);
    expect(target.getAnimations()).toHaveLength(1);
    expect(target.getAnimations()[0].effect?.getComputedTiming().iterations).toBe(Infinity);
    handle.cancel();
    expect(await handle.finished).toBe('cancelled');
    expect(target.getAnimations()).toHaveLength(0);
  });

  it('writes the first frame of a loop under reduced motion, and runs nothing', async () => {
    document.documentElement.dataset.motionPolicy = 'reduce';
    const handle = animateStyle(target, [{ opacity: 0 }, { opacity: 1 }], { timing: { duration: 1500, easing: 'linear' }, iterations: Infinity });
    expect(handle.duration).toBe(0);
    expect(target.getAnimations()).toHaveLength(0);
    expect(target.style.opacity).toBe('0');
    expect(await handle.finished).toBe('finished');
  });

  it('settles at its last frame when --udx-motion is none on an ancestor', async () => {
    const parent = document.createElement('section');
    parent.style.setProperty('--udx-motion', 'none');
    document.body.append(parent);
    mounted.push(parent);
    parent.append(target);
    target.style.opacity = '0';
    const handle = animateStyle(target, { opacity: 1 });
    expect(target.getAnimations()).toHaveLength(0);
    expect(target.style.opacity).toBe('1');
    expect(await handle.finished).toBe('finished');
  });

  it('waits its delay before it moves, and reports the delay in its handle', () => {
    target.style.width = '0px';
    const handle = animateStyle(target, { width: '200px' }, { delay: 120, timing: { duration: 1000, easing: 'linear' } });
    expect(handle.delay).toBe(120);
    expect(handle.duration).toBe(1000);
    handle.pause();
    handle.seek(60);
    expect(handle.currentTime).toBeCloseTo(60);
    expect(px(target, 'width')).toBe(0);
    // Half of the 1000 ms motion, after the 120 ms delay: the currentTime includes the delay.
    handle.seek(620);
    expect(handle.currentTime).toBeCloseTo(620);
    expect(Math.abs(px(target, 'width') - 100)).toBeLessThanOrEqual(1);
    handle.cancel();
  });

  it('places each keyframe at its offset along the motion', () => {
    const handle = animateStyle(
      target,
      [{ offset: 0, width: '0px' }, { offset: 0.5, width: '100px' }, { offset: 1, width: '40px' }],
      { timing: { duration: 1000, easing: 'linear' } },
    );
    handle.pause();
    handle.seek(handle.duration / 2);
    expect(Math.abs(px(target, 'width') - 100)).toBeLessThanOrEqual(1);
    handle.cancel();
  });

  it('interpolates a custom property once it is registered', () => {
    CSS.registerProperty({ name: '--udx-probe', syntax: '<length>', inherits: false, initialValue: '0px' });
    target.style.setProperty('--udx-probe', '0px');
    const handle = animateStyle(target, { '--udx-probe': '100px' });
    freeze(handle, 0.25);
    const middle = px(target, '--udx-probe');
    expect(middle).toBeGreaterThan(0);
    expect(middle).toBeLessThan(100);
    handle.cancel();
  });
});

describe('createSpring', () => {
  it('moves a number to its target, and reports the rest on it once', async () => {
    const updates: number[] = [];
    const onRest = vi.fn();
    const arrived = new Promise<number>(resolve => onRest.mockImplementation(resolve));
    const spring = track(createSpring(0, { onUpdate: value => updates.push(value), onRest }));
    spring.to(100);
    expect(await arrived).toBe(100);
    expect(onRest).toHaveBeenCalledTimes(1);
    expect(spring.value).toBe(100);
    expect(spring.velocity).toBe(0);
    expect(updates.length).toBeGreaterThan(1);
    expect(updates.at(-1)).toBe(100);
  });

  it('keeps its velocity when the target changes mid-move', async () => {
    let onFrame: ((value: number) => void) | undefined;
    let onMoving: ((value: number) => void) | undefined;
    const moving = new Promise<number>(resolve => { onMoving = resolve; });
    const spring = track(createSpring(0, {
      onUpdate: value => {
        onFrame?.(value);
        if (value > 5) onMoving?.(value);
      },
    }));
    spring.to(100);
    expect(await moving).toBeLessThan(50);
    const before = spring.value;
    spring.to(50);
    expect(spring.velocity).toBeGreaterThan(0);
    const next = new Promise<number>(resolve => { onFrame = resolve; });
    expect(await next).toBeGreaterThan(before);
  });

  it('stops where it is, at rest', async () => {
    let onMoving: ((value: number) => void) | undefined;
    const moving = new Promise<number>(resolve => { onMoving = resolve; });
    const spring = track(createSpring(0, { onUpdate: value => { if (value > 5) onMoving?.(value); } }));
    spring.to(100);
    const seen = await moving;
    spring.stop();
    expect(spring.value).toBe(seen);
    expect(spring.velocity).toBe(0);
  });

  it('reaches its target at once under reduced motion', () => {
    document.documentElement.dataset.motionPolicy = 'reduce';
    const onUpdate = vi.fn();
    const onRest = vi.fn();
    const spring = track(createSpring(0, { onUpdate, onRest }));
    spring.to(100);
    expect(spring.value).toBe(100);
    expect(spring.velocity).toBe(0);
    expect(onUpdate).toHaveBeenLastCalledWith(100);
    expect(onRest).toHaveBeenCalledWith(100);
  });

  it('reaches its target at once when --udx-motion is none on the document', () => {
    document.documentElement.style.setProperty('--udx-motion', 'none');
    const onRest = vi.fn();
    const spring = track(createSpring(0, { onUpdate: () => undefined, onRest }));
    spring.to(40);
    expect(spring.value).toBe(40);
    expect(onRest).toHaveBeenCalledWith(40);
  });
});
