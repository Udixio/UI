import { ChangeDetectionStrategy, Component, ElementRef, ViewChild } from '@angular/core';
import { Motion } from '@udixio/ui-angular';
import { defineMotion, getMotion } from '@udixio/motion';

// A reveal split into words: the words wait until the sentence enters the view, then play once.
defineMotion('headline', {
  verb: 'reveal',
  split: 'words',
  reduced: 'fade',
  keyframes: [
    { opacity: 0, y: 12 },
    { opacity: 1, y: 0 },
  ],
});

@Component({
  selector: 'docs-motion-text-angular',
  standalone: true,
  imports: [Motion],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-start gap-4">
      <p
        #headline
        udxMotion="headline"
        class="text-headline-medium text-on-surface"
      >
        Every word arrives in turn, and is read once.
      </p>
      <button
        type="button"
        (click)="replay()"
        class="rounded-full bg-primary px-6 py-2.5 text-label-large text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
      >
        Replay
      </button>
    </div>
  `,
})
export class MotionTextAngular {
  @ViewChild('headline', { static: true }) private readonly headline!: ElementRef<HTMLElement>;

  protected replay(): void {
    getMotion(this.headline.nativeElement, 'view')?.play();
  }
}
