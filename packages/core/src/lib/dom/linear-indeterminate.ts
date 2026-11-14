import { animate } from 'motion';
import { createIndeterminatePolicyController } from './progress-policy.js';
import {
  createProgressMotionTarget,
  createProgressOwnedStyles,
} from './progress-owned-styles.js';

export interface LinearIndeterminateControllerOptions {
  leadingBar: HTMLElement;
  gapTrack: HTMLElement;
  trailingBar: HTMLElement;
  duration?: number;
  /** Additional reduction: cannot override the shared policy. Re-read on policy notifications; changes to this function alone are not observed. */
  reducedMotion?: () => boolean;
}

/** Shared linear indeterminate bar animation used by every framework adapter. */
export function createLinearIndeterminateController({
  leadingBar,
  gapTrack,
  trailingBar,
  duration = 1.5,
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
    start: (animations, isActive) => {
      const leading = createProgressMotionTarget(
        { width: '20%', marginLeft: '0px', marginRight: '0px' },
        isActive,
        (key, value) =>
          owned.style(leadingBar, key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`), value),
      );
      const gap = createProgressMotionTarget({ width: '20%' }, isActive, (_, value) =>
        owned.style(gapTrack, 'width', value),
      );
      const trailing = createProgressMotionTarget({ width: '20%' }, isActive, (_, value) =>
        owned.style(trailingBar, 'width', value),
      );
      animations.push(
        animate(
          leading,
          {
            width: ['0%', '0%', '0%', '20%'],
            marginLeft: ['0px', '0px', '6px', '6px'],
            marginRight: ['0px', '0px', '6px', '6px'],
          },
          {
            duration,
            repeat: Infinity,
            ease: 'easeInOut',
            times: [0, 0.499, 0.5, 1],
          },
        ),
      );
      animations.push(
        animate(
          gap,
          { width: ['0%', '40%', '100%'] },
          { duration, repeat: Infinity, ease: 'easeInOut' },
        ),
      );
      animations.push(
        animate(
          trailing,
          { width: ['20%', '60%', '20%'] },
          { duration, repeat: Infinity, ease: 'easeInOut', times: [0, 0.5, 1] },
        ),
      );
    },
  });
}
