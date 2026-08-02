// @vitest-environment jsdom

import { animate } from 'motion';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createNavigationRailItemLabelController } from './navigation-rail-item.js';

vi.mock('motion', () => ({
  animate: vi.fn(),
}));

function animationControls() {
  return { stop: vi.fn() };
}

describe('navigation rail item label controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(animate).mockImplementation(() => animationControls() as never);
  });

  it('establishes the resting state instantly on mount, without animating', () => {
    const label = document.createElement('span');
    createNavigationRailItemLabelController({
      label,
      axis: () => 'horizontal',
      visible: () => true,
      reducedMotion: () => false,
    });

    expect(animate).not.toHaveBeenCalled();
    expect(label.style.width).toBe('auto');
    expect(label.style.opacity).toBe('1');
  });

  it('animates width when the horizontal axis becomes visible after mount', () => {
    const label = document.createElement('span');
    let visible = false;
    const controller = createNavigationRailItemLabelController({
      label,
      axis: () => 'horizontal',
      visible: () => visible,
      reducedMotion: () => false,
    });

    visible = true;
    controller.update();

    expect(animate).toHaveBeenCalledWith(
      label,
      { width: 'auto', opacity: 1 },
      expect.objectContaining({ duration: 0.3 }),
    );
  });

  it('animates height instead of width for the vertical axis', () => {
    const label = document.createElement('span');
    let visible = false;
    const controller = createNavigationRailItemLabelController({
      label,
      axis: () => 'vertical',
      visible: () => visible,
      reducedMotion: () => false,
    });

    visible = true;
    controller.update();

    expect(animate).toHaveBeenCalledWith(
      label,
      { height: 'auto', opacity: 1 },
      expect.anything(),
    );
  });

  it('animates back to 0 when no longer visible', () => {
    const label = document.createElement('span');
    let visible = true;
    const controller = createNavigationRailItemLabelController({
      label,
      axis: () => 'horizontal',
      visible: () => visible,
      reducedMotion: () => false,
    });

    visible = false;
    controller.update();

    expect(animate).toHaveBeenLastCalledWith(
      label,
      { width: 0, opacity: 0 },
      expect.anything(),
    );
  });

  it('does not re-animate when neither axis nor visibility changed', () => {
    const label = document.createElement('span');
    const controller = createNavigationRailItemLabelController({
      label,
      axis: () => 'horizontal',
      visible: () => true,
      reducedMotion: () => false,
    });

    vi.mocked(animate).mockClear();
    controller.update();

    expect(animate).not.toHaveBeenCalled();
  });

  it('applies instant styles instead of animating when motion is reduced', () => {
    const label = document.createElement('span');
    let visible = true;
    const controller = createNavigationRailItemLabelController({
      label,
      axis: () => 'horizontal',
      visible: () => visible,
      reducedMotion: () => true,
    });

    visible = false;
    controller.update();

    expect(animate).not.toHaveBeenCalled();
    expect(label.style.width).toBe('0px');
    expect(label.style.opacity).toBe('0');
  });

  it('stops the in-flight animation on destroy', () => {
    const label = document.createElement('span');
    const controls = animationControls();
    let visible = false;
    const controller = createNavigationRailItemLabelController({
      label,
      axis: () => 'horizontal',
      visible: () => visible,
      reducedMotion: () => false,
    });
    vi.mocked(animate).mockReturnValue(controls as never);
    visible = true;
    controller.update();

    controller.destroy();

    expect(controls.stop).toHaveBeenCalled();
  });
});
