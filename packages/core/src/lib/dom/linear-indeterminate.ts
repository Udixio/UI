import { animateStyle } from '@udixio/motion/animate';
import { createProgressOwnedStyles } from './progress-owned-styles.js';
import { createIndeterminatePolicyController } from './progress-policy.js';
import { easedLoopKeyframes } from './progress-loop.js';

export interface LinearIndeterminateControllerOptions {
  leadingBar: HTMLElement;
  gapTrack: HTMLElement;
  trailingBar: HTMLElement;
  /**
   * The cycle of the bars in milliseconds. Material 3 sets no token for it, so 1500 is kept.
   */
  cycle?: number;
  /** Additional reduction: cannot override the shared policy. Re-read on policy notifications; changes to this function alone are not observed. */
  reducedMotion?: () => boolean;
}

/** Shared linear indeterminate bar animation used by every framework adapter. */
export function createLinearIndeterminateController({
  leadingBar,
  gapTrack,
  trailingBar,
  cycle = 1500,
  reducedMotion,
}: LinearIndeterminateControllerOptions): () => void {
  const owned = createProgressOwnedStyles();
  return createIndeterminatePolicyController({
    restore: owned.restore,
    reducedMotion,
    staticFrame: () => {
      owned.style(leadingBar, 'width', '20%');
      owned.style(leadingBar, 'margin-left', '0px');
      owned.style(leadingBar, 'margin-right', '0px');
      owned.style(gapTrack, 'width', '20%');
      owned.style(trailingBar, 'width', '20%');
      owned.style(trailingBar, 'margin-left', '6px');
    },
    start: (animations) => {
      // The leading bar's margins jump to 6 px at the middle of the cycle, where its width starts to grow.
      const leading = easedLoopKeyframes([0, 0.499, 0.5, 1], {
        width: [0, 0, 0, 20],
        marginLeft: [0, 0, 6, 6],
        marginRight: [0, 0, 6, 6],
      });
      animations.push(
        animateStyle(
          leadingBar,
          leading.map((frame) => ({
            offset: frame.offset,
            width: `${frame.width}%`,
            marginLeft: `${frame.marginLeft}px`,
            marginRight: `${frame.marginRight}px`,
          })),
          {
            timing: { duration: cycle, easing: 'linear' },
            iterations: Infinity,
            reduced: { width: '20%', marginLeft: '0px', marginRight: '0px' },
          },
        ),
      );
      const gap = easedLoopKeyframes([0, 0.5, 1], { width: [0, 40, 100] });
      animations.push(
        animateStyle(
          gapTrack,
          gap.map((frame) => ({ offset: frame.offset, width: `${frame.width}%` })),
          {
            timing: { duration: cycle, easing: 'linear' },
            iterations: Infinity,
            reduced: { width: '20%' },
          },
        ),
      );
      const trailing = easedLoopKeyframes([0, 0.5, 1], { width: [20, 60, 20] });
      animations.push(
        animateStyle(
          trailingBar,
          trailing.map((frame) => ({ offset: frame.offset, width: `${frame.width}%` })),
          {
            timing: { duration: cycle, easing: 'linear' },
            iterations: Infinity,
            reduced: { width: '20%', marginLeft: '6px' },
          },
        ),
      );
    },
  });
}
