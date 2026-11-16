import { resolveWaapiTiming } from '@udixio/motion';
import { afterEach, describe, expect, it } from 'vitest';
import {
  animateTabPanelEnter,
  createTabsIndicatorController,
  type TabsIndicatorController,
} from './tabs.js';

/** Three tabs at 0, 100 and 220 px, 100, 120 and 80 px wide, with an indicator under them. */
function mountTabs() {
  document.body.innerHTML = `
    <div id="root" style="position: relative; width: 300px; height: 40px">
      <button id="t0" style="position: absolute; left: 0; top: 0; width: 100px; height: 40px"></button>
      <button id="t1" style="position: absolute; left: 100px; top: 0; width: 120px; height: 40px"></button>
      <button id="t2" style="position: absolute; left: 220px; top: 0; width: 80px; height: 40px"></button>
      <span id="indicator" style="position: absolute; left: 0; bottom: 0; height: 3px"></span>
    </div>
  `;
  return {
    root: document.querySelector<HTMLElement>('#root')!,
    indicator: document.querySelector<HTMLElement>('#indicator')!,
    tabs: [0, 1, 2].map((i) => document.querySelector<HTMLElement>(`#t${i}`)!),
  };
}

/** The horizontal offset of an element, from its computed `translate`. */
const xOf = (element: Element) => parseFloat(getComputedStyle(element).translate);
const widthOf = (element: Element) => parseFloat(getComputedStyle(element).width);

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

describe('createTabsIndicatorController in the browser', () => {
  let controller: TabsIndicatorController | undefined;

  afterEach(() => {
    controller?.destroy();
    controller = undefined;
    document.documentElement.removeAttribute('data-motion-policy');
    document.body.innerHTML = '';
  });

  it('places the indicator under the first tab at once, without a motion', () => {
    const { root, indicator, tabs } = mountTabs();
    controller = createTabsIndicatorController({
      root,
      indicator,
      selectedTab: () => tabs[0]!,
    });

    expect(indicator.getAnimations()).toHaveLength(0);
    expect(xOf(indicator)).toBeCloseTo(0, 0);
    expect(widthOf(indicator)).toBeCloseTo(100, 0);
    expect(indicator.style.opacity).toBe('1');
  });

  it('clears an inline transform left by an earlier version of the indicator', () => {
    const { root, indicator, tabs } = mountTabs();
    indicator.style.transform = 'translateX(50px)';
    controller = createTabsIndicatorController({
      root,
      indicator,
      selectedTab: () => tabs[0]!,
    });

    expect(indicator.style.transform).toBe('');
    expect(xOf(indicator)).toBeCloseTo(0, 0);
  });

  it('slides to the selected tab on the fast spatial spring, and ends at its position and width', async () => {
    const { root, indicator, tabs } = mountTabs();
    let selected = tabs[0]!;
    controller = createTabsIndicatorController({
      root,
      indicator,
      selectedTab: () => selected,
    });

    selected = tabs[1]!;
    controller.update();
    const [slide] = indicator.getAnimations();
    expect(slide).toBeDefined();
    expect(slide!.effect!.getComputedTiming().duration).toBe(
      tokenDuration(indicator, 'spring.fast.spatial'),
    );

    await slide!.finished;
    expect(xOf(indicator)).toBeCloseTo(100, 0);
    expect(widthOf(indicator)).toBeCloseTo(120, 0);
    expect(indicator.getAnimations()).toHaveLength(0);
  });

  it('continues from the position it shows when the selection changes mid-slide', () => {
    const { root, indicator, tabs } = mountTabs();
    let selected = tabs[0]!;
    controller = createTabsIndicatorController({
      root,
      indicator,
      selectedTab: () => selected,
    });

    selected = tabs[1]!;
    controller.update();
    freezeAt(indicator, 0.25);
    const shown = xOf(indicator);
    expect(Math.abs(shown)).toBeGreaterThan(1);

    selected = tabs[2]!;
    controller.update();
    const [next] = indicator.getAnimations();
    const [first] = (next!.effect as KeyframeEffect).getKeyframes();
    expect(Math.abs(parseFloat(String(first!.translate)) - shown)).toBeLessThanOrEqual(1);
    expect(indicator.getAnimations()).toHaveLength(1);
  });

  it('does not restart a slide that already heads for the selected tab', () => {
    const { root, indicator, tabs } = mountTabs();
    let selected = tabs[0]!;
    controller = createTabsIndicatorController({
      root,
      indicator,
      selectedTab: () => selected,
    });

    selected = tabs[1]!;
    controller.update();
    const [slide] = indicator.getAnimations();
    freezeAt(indicator, 0.25);

    // A re-measure with the same tab, as a render or a resize without a change of tab makes.
    controller.update();

    expect(indicator.getAnimations()).toHaveLength(1);
    expect(indicator.getAnimations()[0]).toBe(slide);
  });

  it('hides the indicator without a selected tab, and shows it again on a tab', () => {
    const { root, indicator, tabs } = mountTabs();
    let selected: HTMLElement | null = null;
    controller = createTabsIndicatorController({
      root,
      indicator,
      selectedTab: () => selected,
    });
    expect(indicator.style.opacity).toBe('0');

    selected = tabs[2]!;
    controller.update();
    expect(indicator.style.opacity).toBe('1');
  });

  it('snaps to the tab under the document reduced motion policy', () => {
    const { root, indicator, tabs } = mountTabs();
    let selected = tabs[0]!;
    controller = createTabsIndicatorController({
      root,
      indicator,
      selectedTab: () => selected,
    });

    document.documentElement.setAttribute('data-motion-policy', 'reduce');
    selected = tabs[1]!;
    controller.update();

    expect(indicator.getAnimations()).toHaveLength(0);
    expect(xOf(indicator)).toBeCloseTo(100, 0);
    expect(widthOf(indicator)).toBeCloseTo(120, 0);
  });

  it('snaps to the tab when the reducedMotion option says so', () => {
    const { root, indicator, tabs } = mountTabs();
    let selected = tabs[0]!;
    controller = createTabsIndicatorController({
      root,
      indicator,
      selectedTab: () => selected,
      reducedMotion: () => true,
    });

    selected = tabs[2]!;
    controller.update();

    expect(indicator.getAnimations()).toHaveLength(0);
    expect(xOf(indicator)).toBeCloseTo(220, 0);
  });

  it('plays the timing option in place of the spring', () => {
    const { root, indicator, tabs } = mountTabs();
    let selected = tabs[0]!;
    controller = createTabsIndicatorController({
      root,
      indicator,
      selectedTab: () => selected,
      timing: { duration: 'duration.long1', easing: 'easing.standard' },
    });

    selected = tabs[1]!;
    controller.update();
    const [slide] = indicator.getAnimations();
    expect(slide!.effect!.getComputedTiming().duration).toBe(450);
    expect((slide!.effect as KeyframeEffect).getTiming().easing).toBe('cubic-bezier(0.2, 0, 0, 1)');
  });

  it('cancels the running slide on destroy', () => {
    const { root, indicator, tabs } = mountTabs();
    let selected = tabs[0]!;
    controller = createTabsIndicatorController({
      root,
      indicator,
      selectedTab: () => selected,
    });

    selected = tabs[1]!;
    controller.update();
    expect(indicator.getAnimations()).toHaveLength(1);
    controller.destroy();
    controller = undefined;

    expect(indicator.getAnimations()).toHaveLength(0);
  });
});

describe('animateTabPanelEnter in the browser', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('data-motion-policy');
    document.body.innerHTML = '';
  });

  /** A 200 px wide panel, so that 100% of its width is 200 px. */
  function mountPanel(): HTMLDivElement {
    document.body.innerHTML = '<div id="panel" style="width: 200px; height: 50px"></div>';
    return document.querySelector<HTMLDivElement>('#panel')!;
  }

  it('slides a panel in from the right and fades it in, then clears its inline offset at rest', async () => {
    const panel = mountPanel();
    const motion = animateTabPanelEnter({ panel, direction: 1 });

    expect(motion).toBeDefined();
    expect(panel.getAnimations()).toHaveLength(2);
    const slide = panel.getAnimations().find((a) => 'translate' in ((a.effect as KeyframeEffect).getKeyframes()[0] ?? {}))!;
    expect(String((slide.effect as KeyframeEffect).getKeyframes()[0]!.translate)).toMatch(/^100%/);
    expect(slide.effect!.getComputedTiming().duration).toBe(
      tokenDuration(panel, 'spring.default.spatial'),
    );

    await expect(motion!.finished).resolves.toBe('finished');
    expect(panel.getAnimations()).toHaveLength(0);
    expect(panel.style.translate).toBe('');
    expect(panel.style.opacity).toBe('');
    expect(getComputedStyle(panel).translate).toBe('none');
    expect(getComputedStyle(panel).opacity).toBe('1');
  });

  it('starts a forward panel one panel width to the right of its rest position, and fully transparent', () => {
    const panel = mountPanel();
    const rest = panel.getBoundingClientRect().left;
    animateTabPanelEnter({ panel, direction: 1 });
    freezeAt(panel, 0);

    expect(panel.getBoundingClientRect().left - rest).toBeCloseTo(200, 0);
    expect(parseFloat(getComputedStyle(panel).opacity)).toBeCloseTo(0, 2);
  });

  it('slides a backward panel in from the left', () => {
    const panel = mountPanel();
    const rest = panel.getBoundingClientRect().left;
    animateTabPanelEnter({ panel, direction: -1 });
    freezeAt(panel, 0);

    expect(panel.getBoundingClientRect().left - rest).toBeCloseTo(-200, 0);
  });

  it('rests the panel at once, without a motion, when the direction is 0', () => {
    const panel = mountPanel();
    panel.style.translate = '40px 0';
    const motion = animateTabPanelEnter({ panel, direction: 0 });

    expect(motion).toBeUndefined();
    expect(panel.getAnimations()).toHaveLength(0);
    expect(panel.style.translate).toBe('');
    expect(panel.style.opacity).toBe('');
  });

  it('rests the panel at once, without a motion, under the document reduced motion policy', () => {
    document.documentElement.setAttribute('data-motion-policy', 'reduce');
    const panel = mountPanel();
    const motion = animateTabPanelEnter({ panel, direction: 1 });

    expect(motion).toBeUndefined();
    expect(panel.getAnimations()).toHaveLength(0);
    expect(getComputedStyle(panel).opacity).toBe('1');
  });

  it('ends a cancelled entrance without a finished result', async () => {
    const panel = mountPanel();
    const motion = animateTabPanelEnter({ panel, direction: -1 });

    motion!.cancel();

    await expect(motion!.finished).resolves.toBe('cancelled');
    expect(panel.getAnimations()).toHaveLength(0);
  });
});
