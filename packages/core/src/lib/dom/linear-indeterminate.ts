import { animate, type AnimationPlaybackControls } from 'motion';

export interface LinearIndeterminateControllerOptions {
  leadingBar: HTMLElement;
  gapTrack: HTMLElement;
  trailingBar: HTMLElement;
  duration?: number;
  reducedMotion?: () => boolean;
}

function systemPrefersReducedMotion(): boolean {
  return (
    typeof globalThis.matchMedia === 'function' &&
    globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/** Shared linear indeterminate bar animation used by every framework adapter. */
export function createLinearIndeterminateController({
  leadingBar,
  gapTrack,
  trailingBar,
  duration = 1.5,
  reducedMotion = systemPrefersReducedMotion,
}: LinearIndeterminateControllerOptions): () => void {
  if (reducedMotion()) {
    leadingBar.style.width = '20%';
    gapTrack.style.width = '20%';
    trailingBar.style.width = '20%';
    trailingBar.style.marginLeft = '6px';
    return () => undefined;
  }

  const animations: AnimationPlaybackControls[] = [
    animate(
      leadingBar,
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
    animate(
      gapTrack,
      { width: ['0%', '40%', '100%'] },
      { duration, repeat: Infinity, ease: 'easeInOut' },
    ),
    animate(
      trailingBar,
      { width: ['20%', '60%', '20%'] },
      { duration, repeat: Infinity, ease: 'easeInOut', times: [0, 0.5, 1] },
    ),
  ];

  return () => animations.forEach((animation) => animation.stop());
}
