// @vitest-environment jsdom

import { animate } from 'motion';
import { motionPolicy } from '@udixio/motion/internal-policy';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createSliderIndicatorController,
  createSliderPointerController,
  type SliderPointerController,
} from './slider.js';

vi.mock('motion', () => ({ animate: vi.fn() }));

let controllers: SliderPointerController[] = [];
let indicatorControllers: ReturnType<typeof createSliderIndicatorController>[] = [];
function createIndicator(options: Parameters<typeof createSliderIndicatorController>[0]) {
  const controller = createSliderIndicatorController(options);
  indicatorControllers.push(controller);
  return controller;
}

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
  indicatorControllers = [];
  vi.clearAllMocks();
});

afterEach(() => {
  controllers.forEach((c) => c.destroy());
  indicatorControllers.forEach((c) => c.destroy());
  document.documentElement.removeAttribute('data-motion-policy');
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

describe('createSliderIndicatorController', () => {
  it('settles an active animation when the injected preference changes and the request repeats', () => {
    const stop = vi.fn();
    vi.mocked(animate).mockReturnValue({ stop, cancel: stop } as never);
    const indicator = document.createElement('div');
    let reduced = false;
    const controller = createIndicator({ indicator, root: document.createElement('div'), reducedMotion: () => reduced });
    controller.setVisible(true);
    reduced = true;
    controller.setVisible(true);
    expect(stop).toHaveBeenCalledOnce();
    expect(indicator.style.transform).toBe('scale(1)');
    controller.destroy();
  });

  it('samples the injected preference on a repeated hide and on policy notification', async () => {
    const cancel = vi.fn();
    vi.mocked(animate).mockReturnValue({ stop: vi.fn(), cancel } as never);
    let reduced = false;
    const indicator = document.createElement('div');
    const controller = createIndicator({ root: document.createElement('div'), indicator, reducedMotion: () => reduced });
    controller.setVisible(true);
    controller.setVisible(false);
    reduced = true;
    controller.setVisible(false);
    expect(indicator.style.transform).toBe('scale(0)');
    reduced = false;
    controller.setVisible(true);
    reduced = true;
    document.documentElement.setAttribute('data-motion-policy', 'reduce');
    await Promise.resolve();
    expect(indicator.style.transform).toBe('scale(1)');
    expect(cancel).toHaveBeenCalled();
  });

  it('settles independent targets on a policy change and cleans up each root', async () => {
    const stop = vi.fn();
    vi.mocked(animate).mockReturnValue({ stop, cancel: stop } as never);
    const firstRoot = document.createElement('div');
    const secondRoot = document.createElement('div');
    const first = document.createElement('div');
    const second = document.createElement('div');
    const a = createIndicator({ root: firstRoot, indicator: first });
    const b = createIndicator({ root: secondRoot, indicator: second });
    a.setVisible(true);
    a.setVisible(false);
    b.setVisible(true);
    document.documentElement.setAttribute('data-motion-policy', 'reduce');
    await Promise.resolve();
    expect(first.style.transform).toBe('scale(0)');
    expect(second.style.transform).toBe('scale(1)');
    expect(stop).toHaveBeenCalledTimes(3);
    expect(firstRoot.hasAttribute('data-udx-slider-motion-reduce')).toBe(true);
    expect(secondRoot.hasAttribute('data-udx-slider-motion-reduce')).toBe(true);
    a.destroy(); a.destroy();
    expect(firstRoot.hasAttribute('data-udx-slider-motion-reduce')).toBe(false);
    expect(secondRoot.hasAttribute('data-udx-slider-motion-reduce')).toBe(true);
    document.documentElement.removeAttribute('data-motion-policy');
    await Promise.resolve();
    expect(animate).toHaveBeenCalledTimes(3);
    b.destroy();
    b.setVisible(false);
    expect(animate).toHaveBeenCalledTimes(3);
  });

  it('releases a retained policy when installation fails', () => {
    const root = document.createElement('div');
    const release = vi.spyOn(motionPolicy, 'release');
    const subscribe = vi.spyOn(motionPolicy, 'subscribe').mockImplementationOnce(() => { throw new Error('failed'); });
    expect(() => createIndicator({ root, indicator: document.createElement('div') })).toThrow('failed');
    expect(release).toHaveBeenCalledOnce();
    expect(root.hasAttribute('data-udx-slider-motion-reduce')).toBe(false);
    subscribe.mockRestore(); release.mockRestore();
  });

  it('animates the indicator transform', () => {
    const stop = vi.fn();
    vi.mocked(animate).mockReturnValue({ stop, cancel: stop } as never);
    const indicator = document.createElement('div');

    const controller = createIndicator({
      indicator,
      root: document.createElement('div'),
      reducedMotion: () => false,
    });
    controller.setVisible(true);

    expect(animate).toHaveBeenCalledWith(
      indicator,
      { transform: [expect.any(String), 'scale(1)'] },
      { duration: 0.1 },
    );

    controller.setVisible(false);
    expect(stop).toHaveBeenCalled();
    expect(animate).toHaveBeenLastCalledWith(
      indicator,
      { transform: [expect.any(String), 'scale(0)'] },
      { duration: 0.1 },
    );
  });

  it('treats the initial state as already hidden, so the first setVisible(false) is a no-op', () => {
    const indicator = document.createElement('div');
    const controller = createIndicator({
      indicator,
      root: document.createElement('div'),
      reducedMotion: () => false,
    });

    controller.setVisible(false);
    expect(animate).not.toHaveBeenCalled();
  });

  it('ignores a redundant setVisible for the same requested state', () => {
    vi.mocked(animate).mockReturnValue({ stop: vi.fn(), cancel: vi.fn() } as never);
    const indicator = document.createElement('div');
    const controller = createIndicator({
      indicator,
      root: document.createElement('div'),
      reducedMotion: () => false,
    });

    controller.setVisible(true);
    controller.setVisible(true);
    expect(animate).toHaveBeenCalledTimes(1);
  });

  it('jumps instantly under reduced motion instead of animating', () => {
    const indicator = document.createElement('div');
    const controller = createIndicator({
      indicator,
      root: document.createElement('div'),
      reducedMotion: () => true,
    });

    controller.setVisible(true);
    expect(indicator.style.transform).toBe('scale(1)');
    expect(animate).not.toHaveBeenCalled();

    controller.setVisible(false);
    expect(indicator.style.transform).toBe('scale(0)');
  });

  it('stops the in-flight animation on destroy', () => {
    const stop = vi.fn();
    vi.mocked(animate).mockReturnValue({ stop, cancel: stop } as never);
    const indicator = document.createElement('div');
    const controller = createIndicator({
      indicator,
      root: document.createElement('div'),
      reducedMotion: () => false,
    });

    controller.setVisible(true);
    controller.destroy();
    expect(stop).toHaveBeenCalled();
  });
});
