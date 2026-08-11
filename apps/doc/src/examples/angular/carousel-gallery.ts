import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Carousel, CarouselItem } from '@udixio/ui-angular';

const slides = Array.from({ length: 15 }, (_, i) => i + 1).map((id) => {
  const fmt = id % 3;
  return {
    id,
    fmt,
    width: fmt === 0 ? 640 : fmt === 1 ? 400 : 240,
    height: fmt === 0 ? 240 : fmt === 1 ? 400 : 640,
  };
});

@Component({
  selector: 'docs-carousel-gallery-angular',
  standalone: true,
  imports: [Carousel, CarouselItem],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <udx-carousel
      variant="hero"
      [gap]="16"
      [scrollSensitivity]="0.8"
      (indexChange)="logIndex($event)"
    >
      @for (slide of slides; track slide.id) {
        <udx-carousel-item>
          <div class="bg-surface rounded-xl h-full flex flex-col">
            <div class="flex-1 min-h-0">
              <img
                class="size-full object-cover rounded-2xl"
                [src]="
                  'https://picsum.photos/seed/udx-' +
                  slide.id +
                  '-fmt-' +
                  slide.fmt +
                  '/' +
                  slide.width +
                  '/' +
                  slide.height
                "
                alt="Cover"
              />
            </div>
            <p class="text-title-large m-8 text-nowrap">Slide {{ slide.id }}</p>
          </div>
        </udx-carousel-item>
      }
    </udx-carousel>
  `,
})
export class CarouselGalleryAngular {
  protected readonly slides = slides;

  protected logIndex(index: number): void {
    console.log('Active slide:', index);
  }
}
