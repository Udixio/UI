import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import type { GestureBinding } from '@udixio/motion';
import { gesturesModule } from '@udixio/motion';
import { defineGesture } from '@udixio/motion/gesture';
import Fixture from './gesture.fixture.svelte';


defineGesture('svelte-drag', { type: 'drag', bounds: 'none', alternative: 'arrows' });
defineGesture('svelte-dismiss', { type: 'swipe', alternative: 'action' });

/** A stand-in for one bound gesture: `reset` and `destroy` are what the attachment calls. */
function fakeGesture(name: string) {
  const binding = {
    name,
    type: 'drag' as const,
    offset: { x: 0, y: 0 },
    velocity: { x: 0, y: 0, source: 'estimated' as const },
    reset: vi.fn(),
    destroy: vi.fn(),
  };
  return { binding };
}

type Fake = ReturnType<typeof fakeGesture>;

const bindGesture = vi.spyOn(gesturesModule()!, 'gesture');
let fakes: Fake[] = [];

beforeEach(() => {
  fakes = [];
  bindGesture.mockReset();
  bindGesture.mockImplementation((_element, source) => {
    const fake = fakeGesture(typeof source === 'string' ? source : source.name);
    fakes.push(fake);
    return fake.binding as unknown as GestureBinding;
  });
});

afterEach(() => {
  cleanup();
});

const props = (overrides: Record<string, unknown> = {}) => ({
  source: 'svelte-drag',
  shown: true,
  ...overrides,
});

/** A pointer-free event of `type` on the box, with its detail. */
const emit = (type: string, detail: unknown, cancelable = false) =>
  screen.getByTestId('box').dispatchEvent(new CustomEvent(type, { detail, cancelable, bubbles: true }));

describe('motionGesture attachment', () => {
  it('binds the gesture to the element by its name on mount, and destroys the binding on unmount', async () => {
    const { rerender } = render(Fixture, { props: props() });
    flushSync();

    expect(bindGesture).toHaveBeenCalledExactlyOnceWith(screen.getByTestId('box'), 'svelte-drag');

    await rerender(props({ shown: false }));
    flushSync();

    expect(fakes[0].binding.destroy).toHaveBeenCalledOnce();
  });

  it('forwards each gesture event to its handler, with the event itself', () => {
    const onDragEnd = vi.fn();
    const onSwipe = vi.fn();
    const onReorder = vi.fn();
    render(Fixture, { props: props({ onDragEnd, onSwipe, onReorder }) });
    flushSync();

    emit('motion-dragend', { x: 12, y: 0 });
    emit('motion-swipe', { direction: 'end' }, true);
    emit('motion-reorder', { from: 0, to: 1 }, true);

    expect(onDragEnd.mock.calls[0][0].detail).toEqual({ x: 12, y: 0 });
    expect(onSwipe.mock.calls[0][0].type).toBe('motion-swipe');
    expect(onReorder.mock.calls[0][0].detail).toEqual({ from: 0, to: 1 });
  });

  it('lets a swipe handler prevent the swipe', () => {
    render(Fixture, { props: props({ onSwipe: (event: Event) => event.preventDefault() }) });
    flushSync();

    expect(emit('motion-swipe', { direction: 'start' }, true)).toBe(false);
  });

  it('reads the handler when an event arrives, so a new handler receives the next events', async () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = render(Fixture, { props: props({ onDragEnd: first }) });
    flushSync();

    await rerender(props({ onDragEnd: second }));
    flushSync();
    emit('motion-dragend', { x: 3, y: 0 });

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();
    expect(bindGesture).toHaveBeenCalledOnce();
  });

  it('stops forwarding and destroys the binding once the element is removed', async () => {
    const onDragEnd = vi.fn();
    const { rerender } = render(Fixture, { props: props({ onDragEnd }) });
    flushSync();
    const box = screen.getByTestId('box');

    await rerender(props({ onDragEnd, shown: false }));
    flushSync();
    box.dispatchEvent(new CustomEvent('motion-dragend', { detail: { x: 9, y: 0 } }));

    expect(onDragEnd).not.toHaveBeenCalled();
    expect(fakes[0].binding.destroy).toHaveBeenCalledOnce();
  });

  it('waits for a gesture defined after the element is rendered, then binds it', () => {
    render(Fixture, { props: props({ source: 'svelte-later' }) });
    flushSync();

    expect(bindGesture).not.toHaveBeenCalled();

    defineGesture('svelte-later', { type: 'drag', alternative: 'arrows' });

    expect(bindGesture).toHaveBeenCalledWith(screen.getByTestId('box'), expect.objectContaining({ name: 'svelte-later' }));
  });
});
