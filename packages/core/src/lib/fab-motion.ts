/** Shared timing for geometric and color transformations of Fab composites. */
export const FAB_MOTION_DURATION_MS = 300;
export const FAB_MOTION_DURATION_SECONDS = FAB_MOTION_DURATION_MS / 1000;
export const FAB_MOTION_EASING = [0, 0, 0.58, 1] as const;

/** Static Tailwind timing utilities matching the JavaScript motion contract. */
export const FAB_MOTION_TIMING_CLASS =
  'duration-300 ease-[cubic-bezier(0,0,0.58,1)] motion-reduce:transition-none';
