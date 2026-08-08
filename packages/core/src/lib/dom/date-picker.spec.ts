// @vitest-environment jsdom

import { animate } from 'motion';
import { beforeEach, expect, it, vi } from 'vitest';
import { createMonthTransitionController } from './date-picker.js';

vi.mock('motion', () => ({ animate: vi.fn() }));

beforeEach(() => {
  vi.clearAllMocks();
});

it('slides in from the right when moving to a later month', () => {
  const stop = vi.fn();
  vi.mocked(animate).mockReturnValueOnce({ stop } as never);
  const container = document.createElement('div');

  const controller = createMonthTransitionController({
    container,
    reducedMotion: () => false,
  });
  controller.play(1);

  expect(animate).toHaveBeenCalledWith(
    container,
    { x: [24, 0], opacity: [0, 1] },
    { duration: 0.22, ease: 'easeOut' },
  );
});

it('slides in from the left when moving to an earlier month', () => {
  const stop = vi.fn();
  vi.mocked(animate).mockReturnValueOnce({ stop } as never);
  const container = document.createElement('div');

  const controller = createMonthTransitionController({
    container,
    reducedMotion: () => false,
  });
  controller.play(-1);

  expect(animate).toHaveBeenCalledWith(
    container,
    { x: [-24, 0], opacity: [0, 1] },
    { duration: 0.22, ease: 'easeOut' },
  );
});

it('skips the animation when direction is 0', () => {
  const container = document.createElement('div');
  const controller = createMonthTransitionController({
    container,
    reducedMotion: () => false,
  });

  controller.play(0);

  expect(animate).not.toHaveBeenCalled();
});

it('respects reduced motion by skipping the animation', () => {
  const container = document.createElement('div');
  const controller = createMonthTransitionController({
    container,
    reducedMotion: () => true,
  });

  controller.play(1);

  expect(animate).not.toHaveBeenCalled();
});

it('stops the previous animation before starting a new one and on destroy', () => {
  const stopFirst = vi.fn();
  const stopSecond = vi.fn();
  vi.mocked(animate)
    .mockReturnValueOnce({ stop: stopFirst } as never)
    .mockReturnValueOnce({ stop: stopSecond } as never);
  const container = document.createElement('div');

  const controller = createMonthTransitionController({
    container,
    reducedMotion: () => false,
  });
  controller.play(1);
  controller.play(-1);
  expect(stopFirst).toHaveBeenCalled();

  controller.destroy();
  expect(stopSecond).toHaveBeenCalled();
});
