// @vitest-environment jsdom

import { animate, press } from 'motion';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createStateLayerController,
  findStateLayerTrigger,
} from './state-layer.js';

vi.mock('motion', () => ({
  animate: vi.fn(),
  press: vi.fn(),
}));

function animationControls() {
  return {
    stop: vi.fn(),
    then: (callback: () => void) => {
      callback();
      return Promise.resolve();
    },
  };
}

describe('state layer controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(animate).mockImplementation(() => animationControls() as never);
  });

  it('resolves the matching named interaction group', () => {
    document.body.innerHTML = `
      <div class="group/button">
        <div class="group/button">
          <div id="layer"></div>
        </div>
      </div>
    `;
    const layer = document.querySelector<HTMLElement>('#layer')!;

    expect(findStateLayerTrigger(layer, 'state-ripple-group-[button]')).toBe(
      document.body.firstElementChild,
    );
  });

  it('creates, animates and removes a ripple for an accepted press', () => {
    const trigger = document.createElement('button');
    const layer = document.createElement('div');
    trigger.append(layer);
    let onPressStart: ((element: Element, event: PointerEvent) => void) | null =
      null;
    vi.mocked(press).mockImplementation((_target, callback) => {
      onPressStart = callback as typeof onPressStart;
      return vi.fn();
    });

    createStateLayerController({
      trigger,
      layer,
      reducedMotion: () => false,
    });
    const onPressEnd = onPressStart!(trigger, {
      pointerType: '',
      clientX: 0,
      clientY: 0,
    } as PointerEvent) as unknown as () => void;

    const ripple = layer.querySelector<HTMLElement>('[data-udixio-ripple]');
    expect(ripple).not.toBeNull();
    expect(ripple?.style.getPropertyValue('--udixio-ripple-x')).toBe('50%');
    expect(animate).toHaveBeenCalledWith(
      ripple,
      { '--udixio-ripple-radius': ['0%', '100%'] },
      { duration: 0.5, ease: 'easeOut' },
    );

    onPressEnd();
    expect(ripple?.isConnected).toBe(false);
  });

  it('does not create a ripple while disabled', () => {
    const trigger = document.createElement('button');
    const layer = document.createElement('div');
    let onPressStart: ((element: Element, event: PointerEvent) => void) | null =
      null;
    vi.mocked(press).mockImplementation((_target, callback) => {
      onPressStart = callback as typeof onPressStart;
      return vi.fn();
    });

    createStateLayerController({
      trigger,
      layer,
      disabled: () => true,
    });
    onPressStart!(trigger, {} as PointerEvent);

    expect(layer.childElementCount).toBe(0);
    expect(animate).not.toHaveBeenCalled();
  });

  it('preserves feedback without motion when reduced motion is requested', () => {
    const trigger = document.createElement('button');
    const layer = document.createElement('div');
    trigger.append(layer);
    let onPressStart: ((element: Element, event: PointerEvent) => void) | null =
      null;
    vi.mocked(press).mockImplementation((_target, callback) => {
      onPressStart = callback as typeof onPressStart;
      return vi.fn();
    });
    const controller = createStateLayerController({
      trigger,
      layer,
      reducedMotion: () => true,
    });

    controller.updateShape({
      restingBorderRadius: '40px',
      pressedBorderRadius: '16px',
      enabled: true,
      transition: { type: 'spring' },
    });
    onPressStart!(trigger, {
      pointerType: '',
      clientX: 0,
      clientY: 0,
    } as PointerEvent);

    expect(trigger.style.borderRadius).toBe('16px');
    expect(animate).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      { '--udixio-ripple-radius': ['0%', '100%'] },
      { duration: 0, ease: 'easeOut' },
    );
    expect(
      vi.mocked(animate).mock.calls.some(([target]) => target === trigger),
    ).toBe(false);
  });

  it('detaches gestures and removes active ripples on destroy', () => {
    const trigger = document.createElement('button');
    const layer = document.createElement('div');
    trigger.append(layer);
    const stopPress = vi.fn();
    let onPressStart: ((element: Element, event: PointerEvent) => void) | null =
      null;
    vi.mocked(press).mockImplementation((_target, callback) => {
      onPressStart = callback as typeof onPressStart;
      return stopPress;
    });
    const controller = createStateLayerController({ trigger, layer });
    onPressStart!(trigger, {
      pointerType: 'mouse',
      clientX: 0,
      clientY: 0,
    } as PointerEvent);

    expect(layer.querySelector('[data-udixio-ripple]')).not.toBeNull();
    controller.destroy();

    expect(stopPress).toHaveBeenCalledTimes(1);
    expect(layer.querySelector('[data-udixio-ripple]')).toBeNull();
  });

  it('animates the trigger shape while the layer inherits its exact radius', async () => {
    const trigger = document.createElement('button');
    const layer = document.createElement('div');
    trigger.append(layer);
    let onPressStart: ((element: Element, event: PointerEvent) => void) | null =
      null;
    vi.mocked(press).mockImplementation((_target, callback) => {
      onPressStart = callback as typeof onPressStart;
      return vi.fn();
    });
    const controller = createStateLayerController({
      trigger,
      layer,
      reducedMotion: () => false,
    });
    const transition = {
      type: 'spring' as const,
      visualDuration: 0.3,
      bounce: 0.2,
    };

    controller.updateShape({
      restingBorderRadius: '40px',
      pressedBorderRadius: '16px',
      enabled: true,
      transition,
    });

    expect(trigger.style.borderRadius).toBe('40px');
    expect(layer.style.borderRadius).toBe('inherit');

    const onPressEnd = onPressStart!(trigger, {
      pointerType: '',
      clientX: 0,
      clientY: 0,
    } as PointerEvent) as unknown as () => void;

    expect(animate).toHaveBeenCalledWith(
      trigger,
      { borderRadius: '16px' },
      transition,
    );

    controller.updateShape({
      restingBorderRadius: '28px',
      pressedBorderRadius: '16px',
      enabled: true,
      transition,
    });
    const shapeCallsBeforeRelease = vi
      .mocked(animate)
      .mock.calls.filter(([target]) => target === trigger).length;
    onPressEnd();
    await Promise.resolve();

    const shapeCallsAfterRelease = vi
      .mocked(animate)
      .mock.calls.filter(([target]) => target === trigger);
    expect(shapeCallsAfterRelease).toHaveLength(shapeCallsBeforeRelease + 1);
    expect(shapeCallsAfterRelease.at(-1)).toEqual([
      trigger,
      { borderRadius: '28px' },
      transition,
    ]);
  });
});
