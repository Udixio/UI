import { motionDisabled } from './play.js';
import { getMotionRuntime } from './runtime.js';

/** The direction of travel of a navigation. `none` keeps the browser's cross-fade, with the motion duration. */
export type NavigationDirection = 'forward' | 'back' | 'none';

const DIRECTION_ATTRIBUTE = 'data-motion-direction';
/** The latest navigation owns the attribute: a transition that settles after a newer one started leaves it alone. */
let latest = 0;

/**
 * Run `update` (which changes the page) inside a View Transition styled by the motion CSS. Resolves when the update is
 * applied. Under reduced motion, with `--udx-motion: none`, or where the browser has no View Transitions, the update runs
 * alone. An update that throws rejects this promise with its error.
 */
export async function navigate(update: () => void | Promise<void>, options: { direction?: NavigationDirection } = {}): Promise<void> {
  const root = document.documentElement;
  if (typeof document.startViewTransition !== 'function' || getMotionRuntime().policy.reduced || motionDisabled(root)) {
    await update();
    return;
  }
  const direction = options.direction ?? 'forward';
  const token = ++latest;
  const clear = () => {
    if (token === latest) root.removeAttribute(DIRECTION_ATTRIBUTE);
  };
  root.setAttribute(DIRECTION_ATTRIBUTE, direction);
  let transition: ViewTransition;
  try {
    transition = start(update, direction);
  } catch (error) {
    clear();
    throw error;
  }
  // A skipped or failed transition rejects these: nothing awaits them, so nothing must report them.
  transition.ready.catch(() => {});
  transition.finished.then(clear, clear);
  try {
    await transition.updateCallbackDone;
  } catch (error) {
    clear();
    throw error;
  }
}

/** Start the transition with its direction as type; a browser that refuses the options object takes the update alone. */
function start(update: () => void | Promise<void>, direction: NavigationDirection): ViewTransition {
  try {
    return document.startViewTransition({ update, types: [`udx-${direction}`] });
  } catch {
    return document.startViewTransition(update);
  }
}
