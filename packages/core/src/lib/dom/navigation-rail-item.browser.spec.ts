import { resolveWaapiTiming } from '@udixio/motion';
import { afterEach, describe, expect, it } from 'vitest';
import {
  createNavigationRailItemLabelController,
  type NavigationRailItemLabelAxis,
  type NavigationRailItemLabelController,
} from './navigation-rail-item.js';

/** A label that sizes to its 80 px by 24 px content when its size is `auto`, as an inline item of the rail does. */
function mountLabel(): HTMLElement {
  document.body.innerHTML = `
    <span id="label" style="display: inline-block; overflow: hidden; vertical-align: top">
      <span style="display: block; width: 80px; height: 24px"></span>
    </span>
  `;
  return document.querySelector<HTMLElement>('#label')!;
}

const widthOf = (element: Element) => parseFloat(getComputedStyle(element).width);
const heightOf = (element: Element) => parseFloat(getComputedStyle(element).height);
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

/** The animation of an element that animates the given property, found among its running ones. */
function animationOf(element: Element, property: string): Animation {
  const found = element.getAnimations().find((animation) =>
    Object.keys((animation.effect as KeyframeEffect).getKeyframes()[0] ?? {}).includes(property),
  );
  if (!found) throw new Error(`No running animation of ${property}`);
  return found;
}

describe('createNavigationRailItemLabelController in the browser', () => {
  let controller: NavigationRailItemLabelController | undefined;

  afterEach(() => {
    controller?.destroy();
    controller = undefined;
    document.documentElement.removeAttribute('data-motion-policy');
    document.body.innerHTML = '';
  });

  /** A controller whose visibility and axis are read from the returned setters. */
  function connect(label: HTMLElement, state: { visible: boolean; axis?: NavigationRailItemLabelAxis }, extra = {}) {
    controller = createNavigationRailItemLabelController({
      label,
      axis: () => state.axis ?? 'horizontal',
      visible: () => state.visible,
      ...extra,
    });
    return controller;
  }

  it('places a visible label at its content size and a hidden one at zero, without an animation', () => {
    const shown = mountLabel();
    connect(shown, { visible: true });

    expect(shown.getAnimations()).toHaveLength(0);
    expect(shown.style.width).toBe('auto');
    expect(widthOf(shown)).toBeCloseTo(80, 0);
    expect(shown.style.opacity).toBe('1');
    controller!.destroy();

    const hidden = mountLabel();
    connect(hidden, { visible: false });

    expect(hidden.getAnimations()).toHaveLength(0);
    expect(hidden.style.width).toBe('0px');
    expect(widthOf(hidden)).toBeCloseTo(0, 0);
    expect(hidden.style.opacity).toBe('0');
  });

  it('grows a shown label to its content width on the spatial spring, then leaves the width to the content', async () => {
    const label = mountLabel();
    const state = { visible: false };
    connect(label, state);

    state.visible = true;
    controller!.update();

    const size = animationOf(label, 'width');
    expect(size.effect!.getComputedTiming().duration).toBe(
      tokenDuration(label, 'spring.default.spatial'),
    );
    await size.finished;

    expect(label.style.width).toBe('');
    expect(widthOf(label)).toBeCloseTo(80, 0);
    expect(label.style.opacity).toBe('1');
  });

  it('fades a label in after its size has started: 150 ms on the short3 curve, starting 150 ms late', () => {
    const label = mountLabel();
    const state = { visible: false };
    connect(label, state);

    state.visible = true;
    controller!.update();

    const fade = animationOf(label, 'opacity');
    const timing = fade.effect!.getComputedTiming();
    expect(timing.delay).toBe(150);
    expect(timing.duration).toBe(150);
    expect((fade.effect as KeyframeEffect).getTiming().easing).toBe('cubic-bezier(0.2, 0, 0, 1)');
  });

  it('shrinks a hidden label to zero and fades it out at once', async () => {
    const label = mountLabel();
    const state = { visible: true };
    connect(label, state);

    state.visible = false;
    controller!.update();

    const fade = animationOf(label, 'opacity');
    expect(fade.effect!.getComputedTiming().delay).toBe(0);
    expect(fade.effect!.getComputedTiming().duration).toBe(150);
    await Promise.all(label.getAnimations().map((animation) => animation.finished));

    expect(label.style.width).toBe('0px');
    expect(widthOf(label)).toBeCloseTo(0, 0);
    expect(opacityOf(label)).toBe(0);
  });

  it('moves the height, not the width, on the vertical axis', async () => {
    const label = mountLabel();
    const state = { visible: false, axis: 'vertical' as NavigationRailItemLabelAxis };
    connect(label, state);

    state.visible = true;
    controller!.update();

    const size = animationOf(label, 'height');
    await size.finished;

    expect(label.style.height).toBe('');
    expect(heightOf(label)).toBeCloseTo(24, 0);
    expect(label.style.width).toBe('');
  });

  it('continues from the size it shows when the label reverses mid-way', () => {
    const label = mountLabel();
    const state = { visible: false };
    connect(label, state);

    state.visible = true;
    controller!.update();
    freezeAt(label, 0.25);
    const shown = widthOf(label);
    expect(shown).toBeGreaterThan(1);
    expect(shown).toBeLessThan(79);

    state.visible = false;
    controller!.update();
    const [first] = (animationOf(label, 'width').effect as KeyframeEffect).getKeyframes();
    expect(Math.abs(parseFloat(String(first!.width)) - shown)).toBeLessThanOrEqual(1);
  });

  it('applies the end state at once on the first apply, and under the document reduced motion policy', () => {
    document.documentElement.setAttribute('data-motion-policy', 'reduce');
    const label = mountLabel();
    const state = { visible: false };
    connect(label, state);

    state.visible = true;
    controller!.update();

    expect(label.getAnimations()).toHaveLength(0);
    expect(label.style.width).toBe('auto');
    expect(label.style.opacity).toBe('1');
  });

  it('applies the end state at once when the reducedMotion option says so', () => {
    const label = mountLabel();
    const state = { visible: true };
    connect(label, state, { reducedMotion: () => true });

    state.visible = false;
    controller!.update();

    expect(label.getAnimations()).toHaveLength(0);
    expect(label.style.width).toBe('0px');
    expect(label.style.opacity).toBe('0');
  });

  it('does not restart the motion when neither the axis nor the visibility changed', () => {
    const label = mountLabel();
    const state = { visible: false };
    connect(label, state);

    state.visible = true;
    controller!.update();
    const running = label.getAnimations();
    controller!.update();

    expect(label.getAnimations()).toHaveLength(running.length);
    expect(label.getAnimations().every((animation) => running.includes(animation))).toBe(true);
  });

  it('plays the timing option for the size, and keeps its own fade', () => {
    const label = mountLabel();
    const state = { visible: false };
    connect(label, state, { timing: { duration: 'duration.long1', easing: 'easing.standard' } });

    state.visible = true;
    controller!.update();

    expect(animationOf(label, 'width').effect!.getComputedTiming().duration).toBe(450);
    expect(animationOf(label, 'opacity').effect!.getComputedTiming().duration).toBe(150);
  });

  it('cancels both running motions on destroy', () => {
    const label = mountLabel();
    const state = { visible: false };
    connect(label, state);

    state.visible = true;
    controller!.update();
    expect(label.getAnimations()).toHaveLength(2);
    controller!.destroy();
    controller = undefined;

    expect(label.getAnimations()).toHaveLength(0);
  });
});
