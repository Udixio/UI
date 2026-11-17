import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Motion } from '@udixio/ui-angular';
import '@udixio/motion/presets';

@Component({
  selector: 'docs-motion-emphasis-angular',
  standalone: true,
  imports: [Motion],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      udxMotion="press"
      [udxMotionState]="count()"
      (click)="count.update((value) => value + 1)"
      class="rounded-full bg-primary px-6 py-2.5 text-label-large text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
    >
      Pressed {{ count() }} times
    </button>
  `,
})
export class MotionEmphasisAngular {
  // Each new value of the count replays the press preset.
  protected readonly count = signal(0);
}
