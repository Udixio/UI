// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createAnchorPositionerController,
  POSITION_AREA,
} from './anchor-positioner.js';

class NoopResizeObserver {
  constructor(_cb: ResizeObserverCallback) {}
  observe() {}
  unobserve() {}
  disconnect() {}
}

function stubAnchorRect(anchor: HTMLElement) {
  vi.spyOn(anchor, 'getBoundingClientRect').mockReturnValue({
    top: 100,
    bottom: 140,
    left: 200,
    right: 280,
    width: 80,
    height: 40,
    x: 200,
    y: 100,
    toJSON: () => ({}),
  } as DOMRect);
}

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', NoopResizeObserver);
  document.body.innerHTML = '';
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('anchor positioner controller (native CSS Anchor Positioning)', () => {
  // jsdom's CSSOM (cssstyle) only recognizes established CSS properties, so
  // `setProperty`/`getPropertyValue` silently no-op for the bleeding-edge
  // Anchor Positioning properties -- these tests assert on the calls made to
  // `setProperty` instead of reading the (unsupported) computed value back.
  beforeEach(() => {
    vi.stubGlobal('CSS', { supports: () => true });
  });

  it('assigns a unique anchor-name to the anchor and links the floating element to it', () => {
    const anchor = document.createElement('button');
    const floating = document.createElement('div');
    document.body.append(anchor, floating);
    const anchorSetProperty = vi.spyOn(anchor.style, 'setProperty');
    const floatingSetProperty = vi.spyOn(floating.style, 'setProperty');

    createAnchorPositionerController({
      anchor,
      floating,
      position: () => 'bottom',
    });

    const [propertyName, anchorName] = anchorSetProperty.mock.calls[0];
    expect(propertyName).toBe('anchor-name');
    expect(anchorName).toMatch(/^--udx-anchor-/);
    expect(floating.style.position).toBe('fixed');
    expect(floatingSetProperty).toHaveBeenCalledWith(
      'position-anchor',
      anchorName,
    );
    expect(floatingSetProperty).toHaveBeenCalledWith(
      'position-try-fallbacks',
      'none',
    );
  });

  it('maps each AnchorPosition to its space-separated position-area keyword pair', () => {
    const anchor = document.createElement('button');
    const floating = document.createElement('div');
    document.body.append(anchor, floating);
    const floatingSetProperty = vi.spyOn(floating.style, 'setProperty');

    createAnchorPositionerController({
      anchor,
      floating,
      position: () => 'top-left',
    });

    expect(floatingSetProperty).toHaveBeenCalledWith(
      'position-area',
      'top left',
    );
  });

  it('recomputes position-area on update() from a live position getter', () => {
    const anchor = document.createElement('button');
    const floating = document.createElement('div');
    document.body.append(anchor, floating);
    const floatingSetProperty = vi.spyOn(floating.style, 'setProperty');
    let position: 'top' | 'bottom' = 'bottom';

    const controller = createAnchorPositionerController({
      anchor,
      floating,
      position: () => position,
    });
    expect(floatingSetProperty).toHaveBeenLastCalledWith(
      'position-area',
      'bottom',
    );

    position = 'top';
    controller.update();
    expect(floatingSetProperty).toHaveBeenLastCalledWith(
      'position-area',
      'top',
    );
  });

  it('chooses below for automatic vertical placement in the upper half', () => {
    const anchor = document.createElement('button');
    const floating = document.createElement('div');
    document.body.append(anchor, floating);
    const floatingSetProperty = vi.spyOn(floating.style, 'setProperty');

    createAnchorPositionerController({
      anchor,
      floating,
      position: () => 'auto',
      autoAxis: () => 'vertical',
    });

    expect(floatingSetProperty).toHaveBeenCalledWith('position-area', 'bottom');
    expect(floatingSetProperty).toHaveBeenCalledWith(
      'position-try-fallbacks',
      'none',
    );
  });

  it('chooses right for automatic horizontal placement in the left half', () => {
    const anchor = document.createElement('button');
    const floating = document.createElement('div');
    document.body.append(anchor, floating);
    const floatingSetProperty = vi.spyOn(floating.style, 'setProperty');

    createAnchorPositionerController({
      anchor,
      floating,
      position: () => 'auto',
      autoAxis: () => 'horizontal',
    });

    expect(floatingSetProperty).toHaveBeenCalledWith('position-area', 'right');
    expect(floatingSetProperty).toHaveBeenCalledWith(
      'position-try-fallbacks',
      'none',
    );
  });

  it('removes every applied property on destroy', () => {
    const anchor = document.createElement('button');
    const floating = document.createElement('div');
    document.body.append(anchor, floating);
    const anchorRemoveProperty = vi.spyOn(anchor.style, 'removeProperty');
    const floatingRemoveProperty = vi.spyOn(floating.style, 'removeProperty');

    const controller = createAnchorPositionerController({
      anchor,
      floating,
      position: () => 'bottom',
    });
    controller.destroy();

    expect(anchorRemoveProperty).toHaveBeenCalledWith('anchor-name');
    expect(floatingRemoveProperty).toHaveBeenCalledWith('position-anchor');
    expect(floatingRemoveProperty).toHaveBeenCalledWith('position-area');
    expect(floatingRemoveProperty).toHaveBeenCalledWith(
      'position-try-fallbacks',
    );
  });
});

describe('anchor positioner controller (display:contents anchor)', () => {
  // Every interactive Udixio component (Button, IconButton, Chip, ...) hosts
  // itself with `display: contents`, which generates no box: anchor-name set
  // on it anchors nothing, and getBoundingClientRect() on it is always
  // (0, 0, 0, 0). The controller must resolve to the real inner element.
  function contentsAnchorWithRealChild() {
    const contentsHost = document.createElement('lib-button');
    contentsHost.style.display = 'contents';
    const realButton = document.createElement('button');
    contentsHost.append(realButton);
    return { contentsHost, realButton };
  }

  it('sets anchor-name on the real inner element, not the display:contents host (native path)', () => {
    vi.stubGlobal('CSS', { supports: () => true });
    const { contentsHost, realButton } = contentsAnchorWithRealChild();
    const floating = document.createElement('div');
    document.body.append(contentsHost, floating);
    const hostSetProperty = vi.spyOn(contentsHost.style, 'setProperty');
    const buttonSetProperty = vi.spyOn(realButton.style, 'setProperty');

    createAnchorPositionerController({
      anchor: contentsHost,
      floating,
      position: () => 'bottom',
    });

    expect(hostSetProperty).not.toHaveBeenCalledWith(
      'anchor-name',
      expect.anything(),
    );
    expect(buttonSetProperty).toHaveBeenCalledWith(
      'anchor-name',
      expect.stringMatching(/^--udx-anchor-/),
    );
  });

  it('measures the real inner element rect, not the (0,0,0,0) display:contents host (fallback path)', () => {
    vi.stubGlobal('CSS', { supports: () => false });
    const { contentsHost, realButton } = contentsAnchorWithRealChild();
    const floating = document.createElement('div');
    document.body.append(contentsHost, floating);
    stubAnchorRect(realButton);
    const hostRectSpy = vi.spyOn(contentsHost, 'getBoundingClientRect');

    createAnchorPositionerController({
      anchor: contentsHost,
      floating,
      position: () => 'bottom',
    });

    expect(hostRectSpy).not.toHaveBeenCalled();
    expect(floating.style.top).toBe('140px');
    expect(floating.style.left).toBe('240px');
  });
});

describe('anchor positioner controller (fallback, no CSS Anchor Positioning support)', () => {
  beforeEach(() => {
    vi.stubGlobal('CSS', { supports: () => false });
  });

  it('positions the floating element fixed against the anchor rect for bottom', () => {
    const anchor = document.createElement('button');
    const floating = document.createElement('div');
    document.body.append(anchor, floating);
    stubAnchorRect(anchor);

    createAnchorPositionerController({
      anchor,
      floating,
      position: () => 'bottom',
    });

    expect(floating.style.position).toBe('fixed');
    expect(floating.style.top).toBe('140px');
    expect(floating.style.left).toBe('240px');
    expect(floating.style.transform).toBe('translateX(-50%)');
  });

  it('chooses above for automatic vertical placement in the lower half', () => {
    const anchor = document.createElement('button');
    const floating = document.createElement('div');
    document.body.append(anchor, floating);
    vi.spyOn(anchor, 'getBoundingClientRect').mockReturnValue({
      top: 650,
      bottom: 690,
      left: 200,
      right: 280,
      width: 80,
      height: 40,
      x: 200,
      y: 650,
      toJSON: () => ({}),
    } as DOMRect);
    Object.defineProperty(window, 'innerWidth', {
      value: 1000,
      configurable: true,
    });
    Object.defineProperty(window, 'innerHeight', {
      value: 800,
      configurable: true,
    });

    createAnchorPositionerController({
      anchor,
      floating,
      position: () => 'auto',
      autoAxis: () => 'vertical',
    });

    expect(floating.style.bottom).toBe('150px');
    expect(floating.style.top).toBe('');
    expect(floating.style.transform).toBe('translateX(-50%)');
  });

  it('chooses left for automatic horizontal placement in the right half', () => {
    const anchor = document.createElement('button');
    const floating = document.createElement('div');
    document.body.append(anchor, floating);
    vi.spyOn(anchor, 'getBoundingClientRect').mockReturnValue({
      top: 100,
      bottom: 140,
      left: 850,
      right: 930,
      width: 80,
      height: 40,
      x: 850,
      y: 100,
      toJSON: () => ({}),
    } as DOMRect);
    Object.defineProperty(window, 'innerWidth', {
      value: 1000,
      configurable: true,
    });
    Object.defineProperty(window, 'innerHeight', {
      value: 800,
      configurable: true,
    });

    createAnchorPositionerController({
      anchor,
      floating,
      position: () => 'auto',
      autoAxis: () => 'horizontal',
    });

    expect(floating.style.right).toBe('150px');
    expect(floating.style.left).toBe('');
    expect(floating.style.transform).toBe('translateY(-50%)');
  });

  // The four corner positions are diagonal: they name a cell of the 3x3 grid
  // around the anchor, outside its box on BOTH axes, exactly as the native
  // `position-area: top left` keyword pair resolves. They are not an
  // edge-aligned "below, right-aligned" placement. The anchor sits at
  // top 100, bottom 140, left 200, right 280 in an 800x1000 viewport.
  describe.each([
    ['top-left', { bottom: '700px', right: '800px' }],
    ['top-right', { bottom: '700px', left: '280px' }],
    ['bottom-left', { top: '140px', right: '800px' }],
    ['bottom-right', { top: '140px', left: '280px' }],
  ] as const)('corner position %s', (position, expected) => {
    it('sits diagonally outside the anchor box on both axes, without a translate', () => {
      const anchor = document.createElement('button');
      const floating = document.createElement('div');
      document.body.append(anchor, floating);
      stubAnchorRect(anchor);
      Object.defineProperty(window, 'innerHeight', {
        value: 800,
        configurable: true,
      });
      Object.defineProperty(window, 'innerWidth', {
        value: 1000,
        configurable: true,
      });

      createAnchorPositionerController({
        anchor,
        floating,
        position: () => position,
      });

      for (const [side, value] of Object.entries(expected)) {
        expect(
          floating.style[side as 'top' | 'bottom' | 'left' | 'right'],
        ).toBe(value);
      }
      // The opposite sides stay unset, so the corner cell is what pins it.
      const unset = ['top', 'bottom', 'left', 'right'].filter(
        (side) => !(side in expected),
      );
      for (const side of unset) {
        expect(
          floating.style[side as 'top' | 'bottom' | 'left' | 'right'],
        ).toBe('');
      }
      expect(floating.style.transform).toBe('');
    });
  });

  it('recomputes on update() and reflects a new position', () => {
    const anchor = document.createElement('button');
    const floating = document.createElement('div');
    document.body.append(anchor, floating);
    stubAnchorRect(anchor);
    let position: 'bottom' | 'left' = 'bottom';

    const controller = createAnchorPositionerController({
      anchor,
      floating,
      position: () => position,
    });
    expect(floating.style.top).toBe('140px');

    position = 'left';
    controller.update();
    expect(floating.style.left).toBe('');
    expect(floating.style.right).not.toBe('');
    expect(floating.style.transform).toBe('translateY(-50%)');
  });

  it('stops tracking scroll and resize on destroy', () => {
    const anchor = document.createElement('button');
    const floating = document.createElement('div');
    document.body.append(anchor, floating);
    stubAnchorRect(anchor);
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const controller = createAnchorPositionerController({
      anchor,
      floating,
      position: () => 'bottom',
    });
    controller.destroy();

    expect(removeSpy).toHaveBeenCalledWith(
      'scroll',
      expect.any(Function),
      true,
    );
    expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function));
  });
});

/**
 * The two code paths are separate implementations of one contract: native
 * `position-area` where the browser supports Anchor Positioning, and computed
 * `position: fixed` offsets everywhere else. They drifted apart once already --
 * the corner positions were diagonal natively and edge-aligned in the fallback,
 * so the same `position` rendered differently in Chrome and in Firefox. This
 * derives the expected fallback sides from the real `POSITION_AREA` map rather
 * than restating them, so the two cannot diverge again unnoticed.
 */
describe('the fallback places every position where position-area would', () => {
  // A keyword names the grid band the element occupies, so it is pinned by the
  // OPPOSITE side: `top` means "above the anchor", pinned via `bottom`.
  const PINNED_BY: Record<string, 'top' | 'bottom' | 'left' | 'right'> = {
    top: 'bottom',
    bottom: 'top',
    left: 'right',
    right: 'left',
  };

  it.each(Object.entries(POSITION_AREA))(
    '%s -> position-area "%s"',
    (position, area) => {
      vi.stubGlobal('CSS', { supports: () => false });
      const anchor = document.createElement('button');
      const floating = document.createElement('div');
      document.body.append(anchor, floating);
      stubAnchorRect(anchor);

      createAnchorPositionerController({
        anchor,
        floating,
        position: () => position as never,
      });

      const keywords = area.split(' ');
      const expectedSides = keywords.map((keyword) => PINNED_BY[keyword]);
      for (const side of expectedSides) {
        expect(floating.style[side]).not.toBe('');
      }
      // A single keyword leaves the cross axis free, and the fallback centres
      // it with a translate; a keyword pair pins both axes and needs none.
      expect(floating.style.transform === '').toBe(keywords.length === 2);
    },
  );
});

/**
 * `window.innerWidth`/`innerHeight` include the scrollbars; CSS `right`/`bottom`
 * resolve against the layout viewport, which does not. Measuring with the
 * former puts every left- and top-anchored fallback off by the scrollbar width
 * -- invisible in jsdom, which has no scrollbars, and confirmed in Chrome as a
 * 15px gap against the native path.
 */
describe('the fallback measures the layout viewport, not the window', () => {
  const SCROLLBAR = 15;

  beforeEach(() => {
    vi.stubGlobal('CSS', { supports: () => false });
    Object.defineProperty(window, 'innerWidth', {
      value: 1000,
      configurable: true,
    });
    Object.defineProperty(window, 'innerHeight', {
      value: 800,
      configurable: true,
    });
    vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(
      1000 - SCROLLBAR,
    );
    vi.spyOn(document.documentElement, 'clientHeight', 'get').mockReturnValue(
      800 - SCROLLBAR,
    );
  });

  it('pins a left placement to the layout width, so its right edge meets the anchor', () => {
    const anchor = document.createElement('button');
    const floating = document.createElement('div');
    document.body.append(anchor, floating);
    stubAnchorRect(anchor);

    createAnchorPositionerController({
      anchor,
      floating,
      position: () => 'left',
    });

    // anchor.left is 200, so the right offset must be 985 - 200, not 1000 - 200.
    expect(floating.style.right).toBe('785px');
  });

  it('pins a top placement to the layout height, so its bottom edge meets the anchor', () => {
    const anchor = document.createElement('button');
    const floating = document.createElement('div');
    document.body.append(anchor, floating);
    stubAnchorRect(anchor);

    createAnchorPositionerController({
      anchor,
      floating,
      position: () => 'top',
    });

    // anchor.top is 100, so the bottom offset must be 785 - 100, not 800 - 100.
    expect(floating.style.bottom).toBe('685px');
  });
});

describe('anchor positioner controller (theme scope)', () => {
  beforeEach(() => {
    vi.stubGlobal('CSS', { supports: () => true });
  });

  function mount() {
    document.body.className = 'dark';
    const island = document.createElement('div');
    island.className = 'light theme-warning';
    const anchor = document.createElement('button');
    island.append(anchor);
    document.body.append(island);
    const floating = document.createElement('div');
    document.body.append(floating);
    return { anchor, floating };
  }

  it('mirrors the nearest light/dark and theme-* classes of the anchor onto the floating element', () => {
    const { anchor, floating } = mount();
    createAnchorPositionerController({ anchor, floating });

    expect(floating.classList.contains('light')).toBe(true);
    expect(floating.classList.contains('theme-warning')).toBe(true);
    // The body's `dark` is further away than the island's `light`.
    expect(floating.classList.contains('dark')).toBe(false);
  });

  it('removes the mirrored classes on destroy and leaves pre-existing ones alone', () => {
    const { anchor, floating } = mount();
    floating.className = 'light surface';
    const controller = createAnchorPositionerController({ anchor, floating });
    controller.destroy();

    expect(floating.classList.contains('light')).toBe(true);
    expect(floating.classList.contains('theme-warning')).toBe(false);
    expect(floating.classList.contains('surface')).toBe(true);
  });

  it('does not mirror a scheme set on body or html: the floating element inherits it live', () => {
    document.body.className = 'dark';
    const anchor = document.createElement('button');
    document.body.append(anchor);
    const floating = document.createElement('div');
    document.body.append(floating);
    createAnchorPositionerController({ anchor, floating });

    expect(floating.classList.contains('dark')).toBe(false);
  });

  it('follows a class change on the mirrored island', async () => {
    const { anchor, floating } = mount();
    createAnchorPositionerController({ anchor, floating });
    const island = anchor.parentElement!;
    island.classList.replace('light', 'dark');
    await Promise.resolve();

    expect(floating.classList.contains('dark')).toBe(true);
    expect(floating.classList.contains('light')).toBe(false);
  });

  it('can be opted out', () => {
    const { anchor, floating } = mount();
    createAnchorPositionerController({
      anchor,
      floating,
      inheritThemeScope: false,
    });

    expect(floating.className).toBe('');
  });
});
