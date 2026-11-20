import '@udixio/motion/presets';
import { act } from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Motion, Presence } from '../lib/index.js';

function List({ ids }: { ids: readonly string[] }) {
  return (
    <ul>
      <Presence>
        {ids.map((id) => (
          <Motion key={id} as="li" name="fade" data-testid={id}>
            {id}
          </Motion>
        ))}
      </Presence>
    </ul>
  );
}

describe('Presence with the real motion core', () => {
  it('binds the presence of each child, and the child leaves once its exit has ended', async () => {
    const { queryByTestId, rerender } = render(<List ids={['a', 'b']} />);
    await act(() => Promise.resolve());
    expect(queryByTestId('b')?.getAttribute('data-presence')).toBe('present');

    rerender(<List ids={['a']} />);
    await act(() => Promise.resolve());

    expect(queryByTestId('b')).toBeNull();
    expect(queryByTestId('a')?.getAttribute('data-presence')).toBe('present');
  });
});
