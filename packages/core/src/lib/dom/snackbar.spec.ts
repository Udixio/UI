// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSnackbarAutoDismissController } from './snackbar.js';

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
