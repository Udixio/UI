import { resolveWaapiTiming } from '@udixio/motion';
import { userEvent } from '@vitest/browser/context';
import { afterEach, describe, expect, it } from 'vitest';
import { createFabMenuController, type FabMenuController } from './fab-menu.js';

/**
 * The closed trigger is 160 x 56 with a 16 px radius, the open trigger 56 x 56 with a 28 px radius. The trigger's CSS
 * follows `data-open`, as the adapters render it, and the two targets are hidden sizers measured by the controller.
 */
const STYLE = `
  <style>
    #menu { position: relative; display: inline-flex; flex-direction: column; align-items: flex-end; }
    #trigger { box-sizing: border-box; width: 160px; height: 56px; border-radius: 16px; background: #888; }
    #menu[data-open="true"] #trigger { width: 56px; height: 56px; border-radius: 28px; }
    #closed, #open { position: absolute; visibility: hidden; box-sizing: border-box; pointer-events: none; }
    #closed { width: 160px; height: 56px; border-radius: 16px; }
    #open { width: 56px; height: 56px; border-radius: 28px; }
    [data-fab-menu-action] { display: block; width: 120px; height: 40px; }
  </style>`;

/** Mounts the menu closed, or open, with `count` actions in its panel. */
function mountMenu({ open = false, count = 3 } = {}) {
  const actions = Array.from(
    { length: count },
    (_, index) =>
      `<div data-fab-menu-action id="action-${index}"><button>Action ${index}</button></div>`,
  ).join('');
  document.body.innerHTML = `${STYLE}
    <div id="menu" data-open="${open}">
      <div id="trigger"></div>
      <div id="closed"></div>
      <div id="open"></div>
      <div id="panel" aria-hidden="${!open}" ${open ? '' : 'hidden inert'}>${actions}</div>
    </div>`;
  const element = <T extends Element = HTMLElement>(selector: string) =>
    document.querySelector<T>(selector)!;
  return {
    menu: element('#menu'),
    trigger: element('#trigger'),
    closed: element('#closed'),
    open: element('#open'),
    panel: element('#panel') as HTMLElement,
    actions: Array.from(
      document.querySelectorAll<HTMLElement>('[data-fab-menu-action]'),
    ),
  };
}

/** Changes the open state through `data-open`, as an adapter does, and lets the observer run. */
async function setOpen(menu: HTMLElement, open: boolean) {
  menu.dataset['open'] = String(open);
  await Promise.resolve();
}

/** The duration in ms that a motion token plays with in this document (expressive scheme). */
const tokenDuration = (
  element: Element,
  timing: Parameters<typeof resolveWaapiTiming>[1],
) => resolveWaapiTiming(element as HTMLElement, timing, 'expressive')!.duration;

/** The animation of an element that animates the given property, found among its own motions. */
const animationOf = (
  element: Element,
  property: 'clipPath' | 'opacity' | 'width',
) =>
  element
    .getAnimations()
    .find(
      (animation) =>
        (animation.effect as KeyframeEffect).getKeyframes()[0]?.[property] !==
        undefined,
    )!;

/** The first keyframe of an element's animation of the given property. */
const firstFrame = (
  element: Element,
  property: 'clipPath' | 'opacity' | 'width',
) =>
  (animationOf(element, property).effect as KeyframeEffect).getKeyframes()[0]!;

/** Freezes every animation of an element at a fraction of its own duration, after its delay. */
function freezeAt(element: Element, fraction: number) {
  for (const animation of element.getAnimations()) {
    const timing = animation.effect!.getComputedTiming();
    animation.pause();
    animation.currentTime =
      Number(timing.delay) + Number(timing.duration) * fraction;
  }
}

/** Resolves once every running animation of the elements has finished, then lets the controller write its end state. */
async function settle(...elements: Element[]) {
  await Promise.allSettled(
    elements.flatMap((element) =>
      element.getAnimations().map((animation) => animation.finished),
    ),
  );
  await new Promise((resolve) => setTimeout(resolve));
}

describe('createFabMenuController in the browser', () => {
  let controller: FabMenuController | undefined;

  afterEach(() => {
    controller?.destroy();
    controller = undefined;
    document.documentElement.removeAttribute('data-motion-policy');
    document.documentElement.style.overflowAnchor = '';
    document.body.innerHTML = '';
  });

  it('morphs the trigger from the closed size to the open size and radius', async () => {
    const { menu, trigger, closed, open, panel, actions } = mountMenu();
    controller = createFabMenuController({
      root: menu,
      trigger,
      closedTrigger: closed,
      openTrigger: open,
      panel,
      onDismiss: () => undefined,
    });

    await setOpen(menu, true);
    await settle(trigger, ...actions);

    expect(trigger.style.width).toBe('');
    expect(trigger.style.height).toBe('');
    expect(trigger.getBoundingClientRect().width).toBeCloseTo(56, 0);
    expect(trigger.getBoundingClientRect().height).toBeCloseTo(56, 0);
    expect(trigger.style.borderRadius).toBe('28px');
    expect(getComputedStyle(trigger).borderTopLeftRadius).toBe('28px');
  });

  it('starts a fresh morph from the closed size, although the CSS already shows the open size', async () => {
    const { menu, trigger, closed, open, panel, actions } = mountMenu();
    controller = createFabMenuController({
      root: menu,
      trigger,
      closedTrigger: closed,
      openTrigger: open,
      panel,
      onDismiss: () => undefined,
    });

    menu.dataset['open'] = 'true';
    // The CSS of the new state is already applied when the controller runs: a carry from the computed size would start at 56 px.
    expect(parseFloat(getComputedStyle(trigger).width)).toBeCloseTo(56, 0);
    await Promise.resolve();

    expect(parseFloat(String(firstFrame(trigger, 'width').width))).toBeCloseTo(
      160,
      0,
    );
    expect(
      animationOf(trigger, 'width').effect!.getComputedTiming().duration,
    ).toBe(tokenDuration(trigger, 'spring.default.spatial'));
    await settle(trigger, ...actions);
  });

  it('closes back to the closed size and hands the size back to CSS', async () => {
    const { menu, trigger, closed, open, panel, actions } = mountMenu();
    controller = createFabMenuController({
      root: menu,
      trigger,
      closedTrigger: closed,
      openTrigger: open,
      panel,
      onDismiss: () => undefined,
    });
    await setOpen(menu, true);
    await settle(trigger, ...actions);

    await setOpen(menu, false);
    await settle(trigger, ...actions);

    expect(trigger.style.width).toBe('');
    expect(trigger.style.height).toBe('');
    expect(trigger.getBoundingClientRect().width).toBeCloseTo(160, 0);
    expect(trigger.style.borderRadius).toBe('16px');
    expect(panel.hidden).toBe(true);
    expect(panel.style.opacity).toBe('0');
  });

  it('opens outward: each action wipes in, then fades, and the cascade follows the stagger token', async () => {
    const { menu, trigger, closed, open, panel, actions } = mountMenu({
      count: 3,
    });
    menu.style.setProperty('--udx-motion-stagger-normal', '30ms');
    controller = createFabMenuController({
      root: menu,
      trigger,
      closedTrigger: closed,
      openTrigger: open,
      panel,
      onDismiss: () => undefined,
    });

    await setOpen(menu, true);

    // The panel sits above the trigger, so the last action, nearest the trigger, leads.
    const [first, middle, last] = actions as [
      HTMLElement,
      HTMLElement,
      HTMLElement,
    ];
    expect(
      animationOf(last, 'clipPath').effect!.getComputedTiming().delay,
    ).toBe(0);
    expect(
      animationOf(middle, 'clipPath').effect!.getComputedTiming().delay,
    ).toBe(30);
    expect(
      animationOf(first, 'clipPath').effect!.getComputedTiming().delay,
    ).toBe(60);
    for (const action of actions) {
      const wipe = animationOf(action, 'clipPath');
      const fade = animationOf(action, 'opacity');
      // Browsers serialize the keyframe values their own way: `inset(0px 0px 0px 100%)` in Chromium.
      expect(String(firstFrame(action, 'clipPath').clipPath)).toMatch(
        /^inset\(0(px)? 0(px)? 0(px)? 100%\)$/,
      );
      expect(wipe.effect!.getComputedTiming().duration).toBe(
        tokenDuration(action, 'spring.fast.spatial'),
      );
      expect(fade.effect!.getComputedTiming().duration).toBe(
        tokenDuration(action, 'spring.fast.effects'),
      );
      expect(fade.effect!.getComputedTiming().delay).toBe(
        Number(wipe.effect!.getComputedTiming().delay) + 150,
      );
    }
    await settle(trigger, ...actions);
  });

  it('caps the cascade at the stagger maximum', async () => {
    const { menu, trigger, closed, open, panel, actions } = mountMenu({
      count: 3,
    });
    menu.style.setProperty('--udx-motion-stagger-normal', '30ms');
    menu.style.setProperty('--udx-motion-stagger-max', '40ms');
    controller = createFabMenuController({
      root: menu,
      trigger,
      closedTrigger: closed,
      openTrigger: open,
      panel,
      onDismiss: () => undefined,
    });

    await setOpen(menu, true);

    const [first, middle, last] = actions as [
      HTMLElement,
      HTMLElement,
      HTMLElement,
    ];
    expect(
      animationOf(last, 'clipPath').effect!.getComputedTiming().delay,
    ).toBe(0);
    expect(
      animationOf(middle, 'clipPath').effect!.getComputedTiming().delay,
    ).toBe(30);
    expect(
      animationOf(first, 'clipPath').effect!.getComputedTiming().delay,
    ).toBe(40);
    await settle(trigger, ...actions);
  });

  it('ends an open with no inline clip-path, a visible overflow and full opacity', async () => {
    const { menu, trigger, closed, open, panel, actions } = mountMenu();
    controller = createFabMenuController({
      root: menu,
      trigger,
      closedTrigger: closed,
      openTrigger: open,
      panel,
      onDismiss: () => undefined,
    });
    await setOpen(menu, true);
    await settle(trigger, ...actions);

    for (const action of actions) {
      expect(action.style.clipPath).toBe('');
      expect(action.style.overflow).toBe('visible');
      expect(getComputedStyle(action).clipPath).toBe('none');
      expect(getComputedStyle(action).opacity).toBe('1');
    }
  });

  it('ends a close with the panel hidden and each action at its clipped, transparent frame', async () => {
    const { menu, trigger, closed, open, panel, actions } = mountMenu();
    controller = createFabMenuController({
      root: menu,
      trigger,
      closedTrigger: closed,
      openTrigger: open,
      panel,
      onDismiss: () => undefined,
    });
    await setOpen(menu, true);
    await settle(trigger, ...actions);

    await setOpen(menu, false);
    await settle(trigger, ...actions);

    expect(panel.hidden).toBe(true);
    expect(panel.style.opacity).toBe('0');
    expect(panel.inert).toBe(true);
    expect(panel.getAttribute('aria-hidden')).toBe('true');
    for (const action of actions) {
      expect(action.style.clipPath).toContain('100%');
      expect(action.style.opacity).toBe('0');
    }
  });

  it('an open interrupted by a close carries from the trigger size and the action clips and opacities it shows', async () => {
    const { menu, trigger, closed, open, panel, actions } = mountMenu({
      count: 3,
    });
    controller = createFabMenuController({
      root: menu,
      trigger,
      closedTrigger: closed,
      openTrigger: open,
      panel,
      onDismiss: () => undefined,
    });
    await setOpen(menu, true);
    for (const element of [trigger, ...actions]) freezeAt(element, 0.25);

    const shownWidth = parseFloat(getComputedStyle(trigger).width);
    const shownClips = actions.map(
      (action) => getComputedStyle(action).clipPath,
    );
    const shownOpacities = actions.map((action) =>
      parseFloat(getComputedStyle(action).opacity),
    );
    expect(shownWidth).toBeGreaterThan(56);
    expect(shownWidth).toBeLessThan(160);

    await setOpen(menu, false);

    expect(
      Math.abs(
        parseFloat(String(firstFrame(trigger, 'width').width)) - shownWidth,
      ),
    ).toBeLessThanOrEqual(1);
    actions.forEach((action, index) => {
      expect(firstFrame(action, 'clipPath').clipPath).toBe(shownClips[index]);
      expect(Number(firstFrame(action, 'opacity').opacity)).toBeCloseTo(
        shownOpacities[index]!,
        2,
      );
    });
    await settle(trigger, ...actions);
    expect(panel.hidden).toBe(true);
  });

  it('applies the end state at once under the document reduced motion policy', async () => {
    document.documentElement.setAttribute('data-motion-policy', 'reduce');
    const { menu, trigger, closed, open, panel, actions } = mountMenu();
    controller = createFabMenuController({
      root: menu,
      trigger,
      closedTrigger: closed,
      openTrigger: open,
      panel,
      onDismiss: () => undefined,
    });

    await setOpen(menu, true);

    expect(trigger.getAnimations()).toHaveLength(0);
    expect(trigger.getBoundingClientRect().width).toBeCloseTo(56, 0);
    expect(panel.hidden).toBe(false);
    for (const action of actions) {
      expect(action.getAnimations()).toHaveLength(0);
      expect(action.style.clipPath).toBe('');
      expect(action.style.opacity).toBe('1');
    }

    await setOpen(menu, false);

    expect(trigger.getAnimations()).toHaveLength(0);
    expect(trigger.getBoundingClientRect().width).toBeCloseTo(160, 0);
    expect(panel.hidden).toBe(true);
  });

  it('applies the end state at once when the reducedMotion option says so', async () => {
    const { menu, trigger, closed, open, panel, actions } = mountMenu();
    controller = createFabMenuController({
      root: menu,
      trigger,
      closedTrigger: closed,
      openTrigger: open,
      panel,
      onDismiss: () => undefined,
      reducedMotion: () => true,
    });

    await setOpen(menu, true);

    expect(trigger.getAnimations()).toHaveLength(0);
    expect(actions.every((action) => action.getAnimations().length === 0)).toBe(
      true,
    );
    expect(panel.hidden).toBe(false);
    expect(panel.inert).toBe(false);
  });

  it('cancels the running morph and cascade on destroy and restores the inline styles', async () => {
    const { menu, trigger, closed, open, panel, actions } = mountMenu();
    controller = createFabMenuController({
      root: menu,
      trigger,
      closedTrigger: closed,
      openTrigger: open,
      panel,
      onDismiss: () => undefined,
    });
    await setOpen(menu, true);
    expect(trigger.getAnimations().length).toBeGreaterThan(0);

    controller.destroy();
    controller = undefined;

    expect(trigger.getAnimations()).toHaveLength(0);
    for (const action of actions)
      expect(action.getAnimations()).toHaveLength(0);
    expect(trigger.style.width).toBe('');
    expect(trigger.style.borderRadius).toBe('');
    expect(panel.hidden).toBe(true);
  });

  describe('focus on open', () => {
    /** Mounts the menu as a real button at the bottom of a page that scrolls, with the trigger's click opening it. */
    function mountScrolledMenu() {
      const mounted = mountMenu();
      const trigger = document.createElement('button');
      trigger.id = 'trigger-button';
      trigger.textContent = 'Create';
      mounted.trigger.append(trigger);
      trigger.addEventListener('click', () => {
        mounted.menu.dataset['open'] = String(mounted.menu.dataset['open'] !== 'true');
      });
      const outside = document.createElement('button');
      outside.textContent = 'Outside';
      document.body.prepend(outside);
      mounted.menu.style.marginTop = '3000px';
      // Scroll anchoring would move the page when the trigger and the panel change size: only focus is measured here.
      document.documentElement.style.overflowAnchor = 'none';
      return { ...mounted, button: trigger, outside };
    }

    it('leaves focus and the scroll where they are when the menu opens from code', async () => {
      const { menu, trigger, closed, open, panel, outside } = mountScrolledMenu();
      controller = createFabMenuController({
        root: menu,
        trigger,
        closedTrigger: closed,
        openTrigger: open,
        panel,
        onDismiss: () => undefined,
      });
      outside.focus();
      window.scrollTo(0, 0);

      await setOpen(menu, true);
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(document.activeElement).toBe(outside);
      expect(window.scrollY).toBe(0);
    });

    it('moves focus to the first action when a pointer opens the menu from the trigger', async () => {
      const { menu, closed, open, panel, button } = mountScrolledMenu();
      controller = createFabMenuController({
        root: menu,
        trigger: button,
        closedTrigger: closed,
        openTrigger: open,
        panel,
        onDismiss: () => undefined,
      });
      button.scrollIntoView({ block: 'end' });
      // Playwright may scroll the button a little further into view before it clicks: the scroll is read at the click.
      let scrolled = Number.NaN;
      button.addEventListener('click', () => (scrolled = window.scrollY), { capture: true, once: true });

      await userEvent.click(button);
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(document.activeElement?.textContent).toBe('Action 0');
      // The first action sits below the trigger, out of view: it takes focus without scrolling the page.
      expect(window.scrollY).toBe(scrolled);
    });

    it('moves focus to the first action when a key opens the menu from the trigger', async () => {
      const { menu, closed, open, panel, button } = mountScrolledMenu();
      controller = createFabMenuController({
        root: menu,
        trigger: button,
        closedTrigger: closed,
        openTrigger: open,
        panel,
        onDismiss: () => undefined,
      });
      button.focus();

      await userEvent.keyboard('{Enter}');
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(document.activeElement?.textContent).toBe('Action 0');
    });
  });
});
