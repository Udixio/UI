import { describe, expect, it } from 'vitest';
import {
  dispatchMotionEnd,
  dispatchMotionStart,
  type MotionEndEvent,
  type MotionStartDetail,
} from './events.js';

/** An EventTarget stands in for an element: dispatching needs nothing else. */
function target(): Element {
  return new EventTarget() as unknown as Element;
}

const enter: MotionStartDetail = {
  trigger: 'presence',
  phase: 'enter',
  reduced: false,
};

describe('motion events', () => {
  it('motion-start and motion-end do not bubble and are not cancelable', () => {
    const element = target();
    const seen: Event[] = [];
    element.addEventListener('motion-start', (event) => seen.push(event));
    element.addEventListener('motion-end', (event) => seen.push(event));

    dispatchMotionStart(element, enter);
    dispatchMotionEnd(element, { ...enter, outcome: 'finished' });

    expect(seen.map((event) => event.type)).toEqual([
      'motion-start',
      'motion-end',
    ]);
    for (const event of seen) {
      expect(event.bubbles).toBe(false);
      expect(event.composed).toBe(false);
      expect(event.cancelable).toBe(false);
    }
  });

  it('the detail is passed as is', () => {
    const element = target();
    const ended: MotionEndEvent[] = [];
    element.addEventListener('motion-end', (event) =>
      ended.push(event as MotionEndEvent),
    );
    const detail = { ...enter, outcome: 'cancelled' as const };

    dispatchMotionEnd(element, detail);

    expect(ended).toHaveLength(1);
    expect(ended[0].detail).toBe(detail);
  });
});
