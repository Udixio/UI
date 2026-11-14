import { StrictMode, act } from 'react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  motionWhenDefined,
  type DeferredMotion,
  type MotionBinding,
} from '@udixio/motion';
import {
  useMotion,
  type UseMotionReturn,
} from '../lib/hooks/useMotion.js';

vi.mock('@udixio/motion', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@udixio/motion')>()),
  motionWhenDefined: vi.fn(),
}));

type Outcome = 'finished' | 'cancelled';
type Verb = MotionBinding['verb'];

/**
 * A stand-in for one bound motion. Like the core, `setPresent` refuses an
 * emphasis and `play` refuses a presence verb, so a wrong call fails loudly.
 * The test settles each exit by hand, as the animation would.
 */
function fakeMotion(verb: Verb) {
  const exits: Array<(outcome: Outcome) => void> = [];
  const binding = {
    verb,
    present: true,
    handle: null,
    setPresent: vi.fn((present: boolean) => {
      if (verb === 'emphasize') {
        throw new TypeError('setPresent does not apply to an emphasis');
      }
      return new Promise<Outcome>((resolve) => {
        if (!present) exits.push(resolve);
      });
    }),
    play: vi.fn(() => {
      if (verb !== 'emphasize') {
        throw new TypeError('play() applies to an emphasis');
      }
    }),
    destroy: vi.fn(),
  };
  const deferred = { binding, destroy: vi.fn() };
  return {
    deferred,
    binding,
    /** Settles the oldest pending exit. */
    settleExit: (outcome: Outcome) => exits.shift()?.(outcome),
  };
}

const bindMotion = vi.mocked(motionWhenDefined);
let verb: Verb = 'appear';
let fakes: ReturnType<typeof fakeMotion>[] = [];

beforeEach(() => {
  verb = 'appear';
  fakes = [];
  bindMotion.mockReset();
  bindMotion.mockImplementation(() => {
    const fake = fakeMotion(verb);
    fakes.push(fake);
    return fake.deferred as unknown as DeferredMotion;
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

interface PanelProps {
  source?: string;
  present?: boolean;
  state?: unknown;
  settled?: boolean;
}

function Panel({ source = 'slide', present = true, state, settled }: PanelProps) {
  const panel = useMotion(source, { present, state, settled });
  return panel.mounted && <div data-testid="box" ref={panel.ref} />;
}

let probe: UseMotionReturn<HTMLElement> | undefined;

function Probe({ source }: { source: string }) {
  const panel = useMotion(source);
  probe = panel;
  return panel.mounted && <div data-testid="box" ref={panel.ref} />;
}

describe('useMotion', () => {
  it('binds the element as it enters and destroys the binding on unmount', () => {
    const { unmount } = render(<Panel />);

    expect(bindMotion).toHaveBeenCalledTimes(1);
    expect(bindMotion).toHaveBeenCalledWith(expect.any(HTMLElement), 'slide', {
      present: true,
      settled: false,
    });

    unmount();
    expect(fakes[0].deferred.destroy).toHaveBeenCalledTimes(1);
  });

  it('keeps the element while its exit plays, and removes it once the exit finishes', async () => {
    const { queryByTestId, rerender } = render(<Panel />);

    rerender(<Panel present={false} />);
    expect(fakes[0].binding.setPresent).toHaveBeenCalledWith(false);
    expect(queryByTestId('box')).not.toBeNull();

    await act(async () => fakes[0].settleExit('finished'));
    expect(queryByTestId('box')).toBeNull();
    expect(fakes[0].deferred.destroy).toHaveBeenCalledTimes(1);
  });

  it('treats hydrated server content as in place, and plays the entry on a later remount', async () => {
    const errors: unknown[] = [];
    const container = document.createElement('div');
    container.innerHTML = renderToString(<Panel />);
    document.body.append(container);
    let root: Root | undefined;
    try {
      await act(async () => {
        root = hydrateRoot(container, <Panel />, {
          onRecoverableError: (error) => errors.push(error),
        });
      });
      expect(bindMotion).toHaveBeenLastCalledWith(
        expect.any(HTMLElement),
        'slide',
        { present: true, settled: true },
      );

      await act(async () => root?.render(<Panel present={false} />));
      await act(async () => fakes[0].settleExit('finished'));
      expect(container.querySelector('[data-testid="box"]')).toBeNull();

      await act(async () => root?.render(<Panel />));
      expect(bindMotion).toHaveBeenLastCalledWith(
        expect.any(HTMLElement),
        'slide',
        { present: true, settled: false },
      );
      expect(errors).toEqual([]);
    } finally {
      await act(async () => root?.unmount());
      container.remove();
    }
  });

  it('keeps the hydrated element settled on the last attach under StrictMode', async () => {
    const container = document.createElement('div');
    container.innerHTML = renderToString(
      <StrictMode>
        <Panel />
      </StrictMode>,
    );
    document.body.append(container);
    let root: Root | undefined;
    try {
      await act(async () => {
        root = hydrateRoot(
          container,
          <StrictMode>
            <Panel />
          </StrictMode>,
        );
      });
      expect(bindMotion).toHaveBeenLastCalledWith(
        expect.any(HTMLElement),
        'slide',
        { present: true, settled: true },
      );
    } finally {
      await act(async () => root?.unmount());
      container.remove();
    }
  });

  it('cancels the exit when present comes back before it resolves, and keeps the element', async () => {
    const { queryByTestId, rerender } = render(<Panel />);

    rerender(<Panel present={false} />);
    rerender(<Panel />);
    expect(fakes[0].binding.setPresent).toHaveBeenLastCalledWith(true);

    await act(async () => fakes[0].settleExit('cancelled'));
    expect(queryByTestId('box')).not.toBeNull();
    expect(bindMotion).toHaveBeenCalledTimes(1);
  });

  it('settles an exit that resolves after unmount without a React warning, and destroys once', async () => {
    const error = vi.spyOn(console, 'error');
    const { rerender, unmount } = render(<Panel />);

    rerender(<Panel present={false} />);
    unmount();
    await act(async () => fakes[0].settleExit('finished'));

    expect(error).not.toHaveBeenCalled();
    expect(fakes[0].deferred.destroy).toHaveBeenCalledTimes(1);
  });

  it('replays an emphasis once for each change of state', () => {
    verb = 'emphasize';
    const { rerender } = render(<Panel source="press" state={0} />);

    rerender(<Panel source="press" state={0} />);
    expect(fakes[0].binding.play).not.toHaveBeenCalled();

    rerender(<Panel source="press" state={1} />);
    expect(fakes[0].binding.play).toHaveBeenCalledTimes(1);
  });

  it('never replays a presence motion on a change of state', () => {
    verb = 'appear';
    const { rerender } = render(<Panel state={0} />);

    rerender(<Panel state={1} />);
    expect(fakes[0].binding.play).not.toHaveBeenCalled();
  });

  it('binds a new motion, settled, when the source changes', () => {
    const { rerender } = render(<Panel source="slide" />);

    rerender(<Panel source="scale" />);

    expect(fakes[0].deferred.destroy).toHaveBeenCalledTimes(1);
    expect(bindMotion).toHaveBeenCalledTimes(2);
    expect(bindMotion).toHaveBeenLastCalledWith(
      expect.any(HTMLElement),
      'scale',
      { present: true, settled: true },
    );
  });

  it('returns a play that replays an emphasis and exposes the binding', () => {
    verb = 'emphasize';
    render(<Probe source="press" />);

    probe?.play();

    expect(fakes[0].binding.play).toHaveBeenCalledTimes(1);
    expect(probe?.getBinding()).toBe(fakes[0].binding);
  });

  it('returns a play that does nothing on a presence motion', () => {
    verb = 'appear';
    render(<Probe source="slide" />);

    expect(() => probe?.play()).not.toThrow();
    expect(fakes[0].binding.play).not.toHaveBeenCalled();
  });
});
