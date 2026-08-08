// @vitest-environment jsdom

import { createLayout } from 'animejs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTextFieldLabelController } from './text-field.js';

vi.mock('animejs', () => ({ createLayout: vi.fn() }));

function layoutInstance() {
  return {
    record: vi.fn(),
    animate: vi.fn(),
    timeline: { cancel: vi.fn() },
    oldState: { scrollX: 0, scrollY: 0 },
  };
}

describe('text field label controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates the layout rooted at the given legend element', () => {
    const layout = layoutInstance();
    vi.mocked(createLayout).mockReturnValue(layout as never);
    const root = document.createElement('legend');

    createTextFieldLabelController({ root, reducedMotion: () => false });

    expect(createLayout).toHaveBeenCalledWith(root);
  });

  it('records the initial layout on creation, without animating', () => {
    const layout = layoutInstance();
    vi.mocked(createLayout).mockReturnValue(layout as never);
    const root = document.createElement('legend');

    createTextFieldLabelController({ root, reducedMotion: () => false });

    expect(layout.record).toHaveBeenCalledTimes(1);
    expect(layout.animate).not.toHaveBeenCalled();
  });

  it('animates from the last recorded layout on update()', () => {
    const layout = layoutInstance();
    vi.mocked(createLayout).mockReturnValue(layout as never);
    const root = document.createElement('legend');
    const controller = createTextFieldLabelController({
      root,
      reducedMotion: () => false,
    });
    layout.record.mockClear();

    controller.update();

    expect(layout.animate).toHaveBeenCalledWith(
      expect.objectContaining({
        duration: 200,
        onComplete: expect.any(Function),
      }),
    );
    expect(layout.record).not.toHaveBeenCalled();
  });

  it('syncs the recorded scroll position to the current one before animating, so Anime.js does not revert legitimate scrolling that happened after mount', () => {
    const layout = layoutInstance();
    layout.oldState = { scrollX: 0, scrollY: 0 };
    vi.mocked(createLayout).mockReturnValue(layout as never);
    const root = document.createElement('legend');
    const controller = createTextFieldLabelController({
      root,
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
    const root = document.createElement('legend');
    const controller = createTextFieldLabelController({
      root,
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
    const root = document.createElement('legend');
    const controller = createTextFieldLabelController({
      root,
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
    const root = document.createElement('legend');
    const controller = createTextFieldLabelController({
      root,
      reducedMotion: () => false,
    });

    controller.destroy();

    expect(layout.timeline.cancel).toHaveBeenCalledTimes(1);
  });
});
