import { act, createRef, StrictMode, useState } from 'react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  gesturesModule,
  kindOf,
  motionWhenDefined,
  type DeferredMotion,
  type GestureBinding,
  type MotionBinding,
} from '@udixio/motion';
import { defineGesture } from '@udixio/motion/gesture';
import { Motion, Presence } from '../lib/index.js';

vi.mock('@udixio/motion', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@udixio/motion')>()),
  motionWhenDefined: vi.fn(),
}));

defineGesture('motion-drag', { kind: 'drag', bounds: 'none', alternative: 'arrows' });

type Outcome = 'finished' | 'cancelled';
type Verb = MotionBinding['verb'];

/**
 * A stand-in for one bound motion, as the core binds it: `setPresent` refuses an emphasis, an exit waits until the test
 * settles it, and an entry cancels the exit in progress. The element is kept, so a test finds the motion of an element.
 */
function fakeMotion(verb: Verb, element: Element) {
  let exits: Array<(outcome: Outcome) => void> = [];
  const binding = {
    verb,
    kind: kindOf(verb),
    present: true,
    handle: null,
    setPresent: vi.fn((present: boolean) => {
      if (verb === 'emphasize') throw new TypeError('setPresent does not apply to an emphasis');
      if (present) {
        const pending = exits;
        exits = [];
        pending.forEach((settle) => settle('cancelled'));
        return Promise.resolve<Outcome>('finished');
      }
      return new Promise<Outcome>((resolve) => exits.push(resolve));
    }),
    play: vi.fn(),
    pause: vi.fn(),
    destroy: vi.fn(),
  };
  // As the core's deferred motion: the presence goes to a presence motion, and nothing else waits for an exit.
  const deferred = {
    binding,
    setPresent: vi.fn((present: boolean) =>
      binding.kind === 'presence' ? binding.setPresent(present) : Promise.resolve<Outcome>('finished'),
    ),
    play: vi.fn(),
    destroy: vi.fn(),
  };
  return {
    element,
    deferred,
    binding,
    /** Settles the oldest pending exit, as the animation would. */
    settleExit: (outcome: Outcome = 'finished') => exits.shift()?.(outcome),
  };
}

type FakeMotion = ReturnType<typeof fakeMotion>;

const bindMotion = vi.mocked(motionWhenDefined);
const gestureApi = gesturesModule();
if (!gestureApi) throw new Error('The gestures module is not loaded');
const bindGesture = vi.spyOn(gestureApi, 'gesture');
let verbOf: (source: unknown) => Verb = () => 'appear';
let fakes: FakeMotion[] = [];
let gestures: Array<{ element: Element; binding: { name: string; reset: () => void; destroy: () => void } }> = [];

beforeEach(() => {
  verbOf = (source) => (source === 'reflow' ? 'layout' : 'appear');
  fakes = [];
  gestures = [];
  bindMotion.mockReset();
  bindMotion.mockImplementation((element, source) => {
    const fake = fakeMotion(verbOf(source), element);
    fakes.push(fake);
    return fake.deferred as unknown as DeferredMotion;
  });
  bindGesture.mockReset();
  bindGesture.mockImplementation((element, source) => {
    const name = typeof source === 'string' ? source : source.name;
    const binding = { name, reset: vi.fn(), destroy: vi.fn() };
    gestures.push({ element, binding });
    return binding as unknown as GestureBinding;
  });
});

/** The latest motion bound to the element of a test id. */
function fakeOf(testId: string): FakeMotion {
  const found = fakes.filter((fake) => (fake.element as HTMLElement).dataset.testid === testId);
  const latest = found.at(-1);
  if (!latest) throw new Error(`no motion bound to ${testId}`);
  return latest;
}

describe('Motion', () => {
  it('renders the element it is given as, with the props and the children it is given', () => {
    const { getByTestId } = render(
      <ul>
        <Motion as="li" name="fade" className="row" data-testid="row" aria-label="Row">
          Content
        </Motion>
      </ul>,
    );

    const row = getByTestId('row');
    expect(row.tagName).toBe('LI');
    expect(row.className).toBe('row');
    expect(row.getAttribute('aria-label')).toBe('Row');
    expect(row.textContent).toBe('Content');
  });

  it('renders a div when no element is given', () => {
    const { getByTestId } = render(<Motion name="fade" data-testid="box" />);

    expect(getByTestId('box').tagName).toBe('DIV');
  });

  it('binds its motion to the element it renders: a present element with no entry', () => {
    const { getByTestId } = render(<Motion as="li" name="fade" data-testid="row" />);

    expect(bindMotion).toHaveBeenCalledTimes(1);
    expect(bindMotion).toHaveBeenCalledWith(getByTestId('row'), 'fade', { present: true, settled: false, development: true });
  });

  it('binds each name of a list, and the names separated by spaces, to the element', () => {
    render(<Motion name={['fade', 'reflow']} data-testid="row" />);
    render(<Motion name="fade reflow" data-testid="other" />);

    expect(bindMotion).toHaveBeenCalledTimes(4);
    expect(bindMotion.mock.calls.map((call) => call[1])).toEqual(['fade', 'reflow', 'fade', 'reflow']);
  });

  it('binds its gesture to the same element as its motion, with no ref to merge', () => {
    render(<Motion as="li" name="reflow" gesture="motion-drag" data-testid="row" />);

    expect(bindMotion).toHaveBeenCalledTimes(1);
    expect(bindGesture).toHaveBeenCalledTimes(1);
    expect(bindGesture.mock.calls[0][0]).toBe(bindMotion.mock.calls[0][0]);
    expect(bindGesture.mock.calls[0][1]).toBe('motion-drag');
  });

  it('gives each gesture event to the handler its prop names', () => {
    const onMotionDragEnd = vi.fn();
    const onMotionSwipe = vi.fn();
    const onMotionReorder = vi.fn();
    const { getByTestId } = render(
      <Motion
        as="li"
        name="reflow"
        gesture="motion-drag"
        onMotionDragEnd={onMotionDragEnd}
        onMotionSwipe={onMotionSwipe}
        onMotionReorder={onMotionReorder}
        data-testid="row"
      />,
    );
    const row = getByTestId('row');

    row.dispatchEvent(new CustomEvent('motion-dragend', { detail: { x: 4, y: 0 } }));
    row.dispatchEvent(new CustomEvent('motion-swipe', { detail: { direction: 'end' } }));
    row.dispatchEvent(new CustomEvent('motion-reorder', { detail: { from: 0, to: 1 }, cancelable: true }));

    expect(onMotionDragEnd).toHaveBeenCalledTimes(1);
    expect(onMotionDragEnd.mock.calls[0][0].detail).toEqual({ x: 4, y: 0 });
    expect(onMotionSwipe).toHaveBeenCalledTimes(1);
    expect(onMotionReorder).toHaveBeenCalledTimes(1);
  });

  it('gives an element its gesture alone, with an empty list of motions: nothing is bound but the gesture', () => {
    const onMotionSwipe = vi.fn();
    const { getByTestId } = render(
      <Motion name={[]} gesture="motion-drag" onMotionSwipe={onMotionSwipe} data-testid="card">
        Card
      </Motion>,
    );

    expect(getByTestId('card').textContent).toBe('Card');
    expect(bindMotion).not.toHaveBeenCalled();
    expect(bindGesture).toHaveBeenCalledWith(getByTestId('card'), 'motion-drag');
    getByTestId('card').dispatchEvent(new CustomEvent('motion-swipe', { detail: { direction: 'end' } }));
    expect(onMotionSwipe).toHaveBeenCalledTimes(1);
  });

  it('takes no name for an element that holds only a gesture, and binds no motion', () => {
    const onMotionSwipe = vi.fn();
    const { getByTestId } = render(
      <Motion gesture="motion-drag" onMotionSwipe={onMotionSwipe} data-testid="card">
        Card
      </Motion>,
    );

    expect(getByTestId('card').textContent).toBe('Card');
    expect(bindMotion).not.toHaveBeenCalled();
    expect(bindGesture).toHaveBeenCalledWith(getByTestId('card'), 'motion-drag');
    getByTestId('card').dispatchEvent(new CustomEvent('motion-swipe', { detail: { direction: 'end' } }));
    expect(onMotionSwipe).toHaveBeenCalledTimes(1);
  });

  it('renders an element with neither a name nor a gesture, as the plain element it is given as', () => {
    const { getByTestId } = render(
      <Motion as="p" data-testid="plain">
        Text
      </Motion>,
    );

    expect(getByTestId('plain').tagName).toBe('P');
    expect(bindMotion).not.toHaveBeenCalled();
    expect(bindGesture).not.toHaveBeenCalled();
  });

  it('forwards a ref object and a callback ref to the element, and binds once when the callback changes', () => {
    const object = createRef<HTMLDivElement>();
    const seen: HTMLElement[] = [];
    function Host() {
      const [count, setCount] = useState(0);
      return (
        <>
          <button type="button" onClick={() => setCount(count + 1)}>
            {count}
          </button>
          <Motion name="fade" ref={object} data-testid="box">
            {/* A callback that is new on each render. */}
            <span ref={(node) => { if (node) seen.push(node); }} />
          </Motion>
          <Motion name="fade" data-testid="other" ref={(node) => { if (node) seen.push(node); }} />
        </>
      );
    }
    const { getByRole, getByTestId } = render(<Host />);

    act(() => getByRole('button').click());
    act(() => getByRole('button').click());

    expect(object.current).toBe(getByTestId('box'));
    expect(seen).toContain(getByTestId('other'));
    expect(bindMotion).toHaveBeenCalledTimes(2);
  });

  it('keeps the element in the DOM when present turns false: displayed while its exit plays, then hidden', async () => {
    const { getByTestId, rerender } = render(<Motion name="fade" present data-testid="box" />);
    const box = getByTestId('box');

    rerender(<Motion name="fade" present={false} data-testid="box" />);
    expect(fakeOf('box').binding.setPresent).toHaveBeenLastCalledWith(false);
    expect(box.hidden).toBe(true);
    expect(box.style.getPropertyPriority('display')).toBe('important');

    await act(async () => fakeOf('box').settleExit('finished'));
    expect(getByTestId('box')).toBe(box);
    expect(box.hidden).toBe(true);
    expect(box.style.display).toBe('');
  });

  it('shows a hidden element again with its entry when present turns true, without binding it again', async () => {
    const { getByTestId, rerender } = render(<Motion name="fade" present={false} data-testid="box" />);
    const box = getByTestId('box');
    expect(box.hidden).toBe(true);
    expect(bindMotion).toHaveBeenLastCalledWith(box, 'fade', expect.objectContaining({ present: false }));

    rerender(<Motion name="fade" present data-testid="box" />);
    expect(box.hidden).toBe(false);
    expect(fakeOf('box').binding.setPresent).toHaveBeenLastCalledWith(true);
    expect(bindMotion).toHaveBeenCalledTimes(1);
  });

  it('renders hidden, with its content, an element absent from the start', () => {
    const { getByTestId } = render(
      <Motion as="nav" name="fade" present={false} data-testid="menu">
        <a href="/docs">Docs</a>
      </Motion>,
    );

    expect(getByTestId('menu').hidden).toBe(true);
    expect(getByTestId('menu').querySelector('a')?.getAttribute('href')).toBe('/docs');
  });

  it('leaves hidden to the author when present is not given', () => {
    const { getByTestId } = render(<Motion name="fade" hidden data-testid="box" />);

    expect(getByTestId('box').hidden).toBe(true);
  });

  it('passes restoreFocus to the motion it binds', () => {
    const back = document.createElement('button');
    render(<Motion name="fade" restoreFocus={back} />);

    expect(bindMotion).toHaveBeenCalledWith(expect.any(HTMLElement), 'fade', expect.objectContaining({ restoreFocus: back }));
  });

  it('replays nothing on hydration: the server markup is in place, and its motion is settled', async () => {
    const errors: unknown[] = [];
    const markup = renderToString(<Motion as="p" name="fade" data-testid="note">Saved</Motion>);
    const container = document.createElement('div');
    container.innerHTML = markup;
    document.body.append(container);
    let root: Root | undefined;
    try {
      await act(async () => {
        root = hydrateRoot(container, <Motion as="p" name="fade" data-testid="note">Saved</Motion>, {
          onRecoverableError: (error) => errors.push(error),
        });
      });

      expect(bindMotion).toHaveBeenLastCalledWith(expect.any(HTMLElement), 'fade', { present: true, settled: true, development: true });
      expect(errors).toEqual([]);
    } finally {
      await act(async () => root?.unmount());
      container.remove();
    }
  });
});

const TEXT: Record<string, string> = { a: 'Alpha', b: 'Beta', c: 'Gamma', d: 'Delta', x: 'Xi', y: 'Upsilon', z: 'Zeta' };

/** A list of motions in a Presence: each child is a presence, keyed by its id. */
function Items({ ids }: { ids: readonly string[] }) {
  return (
    <ul>
      <Presence>
        {ids.map((id) => (
          <Motion key={id} as="li" name="fade" data-testid={id}>
            {TEXT[id]}
          </Motion>
        ))}
      </Presence>
    </ul>
  );
}

/** The ids of the list items, in the order they are in the DOM. */
function order(container: HTMLElement): string[] {
  return [...container.querySelectorAll('li')].map((item) => item.dataset.testid ?? '');
}

describe('Presence', () => {
  it('keeps a removed child rendered until its exit has played, then removes it', async () => {
    const { container, rerender } = render(<Items ids={['a', 'b', 'c']} />);

    rerender(<Items ids={['a', 'c']} />);

    expect(fakeOf('b').binding.setPresent).toHaveBeenLastCalledWith(false);
    expect(order(container)).toEqual(['a', 'b', 'c']);
    expect(container.querySelector('[data-testid="b"]')?.textContent).toBe('Beta');

    await act(async () => fakeOf('b').settleExit('finished'));
    expect(order(container)).toEqual(['a', 'c']);
  });

  it('keeps a removed child in its place among the children that remain', async () => {
    const { container, rerender } = render(<Items ids={['a', 'b', 'c']} />);

    rerender(<Items ids={['c']} />);
    expect(order(container)).toEqual(['a', 'b', 'c']);

    await act(async () => fakeOf('a').settleExit('finished'));
    await act(async () => fakeOf('b').settleExit('finished'));
    expect(order(container)).toEqual(['c']);
  });

  it('keeps a removed first child first, and a run of removed children in their order', async () => {
    const { container, rerender } = render(<Items ids={['a', 'b', 'c', 'd']} />);

    rerender(<Items ids={['d']} />);

    expect(order(container)).toEqual(['a', 'b', 'c', 'd']);
    for (const id of ['a', 'b', 'c']) await act(async () => fakeOf(id).settleExit('finished'));
    expect(order(container)).toEqual(['d']);
  });

  it('places a child added with a removed one in the order of the children, and the removed one after its neighbour', () => {
    const { container, rerender } = render(<Items ids={['a', 'b', 'c']} />);

    rerender(<Items ids={['x', 'a', 'c']} />);

    expect(order(container)).toEqual(['x', 'a', 'b', 'c']);
  });

  it('enters every child added in one render, in that render', () => {
    const { rerender } = render(<Items ids={['a']} />);
    const bound = bindMotion.mock.calls.length;

    rerender(<Items ids={['a', 'x', 'y', 'z']} />);

    const added = bindMotion.mock.calls.slice(bound);
    expect(added.map((call) => call[1])).toEqual(['fade', 'fade', 'fade']);
    for (const call of added) expect(call[2]).toEqual({ present: true, settled: false, development: true });
  });

  it('binds a child once: a render with the same children binds nothing again', () => {
    const { rerender } = render(<Items ids={['a', 'b']} />);
    const bound = bindMotion.mock.calls.length;

    rerender(<Items ids={['a', 'b']} />);

    expect(bindMotion.mock.calls.length).toBe(bound);
  });

  it('keeps a single conditional child: it enters, exits, and enters again', async () => {
    function Panel({ open }: { open: boolean }) {
      return (
        <Presence>
          {open && (
            <Motion key="panel" name="fade" data-testid="panel">
              Panel
            </Motion>
          )}
        </Presence>
      );
    }
    const { container, queryByTestId, rerender } = render(<Panel open />);
    expect(queryByTestId('panel')).not.toBeNull();

    rerender(<Panel open={false} />);
    expect(queryByTestId('panel')).not.toBeNull();
    expect(fakeOf('panel').binding.setPresent).toHaveBeenLastCalledWith(false);
    await act(async () => fakeOf('panel').settleExit('finished'));
    expect(queryByTestId('panel')).toBeNull();

    rerender(<Panel open />);
    expect(container.querySelector('[data-testid="panel"]')?.textContent).toBe('Panel');
    expect(bindMotion).toHaveBeenLastCalledWith(expect.any(HTMLElement), 'fade', { present: true, settled: false, development: true });
  });

  it('keeps a child that comes back before its exit has played, and cancels the exit', async () => {
    const { container, rerender } = render(<Items ids={['a', 'b', 'c']} />);
    rerender(<Items ids={['a', 'c']} />);
    const bound = bindMotion.mock.calls.length;

    rerender(<Items ids={['a', 'b', 'c']} />);

    expect(fakeOf('b').binding.setPresent).toHaveBeenLastCalledWith(true);
    expect(bindMotion.mock.calls.length).toBe(bound);
    expect(order(container)).toEqual(['a', 'b', 'c']);
    await act(async () => {
      await Promise.resolve();
    });
    expect(order(container)).toEqual(['a', 'b', 'c']);
  });

  it('removes a child with no motion in it at once, since it has no exit to wait for', () => {
    function Plain({ ids }: { ids: readonly string[] }) {
      return (
        <ul>
          <Presence>
            {ids.map((id) => (
              <li key={id} data-testid={id}>
                {id}
              </li>
            ))}
          </Presence>
        </ul>
      );
    }
    const { container, rerender } = render(<Plain ids={['a', 'b', 'c']} />);

    rerender(<Plain ids={['a', 'c']} />);

    expect(order(container)).toEqual(['a', 'c']);
  });

  it('removes a child that holds two presences once both exits have played', async () => {
    function Card({ show }: { show: boolean }) {
      return (
        <Presence>
          {show && (
            <Motion key="card" as="div" name="fade" data-testid="card">
              <Motion as="span" name="fade" data-testid="inner">
                Inner
              </Motion>
            </Motion>
          )}
        </Presence>
      );
    }
    const { queryByTestId, rerender } = render(<Card show />);

    rerender(<Card show={false} />);
    await act(async () => fakeOf('inner').settleExit('finished'));
    expect(queryByTestId('card')).not.toBeNull();

    await act(async () => fakeOf('card').settleExit('finished'));
    expect(queryByTestId('card')).toBeNull();
  });

  it('lets a present prop on a child hide it in place, and removes it once the child leaves', async () => {
    function Toggle({ visible, listed = true }: { visible: boolean; listed?: boolean }) {
      return (
        <Presence>
          {listed && (
            <Motion key="a" name="fade" present={visible} data-testid="a">
              Alpha
            </Motion>
          )}
        </Presence>
      );
    }
    const { queryByTestId, rerender } = render(<Toggle visible />);

    rerender(<Toggle visible={false} />);
    expect(fakeOf('a').binding.setPresent).toHaveBeenLastCalledWith(false);
    await act(async () => fakeOf('a').settleExit('finished'));
    expect(queryByTestId('a')?.hidden).toBe(true);

    rerender(<Toggle visible />);
    expect(fakeOf('a').binding.setPresent).toHaveBeenLastCalledWith(true);
    expect(queryByTestId('a')?.hidden).toBe(false);

    rerender(<Toggle visible listed={false} />);
    await act(async () => fakeOf('a').settleExit('finished'));
    expect(queryByTestId('a')).toBeNull();
  });

  it('warns in development about a child without a key, and still renders it', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const { getByTestId } = render(
      <ul>
        <Presence>
          <Motion as="li" name="fade" data-testid="keyless">
            Keyless
          </Motion>
        </Presence>
      </ul>,
    );

    expect(getByTestId('keyless').textContent).toBe('Keyless');
    expect(error).toHaveBeenCalledWith(expect.stringContaining('needs a key'));
    error.mockRestore();
  });

  it('works in StrictMode: a removed child still plays its exit once, then leaves', async () => {
    const { container, rerender } = render(
      <StrictMode>
        <Items ids={['a', 'b']} />
      </StrictMode>,
    );

    rerender(
      <StrictMode>
        <Items ids={['a']} />
      </StrictMode>,
    );
    expect(order(container)).toEqual(['a', 'b']);
    await act(async () => fakeOf('b').settleExit('finished'));
    expect(order(container)).toEqual(['a']);
  });

  it('shows the current children on hydration and replays no entry', async () => {
    const markup = renderToString(<Items ids={['a', 'b']} />);
    const container = document.createElement('div');
    container.innerHTML = markup;
    document.body.append(container);
    let root: Root | undefined;
    try {
      await act(async () => {
        root = hydrateRoot(container, <Items ids={['a', 'b']} />);
      });

      expect(bindMotion).toHaveBeenCalledTimes(2);
      for (const call of bindMotion.mock.calls) expect(call[2]).toEqual({ present: true, settled: true, development: true });
      expect(order(container)).toEqual(['a', 'b']);
    } finally {
      await act(async () => root?.unmount());
      container.remove();
    }
  });
});
