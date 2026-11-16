import { afterEach, describe, expect, it } from 'vitest';
import { createCircularProgressController } from './circular-progress.js';

/** Mounts a 48 px indeterminate indicator: an SVG holding one circle, as the adapters render it. */
function mount() {
  document.body.innerHTML = `<svg id="svg" width="48" height="48" viewBox="0 0 48 48"><circle id="circle" cx="24" cy="24" r="20" fill="none" stroke="#000" stroke-width="4" /></svg>`;
  return {
    svg: document.querySelector<SVGSVGElement>('#svg')!,
    circle: document.querySelector<SVGCircleElement>('#circle')!,
  };
}

/** The rotation of a computed transform matrix, in degrees. */
function angleOf(transform: string): number {
  if (transform === 'none') return 0;
  const [a, b] = transform.slice('matrix('.length, -1).split(',').map(Number);
  return (Math.atan2(b, a) * 180) / Math.PI;
}

/** Holds every motion of the indicator at a time of its cycle, in ms from its start. */
function seek(svg: SVGElement, circle: SVGElement, time: number) {
  for (const element of [svg, circle]) {
    for (const animation of element.getAnimations()) {
      animation.pause();
      animation.currentTime = time;
    }
  }
}

/** The computed stroke-dasharray as numbers, in pathLength units: browsers serialise the list differently. */
const dashOf = (element: SVGElement) =>
  getComputedStyle(element).strokeDasharray.replaceAll('px', '').split(/[\s,]+/).map(Number);

/** Lets the policy observer run after a change of the document attribute. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('createCircularProgressController in the browser', () => {
  let cleanups: (() => void)[] = [];

  afterEach(() => {
    for (const cleanup of cleanups) cleanup();
    cleanups = [];
    document.documentElement.removeAttribute('data-motion-policy');
    document.body.innerHTML = '';
  });

  it('runs a 1500 ms linear rotation and a 3000 ms eased arc, forever', () => {
    const { svg, circle } = mount();
    cleanups.push(createCircularProgressController({ svg, circle }));
    const [rotation] = svg.getAnimations();
    const [arc] = circle.getAnimations();
    expect(svg.getAnimations()).toHaveLength(1);
    expect(circle.getAnimations()).toHaveLength(1);
    expect(rotation.effect!.getComputedTiming()).toMatchObject({ duration: 1500, iterations: Infinity, easing: 'linear' });
    expect(arc.effect!.getComputedTiming()).toMatchObject({ duration: 3000, iterations: Infinity });
  });

  it('matches the reference samples of the cycle to 1 degree and 1 % of the circumference', () => {
    // Reference: the values rendered by the controller before it moved to animateStyle (Chromium, 2026-11-16).
    const { svg, circle } = mount();
    cleanups.push(createCircularProgressController({ svg, circle }));
    const expected = [
      { time: 0, svg: -90, circle: 0, dash: 0.1 },
      { time: 375, svg: 0, circle: 0, dash: 0.203 },
      { time: 750, svg: 90, circle: 0, dash: 0.5 },
      { time: 1125, svg: 180, circle: 0, dash: 0.797 },
      { time: 1875, svg: 0, circle: 46.42, dash: 0.797 },
      { time: 2250, svg: 90, circle: 180, dash: 0.5 },
    ];
    for (const sample of expected) {
      seek(svg, circle, sample.time);
      const svgAngle = angleOf(getComputedStyle(svg).transform);
      const circleAngle = angleOf(getComputedStyle(circle).transform);
      const dash = parseFloat(getComputedStyle(circle).strokeDasharray);
      // Angles wrap at 360 degrees.
      expect(Math.abs((((svgAngle - sample.svg + 540) % 360) + 360) % 360 - 180), `rotation at ${sample.time} ms`).toBeLessThan(1);
      expect(Math.abs((((circleAngle - sample.circle + 540) % 360) + 360) % 360 - 180), `turn at ${sample.time} ms`).toBeLessThan(1);
      expect(Math.abs(dash - sample.dash), `arc at ${sample.time} ms`).toBeLessThan(0.01);
    }
  });

  it('keeps the path length at 1 and the dash offset at 0 while the arc moves', () => {
    const { svg, circle } = mount();
    cleanups.push(createCircularProgressController({ svg, circle }));
    seek(svg, circle, 375);
    expect(circle.getAttribute('pathLength')).toBe('1');
    expect(getComputedStyle(circle).strokeDashoffset).toBe('0px');
  });

  it('shows the static frame under the reduced policy, and restarts when the policy lifts', async () => {
    const { svg, circle } = mount();
    cleanups.push(createCircularProgressController({ svg, circle }));
    document.documentElement.setAttribute('data-motion-policy', 'reduce');
    await settle();
    expect(svg.getAnimations()).toHaveLength(0);
    expect(circle.getAnimations()).toHaveLength(0);
    expect(svg.style.transform).toBe('rotate(-90deg)');
    expect(circle.getAttribute('pathLength')).toBe('1');
    expect(dashOf(circle)).toEqual([0.25, 1]);

    document.documentElement.removeAttribute('data-motion-policy');
    await settle();
    expect(svg.getAnimations()).toHaveLength(1);
    expect(circle.getAnimations()).toHaveLength(1);
  });

  it('shows the static frame at once when the reduced-motion option is set', () => {
    const { svg, circle } = mount();
    cleanups.push(createCircularProgressController({ svg, circle, reducedMotion: () => true }));
    expect(svg.getAnimations()).toHaveLength(0);
    expect(circle.getAnimations()).toHaveLength(0);
    expect(svg.style.transform).toBe('rotate(-90deg)');
    expect(dashOf(circle)).toEqual([0.25, 1]);
  });

  it('ends both motions and restores the styles it wrote when cleaned up', () => {
    const { svg, circle } = mount();
    svg.style.transform = 'translateX(1px)';
    const svgStyle = svg.getAttribute('style');
    const circleStyle = circle.getAttribute('style');
    const cleanup = createCircularProgressController({ svg, circle });
    expect(svg.getAnimations()).toHaveLength(1);
    cleanup();
    expect(svg.getAnimations()).toHaveLength(0);
    expect(circle.getAnimations()).toHaveLength(0);
    expect(svg.getAttribute('style') ?? '').toBe(svgStyle ?? '');
    expect(circle.getAttribute('style') ?? '').toBe(circleStyle ?? '');
    expect(circle.hasAttribute('pathLength')).toBe(false);
    expect(() => cleanup()).not.toThrow();
  });

  it('scales both motions with the cycle option', () => {
    const { svg, circle } = mount();
    cleanups.push(createCircularProgressController({ svg, circle, cycle: 1000 }));
    expect(svg.getAnimations()[0].effect!.getComputedTiming().duration).toBe(1000);
    expect(circle.getAnimations()[0].effect!.getComputedTiming().duration).toBe(2000);
  });
});
