import '@angular/compiler';
import { Component } from '@angular/core';
import { Slider } from '../../src/lib/slider/slider';

@Component({
  selector: 'slider-hydration-fixture',
  standalone: true,
  imports: [Slider],
  template: `<udx-slider aria-label="Hydrated slider" [defaultValue]="20" />`,
})
export class SliderHydrationFixture {}
