import { resolveWaapiTiming } from '@udixio/motion';
import { afterEach, describe, expect, it } from 'vitest';
import { createSplitButtonController, type SplitButtonController } from './split-button.js';

/** The duration in ms of the shape motion token in this document (expressive scheme). */
const shapeDuration = (element: HTMLElement) => resolveWaapiTiming(element, 'spring.default.effects', 'expressive')!.duration;

const radiusOf = (element: HTMLElement) => parseFloat(getComputedStyle(element).borderTopRightRadius);
const menuRadiusOf = (element: HTMLElement) => parseFloat(getComputedStyle(element).borderTopLeftRadius);
const angleOf = (element: HTMLElement) => parseFloat(getComputedStyle(element).rotate);

/** Pauses the running motions of an element at a fraction of their duration, so their values can be read. */
function freezeAt(element: Element, fraction: number) {
  for (const animation of element.getAnimations()) {
    animation.pause();
    animation.currentTime = Number(animation.effect!.getComputedTiming().duration) * fraction;
  }
}

/** Waits until every running motion of an element has ended, and until its controller has written the end state. */
async function finishMotions(element: Element) {
  while (element.getAnimations().length > 0) {
    await Promise.all(element.getAnimations().map((animation) => animation.finished));
  }
  await new Promise((resolve) => setTimeout(resolve));
}

describe('createSplitButtonController in the browser', () => {
  let controller: SplitButtonController | undefined;
  let primary: HTMLElement;
  let menu: HTMLElement;
  let icon: HTMLElement;

  /**
   * A 40 px split button: the primary expands its right corners on hover, the menu its left corners when open. The
   * container takes no pointer, so the real pointer never sets `:hover` here: only the events the tests dispatch do.
   */
  function mount(): void {
    document.body.innerHTML = `
      <div id="split" style="display: flex; pointer-events: none">
        <button id="primary" style="height: 40px; width: 80px"></button>
        <button id="menu" style="height: 40px; width: 40px"><span id="icon" style="display: inline-block"></span></button>
        <div role="menu"><button role="menuitem">Save a copy</button></div>
      </div>`;
    primary = document.querySelector<HTMLElement>('#primary')!;
    menu = document.querySelector<HTMLElement>('#menu')!;
    icon = document.querySelector<HTMLElement>('#icon')!;
  }

  function connect(extra: { reducedMotion?: () => boolean } = {}) {
    mount();
    const root = document.querySelector<HTMLElement>('#split')!;
    controller = createSplitButtonController({
      root,
      primaryButton: primary,
      menuButton: menu,
      menuIcon: icon,
      onDismiss: () => undefined,
      ...extra,
    });
    return controller;
  }

  afterEach(() => {
    controller?.destroy();
    controller = undefined;
    document.body.innerHTML = '';
  });

  it('morphs the hovered button corners to half the button height on the default effects spring, then rests them', async () => {
    connect();
    primary.dispatchEvent(new Event('pointerenter'));

    expect(primary.getAnimations()).toHaveLength(1);
    expect(primary.getAnimations()[0].effect!.getComputedTiming().duration).toBe(shapeDuration(primary));
    await finishMotions(primary);
    expect(primary.style.borderTopRightRadius).toBe('20px');
    expect(primary.style.borderBottomRightRadius).toBe('20px');

    primary.dispatchEvent(new Event('pointerleave'));
    await finishMotions(primary);
    expect(primary.style.borderTopRightRadius).toBe('4px');
    expect(primary.style.borderBottomRightRadius).toBe('4px');
  });

  it('carries a morph that is running from the radius it shows when the pointer leaves', async () => {
    connect();
    primary.dispatchEvent(new Event('pointerenter'));
    freezeAt(primary, 0.25);
    const shown = radiusOf(primary);
    expect(shown).toBeGreaterThan(4);

    primary.dispatchEvent(new Event('pointerleave'));
    freezeAt(primary, 0);
    expect(Math.abs(radiusOf(primary) - shown)).toBeLessThanOrEqual(1);

    for (const animation of primary.getAnimations()) animation.play();
    await finishMotions(primary);
    expect(primary.style.borderTopRightRadius).toBe('4px');
  });

  it('turns the chevron and expands the menu corners on open, on the default effects spring, and turns it back on close', async () => {
    connect();
    controller!.setOpen(true);

    expect(icon.getAnimations()).toHaveLength(1);
    expect(icon.getAnimations()[0].effect!.getComputedTiming().duration).toBe(shapeDuration(icon));
    await finishMotions(icon);
    expect(icon.style.rotate).toBe('180deg');
    await finishMotions(menu);
    expect(menu.style.borderTopLeftRadius).toBe('20px');
    expect(primary.style.borderTopRightRadius).toBe('4px');

    controller!.setOpen(false);
    await finishMotions(icon);
    expect(icon.style.rotate).toBe('0deg');
    await finishMotions(menu);
    expect(menu.style.borderTopLeftRadius).toBe('4px');
  });

  it('carries a running chevron turn from the angle it shows', async () => {
    connect();
    controller!.setOpen(true);
    freezeAt(icon, 0.5);
    const shown = angleOf(icon);
    expect(shown).toBeGreaterThan(0);

    controller!.setOpen(false);
    freezeAt(icon, 0);
    expect(Math.abs(angleOf(icon) - shown)).toBeLessThanOrEqual(1);

    for (const animation of icon.getAnimations()) animation.play();
    await finishMotions(icon);
    expect(icon.style.rotate).toBe('0deg');
  });

  it('applies the end state at once, with no motion, when instant is requested', () => {
    connect();
    controller!.setOpen(true, true);

    expect(icon.getAnimations()).toHaveLength(0);
    expect(icon.style.rotate).toBe('180deg');
    expect(menu.style.borderTopLeftRadius).toBe('20px');
    expect(menuRadiusOf(menu)).toBe(20);
  });

  it('applies the end state at once under the reduced override', () => {
    connect({ reducedMotion: () => true });
    primary.dispatchEvent(new Event('pointerenter'));
    controller!.setOpen(true);

    expect(primary.getAnimations()).toHaveLength(0);
    expect(icon.getAnimations()).toHaveLength(0);
    expect(primary.style.borderTopRightRadius).toBe('20px');
    expect(icon.style.rotate).toBe('180deg');
  });

  it('stops its morphs and its turn on destroy', () => {
    connect();
    primary.dispatchEvent(new Event('pointerenter'));
    controller!.setOpen(true);
    controller!.destroy();
    controller = undefined;

    expect(primary.getAnimations()).toHaveLength(0);
    expect(menu.getAnimations()).toHaveLength(0);
    expect(icon.getAnimations()).toHaveLength(0);
  });
});
