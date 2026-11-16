import {
  animateStyle,
  composeHandles,
  type CurveTiming,
  type MotionHandle,
  type SpringRef,
} from '@udixio/motion/animate';
import { motionPolicy } from '@udixio/motion/policy';

export interface FabLabelControllerOptions {
  /**
   * The label element itself -- not the FAB container. The label's width
   * goes from `0px` to `auto` and back, which CSS cannot transition, so the
   * label is the one element whose size this controller owns. The container's
   * own padding and gap flip between two concrete values and stay plain CSS
   * transitions on the same spring, so the pill still grows as one shape.
   * Scoping the motion to the label alone also leaves the touch target, the
   * state layer and its ripple, and the icon, to their own transitions.
   */
  label: HTMLElement;
  /** Re-read on every `update()` call. */
  extended: () => boolean;
  /** An extra reduced-motion switch, read at each change; the document policy always applies. */
  reducedMotion?: () => boolean;
  /** The motion of the label's width; `spring.default.spatial` by default. Its opacity has its own effects spring. */
  timing?: SpringRef | CurveTiming;
}

export interface FabLabelController {
  /** Re-reads `extended` and animates only if it changed since the last call. */
  update(): void;
  /** Cancels the running change and leaves the label where it is. */
  destroy(): void;
}

/** The label is a flex item that grows or shrinks as a whole: it moves on the spatial spring of its role. */
const DEFAULT_TIMING: SpringRef = 'spring.default.spatial';
/** The label fades on the default effects spring, whatever the width's timing. */
const OPACITY_TIMING: SpringRef = 'spring.default.effects';

/**
 * Reveals or hides a `Fab`'s label when `extended` changes, by animating its
 * width and its opacity on `@udixio/motion`. Both React and Angular adapters
 * use this one controller and only own mount lifecycle wiring plus calling
 * `update()` after an `extended` change.
 *
 * The label stays mounted in both states, and this controller owns its width
 * and opacity from mount onward: the adapters only render the same resting
 * values once, as an inline style, so server-rendered and first-paint markup
 * is already correct before the first call here. Mounting is not a transition
 * between two states the user witnessed, so the resting state is applied
 * instantly.
 */
export function createFabLabelController({
  label,
  extended,
  reducedMotion = () => false,
  timing = DEFAULT_TIMING,
}: FabLabelControllerOptions): FabLabelController {
  let motion: MotionHandle | undefined;
  let lastExtended = extended();

  applyRestingState(label, lastExtended);

  return {
    update() {
      const isExtended = extended();
      if (isExtended === lastExtended) return;
      lastExtended = isExtended;

      if (reducedMotion() || motionPolicy.reduced) {
        motion?.cancel();
        motion = undefined;
        applyRestingState(label, isExtended);
        return;
      }

      // A change that is still running is carried from the width and the
      // opacity the label shows; a fresh one starts from the state it leaves.
      const interrupted = motion !== undefined;
      const handle = composeHandles([
        animateStyle(
          label,
          [
            { width: isExtended ? '0px' : 'auto' },
            { width: isExtended ? 'auto' : '0px' },
          ],
          { timing, carry: interrupted },
        ),
        animateStyle(
          label,
          [{ opacity: isExtended ? 0 : 1 }, { opacity: isExtended ? 1 : 0 }],
          { timing: OPACITY_TIMING, carry: interrupted },
        ),
      ]);
      motion = handle;
      void handle.finished.then(() => {
        if (motion === handle) motion = undefined;
      });
    },
    destroy() {
      motion?.cancel();
      motion = undefined;
    },
  };
}

function applyRestingState(label: HTMLElement, extended: boolean): void {
  label.style.width = extended ? 'auto' : '0px';
  label.style.opacity = extended ? '1' : '0';
}
