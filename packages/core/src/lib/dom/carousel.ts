import { createSpring, type SpringRef } from '@udixio/motion/animate';
import { computeCarouselLayout } from '../behaviors/carousel.behavior.js';

// The critically damped effects spring closest to the former carousel spring (settling to 99.9 % in 0.37 s, against 0.72 s).
/** Spring that smooths the carousel's scroll progress, the same in every framework adapter. */
export const DEFAULT_CAROUSEL_TIMING: SpringRef = 'spring.slow.effects';

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
  timing?: SpringRef;
  /** Additional reduction: cannot override the shared policy. Re-read on each progress change. */
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
  timing = DEFAULT_CAROUSEL_TIMING,
  reducedMotion = () => false,
}: CarouselControllerOptions): CarouselController {
  let selectedIndex = -1;

  const update = () => {
    const layout = computeCarouselLayout({
      count: items().length,
      viewport: viewport(),
      gap: gap(),
      minItemWidth: minItemWidth(),
      maxItemWidth: maxItemWidth(),
      progress: spring.value,
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

  // The spring keeps its velocity when a new progress retargets it, and reaches it at once under the reduced policy.
  const spring = createSpring(0, {
    timing,
    onUpdate: () => update(),
  });

  return {
    setProgress(progress, options) {
      if (options?.animate === false || reducedMotion()) {
        spring.jump(progress);
        return;
      }
      spring.to(progress);
    },
    update,
    getProgress: () => spring.value,
    destroy() {
      spring.stop();
    },
  };
}
