// @vitest-environment jsdom

import { animate } from 'motion';
import { beforeEach, expect, it, vi } from 'vitest';
import { createLinearIndeterminateController } from './linear-indeterminate.js';

vi.mock('motion', () => ({ animate: vi.fn() }));

beforeEach(() => {
  vi.clearAllMocks();
});

it('runs and cleans up the shared leading/gap/trailing animations', () => {
  const stopLeading = vi.fn();
  const stopGap = vi.fn();
  const stopTrailing = vi.fn();
  vi.mocked(animate)
    .mockReturnValueOnce({ stop: stopLeading } as never)
    .mockReturnValueOnce({ stop: stopGap } as never)
    .mockReturnValueOnce({ stop: stopTrailing } as never);
  const leadingBar = document.createElement('div');
  const gapTrack = document.createElement('div');
  const trailingBar = document.createElement('div');

  const cleanup = createLinearIndeterminateController({
    leadingBar,
    gapTrack,
    trailingBar,
    reducedMotion: () => false,
  });

  expect(animate).toHaveBeenNthCalledWith(
    1,
    leadingBar,
    {
      width: ['0%', '0%', '0%', '20%'],
      marginLeft: ['0px', '0px', '6px', '6px'],
      marginRight: ['0px', '0px', '6px', '6px'],
    },
    {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
      times: [0, 0.499, 0.5, 1],
    },
  );
  cleanup();
  expect(stopLeading).toHaveBeenCalled();
  expect(stopGap).toHaveBeenCalled();
  expect(stopTrailing).toHaveBeenCalled();
});

it('renders a stable reduced-motion frame without starting animations', () => {
  const leadingBar = document.createElement('div');
  const gapTrack = document.createElement('div');
  const trailingBar = document.createElement('div');

  const cleanup = createLinearIndeterminateController({
    leadingBar,
    gapTrack,
    trailingBar,
    reducedMotion: () => true,
  });

  expect(leadingBar.style.width).toBe('20%');
  expect(gapTrack.style.width).toBe('20%');
  expect(trailingBar.style.width).toBe('20%');
  expect(trailingBar.style.marginLeft).toBe('6px');
  expect(animate).not.toHaveBeenCalled();
  expect(cleanup()).toBeUndefined();
});
