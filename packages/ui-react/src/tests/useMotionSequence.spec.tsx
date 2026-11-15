import { render } from '@testing-library/react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MotionHandle } from '@udixio/motion';
import { defineSequence, sequence, type SequenceBinding } from '@udixio/motion/sequence';
import {
  useMotionSequence,
  type UseMotionSequenceReturn,
} from '../lib/hooks/useMotionSequence.js';

vi.mock('@udixio/motion/sequence', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@udixio/motion/sequence')>()),
  sequence: vi.fn(),
}));

const steps = { title: { keyframes: [{ opacity: 0 }, { opacity: 1 }] } };
defineSequence('hero', { steps });
defineSequence('outro', { steps });

/**
 * A stand-in for one bound sequence. As the core does, a client bind plays at
 * once and a settled bind does not; `play` returns a new handle each time.
 */
function fakeSequence(settled: boolean) {
  const playHandle = { cancel: vi.fn(), duration: 0 } as unknown as MotionHandle;
  let current: MotionHandle | null = null;
  const binding = {
    get handle() {
      return current;
    },
    play: vi.fn(() => {
      current = playHandle;
      return playHandle;
    }),
    destroy: vi.fn(),
  };
  if (!settled) binding.play();
  return { binding, playHandle };
}

type Fake = ReturnType<typeof fakeSequence>;

const bindSequence = vi.mocked(sequence);
let fakes: Fake[] = [];
let hero: UseMotionSequenceReturn<HTMLDivElement>;

beforeEach(() => {
  fakes = [];
  bindSequence.mockReset();
  bindSequence.mockImplementation((_root, _source, options) => {
    const fake = fakeSequence(options?.settled ?? false);
    fakes.push(fake);
    return fake.binding as unknown as SequenceBinding;
  });
});

function Hero({ source = 'hero', settled }: { source?: string; settled?: boolean }) {
  const sequenceRef = useMotionSequence<HTMLDivElement>(source, { settled });
  hero = sequenceRef;
  return <div data-testid="box" ref={sequenceRef.ref} />;
}

function Gated({ present }: { present: boolean }) {
  const sequenceRef = useMotionSequence<HTMLDivElement>('hero');
  hero = sequenceRef;
  return present ? <div data-testid="box" ref={sequenceRef.ref} /> : null;
}

describe('useMotionSequence', () => {
  it('binds the sequence to the element on a client mount, not settled, and destroys it on unmount', () => {
    const { getByTestId, unmount } = render(<Hero />);

    expect(bindSequence).toHaveBeenCalledTimes(1);
    expect(bindSequence).toHaveBeenCalledWith(getByTestId('box'), 'hero', { settled: false });

    unmount();
    expect(fakes[0].binding.destroy).toHaveBeenCalledTimes(1);
  });

  it('honours an explicit settled option on a client mount', () => {
    render(<Hero settled />);

    expect(bindSequence).toHaveBeenCalledWith(expect.any(HTMLElement), 'hero', { settled: true });
  });

  it('getHandle is null before the element is attached', () => {
    render(<Gated present={false} />);

    expect(hero.getHandle()).toBeNull();
    expect(bindSequence).not.toHaveBeenCalled();
  });

  it('forwards play to the binding, and getHandle returns the handle of the latest play', () => {
    render(<Hero />);
    expect(hero.getHandle()).toBe(fakes[0].playHandle);

    act(() => hero.play());

    expect(fakes[0].binding.play).toHaveBeenCalledTimes(2);
    expect(hero.getHandle()).toBe(fakes[0].playHandle);
  });

  it('binds settled when hydrating server content, so the entry is not replayed', async () => {
    const container = document.createElement('div');
    container.innerHTML = renderToString(<Hero />);
    document.body.append(container);
    let root: Root | undefined;
    try {
      await act(async () => {
        root = hydrateRoot(container, <Hero />);
      });

      expect(bindSequence).toHaveBeenLastCalledWith(expect.any(HTMLElement), 'hero', { settled: true });
    } finally {
      await act(async () => root?.unmount());
      container.remove();
    }
  });

  it('binds the new sequence settled, and destroys the old one, when the source changes', () => {
    const { rerender } = render(<Hero source="hero" />);

    rerender(<Hero source="outro" />);

    expect(fakes[0].binding.destroy).toHaveBeenCalledTimes(1);
    expect(bindSequence).toHaveBeenLastCalledWith(expect.any(HTMLElement), 'outro', { settled: true });
  });

  it('waits for a sequence defined after the element mounts, binds it settled, and never binds after unmount', () => {
    const { unmount } = render(<Hero source="sequence-later" />);
    expect(bindSequence).not.toHaveBeenCalled();

    defineSequence('sequence-later', { steps });
    expect(bindSequence).toHaveBeenCalledTimes(1);
    expect(bindSequence).toHaveBeenCalledWith(expect.any(HTMLElement), expect.objectContaining({ name: 'sequence-later' }), {
      settled: true,
    });

    unmount();
    expect(fakes[0].binding.destroy).toHaveBeenCalledTimes(1);
  });
});
