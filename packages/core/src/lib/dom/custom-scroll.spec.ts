// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createCustomScrollController,
  type CustomScrollController,
} from './custom-scroll.js';

class NoopResizeObserver {
  constructor(private cb: ResizeObserverCallback) {}
  observe() {}
  unobserve() {}
  disconnect() {}
}

let controllers: CustomScrollController[] = [];

function setup(
  overrides: Partial<Parameters<typeof createCustomScrollController>[0]> = {},
) {
  const container = document.createElement('div');
  const content = document.createElement('div');
  container.append(content);
  document.body.append(container);

  // jsdom leaves layout metrics at 0; fake a scrollable horizontal viewport.
  Object.defineProperty(container, 'clientWidth', { value: 400, configurable: true });
  Object.defineProperty(content, 'scrollWidth', { value: 1200, configurable: true });

  const controller = createCustomScrollController({
    container,
    content,
    orientation: () => 'horizontal',
    draggable: () => true,
    ...overrides,
  });
  controllers.push(controller);
  return { container, content, controller };
}

beforeEach(() => {
  controllers = [];
  vi.stubGlobal('ResizeObserver', NoopResizeObserver);
});

afterEach(() => {
  controllers.forEach((c) => c.destroy());
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
});

describe('createCustomScrollController', () => {
  it('scrolls programmatically to a progress', () => {
    const { container, controller } = setup();
    controller.scrollTo({ progress: 0.5, orientation: 'horizontal' });
    // total = scrollWidth(1200) - clientWidth(400) = 800; 0.5 * 800 = 400
    expect(container.scrollLeft).toBe(400);
  });

  it('scrolls programmatically to an absolute offset, clamped to the range', () => {
    const { container, controller } = setup();
    controller.scrollTo({ scroll: 5000, orientation: 'horizontal' });
    expect(container.scrollLeft).toBe(800); // clamped to total
  });

  it('responds to the udx:customScroll:set event', () => {
    const { container, controller } = setup();
    void controller;
    container.dispatchEvent(
      new CustomEvent('udx:customScroll:set', {
        detail: { progress: 0.25, orientation: 'horizontal' },
      }),
    );
    expect(container.scrollLeft).toBe(200);
  });

  // jsdom does not populate pageX from MouseEventInit, so set it explicitly.
  const mouse = (type: string, pageX?: number) => {
    const event = new MouseEvent(type, { bubbles: true });
    if (pageX !== undefined) {
      Object.defineProperty(event, 'pageX', { value: pageX });
    }
    return event;
  };

  it('drags the scroll position with the pointer', () => {
    const { container, controller } = setup({ dragSensitivity: 1 });
    void controller;
    Object.defineProperty(container, 'offsetLeft', { value: 0, configurable: true });
    container.scrollLeft = 100;

    container.dispatchEvent(mouse('mousedown', 300));
    container.dispatchEvent(mouse('mousemove', 250));
    // walk = (250 - 300) * 1 = -50; scrollLeft = 100 - (-50) = 150
    expect(container.scrollLeft).toBe(150);
    container.dispatchEvent(mouse('mouseup'));
  });

  it('does not drag when draggable is false', () => {
    const { container } = setup({ draggable: () => false });
    Object.defineProperty(container, 'offsetLeft', { value: 0, configurable: true });
    container.scrollLeft = 100;
    container.dispatchEvent(mouse('mousedown', 300));
    container.dispatchEvent(mouse('mousemove', 250));
    expect(container.scrollLeft).toBe(100);
  });

  it('flips the dragging indicator on native scroll and resets it', () => {
    vi.useFakeTimers();
    const onDraggingChange = vi.fn();
    const { container } = setup({ onDraggingChange });

    container.dispatchEvent(new Event('scroll'));
    expect(onDraggingChange).toHaveBeenLastCalledWith(true);

    vi.advanceTimersByTime(1000);
    expect(onDraggingChange).toHaveBeenLastCalledWith(false);
    vi.useRealTimers();
  });

  it('emits an initial resting metric', () => {
    const onScroll = vi.fn();
    const { controller } = setup({ onScroll });
    controller.notifyInitial();
    expect(onScroll).toHaveBeenCalledWith(
      expect.objectContaining({ scrollProgress: 0, scroll: 0 }),
    );
  });

  it('removes its listeners on destroy', () => {
    const { container, controller } = setup();
    const removeSpy = vi.spyOn(container, 'removeEventListener');
    controller.destroy();
    expect(removeSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith(
      'udx:customScroll:set',
      expect.any(Function),
    );
  });
});
