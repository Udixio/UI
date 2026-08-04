// @vitest-environment jsdom

import { animate } from 'motion';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { animateTabPanelEnter, createTabsIndicatorController } from './tabs.js';

vi.mock('motion', () => ({
  animate: vi.fn(),
}));

class NoopResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

function animationControls() {
  return { stop: vi.fn(), then: vi.fn() };
}

function rect(left: number, width: number) {
  return {
    left,
    width,
    top: 0,
    height: 0,
    right: left + width,
    bottom: 0,
    x: left,
    y: 0,
    toJSON() {},
  } as DOMRect;
}

describe('createTabsIndicatorController', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', NoopResizeObserver);
    vi.clearAllMocks();
    vi.mocked(animate).mockImplementation(() => animationControls() as never);
  });

  it('establishes the resting position instantly on mount, without animating', () => {
    const root = document.createElement('div');
    const indicator = document.createElement('span');
    const tab = document.createElement('button');
    root.getBoundingClientRect = () => rect(0, 300);
    tab.getBoundingClientRect = () => rect(100, 80);

    createTabsIndicatorController({
      root,
      indicator,
      selectedTab: () => tab,
      reducedMotion: () => false,
    });

    expect(animate).not.toHaveBeenCalled();
    expect(indicator.style.transform).toBe('translateX(100px)');
    expect(indicator.style.width).toBe('80px');
    expect(indicator.style.opacity).toBe('1');
  });

  it('animates to the new tab position on update', () => {
    const root = document.createElement('div');
    const indicator = document.createElement('span');
    const tabs = [document.createElement('button'), document.createElement('button')];
    root.getBoundingClientRect = () => rect(0, 300);
    tabs[0].getBoundingClientRect = () => rect(0, 100);
    tabs[1].getBoundingClientRect = () => rect(100, 120);

    let selected = tabs[0];
    const controller = createTabsIndicatorController({
      root,
      indicator,
      selectedTab: () => selected,
      reducedMotion: () => false,
    });

    selected = tabs[1];
    controller.update();

    expect(animate).toHaveBeenCalledWith(
      indicator,
      { x: '100px', width: '120px' },
      expect.objectContaining({ duration: 0.3 }),
    );
  });

  it('hides the indicator when there is no selected tab', () => {
    const root = document.createElement('div');
    const indicator = document.createElement('span');
    root.getBoundingClientRect = () => rect(0, 300);

    createTabsIndicatorController({
      root,
      indicator,
      selectedTab: () => null,
      reducedMotion: () => false,
    });

    expect(indicator.style.opacity).toBe('0');
  });

  it('snaps instead of animating when motion is reduced', () => {
    const root = document.createElement('div');
    const indicator = document.createElement('span');
    const tabs = [document.createElement('button'), document.createElement('button')];
    root.getBoundingClientRect = () => rect(0, 300);
    tabs[0].getBoundingClientRect = () => rect(0, 100);
    tabs[1].getBoundingClientRect = () => rect(100, 120);

    let selected = tabs[0];
    const controller = createTabsIndicatorController({
      root,
      indicator,
      selectedTab: () => selected,
      reducedMotion: () => true,
    });

    selected = tabs[1];
    controller.update();

    expect(animate).not.toHaveBeenCalled();
    expect(indicator.style.transform).toBe('translateX(100px)');
    expect(indicator.style.width).toBe('120px');
  });

  it('stops the in-flight animation on destroy', () => {
    const root = document.createElement('div');
    const indicator = document.createElement('span');
    const tab = document.createElement('button');
    root.getBoundingClientRect = () => rect(0, 300);
    tab.getBoundingClientRect = () => rect(0, 100);
    const controls = animationControls();
    vi.mocked(animate).mockReturnValue(controls as never);

    let selected: HTMLElement | null = null;
    const controller = createTabsIndicatorController({
      root,
      indicator,
      selectedTab: () => selected,
      reducedMotion: () => false,
    });
    selected = tab;
    controller.update();

    controller.destroy();

    expect(controls.stop).toHaveBeenCalled();
  });
});

describe('animateTabPanelEnter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(animate).mockImplementation(() => animationControls() as never);
  });

  it('slides in from the right when moving forward', () => {
    const panel = document.createElement('div');
    animateTabPanelEnter({ panel, direction: 1, reducedMotion: () => false });

    expect(animate).toHaveBeenCalledWith(
      panel,
      { x: ['100%', '0%'], opacity: [0, 1] },
      expect.anything(),
    );
  });

  it('slides in from the left when moving backward', () => {
    const panel = document.createElement('div');
    animateTabPanelEnter({ panel, direction: -1, reducedMotion: () => false });

    expect(animate).toHaveBeenCalledWith(
      panel,
      { x: ['-100%', '0%'], opacity: [0, 1] },
      expect.anything(),
    );
  });

  it('applies the resting state instantly without direction', () => {
    const panel = document.createElement('div');
    const result = animateTabPanelEnter({
      panel,
      direction: 0,
      reducedMotion: () => false,
    });

    expect(animate).not.toHaveBeenCalled();
    expect(panel.style.opacity).toBe('1');
    expect(result).toBeUndefined();
  });

  it('applies the resting state instantly when motion is reduced', () => {
    const panel = document.createElement('div');
    animateTabPanelEnter({ panel, direction: 1, reducedMotion: () => true });

    expect(animate).not.toHaveBeenCalled();
    expect(panel.style.opacity).toBe('1');
  });
});
