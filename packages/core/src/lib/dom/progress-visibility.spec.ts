import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createProgressVisibilityController } from './progress-visibility.js';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('createProgressVisibilityController', () => {
  it('reports visible immediately when the value is below 100', () => {
    const onVisibilityChange = vi.fn();
    const cleanup = createProgressVisibilityController({
      completedPercentage: 40,
      transitionDuration: 1000,
      onVisibilityChange,
    });

    expect(onVisibilityChange).toHaveBeenCalledExactlyOnceWith(true);
    cleanup();
  });

  it('hides after transitionDuration once the value reaches 100', () => {
    const onVisibilityChange = vi.fn();
    const cleanup = createProgressVisibilityController({
      completedPercentage: 100,
      transitionDuration: 1000,
      onVisibilityChange,
    });

    expect(onVisibilityChange).not.toHaveBeenCalled();
    vi.advanceTimersByTime(999);
    expect(onVisibilityChange).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onVisibilityChange).toHaveBeenCalledExactlyOnceWith(false);
    cleanup();
  });

  it('cancels the pending hide when cleaned up early', () => {
    const onVisibilityChange = vi.fn();
    const cleanup = createProgressVisibilityController({
      completedPercentage: 100,
      transitionDuration: 1000,
      onVisibilityChange,
    });

    cleanup();
    vi.advanceTimersByTime(1000);
    expect(onVisibilityChange).not.toHaveBeenCalled();
  });
});
