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
  variant?:
    | 'hero'
    | 'center-aligned'
    | 'multi-browse'
    | 'un-contained'
    | 'full-screen';
  /** Outer margins as a percentage of the viewport width. */
  marginPourcent?: number;
  /** Gap between items, in pixels. */
  gap?: number;
  /** Adjusts scroll/drag responsiveness. */
  scrollSensitivity?: number;
  inputRange?: [number, number];
  /** Min/max item width, in pixels. */
  outputRange?: [number, number];
  /** Controlled index for programmatic centering. */
  index?: number;
  onChange?: (index: number) => void;
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
