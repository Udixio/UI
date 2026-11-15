import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import type { SequenceBinding } from '@udixio/motion';
import { defineSequence, sequence } from '@udixio/motion/sequence';
import Fixture from './sequence.fixture.svelte';

vi.mock('@udixio/motion/sequence', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@udixio/motion/sequence')>()),
  sequence: vi.fn(),
}));

const steps = { title: { keyframes: [{ opacity: 0 }, { opacity: 1 }] } };
defineSequence('hero', { steps });
defineSequence('outro', { steps });

const bindSequence = vi.mocked(sequence);
let bindings: Array<{ destroy: ReturnType<typeof vi.fn> }> = [];

beforeEach(() => {
  bindings = [];
  bindSequence.mockReset();
  bindSequence.mockImplementation(() => {
    const binding = { handle: null, play: vi.fn(), destroy: vi.fn() };
    bindings.push(binding);
    return binding as unknown as SequenceBinding;
  });
});

afterEach(() => {
  cleanup();
});

const props = (overrides: Record<string, unknown> = {}) => ({
  source: 'hero',
  settled: undefined,
  shown: true,
  ...overrides,
});

describe('motionSequence attachment', () => {
  it('binds the sequence to the root on mount, not settled, and destroys it on unmount', async () => {
    const { rerender } = render(Fixture, { props: props() });
    flushSync();

    expect(bindSequence).toHaveBeenCalledExactlyOnceWith(screen.getByTestId('box'), 'hero', { settled: false });

    await rerender(props({ shown: false }));
    flushSync();

    expect(bindings[0].destroy).toHaveBeenCalledOnce();
  });

  it('passes settled through to the binding', () => {
    render(Fixture, { props: props({ settled: true }) });
    flushSync();

    expect(bindSequence).toHaveBeenCalledExactlyOnceWith(screen.getByTestId('box'), 'hero', { settled: true });
  });

  it('binds the new sequence settled, and destroys the old one, when the source changes', async () => {
    const { rerender } = render(Fixture, { props: props() });
    flushSync();

    await rerender(props({ source: 'outro' }));
    flushSync();

    expect(bindings[0].destroy).toHaveBeenCalledOnce();
    expect(bindSequence).toHaveBeenLastCalledWith(screen.getByTestId('box'), 'outro', { settled: true });
  });

  it('waits for a sequence defined after the element is rendered, and binds it settled', () => {
    render(Fixture, { props: props({ source: 'sequence-later' }) });
    flushSync();

    expect(bindSequence).not.toHaveBeenCalled();

    defineSequence('sequence-later', { steps });

    expect(bindSequence).toHaveBeenCalledExactlyOnceWith(
      screen.getByTestId('box'),
      expect.objectContaining({ name: 'sequence-later' }),
      { settled: true },
    );
  });
});
