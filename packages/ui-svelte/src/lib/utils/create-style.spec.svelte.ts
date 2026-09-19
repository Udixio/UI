import { flushSync } from 'svelte';
import { createStyle } from './create-style.svelte';

describe('createStyle', () => {
  it('derives the style record from the reactive state', () => {
    let variant = $state('filled');
    const styleFn = vi.fn((state: { variant: string }) => ({
      root: `button-${state.variant}`,
    }));
    let styles!: ReturnType<typeof createStyle<{ variant: string }>>;
    const dispose = $effect.root(() => {
      styles = createStyle(styleFn, () => ({ variant }));
    });

    expect(styles.current).toEqual({ root: 'button-filled' });
    const first = styles.current;
    expect(styles.current).toBe(first);
    expect(styleFn).toHaveBeenCalledTimes(1);

    variant = 'tonal';
    flushSync();
    expect(styles.current).toEqual({ root: 'button-tonal' });
    expect(styleFn).toHaveBeenCalledTimes(2);
    dispose();
  });
});
