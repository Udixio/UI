import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { createUseStyle } from '../lib/utils/create-use-style';

describe('createUseStyle', () => {
  it('returns the result of the style function', () => {
    const style = (s: { variant: string }) => ({ root: `v-${s.variant}` });
    const useStyle = createUseStyle(style);
    const { result } = renderHook(() => useStyle({ variant: 'filled' }));
    expect(result.current).toEqual({ root: 'v-filled' });
  });

  it('memoizes on shallow equality (new object, same values → same result reference)', () => {
    const style = (s: { n: number }) => ({ root: String(s.n) });
    const useStyle = createUseStyle(style);
    const { result, rerender } = renderHook(({ s }) => useStyle(s), {
      initialProps: { s: { n: 1 } },
    });
    const first = result.current;
    rerender({ s: { n: 1 } }); // new object, same value → memoized
    expect(result.current).toBe(first);
    rerender({ s: { n: 2 } }); // changed value → recomputed
    expect(result.current).not.toBe(first);
    expect(result.current).toEqual({ root: '2' });
  });
});
