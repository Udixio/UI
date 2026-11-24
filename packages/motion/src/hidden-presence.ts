import type { MotionElement } from './contract.js';
import { flushLayoutAround } from './layout-loader.js';
import { isHtmlElement } from './svg-fields.js';

/** The inline display held during an exit, with the author's inline value it replaces. */
type Hold = { value: string; priority: string };

/** What takes the presence: a binding of `motion()`, a motion of `motionWhenDefined()`. */
export interface PresenceTaker {
  setPresent(present: boolean): Promise<'finished' | 'cancelled'>;
}

/** The inline display held on each element whose exit plays under `hidden`. */
const holds = new WeakMap<MotionElement, Hold>();

/**
 * Give back the inline display that `setPresentByHidden` holds on an element while its exit plays, or once the exit of an
 * element with no box has ended, if it holds one: the element is then displayed as its `hidden` attribute and its own style
 * say. Call it when the element stops being followed.
 * @param target - The element.
 */
export function releaseHiddenHold(target: MotionElement): void {
  const hold = holds.get(target);
  if (!hold) return;
  holds.delete(target);
  if (hold.value) target.style.setProperty('display', hold.value, hold.priority);
  else target.style.removeProperty('display');
}

/**
 * Show or hide an element that stays in the DOM, through its `hidden` attribute, with the entry and the exit of its motions.
 * This is the rule of `connectMotion()`, which the framework adapters follow for `present` too.
 *
 * - Hiding sets `hidden` (an author's value such as `until-found` is kept) and plays the exit. The element stays displayed,
 *   by its own display held inline, until the exit has finished; it is then `display: none`, out of the flow, and the
 *   layout motions around it are told.
 * - An element with no box (its own display is `contents`: a host declared with no box, whose box plays the motion) ends its
 *   exit with `display: none` held inline in place of its own display, until it is shown again. `hidden` alone cannot hide
 *   it when an author style gives it `display: contents` (inline, or a stylesheet rule that does not yield to `[hidden]`), and
 *   the hold is harmless when it would. For content absent from the server HTML, before any script runs, give such a host
 *   its `display: contents` with a rule that yields to `[hidden]` (`:not([hidden])`), as the Udixio hosts and the wrapper of
 *   React's `<Motion as={Component}>` do.
 * - Showing removes `hidden`, gives back the held display, plays the entry, and tells the layout motions around it.
 *
 * An element with no presence motion is hidden or shown at once. An element absent from the start takes `hidden` alone: bind
 * it with `present: false`, and no exit plays.
 * @param target - The element.
 * @param present - True to show it, false to hide it.
 * @param motions - The motions that take the presence: the presence bindings of `motion()`, or the motions of
 *   `motionWhenDefined()`, which pass it to a presence motion and resolve at once otherwise.
 * @returns `'finished'` once every entry or exit has finished, else `'cancelled'`.
 */
export function setPresentByHidden(
  target: MotionElement,
  present: boolean,
  motions: readonly PresenceTaker[],
): Promise<'finished' | 'cancelled'> {
  releaseHiddenHold(target);
  if (present) {
    target.removeAttribute('hidden');
    const done = settle(motions, true);
    // An element shown again after a finished exit was display: none, out of the flow: its neighbours make room.
    if (isHtmlElement(target)) flushLayoutAround(target);
    return done;
  }
  const attribute = target.getAttribute('hidden') ?? '';
  target.removeAttribute('hidden');
  const natural = getComputedStyle(target).display;
  target.setAttribute('hidden', attribute);
  const hold: Hold = { value: target.style.getPropertyValue('display'), priority: target.style.getPropertyPriority('display') };
  holds.set(target, hold);
  target.style.setProperty('display', natural, 'important');
  return settle(motions, false).then(result => {
    if (result !== 'finished' || holds.get(target) !== hold) return result;
    // An element with no box keeps a hold, of display: none, until it is shown: hidden may not win over its own contents.
    if (natural === 'contents') target.style.setProperty('display', 'none', 'important');
    else releaseHiddenHold(target);
    // The element is display: none from now on. The style change is not seen by the layout observer, so it is announced.
    if (isHtmlElement(target)) flushLayoutAround(target);
    return result;
  });
}

/** The outcome of every motion: one motion's own promise, so that a single exit releases its hold in the same microtask. */
function settle(motions: readonly PresenceTaker[], present: boolean): Promise<'finished' | 'cancelled'> {
  if (motions.length === 1) return motions[0].setPresent(present);
  return Promise.all(motions.map(each => each.setPresent(present))).then(outcomes =>
    outcomes.every(outcome => outcome === 'finished') ? 'finished' : 'cancelled',
  );
}
