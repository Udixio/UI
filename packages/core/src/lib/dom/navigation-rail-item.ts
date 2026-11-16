import {
  animateStyle,
  composeHandles,
  type CurveTiming,
  type MotionHandle,
  type SpringRef,
} from '@udixio/motion/animate';
import { motionPolicy } from '@udixio/motion/policy';
import { collapseTimingOf } from './component-motion.js';

export type NavigationRailItemLabelAxis = 'horizontal' | 'vertical';

export interface NavigationRailItemLabelControllerOptions {
  label: HTMLElement;
  axis: () => NavigationRailItemLabelAxis;
  visible: () => boolean;
  /** An extra reduced-motion switch, read at each change; the document policy always applies. */
  reducedMotion?: () => boolean;
  /**
   * The motion of the label's width or height when it shows; `spring.default.spatial` by default. It hides on the effects spring
   * of the same speed, and its opacity has its own curve.
   */
  timing?: SpringRef | CurveTiming;
}

export interface NavigationRailItemLabelController {
  /** Re-reads `axis`/`visible` and animates only if either changed. */
  update(): void;
  destroy(): void;
}

/** The label is a container that grows as a whole: it shows on the spatial spring of its role. */
const DEFAULT_TIMING: SpringRef = 'spring.default.spatial';
/** The label fades on the short3 curve, and waits for its size to start when it appears. */
const FADE_TIMING: CurveTiming = {
  duration: 'duration.short3',
  easing: 'easing.standard',
};
const FADE_IN_DELAY = 150;

/**
 * Reveals or hides a `NavigationRailItem` label by animating its width
 * (horizontal variant) or height (vertical variant) together with its
 * opacity, on `@udixio/motion`. Both React and Angular adapters use this
 * controller and only own mount lifecycle wiring; the label element itself is
 * always present in the DOM so neither adapter needs to coordinate an
 * exit-animation-before-unmount sequence.
 *
 * This controller only owns the *transition*. Each adapter renders the
 * correct resting width/height/opacity/`aria-hidden` declaratively (from the
 * same resolved axis/visible state) so the initial server-rendered and
 * first-paint markup is already correct -- this controller's own first call
 * is a same-value no-op in that case, and only takes over once a later call
 * requests an actual change.
 */
export function createNavigationRailItemLabelController({
  label,
  axis,
  visible,
  reducedMotion = () => false,
  timing = DEFAULT_TIMING,
}: NavigationRailItemLabelControllerOptions): NavigationRailItemLabelController {
  let motion: MotionHandle | undefined;
  let lastAxis: NavigationRailItemLabelAxis | undefined;
  let lastVisible: boolean | undefined;
  let isFirstApply = true;

  // The label clips, so as a flex item it could shrink below its content. While the item still has its previous geometry
  // (the collapsed column is not laid out yet), a shrunk label would measure its `auto` size as 0. It keeps its content size.
  label.style.flexShrink = '0';

  const apply = () => {
    const currentAxis = axis();
    const currentVisible = visible();
    if (currentAxis === lastAxis && currentVisible === lastVisible) {
      return;
    }
    const wasFirstApply = isFirstApply;
    isFirstApply = false;
    lastAxis = currentAxis;
    lastVisible = currentVisible;

    const sizeProperty = currentAxis === 'horizontal' ? 'width' : 'height';

    // The initial call establishes the resting state instantly: it is not a
    // transition between two states the user witnessed, so there is nothing
    // to animate from.
    if (reducedMotion() || motionPolicy.reduced || wasFirstApply) {
      motion?.cancel();
      motion = undefined;
      label.style[sizeProperty] = currentVisible ? 'auto' : '0px';
      label.style.opacity = currentVisible ? '1' : '0';
      return;
    }

    // animateStyle starts each property from the size and opacity the label
    // shows, so a change requested mid-way does not jump.
    motion = composeHandles([
      animateStyle(
        label,
        { [sizeProperty]: currentVisible ? 'auto' : '0px' },
        { timing: currentVisible ? timing : collapseTimingOf(timing) },
      ),
      animateStyle(
        label,
        { opacity: currentVisible ? 1 : 0 },
        {
          timing: FADE_TIMING,
          delay: currentVisible ? FADE_IN_DELAY : 0,
        },
      ),
    ]);
  };

  apply();

  return {
    update: apply,
    destroy() {
      motion?.cancel();
      motion = undefined;
    },
  };
}
