// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createSliderPointerController,
  type SliderPointerController,
} from './slider.js';

let controllers: SliderPointerController[] = [];

function setup(
  overrides: Partial<Parameters<typeof createSliderPointerController>[0]> = {},
) {
  const track = document.createElement('div');
  document.body.append(track);
  track.getBoundingClientRect = () =>
    ({ left: 0, width: 200 }) as DOMRect;

  const onValueChange = vi.fn();
  const onDraggingChange = vi.fn();
  const controller = createSliderPointerController({
    track,
    min: () => 0,
    max: () => 100,
    step: () => 10,
    marks: () => undefined,
    disabled: () => false,
    onValueChange,
    onDraggingChange,
    ...overrides,
  });
  controllers.push(controller);
  return { track, controller, onValueChange, onDraggingChange };
}

beforeEach(() => {
  controllers = [];
});

afterEach(() => {
  controllers.forEach((c) => c.destroy());
  document.body.innerHTML = '';
});

describe('createSliderPointerController', () => {
  it('applies a value on mousedown at the exact left edge (percent 0)', () => {
    const { track, onValueChange } = setup();
    track.dispatchEvent(
      new MouseEvent('mousedown', { clientX: 0, bubbles: true }),
    );
    expect(onValueChange).toHaveBeenCalledWith(0);
  });

  it('tracks mousemove on window while dragging and stops on mouseup', () => {
    const { track, onValueChange, onDraggingChange } = setup();
    track.dispatchEvent(
      new MouseEvent('mousedown', { clientX: 100, bubbles: true }),
    );
    expect(onDraggingChange).toHaveBeenCalledWith(true);
    expect(onValueChange).toHaveBeenLastCalledWith(50);

    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 180 }));
    expect(onValueChange).toHaveBeenLastCalledWith(90);

    window.dispatchEvent(new MouseEvent('mouseup'));
    expect(onDraggingChange).toHaveBeenLastCalledWith(false);

    onValueChange.mockClear();
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 0 }));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('ignores mousedown while disabled', () => {
    const { track, onValueChange, onDraggingChange } = setup({
      disabled: () => true,
    });
    track.dispatchEvent(
      new MouseEvent('mousedown', { clientX: 100, bubbles: true }),
    );
    expect(onValueChange).not.toHaveBeenCalled();
    expect(onDraggingChange).not.toHaveBeenCalled();
  });

  it('stops listening after destroy', () => {
    const { track, controller, onValueChange } = setup();
    track.dispatchEvent(
      new MouseEvent('mousedown', { clientX: 100, bubbles: true }),
    );
    controller.destroy();
    onValueChange.mockClear();
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 0 }));
    expect(onValueChange).not.toHaveBeenCalled();
  });
});

