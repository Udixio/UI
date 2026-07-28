import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Carousel, CarouselItem } from '@udixio/ui-angular';

@Component({
  selector: 'docs-carousel-basic-angular',
  standalone: true,
  imports: [Carousel, CarouselItem],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <lib-carousel variant="hero" [gap]="8">
      <lib-carousel-item>
        <div class="p-6 bg-surface rounded-xl">Slide 1</div>
      </lib-carousel-item>
      <lib-carousel-item>
        <div class="p-6 bg-surface rounded-xl">Slide 2</div>
      </lib-carousel-item>
      <lib-carousel-item>
        <div class="p-6 bg-surface rounded-xl">Slide 3</div>
      </lib-carousel-item>
    </lib-carousel>
  `,
})
export class CarouselBasicAngular {}
