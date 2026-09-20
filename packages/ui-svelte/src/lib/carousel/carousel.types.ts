import type { CarouselInterface, CarouselMetrics, CarouselProps, ClassNameComponent, ElementClasses } from '@udixio/core';
import type { HTMLAttributes } from 'svelte/elements';
import type { Snippet } from 'svelte';

type ForwardedAttributes = Omit<HTMLAttributes<HTMLDivElement>, keyof CarouselProps | 'class' | 'children' | 'style' | 'onkeydown'>;

/**
 * Carousels show a collection of items that can be scrolled on and off the screen.
 * @status beta
 * @category Layout
 * @devx Render `CarouselItem` children; `index` is bindable and `defaultIndex` seeds uncontrolled use.
 * @a11y The region and each slide expose carousel/slide role descriptions and roving tabindex.
 * @limitations Only the hero layout is implemented; other variant names are reserved.
 */
export interface SvelteCarouselProps extends CarouselProps, ForwardedAttributes {
  /** Classes merged onto the carousel root. */
  class?: string;
  /** Inline style merged onto the carousel root. */
  style?: string;
  /** State-aware classes for the carousel and its track. */
  classes?: ElementClasses<CarouselInterface> | ClassNameComponent<CarouselInterface>;
  children?: Snippet;
  /** Accessible name for the carousel region. */
  accessibleLabel?: string;
  index?: number;
  defaultIndex?: number;
  onIndexChange?: (index: number) => void;
  onMetricsChange?: (metrics: CarouselMetrics) => void;
  /** Native keydown handler for the carousel region. */
  onkeydown?: (event: KeyboardEvent) => void;
}
