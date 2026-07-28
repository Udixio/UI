export interface CarouselMetrics {
  total: number;
  selectedIndex: number;
  visibleApprox: number; // fractional approximate number of visible items
  visibleFull: number; // floored count of fully visible-width items
  stepHalf: number; // suggested step = half of visibleFull (>=1)
  canPrev: boolean;
  canNext: boolean;
  scrollProgress: number; // 0..1 (smoothed)
  viewportWidth: number;
  itemMaxWidth: number;
  gap: number;
}

type Props = {
  /**
   * Carousel layout variant. Only `hero` is implemented today; the other
   * Material 3 arrangements are reserved and will be supported in the future.
   */
  variant?:
    | 'hero'
    | 'center-aligned'
    | 'multi-browse'
    | 'un-contained'
    | 'full-screen';
  /** Gap between items, in pixels. */
  gap?: number;
  /** Adjusts scroll/drag responsiveness. */
  scrollSensitivity?: number;
  /** Min/max item width, in pixels. */
  outputRange?: [number, number];
  /**
   * Index of the centered item. A value other than `undefined` makes the
   * carousel controlled: it becomes the single source of truth and user
   * interaction only notifies via `onIndexChange` instead of moving the
   * carousel locally.
   */
  index?: number;
  /** Initial centered index for uncontrolled usage. */
  defaultIndex?: number;
  /** Called once for each accepted centered-index transition. */
  onIndexChange?: (index: number) => void;
  /**
   * Receive live metrics to better control the carousel externally
   */
  onMetricsChange?: (metrics: CarouselMetrics) => void;
};

export type CarouselStates = {
  /** Resolved index of the currently centered item (controlled value or internal state). */
  selectedIndex: number;
};

type Elements = ['carousel', 'track'];

export interface CarouselInterface {
  type: 'div';
  props: Props;
  states: CarouselStates;
  elements: Elements;
}
