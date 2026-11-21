import {
  animateStyle,
  type CurveTiming,
  type MotionHandle,
  type SpringRef,
} from '@udixio/motion/animate';
import { motionPolicy } from '@udixio/motion/policy';
import { collapseTimingOf } from './component-motion.js';

/** A collapsed rail is its 96 px icon column, whatever its labels measure. */
const COLLAPSED_WIDTH = '96px';
/** An extended rail is at least 220 px wide, and at most 360 px. */
const EXTENDED_MIN_WIDTH = '220px';
const EXTENDED_MAX_WIDTH = '360px';
/** The rail's width follows the spatial spring of its role: a column that moves as a whole. */
const DEFAULT_TIMING: SpringRef = 'spring.default.spatial';

export interface NavigationRailWidthControllerOptions {
  /** The rail root. Its width is its content width between the bounds this controller animates. */
  rail: HTMLElement;
  /** Whether the rail is extended when it connects. */
  extended: boolean;
  /** The motion of the width when the rail extends; `spring.default.spatial` by default. Collapsing uses the effects spring of the same speed. */
  timing?: SpringRef | CurveTiming;
  /** An extra reduced-motion switch, read at each change; the document policy always applies. */
  reducedMotion?: () => boolean;
}

export interface NavigationRailWidthController {
  /** Animates the rail to the given extended state; a change mid-way continues from the width it shows. */
  setExtended(extended: boolean): void;
  destroy(): void;
}

/**
 * The minimum and maximum width of a rail at rest. Adapters render these inline on first paint, and the controller writes
 * them on every change. The rail's own width stays its content width (`w-fit`), between these bounds.
 */
export function getNavigationRailRestStyle(extended: boolean): {
  minWidth: string;
  maxWidth: string;
} {
  return extended
    ? { minWidth: EXTENDED_MIN_WIDTH, maxWidth: EXTENDED_MAX_WIDTH }
    : { minWidth: COLLAPSED_WIDTH, maxWidth: COLLAPSED_WIDTH };
}

/**
 * Connects the width of a `NavigationRail` on `@udixio/motion`, shared by every framework adapter. The rail's width is its
 * content width, clamped by a minimum and a maximum; the controller animates those two bounds, not the width itself. Its
 * labels grow from 0 px in the same frame, so a width measured to `auto` at the start would be the collapsed width, and the
 * rail would snap at the end. Bounds keep the content width live: the rail moves on the spring while its bounds move, and
 * settles on its content width. A change mid-way continues from the bounds the rail shows, and reduced motion applies the
 * rest state at once.
 */
export function createNavigationRailWidthController({
  rail,
  extended,
  timing = DEFAULT_TIMING,
  reducedMotion = () => false,
}: NavigationRailWidthControllerOptions): NavigationRailWidthController {
  let motion: MotionHandle | undefined;
  let isExtended = extended;
  let destroyed = false;

  const writeRest = (value: boolean) => {
    const bounds = getNavigationRailRestStyle(value);
    rail.style.minWidth = bounds.minWidth;
    rail.style.maxWidth = bounds.maxWidth;
  };
  writeRest(extended);

  return {
    setExtended(nextExtended) {
      if (destroyed || nextExtended === isExtended) return;
      isExtended = nextExtended;

      if (reducedMotion() || motionPolicy.reduced) {
        motion?.cancel();
        motion = undefined;
        writeRest(nextExtended);
        return;
      }

      // animateStyle reads the bounds the rail shows before it replaces a running motion, so a change mid-way starts
      // from them. Collapsing takes both bounds to 96 px on the effects spring of the same speed: a spatial spring
      // overshoots, and an overshoot below 96 px would squeeze the icon column.
      const bounds = getNavigationRailRestStyle(nextExtended);
      motion = animateStyle(
        rail,
        { minWidth: bounds.minWidth, maxWidth: bounds.maxWidth },
        { timing: nextExtended ? timing : collapseTimingOf(timing) },
      );
    },
    destroy() {
      destroyed = true;
      motion?.cancel();
      motion = undefined;
    },
  };
}
