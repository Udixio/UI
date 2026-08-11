import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Button, Carousel, CarouselItem } from '@udixio/ui-angular';
import type { CarouselMetrics } from '@udixio/core';

const total = 15;
const slides = Array.from({ length: total }, (_, i) => i + 1).map((id) => {
  const fmt = id % 3;
  return {
    id,
    fmt,
    width: fmt === 0 ? 640 : fmt === 1 ? 400 : 240,
    height: fmt === 0 ? 240 : fmt === 1 ? 400 : 640,
  };
});

@Component({
  selector: 'docs-carousel-navigation-angular',
  standalone: true,
  imports: [Button, Carousel, CarouselItem],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full">
      <udx-carousel
        variant="hero"
        [scrollSensitivity]="0.8"
        [index]="index()"
        (indexChange)="index.set($event)"
        (metricsChange)="handleMetricsChange($event)"
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
      <div class="w-full mt-3 flex items-center justify-between gap-3">
        <div class="text-on-surface-variant text-body-small">
          Visible ≈ {{ visible().approx.toFixed(2) }} (full {{ visible().full }}), step:
          {{ step() }}
        </div>
        <div class="flex gap-3">
          <udx-button variant="text" label="Previous" (click)="prev()" />
          <udx-button variant="filled" label="Next" (click)="next()" />
        </div>
      </div>
    </div>
  `,
})
export class CarouselNavigationAngular {
  protected readonly slides = slides;
  protected readonly index = signal(0);
  protected readonly step = signal(1);
  protected readonly visible = signal({ approx: 0, full: 0 });

  protected prev(): void {
    this.index.set(Math.max(0, this.index() - this.step()));
  }

  protected next(): void {
    this.index.set(Math.min(total - 1, this.index() + this.step()));
  }

  protected handleMetricsChange(metrics: CarouselMetrics): void {
    this.step.set(metrics.stepHalf); // step equals half of the visible items
    this.visible.set({ approx: metrics.visibleApprox, full: metrics.visibleFull });
  }
}
