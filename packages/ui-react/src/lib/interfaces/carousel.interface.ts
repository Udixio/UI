import { ReactElement } from 'react';
import { CarouselItem } from '../components';

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

export interface CarouselInterface {
  type: 'div';
  props: {
    children?: ReactElement<typeof CarouselItem>[];
    marginPourcent?: number;
    onChange?: (index: number) => void;
    /**
     * Receive live metrics to better control the carousel externally
     */
    onMetricsChange?: (metrics: CarouselMetrics) => void;
    index?: number; // Controlled index for programmatic centering
    variant?:
      | 'hero'
      | 'center-aligned'
      | 'multi-browse'
      | 'un-contained'
      | 'full-screen';
    scrollSensitivity?: number;
    gap?: number;
    inputRange?: [number, number];
    outputRange?: [number, number];
  };
  elements: ['carousel', 'track'];
}
