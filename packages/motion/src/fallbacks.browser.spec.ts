import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { motion, type MotionBinding } from './bind.js';
import { defineMotion } from './define-motion.js';
import { loadContinuous } from './feature-loader.js';
import { parallax, rise } from './presets.js';
import { createMotionPolicy } from './runtime-policy.js';
import { resolveSpring } from './tokens.js';

// Each test removes one feature of the browser it runs in, as an engine of an older version lacks it, and checks what the
// library does instead. The engines of the test run all have the features, so the removal is made in the page.

const nextFrame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
const normalized = (value: string) => value.replace(/\s+/g, '');

/** Every spring of the stylesheet, its generated `@import`s joined: the text a page would load from `motion.css`. */
async function stylesheetText(): Promise<string> {
  const files = ['/motion-springs.generated.css', '/motion-curves.generated.css', '/motion.css'];
  const texts = await Promise.all(files.map(async file => {
    const response = await fetch(file);
    if (!response.ok) throw new Error(`${file} did not load`);
    return response.text();
  }));
  return texts.map(text => text.replace(/^@import .*$/gm, '')).join('\n');
}

/** A document of its own, with `css` as its only stylesheet. */
function documentWith(css: string): HTMLIFrameElement {
  const frame = document.createElement('iframe');
  document.body.append(frame);
  const doc = frame.contentDocument!;
  doc.open();
  doc.write('<!doctype html><html><head></head><body></body></html>');
  doc.close();
  const style = doc.createElement('style');
  style.textContent = css;
  doc.head.append(style);
  return frame;
}

const valueOf = (frame: HTMLIFrameElement, name: string) =>
  frame.contentWindow!.getComputedStyle(frame.contentDocument!.documentElement).getPropertyValue(name).trim();

/** Replace a global of the page for the length of a test; `undefined` hides it. Returns what puts it back. */
function hide(name: 'ViewTimeline' | 'IntersectionObserver' | 'matchMedia'): () => void {
  const own = Object.getOwnPropertyDescriptor(window, name);
  Object.defineProperty(window, name, { configurable: true, writable: true, value: undefined });
  return () => {
    if (own) Object.defineProperty(window, name, own);
    else Reflect.deleteProperty(window, name);
  };
}

let page: HTMLElement;
let bindings: MotionBinding[];
let restores: Array<() => void>;

beforeAll(async () => {
  await loadContinuous();
});

beforeEach(() => {
  page = document.createElement('div');
  document.body.append(page);
  bindings = [];
  restores = [];
  window.scrollTo(0, 0);
});

afterEach(() => {
  for (const restore of restores.reverse()) restore();
  for (const binding of bindings) binding.destroy();
  page.remove();
  window.scrollTo(0, 0);
  delete document.documentElement.dataset.motionPolicy;
});

/** A tall page: the window can scroll, and an element can sit below the fold. */
function scrollablePage(): { before: HTMLElement; after: HTMLElement } {
  const before = document.createElement('div');
  before.style.height = '2000px';
  const after = document.createElement('div');
  after.style.cssText = 'height: 60px; width: 60px; background: currentColor;';
  page.append(before, after);
  return { before, after };
}

describe('without linear() in the browser', () => {
  it('the stylesheet keeps the cubic-bezier fallback of each spring token, which is the one the tokens resolve to', async () => {
    const css = await stylesheetText();
    const supported = documentWith(css);
    const unsupported = documentWith(css.replace('@supports (animation-timing-function: linear(0, 1))', '@supports (animation-timing-function: not-a-timing(0))'));
    try {
      const name = '--udx-motion-spring-fast-spatial-easing';
      expect(valueOf(supported, name)).toMatch(/^linear\(/);
      const fallback = resolveSpring('spring.fast.spatial', { scheme: 'expressive', support: { linear: false, fallback: true } });
      expect(normalized(valueOf(unsupported, name))).toBe(normalized(fallback.easing));
      expect(valueOf(unsupported, '--udx-motion-spring-fast-spatial-duration')).toBe(`${fallback.duration}ms`);
    } finally {
      supported.remove();
      unsupported.remove();
    }
  });

  it('a spring whose linear() the browser refuses plays its cubic-bezier fallback, with the fallback duration', async () => {
    const timing = 'spring.slow.effects';
    const expected = resolveSpring(timing, { scheme: 'expressive', support: { linear: false, fallback: true } });
    const refuses = (options: unknown) =>
      typeof options === 'object' && options !== null && typeof (options as KeyframeEffectOptions).easing === 'string' &&
      (options as KeyframeEffectOptions).easing!.startsWith('linear(');
    const NativeEffect = window.KeyframeEffect;
    const nativeAnimate = Element.prototype.animate;
    class RefusingEffect extends NativeEffect {
      constructor(target: Element, frames: Keyframe[] | PropertyIndexedKeyframes | null, options?: number | KeyframeEffectOptions) {
        if (refuses(options)) throw new TypeError('linear() is not an easing function in this browser');
        super(target, frames, options);
      }
    }
    const effectDescriptor = Object.getOwnPropertyDescriptor(window, 'KeyframeEffect')!;
    Object.defineProperty(window, 'KeyframeEffect', { configurable: true, writable: true, value: RefusingEffect });
    Element.prototype.animate = function animateRefusing(this: Element, keyframes: Keyframe[] | PropertyIndexedKeyframes | null, options?: number | KeyframeEffectOptions) {
      if (refuses(options)) throw new TypeError('linear() is not an easing function in this browser');
      return nativeAnimate.call(this, keyframes, options);
    } as typeof nativeAnimate;
    restores.push(() => {
      Element.prototype.animate = nativeAnimate;
      Object.defineProperty(window, 'KeyframeEffect', effectDescriptor);
    });
    const target = document.createElement('div');
    page.append(target);
    const ref = defineMotion('fallback-spring-refused', { verb: 'emphasize', keyframes: [{ scale: 1 }, { scale: 1.1 }, { scale: 1 }], timing });
    const binding = motion(target, ref);
    bindings.push(binding);
    const handle = binding.play();
    const [animation] = target.getAnimations();
    expect(animation).toBeDefined();
    const timingOfPlay = animation.effect!.getTiming();
    expect(normalized(String(timingOfPlay.easing))).toBe(normalized(expected.easing));
    expect(Number(timingOfPlay.duration)).toBe(expected.duration);
    expect(await handle.finished).toBe('finished');
  });

  it('a spring whose linear() the browser accepts plays that linear() curve', async () => {
    const target = document.createElement('div');
    page.append(target);
    const ref = defineMotion('fallback-spring-accepted', { verb: 'emphasize', keyframes: [{ scale: 1 }, { scale: 1.1 }, { scale: 1 }], timing: 'spring.fast.effects' });
    const binding = motion(target, ref);
    bindings.push(binding);
    const handle = binding.play();
    const [animation] = target.getAnimations();
    expect(String(animation.effect!.getTiming().easing)).toMatch(/^linear\(/);
    expect(await handle.finished).toBe('finished');
  });
});

describe('without ViewTimeline', () => {
  it('a scrub stays in its stylesheet state at every scroll position, and a missing position leaves nothing inline', async () => {
    const { after } = scrollablePage();
    const restore = hide('ViewTimeline');
    try {
      const binding = motion(after, parallax);
      bindings.push(binding);
      const before = getComputedStyle(after).transform;
      expect(after.getAnimations()).toHaveLength(0);
      for (const y of [0, 800, 1600, 800]) {
        window.scrollTo(0, y);
        await nextFrame();
        expect(after.getAnimations()).toHaveLength(0);
        expect(getComputedStyle(after).transform).toBe(before);
        expect(after.getAttribute('style') ?? '').not.toMatch(/translate|transform/);
      }
      binding.destroy();
      expect(() => binding.destroy()).not.toThrow();
    } finally {
      restore();
    }
  });
});

describe('without IntersectionObserver', () => {
  it('a reveal plays to its end state, at once, rather than waiting in its first frame for a view it cannot watch', async () => {
    const { after } = scrollablePage();
    const restore = hide('IntersectionObserver');
    try {
      const binding = motion(after, rise);
      bindings.push(binding);
      await nextFrame();
      await Promise.all(after.getAnimations().map(animation => animation.finished));
      await nextFrame();
      expect(getComputedStyle(after).opacity).toBe('1');
      expect(after.getAnimations()).toHaveLength(0);
    } finally {
      restore();
    }
  });
});

describe('without @property', () => {
  it('the tokens keep their :root values, and reduced motion still sets the scale to 0', async () => {
    const css = (await stylesheetText()).replace(/@property\s+[\w-]+\s*\{[^}]*\}/g, '');
    expect(css).not.toMatch(/@property\s+--/);
    const frame = documentWith(css);
    try {
      expect(valueOf(frame, '--udx-motion-scale')).toBe('1');
      expect(valueOf(frame, '--udx-motion-distance-md')).toBe('24px');
      expect(valueOf(frame, '--udx-motion-stagger-max')).toBe('400ms');
      frame.contentDocument!.documentElement.dataset.motionPolicy = 'reduce';
      expect(valueOf(frame, '--udx-motion-scale')).toBe('0');
    } finally {
      frame.remove();
    }
  });
});

describe('without matchMedia', () => {
  it('the policy is not reduced unless the document asks for it', async () => {
    const restore = hide('matchMedia');
    const policy = createMotionPolicy();
    try {
      policy.retain();
      expect(policy.reduced).toBe(false);
      document.documentElement.dataset.motionPolicy = 'reduce';
      // The document attribute is read by an observer: its change is applied one frame later.
      await nextFrame();
      expect(policy.reduced).toBe(true);
    } finally {
      policy.release();
      restore();
    }
  });
});
