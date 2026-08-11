import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Carousel, CarouselItem } from '@udixio/ui-angular';

@Component({
  selector: 'docs-carousel-basic-angular',
  standalone: true,
  imports: [Carousel, CarouselItem],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <udx-carousel variant="hero" [gap]="8">
      <udx-carousel-item>
        <div class="p-6 bg-surface rounded-xl">Slide 1</div>
      </udx-carousel-item>
      <udx-carousel-item>
        <div class="p-6 bg-surface rounded-xl">Slide 2</div>
      </udx-carousel-item>
      <udx-carousel-item>
        <div class="p-6 bg-surface rounded-xl">Slide 3</div>
      </udx-carousel-item>
    </udx-carousel>
  `,
})
export class CarouselBasicAngular {}
