import { InjectionToken, type Signal } from '@angular/core';

export interface CarouselContext {
  outputRange: Signal<[number, number]>;
}

export const CAROUSEL_CONTEXT = new InjectionToken<CarouselContext>(
  'CAROUSEL_CONTEXT',
);
