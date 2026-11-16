import { resolveWaapiTiming } from '@udixio/motion';
import { motionPolicy } from '@udixio/motion/policy';
import { afterEach, describe, expect, it } from 'vitest';
import {
  createSearchResultsTransitionController,
  type SearchResultsTransitionController,
} from './search.js';

/** The results surface with a 144 px listbox inside it, as the adapters render it. */
function mountResults(open: boolean, contentHeight = 144): HTMLElement {
  document.body.innerHTML = `
    <div id="results" ${open ? '' : 'hidden'}>
      <div id="content" style="height: ${contentHeight}px"></div>
    </div>`;
  return document.querySelector<HTMLElement>('#results')!;
}

const heightOf = (element: Element) => parseFloat(getComputedStyle(element).height);
const opacityOf = (element: Element) => parseFloat(getComputedStyle(element).opacity);

/** The duration in ms that a motion token plays with in this document (expressive scheme). */
const tokenDuration = (element: HTMLElement, timing: Parameters<typeof resolveWaapiTiming>[1]) =>
  resolveWaapiTiming(element, timing, 'expressive')!.duration;

/** The running motion of an element that animates the given property. */
function animationOf(element: Element, property: string): Animation {
  const found = element.getAnimations().find((animation) =>
    Object.keys((animation.effect as KeyframeEffect).getKeyframes()[0] ?? {}).includes(property),
  );
  if (!found) throw new Error(`No running animation of ${property}`);
  return found;
}

/** Freezes every running motion of an element at the given fraction of its duration. */
function freezeAt(element: Element, fraction: number) {
  for (const animation of element.getAnimations()) {
    animation.pause();
    animation.currentTime = Number(animation.effect!.getComputedTiming().duration) * fraction;
  }
}

/** Waits until every motion of an element has ended, and until the controller has written the end state. */
async function finishMotions(element: Element) {
  while (element.getAnimations().length > 0) {
    await Promise.all(element.getAnimations().map((animation) => animation.finished));
  }
  await new Promise((resolve) => setTimeout(resolve));
}

describe('search results transition controller in the browser', () => {
  let controller: SearchResultsTransitionController | undefined;

  afterEach(() => {
    controller?.destroy();
    controller = undefined;
    document.documentElement.removeAttribute('data-motion-policy');
    document.body.innerHTML = '';
  });

  it('applies the closed state at mount: hidden, collapsed and transparent, without a motion', () => {
    const element = mountResults(false);
    controller = createSearchResultsTransitionController({ element, open: false });

    expect(element.getAnimations()).toHaveLength(0);
    expect(element.hidden).toBe(true);
    expect(element.style.height).toBe('0px');
    expect(element.style.opacity).toBe('0');
  });

  it('applies the open state at mount at the content height, without a motion', () => {
    const element = mountResults(true);
    controller = createSearchResultsTransitionController({ element, open: true });

    expect(element.getAnimations()).toHaveLength(0);
    expect(element.hidden).toBe(false);
    expect(heightOf(element)).toBeCloseTo(144, 0);
    expect(opacityOf(element)).toBe(1);
  });

  it('opens on the default spatial spring for the height and the default effects spring for the opacity', () => {
    const element = mountResults(false);
    controller = createSearchResultsTransitionController({ element, open: false });

    controller.setOpen(true);

    expect(element.hidden).toBe(false);
    expect(animationOf(element, 'height').effect!.getComputedTiming().duration).toBe(
      tokenDuration(element, 'spring.default.spatial'),
    );
    expect(animationOf(element, 'opacity').effect!.getComputedTiming().duration).toBe(
      tokenDuration(element, 'spring.default.effects'),
    );
  });

  it('ends an opening at auto height, so the results grow with content added later', async () => {
    const element = mountResults(false);
    controller = createSearchResultsTransitionController({ element, open: false });

    controller.setOpen(true);
    await finishMotions(element);

    expect(element.style.height).toBe('');
    expect(heightOf(element)).toBeCloseTo(144, 0);
    expect(element.style.opacity).toBe('1');

    element.querySelector<HTMLElement>('#content')!.style.height = '288px';
    expect(heightOf(element)).toBeCloseTo(288, 0);
  });

  it('stays shown until the closing ends, then hides at zero height and zero opacity', async () => {
    const element = mountResults(true);
    controller = createSearchResultsTransitionController({ element, open: true });

    controller.setOpen(false);
    expect(element.hidden).toBe(false);
    await finishMotions(element);

    expect(element.hidden).toBe(true);
    expect(element.style.height).toBe('0px');
    expect(element.style.opacity).toBe('0');
  });

  it('closes its height on the default effects spring, which does not overshoot the zero height', () => {
    const element = mountResults(true);
    controller = createSearchResultsTransitionController({ element, open: true });

    controller.setOpen(false);

    expect(animationOf(element, 'height').effect!.getComputedTiming().duration).toBe(
      tokenDuration(element, 'spring.default.effects'),
    );
  });

  it('opens and closes with no animation inside a subtree that is not rendered, and ends at the new state', () => {
    document.body.innerHTML = `
      <div style="display: none">
        <div id="results" hidden>
          <div id="content" style="height: 144px"></div>
        </div>
      </div>`;
    const element = document.querySelector<HTMLElement>('#results')!;
    controller = createSearchResultsTransitionController({ element, open: false });

    controller.setOpen(true);
    expect(element.getAnimations()).toHaveLength(0);
    expect(element.hidden).toBe(false);
    expect(element.style.height).toBe('auto');
    expect(element.style.opacity).toBe('1');

    controller.setOpen(false);
    expect(element.getAnimations()).toHaveLength(0);
    expect(element.hidden).toBe(true);
    expect(element.style.height).toBe('0px');
    expect(element.style.opacity).toBe('0');
  });

  it('does not animate an open surface that is not rendered, so the animations of a page stay with the visible ones', () => {
    document.body.innerHTML = `
      <div style="display: none">
        <div id="results">
          <div id="content" style="height: 144px"></div>
        </div>
      </div>`;
    const element = document.querySelector<HTMLElement>('#results')!;
    controller = createSearchResultsTransitionController({ element, open: true });

    controller.setOpen(false);

    expect(element.getAnimations()).toHaveLength(0);
    expect(element.hidden).toBe(true);
  });

  it('starts a closing from the height the surface shows', () => {
    const element = mountResults(true);
    controller = createSearchResultsTransitionController({ element, open: true });

    controller.setOpen(false);
    freezeAt(element, 0);

    expect(heightOf(element)).toBeCloseTo(144, 0);
  });

  it('carries an interrupted opening back to closed from the height it shows, without a jump', async () => {
    const element = mountResults(false);
    controller = createSearchResultsTransitionController({ element, open: false });

    controller.setOpen(true);
    // Early in the curve: the expressive spatial spring overshoots its target, so mid-way the surface can be taller than its content.
    freezeAt(element, 0.25);
    const shown = heightOf(element);
    expect(shown).toBeGreaterThan(1);
    expect(shown).toBeLessThan(144);

    controller.setOpen(false);
    freezeAt(element, 0);
    expect(Math.abs(heightOf(element) - shown)).toBeLessThanOrEqual(1);

    // The frozen closing is resumed before waiting for it, as a paused animation never finishes.
    for (const animation of element.getAnimations()) animation.play();
    await finishMotions(element);
    expect(element.hidden).toBe(true);
  });

  it('does not hide the surface when a reversal cancels a closing', async () => {
    const element = mountResults(true);
    controller = createSearchResultsTransitionController({ element, open: true });

    controller.setOpen(false);
    freezeAt(element, 0.5);
    controller.setOpen(true);
    await finishMotions(element);

    expect(element.hidden).toBe(false);
    expect(element.style.height).toBe('');
    expect(opacityOf(element)).toBe(1);
  });

  it('applies the new state at once when the extra reduced-motion switch is on', () => {
    const element = mountResults(false);
    controller = createSearchResultsTransitionController({
      element,
      open: false,
      reducedMotion: () => true,
    });

    controller.setOpen(true);
    expect(element.getAnimations()).toHaveLength(0);
    expect(element.hidden).toBe(false);
    expect(element.style.height).toBe('auto');
    expect(element.style.opacity).toBe('1');

    controller.setOpen(false);
    expect(element.getAnimations()).toHaveLength(0);
    expect(element.hidden).toBe(true);
    expect(element.style.height).toBe('0px');
  });

  it('applies the new state at once under the document reduced policy', () => {
    document.documentElement.setAttribute('data-motion-policy', 'reduce');
    expect(motionPolicy.reduced).toBe(true);
    const element = mountResults(false);
    controller = createSearchResultsTransitionController({ element, open: false });

    controller.setOpen(true);

    expect(element.getAnimations()).toHaveLength(0);
    expect(element.hidden).toBe(false);
  });

  it('takes the timing it is given for the height and keeps the effects spring for the opacity', () => {
    const element = mountResults(false);
    const timing = { duration: 'duration.medium2', easing: 'easing.standard' } as const;
    controller = createSearchResultsTransitionController({ element, open: false, timing });

    controller.setOpen(true);

    expect(animationOf(element, 'height').effect!.getComputedTiming().duration).toBe(
      resolveWaapiTiming(element, timing, 'expressive')!.duration,
    );
    expect(animationOf(element, 'opacity').effect!.getComputedTiming().duration).toBe(
      tokenDuration(element, 'spring.default.effects'),
    );
  });

  it('cancels its running change and restores the original inline styles on destroy', () => {
    const element = mountResults(false);
    element.style.height = '7px';
    element.style.opacity = '0.5';
    controller = createSearchResultsTransitionController({ element, open: false });

    controller.setOpen(true);
    freezeAt(element, 0.5);
    controller.destroy();
    controller = undefined;

    expect(element.getAnimations()).toHaveLength(0);
    expect(element.hidden).toBe(true);
    expect(element.style.height).toBe('7px');
    expect(element.style.opacity).toBe('0.5');
  });

  it('ignores updates after destroy', () => {
    const element = mountResults(false);
    controller = createSearchResultsTransitionController({ element, open: false });
    controller.destroy();

    controller.setOpen(true);

    expect(element.getAnimations()).toHaveLength(0);
    expect(element.hidden).toBe(true);
  });
});
