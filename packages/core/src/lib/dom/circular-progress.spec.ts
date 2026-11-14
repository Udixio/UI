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
    expect.objectContaining({ rotate: -90 }),
    { rotate: [-90, 270] },
    { duration: 1.5, repeat: Infinity, ease: 'linear' },
  );
  expect(animate).toHaveBeenNthCalledWith(
    2,
    expect.objectContaining({ pathLength: 0.25, rotate: 0 }),
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

it('stops on policy reduction and resumes once when it is removed', async () => {
  const stop = vi.fn();
  vi.mocked(animate).mockReturnValue({ stop } as never);
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const circle = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'circle',
  );
  const cleanup = createCircularProgressController({ svg, circle });
  expect(animate).toHaveBeenCalledTimes(2);
  document.documentElement.setAttribute('data-motion-policy', 'reduce');
  await Promise.resolve();
  expect(stop).toHaveBeenCalledTimes(2);
  expect(circle.style.strokeDasharray).toBe('0.25 1');
  document.documentElement.removeAttribute('data-motion-policy');
  await Promise.resolve();
  expect(animate).toHaveBeenCalledTimes(4);
  cleanup();
});

it('cancels active animations without committing a sampled frame when reduced', async () => {
  const cancel = vi.fn();
  const stop = vi.fn();
  vi.mocked(animate).mockReturnValue({ cancel, stop } as never);
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  const cleanup = createCircularProgressController({ svg, circle });
  document.documentElement.setAttribute('data-motion-policy', 'reduce');
  await Promise.resolve();
  expect(cancel).toHaveBeenCalledTimes(2);
  expect(stop).not.toHaveBeenCalled();
  expect(svg.style.transform).toBe('rotate(-90deg)');
  document.documentElement.removeAttribute('data-motion-policy');
  await Promise.resolve();
  cleanup();
});

it('attempts to stop a handle whose cancellation fails and still cancels the others', () => {
  const stop = vi.fn();
  const cancel = vi.fn();
  vi.mocked(animate)
    .mockReturnValueOnce({ cancel: () => { throw new Error('cancel'); }, stop } as never)
    .mockReturnValueOnce({ cancel, stop } as never);
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  const cleanup = createCircularProgressController({ svg, circle });
  expect(cleanup).toThrow();
  expect(stop).toHaveBeenCalledOnce();
  expect(cancel).toHaveBeenCalledOnce();
  expect(cleanup).not.toThrow();
});
