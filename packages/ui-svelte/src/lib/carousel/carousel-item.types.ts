import type { CarouselItemInterface } from '@udixio/core';
import type { ClassNameComponent, ElementClasses } from '@udixio/core';
import type { HTMLAttributes } from 'svelte/elements';
import type { Snippet } from 'svelte';

/**
 * A single item in a Carousel, sized by the shared carousel layout.
 * @status beta
 * @parent Carousel
 * @devx Render this component as a child of `Carousel`; `outputRange` overrides the parent range.
 * @a11y Exposes slide group semantics and a roving tabindex inside the carousel.
 * @limitations Items do not implement independent navigation or selection.
 */
export interface SvelteCarouselItemProps extends Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'children'> {
  /** Minimum and maximum item width in pixels. */
  outputRange?: [number, number];
  /** Classes merged onto the item root. */
  class?: string;
  /** State-aware classes for the item root. */
  classes?: ElementClasses<CarouselItemInterface> | ClassNameComponent<CarouselItemInterface>;
  /** Content rendered inside the slide. */
  children?: Snippet;
}
