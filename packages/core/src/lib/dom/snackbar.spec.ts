// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { animate } from 'motion';
import {
  createSnackbarAutoDismissController,
  createSnackbarTransitionController,
} from './snackbar.js';

vi.mock('motion', () => ({
  animate: vi.fn(),
}));

function animationControls() {
  return {
    stop: vi.fn(),
    then: (callback: () => void) => {
      callback();
      return Promise.resolve();
    },
  };
}

describe('createSnackbarAutoDismissController', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not dismiss before duration elapses', () => {
    const onDismiss = vi.fn();
    const controller = createSnackbarAutoDismissController({
      duration: 1000,
      onDismiss,
    });

    vi.advanceTimersByTime(999);
    expect(onDismiss).not.toHaveBeenCalled();
    controller.destroy();
  });

  it('dismisses exactly once after duration elapses', () => {
    const onDismiss = vi.fn();
    const controller = createSnackbarAutoDismissController({
      duration: 1000,
      onDismiss,
    });

    vi.advanceTimersByTime(1000);
    expect(onDismiss).toHaveBeenCalledExactlyOnceWith();
    controller.destroy();
  });

  it('cancels the pending dismissal when destroyed early', () => {
    const onDismiss = vi.fn();
    const controller = createSnackbarAutoDismissController({
      duration: 1000,
      onDismiss,
    });

    controller.destroy();
    vi.advanceTimersByTime(1000);
    expect(onDismiss).not.toHaveBeenCalled();
  });
});

describe('createSnackbarTransitionController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(animate).mockImplementation(() => animationControls() as never);
  });

  it('applies the initial open state immediately without animating', () => {
    const panel = document.createElement('div');
    createSnackbarTransitionController({ panel, open: true });

    expect(panel.style.height).toBe('auto');
    expect(animate).not.toHaveBeenCalled();
  });

  it('applies the initial closed state immediately without animating', () => {
    const panel = document.createElement('div');
    createSnackbarTransitionController({ panel, open: false });

    expect(panel.style.height).toBe('0px');
    expect(animate).not.toHaveBeenCalled();
  });

  it('animates from closed to open on setOpen(true)', () => {
    const panel = document.createElement('div');
    const controller = createSnackbarTransitionController({
      panel,
      open: false,
    });

    controller.setOpen(true);

    expect(animate).toHaveBeenCalledExactlyOnceWith(
      panel,
      { height: ['0px', 'auto'] },
      expect.objectContaining({ duration: 0.1 }),
    );
    expect(panel.style.height).toBe('auto');
  });

  it('animates from open to closed on setOpen(false)', () => {
    const panel = document.createElement('div');
    const controller = createSnackbarTransitionController({
      panel,
      open: true,
    });

    controller.setOpen(false);

    expect(animate).toHaveBeenCalledExactlyOnceWith(
      panel,
      { height: ['auto', '0px'] },
      expect.objectContaining({ duration: 0.1 }),
    );
    expect(panel.style.height).toBe('0px');
  });

  it('merges a custom transition with the default duration', () => {
    const panel = document.createElement('div');
    const controller = createSnackbarTransitionController({
      panel,
      open: false,
      transition: { ease: 'linear' },
    });

    controller.setOpen(true);

    expect(animate).toHaveBeenCalledExactlyOnceWith(
      panel,
      { height: ['0px', 'auto'] },
      expect.objectContaining({ duration: 0.1, ease: 'linear' }),
    );
  });

  it('is a no-op when setOpen requests the current state', () => {
    const panel = document.createElement('div');
    const controller = createSnackbarTransitionController({
      panel,
      open: true,
    });

    controller.setOpen(true);
    expect(animate).not.toHaveBeenCalled();
  });

  it('skips the animation and jumps directly when reduced motion is preferred', () => {
    const panel = document.createElement('div');
    const controller = createSnackbarTransitionController({
      panel,
      open: false,
      reducedMotion: () => true,
    });

    controller.setOpen(true);

    expect(animate).not.toHaveBeenCalled();
    expect(panel.style.height).toBe('auto');
  });

  it('ignores setOpen after destroy', () => {
    const panel = document.createElement('div');
    const controller = createSnackbarTransitionController({
      panel,
      open: false,
    });

    controller.destroy();
    controller.setOpen(true);

    expect(animate).not.toHaveBeenCalled();
    expect(panel.style.height).toBe('');
  });
});
