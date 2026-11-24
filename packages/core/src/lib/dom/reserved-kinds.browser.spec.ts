/**
 * Step B (review 5, Q3): each shared controller that animates a component's own element reserves the kind it holds there
 * (`reserveMotion`), so that a motion of that kind bound on the component is ignored, in React, Angular and Svelte alike.
 * Its destroy releases it.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getMotion, motion } from '@udixio/motion';
import type { MotionKind } from '@udixio/motion';
import { createMenuTransitionController } from './menu-motion.js';
import { createSideSheetTransitionController } from './side-sheet.js';
import { createSnackbarTransitionController } from './snackbar.js';
import { createTooltipTransitionController } from './tooltip.js';
import { animateTabPanelEnter } from './tabs.js';
import { createMonthTransitionController } from './date-picker.js';
import { createFabMenuController } from './fab-menu.js';
import { createSearchResultsTransitionController } from './search.js';
import { createNavigationRailWidthController } from './navigation-rail.js';

const elements: HTMLElement[] = [];

function element(html = ''): HTMLElement {
  const el = document.createElement('div');
  el.innerHTML = html;
  document.body.append(el);
  elements.push(el);
  return el;
}

afterEach(() => {
  for (const el of elements.splice(0)) el.remove();
  vi.restoreAllMocks();
});

/** The owner of each kind of an element, for the kinds a component may hold. */
function owners(el: Element): Partial<Record<MotionKind, string>> {
  const held: Partial<Record<MotionKind, string>> = {};
  for (const kind of ['presence', 'emphasis', 'layout', 'view', 'loop'] as const) {
    const owner = getMotion(el, kind)?.owner;
    if (owner !== undefined) held[kind] = owner;
  }
  return held;
}

describe('the kinds each controller reserves on the element it animates', () => {
  it('Menu: the presence of its surface, which it shows and hides with a fade and a scale', () => {
    const menu = element();
    const controller = createMenuTransitionController({ menu });
    expect(owners(menu)).toEqual({ presence: 'Menu' });
    controller.destroy();
    expect(owners(menu)).toEqual({});
  });

  it('SideSheet: the presence of its panel, which it shows and hides, and its layout, since it animates its width', () => {
    const container = element();
    const controller = createSideSheetTransitionController({ container });
    expect(owners(container)).toEqual({ presence: 'SideSheet', layout: 'SideSheet' });
    controller.destroy();
    expect(owners(container)).toEqual({});
  });

  it('Snackbar: the presence of its panel', () => {
    const panel = element();
    const controller = createSnackbarTransitionController({ panel, open: true });
    expect(owners(panel)).toEqual({ presence: 'Snackbar' });
    controller.destroy();
    expect(owners(panel)).toEqual({});
  });

  it('Tooltip: the presence of its surface, and its layout, since it animates its height', () => {
    const surface = element();
    const controller = createTooltipTransitionController({ element: surface });
    expect(owners(surface)).toEqual({ presence: 'Tooltip', layout: 'Tooltip' });
    controller.destroy();
    expect(owners(surface)).toEqual({});
  });

  it('TabPanel: the presence of its panel, whether or not it slides in', () => {
    const panel = element();
    animateTabPanelEnter({ panel, direction: 0 });
    expect(owners(panel)).toEqual({ presence: 'TabPanel' });
    const sliding = element();
    animateTabPanelEnter({ panel: sliding, direction: 1 })?.cancel();
    expect(owners(sliding)).toEqual({ presence: 'TabPanel' });
  });

  it('DatePicker: the emphasis of its month grid, which it plays at each change of month', () => {
    const container = element();
    const controller = createMonthTransitionController({ container });
    expect(owners(container)).toEqual({ emphasis: 'DatePicker' });
    controller.destroy();
    expect(owners(container)).toEqual({});
  });

  it('FabMenu: the presence of its panel and of each action, and the layout of its trigger, whose size it morphs', () => {
    const root = element(
      '<button type="button">+</button><div><div data-fab-menu-action><button type="button">A</button></div></div>',
    );
    root.dataset.open = 'false';
    const trigger = root.querySelector('button')!;
    const panel = root.querySelector('div')!;
    const action = panel.querySelector<HTMLElement>('[data-fab-menu-action]')!;
    const controller = createFabMenuController({ root, trigger, panel, onDismiss: () => undefined });
    expect(owners(panel)).toEqual({ presence: 'FabMenu' });
    expect(owners(action)).toEqual({ presence: 'FabMenu' });
    expect(owners(trigger)).toEqual({ layout: 'FabMenu' });
    expect(owners(root)).toEqual({});
    controller.destroy();
    expect(owners(panel)).toEqual({});
    expect(owners(action)).toEqual({});
    expect(owners(trigger)).toEqual({});
  });

  it('Search: the presence of its results, and their layout, since it animates their height', () => {
    const results = element();
    const controller = createSearchResultsTransitionController({ element: results, open: false });
    expect(owners(results)).toEqual({ presence: 'Search', layout: 'Search' });
    controller.destroy();
    expect(owners(results)).toEqual({});
  });

  it('NavigationRail: the layout of its rail, since it animates its width', () => {
    const rail = element();
    const controller = createNavigationRailWidthController({ rail, extended: false });
    expect(owners(rail)).toEqual({ layout: 'NavigationRail' });
    controller.destroy();
    expect(owners(rail)).toEqual({});
  });
});

it('a motion of a reserved kind bound on the component is ignored, and development names the component', () => {
  const panel = element();
  const controller = createSnackbarTransitionController({ panel, open: true });
  const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  const binding = motion(panel, { verb: 'appear', keyframes: [{ opacity: 0 }, { opacity: 1 }] }, { present: false });
  expect(panel.hasAttribute('data-motion-presence')).toBe(false);
  expect(panel.style.opacity).toBe('1');
  expect(String(error.mock.calls[0]?.[0])).toContain('Snackbar already holds a presence on this element');
  binding.destroy();
  controller.destroy();
});
