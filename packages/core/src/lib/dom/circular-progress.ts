import { animateStyle } from '@udixio/motion/animate';
import { createProgressOwnedStyles } from './progress-owned-styles.js';
import { createIndeterminatePolicyController } from './progress-policy.js';
import { easedLoopKeyframes } from './progress-loop.js';

export interface CircularProgressControllerOptions {
  svg: SVGSVGElement;
  circle: SVGCircleElement;
  /**
   * The cycle of the rotation in milliseconds; the arc takes two cycles to shrink and grow back. Material 3 sets no token
   * for it, so 1500 is kept.
   */
  cycle?: number;
  /** Additional reduction: cannot override the shared policy. Re-read on policy notifications; changes to this function alone are not observed. */
  reducedMotion?: () => boolean;
}

/** Shared indeterminate circular animation used by every framework adapter. */
export function createCircularProgressController({
  svg,
  circle,
  cycle = 1500,
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
    start: (animations) => {
      // The circle turns about its centre.
      owned.style(circle, 'transform-origin', '50% 50%');
      owned.style(circle, 'transform-box', 'fill-box');
      animations.push(
        animateStyle(
          svg,
          [{ transform: 'rotate(-90deg)' }, { transform: 'rotate(270deg)' }],
          {
            timing: { duration: cycle, easing: 'linear' },
            iterations: Infinity,
            reduced: { transform: 'rotate(-90deg)' },
          },
        ),
      );
      // `turn` makes the circle a full extra turn during the shrink half, so the trailing edge catches up to the leading
      // edge instead of the leading edge retreating. A circle is rotationally symmetric, so this is equivalent to advancing
      // the draw start point.
      const arc = easedLoopKeyframes([0, 0.5, 1], { length: [0.1, 0.9, 0.1], turn: [0, 0, 360] });
      animations.push(
        animateStyle(
          circle,
          arc.map((frame) => ({
            offset: frame.offset,
            strokeDasharray: `${frame.length} 1`,
            transform: `rotate(${frame.turn}deg)`,
          })),
          {
            timing: { duration: cycle * 2, easing: 'linear' },
            iterations: Infinity,
            reduced: { strokeDasharray: '0.25 1', transform: null },
          },
        ),
      );
    },
  });
}
