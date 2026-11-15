import { afterEach, describe, expect, it } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import { defineGesture, getGesture } from '@udixio/motion/gesture';
import Fixture from './gesture.fixture.svelte';

defineGesture('svelte-drag-real', { kind: 'drag', bounds: 'none', alternative: 'arrows' });

/** A pointer event of `type` at `x` on an element. jsdom has no PointerEvent, so a MouseEvent carries the pointer fields. */
function pointer(el: Element, type: 'pointerdown' | 'pointermove' | 'pointerup', x: number): void {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: 0, button: 0 });
  Object.defineProperties(event, { pointerId: { value: 1 }, isPrimary: { value: true } });
  el.dispatchEvent(event);
}

describe('motionGesture attachment with the real gesture binding', () => {
  afterEach(() => {
    cleanup();
  });

  it('follows a synthetic pointer drag with the element, and holds the offset of the pointer', () => {
    render(Fixture, { props: { source: 'svelte-drag-real' } });
    flushSync();
    const box = screen.getByTestId('box');

    pointer(box, 'pointerdown', 10);
    pointer(box, 'pointermove', 60);

    expect(getGesture(box)?.offset).toEqual({ x: 50, y: 0 });
    pointer(box, 'pointerup', 60);
  });
});
