// @vitest-environment jsdom

import { animate } from 'motion';
import { beforeEach, expect, it, vi } from 'vitest';
import { createCircularProgressController } from './circular-progress.js';

vi.mock('motion', () => ({ animate: vi.fn() }));

beforeEach(() => {
  vi.clearAllMocks();
});

it('runs and cleans up the shared circular progress animations', () => {
  const stopRotation = vi.fn();
  const stopPath = vi.fn();
  vi.mocked(animate)
    .mockReturnValueOnce({ stop: stopRotation } as never)
    .mockReturnValueOnce({ stop: stopPath } as never);
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const circle = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'circle',
  );

  const cleanup = createCircularProgressController({
    svg,
    circle,
    reducedMotion: () => false,
  });

  expect(animate).toHaveBeenNthCalledWith(
    1,
    svg,
    { rotate: [-90, 270] },
    { duration: 1.5, repeat: Infinity, ease: 'linear' },
  );
  expect(animate).toHaveBeenNthCalledWith(
    2,
    circle,
    { pathLength: [0.1, 0.9, 0.1], rotate: [0, 0, 360] },
    { duration: 3, repeat: Infinity, ease: 'easeInOut' },
  );
  cleanup();
  expect(stopRotation).toHaveBeenCalled();
  expect(stopPath).toHaveBeenCalled();
});

it('renders a stable reduced-motion indicator without starting animations', () => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const circle = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'circle',
  );

  const cleanup = createCircularProgressController({
    svg,
    circle,
    reducedMotion: () => true,
  });

  expect(svg.style.transform).toBe('rotate(-90deg)');
  expect(circle.getAttribute('pathLength')).toBe('1');
  expect(circle.style.strokeDasharray).toBe('0.25 1');
  expect(animate).not.toHaveBeenCalled();
  expect(cleanup()).toBeUndefined();
});
