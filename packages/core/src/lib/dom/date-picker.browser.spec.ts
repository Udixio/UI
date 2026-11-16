import { resolveWaapiTiming } from '@udixio/motion';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createMonthTransitionController,
  type MonthTransitionController,
} from './date-picker.js';

/** A calendar grid, 280 px wide, mounted in the document. */
function mountGrid(): HTMLDivElement {
  document.body.innerHTML = '<div id="grid" style="width: 280px; height: 200px"></div>';
  return document.querySelector<HTMLDivElement>('#grid')!;
}

/** The horizontal offset of an element, from its computed `translate`. */
const xOf = (element: Element) => parseFloat(getComputedStyle(element).translate);

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

/** The translate keyframes of an element's running slide: the one whose frames name a translate. */
function slideOf(element: HTMLElement): Animation {
  const slide = element.getAnimations().find((animation) =>
    (animation.effect as KeyframeEffect).getKeyframes().some((frame) => frame.translate !== undefined),
  );
  expect(slide).toBeDefined();
  return slide!;
}

describe('createMonthTransitionController in the browser', () => {
  let controller: MonthTransitionController | undefined;

  afterEach(() => {
    controller?.destroy();
    controller = undefined;
    document.documentElement.removeAttribute('data-motion-policy');
    document.body.innerHTML = '';
  });

  it('slides a later month in from 24 px to the right, and fades it in on the spatial and effects springs', async () => {
    const grid = mountGrid();
    controller = createMonthTransitionController({ container: grid });

    controller.play(1);
    expect(grid.getAnimations()).toHaveLength(2);
    const slide = slideOf(grid);
    expect(parseFloat(String((slide.effect as KeyframeEffect).getKeyframes()[0]!.translate))).toBe(24);
    expect(slide.effect!.getComputedTiming().duration).toBe(tokenDuration(grid, 'spring.default.spatial'));

    freezeAt(grid, 0);
    expect(xOf(grid)).toBeCloseTo(24, 0);
    expect(parseFloat(getComputedStyle(grid).opacity)).toBeCloseTo(0, 2);

    grid.getAnimations().forEach((animation) => animation.play());
    // The controller clears the inline offset in the microtasks after the motion ends.
    await vi.waitFor(() => expect(grid.getAnimations()).toHaveLength(0));
    expect(grid.style.translate).toBe('');
    expect(getComputedStyle(grid).translate).toBe('none');
    expect(getComputedStyle(grid).opacity).toBe('1');
    expect(grid.style.opacity).toBe('');
  });

  it('slides an earlier month in from 24 px to the left', () => {
    const grid = mountGrid();
    controller = createMonthTransitionController({ container: grid });

    controller.play(-1);
    freezeAt(grid, 0);

    expect(xOf(grid)).toBeCloseTo(-24, 0);
  });

  it('moves the offset by the distance option', () => {
    const grid = mountGrid();
    controller = createMonthTransitionController({ container: grid, distance: 8 });

    controller.play(1);
    freezeAt(grid, 0);

    expect(xOf(grid)).toBeCloseTo(8, 0);
  });

  it('skips the change for direction 0, and leaves no inline style', () => {
    const grid = mountGrid();
    controller = createMonthTransitionController({ container: grid });

    controller.play(0);

    expect(grid.getAnimations()).toHaveLength(0);
    expect(grid.getAttribute('style')).toBe('width: 280px; height: 200px');
  });

  it('skips the change under the document reduced motion policy', () => {
    document.documentElement.setAttribute('data-motion-policy', 'reduce');
    const grid = mountGrid();
    controller = createMonthTransitionController({ container: grid });

    controller.play(1);

    expect(grid.getAnimations()).toHaveLength(0);
    expect(grid.style.translate).toBe('');
  });

  it('skips the change when the reducedMotion option says so', () => {
    const grid = mountGrid();
    controller = createMonthTransitionController({ container: grid, reducedMotion: () => true });

    controller.play(-1);

    expect(grid.getAnimations()).toHaveLength(0);
  });

  it('continues an interrupted change from the position the grid shows, not from its offset', () => {
    const grid = mountGrid();
    controller = createMonthTransitionController({ container: grid });

    controller.play(1);
    freezeAt(grid, 0.25);
    const shown = xOf(grid);
    expect(Math.abs(shown)).toBeGreaterThan(1);
    expect(Math.abs(shown)).toBeLessThan(24);

    controller.play(-1);
    const [first] = (slideOf(grid).effect as KeyframeEffect).getKeyframes();
    expect(Math.abs(parseFloat(String(first!.translate)) - shown)).toBeLessThanOrEqual(1);
  });

  it('keeps only the newest change running when one starts while another runs', () => {
    const grid = mountGrid();
    controller = createMonthTransitionController({ container: grid });

    controller.play(1);
    controller.play(-1);

    expect(grid.getAnimations()).toHaveLength(2);
  });

  it('plays the timing option on the slide, and keeps the effects spring for the fade', () => {
    const grid = mountGrid();
    controller = createMonthTransitionController({
      container: grid,
      timing: { duration: 'duration.long2', easing: 'easing.standard' },
    });

    controller.play(1);

    const slide = slideOf(grid);
    expect(slide.effect!.getComputedTiming().duration).toBe(500);
    expect((slide.effect as KeyframeEffect).getTiming().easing).toBe('cubic-bezier(0.2, 0, 0, 1)');
    const fade = grid.getAnimations().find((animation) => animation !== slide)!;
    expect(fade.effect!.getComputedTiming().duration).toBe(tokenDuration(grid, 'spring.default.effects'));
  });

  it('cancels the running change on destroy', () => {
    const grid = mountGrid();
    controller = createMonthTransitionController({ container: grid });

    controller.play(1);
    controller.destroy();
    controller = undefined;

    expect(grid.getAnimations()).toHaveLength(0);
  });
});
