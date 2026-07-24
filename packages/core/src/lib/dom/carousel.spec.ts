// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createCarouselController } from './carousel.js';

function setup(count = 5) {
  const track = document.createElement('div');
  const elements = Array.from({ length: count }, () => {
    const item = document.createElement('div');
    track.append(item);
    return item;
  });
  document.body.append(track);
  return { track, elements };
}

function createController(
  overrides: Partial<Parameters<typeof createCarouselController>[0]> = {},
) {
  const { track, elements } = setup(
    (overrides.items?.() as HTMLElement[] | undefined)?.length ?? 5,
  );
  const onSelectedIndexChange = vi.fn();
  const controller = createCarouselController({
    track,
    items: () => elements,
    viewport: () => 800,
    gap: () => 8,
    minItemWidth: () => 42,
    maxItemWidth: () => 300,
    onSelectedIndexChange,
    reducedMotion: () => true, // deterministic: skip the spring
    ...overrides,
  });
  return { controller, track, elements, onSelectedIndexChange };
}

describe('createCarouselController', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('writes a width and visibility onto every item', () => {
    const { controller, elements } = createController();
    controller.setProgress(0);

    for (const element of elements) {
      expect(element.style.getPropertyValue('--carousel-item-width')).toMatch(
        /^\d+(\.\d+)?px$/,
      );
      expect(['block', 'none']).toContain(element.style.display);
    }
    // At rest the first item is the widest one on screen.
    expect(elements[0].style.getPropertyValue('--carousel-item-width')).toBe(
      '300px',
    );
    controller.destroy();
  });

  it('applies the track translate', () => {
    const { controller, track } = createController();
    controller.setProgress(0.5);
    expect(track.style.transform).toMatch(/^translateX\(-?\d+(\.\d+)?px\)$/);
    controller.destroy();
  });

  it('notifies the selected index only when it changes', () => {
    const { controller, onSelectedIndexChange } = createController();

    controller.setProgress(0);
    expect(onSelectedIndexChange).toHaveBeenCalledWith(0);
    onSelectedIndexChange.mockClear();

    controller.setProgress(0); // same position -> no new notification
    expect(onSelectedIndexChange).not.toHaveBeenCalled();

    controller.setProgress(1);
    expect(onSelectedIndexChange).toHaveBeenCalledWith(4);
    controller.destroy();
  });

  it('jumps without animating when reduced motion is requested', () => {
    const { controller } = createController({ reducedMotion: () => true });
    controller.setProgress(1);
    expect(controller.getProgress()).toBe(1);
    controller.destroy();
  });

  it('jumps immediately when animate is false, even with motion enabled', () => {
    const { controller } = createController({ reducedMotion: () => false });
    controller.setProgress(1, { animate: false });
    expect(controller.getProgress()).toBe(1);
    controller.destroy();
  });

  it('re-reads options on each update so adapters can change props', () => {
    let gap = 8;
    const { controller, elements } = createController({ gap: () => gap });
    controller.setProgress(0);
    const before = elements[2].style.getPropertyValue('--carousel-item-width');

    gap = 40;
    controller.update();
    const after = elements[2].style.getPropertyValue('--carousel-item-width');

    expect(after).not.toBe(before);
    controller.destroy();
  });

  it('survives an empty carousel', () => {
    const track = document.createElement('div');
    const controller = createCarouselController({
      track,
      items: () => [],
      viewport: () => 800,
      gap: () => 8,
      minItemWidth: () => 42,
      maxItemWidth: () => 300,
      reducedMotion: () => true,
    });
    expect(() => controller.setProgress(0.5)).not.toThrow();
    controller.destroy();
  });

  it('stops the running animation on destroy', () => {
    const { controller } = createController({ reducedMotion: () => false });
    controller.setProgress(1);
    expect(() => controller.destroy()).not.toThrow();
  });
});
