import '@udixio/motion/presets';
import { act, useLayoutEffect } from 'react';
import { render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
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

/** What the layout effect of `Focusing` saw: whether its item was inert, and the element that had focus after it focused it. */
interface FocusRecord {
  inert?: boolean;
  focused?: Element | null;
}

/** A list whose layout effect focuses the item `focus` names, as a consumer does right after the render that shows it. */
function Focusing({ ids, focus, record }: { ids: readonly string[]; focus?: string; record: FocusRecord }) {
  useLayoutEffect(() => {
    if (focus === undefined) return;
    const item = document.querySelector<HTMLElement>(`[data-testid="${focus}"]`);
    record.inert = item?.hasAttribute('inert');
    item?.focus();
    record.focused = document.activeElement;
  });
  return (
    <ul>
      <Presence>
        {ids.map((id) => (
          <Motion key={id} as="li" name="fade" tabIndex={-1} data-testid={id}>
            {id}
          </Motion>
        ))}
      </Presence>
    </ul>
  );
}

/**
 * Removes item `b`, then brings it back in the render that focuses it, before its exit has ended. The exit is still running
 * when the render comes: its completion is a microtask, so the render is made in the same task. Returns the element that stayed.
 */
async function removeAndBringBack(record: FocusRecord): Promise<Element | null> {
  const { container, rerender } = render(<Focusing ids={['a', 'b']} record={record} />);
  await act(() => Promise.resolve());

  rerender(<Focusing ids={['a']} record={record} />);
  const exiting = container.querySelector('[data-testid="b"]');
  expect(exiting?.hasAttribute('inert')).toBe(true);

  rerender(<Focusing ids={['a', 'b']} focus="b" record={record} />);
  return exiting;
}

describe('Presence with the real motion core: a child that comes back while its exit runs', () => {
  afterEach(() => {
    delete document.documentElement.dataset.motionPolicy;
  });

  it('is not inert in the layout effects of the render that brings it back, so focus moves to it', async () => {
    const record: FocusRecord = {};

    const exiting = await removeAndBringBack(record);

    expect(record.inert).toBe(false);
    expect(record.focused).toBe(exiting);
  });

  it('is not inert in the layout effects of the same render under reduced motion', async () => {
    document.documentElement.dataset.motionPolicy = 'reduce';
    const record: FocusRecord = {};

    const exiting = await removeAndBringBack(record);

    expect(record.inert).toBe(false);
    expect(record.focused).toBe(exiting);
  });
});
