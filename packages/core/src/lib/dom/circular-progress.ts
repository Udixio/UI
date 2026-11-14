import { animate } from 'motion';
import { createIndeterminatePolicyController } from './progress-policy.js';
import {
  createProgressMotionTarget,
  createProgressOwnedStyles,
} from './progress-owned-styles.js';

export interface CircularProgressControllerOptions {
  svg: SVGSVGElement;
  circle: SVGCircleElement;
  duration?: number;
  /** Additional reduction: cannot override the shared policy. Re-read on policy notifications; changes to this function alone are not observed. */
  reducedMotion?: () => boolean;
}

/** Shared indeterminate circular animation used by every framework adapter. */
export function createCircularProgressController({
  svg,
  circle,
  duration = 1.5,
  reducedMotion,
}: CircularProgressControllerOptions): () => void {
  const owned = createProgressOwnedStyles();
  return createIndeterminatePolicyController({
    restore: owned.restore,
    reducedMotion,
    staticFrame: () => {
      owned.style(svg, 'transform', 'rotate(-90deg)');
      owned.attribute(circle, 'pathLength', '1');
      owned.style(circle, 'transform', '');
      owned.style(circle, 'stroke-dashoffset', '0');
      owned.style(circle, 'stroke-dasharray', '0.25 1');
    },
    start: (animations, isActive) => {
      // Motion's SVG renderer normally supplies these for circle rotation.
      owned.style(circle, 'transform-origin', '50% 50%');
      owned.style(circle, 'transform-box', 'fill-box');
      const rotation = createProgressMotionTarget({ rotate: -90 }, isActive, (_, value) =>
        owned.style(svg, 'transform', `rotate(${value}deg)`),
      );
      const path = createProgressMotionTarget(
        { pathLength: 0.25, rotate: 0 },
        isActive,
        (key, value) => {
          if (key === 'pathLength') owned.style(circle, 'stroke-dasharray', `${value} 1`);
          else owned.style(circle, 'transform', `rotate(${value}deg)`);
        },
      );
      animations.push(
        animate(
          rotation,
          { rotate: [-90, 270] },
          { duration, repeat: Infinity, ease: 'linear' },
        ),
      );
      animations.push(
        animate(
          path,
          // `rotate` turns the circle a full extra turn during the shrink half
          // so the trailing edge catches up to the leading edge instead of the
          // leading edge retreating — without it the arc visibly reverses
          // direction every time it shrinks. A circle is rotationally
          // symmetric, so this is equivalent to (and, unlike `pathOffset`,
          // loops back cleanly across) advancing the draw start point.
          { pathLength: [0.1, 0.9, 0.1], rotate: [0, 0, 360] },
          { duration: duration * 2, repeat: Infinity, ease: 'easeInOut' },
        ),
      );
    },
  });
}
