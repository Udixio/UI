import { resolveWaapiTiming } from '@udixio/motion';
import { motionPolicy } from '@udixio/motion/policy';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSwitchThumbController, type SwitchThumbController } from './switch.js';

const translateOf = (element: HTMLElement) => parseFloat(getComputedStyle(element).translate);

/** The duration in ms of the default thumb timing in this document (expressive scheme). */
const durationOf = (element: HTMLElement) => resolveWaapiTiming(element, 'spring.fast.spatial', 'expressive')!.duration;

/** Waits until every running motion of an element has ended, and until its controller has written the end state. */
async function finishMotions(element: HTMLElement) {
  while (element.getAnimations().length > 0) {
    await Promise.all(element.getAnimations().map((animation) => animation.finished));
  }
  await new Promise((resolve) => setTimeout(resolve));
}

/** Pauses the running motions of an element at a fraction of their duration, so their values can be read. */
function freezeAt(element: HTMLElement, fraction: number) {
  for (const animation of element.getAnimations()) {
    animation.pause();
    animation.currentTime = Number(animation.effect!.getComputedTiming().duration) * fraction;
  }
}

describe('switch thumb controller in the browser', () => {
  let controller: SwitchThumbController | undefined;
  let root: HTMLElement;

  function mount(translate = '0px'): HTMLElement {
    document.body.innerHTML = `<div id="handle" style="translate: ${translate}; width: 24px; height: 24px"></div>`;
    root = document.querySelector<HTMLElement>('#handle')!;
    return root;
  }

  afterEach(() => {
    controller?.destroy();
    controller = undefined;
    document.documentElement.removeAttribute('data-motion-policy');
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('does not move the thumb on creation', () => {
    controller = createSwitchThumbController({ root: mount() });
    expect(root.getAnimations()).toHaveLength(0);
  });

  it('slides from the offset it is given to the target on the fast spatial spring', async () => {
    controller = createSwitchThumbController({ root: mount() });
    controller.update(0, 20);

    const [slide] = root.getAnimations();
    expect(slide.effect!.getComputedTiming().duration).toBe(durationOf(root));
    freezeAt(root, 0);
    expect(translateOf(root)).toBeCloseTo(0, 2);

    slide.play();
    await slide.finished;
    expect(root.style.translate).toBe('20px');
    expect(root.getAnimations()).toHaveLength(0);
  });

  it('uses the timing it is given instead of the default', () => {
    const timing = { duration: 'duration.long1', easing: 'easing.linear' } as const;
    controller = createSwitchThumbController({ root: mount(), timing });
    controller.update(0, 20);
    expect(root.getAnimations()[0].effect!.getComputedTiming().duration).toBe(resolveWaapiTiming(root, timing, 'expressive')!.duration);
    expect(root.getAnimations()[0].effect!.getComputedTiming().duration).not.toBe(durationOf(root));
  });

  it('carries a slide that is running from the translate it shows when toggled again', () => {
    controller = createSwitchThumbController({ root: mount() });
    controller.update(0, 20);
    freezeAt(root, 0.25);
    const shown = translateOf(root);
    expect(shown).toBeGreaterThan(0);
    expect(shown).toBeLessThan(20);

    controller.update(20, 0);

    expect(root.getAnimations()).toHaveLength(1);
    freezeAt(root, 0);
    expect(Math.abs(translateOf(root) - shown)).toBeLessThanOrEqual(1);
  });

  it('starts a fresh slide at the offset it is given, not at the last resting position', async () => {
    controller = createSwitchThumbController({ root: mount() });
    controller.update(0, 20);
    await finishMotions(root);
    expect(root.style.translate).toBe('20px');

    controller.update(5, 0);

    freezeAt(root, 0);
    expect(translateOf(root)).toBeCloseTo(5, 2);
  });

  it('jumps to the target when the reduced override applies', () => {
    controller = createSwitchThumbController({ root: mount(), reducedMotion: () => true });
    controller.update(0, 20);
    expect(root.getAnimations()).toHaveLength(0);
    expect(root.style.translate).toBe('20px');
  });

  it('jumps to the target under the document reduced policy, read synchronously', () => {
    document.documentElement.setAttribute('data-motion-policy', 'reduce');
    controller = createSwitchThumbController({ root: mount() });
    controller.update(0, 20);
    expect(root.getAnimations()).toHaveLength(0);
    expect(root.style.translate).toBe('20px');
  });

  it('settles a running slide at its target when the document policy turns reduced, and does not resume', async () => {
    controller = createSwitchThumbController({ root: mount() });
    controller.update(0, 20);
    freezeAt(root, 0.25);

    document.documentElement.setAttribute('data-motion-policy', 'reduce');
    await expect.poll(() => root.style.translate).toBe('20px');
    expect(root.getAnimations()).toHaveLength(0);

    document.documentElement.removeAttribute('data-motion-policy');
    await expect.poll(() => root.hasAttribute('data-udx-switch-motion-reduce')).toBe(false);
    expect(root.getAnimations()).toHaveLength(0);
    expect(root.style.translate).toBe('20px');
  });

  it('marks the root while the policy is reduced, and removes the marker on destroy', () => {
    document.documentElement.setAttribute('data-motion-policy', 'reduce');
    controller = createSwitchThumbController({ root: mount() });
    expect(root.hasAttribute('data-udx-switch-motion-reduce')).toBe(true);

    controller.destroy();
    controller = undefined;
    expect(root.hasAttribute('data-udx-switch-motion-reduce')).toBe(false);
  });

  it('cancels the running slide on destroy', () => {
    controller = createSwitchThumbController({ root: mount() });
    controller.update(0, 20);
    controller.destroy();
    controller = undefined;
    expect(root.getAnimations()).toHaveLength(0);
  });

  it('releases its retained policy if subscription fails', () => {
    const release = vi.spyOn(motionPolicy, 'release');
    vi.spyOn(motionPolicy, 'subscribe').mockImplementationOnce(() => {
      throw new Error('subscription failed');
    });
    expect(() => createSwitchThumbController({ root: mount() })).toThrow('subscription failed');
    expect(release).toHaveBeenCalledTimes(1);
  });
});
