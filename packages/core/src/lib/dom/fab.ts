import { cubicBezier } from 'animejs';
import { FAB_MOTION_DURATION_MS, FAB_MOTION_EASING } from '../fab-motion.js';
import {
  createAutoLayoutController,
  type AutoLayoutController,
} from './auto-layout.js';

/**
 * The easing Motion applies to a tween by default, which is what this
 * transition used before it moved to Anime.js. Anime's own `outCubic` starts
 * far more abruptly -- three quarters of the travel in the first third of the
 * duration -- and reads as a snap rather than a reveal.
 */
const FAB_LABEL_EASE = cubicBezier(...FAB_MOTION_EASING);

export interface FabLabelControllerOptions {
  /**
   * The label element itself -- not the FAB container. `width: auto` cannot
   * be CSS-transitioned, which is the one genuine layout-diffing problem
   * here; the container's own padding and gap flip between two concrete
   * values, so they stay plain CSS transitions of the same duration and
   * easing, and the pill still grows as one shape. Scoping the Layout root to
   * the label alone also keeps Anime.js from re-measuring the touch target,
   * the state layer and its ripple, and the icon, which run transitions of
   * their own.
   */
  label: HTMLElement;
  /** Re-read on every `update()` call. */
  extended: () => boolean;
  reducedMotion?: () => boolean;
  /** Transition duration, in milliseconds. */
  duration?: number;
}

export type FabLabelController = AutoLayoutController;

/**
 * Reveals or hides a `Fab`'s label when `extended` changes, by handing both
 * its width and its opacity to Anime.js's Layout (Auto Layout) engine.
 *
 * Using Layout here is the same accepted per-component exception to the
 * Motion controller convention as `createTextFieldLabelController` (see
 * `docs/component-behavior.md`), for the same reason: `width: auto` is not
 * CSS-transitionable and Motion's free tier has no before/after layout
 * diffing (`animateLayout` is a paid Motion+ feature). Both React and Angular
 * adapters use this one controller and only own mount lifecycle wiring plus
 * calling `update()` after an `extended` change.
 *
 * The fade goes through Layout rather than through a tween or a CSS
 * transition of its own because `opacity` is one of the properties Layout
 * always records, animates and *restores* (`layout.js`, `AutoLayout.properties`
 * -- there is no way to opt a property out of that set). Anything else
 * animating opacity is therefore reset to Layout's recorded value the moment
 * the diff completes: the text would fade and then snap back to fully opaque.
 * Setting the target inside the change below instead makes that recorded
 * value the target, so Layout carries the fade over the same duration and
 * easing as the width.
 *
 * The label stays mounted in both states, and this controller owns its width
 * and opacity -- the adapters only render the same resting values once, as an
 * inline style, so server-rendered and first-paint markup is already correct
 * before the first call here. Ownership has to sit in this callback because
 * the change is what Layout diffs: it must happen between the controller's
 * own `record()` and `animate()`, which is also what makes an interrupted
 * toggle recoverable (see `createAutoLayoutController`).
 */
export function createFabLabelController({
  label,
  extended,
  reducedMotion,
  duration = FAB_MOTION_DURATION_MS,
}: FabLabelControllerOptions): FabLabelController {
  const layout = createAutoLayoutController({
    root: label,
    reducedMotion,
    duration,
    ease: FAB_LABEL_EASE,
  });
  let lastExtended = extended();

  // The resting state is established instantly: mounting is not a transition
  // between two states the user witnessed, so there is nothing to animate
  // from.
  applyRestingState(label, lastExtended);

  return {
    update() {
      const isExtended = extended();
      if (isExtended === lastExtended) return;
      lastExtended = isExtended;

      layout.update(() => applyRestingState(label, isExtended));
    },
    destroy() {
      layout.destroy();
    },
  };
}

function applyRestingState(label: HTMLElement, extended: boolean): void {
  label.style.width = extended ? 'auto' : '0px';
  label.style.opacity = extended ? '1' : '0';
}
