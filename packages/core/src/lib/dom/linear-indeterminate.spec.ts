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
    expect.objectContaining({ width: '20%', marginLeft: '0px', marginRight: '0px' }),
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

it('stops on policy reduction and resumes once when it is removed', async () => {
  const stop = vi.fn();
  vi.mocked(animate).mockReturnValue({ stop } as never);
  const leadingBar = document.createElement('div');
  const gapTrack = document.createElement('div');
  const trailingBar = document.createElement('div');
  const cleanup = createLinearIndeterminateController({
    leadingBar,
    gapTrack,
    trailingBar,
  });
  expect(animate).toHaveBeenCalledTimes(3);
  document.documentElement.setAttribute('data-motion-policy', 'reduce');
  await Promise.resolve();
  expect(stop).toHaveBeenCalledTimes(3);
  expect(leadingBar.style.width).toBe('20%');
  document.documentElement.removeAttribute('data-motion-policy');
  await Promise.resolve();
  expect(animate).toHaveBeenCalledTimes(6);
  cleanup();
});

it('restores owned styles but preserves later external writes on cleanup', () => {
  const leadingBar = document.createElement('div');
  const gapTrack = document.createElement('div');
  const trailingBar = document.createElement('div');
  leadingBar.style.width = '35%';
  const cleanup = createLinearIndeterminateController({
    leadingBar,
    gapTrack,
    trailingBar,
    reducedMotion: () => true,
  });
  gapTrack.style.width = '55%';
  cleanup();
  expect(leadingBar.style.width).toBe('35%');
  expect(gapTrack.style.width).toBe('55%');
  expect(trailingBar.style.width).toBe('');
  cleanup();
});

it('stops every animation even if one stop throws', () => {
  const stop = vi.fn();
  vi.mocked(animate)
    .mockReturnValueOnce({
      stop: () => {
        throw new Error('stop');
      },
    } as never)
    .mockReturnValue({ stop } as never);
  const cleanup = createLinearIndeterminateController({
    leadingBar: document.createElement('div'),
    gapTrack: document.createElement('div'),
    trailingBar: document.createElement('div'),
  });
  expect(cleanup).toThrow();
  expect(stop).toHaveBeenCalledTimes(2);
  expect(cleanup).not.toThrow();
});

it('renders a fixed frame for every instance when both cancellation and stopping fail', async () => {
  const report = vi.spyOn(console, 'error').mockImplementation(() => {});
  const cancel = vi.fn(() => { throw new Error('cancel'); });
  const stop = vi.fn(() => { throw new Error('stop'); });
  const normalCancel = vi.fn();
  vi.mocked(animate)
    .mockReturnValueOnce({ cancel, stop } as never)
    .mockReturnValue({ cancel: normalCancel } as never);
  const leading = document.createElement('div');
  const otherLeading = document.createElement('div');
  const cleanup = createLinearIndeterminateController({
    leadingBar: leading,
    gapTrack: document.createElement('div'),
    trailingBar: document.createElement('div'),
  });
  const otherCleanup = createLinearIndeterminateController({
    leadingBar: otherLeading,
    gapTrack: document.createElement('div'),
    trailingBar: document.createElement('div'),
  });
  try {
    (vi.mocked(animate).mock.calls[0][0] as { width: string }).width = '67%';
    document.documentElement.setAttribute('data-motion-policy', 'reduce');
    await Promise.resolve();
    expect(leading.style.width).toBe('20%');
    expect(otherLeading.style.width).toBe('20%');
    expect(normalCancel).toHaveBeenCalledTimes(5);
    expect(() => cleanup()).toThrow();
    expect(cancel).toHaveBeenCalledTimes(2);
    expect(stop).toHaveBeenCalledTimes(2);
    expect(cleanup).not.toThrow();
  } finally {
    otherCleanup();
    document.documentElement.removeAttribute('data-motion-policy');
    report.mockRestore();
  }
});

it('rolls back a partial animation installation', () => {
  const stop = vi.fn();
  vi.mocked(animate)
    .mockReturnValueOnce({ stop } as never)
    .mockImplementationOnce(() => {
      throw new Error('start');
    });
  const leadingBar = document.createElement('div');
  leadingBar.style.width = '35%';
  expect(() =>
    createLinearIndeterminateController({
      leadingBar,
      gapTrack: document.createElement('div'),
      trailingBar: document.createElement('div'),
    }),
  ).toThrow('start');
  expect(stop).toHaveBeenCalledOnce();
  expect(leadingBar.style.width).toBe('35%');
});

it('preserves the installation failure when rollback also fails', () => {
  const cancel = vi.fn(() => { throw new Error('cancel'); });
  const stop = vi.fn(() => { throw new Error('stop'); });
  vi.mocked(animate)
    .mockReturnValueOnce({ cancel, stop } as never)
    .mockImplementationOnce(() => { throw new Error('start'); });
  const leadingBar = document.createElement('div');
  leadingBar.style.width = '35%';
  expect(() => createLinearIndeterminateController({
    leadingBar,
    gapTrack: document.createElement('div'),
    trailingBar: document.createElement('div'),
  })).toThrow('start');
  expect(cancel).toHaveBeenCalledTimes(2);
  expect(stop).toHaveBeenCalledTimes(2);
  expect(leadingBar.style.width).toBe('35%');
});
