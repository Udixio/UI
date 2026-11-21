import { resolveWaapiTiming } from '@udixio/motion';
import { compile } from 'tailwindcss';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { navigationRailStyle } from '../styles/navigation-rail.style';
import {
  createNavigationRailWidthController,
  type NavigationRailWidthController,
} from './navigation-rail.js';

/**
 * The width of a navigation rail in a real browser: the classes of `navigationRailStyle` compiled by Tailwind v4, the rail
 * in a flex row as an app shell places it, and the bounds the width controller animates. Its content is a column of
 * `contentWidth` px, so the rail's width is its content clamped between the bounds (96 px collapsed; 220 to 360 px extended).
 */
const THEME = `@theme { --spacing: 0.25rem; }
@tailwind utilities;`;

type RailState = Parameters<typeof navigationRailStyle>[0];

function railClasses(isExtended: boolean): string {
  return navigationRailStyle({ isExtended, alignment: 'top', variant: 'standard', className: undefined } as RailState).navigationRail;
}

function mountRail(isExtended: boolean, contentWidth = 150): { rail: HTMLElement; content: HTMLElement } {
  document.body.innerHTML = `
    <div id="row" style="display: flex; align-items: stretch; height: 400px; width: 800px">
      <nav id="rail" class="${railClasses(isExtended)}">
        <div id="content" style="height: 20px; width: ${contentWidth}px"></div>
      </nav>
      <main style="flex: 1"></main>
    </div>
  `;
  return { rail: document.querySelector<HTMLElement>('#rail')!, content: document.querySelector<HTMLElement>('#content')! };
}

const nextFrame = () => new Promise<number>((resolve) => requestAnimationFrame(resolve));
const widthOf = (element: Element) => element.getBoundingClientRect().width;
const maxWidthOf = (element: Element) => parseFloat(getComputedStyle(element).maxWidth);
const minWidthOf = (element: Element) => parseFloat(getComputedStyle(element).minWidth);

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

describe('navigation rail width in the browser', () => {
  let controller: NavigationRailWidthController | undefined;

  beforeAll(async () => {
    const compiler = await compile(THEME);
    const style = document.createElement('style');
    style.textContent = compiler.build([...new Set([railClasses(false), railClasses(true)].flatMap((value) => value.split(/\s+/)))]);
    document.head.append(style);
  });

  afterEach(() => {
    controller?.destroy();
    controller = undefined;
    document.documentElement.removeAttribute('data-motion-policy');
    document.body.innerHTML = '';
  });

  it('rests at 96 px when collapsed, and at its content width between 220 and 360 px when extended', async () => {
    const { rail } = mountRail(false);
    controller = createNavigationRailWidthController({ rail, extended: false });
    expect(widthOf(rail)).toBeCloseTo(96, 0);

    controller.setExtended(true);
    await Promise.all(rail.getAnimations().map((animation) => animation.finished));
    expect(widthOf(rail)).toBeCloseTo(220, 0);
  });

  it('does not jump to the extended minimum on the first frame of extending', async () => {
    const { rail } = mountRail(false);
    controller = createNavigationRailWidthController({ rail, extended: false });

    controller.setExtended(true);
    await nextFrame();

    // Regression: a min-width that switches from `auto` to 220 px at once made the rail 220 px wide on its first frame.
    expect(widthOf(rail)).toBeLessThan(120);
  });

  it('moves through intermediate widths, and ends on its content width when the content grows with the change', async () => {
    const { rail, content } = mountRail(false, 0);
    controller = createNavigationRailWidthController({ rail, extended: false });
    const duration = tokenDuration(rail, 'spring.default.spatial');
    // The labels of a rail grow from 0 px in the same frame, so a width measured at the start would miss their growth.
    content.animate([{ width: '0px' }, { width: '300px' }], { duration, easing: 'linear', fill: 'both' });

    controller.setExtended(true);
    let finished = false;
    rail.getAnimations()[0]!.finished.then(() => (finished = true));
    const widths: number[] = [];
    while (!finished && widths.length < 200) {
      await nextFrame();
      widths.push(widthOf(rail));
    }
    await nextFrame();
    widths.push(widthOf(rail));

    const steps = widths.slice(1).map((width, index) => Math.abs(width - widths[index]!));
    expect(Math.max(...steps)).toBeLessThan(40);
    expect(widths.filter((width) => width > 100 && width < 210).length).toBeGreaterThanOrEqual(3);
    expect(widths[widths.length - 1]).toBeCloseTo(300, 0);
  });

  it('grows on the spatial spring and shrinks on the effects spring of the same speed', async () => {
    const { rail } = mountRail(false);
    controller = createNavigationRailWidthController({ rail, extended: false });

    controller.setExtended(true);
    const expanding = rail.getAnimations();
    expect(expanding).toHaveLength(1);
    expect(expanding[0]!.effect!.getComputedTiming().duration).toBe(tokenDuration(rail, 'spring.default.spatial'));
    expect(Object.keys((expanding[0]!.effect as KeyframeEffect).getKeyframes()[0]!)).toEqual(expect.arrayContaining(['minWidth', 'maxWidth']));
    await Promise.all(expanding.map((animation) => animation.finished));

    controller.setExtended(false);
    const collapsing = rail.getAnimations();
    expect(collapsing[0]!.effect!.getComputedTiming().duration).toBe(tokenDuration(rail, 'spring.default.effects'));
    await Promise.all(collapsing.map((animation) => animation.finished));
    expect(widthOf(rail)).toBeCloseTo(96, 0);
  });

  it('continues from the bounds it shows when it collapses while extending', async () => {
    const { rail } = mountRail(false, 400);
    controller = createNavigationRailWidthController({ rail, extended: false });

    controller.setExtended(true);
    freezeAt(rail, 0.3);
    const shownMax = maxWidthOf(rail);
    const shownMin = minWidthOf(rail);
    expect(shownMax).toBeGreaterThan(100);
    expect(shownMax).toBeLessThan(360);

    controller.setExtended(false);

    // The reversed motion starts at the bounds the rail showed, so the rail does not jump back to 96 px.
    expect(Math.abs(maxWidthOf(rail) - shownMax)).toBeLessThanOrEqual(1);
    expect(Math.abs(minWidthOf(rail) - shownMin)).toBeLessThanOrEqual(1);
  });

  it('applies its bounds at once, without animating, when reduced motion is requested', () => {
    const { rail } = mountRail(false);
    controller = createNavigationRailWidthController({ rail, extended: false });
    document.documentElement.setAttribute('data-motion-policy', 'reduce');

    controller.setExtended(true);

    expect(rail.getAnimations()).toHaveLength(0);
    expect(widthOf(rail)).toBeCloseTo(220, 0);
  });
});
