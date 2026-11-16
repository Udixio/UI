import { resolveWaapiTiming } from '@udixio/motion';
import { afterEach, describe, expect, it } from 'vitest';
import { createTooltipTransitionController, type TooltipTransitionController } from './tooltip.js';

/** The duration in ms of a motion token in this document (expressive scheme). */
const tokenDuration = (element: HTMLElement, ref: Parameters<typeof resolveWaapiTiming>[1]) =>
  resolveWaapiTiming(element, ref, 'expressive')!.duration;

const heightOf = (element: HTMLElement) => parseFloat(getComputedStyle(element).height);
const opacityOf = (element: HTMLElement) => parseFloat(getComputedStyle(element).opacity);

/** Pauses the running motions of an element at a fraction of their duration, so their values can be read. */
function freezeAt(element: HTMLElement, fraction: number) {
  for (const animation of element.getAnimations()) {
    animation.pause();
    animation.currentTime = Number(animation.effect!.getComputedTiming().duration) * fraction;
  }
}

/** The running motion of an element that animates the given property. */
function animationOf(element: HTMLElement, property: string): Animation {
  const found = element.getAnimations().find((animation) =>
    (animation.effect as KeyframeEffect).getKeyframes().some((frame) => property in frame),
  );
  if (!found) throw new Error(`No running animation of ${property}`);
  return found;
}

/** Waits until every running motion of an element has ended, and until its controller has written the end state. */
async function finishMotions(element: HTMLElement) {
  while (element.getAnimations().length > 0) {
    await Promise.all(element.getAnimations().map((animation) => animation.finished));
  }
  await new Promise((resolve) => setTimeout(resolve));
}

describe('tooltip transition controller in the browser', () => {
  let controller: TooltipTransitionController | undefined;
  let element: HTMLElement;

  /** A closed surface 16 px high whose 48 px content overflows it, as a tooltip with a text does. */
  function mount(): HTMLElement {
    document.body.innerHTML =
      '<div id="surface" style="height: 16px; overflow: hidden; opacity: 0; width: 120px"><p style="height: 48px; margin: 0"></p></div>';
    element = document.querySelector<HTMLElement>('#surface')!;
    return element;
  }

  afterEach(() => {
    controller?.destroy();
    controller = undefined;
    document.documentElement.removeAttribute('data-motion-policy');
    document.body.innerHTML = '';
  });

  it('opens on the fast spatial spring for the height and the fast effects spring for the opacity', async () => {
    controller = createTooltipTransitionController({ element: mount() });
    controller.setOpen(true);

    expect(animationOf(element, 'height').effect!.getComputedTiming().duration).toBe(tokenDuration(element, 'spring.fast.spatial'));
    expect(animationOf(element, 'opacity').effect!.getComputedTiming().duration).toBe(tokenDuration(element, 'spring.fast.effects'));
    expect(element.style.overflow).toBe('hidden');
    expect(element.style.height).not.toBe('auto');

    await finishMotions(element);
    expect(element.style.height).toBe('auto');
    expect(element.style.overflow).toBe('visible');
    expect(element.style.pointerEvents).toBe('');
    expect(heightOf(element)).toBe(48);
    expect(opacityOf(element)).toBe(1);
  });

  it('closes to the 16 px height and fades out, keeping the overflow hidden', async () => {
    controller = createTooltipTransitionController({ element: mount() });
    controller.setOpen(true, true);
    expect(heightOf(element)).toBe(48);

    controller.setOpen(false);
    await finishMotions(element);

    expect(element.style.height).toBe('16px');
    expect(element.style.overflow).toBe('hidden');
    expect(element.style.pointerEvents).toBe('none');
    expect(heightOf(element)).toBe(16);
    expect(opacityOf(element)).toBe(0);
  });

  it('carries an interrupted change from the height and opacity it shows, and a cancelled opening never shows its natural height', async () => {
    controller = createTooltipTransitionController({ element: mount() });
    controller.setOpen(true);
    freezeAt(element, 0.25);
    const height = heightOf(element);
    const opacity = opacityOf(element);
    expect(height).toBeGreaterThan(16);
    expect(height).toBeLessThan(48);

    controller.setOpen(false);
    freezeAt(element, 0);
    expect(Math.abs(heightOf(element) - height)).toBeLessThanOrEqual(1);
    expect(Math.abs(opacityOf(element) - opacity)).toBeLessThanOrEqual(0.02);

    for (const animation of element.getAnimations()) animation.play();
    await finishMotions(element);
    expect(element.style.height).toBe('16px');
    expect(element.style.overflow).toBe('hidden');
  });

  it('applies the instant state at once, with no motion, when instant is requested', () => {
    controller = createTooltipTransitionController({ element: mount() });
    controller.setOpen(true, true);
    expect(element.getAnimations()).toHaveLength(0);
    expect(element.style.height).toBe('auto');
    expect(element.style.overflow).toBe('visible');
    expect(opacityOf(element)).toBe(1);

    controller.setOpen(false, true);
    expect(element.getAnimations()).toHaveLength(0);
    expect(element.style.height).toBe('16px');
    expect(opacityOf(element)).toBe(0);
  });

  it('applies the instant state at once under the reduced override and under the document policy', () => {
    controller = createTooltipTransitionController({ element: mount(), reducedMotion: () => true });
    controller.setOpen(true);
    expect(element.getAnimations()).toHaveLength(0);
    expect(element.style.height).toBe('auto');

    controller.destroy();
    document.documentElement.setAttribute('data-motion-policy', 'reduce');
    controller = createTooltipTransitionController({ element: mount() });
    controller.setOpen(true);
    expect(element.getAnimations()).toHaveLength(0);
    expect(element.style.overflow).toBe('visible');
    expect(opacityOf(element)).toBe(1);
  });

  it('takes the timing it is given for the height and keeps the effects spring for the opacity', () => {
    const timing = { duration: 'duration.long1', easing: 'easing.linear' } as const;
    controller = createTooltipTransitionController({ element: mount(), timing });
    controller.setOpen(true);

    expect(animationOf(element, 'height').effect!.getComputedTiming().duration).toBe(tokenDuration(element, timing));
    expect(animationOf(element, 'opacity').effect!.getComputedTiming().duration).toBe(tokenDuration(element, 'spring.fast.effects'));
  });

  it('stops its running motions on destroy', () => {
    controller = createTooltipTransitionController({ element: mount() });
    controller.setOpen(true);
    controller.destroy();
    controller = undefined;
    expect(element.getAnimations()).toHaveLength(0);
  });
});
