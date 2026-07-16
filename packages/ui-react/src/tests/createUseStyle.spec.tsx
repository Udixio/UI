import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { createUseStyle } from '../lib/utils/create-use-style';

describe('createUseStyle', () => {
  it('renvoie le résultat de la fonction de style', () => {
    const style = (s: { variant: string }) => ({ root: `v-${s.variant}` });
    const useStyle = createUseStyle(style);
    const { result } = renderHook(() => useStyle({ variant: 'filled' }));
    expect(result.current).toEqual({ root: 'v-filled' });
  });

  it('mémoïse tant que le state ne change pas', () => {
    const style = (s: { n: number }) => ({ root: String(s.n) });
    const useStyle = createUseStyle(style);
    const state = { n: 1 };
    const { result, rerender } = renderHook(({ s }) => useStyle(s), {
      initialProps: { s: state },
    });
    const first = result.current;
    rerender({ s: state });
    expect(result.current).toBe(first);
  });
});
