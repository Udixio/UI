import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { morph } from './morph.js';
import { getMotionRuntime, retainMotionRuntime } from './runtime.js';
import { resolveSpring } from './tokens.js';

const SQUARE = 'M50 50 L150 50 L150 150 L50 150 Z';
const TRIANGLE = 'M100 40 L170 170 L30 170 Z';
const runtime = getMotionRuntime({ development: true });

let root: HTMLElement;
let releaseRuntime: () => void;

/** The first element matching `selector` under the test root, typed by the caller. */
function one<T extends Element>(selector: string): T {
  const found = root.querySelector<T>(selector);
  if (!found) throw new Error(`no element matches ${selector}`);
  return found;
}

beforeEach(() => {
  releaseRuntime = retainMotionRuntime(runtime);
  root = document.createElement('div');
  document.body.append(root);
  root.innerHTML = `<svg viewBox="0 0 300 300" width="300" height="300"><path id="p" d="${SQUARE}"/></svg>`;
});

afterEach(() => {
  root.remove();
  delete document.documentElement.dataset.motionPolicy;
  releaseRuntime();
});

describe('morph', () => {
  it('morphs a square into a triangle: halfway the shape is neither, and at the end it is the triangle', async () => {
    const path = one<SVGPathElement>('#p');
    const handle = morph(path, TRIANGLE);
    handle.pause();
    handle.seek(handle.duration / 2);
    const middle = path.getAttribute('d');
    expect(middle).not.toBe(SQUARE);
    expect(middle).not.toBe(TRIANGLE);
    handle.play();
    expect(await handle.finished).toBe('finished');
    expect(path.getAttribute('d')).toBe(TRIANGLE);
  });

  it('morphs into another path element, and its handle reports anime.js, never rejects, and has no velocity', async () => {
    root.innerHTML += `<svg viewBox="0 0 300 300" width="300" height="300"><path id="t" d="${TRIANGLE}"/></svg>`;
    const path = one<SVGPathElement>('#p');
    const handle = morph(path, one<SVGPathElement>('#t'));
    expect(handle.backend).toBe('animejs');
    expect(handle.delay).toBe(0);
    expect(handle.duration).toBeGreaterThan(0);
    expect(handle.velocity).toEqual({ value: 0, source: 'unavailable' });
    expect(await handle.finished).toBe('finished');
    expect(path.getAttribute('d')).toBe(TRIANGLE);
  });

  it('plays a curve timing on its duration, and a spring on the duration of its anime.js fallback', () => {
    const path = one<SVGPathElement>('#p');
    const curve = morph(path, TRIANGLE, { timing: { duration: 'duration.medium2', easing: 'easing.standard' } });
    expect(curve.duration).toBe(300);
    const spring = morph(path, TRIANGLE);
    expect(spring.duration).toBe(resolveSpring('spring.default.spatial', { scheme: 'expressive', support: { linear: false, fallback: true } }).duration);
    curve.cancel();
    spring.cancel();
  });

  it('under reduced motion, sets the shape at once and is already finished', async () => {
    document.documentElement.dataset.motionPolicy = 'reduce';
    const path = one<SVGPathElement>('#p');
    const handle = morph(path, TRIANGLE);
    expect(path.getAttribute('d')).toBe(TRIANGLE);
    expect(handle.duration).toBe(0);
    expect(await handle.finished).toBe('finished');
  });

  it('with --udx-motion: none, sets the shape at once', () => {
    const path = one<SVGPathElement>('#p');
    path.style.setProperty('--udx-motion', 'none');
    morph(path, TRIANGLE);
    expect(path.getAttribute('d')).toBe(TRIANGLE);
  });

  it('cancelled, resolves cancelled, leaves the shape where it is, and removes the temporary path', async () => {
    const path = one<SVGPathElement>('#p');
    const handle = morph(path, TRIANGLE);
    expect(root.querySelectorAll('path')).toHaveLength(2);
    handle.pause();
    handle.seek(handle.duration / 2);
    const before = path.getAttribute('d');
    handle.cancel();
    expect(await handle.finished).toBe('cancelled');
    expect(path.getAttribute('d')).toBe(before);
    expect(root.querySelectorAll('path')).toHaveLength(1);
  });

  it('removes the temporary path of a morph to a string when the morph ends', async () => {
    const path = one<SVGPathElement>('#p');
    const handle = morph(path, TRIANGLE);
    expect(await handle.finished).toBe('finished');
    expect(root.querySelectorAll('path')).toHaveLength(1);
  });

  it('refuses a path outside an SVG, which has no SVG to hold a temporary path', () => {
    const loose = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    expect(() => morph(loose, TRIANGLE)).toThrow(TypeError);
  });
});
