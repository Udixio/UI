import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GestureBinding, GestureRef } from '@udixio/motion';
import { defineGesture, gesture } from '@udixio/motion/gesture';
import {
  useMotionGesture,
  type UseMotionGestureHandlers,
  type UseMotionGestureReturn,
} from '../lib/hooks/useMotionGesture.js';

vi.mock('@udixio/motion/gesture', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@udixio/motion/gesture')>()),
  gesture: vi.fn(),
}));

defineGesture('react-drag', { kind: 'drag', bounds: 'none', alternative: 'arrows' });
defineGesture('react-dismiss', { kind: 'swipe', alternative: 'action' });
const definition = defineGesture('react-definition', { kind: 'drag', alternative: 'arrows' });

/**
 * A stand-in for one bound gesture. Like the core, `reset` and `destroy` are what the hook calls; the offset is read only.
 */
function fakeGesture(name: string) {
  const binding = {
    name,
    kind: 'drag' as const,
    offset: { x: 0, y: 0 },
    velocity: { x: 0, y: 0, source: 'estimated' as const },
    reset: vi.fn(),
    destroy: vi.fn(),
  };
  return { binding };
}

type Fake = ReturnType<typeof fakeGesture>;

const bindGesture = vi.mocked(gesture);
let fakes: Fake[] = [];
let handle: UseMotionGestureReturn<HTMLDivElement>;

beforeEach(() => {
  fakes = [];
  bindGesture.mockReset();
  bindGesture.mockImplementation((_element, source) => {
    const name = typeof source === 'string' ? source : source.name;
    const fake = fakeGesture(name);
    fakes.push(fake);
    return fake.binding as unknown as GestureBinding;
  });
});

function Drag({ source = 'react-drag', handlers }: { source?: GestureRef | string; handlers?: UseMotionGestureHandlers }) {
  const drag = useMotionGesture<HTMLDivElement>(source, handlers);
  handle = drag;
  return <div data-testid="box" ref={drag.ref} />;
}

function Gated({ present = true, source = 'react-drag' }: { present?: boolean; source?: string }) {
  const drag = useMotionGesture<HTMLDivElement>(source);
  handle = drag;
  return present ? <div data-testid="box" ref={drag.ref} /> : null;
}

describe('useMotionGesture', () => {
  it('binds the gesture to the element on mount, by its name, and destroys the binding on unmount', () => {
    const { getByTestId, unmount } = render(<Drag />);

    expect(bindGesture).toHaveBeenCalledTimes(1);
    expect(bindGesture).toHaveBeenCalledWith(getByTestId('box'), 'react-drag');

    unmount();
    expect(fakes[0].binding.destroy).toHaveBeenCalledTimes(1);
  });

  it('binds a gesture definition as it is given', () => {
    const { getByTestId } = render(<Drag source={definition} />);

    expect(bindGesture).toHaveBeenCalledWith(getByTestId('box'), definition);
  });

  it('forwards reset to the binding, and getBinding returns the binding it holds', () => {
    render(<Drag />);

    handle.reset();

    expect(fakes[0].binding.reset).toHaveBeenCalledTimes(1);
    expect(handle.getBinding()).toBe(fakes[0].binding);
  });

  it('reads no binding, ignores reset, and binds nothing before the element is attached', () => {
    render(<Gated present={false} />);

    expect(handle.getBinding()).toBeUndefined();
    expect(() => handle.reset()).not.toThrow();
    expect(bindGesture).not.toHaveBeenCalled();
  });

  it('waits for a gesture defined after the element mounts, then binds it without throwing', () => {
    render(<Drag source="react-later" />);

    expect(bindGesture).not.toHaveBeenCalled();

    defineGesture('react-later', { kind: 'drag', alternative: 'arrows' });

    expect(bindGesture).toHaveBeenCalledTimes(1);
    expect(bindGesture).toHaveBeenCalledWith(expect.any(HTMLElement), expect.objectContaining({ name: 'react-later' }));
  });

  it('calls the handlers with the events the element gets, and none once it is unmounted', () => {
    const onDragEnd = vi.fn();
    const onSwipe = vi.fn();
    const onReorder = vi.fn();
    const { getByTestId, unmount } = render(<Drag handlers={{ onDragEnd, onSwipe, onReorder }} />);
    const el = getByTestId('box');

    const dragEnd = new CustomEvent('motion-dragend', { detail: { x: 40, y: 0 } });
    el.dispatchEvent(dragEnd);
    expect(onDragEnd).toHaveBeenCalledTimes(1);
    expect(onDragEnd.mock.calls[0][0]).toBe(dragEnd);
    expect(onDragEnd.mock.calls[0][0].detail).toEqual({ x: 40, y: 0 });

    const swipe = new CustomEvent('motion-swipe', { detail: { direction: 'end' }, cancelable: true });
    el.dispatchEvent(swipe);
    expect(onSwipe).toHaveBeenCalledTimes(1);
    expect(onSwipe.mock.calls[0][0]).toBe(swipe);

    const reorder = new CustomEvent('motion-reorder', { detail: { from: 0, to: 1 }, cancelable: true });
    el.dispatchEvent(reorder);
    expect(onReorder.mock.calls[0][0]).toBe(reorder);

    unmount();
    el.dispatchEvent(new CustomEvent('motion-dragend', { detail: { x: 1, y: 0 } }));
    expect(onDragEnd).toHaveBeenCalledTimes(1);
  });

  it('lets a swipe handler cancel the swipe by preventing it', () => {
    const { getByTestId } = render(<Drag handlers={{ onSwipe: event => event.preventDefault() }} />);

    const kept = getByTestId('box').dispatchEvent(new CustomEvent('motion-swipe', { detail: { direction: 'start' }, cancelable: true }));

    expect(kept).toBe(false);
  });

  it('calls the latest handler, not the one of the first render', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { getByTestId, rerender } = render(<Drag handlers={{ onDragEnd: first }} />);

    rerender(<Drag handlers={{ onDragEnd: second }} />);
    getByTestId('box').dispatchEvent(new CustomEvent('motion-dragend', { detail: { x: 1, y: 0 } }));

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
    expect(second.mock.calls[0][0].detail).toEqual({ x: 1, y: 0 });
  });

  it('binds the new gesture when the name changes, and destroys the previous one', () => {
    const { rerender } = render(<Drag source="react-drag" />);

    rerender(<Drag source="react-dismiss" />);

    expect(fakes[0].binding.destroy).toHaveBeenCalledTimes(1);
    expect(bindGesture).toHaveBeenLastCalledWith(expect.any(HTMLElement), 'react-dismiss');
  });
});

describe('useMotionGesture with the real gesture binding', () => {
  beforeEach(async () => {
    const actual = await vi.importActual<typeof import('@udixio/motion/gesture')>('@udixio/motion/gesture');
    bindGesture.mockImplementation(actual.gesture);
  });

  it('follows a synthetic pointer drag with the element, and holds the offset of the pointer', () => {
    const { getByTestId } = render(<Drag source="react-drag" />);
    const el = getByTestId('box');

    pointer(el, 'pointerdown', 10);
    pointer(el, 'pointermove', 60);

    expect(handle.getBinding()?.offset).toEqual({ x: 50, y: 0 });
    pointer(el, 'pointerup', 60);
  });
});

/** A pointer event of `type` at `x` on an element. jsdom has no PointerEvent, so a MouseEvent carries the pointer fields. */
function pointer(el: Element, type: 'pointerdown' | 'pointermove' | 'pointerup', x: number): void {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: 0, button: 0 });
  Object.defineProperties(event, { pointerId: { value: 1 }, isPrimary: { value: true } });
  el.dispatchEvent(event);
}
