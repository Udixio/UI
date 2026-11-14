import { expect, it } from 'vitest';
import { cssProvider } from './css.js';
import { animejsProvider } from './animejs.js';
import { compareSamples, f2FadeSlide, runScenario } from '../testing/index.js';
import { defineTokens, resolveSpring } from '../tokens.js';
import type { SpringRef } from '../motion-spec.js';

it('uses a CSSAnimation and conforms to animejs for F2', async () => {
  const target = document.createElement('div'); document.body.append(target);
  const handle = cssProvider.animate({ target, ...f2FadeSlide.request });
  expect(target.getAnimations()[0].constructor.name).toBe('CSSAnimation');
  handle.cancel(); target.remove();
  const a = await runScenario(cssProvider, f2FadeSlide);
  const b = await runScenario(animejsProvider, f2FadeSlide);
  expect(compareSamples(a, b)).toEqual({ ok: true, failures: [] });
  for (const samples of [a, b]) {
    expect(samples[0].opacity).toBeCloseTo(0); expect(samples[0].y).toBeCloseTo(24);
    expect(samples[4].opacity).toBeCloseTo(1); expect(samples[4].y).toBeCloseTo(0);
  }
});

it('rejects invalid and detached requests without mutation', () => {
  const target = document.createElement('div');
  const request = { target, keyframes: [{ opacity: 0 }, { opacity: 1 }], timing: { duration: 100, easing: 'linear' } };
  expect(() => cssProvider.animate(request)).toThrow();
  document.body.append(target);
  expect(() => cssProvider.animate({ ...request, keyframes: [{ opacity: 0 }] })).toThrow();
  expect(target.getAttribute('style')).toBeNull();
  expect(cssProvider.activeCount()).toBe(0); target.remove();
});

it('seeks through delay, resumes and persists a natural endpoint', async () => {
  const target = document.createElement('div'); document.body.append(target);
  const handle = cssProvider.animate({ target, keyframes: [{ opacity: 0 }, { opacity: 1 }], timing: { duration: 100, delay: 50, easing: 'linear' } });
  handle.pause(); handle.seek(100);
  expect(Number(getComputedStyle(target).opacity)).toBeCloseTo(0.5, 1);
  handle.play(); expect(await handle.finished).toBe('finished');
  expect(Number(getComputedStyle(target).opacity)).toBeCloseTo(1);
  expect(target.getAnimations()).toHaveLength(0); expect(cssProvider.activeCount()).toBe(0);
  handle.cancel(); handle.play(); handle.seek(0); expect(Number(getComputedStyle(target).opacity)).toBeCloseTo(1); target.remove();
});

it('reverses to the initial endpoint and cancels only once', async () => {
  const target = document.createElement('div'); document.body.append(target);
  const handle = cssProvider.animate({ target, keyframes: [{ opacity: 0 }, { opacity: 1 }], timing: { duration: 100, easing: 'linear' } });
  handle.pause(); handle.seek(50); handle.reverse();
  expect(await handle.finished).toBe('finished'); expect(Number(getComputedStyle(target).opacity)).toBeCloseTo(0);
  handle.cancel(); expect(cssProvider.activeCount()).toBe(0); target.remove();
});

it('preserves a foreign CSSAnimation identity, state and progression on rejection', async () => {
  const style = document.createElement('style'); style.textContent = '@keyframes foreign-motion { from { opacity: 0 } to { opacity: 1 } }'; document.head.append(style);
  const target = document.createElement('div'); target.style.animation = 'foreign-motion 2s linear'; document.body.append(target);
  const foreign = target.getAnimations()[0] as CSSAnimation;
  expect(foreign.constructor.name).toBe('CSSAnimation');
  foreign.pause(); foreign.currentTime = 500;
  const before = getComputedStyle(target).opacity;
  const request = { target, keyframes: [{ opacity: 0 }, { opacity: 1 }], timing: { duration: 100, easing: 'linear' } };
  expect(() => cssProvider.animate(request)).toThrow();
  expect(target.getAnimations()[0]).toBe(foreign); expect(foreign.playState).toBe('paused');
  expect(foreign.currentTime).toBe(500); expect(getComputedStyle(target).opacity).toBe(before);
  foreign.play(); await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  expect(Number(foreign.currentTime)).toBeGreaterThan(500);
  foreign.cancel(); target.remove(); style.remove();
});

it('rejects important and shadow targets', () => {
  const target = document.createElement('div'); document.body.append(target);
  const request = { target, keyframes: [{ opacity: 0 }, { opacity: 1 }], timing: { duration: 100, easing: 'linear' } };
  target.style.setProperty('opacity', '0.5', 'important'); expect(() => cssProvider.animate(request)).toThrow();
  target.remove(); const host = document.createElement('div'); document.body.append(host);
  const shadowTarget = document.createElement('div'); host.attachShadow({ mode: 'open' }).append(shadowTarget);
  expect(() => cssProvider.animate({ ...request, target: shadowTarget })).toThrow(); host.remove();
});

it('rolls back when CSSOM rule insertion fails', () => {
  const target = document.createElement('div'); target.style.color = 'red'; document.body.append(target);
  const before = target.getAttribute('style'); const styles = document.head.querySelectorAll('style').length;
  const insert = CSSStyleSheet.prototype.insertRule;
  CSSStyleSheet.prototype.insertRule = () => { throw new DOMException('blocked', 'SecurityError'); };
  try {
    expect(() => cssProvider.animate({ target, keyframes: [{ opacity: 0 }, { opacity: 1 }], timing: { duration: 100, easing: 'linear' } })).toThrow();
    expect(target.getAttribute('style')).toBe(before); expect(target.getAnimations()).toHaveLength(0);
    expect(document.head.querySelectorAll('style')).toHaveLength(styles); expect(cssProvider.activeCount()).toBe(0);
  } finally { CSSStyleSheet.prototype.insertRule = insert; target.remove(); }
});

it('settles once when native finish and cancellation race', async () => {
  const target = document.createElement('div'); document.body.append(target);
  const handle = cssProvider.animate({ target, keyframes: [{ opacity: 0 }, { opacity: 1 }], timing: { duration: 100, easing: 'linear' } });
  target.getAnimations()[0].finish(); handle.cancel();
  expect(await handle.finished).toBe('cancelled'); await Promise.resolve();
  expect(cssProvider.activeCount()).toBe(0); expect(target.getAnimations()).toHaveLength(0);
  expect(target.style.opacity).toBe(''); target.remove();
});

it('cancels on external inline changes or detachment without overwriting them', async () => {
  for (const detach of [false, true]) {
    const target = document.createElement('div'); document.body.append(target);
    const handle = cssProvider.animate({ target, keyframes: [{ opacity: 0 }, { opacity: 1 }], timing: { duration: 1000, easing: 'linear' } });
    if (detach) target.remove(); else target.style.animationDuration = '2s';
    handle.pause(); expect(await handle.finished).toBe('cancelled');
    if (!detach) expect(target.style.animationDuration).toBe('2s');
    expect(cssProvider.activeCount()).toBe(0); target.remove();
  }
});

it('preserves an external write to an animated property before natural completion', async () => {
  const target = document.createElement('div'); document.body.append(target);
  const handle = cssProvider.animate({ target, keyframes: [{ opacity: 0 }, { opacity: 1 }], timing: { duration: 50, easing: 'linear' } });
  target.style.opacity = '0.4';
  expect(await handle.finished).toBe('cancelled'); expect(target.style.opacity).toBe('0.4'); target.remove();
});

it('rejects an endpoint masked by an important author rule', () => {
  const style = document.createElement('style'); style.textContent = '.masked-motion { opacity: .5 !important }'; document.head.append(style);
  const target = document.createElement('div'); target.className = 'masked-motion'; document.body.append(target);
  expect(() => cssProvider.animate({ target, keyframes: [{ opacity: 0 }, { opacity: 1 }], timing: { duration: 100, easing: 'linear' } })).toThrow();
  expect(cssProvider.activeCount()).toBe(0); expect(target.getAnimations()).toHaveLength(0); target.remove(); style.remove();
});

it.each([
  [[{ opacity: 0 }, { opacity: 0 }]],
  [[{ opacity: 0, x: 0 }, { opacity: 0, x: 10 }]],
])('rejects a masked property shared by both endpoints', (keyframes) => {
  const style = document.createElement('style'); style.textContent = '.masked-constant-motion { opacity: .5 !important }'; document.head.append(style);
  const target = document.createElement('div'); target.className = 'masked-constant-motion'; document.body.append(target);
  try {
    expect(() => cssProvider.animate({ target, keyframes, timing: { duration: 100, easing: 'linear' } })).toThrow();
    expect(target.getAnimations()).toHaveLength(0); expect(cssProvider.activeCount()).toBe(0);
  } finally { target.remove(); style.remove(); }
});

it('accepts equal unmasked endpoints', async () => {
  const target = document.createElement('div'); document.body.append(target);
  const handle = cssProvider.animate({ target, keyframes: [{ opacity: 0 }, { opacity: 0 }], timing: { duration: 50, easing: 'linear' } });
  expect(await handle.finished).toBe('finished'); expect(Number(getComputedStyle(target).opacity)).toBeCloseTo(0); target.remove();
});

it('settles native cancellation and a removed CSS animation', async () => {
  for (const removal of ['native', 'display', 'name'] as const) {
    const target = document.createElement('div'); document.body.append(target);
    const handle = cssProvider.animate({ target, keyframes: [{ opacity: 0 }, { opacity: 1 }], timing: { duration: 1000, easing: 'linear' } });
    if (removal === 'native') target.getAnimations()[0].cancel();
    if (removal === 'display') target.style.display = 'none';
    if (removal === 'name') target.style.animationName = 'none';
    handle.pause(); expect(await handle.finished).toBe('cancelled');
    expect(cssProvider.activeCount()).toBe(0); target.remove();
  }
});

it('falls back to explicit endpoint styles when commitStyles fails', async () => {
  const target = document.createElement('div'); target.style.color = 'red'; document.body.append(target);
  const handle = cssProvider.animate({ target, keyframes: [{ opacity: 0 }, { opacity: 1 }], timing: { duration: 50, easing: 'linear' } });
  const animation = target.getAnimations()[0]; animation.commitStyles = () => { throw new Error('unsupported'); };
  expect(await handle.finished).toBe('finished'); expect(target.style.opacity).toBe('1'); expect(target.style.color).toBe('red'); target.remove();
});

it('persists the validated endpoint when commitStyles silently writes the wrong value', async () => {
  const target = document.createElement('div'); document.body.append(target);
  const handle = cssProvider.animate({ target, keyframes: [{ opacity: 0 }, { opacity: 1 }], timing: { duration: 50, easing: 'linear' } });
  target.getAnimations()[0].commitStyles = () => { target.style.opacity = '0'; };
  expect(await handle.finished).toBe('finished'); expect(Number(getComputedStyle(target).opacity)).toBeCloseTo(1); target.remove();
});

it('persists the initial endpoint when reverse playback commits the wrong value', async () => {
  const target = document.createElement('div'); document.body.append(target);
  const handle = cssProvider.animate({ target, keyframes: [{ opacity: 0 }, { opacity: 1 }], timing: { duration: 80, easing: 'linear' } });
  target.getAnimations()[0].commitStyles = () => { target.style.opacity = '1'; };
  handle.pause(); handle.seek(40); handle.reverse();
  expect(await handle.finished).toBe('finished'); expect(Number(getComputedStyle(target).opacity)).toBeCloseTo(0); target.remove();
});

it('persists the step-start boundary when reverse playback commits the wrong value', async () => {
  const target = document.createElement('div'); document.body.append(target);
  const handle = cssProvider.animate({ target, keyframes: [{ opacity: 0 }, { opacity: 1 }], timing: { duration: 80, easing: 'step-start' } });
  target.getAnimations()[0].commitStyles = () => { target.style.opacity = '0'; };
  handle.pause(); handle.seek(40); handle.reverse();
  expect(await handle.finished).toBe('finished'); expect(Number(getComputedStyle(target).opacity)).toBeCloseTo(1); target.remove();
});

it.each([['steps(2, start)', 0.5], ['steps(2, jump-both)', 1 / 3]] as const)('supports the intermediate %s boundary at startup and on reverse', async (easing, boundary) => {
  const target = document.createElement('div'); document.body.append(target);
  const handle = cssProvider.animate({ target, keyframes: [{ opacity: 0 }, { opacity: 1 }], timing: { duration: 100, easing } });
  expect(Number(getComputedStyle(target).opacity)).toBeCloseTo(boundary);
  handle.pause(); handle.seek(75); handle.reverse();
  expect(await handle.finished).toBe('finished'); expect(Number(getComputedStyle(target).opacity)).toBeCloseTo(boundary); target.remove();
});

it('rejects malformed requests without modifying target styles', () => {
  const target = document.createElement('div'); document.body.append(target);
  const request = { target, keyframes: [{ opacity: 0 }, { opacity: 1 }], timing: { duration: 100, easing: 'linear' } };
  const invalid = [
    { ...request, keyframes: [{ opacity: 0 }, { y: 1 }] },
    { ...request, keyframes: [{ opacity: NaN }, { opacity: 1 }] },
    { ...request, timing: { duration: 0, easing: 'linear' } },
    { ...request, timing: { duration: 10, delay: -1, easing: 'linear' } },
    { ...request, timing: { duration: 10, easing: 'bad; color: red' } },
  ];
  for (const value of invalid) expect(() => cssProvider.animate(value)).toThrow();
  expect(target.getAttribute('style')).toBeNull(); expect(cssProvider.activeCount()).toBe(0); target.remove();
});

it.each(['linear(0.5, 1)', 'linear(0, 0.5)', 'cubic-bezier(var(--curve))', 'steps(var(--count))'])('rejects unsupported easing %s before mutation', (easing) => {
  const target = document.createElement('div'); document.body.append(target);
  const styles = document.head.querySelectorAll('style').length;
  expect(CSS.supports('animation-timing-function', easing)).toBe(true);
  expect(() => cssProvider.animate({ target, keyframes: [{ opacity: 0 }, { opacity: 1 }], timing: { duration: 100, easing } })).toThrow();
  expect(target.getAttribute('style')).toBeNull(); expect(target.getAnimations()).toHaveLength(0);
  expect(document.head.querySelectorAll('style')).toHaveLength(styles); expect(cssProvider.activeCount()).toBe(0); target.remove();
});

it.each([0, 50])('supports step-start with delay %s in forward and reverse playback', async (delay) => {
  const target = document.createElement('div'); document.body.append(target);
  const handle = cssProvider.animate({ target, keyframes: [{ opacity: 0 }, { opacity: 1 }], timing: { duration: 80, delay, easing: 'step-start' } });
  handle.pause(); handle.seek(delay + 40);
  expect(Number(getComputedStyle(target).opacity)).toBeCloseTo(1);
  handle.reverse(); expect(await handle.finished).toBe('finished');
  expect(Number(getComputedStyle(target).opacity)).toBeCloseTo(delay ? 0 : 1);
  expect(cssProvider.activeCount()).toBe(0); target.remove();
});

// Independent interpolation of the generated, explicitly positioned CSS stops.
function stops(easing: string): [number, number][] {
  return easing.slice(easing.indexOf('(') + 1, -1).split(',').map((stop) => {
    const parts = stop.trim().split(/\s+/);
    return [Number(parts[0]), Number.parseFloat(parts[1]) / 100];
  });
}
function interpolate(points: [number, number][], p: number): number {
  if (p <= points[0][1]) return points[0][0];
  for (let i = 1; i < points.length; i++) {
    const [value, position] = points[i]; const [previous, start] = points[i - 1];
    if (p <= position) return previous + (value - previous) * (p - start) / (position - start);
  }
  return points[points.length - 1][0];
}


// Invert the Bézier x coordinate independently, then evaluate its y coordinate.
function cubicBezierAt(easing: string, x: number): number {
  const [x1, y1, x2, y2] = easing.slice(easing.indexOf('(') + 1, -1).split(',').map(Number);
  const coordinate = (t: number, a: number, b: number) => 3 * (1 - t) ** 2 * t * a + 3 * (1 - t) * t ** 2 * b + t ** 3;
  let low = 0; let high = 1;
  for (let i = 0; i < 40; i++) {
    const t = (low + high) / 2;
    if (coordinate(t, x1, x2) < x) low = t; else high = t;
  }
  return coordinate((low + high) / 2, y1, y2);
}

const tokenCases = (['expressive', 'standard'] as const).flatMap((scheme) =>
  (['fast', 'default', 'slow'] as const).flatMap((speed) =>
    (['spatial', 'effects'] as const).map((role) => ({ scheme, speed, role, timing: defineTokens({ scheme }).spring[speed][role].linear }))));

it('deduplicates shared token easings across the twelve accesses', () => {
  expect(tokenCases).toHaveLength(12);
  expect(new Set(tokenCases.map(({ timing }) => timing.easing)).size).toBeLessThan(12);
});

it.each(tokenCases)('transports $scheme $speed $role stops through CSSOM', async ({ timing }) => {
  const target = document.createElement('div'); document.body.append(target);
  const points = stops(timing.easing); const delay = 35;
  const handle = cssProvider.animate({ target, keyframes: [{ x: 0 }, { x: 100 }], timing: { ...timing, delay } });
  try {
    expect(handle.duration).toBe(timing.duration);
    const serialized = stops(target.style.animationTimingFunction);
    expect(serialized).toHaveLength(points.length);
    points.forEach(([value, position], i) => {
      expect(Math.abs(serialized[i][0] - value)).toBeLessThan(0.00001);
      expect(Math.abs(serialized[i][1] - position)).toBeLessThan(0.00001);
    });
    handle.pause();
    for (const p of [0, 0.1, 0.25, 0.4, 0.6, 0.8, 1]) {
      handle.seek(delay + p * timing.duration);
      expect(Math.abs(parseFloat(getComputedStyle(target).translate) - 100 * interpolate(points, p))).toBeLessThan(0.1);
    }
  } finally { handle.cancel(); target.remove(); }
  expect(await handle.finished).toBe('cancelled');
  expect(cssProvider.activeCount()).toBe(0);
});

it('samples expressive spatial overshoot using the scenario harness', async () => {
  const timing = defineTokens().spring.default.spatial.linear; const points = stops(timing.easing);
  const peak = points.reduce((a, b) => a[0] > b[0] ? a : b);
  const samples = [0, 0.2, peak[1], 0.8, 1];
  const result = await runScenario(cssProvider, { name: 'I2 spring', family: 'I2', request: { keyframes: [{ x: 0 }, { x: 100 }], timing }, samples });
  expect(result[2].x).toBeGreaterThan(100);
  result.forEach((state, i) => expect(Math.abs(state.x - 100 * interpolate(points, samples[i]))).toBeLessThan(0.1));
});

it.each([0, 35])('finishes and persists a spring endpoint with delay %s', async (delay) => {
  const target = document.createElement('div'); document.body.append(target);
  const timing = defineTokens().spring.fast.spatial.linear;
  const handle = cssProvider.animate({ target, keyframes: [{ x: 0 }, { x: 100 }], timing: { ...timing, delay } });
  handle.pause(); handle.seek(delay + timing.duration); handle.play();
  expect(await handle.finished).toBe('finished');
  expect(parseFloat(getComputedStyle(target).translate)).toBeCloseTo(100, 1);
  expect(target.getAnimations()).toHaveLength(0); expect(cssProvider.activeCount()).toBe(0); target.remove();
});

it('rejects a recognized curve when target document CSS.supports returns false', () => {
  const target = document.createElement('div'); document.body.append(target);
  const css = target.ownerDocument.defaultView!.CSS; const original = css.supports;
  const styles = document.head.querySelectorAll('style').length;
  css.supports = () => false;
  try {
    expect(() => cssProvider.animate({ target, keyframes: [{ x: 0 }, { x: 100 }], timing: defineTokens().spring.fast.spatial.linear })).toThrow();
    expect(target.getAttribute('style')).toBeNull(); expect(target.getAnimations()).toHaveLength(0);
    expect(document.head.querySelectorAll('style')).toHaveLength(styles); expect(cssProvider.activeCount()).toBe(0);
  } finally { css.supports = original; target.remove(); }
});

it.each(['linear(0, 1)', 'var(--curve)', 'calc(1)', 'linear(0, 1)/*x*/', 'linear(0, 1); color:red', defineTokens().spring.fast.spatial.linear.easing.replace('0 0%', '0.0 0%')])('rejects unrecognized easing before mutation: %s', (easing) => {
  const target = document.createElement('div'); document.body.append(target);
  const styles = document.head.querySelectorAll('style').length;
  try {
    expect(() => cssProvider.animate({ target, keyframes: [{ x: 0 }, { x: 100 }], timing: { duration: 100, easing } })).toThrow();
    expect(target.getAttribute('style')).toBeNull(); expect(target.getAnimations()).toHaveLength(0);
    expect(document.head.querySelectorAll('style')).toHaveLength(styles); expect(cssProvider.activeCount()).toBe(0);
  } finally { target.remove(); }
});

it('reverses a token spring to its first frame and cleans up', async () => {
  const target = document.createElement('div'); document.body.append(target);
  const timing = defineTokens().spring.fast.spatial.linear;
  const count = document.head.querySelectorAll('style').length;
  const handle = cssProvider.animate({ target, keyframes: [{ x: 0 }, { x: 100 }], timing });
  handle.pause(); handle.seek(timing.duration / 2); handle.reverse();
  expect(await handle.finished).toBe('finished');
  expect(parseFloat(getComputedStyle(target).translate)).toBeCloseTo(0, 1);
  expect(target.getAnimations()).toHaveLength(0); expect(cssProvider.activeCount()).toBe(0);
  expect(document.head.querySelectorAll('style')).toHaveLength(count); target.remove();
});

it('restores conditionally after cancelling a token spring with a concurrent write', async () => {
  const target = document.createElement('div'); target.style.color = 'red'; document.body.append(target);
  const timing = defineTokens().spring.fast.spatial.linear;
  const count = document.head.querySelectorAll('style').length;
  const handle = cssProvider.animate({ target, keyframes: [{ x: 0 }, { x: 100 }], timing });
  handle.pause(); handle.seek(timing.duration / 2); target.style.animationDuration = '2s'; handle.cancel();
  expect(await handle.finished).toBe('cancelled'); expect(target.style.animationDuration).toBe('2s');
  expect(target.style.color).toBe('red'); expect(target.getAnimations()).toHaveLength(0);
  expect(cssProvider.activeCount()).toBe(0); expect(document.head.querySelectorAll('style')).toHaveLength(count); target.remove();
});

it('rejects a token spring on an animated or masked target without disturbing it', () => {
  const style = document.createElement('style');
  style.textContent = '@keyframes occupied-motion { from { opacity: 0 } to { opacity: 1 } } .spring-masked { translate: 50px !important }';
  document.head.append(style);
  const target = document.createElement('div'); document.body.append(target);
  const request = { target, keyframes: [{ x: 0 }, { x: 100 }], timing: defineTokens().spring.fast.spatial.linear };
  try {
    target.style.animation = 'occupied-motion 2s linear';
    const foreign = target.getAnimations()[0]; const before = target.getAttribute('style');
    expect(() => cssProvider.animate(request)).toThrow();
    expect(target.getAnimations()[0]).toBe(foreign); expect(target.getAttribute('style')).toBe(before);
    target.style.removeProperty('animation'); target.className = 'spring-masked';
    const styles = document.head.querySelectorAll('style').length;
    expect(() => cssProvider.animate(request)).toThrow();
    expect(target.getAnimations()).toHaveLength(0); expect(cssProvider.activeCount()).toBe(0);
    expect(document.head.querySelectorAll('style')).toHaveLength(styles);
  } finally { target.remove(); style.remove(); }
});

it.each(tokenCases)('executes resolved $scheme $speed $role pairs supported by the target document', async ({ scheme, speed, role }) => {
  const target = document.createElement('div'); document.body.append(target);
  const token = defineTokens({ scheme }).spring[speed][role];
  const ref = `spring.${speed}.${role}` as SpringRef;
  const css = target.ownerDocument.defaultView!.CSS;
  const actual = { linear: css.supports('animation-timing-function', token.linear.easing), fallback: css.supports('animation-timing-function', token.fallback.easing) };
  console.info(`spring support ${navigator.userAgent} ${scheme} ${speed} ${role}: ${JSON.stringify(actual)}`);
  try {
    if (!actual.linear) console.info(`linear path not exercised: unsupported by ${navigator.userAgent} for ${ref} (${scheme})`);
    if (!actual.fallback) console.info(`fallback path not exercised: unsupported by ${navigator.userAgent} for ${ref} (${scheme})`);
    for (const support of [actual, { ...actual, linear: false }]) {
      if (!support.linear && !support.fallback) continue;
      const { duration, easing, source } = resolveSpring(ref, { scheme, support });
      expect({ duration, easing }).toEqual(token[source]);
      const expectedMidpoint = source === 'linear' ? interpolate(stops(token.linear.easing), 0.5) : cubicBezierAt(token.fallback.easing, 0.5);
      const handle = cssProvider.animate({ target, keyframes: [{ x: 0 }, { x: 100 }], timing: { duration, easing, delay: 20 } });
      try {
        expect(handle.duration).toBe(duration);
        handle.pause(); handle.seek(20 + duration / 2);
        expect(Math.abs(parseFloat(getComputedStyle(target).translate) - 100 * expectedMidpoint)).toBeLessThan(0.1);
        handle.seek(20 + duration);
        expect(parseFloat(getComputedStyle(target).translate)).toBeCloseTo(100, 1);
        target.getAnimations()[0].finish();
        expect(await handle.finished).toBe('finished');
      } finally { handle.cancel(); }
    }
  } finally { target.remove(); }
});

it('rejects a stale linear capability before any mutation', () => {
  const target = document.createElement('div'); document.body.append(target);
  const css = target.ownerDocument.defaultView!.CSS; const original = css.supports;
  const timing = resolveSpring('spring.fast.spatial', { support: { linear: true, fallback: true } });
  const count = document.head.querySelectorAll('style').length;
  css.supports = () => false;
  try {
    expect(() => cssProvider.animate({ target, keyframes: [{ x: 0 }, { x: 100 }], timing: { duration: timing.duration, easing: timing.easing } })).toThrow();
    expect(target.getAttribute('style')).toBeNull(); expect(target.getAnimations()).toHaveLength(0);
    expect(document.head.querySelectorAll('style')).toHaveLength(count); expect(cssProvider.activeCount()).toBe(0);
  } finally { css.supports = original; target.remove(); }
});

it('uses the target document view for support and provider validation', () => {
  const iframe = document.createElement('iframe'); document.body.append(iframe);
  const globalSupports = window.CSS.supports; let globalCalls = 0;
  window.CSS.supports = () => { globalCalls++; return false; };
  try {
    const doc = iframe.contentDocument!; const view = doc.defaultView!;
    expect(view).not.toBe(window);
    const target = doc.createElement('div'); doc.body.append(target);
    const token = defineTokens().spring.fast.spatial;
    const support = { linear: view.CSS.supports('animation-timing-function', token.linear.easing), fallback: view.CSS.supports('animation-timing-function', token.fallback.easing) };
    if (!support.linear && !support.fallback) { console.info('iframe spring path not exercised: no supported easing'); return; }
    const { duration, easing } = resolveSpring('spring.fast.spatial', { support });
    const original = view.CSS.supports; let called = false;
    view.CSS.supports = ((property: string, value?: string) => { called = true; return value === undefined ? original(property) : original(property, value); }) as typeof original;
    try {
      const handle = cssProvider.animate({ target, keyframes: [{ x: 0 }, { x: 100 }], timing: { duration, easing } });
      expect(called).toBe(true); expect(globalCalls).toBe(0); handle.cancel();
    } finally { view.CSS.supports = original; }
  } finally { window.CSS.supports = globalSupports; iframe.remove(); }
});
