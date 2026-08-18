// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAnchorPositionerController } from './anchor-positioner.js';

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

    createAnchorPositionerController({ anchor, floating, position: () => 'bottom' });

    const [propertyName, anchorName] = anchorSetProperty.mock.calls[0];
    expect(propertyName).toBe('anchor-name');
    expect(anchorName).toMatch(/^--udx-anchor-/);
    expect(floating.style.position).toBe('fixed');
    expect(floatingSetProperty).toHaveBeenCalledWith('position-anchor', anchorName);
    expect(floatingSetProperty).toHaveBeenCalledWith(
      'position-try-fallbacks',
      'flip-block, flip-inline',
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

    expect(floatingSetProperty).toHaveBeenCalledWith('position-area', 'top left');
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
    expect(floatingSetProperty).toHaveBeenLastCalledWith('position-area', 'bottom');

    position = 'top';
    controller.update();
    expect(floatingSetProperty).toHaveBeenLastCalledWith('position-area', 'top');
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
    expect(floatingRemoveProperty).toHaveBeenCalledWith('position-try-fallbacks');
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

    expect(hostSetProperty).not.toHaveBeenCalledWith('anchor-name', expect.anything());
    expect(buttonSetProperty).toHaveBeenCalledWith('anchor-name', expect.stringMatching(/^--udx-anchor-/));
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

    createAnchorPositionerController({ anchor, floating, position: () => 'bottom' });

    expect(floating.style.position).toBe('fixed');
    expect(floating.style.top).toBe('140px');
    expect(floating.style.left).toBe('240px');
    expect(floating.style.transform).toBe('translateX(-50%)');
  });

  it('positions the floating element for top-right without a translate', () => {
    const anchor = document.createElement('button');
    const floating = document.createElement('div');
    document.body.append(anchor, floating);
    stubAnchorRect(anchor);
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });
    Object.defineProperty(window, 'innerWidth', { value: 1000, configurable: true });

    createAnchorPositionerController({
      anchor,
      floating,
      position: () => 'top-right',
    });

    expect(floating.style.bottom).toBe('700px');
    expect(floating.style.right).toBe('720px');
    expect(floating.style.transform).toBe('');
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

    expect(removeSpy).toHaveBeenCalledWith('scroll', expect.any(Function), true);
    expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function));
  });
});
