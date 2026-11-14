import React from 'react';
import { renderToString } from 'react-dom/server';
import { SliderHydrationFixture } from './slider-hydration';

export function renderSliderHydrationFixture() {
  return renderToString(<SliderHydrationFixture />);
}
