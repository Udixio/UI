import { animate, type AnimationPlaybackControls, type Transition } from 'motion';
import { computeCarouselLayout } from '../behaviors/carousel.behavior.js';

/**
 * Default spring used to smooth raw scroll progress. Shared by every adapter so
 * the carousel feels identical across frameworks.
 */
export const DEFAULT_CAROUSEL_TRANSITION: Transition = {
  type: 'spring',
  stiffness: 260,
  damping: 32,
  mass: 0.6,
  restDelta: 0.0005,
};

export interface CarouselControllerOptions {
  /** Element that receives the sub-item translate. */
  track: HTMLElement;
  /** Current item elements, in index order. Re-read on every layout pass. */
  items: () => (HTMLElement | null)[];
  /** Visible width of the carousel viewport, in px. */
  viewport: () => number;
  /** Gap between items, in px. */
  gap: () => number;
  /** Minimum item width, in px. */
  minItemWidth: () => number;
  /** Maximum item width, in px. */
  maxItemWidth: () => number;
  /** Called when the centered item changes. */
  onSelectedIndexChange?: (index: number) => void;
  /** Spring used to smooth progress changes. */
  transition?: Transition;
  reducedMotion?: () => boolean;
}

export interface CarouselController {
  /**
   * Feed a new raw scroll progress (0..1). The controller springs the smoothed
   * value towards it and rewrites the layout on every frame. Pass
   * `{ animate: false }` to jump immediately.
   */
  setProgress(progress: number, options?: { animate?: boolean }): void;
  /** Recompute and write the layout using the current smoothed progress. */
  update(): void;
  /** Current smoothed progress, 0..1. */
  getProgress(): number;
  destroy(): void;
}

function systemPrefersReducedMotion(): boolean {
  return (
    typeof globalThis.matchMedia === 'function' &&
    globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Owns the carousel's imperative work: springing the scroll progress and
 * writing the resolved widths and track offset to the DOM. The layout decisions
 * themselves live in `computeCarouselLayout`; this controller only applies them.
 *
 * Adapters bind it to their lifecycle (`useEffect` in React,
 * `afterRenderEffect` in Angular) and own nothing else.
 */
export function createCarouselController({
  track,
  items,
  viewport,
  gap,
  minItemWidth,
  maxItemWidth,
  onSelectedIndexChange,
  transition = DEFAULT_CAROUSEL_TRANSITION,
  reducedMotion = systemPrefersReducedMotion,
}: CarouselControllerOptions): CarouselController {
  let smoothedProgress = 0;
  let selectedIndex = -1;
  let animation: AnimationPlaybackControls | undefined;

  const update = () => {
    const layout = computeCarouselLayout({
      count: items().length,
      viewport: viewport(),
      gap: gap(),
      minItemWidth: minItemWidth(),
      maxItemWidth: maxItemWidth(),
      progress: smoothedProgress,
    });

    const elements = items();
    for (const item of layout.items) {
      const element = elements[item.index];
      if (!element) continue;
      element.style.setProperty('--carousel-item-width', `${item.width}px`);
      element.style.display = item.visible ? 'block' : 'none';
    }
    track.style.transform = `translateX(${layout.translate}px)`;

    if (layout.selectedIndex !== selectedIndex) {
      selectedIndex = layout.selectedIndex;
      onSelectedIndexChange?.(layout.selectedIndex);
    }
  };

  const jumpTo = (progress: number) => {
    animation?.stop();
    animation = undefined;
    smoothedProgress = progress;
    update();
  };

  return {
    setProgress(progress, options) {
      if (options?.animate === false || reducedMotion()) {
        jumpTo(progress);
        return;
      }

      animation?.stop();
      animation = animate(smoothedProgress, progress, {
        ...transition,
        onUpdate: (value) => {
          smoothedProgress = value;
          update();
        },
      });
    },
    update,
    getProgress: () => smoothedProgress,
    destroy() {
      animation?.stop();
      animation = undefined;
    },
  };
}
