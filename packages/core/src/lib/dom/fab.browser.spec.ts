import { resolveWaapiTiming } from '@udixio/motion';
import { motionPolicy } from '@udixio/motion/policy';
import { afterEach, describe, expect, it } from 'vitest';
import { createFabLabelController, type FabLabelController } from './fab.js';

/** A label whose `auto` width is its 80 px content, inside a row as in a `Fab`. */
function mountLabel(extended: boolean): HTMLElement {
  document.body.innerHTML = `
    <div id="row" style="display: flex; align-items: center">
      <span id="label" style="display: block; overflow: visible; white-space: nowrap; width: ${extended ? 'auto' : '0px'}; opacity: ${extended ? 1 : 0}">
        <span style="display: block; width: 80px; height: 24px"></span>
      </span>
    </div>`;
  return document.querySelector<HTMLElement>('#label')!;
}

const widthOf = (element: Element) => parseFloat(getComputedStyle(element).width);
const opacityOf = (element: Element) => parseFloat(getComputedStyle(element).opacity);

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

/** The running motion of an element that animates the given property. */
function animationOf(element: Element, property: string): Animation {
  const found = element.getAnimations().find((animation) =>
    Object.keys((animation.effect as KeyframeEffect).getKeyframes()[0] ?? {}).includes(property),
  );
  if (!found) throw new Error(`No running animation of ${property}`);
  return found;
}

/** Waits until every motion of an element has ended, and until the controller has written the end state. */
async function finishMotions(element: Element) {
  while (element.getAnimations().length > 0) {
    await Promise.all(element.getAnimations().map((animation) => animation.finished));
  }
  await new Promise((resolve) => setTimeout(resolve));
}

describe('fab label controller in the browser', () => {
  let controller: FabLabelController | undefined;
  let extended: boolean;

  afterEach(() => {
    controller?.destroy();
    controller = undefined;
    document.documentElement.removeAttribute('data-motion-policy');
    document.body.innerHTML = '';
  });

  function connect(label: HTMLElement, options: Partial<Parameters<typeof createFabLabelController>[0]> = {}) {
    controller = createFabLabelController({ label, extended: () => extended, ...options });
    return controller;
  }

  it('applies a compact label collapsed and transparent at mount, without a motion', () => {
    extended = false;
    const label = mountLabel(false);
    connect(label);

    expect(label.getAnimations()).toHaveLength(0);
    expect(label.style.width).toBe('0px');
    expect(widthOf(label)).toBeCloseTo(0, 0);
    expect(label.style.opacity).toBe('0');
    expect(opacityOf(label)).toBe(0);
  });

  it('applies an extended label at its content width at mount, without a motion', () => {
    extended = true;
    const label = mountLabel(true);
    connect(label);

    expect(label.getAnimations()).toHaveLength(0);
    expect(label.style.width).toBe('auto');
    expect(widthOf(label)).toBeCloseTo(80, 0);
    expect(label.style.opacity).toBe('1');
  });

  it('expands on the default spatial spring for the width and the default effects spring for the opacity', () => {
    extended = false;
    const label = mountLabel(false);
    connect(label);

    extended = true;
    controller!.update();

    expect(animationOf(label, 'width').effect!.getComputedTiming().duration).toBe(
      tokenDuration(label, 'spring.default.spatial'),
    );
    expect(animationOf(label, 'opacity').effect!.getComputedTiming().duration).toBe(
      tokenDuration(label, 'spring.default.effects'),
    );
  });

  it('collapses on the default spatial spring for the width, and fades out on the fast effects spring', () => {
    extended = true;
    const label = mountLabel(true);
    connect(label);

    extended = false;
    controller!.update();

    expect(animationOf(label, 'width').effect!.getComputedTiming().duration).toBe(
      tokenDuration(label, 'spring.default.spatial'),
    );
    expect(animationOf(label, 'opacity').effect!.getComputedTiming().duration).toBe(
      tokenDuration(label, 'spring.fast.effects'),
    );
  });

  it('ends an expansion at auto with no inline width and full opacity', async () => {
    extended = false;
    const label = mountLabel(false);
    connect(label);

    extended = true;
    controller!.update();
    await finishMotions(label);

    expect(label.style.width).toBe('');
    expect(widthOf(label)).toBeCloseTo(80, 0);
    expect(label.style.opacity).toBe('1');
    expect(opacityOf(label)).toBe(1);
  });

  it('ends a collapse at zero width and zero opacity', async () => {
    extended = true;
    const label = mountLabel(true);
    connect(label);

    extended = false;
    controller!.update();
    await finishMotions(label);

    expect(label.style.width).toBe('0px');
    expect(widthOf(label)).toBeCloseTo(0, 0);
    expect(label.style.opacity).toBe('0');
    expect(opacityOf(label)).toBe(0);
  });

  it('starts a collapse from the full content width', () => {
    extended = true;
    const label = mountLabel(true);
    connect(label);

    extended = false;
    controller!.update();
    freezeAt(label, 0);

    expect(widthOf(label)).toBeCloseTo(80, 0);
    expect(opacityOf(label)).toBeCloseTo(1, 2);
  });

  it('carries an interrupted collapse from the width it shows, without a jump', () => {
    extended = false;
    const label = mountLabel(false);
    connect(label);

    extended = true;
    controller!.update();
    // Early in the curve: the expressive spatial spring overshoots its target, so mid-way the label can be wider than `auto`.
    freezeAt(label, 0.25);
    const shown = widthOf(label);
    expect(shown).toBeGreaterThan(1);
    expect(shown).toBeLessThan(80);

    extended = false;
    controller!.update();
    freezeAt(label, 0);

    expect(Math.abs(widthOf(label) - shown)).toBeLessThanOrEqual(1);
  });

  it('applies the instant state at once when the extra reduced-motion switch is on', () => {
    extended = false;
    const label = mountLabel(false);
    connect(label, { reducedMotion: () => true });

    extended = true;
    controller!.update();

    expect(label.getAnimations()).toHaveLength(0);
    expect(label.style.width).toBe('auto');
    expect(label.style.opacity).toBe('1');
  });

  it('applies the instant state at once under the document reduced policy', () => {
    document.documentElement.setAttribute('data-motion-policy', 'reduce');
    expect(motionPolicy.reduced).toBe(true);
    extended = false;
    const label = mountLabel(false);
    connect(label);

    extended = true;
    controller!.update();

    expect(label.getAnimations()).toHaveLength(0);
    expect(label.style.width).toBe('auto');
  });

  it('takes the timing it is given for the width and keeps the effects spring for the opacity', () => {
    extended = false;
    const label = mountLabel(false);
    const timing = { duration: 'duration.long1', easing: 'easing.linear' } as const;
    connect(label, { timing });

    extended = true;
    controller!.update();

    expect(animationOf(label, 'width').effect!.getComputedTiming().duration).toBe(
      resolveWaapiTiming(label, timing, 'expressive')!.duration,
    );
    expect(animationOf(label, 'opacity').effect!.getComputedTiming().duration).toBe(
      tokenDuration(label, 'spring.default.effects'),
    );
  });

  it('ignores a call that does not change the state', () => {
    extended = true;
    const label = mountLabel(true);
    connect(label);

    controller!.update();

    expect(label.getAnimations()).toHaveLength(0);
  });

  it('cancels its running change on destroy, so no motion outlives the controller', () => {
    extended = false;
    const label = mountLabel(false);
    connect(label);

    extended = true;
    controller!.update();
    freezeAt(label, 0.5);
    controller!.destroy();
    controller = undefined;

    expect(label.getAnimations()).toHaveLength(0);
  });
});
