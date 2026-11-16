import { resolveWaapiTiming } from '@udixio/motion';
import { motionPolicy } from '@udixio/motion/policy';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createSliderIndicatorController,
  type SliderIndicatorController,
} from './slider.js';

/** A slider root holding a value bubble that starts hidden, as the adapters render it. */
function mountBubble() {
  document.body.innerHTML = `
    <div id="root" style="position: relative">
      <div id="bubble" style="width: 40px; height: 20px; transform-origin: bottom; scale: 0"></div>
    </div>
  `;
  return {
    root: document.querySelector<HTMLElement>('#root')!,
    bubble: document.querySelector<HTMLElement>('#bubble')!,
  };
}

const scaleOf = (element: Element) => parseFloat(getComputedStyle(element).scale);

/** The duration in ms that a motion token plays with in this document (expressive scheme). */
const tokenDuration = (element: HTMLElement, timing: Parameters<typeof resolveWaapiTiming>[1]) =>
  resolveWaapiTiming(element, timing, 'expressive')!.duration;

/** Freezes every animation of an element at the given fraction of its duration. */
function freezeAt(element: Element, fraction: number) {
  for (const animation of element.getAnimations()) {
    animation.pause();
    animation.currentTime = Number(animation.effect!.getComputedTiming().duration) * fraction;
  }
}

describe('createSliderIndicatorController in the browser', () => {
  let controller: SliderIndicatorController | undefined;

  afterEach(() => {
    controller?.destroy();
    controller = undefined;
    document.documentElement.removeAttribute('data-motion-policy');
    document.body.innerHTML = '';
  });

  it('leaves a hidden indicator alone on the first hide, with no motion', () => {
    const { root, bubble } = mountBubble();
    controller = createSliderIndicatorController({ indicator: bubble, root });

    controller.setVisible(false);

    expect(bubble.getAnimations()).toHaveLength(0);
    expect(scaleOf(bubble)).toBe(0);
  });

  it('shows the indicator on the fast effects spring, and ends at full scale', async () => {
    const { root, bubble } = mountBubble();
    controller = createSliderIndicatorController({ indicator: bubble, root });

    controller.setVisible(true);
    const [show] = bubble.getAnimations();
    expect(show).toBeDefined();
    expect(show!.effect!.getComputedTiming().duration).toBe(
      tokenDuration(bubble, 'spring.fast.effects'),
    );

    await show!.finished;
    expect(bubble.style.getPropertyValue('scale')).toBe('1');
    expect(scaleOf(bubble)).toBe(1);
  });

  it('hides the indicator again, and ends at zero scale', async () => {
    const { root, bubble } = mountBubble();
    controller = createSliderIndicatorController({ indicator: bubble, root });

    controller.setVisible(true);
    await Promise.all(bubble.getAnimations().map((animation) => animation.finished));
    controller.setVisible(false);
    await Promise.all(bubble.getAnimations().map((animation) => animation.finished));

    expect(bubble.getAnimations()).toHaveLength(0);
    expect(scaleOf(bubble)).toBe(0);
  });

  it('continues a show interrupted by a hide from the size the indicator has', () => {
    const { root, bubble } = mountBubble();
    controller = createSliderIndicatorController({ indicator: bubble, root });

    controller.setVisible(true);
    freezeAt(bubble, 0.3);
    const shown = scaleOf(bubble);
    expect(shown).toBeGreaterThan(0.05);
    expect(shown).toBeLessThan(0.95);

    controller.setVisible(false);
    const [first] = (bubble.getAnimations()[0]!.effect as KeyframeEffect).getKeyframes();
    expect(Math.abs(parseFloat(String(first!.scale)) - shown)).toBeLessThanOrEqual(0.02);
  });

  it('snaps to the requested scale under the document reduced motion policy', () => {
    const { root, bubble } = mountBubble();
    controller = createSliderIndicatorController({ indicator: bubble, root });
    document.documentElement.setAttribute('data-motion-policy', 'reduce');

    controller.setVisible(true);

    expect(bubble.getAnimations()).toHaveLength(0);
    expect(bubble.style.getPropertyValue('scale')).toBe('1');
    expect(root.hasAttribute('data-udx-slider-motion-reduce')).toBe(true);
  });

  it('settles a running show when the document policy turns reduced', async () => {
    const { root, bubble } = mountBubble();
    controller = createSliderIndicatorController({ indicator: bubble, root });
    controller.setVisible(true);
    expect(bubble.getAnimations()).toHaveLength(1);

    document.documentElement.setAttribute('data-motion-policy', 'reduce');

    await vi.waitFor(() => expect(bubble.getAnimations()).toHaveLength(0));
    expect(bubble.style.getPropertyValue('scale')).toBe('1');
  });

  it('samples the reducedMotion option on each call', () => {
    const { root, bubble } = mountBubble();
    let reduced = false;
    controller = createSliderIndicatorController({
      indicator: bubble,
      root,
      reducedMotion: () => reduced,
    });

    controller.setVisible(true);
    expect(bubble.getAnimations()).toHaveLength(1);

    reduced = true;
    controller.setVisible(false);
    expect(bubble.getAnimations()).toHaveLength(0);
    expect(bubble.style.getPropertyValue('scale')).toBe('0');
  });

  it('plays the timing option in place of the fast effects spring', () => {
    const { root, bubble } = mountBubble();
    controller = createSliderIndicatorController({
      indicator: bubble,
      root,
      timing: 'spring.default.effects',
    });

    controller.setVisible(true);

    expect(bubble.getAnimations()[0]!.effect!.getComputedTiming().duration).toBe(
      tokenDuration(bubble, 'spring.default.effects'),
    );
  });

  it('marks the root under the policy, and removes the mark and its motion on destroy', () => {
    const { root, bubble } = mountBubble();
    document.documentElement.setAttribute('data-motion-policy', 'reduce');
    controller = createSliderIndicatorController({ indicator: bubble, root });
    expect(root.hasAttribute('data-udx-slider-motion-reduce')).toBe(true);

    controller.destroy();
    controller = undefined;

    expect(root.hasAttribute('data-udx-slider-motion-reduce')).toBe(false);
  });

  it('cancels the running show on destroy, and releases the policy it retained', () => {
    const { root, bubble } = mountBubble();
    const release = vi.spyOn(motionPolicy, 'release');
    controller = createSliderIndicatorController({ indicator: bubble, root });
    controller.setVisible(true);

    controller.destroy();
    controller = undefined;

    expect(bubble.getAnimations()).toHaveLength(0);
    expect(release).toHaveBeenCalledOnce();
    release.mockRestore();
  });

  it('releases a retained policy when installation fails', () => {
    const { root, bubble } = mountBubble();
    const release = vi.spyOn(motionPolicy, 'release');
    const subscribe = vi
      .spyOn(motionPolicy, 'subscribe')
      .mockImplementationOnce(() => {
        throw new Error('failed');
      });

    expect(() => createSliderIndicatorController({ indicator: bubble, root })).toThrow('failed');
    expect(release).toHaveBeenCalledOnce();
    expect(root.hasAttribute('data-udx-slider-motion-reduce')).toBe(false);

    subscribe.mockRestore();
    release.mockRestore();
  });
});
