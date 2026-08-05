// @vitest-environment jsdom

import { animate } from 'animejs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createSwitchThumbController } from './switch.js';

vi.mock('animejs', () => ({ animate: vi.fn() }));

function animationInstance() {
  return { cancel: vi.fn() };
}

describe('switch thumb controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('tweens the known from/to translate offsets directly, without measuring the DOM', () => {
    vi.mocked(animate).mockReturnValue(animationInstance() as never);
    const root = document.createElement('div');
    const controller = createSwitchThumbController({
      root,
      reducedMotion: () => false,
    });

    controller.update(0, 20);

    expect(animate).toHaveBeenCalledWith(
      root,
      expect.objectContaining({ translate: [0, 20], duration: 150 }),
    );
  });

  it('does not animate on creation', () => {
    createSwitchThumbController({ root: document.createElement('div') });

    expect(animate).not.toHaveBeenCalled();
  });

  it('cancels any in-flight animation before starting a new one', () => {
    const first = animationInstance();
    const second = animationInstance();
    vi.mocked(animate).mockReturnValueOnce(first as never).mockReturnValueOnce(second as never);
    const root = document.createElement('div');
    const controller = createSwitchThumbController({
      root,
      reducedMotion: () => false,
    });

    controller.update(0, 20);
    controller.update(20, 0);

    expect(first.cancel).toHaveBeenCalledTimes(1);
  });

  it('skips the animation and jumps straight to the target offset when motion is reduced', () => {
    const root = document.createElement('div');
    const controller = createSwitchThumbController({
      root,
      reducedMotion: () => true,
    });

    controller.update(0, 20);

    expect(animate).not.toHaveBeenCalled();
    expect(root.style.translate).toBe('20px');
  });

  it('cancels the in-flight animation on destroy', () => {
    const animation = animationInstance();
    vi.mocked(animate).mockReturnValue(animation as never);
    const root = document.createElement('div');
    const controller = createSwitchThumbController({
      root,
      reducedMotion: () => false,
    });
    controller.update(0, 20);

    controller.destroy();

    expect(animation.cancel).toHaveBeenCalledTimes(1);
  });
});
