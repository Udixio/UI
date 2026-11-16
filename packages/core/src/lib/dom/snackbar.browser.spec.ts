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
const opacityOf = (element: Element) => parseFloat(getComputedStyle(element).opacity);
/** The scale of the panel's transform, read from its matrix (1 when it has none). */
const scaleOf = (element: Element) => {
  const transform = getComputedStyle(element).transform;
  return transform === 'none' ? 1 : new DOMMatrixReadOnly(transform).a;
};
/** The properties the keyframes of an animation set. */
const keyframeKeys = (animation: Animation) =>
  Object.keys((animation.effect as KeyframeEffect).getKeyframes()[0] ?? {});

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

  it('opens at its content height at once, and fades and scales in on the effects and spatial springs', async () => {
    const panel = mountPanel();
    controller = createSnackbarTransitionController({ panel, open: false });

    controller.setOpen(true);

    // The height is not animated: the panel is at its content height from the first frame.
    expect(panel.style.height).toBe('auto');
    expect(heightOf(panel)).toBeCloseTo(48, 0);
    const fade = panel.getAnimations().find((animation) => keyframeKeys(animation).includes('opacity'));
    const scale = panel.getAnimations().find((animation) => keyframeKeys(animation).includes('transform'));
    expect(panel.getAnimations().some((animation) => keyframeKeys(animation).includes('height'))).toBe(false);
    expect(fade!.effect!.getComputedTiming().duration).toBe(tokenDuration(panel, 'spring.fast.effects'));
    expect(scale!.effect!.getComputedTiming().duration).toBe(tokenDuration(panel, 'spring.fast.spatial'));

    await Promise.all(panel.getAnimations().map((animation) => animation.finished));
    expect(panel.style.height).toBe('auto');
    expect(opacityOf(panel)).toBeCloseTo(1, 2);
    expect(scaleOf(panel)).toBeCloseTo(1, 2);
  });

  it('scales from the bottom edge, from 0.8 to 1 when it opens', () => {
    const panel = mountPanel();
    controller = createSnackbarTransitionController({ panel, open: false });

    controller.setOpen(true);

    // Read as pixels: Firefox serialises the inline origin with a z component.
    const [originX, originY] = getComputedStyle(panel).transformOrigin.split(' ').map(parseFloat);
    expect(originX).toBeCloseTo(panel.offsetWidth / 2, 0);
    expect(originY).toBeCloseTo(panel.offsetHeight, 0);
    freezeAt(panel, 0);
    expect(scaleOf(panel)).toBeCloseTo(0.8, 2);
  });

  it('fades and scales out to 0.8, and only then takes the height to zero', async () => {
    const panel = mountPanel();
    controller = createSnackbarTransitionController({ panel, open: true });

    controller.setOpen(false);

    // Still in the flow while it exits: the height is only removed when the exit has ended.
    expect(panel.style.height).toBe('auto');
    expect(panel.getAnimations().some((animation) => keyframeKeys(animation).includes('height'))).toBe(false);
    expect(panel.getAnimations().some((animation) => keyframeKeys(animation).includes('opacity'))).toBe(true);
    expect(panel.getAnimations().some((animation) => keyframeKeys(animation).includes('transform'))).toBe(true);

    await Promise.all(panel.getAnimations().map((animation) => animation.finished));
    // The controller ends its change one tick after its last animation.
    await new Promise((resolve) => setTimeout(resolve));
    expect(panel.style.height).toBe('0px');
    expect(heightOf(panel)).toBeCloseTo(0, 0);
    expect(opacityOf(panel)).toBeCloseTo(0, 2);
  });

  it('continues from the opacity it shows when the change reverses mid-way', () => {
    const panel = mountPanel();
    controller = createSnackbarTransitionController({ panel, open: true });

    controller.setOpen(false);
    freezeAt(panel, 0.2);
    const shown = opacityOf(panel);
    expect(shown).toBeGreaterThan(0.05);
    expect(shown).toBeLessThan(0.95);

    controller.setOpen(true);
    const fade = panel.getAnimations().find((animation) => keyframeKeys(animation).includes('opacity'))!;
    const [first] = (fade.effect as KeyframeEffect).getKeyframes();
    expect(Math.abs(Number(first!.opacity) - shown)).toBeLessThanOrEqual(0.02);
  });

  it('shows its content again at once when it is reopened during its exit', () => {
    const panel = mountPanel();
    controller = createSnackbarTransitionController({ panel, open: true });

    controller.setOpen(false);
    freezeAt(panel, 0.2);
    controller.setOpen(true);

    expect(panel.style.height).toBe('auto');
    expect(heightOf(panel)).toBeCloseTo(48, 0);
    expect(panel.getAnimations().some((animation) => keyframeKeys(animation).includes('height'))).toBe(false);
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

  it('plays the timing option for the scale, and keeps the fast effects spring for the opacity', () => {
    const panel = mountPanel();
    controller = createSnackbarTransitionController({
      panel,
      open: false,
      timing: { duration: 'duration.long1', easing: 'easing.standard' },
    });

    controller.setOpen(true);

    const scale = panel.getAnimations().find((animation) => keyframeKeys(animation).includes('transform'));
    const fade = panel.getAnimations().find((animation) => keyframeKeys(animation).includes('opacity'));
    expect(scale!.effect!.getComputedTiming().duration).toBe(450);
    expect(fade!.effect!.getComputedTiming().duration).toBe(tokenDuration(panel, 'spring.fast.effects'));
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

  it('cancels a running change on destroy', () => {
    const panel = mountPanel();
    controller = createSnackbarTransitionController({ panel, open: false });

    controller.setOpen(true);
    expect(panel.getAnimations()).toHaveLength(2);
    controller.destroy();
    controller = undefined;

    expect(panel.getAnimations()).toHaveLength(0);
  });
});
