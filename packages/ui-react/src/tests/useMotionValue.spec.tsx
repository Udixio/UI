import { act } from 'react';
import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ValueBinding } from '@udixio/motion';
import { defineValue, value } from '@udixio/motion/value';
import {
  useMotionValue,
  useMotionValueSnapshot,
  type UseMotionValueReturn,
} from '../lib/hooks/useMotionValue.js';

vi.mock('@udixio/motion/value', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@udixio/motion/value')>()),
  value: vi.fn(),
}));

defineValue('tilt', { source: 'state', spring: 'none' });
defineValue('tilt-b', { source: 'state', spring: 'none' });
defineValue('tilt-test', { source: 'state', spring: 'none' });

/**
 * A stand-in for one bound value. Like the core, it keeps its listeners in a
 * set, clears them on destroy, and `emit` writes a number and calls each listener.
 */
function fakeValue(name: string) {
  const listeners = new Set<(next: number) => void>();
  let current = 0;
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
    get current() {
      return current;
    },
  };
  return {
    binding,
    listeners,
    emit(next: number) {
      current = next;
      for (const listener of [...listeners]) listener(next);
    },
  };
}

type Fake = ReturnType<typeof fakeValue>;

const bindValue = vi.mocked(value);
let fakes: Fake[] = [];
let handle: UseMotionValueReturn<HTMLDivElement>;
let renders = 0;

beforeEach(() => {
  fakes = [];
  renders = 0;
  bindValue.mockReset();
  bindValue.mockImplementation((_element, source) => {
    const name = typeof source === 'string' ? source : source.name;
    const fake = fakeValue(name);
    fakes.push(fake);
    return fake.binding as unknown as ValueBinding;
  });
});

function Tilt({ source = 'tilt' }: { source?: string }) {
  const tilt = useMotionValue<HTMLDivElement>(source);
  handle = tilt;
  return <div data-testid="box" ref={tilt.ref} />;
}

function Gated({ source = 'tilt', present = true }: { source?: string; present?: boolean }) {
  const tilt = useMotionValue<HTMLDivElement>(source);
  handle = tilt;
  return present ? <div data-testid="box" ref={tilt.ref} /> : null;
}

function Readout() {
  const tilt = useMotionValue<HTMLDivElement>('tilt');
  const current = useMotionValueSnapshot(tilt);
  return (
    <div data-testid="box" ref={tilt.ref}>
      {current === undefined ? '-' : current}
    </div>
  );
}

function Quiet() {
  const tilt = useMotionValue<HTMLDivElement>('tilt');
  renders += 1;
  handle = tilt;
  return <div data-testid="box" ref={tilt.ref} />;
}

describe('useMotionValue', () => {
  it('binds the value to the element on mount, by its name, and destroys the binding on unmount', () => {
    const { getByTestId, unmount } = render(<Tilt />);

    expect(bindValue).toHaveBeenCalledTimes(1);
    expect(bindValue).toHaveBeenCalledWith(getByTestId('box'), 'tilt');

    unmount();
    expect(fakes[0].binding.destroy).toHaveBeenCalledTimes(1);
  });

  it('forwards set to the binding, and get reads the number the binding currently holds', () => {
    render(<Tilt />);

    handle.set(0.5);
    expect(fakes[0].binding.set).toHaveBeenCalledWith(0.5);

    act(() => fakes[0].emit(0.25));
    expect(handle.get()).toBe(0.25);
  });

  it('reads undefined, ignores set, and binds nothing before the element is attached', () => {
    render(<Gated present={false} />);

    expect(handle.get()).toBeUndefined();
    expect(() => handle.set(0.5)).not.toThrow();
    expect(bindValue).not.toHaveBeenCalled();
  });

  it('delivers the values to a listener registered before the element is attached', () => {
    const listener = vi.fn();
    const { rerender } = render(<Gated present={false} />);
    handle.subscribe(listener);

    rerender(<Gated />);
    act(() => fakes[0].emit(0.3));

    expect(listener).toHaveBeenCalledWith(0.3);
  });

  it('stops delivering to a listener once its unsubscribe has run', () => {
    const listener = vi.fn();
    render(<Tilt />);
    const unsubscribe = handle.subscribe(listener);

    unsubscribe();
    act(() => fakes[0].emit(0.3));

    expect(listener).not.toHaveBeenCalled();
    expect(fakes[0].listeners.size).toBe(0);
  });

  it('binds the new value when the source changes, and moves the listeners to it', () => {
    const listener = vi.fn();
    const { rerender } = render(<Tilt source="tilt" />);
    handle.subscribe(listener);

    rerender(<Tilt source="tilt-b" />);

    expect(fakes[0].binding.destroy).toHaveBeenCalledTimes(1);
    expect(fakes[0].listeners.size).toBe(0);
    expect(bindValue).toHaveBeenLastCalledWith(expect.any(HTMLElement), 'tilt-b');
    act(() => fakes[1].emit(0.7));
    expect(listener).toHaveBeenCalledWith(0.7);
  });

  it('keeps the listeners on the element that is bound now, when the element is replaced', () => {
    const listener = vi.fn();
    const { rerender } = render(<Gated />);
    handle.subscribe(listener);

    rerender(<Gated present={false} />);
    rerender(<Gated />);

    expect(bindValue).toHaveBeenCalledTimes(2);
    act(() => fakes[1].emit(0.4));
    expect(listener).toHaveBeenCalledWith(0.4);
  });

  it('waits for a value defined after the element mounts, and binds it then without throwing', () => {
    render(<Tilt source="tilt-later" />);

    expect(bindValue).not.toHaveBeenCalled();
    expect(handle.get()).toBeUndefined();

    defineValue('tilt-later', { source: 'state', spring: 'none' });

    expect(bindValue).toHaveBeenCalledTimes(1);
    expect(bindValue).toHaveBeenCalledWith(expect.any(HTMLElement), expect.objectContaining({ name: 'tilt-later' }));
  });

  it('re-renders a component that reads through useMotionValueSnapshot on each new value', () => {
    const { getByTestId } = render(<Readout />);

    act(() => fakes[0].emit(0.6));

    expect(getByTestId('box').textContent).toBe('0.6');
  });

  it('never re-renders a component that only reads with get', () => {
    render(<Quiet />);
    const before = renders;

    act(() => fakes[0].emit(0.4));

    expect(renders).toBe(before);
    expect(handle.get()).toBe(0.4);
  });
});

describe('useMotionValue with the real value binding', () => {
  beforeEach(async () => {
    const actual = await vi.importActual<typeof import('@udixio/motion/value')>('@udixio/motion/value');
    bindValue.mockImplementation(actual.value);
  });

  it('writes a state value as the CSS variable of the element, at once when there is no spring', () => {
    const { getByTestId } = render(<Tilt source="tilt-test" />);

    act(() => handle.set(0.5));

    expect(getByTestId('box').style.getPropertyValue('--udx-motion-value-tilt-test')).toBe('0.5');
  });
});
