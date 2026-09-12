import { signal } from '@angular/core';
import { createStyle } from './create-style';

describe('createStyle', () => {
  it('computes the result of the style function and recomputes when a signal changes', () => {
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
