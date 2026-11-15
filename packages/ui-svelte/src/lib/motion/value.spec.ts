import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import type { ValueBinding } from '@udixio/motion';
import { defineValue, value } from '@udixio/motion/value';
import Fixture from './value.fixture.svelte';

vi.mock('@udixio/motion/value', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@udixio/motion/value')>()),
  value: vi.fn(),
}));

defineValue('tilt', { source: 'state', spring: 'none' });

/** A stand-in for one bound value: `emit` writes a number and calls each listener, as the core does. */
function fakeValue(name: string) {
  const listeners = new Set<(next: number) => void>();
  const binding = {
    name,
    set: vi.fn(),
    subscribe: vi.fn((listener: (next: number) => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    }),
    destroy: vi.fn(() => {
      listeners.clear();
    }),
  };
  return {
    binding,
    listeners,
    emit(next: number) {
      for (const listener of [...listeners]) listener(next);
    },
  };
}

type Fake = ReturnType<typeof fakeValue>;

const bindValue = vi.mocked(value);
let fakes: Fake[] = [];

beforeEach(() => {
  fakes = [];
  bindValue.mockReset();
  bindValue.mockImplementation((_element, source) => {
    const fake = fakeValue(typeof source === 'string' ? source : source.name);
    fakes.push(fake);
    return fake.binding as unknown as ValueBinding;
  });
});

afterEach(() => {
  cleanup();
});

const props = (overrides: Record<string, unknown> = {}) => ({
  source: 'tilt',
  onChange: undefined,
  shown: true,
  ...overrides,
});

describe('motionValue attachment', () => {
  it('binds the value to the element by its name on mount, and destroys the binding on unmount', async () => {
    const { rerender } = render(Fixture, { props: props() });
    flushSync();

    expect(bindValue).toHaveBeenCalledExactlyOnceWith(screen.getByTestId('box'), 'tilt');

    await rerender(props({ shown: false }));
    flushSync();

    expect(fakes[0].binding.destroy).toHaveBeenCalledOnce();
  });

  it('forwards each new number to onChange', () => {
    const onChange = vi.fn();
    render(Fixture, { props: props({ onChange }) });
    flushSync();

    fakes[0].emit(0.3);

    expect(onChange).toHaveBeenCalledExactlyOnceWith(0.3);
  });

  it('reads onChange when a number arrives, so a new handler receives the next numbers', async () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = render(Fixture, { props: props({ onChange: first }) });
    flushSync();

    await rerender(props({ onChange: second }));
    flushSync();
    fakes[0].emit(0.5);

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledExactlyOnceWith(0.5);
    expect(bindValue).toHaveBeenCalledOnce();
  });

  it('stops forwarding and destroys the binding once the element is removed', async () => {
    const onChange = vi.fn();
    const { rerender } = render(Fixture, { props: props({ onChange }) });
    flushSync();

    await rerender(props({ onChange, shown: false }));
    flushSync();
    fakes[0].emit(0.6);

    expect(onChange).not.toHaveBeenCalled();
    expect(fakes[0].listeners.size).toBe(0);
    expect(fakes[0].binding.destroy).toHaveBeenCalledOnce();
  });

  it('waits for a value defined after the element is rendered, then forwards from its binding', () => {
    const onChange = vi.fn();
    render(Fixture, { props: props({ source: 'tilt-later', onChange }) });
    flushSync();

    expect(bindValue).not.toHaveBeenCalled();

    defineValue('tilt-later', { source: 'state', spring: 'none' });
    fakes[0].emit(0.4);

    expect(bindValue).toHaveBeenCalledWith(screen.getByTestId('box'), expect.objectContaining({ name: 'tilt-later' }));
    expect(onChange).toHaveBeenCalledExactlyOnceWith(0.4);
  });
});
