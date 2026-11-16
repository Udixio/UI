import { resolveWaapiTiming } from '@udixio/motion';
import { afterEach, describe, expect, it } from 'vitest';
import {
  createSnackbarTransitionController,
  type SnackbarTransitionController,
} from './snackbar.js';

/** A panel whose 48 px content sets its height when the height is `auto`. */
function mountPanel(): HTMLElement {
  document.body.innerHTML = `
    <div id="panel" style="overflow: hidden">
      <div style="height: 48px"></div>
    </div>
  `;
  return document.querySelector<HTMLElement>('#panel')!;
}

const heightOf = (element: Element) => parseFloat(getComputedStyle(element).height);

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

describe('createSnackbarTransitionController in the browser', () => {
  let controller: SnackbarTransitionController | undefined;

  afterEach(() => {
    controller?.destroy();
    controller = undefined;
    document.documentElement.removeAttribute('data-motion-policy');
    document.body.innerHTML = '';
  });

  it('shows an open panel at its content height, and a closed one at zero, without an animation', () => {
    const open = mountPanel();
    controller = createSnackbarTransitionController({ panel: open, open: true });

    expect(open.style.height).toBe('auto');
    expect(open.getAnimations()).toHaveLength(0);
    expect(heightOf(open)).toBeCloseTo(48, 0);

    controller.destroy();
    const closed = mountPanel();
    controller = createSnackbarTransitionController({ panel: closed, open: false });

    expect(closed.style.height).toBe('0px');
    expect(closed.getAnimations()).toHaveLength(0);
    expect(heightOf(closed)).toBeCloseTo(0, 0);
  });

  it('opens to its content height, then leaves the height to the content', async () => {
    const panel = mountPanel();
    controller = createSnackbarTransitionController({ panel, open: false });

    controller.setOpen(true);

    const [grow] = panel.getAnimations();
    expect(grow!.effect!.getComputedTiming().duration).toBe(
      tokenDuration(panel, 'spring.fast.spatial'),
    );
    await grow!.finished;

    expect(panel.style.height).toBe('');
    expect(heightOf(panel)).toBeCloseTo(48, 0);
  });

  it('closes to zero height on the fast spatial spring', async () => {
    const panel = mountPanel();
    controller = createSnackbarTransitionController({ panel, open: true });

    controller.setOpen(false);
    await Promise.all(panel.getAnimations().map((animation) => animation.finished));

    expect(panel.style.height).toBe('0px');
    expect(heightOf(panel)).toBeCloseTo(0, 0);
  });

  it('continues from the height it shows when the change reverses mid-way', () => {
    const panel = mountPanel();
    controller = createSnackbarTransitionController({ panel, open: true });

    controller.setOpen(false);
    freezeAt(panel, 0.25);
    const shown = heightOf(panel);
    expect(shown).toBeGreaterThan(1);
    expect(shown).toBeLessThan(47);

    controller.setOpen(true);
    const [reverse] = panel.getAnimations();
    const [first] = (reverse!.effect as KeyframeEffect).getKeyframes();
    expect(Math.abs(parseFloat(String(first!.height)) - shown)).toBeLessThanOrEqual(1);
  });

  it('snaps to the new state under the document reduced motion policy', () => {
    document.documentElement.setAttribute('data-motion-policy', 'reduce');
    const panel = mountPanel();
    controller = createSnackbarTransitionController({ panel, open: false });

    controller.setOpen(true);

    expect(panel.getAnimations()).toHaveLength(0);
    expect(panel.style.height).toBe('auto');
    expect(heightOf(panel)).toBeCloseTo(48, 0);
  });

  it('snaps to the new state when the reducedMotion option says so', () => {
    const panel = mountPanel();
    controller = createSnackbarTransitionController({
      panel,
      open: true,
      reducedMotion: () => true,
    });

    controller.setOpen(false);

    expect(panel.getAnimations()).toHaveLength(0);
    expect(panel.style.height).toBe('0px');
  });

  it('plays the timing option in place of the fast spatial spring', () => {
    const panel = mountPanel();
    controller = createSnackbarTransitionController({
      panel,
      open: false,
      timing: { duration: 'duration.long1', easing: 'easing.standard' },
    });

    controller.setOpen(true);

    const [grow] = panel.getAnimations();
    expect(grow!.effect!.getComputedTiming().duration).toBe(450);
  });

  it('does not animate a request for the state it already shows', () => {
    const panel = mountPanel();
    controller = createSnackbarTransitionController({ panel, open: true });

    controller.setOpen(true);

    expect(panel.getAnimations()).toHaveLength(0);
  });

  it('ignores setOpen after destroy, and clears the height it set', () => {
    const panel = mountPanel();
    controller = createSnackbarTransitionController({ panel, open: false });

    controller.destroy();
    controller.setOpen(true);

    expect(panel.getAnimations()).toHaveLength(0);
    expect(panel.style.height).toBe('');
  });

  it('cancels a running height change on destroy', () => {
    const panel = mountPanel();
    controller = createSnackbarTransitionController({ panel, open: false });

    controller.setOpen(true);
    expect(panel.getAnimations()).toHaveLength(1);
    controller.destroy();
    controller = undefined;

    expect(panel.getAnimations()).toHaveLength(0);
  });
});
