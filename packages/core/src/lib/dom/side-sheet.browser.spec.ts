import { resolveWaapiTiming } from '@udixio/motion';
import { afterEach, describe, expect, it } from 'vitest';
import {
  createSideSheetTransitionController,
  type SideSheetTransitionController,
} from './side-sheet.js';

/** A container that sizes to its 300 px content when its width is `auto`, and a backdrop. */
function mountSheet() {
  document.body.innerHTML = `
    <div id="container" style="display: inline-block; overflow: hidden; vertical-align: top">
      <div style="width: 300px; height: 40px"></div>
    </div>
    <div id="overlay" style="position: fixed; inset: 0; opacity: 0"></div>
  `;
  return {
    container: document.querySelector<HTMLElement>('#container')!,
    overlay: document.querySelector<HTMLElement>('#overlay')!,
  };
}

const widthOf = (element: Element) => parseFloat(getComputedStyle(element).width);
const opacityOf = (element: Element) => parseFloat(getComputedStyle(element).opacity);

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

/** Resolves once every animation of the given elements has finished, without a cancelled one. */
const settle = (...elements: Element[]) =>
  Promise.all(elements.flatMap((element) => element.getAnimations().map((animation) => animation.finished)));

describe('createSideSheetTransitionController in the browser', () => {
  let controller: SideSheetTransitionController | undefined;

  afterEach(() => {
    controller?.destroy();
    controller = undefined;
    document.documentElement.removeAttribute('data-motion-policy');
    document.body.innerHTML = '';
  });

  it('opens to the width of its content, then hands the width back to the content', async () => {
    const { container, overlay } = mountSheet();
    controller = createSideSheetTransitionController({ container, overlay });

    controller.setOpen(false, true);
    controller.setOpen(true);

    const [slide] = container.getAnimations();
    expect(slide!.effect!.getComputedTiming().duration).toBe(
      tokenDuration(container, 'spring.default.spatial'),
    );
    await settle(container, overlay);

    expect(container.style.width).toBe('');
    expect(widthOf(container)).toBeCloseTo(300, 0);
    expect(overlay.style.opacity).toBe('1');
    expect(opacityOf(overlay)).toBe(1);
  });

  it('closes to a zero width and fades the backdrop out', async () => {
    const { container, overlay } = mountSheet();
    controller = createSideSheetTransitionController({ container, overlay });

    controller.setOpen(true, true);
    controller.setOpen(false);
    await settle(container, overlay);

    expect(container.style.width).toBe('0px');
    expect(widthOf(container)).toBeCloseTo(0, 0);
    expect(opacityOf(overlay)).toBe(0);
  });

  it('plays the backdrop fade on the effects spring, not on the width timing', () => {
    const { container, overlay } = mountSheet();
    controller = createSideSheetTransitionController({ container, overlay });

    controller.setOpen(true);

    const [fade] = overlay.getAnimations();
    expect(fade!.effect!.getComputedTiming().duration).toBe(
      tokenDuration(overlay, 'spring.default.effects'),
    );
  });

  it('continues from the width it shows when the sheet reverses mid-way', () => {
    const { container, overlay } = mountSheet();
    controller = createSideSheetTransitionController({ container, overlay });

    controller.setOpen(true, true);
    controller.setOpen(false);
    freezeAt(container, 0.25);
    const shown = widthOf(container);
    expect(shown).toBeGreaterThan(1);
    expect(shown).toBeLessThan(299);

    controller.setOpen(true);
    const [reverse] = container.getAnimations();
    const [first] = (reverse!.effect as KeyframeEffect).getKeyframes();
    expect(Math.abs(parseFloat(String(first!.width)) - shown)).toBeLessThanOrEqual(1);
  });

  it('applies the end state at once for an instant sync, with no animation', () => {
    const { container, overlay } = mountSheet();
    controller = createSideSheetTransitionController({ container, overlay });

    controller.setOpen(false, true);

    expect(container.getAnimations()).toHaveLength(0);
    expect(container.style.width).toBe('0px');
    expect(overlay.style.opacity).toBe('0');
  });

  it('applies the end state at once under the document reduced motion policy', () => {
    document.documentElement.setAttribute('data-motion-policy', 'reduce');
    const { container, overlay } = mountSheet();
    controller = createSideSheetTransitionController({ container, overlay });

    controller.setOpen(true);

    expect(container.getAnimations()).toHaveLength(0);
    expect(container.style.width).toBe('');
    expect(overlay.style.opacity).toBe('1');
  });

  it('applies the end state at once when the reducedMotion option says so', () => {
    const { container, overlay } = mountSheet();
    controller = createSideSheetTransitionController({
      container,
      overlay,
      reducedMotion: () => true,
    });

    controller.setOpen(true);

    expect(container.getAnimations()).toHaveLength(0);
    expect(container.style.width).toBe('');
  });

  it('plays the timing option for the width', () => {
    const { container, overlay } = mountSheet();
    controller = createSideSheetTransitionController({
      container,
      overlay,
      timing: { duration: 'duration.long1', easing: 'easing.standard' },
    });

    controller.setOpen(false, true);
    controller.setOpen(true);

    const [slide] = container.getAnimations();
    expect(slide!.effect!.getComputedTiming().duration).toBe(450);
    expect((slide!.effect as KeyframeEffect).getTiming().easing).toBe('cubic-bezier(0.2, 0, 0, 1)');
  });

  it('cancels the running width and backdrop motions on destroy', () => {
    const { container, overlay } = mountSheet();
    controller = createSideSheetTransitionController({ container, overlay });

    controller.setOpen(false, true);
    controller.setOpen(true);
    expect(container.getAnimations()).toHaveLength(1);
    expect(overlay.getAnimations()).toHaveLength(1);

    controller.destroy();
    controller = undefined;

    expect(container.getAnimations()).toHaveLength(0);
    expect(overlay.getAnimations()).toHaveLength(0);
  });
});
