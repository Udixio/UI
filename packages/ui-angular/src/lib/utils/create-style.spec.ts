import { signal } from '@angular/core';
import { createStyle } from './create-style';

describe('createStyle', () => {
  it('calcule le résultat de la fonction de style et recalcule au changement de signal', () => {
    const n = signal(1);
    const styles = createStyle(
      (s: { n: number }) => ({ root: String(s.n) }),
      () => ({ n: n() }),
    );
    expect(styles()).toEqual({ root: '1' });
    n.set(2);
    expect(styles()).toEqual({ root: '2' });
  });
});
