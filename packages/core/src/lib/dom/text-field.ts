import {
  animateStyle,
  type CurveTiming,
  type MotionHandle,
  type SpringRef,
} from '@udixio/motion/animate';
import { motionPolicy } from '@udixio/motion/policy';

export interface TextFieldLabelControllerOptions {
  /**
   * The outlined variant's `<legend>` element itself -- not the field's
   * bordered content container. Its width goes from `0px` to `auto` and back,
   * which CSS cannot transition, so the legend is the one element whose size
   * this controller owns. Scoping the motion this narrowly leaves the content
   * container's own transitions (the active indicator's width, the border's
   * width and colour on focus) alone.
   */
  root: HTMLElement;
  /**
   * Whether the notch is open, which is when the floating label sits in it.
   * Read when the controller is created and on every `update()` call.
   */
  notched: () => boolean;
  /** An extra reduced-motion switch, read at each change; the document policy always applies. */
  reducedMotion?: () => boolean;
  /** The motion of the notch's width; `spring.fast.effects` by default, which is critically damped, so the notch never overshoots the outline. */
  timing?: SpringRef | CurveTiming;
}

export interface TextFieldLabelController {
  /** Re-reads `notched` and animates only if it changed since the last call. */
  update(): void;
  /** Cancels the running change and leaves the notch where it is. */
  destroy(): void;
}

/** The notch is a thin outline gap, so it moves on the fast effects spring of its role. */
const DEFAULT_TIMING: SpringRef = 'spring.fast.effects';

/**
 * Animates the outlined variant's legend notch between its collapsed
 * (`width: 0`) and content-sized (`width: auto`) states on `@udixio/motion`.
 * Both React and Angular adapters use this one controller, scoped to the
 * `<legend>` alone (see `root`), and only own mount lifecycle wiring and
 * calling `update()` after a floating-state change.
 *
 * The notch's resting width is set by the adapters' class names, so the
 * controller cannot read the state it leaves from the DOM once a change has
 * been rendered. It is told the target state instead, and starts from the
 * opposite one.
 */
export function createTextFieldLabelController({
  root,
  notched,
  reducedMotion = () => false,
  timing = DEFAULT_TIMING,
}: TextFieldLabelControllerOptions): TextFieldLabelController {
  let motion: MotionHandle | undefined;
  let lastNotched = notched();

  return {
    update() {
      const isNotched = notched();
      if (isNotched === lastNotched) return;
      lastNotched = isNotched;

      if (reducedMotion() || motionPolicy.reduced) {
        motion?.cancel();
        motion = undefined;
        // An open notch takes the width its class gives it; a closed one is pinned at zero.
        root.style.width = isNotched ? '' : '0px';
        return;
      }

      // A change that is still running is carried from the width the notch
      // shows; a fresh one starts from the state it leaves.
      const interrupted = motion !== undefined;
      const handle = animateStyle(
        root,
        [
          { width: isNotched ? '0px' : 'auto' },
          { width: isNotched ? 'auto' : '0px' },
        ],
        { timing, carry: interrupted },
      );
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
