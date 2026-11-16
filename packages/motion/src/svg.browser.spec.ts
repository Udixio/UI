import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getMotion, motion } from './bind.js';
import { connectMotion } from './connect.js';
import { defineMotion, resolveMotion, validateMotionSpec } from './define-motion.js';
import { applyFrame, playMotion, releaseFrame } from './play.js';
import { loadText } from './feature-loader.js';
import { draw as drawPreset, fade } from './presets.js';
import { animejsProvider } from './providers/animejs.js';
import { getMotionRuntime, retainMotionRuntime } from './runtime.js';
import { prepareDraw, restoreDraw } from './svg-fields.js';

const runtime = getMotionRuntime({ development: true });
const forward = { direction: 'forward', carry: false, runtime } as const;
const drawIn = validateMotionSpec({ verb: 'appear', keyframes: [{ draw: 0 }, { draw: 1 }] });
const travel = validateMotionSpec({ verb: 'appear', keyframes: [{ along: 0 }, { along: 1 }] });

defineMotion('svg-fade', fade.spec);
defineMotion('svg-reflow', { verb: 'layout' });

let root: HTMLElement;
let releaseRuntime: () => void;
let disconnect: (() => void) | undefined;

/** The first element matching `selector` under the test root, typed by the caller. */
function one<T extends Element>(selector: string): T {
  const found = root.querySelector<T>(selector);
  if (!found) throw new Error(`no element matches ${selector}`);
  return found;
}

/** The computed stroke dash offset as a number: a fraction of the stroke when the shape has a pathLength of 1. */
const dashOffsetOf = (element: SVGElement) => Number.parseFloat(getComputedStyle(element).strokeDashoffset);

/** Whether each sample point along a shape (t from 0 to 1, at the centre of each sample) lies in its stroke. */
function strokeSamples(element: SVGGeometryElement, point: (t: number) => [number, number], count = 40): boolean[] {
  return Array.from({ length: count }, (_, index) => {
    const [x, y] = point((index + 0.5) / count);
    return element.isPointInStroke(new DOMPoint(x, y));
  });
}

/** The point at fraction `t` of a circle of radius 60 centred at (100, 280), from 3 o'clock clockwise on screen. */
const alongCircle = (t: number): [number, number] => [100 + 60 * Math.cos(2 * Math.PI * t), 280 + 60 * Math.sin(2 * Math.PI * t)];
/** The point at fraction `t` of a rect of 100 by 60 at (230, 230), from its top-left corner clockwise on screen. */
const alongRect = (t: number): [number, number] => {
  const p = t * 320;
  if (p < 100) return [230 + p, 230];
  if (p < 160) return [330, 230 + (p - 100)];
  if (p < 260) return [330 - (p - 160), 290];
  return [230, 290 - (p - 260)];
};

beforeEach(() => {
  releaseRuntime = retainMotionRuntime(runtime);
  root = document.createElement('div');
  document.body.append(root);
});

afterEach(() => {
  disconnect?.();
  disconnect = undefined;
  root.remove();
  releaseRuntime();
  vi.restoreAllMocks();
});

describe('draw', () => {
  it('draws a path from nothing to its whole stroke, then gives the stroke back to its author', async () => {
    root.innerHTML = '<svg viewBox="0 0 400 400" width="400" height="400"><path id="p" d="M20 20 L220 20" stroke="black" fill="none"/></svg>';
    const path = one<SVGPathElement>('#p');
    const handle = playMotion(path, drawIn, forward);
    handle.pause();
    handle.seek(handle.duration / 2);
    expect(path.getAttribute('pathLength')).toBe('1');
    expect(dashOffsetOf(path)).toBeGreaterThan(0);
    expect(dashOffsetOf(path)).toBeLessThan(1);
    handle.play();
    expect(await handle.finished).toBe('finished');
    expect(Math.abs(dashOffsetOf(path))).toBeLessThanOrEqual(0.001);
    // At rest, the fully drawn path keeps no dash inline: the author's stroke applies again.
    expect(path.style.strokeDasharray).toBe('');
    expect(path.style.strokeDashoffset).toBe('');
  });

  it('gives back the pathLength of its author, and the inline dash, when its binding is destroyed', () => {
    root.innerHTML = '<svg viewBox="0 0 400 400" width="400" height="400"><path id="p" d="M20 20 L220 20" pathLength="12"/></svg>';
    const path = one<SVGPathElement>('#p');
    const binding = motion(path, drawIn, { present: false });
    expect(path.getAttribute('pathLength')).toBe('1');
    // Firefox writes the unitless dash as 1px: its number is the fraction of the path.
    expect(Number.parseFloat(path.style.strokeDasharray)).toBe(1);
    binding.destroy();
    expect(path.getAttribute('pathLength')).toBe('12');
    expect(path.style.strokeDasharray).toBe('');
    expect(path.style.strokeDashoffset).toBe('');
  });

  it('gives back the pathLength of a path that had none', () => {
    root.innerHTML = '<svg viewBox="0 0 400 400" width="400" height="400"><path id="p" d="M20 20 L220 20"/></svg>';
    const path = one<SVGPathElement>('#p');
    prepareDraw(path);
    expect(path.getAttribute('pathLength')).toBe('1');
    restoreDraw(path);
    expect(path.hasAttribute('pathLength')).toBe(false);
  });

  it('draws a basic shape the way it draws a path: pathLength scales the dash of a circle and of a rect', () => {
    root.innerHTML = [
      '<svg viewBox="0 0 400 400" width="400" height="400">',
      '<circle id="c" cx="100" cy="280" r="60" stroke="black" stroke-width="6" fill="none"/>',
      '<rect id="r" x="230" y="230" width="100" height="60" stroke="black" stroke-width="6" fill="none"/>',
      '</svg>',
    ].join('');
    const circle = one<SVGCircleElement>('#c');
    const rect = one<SVGRectElement>('#r');
    for (const [shape, point] of [[circle, alongCircle], [rect, alongRect]] as const) {
      applyFrame(shape, { draw: 0.5 });
      expect(shape.getAttribute('pathLength')).toBe('1');
      const drawn = strokeSamples(shape, point);
      // The first half of the stroke is drawn (samples below t = 0.45), the second half is not (samples above t = 0.55).
      expect(drawn.slice(0, 18).every(Boolean)).toBe(true);
      expect(drawn.slice(22, 32).some(Boolean)).toBe(false);
      releaseFrame(shape, ['draw']);
      restoreDraw(shape);
    }
  });

  it('leaves an element that is neither a path nor a basic shape alone, with one development warning', () => {
    root.innerHTML = '<svg viewBox="0 0 400 400" width="400" height="400"><g id="g"/></svg>';
    const group = one<SVGGElement>('#g');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    applyFrame(group, { draw: 0.5 });
    applyFrame(group, { draw: 0.25 });
    expect(group.style.strokeDasharray).toBe('');
    expect(group.hasAttribute('pathLength')).toBe(false);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('starts a new motion from the stroke it has, with no jump', () => {
    root.innerHTML = '<svg viewBox="0 0 400 400" width="400" height="400"><path id="p" d="M20 20 L220 20" stroke="black" fill="none"/></svg>';
    const path = one<SVGPathElement>('#p');
    const first = playMotion(path, drawIn, forward);
    first.pause();
    first.seek(first.duration / 2);
    const before = dashOffsetOf(path);
    const second = playMotion(path, drawIn, { direction: 'backward', carry: true, runtime });
    expect(Math.abs(dashOffsetOf(path) - before)).toBeLessThan(0.02);
    first.cancel();
    second.cancel();
  });

  it('refuses a draw outside [0, 1] when a definition is defined', () => {
    expect(() => defineMotion('svg-draw-too-far', { verb: 'appear', keyframes: [{ draw: 0 }, { draw: 1.5 }] })).toThrow(TypeError);
    expect(() => defineMotion('svg-along-negative', { verb: 'appear', keyframes: [{ along: -0.1 }, { along: 1 }] })).toThrow(TypeError);
    expect(() => validateMotionSpec({ verb: 'appear', keyframes: [{ draw: 0 }, { draw: 1.5 }] })).toThrow('/spec/keyframes/1/draw: invalid_value');
  });

  it('defines the draw preset as an appear that draws from nothing', () => {
    expect(resolveMotion('draw')).toBe(drawPreset);
    expect(drawPreset.spec).toEqual({ verb: 'appear', keyframes: [{ draw: 0 }, { draw: 1 }] });
  });

  it('is refused by the anime.js provider, which cannot write the stroke', () => {
    root.innerHTML = '<svg viewBox="0 0 400 400" width="400" height="400"><path id="p" d="M20 20 L220 20"/></svg>';
    const path = one<SVGPathElement>('#p');
    expect(() => animejsProvider.animate({ target: path, keyframes: [{ draw: 0 }, { draw: 1 }], timing: { duration: 100, easing: 'linear' } })).toThrow(
      'Unsupported by this provider: draw/along',
    );
  });
});

describe('along', () => {
  it('moves an element along its offset path, and keeps the position at rest', async () => {
    root.innerHTML = '<div id="d" style="position:absolute;left:0;top:0;width:10px;height:10px;offset-path:path(\'M0 0 L100 0\')"></div>';
    const element = one<HTMLElement>('#d');
    const start = element.getBoundingClientRect().left;
    expect(await playMotion(element, travel, forward).finished).toBe('finished');
    expect(getComputedStyle(element).offsetDistance).toBe('100%');
    expect(Math.abs(element.getBoundingClientRect().left - start - 100)).toBeLessThan(1);
  });
});

describe('connectMotion on SVG', () => {
  it('binds the motion named by data-motion on an SVG element', () => {
    root.innerHTML = '<svg viewBox="0 0 400 400" width="400" height="400"><circle id="c" data-motion="svg-fade" cx="50" cy="50" r="20"/></svg>';
    disconnect = connectMotion({ root });
    expect(getMotion(one<SVGCircleElement>('#c'))?.verb).toBe('appear');
  });

  it('skips a layout motion named on an SVG element, with one development error', () => {
    root.innerHTML = '<svg viewBox="0 0 400 400" width="400" height="400"><circle id="c" data-motion="svg-reflow" cx="50" cy="50" r="20"/></svg>';
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    disconnect = connectMotion({ root, development: true });
    expect(getMotion(one<SVGCircleElement>('#c'))).toBeUndefined();
    expect(error).toHaveBeenCalledTimes(1);
  });

  it('refuses a layout motion bound by hand on an SVG element, before it replaces the binding there', () => {
    root.innerHTML = '<svg viewBox="0 0 400 400" width="400" height="400"><circle id="c" cx="50" cy="50" r="20"/></svg>';
    const circle = one<SVGCircleElement>('#c');
    expect(() => motion(circle, { verb: 'layout' })).toThrow(TypeError);
  });
});

describe('split on SVG', () => {
  it('plays a split definition whole on an SVG element, with one development warning', async () => {
    await loadText();
    root.innerHTML = '<svg viewBox="0 0 400 400" width="400" height="400"><text id="t" x="10" y="50">Hello</text></svg>';
    const text = one<SVGTextElement>('#t');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const binding = motion(text, { verb: 'appear', keyframes: [{ opacity: 0 }, { opacity: 1 }], split: 'chars' });
    expect(await binding.handle?.finished).toBe('finished');
    expect(text.style.opacity).toBe('');
    expect(getComputedStyle(text).opacity).toBe('1');
    expect(text.querySelector('[data-udx-piece]')).toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
    binding.destroy();
  });
});

// Draw ownership and reduced motion (step 8a-5): the pathLength of a shape belongs to the motions that draw it, and a
// reduced motion sets its draw at once, so that only the opacity fades.
describe('draw ownership and reduced motion', () => {
  it('keeps the pathLength and the dash of a shape that another motion still draws, when the first binding is destroyed', async () => {
    root.innerHTML = '<svg viewBox="0 0 400 400" width="400" height="400"><path id="p" d="M20 20 L220 20" pathLength="12"/></svg>';
    const path = one<SVGPathElement>('#p');
    const presence = motion(path, drawIn, { present: false });
    const emphasis = motion(path, { verb: 'emphasize', keyframes: [{ draw: 0.5 }, { draw: 0.25 }] });
    expect(await emphasis.play().finished).toBe('finished');
    expect(Number.parseFloat(path.style.strokeDashoffset)).toBeCloseTo(0.75, 3);

    presence.destroy();
    expect(path.getAttribute('pathLength')).toBe('1');
    expect(Number.parseFloat(path.style.strokeDashoffset)).toBeCloseTo(0.75, 3);

    emphasis.destroy();
    expect(path.getAttribute('pathLength')).toBe('12');
    expect(path.style.strokeDashoffset).toBe('');
  });

  it('gives the pathLength of its author back at rest, and takes it again when the next draw starts', async () => {
    root.innerHTML = '<svg viewBox="0 0 400 400" width="400" height="400"><path id="p" d="M20 20 L220 20" pathLength="12"/></svg>';
    const path = one<SVGPathElement>('#p');
    const binding = motion(path, drawIn, { present: false });
    expect(await binding.setPresent(true)).toBe('finished');
    expect(path.getAttribute('pathLength')).toBe('12');

    expect(await binding.setPresent(false)).toBe('finished');
    expect(path.getAttribute('pathLength')).toBe('1');
    expect(Number.parseFloat(path.style.strokeDashoffset)).toBeCloseTo(1, 3);
    binding.destroy();
    expect(path.getAttribute('pathLength')).toBe('12');
  });

  it('under reduced motion, sets the draw at once and fades only the opacity', () => {
    document.documentElement.dataset.motionPolicy = 'reduce';
    root.innerHTML = '<svg viewBox="0 0 400 400" width="400" height="400"><path id="p" d="M20 20 L220 20" stroke="black" fill="none"/></svg>';
    const path = one<SVGPathElement>('#p');
    const half = validateMotionSpec({ verb: 'appear', keyframes: [{ opacity: 0, draw: 0 }, { opacity: 1, draw: 0.5 }] });
    const handle = playMotion(path, half, forward);
    expect(dashOffsetOf(path)).toBeCloseTo(0.5, 3);
    const [fade] = path.getAnimations();
    expect(fade, 'the fade').toBeDefined();
    expect((fade.effect as KeyframeEffect).getKeyframes().every(frame => !('strokeDashoffset' in frame))).toBe(true);
    return handle.finished.then(result => {
      expect(result).toBe('finished');
      expect(dashOffsetOf(path)).toBeCloseTo(0.5, 3);
    });
  });
});
