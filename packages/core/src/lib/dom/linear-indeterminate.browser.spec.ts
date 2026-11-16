import { afterEach, describe, expect, it } from 'vitest';
import { createLinearIndeterminateController } from './linear-indeterminate.js';

/** Mounts a 300 px track holding the leading bar, the gap and the trailing bar, as the adapters render them. */
function mount() {
  document.body.innerHTML = `<div id="track" style="width: 300px">
    <div id="leading" style="height: 4px"></div>
    <div id="gap" style="height: 4px"></div>
    <div id="trailing" style="height: 4px"></div>
  </div>`;
  return {
    leading: document.querySelector<HTMLElement>('#leading')!,
    gap: document.querySelector<HTMLElement>('#gap')!,
    trailing: document.querySelector<HTMLElement>('#trailing')!,
  };
}

/** Holds every motion of the bars at a time of their cycle, in ms from its start. */
function seek(elements: HTMLElement[], time: number) {
  for (const element of elements) {
    for (const animation of element.getAnimations()) {
      animation.pause();
      animation.currentTime = time;
    }
  }
}

/** Lets the policy observer run after a change of the document attribute. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

const px = (element: HTMLElement, property: 'width' | 'marginLeft' | 'marginRight') =>
  parseFloat(getComputedStyle(element)[property]);

describe('createLinearIndeterminateController in the browser', () => {
  let cleanups: (() => void)[] = [];

  afterEach(() => {
    for (const cleanup of cleanups) cleanup();
    cleanups = [];
    document.documentElement.removeAttribute('data-motion-policy');
    document.body.innerHTML = '';
  });

  it('runs three 1500 ms linear-eased motions, one per bar, forever', () => {
    const { leading, gap, trailing } = mount();
    cleanups.push(createLinearIndeterminateController({ leadingBar: leading, gapTrack: gap, trailingBar: trailing }));
    for (const element of [leading, gap, trailing]) {
      const [animation] = element.getAnimations();
      expect(element.getAnimations()).toHaveLength(1);
      expect(animation.effect!.getComputedTiming()).toMatchObject({ duration: 1500, iterations: Infinity, easing: 'linear' });
    }
  });

  it('matches the reference samples of the cycle to 1 px', () => {
    // Reference: the widths rendered by the controller before it moved to animateStyle (Chromium, 2026-11-16), in px of a
    // 300 px track. The leading bar's margins jump at the middle of the cycle, so they are sampled after it.
    const { leading, gap, trailing } = mount();
    cleanups.push(createLinearIndeterminateController({ leadingBar: leading, gapTrack: gap, trailingBar: trailing }));
    const expected = [
      { time: 0, leading: 0, leftMargin: 0, gap: 0, trailing: 60, trailingLeftMargin: 6 },
      { time: 375, leading: 0, leftMargin: 0, gap: 60, trailing: 120, trailingLeftMargin: 6 },
      { time: 750, leading: 0, leftMargin: 6, gap: 120, trailing: 180, trailingLeftMargin: 6 },
      { time: 1125, leading: 30, leftMargin: 6, gap: 210, trailing: 120, trailingLeftMargin: 6 },
    ];
    for (const sample of expected) {
      seek([leading, gap, trailing], sample.time);
      expect(Math.abs(px(leading, 'width') - sample.leading), `leading at ${sample.time} ms`).toBeLessThan(1);
      expect(Math.abs(px(leading, 'marginLeft') - sample.leftMargin), `leading margin at ${sample.time} ms`).toBeLessThan(1);
      expect(Math.abs(px(gap, 'width') - sample.gap), `gap at ${sample.time} ms`).toBeLessThan(1);
      expect(Math.abs(px(trailing, 'width') - sample.trailing), `trailing at ${sample.time} ms`).toBeLessThan(1);
      expect(Math.abs(px(trailing, 'marginLeft') - sample.trailingLeftMargin), `trailing margin at ${sample.time} ms`).toBeLessThan(1);
    }
  });

  it('shows the static frame under the reduced policy, and restarts when the policy lifts', async () => {
    const { leading, gap, trailing } = mount();
    cleanups.push(createLinearIndeterminateController({ leadingBar: leading, gapTrack: gap, trailingBar: trailing }));
    document.documentElement.setAttribute('data-motion-policy', 'reduce');
    await settle();
    for (const element of [leading, gap, trailing]) expect(element.getAnimations()).toHaveLength(0);
    expect(leading.style.width).toBe('20%');
    expect(leading.style.marginLeft).toBe('0px');
    expect(gap.style.width).toBe('20%');
    expect(trailing.style.marginLeft).toBe('6px');

    document.documentElement.removeAttribute('data-motion-policy');
    await settle();
    for (const element of [leading, gap, trailing]) expect(element.getAnimations()).toHaveLength(1);
  });

  it('ends the motions and restores the bars when cleaned up', () => {
    const { leading, gap, trailing } = mount();
    leading.style.width = '42%';
    const leadingStyle = leading.getAttribute('style');
    const cleanup = createLinearIndeterminateController({ leadingBar: leading, gapTrack: gap, trailingBar: trailing });
    cleanup();
    for (const element of [leading, gap, trailing]) expect(element.getAnimations()).toHaveLength(0);
    expect(leading.getAttribute('style')).toBe(leadingStyle);
    expect(gap.style.width).toBe('');
    expect(() => cleanup()).not.toThrow();
  });
});
