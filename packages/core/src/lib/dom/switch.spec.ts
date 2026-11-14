// @vitest-environment jsdom

import { animate } from 'animejs';
import { motionPolicy } from '@udixio/motion/policy';
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
    controller.destroy();
  });

  it('does not animate on creation', () => {
    const controller = createSwitchThumbController({ root: document.createElement('div') });

    expect(animate).not.toHaveBeenCalled();
    controller.destroy();
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
    controller.destroy();
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
    controller.destroy();
  });

  it('finishes the latest target when the document policy changes during a tween', async () => {
    const animation = animationInstance();
    vi.mocked(animate).mockReturnValue(animation as never);
    const root = document.createElement('div');
    const controller = createSwitchThumbController({ root });
    controller.update(0, 20);
    document.documentElement.setAttribute('data-motion-policy', 'reduce');
    await Promise.resolve();
    expect(animation.cancel).toHaveBeenCalledTimes(1);
    expect(root.style.translate).toBe('20px');
    controller.destroy();
    document.documentElement.removeAttribute('data-motion-policy');
  });

  it('reads an attribute set synchronously before the observer runs', () => {
    const root = document.createElement('div');
    const controller = createSwitchThumbController({ root });
    document.documentElement.setAttribute('data-motion-policy', 'reduce');
    controller.update(0, 20);
    expect(animate).not.toHaveBeenCalled();
    expect(root.style.translate).toBe('20px');
    controller.destroy();
    document.documentElement.removeAttribute('data-motion-policy');
  });

  it('settles each instance at its latest target and does not resume on normal policy', async () => {
    const animations = [animationInstance(), animationInstance(), animationInstance()];
    for (const animation of animations) vi.mocked(animate).mockReturnValueOnce(animation as never);
    const first = document.createElement('div');
    const second = document.createElement('div');
    const a = createSwitchThumbController({ root: first });
    const b = createSwitchThumbController({ root: second });
    a.update(0, 20);
    a.update(20, 0);
    b.update(0, 20);
    document.documentElement.setAttribute('data-motion-policy', 'reduce');
    await Promise.resolve();
    expect(first.style.translate).toBe('0px');
    expect(second.style.translate).toBe('20px');
    expect(animations.map(animation => animation.cancel.mock.calls.length)).toEqual([1, 1, 1]);
    document.documentElement.removeAttribute('data-motion-policy');
    await Promise.resolve();
    expect(animate).toHaveBeenCalledTimes(3);
    a.destroy(); a.destroy(); b.destroy();
  });

  it('reflects the initial shared policy locally and removes the marker on destroy', () => {
    document.documentElement.setAttribute('data-motion-policy', 'reduce');
    const root = document.createElement('div');
    const controller = createSwitchThumbController({ root });
    expect(root.hasAttribute('data-udx-switch-motion-reduce')).toBe(true);
    controller.destroy();
    expect(root.hasAttribute('data-udx-switch-motion-reduce')).toBe(false);
    document.documentElement.removeAttribute('data-motion-policy');
  });

  it('releases its retained policy if subscription fails', () => {
    const release = vi.spyOn(motionPolicy, 'release');
    const subscribe = vi.spyOn(motionPolicy, 'subscribe').mockImplementationOnce(() => {
      throw new Error('subscription failed');
    });
    expect(() => createSwitchThumbController({ root: document.createElement('div') })).toThrow('subscription failed');
    expect(release).toHaveBeenCalledTimes(1);
    subscribe.mockRestore();
    release.mockRestore();
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
