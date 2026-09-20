import { getContext, setContext } from 'svelte';
import type { CarouselItemRegistration } from './carousel-item-registration.svelte';
export type { CarouselItemRegistration } from './carousel-item-registration.svelte';

export interface SvelteCarouselContext {
  outputRange: () => [number, number];
  selectedIndex: () => number;
  indexOf: (item: CarouselItemRegistration) => number | undefined;
  registerItem: (item: CarouselItemRegistration) => () => void;
}

export const CAROUSEL_CONTEXT = Symbol('udixio-carousel-context');
export const setCarouselContext = (context: SvelteCarouselContext) => setContext(CAROUSEL_CONTEXT, context);
export const getCarouselContext = () => getContext<SvelteCarouselContext | undefined>(CAROUSEL_CONTEXT);
