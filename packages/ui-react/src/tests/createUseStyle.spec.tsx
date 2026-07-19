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

  it('mémoïse sur égalité shallow (nouvel objet, mêmes valeurs → même référence de résultat)', () => {
    const style = (s: { n: number }) => ({ root: String(s.n) });
    const useStyle = createUseStyle(style);
    const { result, rerender } = renderHook(({ s }) => useStyle(s), {
      initialProps: { s: { n: 1 } },
    });
    const first = result.current;
    rerender({ s: { n: 1 } }); // nouvel objet, même valeur → mémoïsé
    expect(result.current).toBe(first);
    rerender({ s: { n: 2 } }); // valeur changée → recalcul
    expect(result.current).not.toBe(first);
    expect(result.current).toEqual({ root: '2' });
  });
});
