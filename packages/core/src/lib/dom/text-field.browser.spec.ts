import { resolveWaapiTiming } from '@udixio/motion';
import { motionPolicy } from '@udixio/motion/policy';
import { afterEach, describe, expect, it } from 'vitest';
import { createTextFieldLabelController, type TextFieldLabelController } from './text-field.js';

/**
 * An outlined legend whose class fixes its resting width, as the adapters render it: `closed` is zero wide, `open` is
 * as wide as its 80 px content.
 */
function mountLegend(notched: boolean): HTMLElement {
  document.body.innerHTML = `
    <style>
      #legend.open { width: auto; }
      #legend.closed { width: 0px; }
    </style>
    <fieldset style="margin: 0; padding: 0; border: 0">
      <legend id="legend" class="${notched ? 'open' : 'closed'}" style="display: block; overflow: hidden; white-space: nowrap; height: 0; margin-left: 8px">
        <span style="display: inline-flex; width: 80px; height: 16px"></span>
      </legend>
    </fieldset>`;
  return document.querySelector<HTMLElement>('#legend')!;
}

/** Sets the notch state the way an adapter does: its class changes in the render, before the controller is told. */
function renderNotched(legend: HTMLElement, value: boolean) {
  legend.classList.toggle('open', value);
  legend.classList.toggle('closed', !value);
}

const widthOf = (element: Element) => parseFloat(getComputedStyle(element).width);

/** The duration in ms that a motion token plays with in this document (expressive scheme). */
const tokenDuration = (element: HTMLElement, timing: Parameters<typeof resolveWaapiTiming>[1]) =>
  resolveWaapiTiming(element, timing, 'expressive')!.duration;

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

describe('text field label controller in the browser', () => {
  let controller: TextFieldLabelController | undefined;
  let notched: boolean;

  afterEach(() => {
    controller?.destroy();
    controller = undefined;
    document.documentElement.removeAttribute('data-motion-policy');
    document.body.innerHTML = '';
  });

  function connect(root: HTMLElement, options: Partial<Parameters<typeof createTextFieldLabelController>[0]> = {}) {
    controller = createTextFieldLabelController({ root, notched: () => notched, ...options });
    return controller;
  }

  it('leaves the resting width to the class at mount, without a motion', () => {
    notched = false;
    const closed = mountLegend(false);
    connect(closed);
    expect(closed.getAnimations()).toHaveLength(0);
    expect(closed.style.width).toBe('');
    expect(widthOf(closed)).toBeCloseTo(0, 0);
    controller!.destroy();

    const open = mountLegend(true);
    notched = true;
    connect(open);
    expect(open.getAnimations()).toHaveLength(0);
    expect(widthOf(open)).toBeCloseTo(80, 0);
  });

  it('opens the notch on the fast effects spring', () => {
    notched = false;
    const legend = mountLegend(false);
    connect(legend);

    notched = true;
    renderNotched(legend, true);
    controller!.update();

    const [motion] = legend.getAnimations();
    expect(motion.effect!.getComputedTiming().duration).toBe(tokenDuration(legend, 'spring.fast.effects'));
  });

  it('ends an opening with the width of its content and no inline width', async () => {
    notched = false;
    const legend = mountLegend(false);
    connect(legend);

    notched = true;
    renderNotched(legend, true);
    controller!.update();
    await finishMotions(legend);

    expect(legend.style.width).toBe('');
    expect(widthOf(legend)).toBeCloseTo(80, 0);
  });

  it('ends a closing at zero width, pinned inline', async () => {
    notched = true;
    const legend = mountLegend(true);
    connect(legend);

    notched = false;
    renderNotched(legend, false);
    controller!.update();
    await finishMotions(legend);

    expect(legend.style.width).toBe('0px');
    expect(widthOf(legend)).toBeCloseTo(0, 0);
  });

  it('starts a closing from the width the notch shows', () => {
    notched = true;
    const legend = mountLegend(true);
    connect(legend);

    notched = false;
    renderNotched(legend, false);
    controller!.update();
    freezeAt(legend, 0);

    expect(widthOf(legend)).toBeCloseTo(80, 0);
  });

  it('carries an interrupted opening back to closed from the width it shows, without a jump', () => {
    notched = false;
    const legend = mountLegend(false);
    connect(legend);

    notched = true;
    renderNotched(legend, true);
    controller!.update();
    freezeAt(legend, 0.5);
    const shown = widthOf(legend);
    expect(shown).toBeGreaterThan(1);
    expect(shown).toBeLessThan(80);

    notched = false;
    renderNotched(legend, false);
    controller!.update();
    freezeAt(legend, 0);

    expect(Math.abs(widthOf(legend) - shown)).toBeLessThanOrEqual(1);
  });

  it('does not animate when the state has not changed since the last call', () => {
    notched = true;
    const legend = mountLegend(true);
    connect(legend);

    controller!.update();

    expect(legend.getAnimations()).toHaveLength(0);
  });

  it('applies the new state at once when the extra reduced-motion switch is on', () => {
    notched = false;
    const legend = mountLegend(false);
    connect(legend, { reducedMotion: () => true });

    notched = true;
    renderNotched(legend, true);
    controller!.update();
    expect(legend.getAnimations()).toHaveLength(0);
    expect(legend.style.width).toBe('');
    expect(widthOf(legend)).toBeCloseTo(80, 0);

    notched = false;
    renderNotched(legend, false);
    controller!.update();
    expect(legend.getAnimations()).toHaveLength(0);
    expect(legend.style.width).toBe('0px');
  });

  it('applies the new state at once under the document reduced policy', () => {
    document.documentElement.setAttribute('data-motion-policy', 'reduce');
    expect(motionPolicy.reduced).toBe(true);
    notched = false;
    const legend = mountLegend(false);
    connect(legend);

    notched = true;
    renderNotched(legend, true);
    controller!.update();

    expect(legend.getAnimations()).toHaveLength(0);
    expect(widthOf(legend)).toBeCloseTo(80, 0);
  });

  it('takes the timing it is given instead of the fast effects spring', () => {
    notched = false;
    const legend = mountLegend(false);
    const timing = { duration: 'duration.medium2', easing: 'easing.standard' } as const;
    connect(legend, { timing });

    notched = true;
    renderNotched(legend, true);
    controller!.update();

    expect(legend.getAnimations()[0].effect!.getComputedTiming().duration).toBe(
      resolveWaapiTiming(legend, timing, 'expressive')!.duration,
    );
  });

  it('cancels its running change on destroy, so no motion outlives the controller', () => {
    notched = false;
    const legend = mountLegend(false);
    connect(legend);

    notched = true;
    renderNotched(legend, true);
    controller!.update();
    freezeAt(legend, 0.5);
    controller!.destroy();
    controller = undefined;

    expect(legend.getAnimations()).toHaveLength(0);
  });
});
