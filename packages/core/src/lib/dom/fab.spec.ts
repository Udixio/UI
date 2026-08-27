// @vitest-environment jsdom

import { createLayout, cubicBezier } from 'animejs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FAB_MOTION_DURATION_MS, FAB_MOTION_EASING } from '../fab-motion.js';
import { createFabLabelController } from './fab.js';

vi.mock('animejs', () => ({
  createLayout: vi.fn(),
  cubicBezier: vi.fn(() => 'ease-fn'),
}));

// The easing constant is built once, when the module under test is imported,
// so the call has already happened by the time any beforeEach clears it.
const easeCalls = vi.mocked(cubicBezier).mock.calls.map((call) => [...call]);

function layoutInstance() {
  return {
    record: vi.fn(),
    animate: vi.fn(),
    timeline: { cancel: vi.fn() },
    oldState: { scrollX: 0, scrollY: 0 },
  };
}

describe('fab label controller', () => {
  let layout: ReturnType<typeof layoutInstance>;

  beforeEach(() => {
    vi.clearAllMocks();
    layout = layoutInstance();
    vi.mocked(createLayout).mockReturnValue(layout as never);
    vi.mocked(cubicBezier).mockReturnValue('ease-fn' as never);
  });

  it('diffs the label element itself, not the fab container', () => {
    const label = document.createElement('span');

    createFabLabelController({
      label,
      extended: () => false,
      reducedMotion: () => false,
    });

    expect(createLayout).toHaveBeenCalledWith(label);
  });

  it('establishes the resting state instantly on mount, without animating', () => {
    const label = document.createElement('span');

    createFabLabelController({
      label,
      extended: () => true,
      reducedMotion: () => false,
    });

    expect(label.style.width).toBe('auto');
    expect(label.style.opacity).toBe('1');
    expect(layout.animate).not.toHaveBeenCalled();
  });

  it('keeps a compact label collapsed and transparent on mount', () => {
    const label = document.createElement('span');

    createFabLabelController({
      label,
      extended: () => false,
      reducedMotion: () => false,
    });

    expect(label.style.width).toBe('0px');
    expect(label.style.opacity).toBe('0');
  });

  it('hands the width and the fade to the same layout diff', () => {
    // `opacity` is one of the properties Anime.js Layout always records,
    // animates and restores, so a separate tween or CSS transition for the
    // fade is reset to Layout's recorded value the moment the diff completes.
    // Setting the target inside the diff makes that recorded value the target.
    const label = document.createElement('span');
    let extended = false;
    const controller = createFabLabelController({
      label,
      extended: () => extended,
      reducedMotion: () => false,
    });
    const seenWhenRecorded: Array<[string, string]> = [];
    layout.record.mockImplementation(() =>
      seenWhenRecorded.push([label.style.width, label.style.opacity]),
    );

    extended = true;
    controller.update();

    expect(seenWhenRecorded).toEqual([['0px', '0']]);
    expect(label.style.width).toBe('auto');
    expect(label.style.opacity).toBe('1');
    expect(layout.animate).toHaveBeenCalledWith(
      expect.objectContaining({
        duration: FAB_MOTION_DURATION_MS,
        ease: 'ease-fn',
      }),
    );
  });

  it('collapses the label and fades it out through the same diff', () => {
    const label = document.createElement('span');
    let extended = true;
    const controller = createFabLabelController({
      label,
      extended: () => extended,
      reducedMotion: () => false,
    });

    extended = false;
    controller.update();

    expect(label.style.width).toBe('0px');
    expect(label.style.opacity).toBe('0');
    expect(layout.animate).toHaveBeenCalledTimes(1);
  });

  it('uses the easing Motion applied by default before this moved to Anime.js', () => {
    expect(easeCalls).toEqual([[...FAB_MOTION_EASING]]);
  });

  it('honours a custom duration', () => {
    const label = document.createElement('span');
    let extended = false;
    const controller = createFabLabelController({
      label,
      extended: () => extended,
      reducedMotion: () => false,
      duration: 600,
    });

    extended = true;
    controller.update();

    expect(layout.animate).toHaveBeenCalledWith(
      expect.objectContaining({ duration: 600 }),
    );
  });

  it('does not re-animate when the extended state did not change', () => {
    const label = document.createElement('span');
    const controller = createFabLabelController({
      label,
      extended: () => true,
      reducedMotion: () => false,
    });

    controller.update();

    expect(layout.animate).not.toHaveBeenCalled();
  });

  it('applies the resting state instantly instead of animating when motion is reduced', () => {
    const label = document.createElement('span');
    let extended = true;
    const controller = createFabLabelController({
      label,
      extended: () => extended,
      reducedMotion: () => true,
    });

    extended = false;
    controller.update();

    expect(layout.animate).not.toHaveBeenCalled();
    expect(label.style.width).toBe('0px');
    expect(label.style.opacity).toBe('0');
  });

  it('cancels the in-flight layout timeline on destroy', () => {
    const label = document.createElement('span');
    const controller = createFabLabelController({
      label,
      extended: () => false,
      reducedMotion: () => false,
    });

    controller.destroy();

    expect(layout.timeline.cancel).toHaveBeenCalledTimes(1);
  });
});
