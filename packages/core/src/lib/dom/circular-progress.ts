import { animate, type AnimationPlaybackControls } from 'motion';

export interface CircularProgressControllerOptions {
  svg: SVGSVGElement;
  circle: SVGCircleElement;
  duration?: number;
  reducedMotion?: () => boolean;
}

function systemPrefersReducedMotion(): boolean {
  return (
    typeof globalThis.matchMedia === 'function' &&
    globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/** Shared indeterminate circular animation used by every framework adapter. */
export function createCircularProgressController({
  svg,
  circle,
  duration = 1.5,
  reducedMotion = systemPrefersReducedMotion,
}: CircularProgressControllerOptions): () => void {
  if (reducedMotion()) {
    svg.style.transform = 'rotate(-90deg)';
    circle.setAttribute('pathLength', '1');
    circle.style.strokeDasharray = '0.25 1';
    return () => undefined;
  }

  const animations: AnimationPlaybackControls[] = [
    animate(
      svg,
      { rotate: [-90, 270] },
      { duration, repeat: Infinity, ease: 'linear' },
    ),
    animate(
      circle,
      { pathLength: [0.1, 0.9, 0.1] },
      { duration: duration * 2, repeat: Infinity, ease: 'easeInOut' },
    ),
  ];

  return () => animations.forEach((animation) => animation.stop());
}
