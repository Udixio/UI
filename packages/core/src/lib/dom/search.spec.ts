// @vitest-environment jsdom

import { animate } from 'animejs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createSearchOutsideDismissController,
  createSearchResultsTransitionController,
} from './search.js';

vi.mock('animejs', () => ({ animate: vi.fn() }));

function animationInstance() {
  return { pause: vi.fn() };
}

describe('search results transition controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('applies the initial closed state without animating', () => {
    const element = document.createElement('div');
    const controller = createSearchResultsTransitionController({
      element,
      open: false,
    });

    expect(element.hidden).toBe(true);
    expect(element.style.height).toBe('0px');
    expect(element.style.opacity).toBe('0');
    expect(animate).not.toHaveBeenCalled();
    controller.destroy();
  });

  it('applies the initial open state without animating', () => {
    const element = document.createElement('div');
    const controller = createSearchResultsTransitionController({
      element,
      open: true,
    });

    expect(element.hidden).toBe(false);
    expect(element.style.height).toBe('auto');
    expect(element.style.opacity).toBe('1');
    expect(animate).not.toHaveBeenCalled();
    controller.destroy();
  });

  it('reveals the results with a restrained Anime.js height and opacity transition', () => {
    const instance = animationInstance();
    vi.mocked(animate).mockReturnValue(instance as never);
    const element = document.createElement('div');
    Object.defineProperty(element, 'scrollHeight', { value: 144 });
    const controller = createSearchResultsTransitionController({
      element,
      open: false,
      reducedMotion: () => false,
    });

    controller.setOpen(true);

    expect(element.hidden).toBe(false);
    expect(animate).toHaveBeenCalledWith(
      element,
      expect.objectContaining({
        height: '144px',
        opacity: 1,
        duration: 250,
        ease: 'outCubic',
        onComplete: expect.any(Function),
      }),
    );
    controller.destroy();
  });

  it('hides the results only after the closing transition completes', () => {
    const instance = animationInstance();
    vi.mocked(animate).mockReturnValue(instance as never);
    const element = document.createElement('div');
    Object.defineProperty(element, 'scrollHeight', { value: 96 });
    const controller = createSearchResultsTransitionController({
      element,
      open: true,
      reducedMotion: () => false,
    });

    controller.setOpen(false);

    expect(element.hidden).toBe(false);
    const options = vi.mocked(animate).mock.calls[0][1] as {
      onComplete: () => void;
    };
    options.onComplete();

    expect(element.hidden).toBe(true);
    expect(element.style.height).toBe('0px');
    expect(element.style.opacity).toBe('0');
    controller.destroy();
  });

  it('skips Anime.js when reduced motion is preferred', () => {
    const element = document.createElement('div');
    const controller = createSearchResultsTransitionController({
      element,
      open: false,
      reducedMotion: () => true,
    });

    controller.setOpen(true);

    expect(animate).not.toHaveBeenCalled();
    expect(element.hidden).toBe(false);
    expect(element.style.height).toBe('auto');
    expect(element.style.opacity).toBe('1');
    controller.destroy();
  });

  it('pauses an interrupted transition and ignores updates after destroy', () => {
    const first = animationInstance();
    vi.mocked(animate).mockReturnValue(first as never);
    const element = document.createElement('div');
    Object.defineProperty(element, 'scrollHeight', { value: 64 });
    const controller = createSearchResultsTransitionController({
      element,
      open: false,
      reducedMotion: () => false,
    });

    controller.setOpen(true);
    controller.setOpen(false);
    expect(first.pause).toHaveBeenCalledOnce();

    controller.destroy();
    controller.setOpen(true);
    expect(animate).toHaveBeenCalledTimes(2);
    expect(element.hidden).toBe(false);
  });

  it('reverses from the current rendered height without jumping to full content height', () => {
    const first = animationInstance();
    vi.mocked(animate).mockReturnValue(first as never);
    const element = document.createElement('div');
    Object.defineProperty(element, 'scrollHeight', { value: 160 });
    vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
      height: 28,
    } as DOMRect);
    const controller = createSearchResultsTransitionController({
      element,
      open: false,
      reducedMotion: () => false,
    });

    controller.setOpen(true);
    controller.setOpen(false);

    expect(element.style.height).toBe('28px');
    controller.destroy();
  });
});

describe('search outside dismissal controller', () => {
  it('dismisses outside pointer presses and removes its listener on destroy', () => {
    const root = document.createElement('div');
    const inside = document.createElement('button');
    const outside = document.createElement('button');
    root.append(inside);
    document.body.append(root, outside);
    const onDismiss = vi.fn();
    const controller = createSearchOutsideDismissController({
      root,
      onDismiss,
    });

    outside.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    inside.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(onDismiss).toHaveBeenCalledOnce();

    controller.destroy();
    outside.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(onDismiss).toHaveBeenCalledOnce();

    root.remove();
    outside.remove();
  });
});
