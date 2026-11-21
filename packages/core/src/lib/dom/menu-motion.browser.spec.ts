import { resolveWaapiTiming } from '@udixio/motion';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createMenuTransitionController,
  measureMenuBox,
  type MenuTransitionController,
} from './menu-motion.js';

/** A 40 px trigger at (100, 200) and a 180 x 120 menu placed at (300, 160), on the trigger's right. */
function mount() {
  document.body.innerHTML = `
    <button id="trigger" style="position: fixed; left: 100px; top: 200px; width: 200px; height: 40px; margin: 0">Share</button>
    <div id="surface" style="position: fixed; left: 300px; top: 160px; margin: 0">
      <div id="menu" role="menu" style="width: 180px; height: 120px; background: #888"></div>
    </div>`;
  return {
    trigger: document.querySelector<HTMLElement>('#trigger')!,
    surface: document.querySelector<HTMLElement>('#surface')!,
    menu: document.querySelector<HTMLElement>('#menu')!,
  };
}

const opacityOf = (element: Element) =>
  parseFloat(getComputedStyle(element).opacity);
/** The scale of the transform, read from its matrix (1 when it has none). */
const scaleOf = (element: Element) => {
  const transform = getComputedStyle(element).transform;
  return transform === 'none' ? 1 : new DOMMatrixReadOnly(transform).a;
};
/** The animation of the menu that animates the given property. */
const animationOf = (element: Element, property: 'opacity' | 'transform') =>
  element
    .getAnimations()
    .find(
      (animation) =>
        (animation.effect as KeyframeEffect).getKeyframes()[0]?.[property] !==
        undefined,
    )!;
/** The duration in ms that a motion token plays with in this document (expressive scheme). */
const tokenDuration = (
  element: HTMLElement,
  timing: Parameters<typeof resolveWaapiTiming>[1],
) => resolveWaapiTiming(element, timing, 'expressive')!.duration;
/** Freezes every animation of an element at the given fraction of its duration. */
function freezeAt(element: Element, fraction: number) {
  for (const animation of element.getAnimations()) {
    animation.pause();
    animation.currentTime =
      Number(animation.effect!.getComputedTiming().duration) * fraction;
  }
}
/** Resolves once the element's animations have finished, then lets the controller write its rest state. */
async function settle(element: Element) {
  await Promise.allSettled(
    element.getAnimations().map((animation) => animation.finished),
  );
  await new Promise((resolve) => setTimeout(resolve));
}

describe('createMenuTransitionController in the browser', () => {
  let controller: MenuTransitionController | undefined;

  afterEach(() => {
    controller?.destroy();
    controller = undefined;
    document.documentElement.removeAttribute('data-motion-policy');
    document.body.innerHTML = '';
  });

  it('starts closed: transparent, at its closed scale, with no animation', () => {
    const { menu, trigger } = mount();
    controller = createMenuTransitionController({ menu, anchor: trigger });

    expect(menu.getAnimations()).toHaveLength(0);
    expect(opacityOf(menu)).toBe(0);
    expect(scaleOf(menu)).toBeCloseTo(0.8);
  });

  it('opens from 0.8 and transparent, not at its final size, and settles whole with nothing left inline', async () => {
    const { menu, trigger } = mount();
    controller = createMenuTransitionController({ menu, anchor: trigger });

    controller.setOpen(true);
    freezeAt(menu, 0);
    expect(scaleOf(menu)).toBeCloseTo(0.8);
    expect(opacityOf(menu)).toBe(0);

    for (const animation of menu.getAnimations()) animation.play();
    await settle(menu);
    expect(menu.getAnimations()).toHaveLength(0);
    expect(scaleOf(menu)).toBe(1);
    expect(opacityOf(menu)).toBe(1);
    expect(menu.style.transform).toBe('');
    expect(menu.style.opacity).toBe('');
  });

  it('scales in on the fast spatial spring and fades on the fast effects spring', () => {
    const { menu, trigger } = mount();
    controller = createMenuTransitionController({ menu, anchor: trigger });

    controller.setOpen(true);

    const scale = animationOf(menu, 'transform');
    const fade = animationOf(menu, 'opacity');
    expect(Number(scale.effect!.getComputedTiming().duration)).toBe(
      tokenDuration(menu, 'spring.fast.spatial'),
    );
    expect(Number(fade.effect!.getComputedTiming().duration)).toBe(
      tokenDuration(menu, 'spring.fast.effects'),
    );
  });

  it('leaves faster than it enters, on the fast effects spring, and reports the end of the exit only then', async () => {
    const { menu, trigger } = mount();
    const onExited = vi.fn();
    controller = createMenuTransitionController({
      menu,
      anchor: trigger,
      onExited,
    });
    controller.setOpen(true);
    await settle(menu);

    controller.setOpen(false);
    const scale = animationOf(menu, 'transform');
    const exitDuration = Number(scale.effect!.getComputedTiming().duration);
    expect(exitDuration).toBe(tokenDuration(menu, 'spring.fast.effects'));
    expect(exitDuration).toBeLessThan(
      tokenDuration(menu, 'spring.fast.spatial'),
    );
    expect(menu.style.pointerEvents).toBe('none');
    // Midway the menu is still seen: the adapter must not hide it yet.
    freezeAt(menu, 0.3);
    await new Promise((resolve) => setTimeout(resolve));
    expect(onExited).not.toHaveBeenCalled();
    expect(opacityOf(menu)).toBeGreaterThan(0);

    for (const animation of menu.getAnimations()) animation.play();
    await settle(menu);
    expect(onExited).toHaveBeenCalledOnce();
    expect(opacityOf(menu)).toBe(0);
    expect(scaleOf(menu)).toBeCloseTo(0.8);
  });

  it('grows from the edge that faces the trigger, on the side it opened on', () => {
    const { menu, trigger, surface } = mount();
    controller = createMenuTransitionController({ menu, anchor: trigger });

    // On the trigger's right: from its left edge, at the trigger's middle (y 220 in a menu from 160 to 280).
    controller.setOpen(true);
    expect(menu.style.transformOrigin).toBe('0% 50%');

    // Moved to the trigger's left (RTL, or no room on the right), then opened again: from its right edge.
    controller.setOpen(false);
    surface.style.left = '-80px';
    controller.setOpen(true);
    expect(menu.style.transformOrigin).toBe('100% 50%');
  });

  it('grows a context menu from the pointer, from the corner the menu flipped to', () => {
    const { menu } = mount();
    let point = { x: 300, y: 160 };
    controller = createMenuTransitionController({
      menu,
      anchor: () => ({
        left: point.x,
        top: point.y,
        right: point.x,
        bottom: point.y,
      }),
    });

    controller.setOpen(true);
    expect(menu.style.transformOrigin).toBe('0% 0%');

    // Near the bottom-right corner the menu opens above and to the left of the pointer.
    point = { x: 480, y: 280 };
    controller.setOpen(true);
    expect(menu.style.transformOrigin).toBe('100% 100%');
  });

  it('an open interrupted by a close continues from the scale and opacity it shows, and reports no exit until it ends', async () => {
    const { menu, trigger } = mount();
    const onExited = vi.fn();
    controller = createMenuTransitionController({
      menu,
      anchor: trigger,
      onExited,
    });
    controller.setOpen(true);
    freezeAt(menu, 0.15);
    const shownScale = scaleOf(menu);
    const shownOpacity = opacityOf(menu);
    expect(shownScale).toBeGreaterThan(0.8);
    expect(shownScale).toBeLessThan(1.1);

    controller.setOpen(false);
    freezeAt(menu, 0);
    expect(scaleOf(menu)).toBeCloseTo(shownScale, 3);
    expect(opacityOf(menu)).toBeCloseTo(shownOpacity, 3);

    // Opened again before the exit ends: the exit is not reported.
    controller.setOpen(true);
    freezeAt(menu, 0);
    expect(scaleOf(menu)).toBeCloseTo(shownScale, 2);
    for (const animation of menu.getAnimations()) animation.play();
    await settle(menu);
    expect(onExited).not.toHaveBeenCalled();
    expect(scaleOf(menu)).toBe(1);
  });

  it('applies the change at once under the document reduced motion policy, and reports the exit at once', async () => {
    document.documentElement.setAttribute('data-motion-policy', 'reduce');
    const { menu, trigger } = mount();
    const onExited = vi.fn();
    controller = createMenuTransitionController({
      menu,
      anchor: trigger,
      onExited,
    });

    controller.setOpen(true);
    expect(menu.getAnimations()).toHaveLength(0);
    expect(opacityOf(menu)).toBe(1);
    expect(scaleOf(menu)).toBe(1);

    controller.setOpen(false);
    expect(menu.getAnimations()).toHaveLength(0);
    expect(opacityOf(menu)).toBe(0);
    await Promise.resolve();
    expect(onExited).toHaveBeenCalledOnce();
  });

  it('applies the change at once when the reducedMotion option says so', () => {
    const { menu, trigger } = mount();
    controller = createMenuTransitionController({
      menu,
      anchor: trigger,
      reducedMotion: () => true,
    });

    controller.setOpen(true);
    expect(menu.getAnimations()).toHaveLength(0);
    expect(opacityOf(menu)).toBe(1);
  });

  it('measures the layout box of a menu without the scale its motion gives it', () => {
    const { menu, trigger } = mount();
    controller = createMenuTransitionController({ menu, anchor: trigger });
    controller.setOpen(true);
    freezeAt(menu, 0);

    const box = measureMenuBox(menu);
    expect(menu.getBoundingClientRect().width).toBeCloseTo(144);
    expect(box.left).toBeCloseTo(300);
    expect(box.top).toBeCloseTo(160);
    expect(box.width).toBe(180);
    expect(box.height).toBe(120);
  });

  it('cancels its motion and gives back the inline style on destroy', () => {
    const { menu, trigger } = mount();
    controller = createMenuTransitionController({ menu, anchor: trigger });
    controller.setOpen(true);

    controller.destroy();
    controller = undefined;

    expect(menu.getAnimations()).toHaveLength(0);
    expect(menu.style.opacity).toBe('');
    expect(menu.style.transform).toBe('');
    expect(menu.style.transformOrigin).toBe('');
  });
});
