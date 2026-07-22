// @vitest-environment jsdom

import { animate } from 'motion';
import { expect, it, vi } from 'vitest';
import { createCircularProgressController } from './circular-progress.js';

vi.mock('motion', () => ({ animate: vi.fn() }));

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
  cleanup();
  expect(stopRotation).toHaveBeenCalled();
  expect(stopPath).toHaveBeenCalled();
});
