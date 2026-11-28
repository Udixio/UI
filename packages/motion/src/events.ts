/** The phase of a transition: `enter` when it becomes active, `exit` when it stops. */
export type MotionPhase = 'enter' | 'exit';

/** The detail of `motion-start`: the trigger that played, the phase, and whether the motion is reduced. */
export interface MotionStartDetail {
  readonly trigger: string;
  readonly phase: MotionPhase;
  readonly reduced: boolean;
}

/** The detail of `motion-end`: the detail of its start, and how the motion ended. */
export interface MotionEndDetail extends MotionStartDetail {
  readonly outcome: 'finished' | 'cancelled';
}

/** `motion-start`, dispatched on the element when a transition begins. */
export type MotionStartEvent = CustomEvent<MotionStartDetail>;

/** `motion-end`, dispatched on the element when a transition ends, or is replaced before its end. */
export type MotionEndEvent = CustomEvent<MotionEndDetail>;

declare global {
  interface HTMLElementEventMap {
    'motion-start': MotionStartEvent;
    'motion-end': MotionEndEvent;
  }
  interface SVGElementEventMap {
    'motion-start': MotionStartEvent;
    'motion-end': MotionEndEvent;
  }
}

/**
 * Dispatches `motion-start` on the element. It does not bubble, it is not cancelable, and its detail is passed as it is.
 * @param element - The element that moves.
 * @param detail - The trigger, the phase and whether the motion is reduced.
 */
export function dispatchMotionStart(
  element: Element,
  detail: MotionStartDetail,
): void {
  element.dispatchEvent(
    new CustomEvent<MotionStartDetail>('motion-start', {
      detail,
      bubbles: false,
      composed: false,
      cancelable: false,
    }),
  );
}

/**
 * Dispatches `motion-end` on the element. It does not bubble, it is not cancelable, and its detail is passed as it is.
 * @param element - The element that moved.
 * @param detail - The detail of the start, and the outcome.
 */
export function dispatchMotionEnd(
  element: Element,
  detail: MotionEndDetail,
): void {
  element.dispatchEvent(
    new CustomEvent<MotionEndDetail>('motion-end', {
      detail,
      bubbles: false,
      composed: false,
      cancelable: false,
    }),
  );
}
