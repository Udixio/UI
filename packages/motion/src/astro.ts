import { motionDisabled } from './play.js';
import { getMotionRuntime } from './runtime.js';

const DIRECTION_ATTRIBUTE = 'data-motion-direction';

/** The fields of Astro's transition events that the adapter reads. Astro's events are plain DOM events: no Astro type is imported. */
type AstroEvent = Event & {
  direction?: unknown;
  newDocument?: Document;
  viewTransition?: { finished?: Promise<unknown> };
};

/**
 * Give Astro's ClientRouter transitions the motion direction and styles. Astro starts the View Transition itself, so this
 * adapter starts none: it sets the direction the motion CSS reads, on the page and on the document that Astro swaps in.
 * Under reduced motion or `--udx-motion: none` it does nothing. Returns a function that disconnects.
 */
export function connectAstroTransitions(): () => void {
  /** The direction of the navigation being swapped in, or null: set when the navigation is prepared, read when it swaps. */
  let prepared: string | null = null;
  let latest = 0;

  const onBeforePreparation = (event: Event) => {
    if (getMotionRuntime().policy.reduced || motionDisabled(document.documentElement)) {
      prepared = null;
      return;
    }
    prepared = (event as AstroEvent).direction === 'back' ? 'back' : 'forward';
    document.documentElement.setAttribute(DIRECTION_ATTRIBUTE, prepared);
  };

  const onBeforeSwap = (event: Event) => {
    const { newDocument, viewTransition } = event as AstroEvent;
    const direction = prepared;
    prepared = null;
    if (direction === null) return;
    // Astro replaces the attributes of <html> with those of the new document: the direction must travel with them.
    newDocument?.documentElement.setAttribute(DIRECTION_ATTRIBUTE, direction);
    // The direction stays until the transition of this swap has finished, unless a newer swap has taken over.
    const token = ++latest;
    const clear = () => {
      if (token === latest) document.documentElement.removeAttribute(DIRECTION_ATTRIBUTE);
    };
    Promise.resolve(viewTransition?.finished).then(clear, clear);
  };

  document.addEventListener('astro:before-preparation', onBeforePreparation);
  document.addEventListener('astro:before-swap', onBeforeSwap);
  return () => {
    document.removeEventListener('astro:before-preparation', onBeforePreparation);
    document.removeEventListener('astro:before-swap', onBeforeSwap);
  };
}
