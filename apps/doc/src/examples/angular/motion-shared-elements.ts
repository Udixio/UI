import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import { Button, Motion } from '@udixio/ui-angular';
import '@udixio/motion/presets';

@Component({
  selector: 'docs-motion-shared-elements-angular',
  standalone: true,
  imports: [Button, Motion],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex w-full max-w-72 flex-col items-start">
      <!-- The cover and the player share a key: the player grows out of the cover, and back into it. -->
      @if (open()) {
        <div
          #player
          tabindex="-1"
          udxMotion="reflow"
          udxMotionShared="cover"
          class="flex w-full flex-col items-start gap-4 rounded-3xl bg-tertiary-container p-5 text-on-tertiary-container"
        >
          <span class="size-40 rounded-2xl bg-tertiary"></span>
          <p class="text-title-large">Night drive</p>
          <p class="text-body-medium">Low tide</p>
          <udx-button size="small" variant="tonal" label="Close" (click)="show(false)" />
        </div>
      } @else {
        <!-- The cover is the shared element itself: a native button, as in the HTML tab. -->
        <button
          #cover
          type="button"
          udxMotion="reflow"
          udxMotionShared="cover"
          aria-label="Open the player"
          (click)="show(true)"
          class="size-16 rounded-2xl bg-tertiary-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
        ></button>
      }
    </div>
  `,
})
export class MotionSharedElementsAngular {
  protected readonly open = signal(false);
  private readonly injector = inject(Injector);
  private readonly cover = viewChild<ElementRef<HTMLElement>>('cover');
  private readonly player = viewChild<ElementRef<HTMLElement>>('player');

  // The focus goes with the element that is shown: the player when it opens, the cover when it closes.
  protected show(next: boolean): void {
    this.open.set(next);
    afterNextRender(() => (next ? this.player() : this.cover())?.nativeElement.focus(), { injector: this.injector });
  }
}
