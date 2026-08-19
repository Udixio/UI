// @vitest-environment jsdom

import { createLayout } from 'animejs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAutoLayoutController } from './auto-layout.js';

vi.mock('animejs', () => ({ createLayout: vi.fn() }));

function layoutInstance() {
  return {
    record: vi.fn(),
    animate: vi.fn(),
    timeline: { cancel: vi.fn() },
    oldState: { scrollX: 0, scrollY: 0 },
  };
}

describe('auto layout controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates the layout rooted at the given element', () => {
    const layout = layoutInstance();
    vi.mocked(createLayout).mockReturnValue(layout as never);
    const root = document.createElement('span');

    createAutoLayoutController({ root, reducedMotion: () => false });

    expect(createLayout).toHaveBeenCalledWith(root);
  });

  it('records the initial layout on creation, without animating', () => {
    const layout = layoutInstance();
    vi.mocked(createLayout).mockReturnValue(layout as never);

    createAutoLayoutController({
      root: document.createElement('span'),
      reducedMotion: () => false,
    });

    expect(layout.record).toHaveBeenCalledTimes(1);
    expect(layout.animate).not.toHaveBeenCalled();
  });

  it('animates from the last recorded layout on update(), with the given timing', () => {
    const layout = layoutInstance();
    vi.mocked(createLayout).mockReturnValue(layout as never);
    const controller = createAutoLayoutController({
      root: document.createElement('span'),
      reducedMotion: () => false,
      duration: 300,
      ease: 'outCubic',
    });
    layout.record.mockClear();

    controller.update();

    expect(layout.animate).toHaveBeenCalledWith(
      expect.objectContaining({
        duration: 300,
        ease: 'outCubic',
        onComplete: expect.any(Function),
      }),
    );
    expect(layout.record).not.toHaveBeenCalled();
  });

  it('re-records the live layout immediately before applying a caller-owned change', () => {
    const layout = layoutInstance();
    vi.mocked(createLayout).mockReturnValue(layout as never);
    const controller = createAutoLayoutController({
      root: document.createElement('span'),
      reducedMotion: () => false,
    });
    layout.record.mockClear();
    const order: string[] = [];
    layout.record.mockImplementation(() => order.push('record'));
    layout.animate.mockImplementation(() => order.push('animate'));

    controller.update(() => order.push('mutate'));

    // Anime.js's record() measures the live geometry before cancelling the
    // running timeline and restoring the styles it pinned, so this order is
    // what makes an interrupted transition recoverable.
    expect(order).toEqual(['record', 'mutate', 'animate']);
  });

  it('applies a caller-owned change and re-records without animating when motion is reduced', () => {
    const layout = layoutInstance();
    vi.mocked(createLayout).mockReturnValue(layout as never);
    const controller = createAutoLayoutController({
      root: document.createElement('span'),
      reducedMotion: () => true,
    });
    const mutate = vi.fn();

    controller.update(mutate);

    expect(mutate).toHaveBeenCalledTimes(1);
    expect(layout.animate).not.toHaveBeenCalled();
  });

  it('syncs the recorded scroll position to the current one before animating, so Anime.js does not revert legitimate scrolling that happened after mount', () => {
    const layout = layoutInstance();
    vi.mocked(createLayout).mockReturnValue(layout as never);
    const controller = createAutoLayoutController({
      root: document.createElement('span'),
      reducedMotion: () => false,
    });

    Object.defineProperty(window, 'scrollX', { value: 40, configurable: true });
    Object.defineProperty(window, 'scrollY', {
      value: 2728,
      configurable: true,
    });
    controller.update();

    expect(layout.oldState).toEqual({ scrollX: 40, scrollY: 2728 });
  });

  it('records the new resting state only once the transition completes', () => {
    const layout = layoutInstance();
    vi.mocked(createLayout).mockReturnValue(layout as never);
    const controller = createAutoLayoutController({
      root: document.createElement('span'),
      reducedMotion: () => false,
    });
    layout.record.mockClear();

    controller.update();
    const onComplete = vi.mocked(layout.animate).mock.calls[0][0].onComplete;
    expect(layout.record).not.toHaveBeenCalled();

    onComplete();

    expect(layout.record).toHaveBeenCalledTimes(1);
  });

  it('skips the animation but still records the new baseline when motion is reduced', () => {
    const layout = layoutInstance();
    vi.mocked(createLayout).mockReturnValue(layout as never);
    const controller = createAutoLayoutController({
      root: document.createElement('span'),
      reducedMotion: () => true,
    });
    layout.record.mockClear();

    controller.update();

    expect(layout.animate).not.toHaveBeenCalled();
    expect(layout.record).toHaveBeenCalledTimes(1);
  });

  it('cancels the in-flight timeline on destroy', () => {
    const layout = layoutInstance();
    vi.mocked(createLayout).mockReturnValue(layout as never);
    const controller = createAutoLayoutController({
      root: document.createElement('span'),
      reducedMotion: () => false,
    });

    controller.destroy();

    expect(layout.timeline.cancel).toHaveBeenCalledTimes(1);
  });
});
