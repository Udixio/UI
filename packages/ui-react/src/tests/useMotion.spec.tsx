import { StrictMode, act } from 'react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  kindOf,
  motionWhenDefined,
  type DeferredMotion,
  type MotionBinding,
} from '@udixio/motion';
import {
  useMotion,
  type UseMotionReturn,
} from '../lib/hooks/useMotion.js';

vi.mock('@udixio/motion', async (importOriginal) => {
  const motionWhenDefined = vi.fn();
  return {
    ...(await importOriginal<typeof import('@udixio/motion')>()),
    motionWhenDefined,
    // The rule of a list (one motion of each kind) is the core's, tested there: here each source is one stand-in.
    motionsWhenDefined: (element: unknown, sources: readonly unknown[], options: unknown) =>
      sources.map((source) => motionWhenDefined(element, source, options)),
  };
});

type Outcome = 'finished' | 'cancelled';
type Verb = MotionBinding['verb'];

/**
 * A stand-in for one bound motion. Like the core, `setPresent` refuses an
 * emphasis, `play` refuses a presence verb and `pause` refuses anything but a
 * loop, so a wrong call fails loudly. The test settles each exit by hand, as
 * the animation would.
 */
function fakeMotion(verb: Verb) {
  const exits: Array<(outcome: Outcome) => void> = [];
  const binding = {
    verb,
    kind: kindOf(verb),
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
      if (verb !== 'emphasize' && verb !== 'reveal' && verb !== 'loop') {
        throw new TypeError('play() applies to an emphasis, a reveal or a loop');
      }
    }),
    pause: vi.fn(() => {
      if (verb !== 'loop') {
        throw new TypeError('pause applies to a loop motion');
      }
    }),
    destroy: vi.fn(),
  };
  // As the core's deferred motion: the presence goes to a presence motion, the replay to an emphasis or a reveal, and nothing else.
  const deferred = {
    binding,
    setPresent: vi.fn((present: boolean) =>
      binding.kind === 'presence' ? binding.setPresent(present) : Promise.resolve<Outcome>('finished'),
    ),
    play: vi.fn(() => {
      if (binding.kind === 'emphasis' || verb === 'reveal') binding.play();
    }),
    destroy: vi.fn(),
  };
  return {
    deferred,
    binding,
    /** Settles the oldest pending exit. */
    settleExit: (outcome: Outcome) => exits.shift()?.(outcome),
  };
}

const bindMotion = vi.mocked(motionWhenDefined);
let verb: Verb = 'appear';
/** The verb of each named source, for a test that binds several kinds to one element. */
let verbs: Record<string, Verb> = {};
let fakes: ReturnType<typeof fakeMotion>[] = [];

beforeEach(() => {
  verb = 'appear';
  verbs = {};
  fakes = [];
  bindMotion.mockReset();
  bindMotion.mockImplementation((_element, source) => {
    const named = typeof source === 'string' ? verbs[source] : undefined;
    const fake = fakeMotion(named ?? verb);
    fakes.push(fake);
    return fake.deferred as unknown as DeferredMotion;
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

interface PanelProps {
  source?: string | string[];
  present?: boolean;
  state?: unknown;
  settled?: boolean;
  shared?: string;
  paused?: boolean;
  restoreFocus?: HTMLElement;
}

function Panel({ source = 'slide', present = true, state, settled, shared, paused, restoreFocus }: PanelProps) {
  const panel = useMotion(source, { present, state, settled, shared, paused, restoreFocus });
  return panel.mounted && <div data-testid="box" ref={panel.ref} />;
}

let probe: UseMotionReturn<HTMLElement> | undefined;

function Probe({ source }: { source: string | string[] }) {
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
      development: true,
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

  it('keeps an element rendered with hidden={!present} in the DOM: displayed while its exit plays, then hidden, and shown again with its entry', async () => {
    function Kept({ present }: { present: boolean }) {
      const panel = useMotion('slide', { present });
      return <div data-testid="box" ref={panel.ref} hidden={!present} />;
    }
    const { getByTestId, rerender } = render(<Kept present />);
    const box = getByTestId('box');

    rerender(<Kept present={false} />);
    expect(fakes[0].binding.setPresent).toHaveBeenLastCalledWith(false);
    expect(box.hidden).toBe(true);
    // The exit plays on an element still displayed: its own display is held inline until the exit has finished.
    expect(box.style.getPropertyPriority('display')).toBe('important');

    await act(async () => fakes[0].settleExit('finished'));
    expect(getByTestId('box')).toBe(box);
    expect(box.hidden).toBe(true);
    expect(box.style.display).toBe('');

    rerender(<Kept present />);
    expect(fakes[0].binding.setPresent).toHaveBeenLastCalledWith(true);
    expect(box.hidden).toBe(false);
    expect(bindMotion).toHaveBeenCalledTimes(1);
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
        { present: true, settled: true, development: true },
      );

      await act(async () => root?.render(<Panel present={false} />));
      await act(async () => fakes[0].settleExit('finished'));
      expect(container.querySelector('[data-testid="box"]')).toBeNull();

      await act(async () => root?.render(<Panel />));
      expect(bindMotion).toHaveBeenLastCalledWith(
        expect.any(HTMLElement),
        'slide',
        { present: true, settled: false, development: true },
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
        { present: true, settled: true, development: true },
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

  it('replays a reveal once for each change of state, as an emphasis does', () => {
    verb = 'reveal';
    const { rerender } = render(<Panel source="rise" state={0} />);

    rerender(<Panel source="rise" state={1} />);
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
      { present: true, settled: true, development: true },
    );
  });

  it('returns a play that replays an emphasis and exposes the binding', () => {
    verb = 'emphasize';
    render(<Probe source="press" />);

    probe?.play();

    expect(fakes[0].binding.play).toHaveBeenCalledTimes(1);
    expect(probe?.getBinding()).toBe(fakes[0].binding);
  });

  it('never sets the presence of a layout motion, and removes an absent layout at once', () => {
    verb = 'layout';
    const error = vi.spyOn(console, 'error');
    const { queryByTestId, rerender } = render(<Panel />);

    rerender(<Panel present={false} />);

    expect(fakes[0].binding.setPresent).not.toHaveBeenCalled();
    expect(queryByTestId('box')).toBeNull();
    expect(error).not.toHaveBeenCalled();
  });

  it('hands a replay and a change of state to a motion not defined yet, so that they play once it is defined', () => {
    // The name is not defined: its motion is a deferred one with no binding, which keeps what it is asked.
    const pending = { binding: undefined, setPresent: vi.fn(), play: vi.fn(), destroy: vi.fn() };
    bindMotion.mockImplementationOnce(() => pending as unknown as DeferredMotion);
    let panel: UseMotionReturn<HTMLElement> | undefined;
    function Pending({ state }: { state: number }) {
      panel = useMotion('later', { state });
      return <div data-testid="box" ref={panel.ref} />;
    }
    const { rerender } = render(<Pending state={1} />);
    rerender(<Pending state={2} />);
    expect(pending.play).toHaveBeenCalledTimes(1);
    act(() => panel?.play());
    expect(pending.play).toHaveBeenCalledTimes(2);
  });

  it('returns a play that does nothing on a presence motion', () => {
    verb = 'appear';
    render(<Probe source="slide" />);

    expect(() => probe?.play()).not.toThrow();
    expect(fakes[0].binding.play).not.toHaveBeenCalled();
  });

  it('binds each source of a list with the same options, and destroys them all on unmount', () => {
    const { unmount } = render(<Panel source={['fade', 'reflow']} />);

    expect(bindMotion).toHaveBeenCalledTimes(2);
    expect(bindMotion).toHaveBeenNthCalledWith(1, expect.any(HTMLElement), 'fade', {
      present: true,
      settled: false,
      development: true,
    });
    expect(bindMotion).toHaveBeenNthCalledWith(2, expect.any(HTMLElement), 'reflow', {
      present: true,
      settled: false,
      development: true,
    });

    unmount();
    expect(fakes[0].deferred.destroy).toHaveBeenCalledTimes(1);
    expect(fakes[1].deferred.destroy).toHaveBeenCalledTimes(1);
  });

  it('splits a string of names separated by spaces into one motion each', () => {
    render(<Panel source="fade reflow" />);

    expect(bindMotion).toHaveBeenCalledTimes(2);
    expect(bindMotion).toHaveBeenNthCalledWith(1, expect.any(HTMLElement), 'fade', {
      present: true,
      settled: false,
      development: true,
    });
    expect(bindMotion).toHaveBeenNthCalledWith(2, expect.any(HTMLElement), 'reflow', {
      present: true,
      settled: false,
      development: true,
    });
  });

  it('exits the presence of a list and keeps the element until it finishes, leaving the layout alone', async () => {
    verbs = { fade: 'appear', reflow: 'layout' };
    const { queryByTestId, rerender } = render(<Panel source={['fade', 'reflow']} />);

    rerender(<Panel source={['fade', 'reflow']} present={false} />);

    expect(fakes[0].binding.setPresent).toHaveBeenCalledWith(false);
    expect(fakes[1].binding.setPresent).not.toHaveBeenCalled();
    expect(queryByTestId('box')).not.toBeNull();

    await act(async () => fakes[0].settleExit('finished'));
    expect(queryByTestId('box')).toBeNull();
  });

  it('replays only the emphasis of a list when state changes', () => {
    verbs = { press: 'emphasize', reflow: 'layout' };
    const { rerender } = render(<Panel source={['press', 'reflow']} state={0} />);

    rerender(<Panel source={['press', 'reflow']} state={1} />);

    expect(fakes[0].binding.play).toHaveBeenCalledTimes(1);
    expect(fakes[1].binding.play).not.toHaveBeenCalled();
  });

  it('returns the binding of a kind, and the presence without a kind', () => {
    verbs = { reflow: 'layout', fade: 'appear' };
    render(<Probe source={['reflow', 'fade']} />);

    expect(probe?.getBinding('layout')).toBe(fakes[0].binding);
    expect(probe?.getBinding()).toBe(fakes[1].binding);
  });

  it('gives the shared identity to every motion it binds', () => {
    verbs = { fade: 'appear', reflow: 'layout' };
    render(<Panel source={['fade', 'reflow']} shared="pic" />);

    expect(bindMotion).toHaveBeenCalledTimes(2);
    expect(bindMotion).toHaveBeenNthCalledWith(1, expect.any(HTMLElement), 'fade', expect.objectContaining({ shared: 'pic' }));
    expect(bindMotion).toHaveBeenNthCalledWith(2, expect.any(HTMLElement), 'reflow', expect.objectContaining({ shared: 'pic' }));
  });

  it('passes restoreFocus to the motion it binds', () => {
    const back = document.createElement('button');
    render(<Panel restoreFocus={back} />);
    expect(bindMotion).toHaveBeenCalledWith(expect.any(HTMLElement), 'slide', expect.objectContaining({ restoreFocus: back }));
  });

  it('binds again, settled, when the shared identity changes, and destroys the old binding once', () => {
    const { rerender } = render(<Panel shared="pic" />);

    rerender(<Panel shared="frame" />);

    expect(fakes[0].deferred.destroy).toHaveBeenCalledTimes(1);
    expect(bindMotion).toHaveBeenCalledTimes(2);
    expect(bindMotion).toHaveBeenLastCalledWith(expect.any(HTMLElement), 'slide', {
      present: true,
      settled: true,
      shared: 'frame',
      development: true,
    });
  });

  it('pauses a loop bound with paused set, once, and never plays it', () => {
    verb = 'loop';
    render(<Panel source="rotate" paused />);

    expect(fakes[0].binding.pause).toHaveBeenCalledTimes(1);
    expect(fakes[0].binding.play).not.toHaveBeenCalled();
  });

  it('leaves a loop running when paused is not set', () => {
    verb = 'loop';
    render(<Panel source="rotate" />);

    expect(fakes[0].binding.pause).not.toHaveBeenCalled();
    expect(fakes[0].binding.play).not.toHaveBeenCalled();
  });

  it('pauses the loop when paused turns true and plays it when paused turns false, without binding again', () => {
    verb = 'loop';
    const { rerender } = render(<Panel source="rotate" paused={false} />);

    rerender(<Panel source="rotate" paused />);
    expect(fakes[0].binding.pause).toHaveBeenCalledTimes(1);

    rerender(<Panel source="rotate" paused={false} />);
    expect(fakes[0].binding.play).toHaveBeenCalledTimes(1);
    expect(fakes[0].binding.pause).toHaveBeenCalledTimes(1);
    expect(bindMotion).toHaveBeenCalledTimes(1);
  });

  it('pauses only the loop of a list, and throws nothing for the other motions', () => {
    verbs = { rotate: 'loop', fade: 'appear' };
    const error = vi.spyOn(console, 'error');
    const { rerender } = render(<Panel source={['rotate', 'fade']} paused />);

    rerender(<Panel source={['rotate', 'fade']} paused={false} />);

    expect(fakes[0].binding.pause).toHaveBeenCalledTimes(1);
    expect(fakes[0].binding.play).toHaveBeenCalledTimes(1);
    expect(fakes[1].binding.pause).not.toHaveBeenCalled();
    expect(fakes[1].binding.play).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });

  it('ignores paused on a motion without a loop: nothing is called and nothing throws', () => {
    verb = 'appear';
    const error = vi.spyOn(console, 'error');
    const { rerender } = render(<Panel source="slide" paused />);

    rerender(<Panel source="slide" paused={false} />);

    expect(fakes[0].binding.pause).not.toHaveBeenCalled();
    expect(fakes[0].binding.play).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });
});
