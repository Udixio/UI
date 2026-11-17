import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Motion } from '@udixio/ui-angular';
import '@udixio/motion/presets';

@Component({
  selector: 'docs-motion-loop-angular',
  standalone: true,
  imports: [Motion],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center gap-6">
      <span
        udxMotion="rotate"
        [udxMotionPaused]="paused()"
        class="block size-8 rounded-full border-4 border-primary border-t-transparent"
      ></span>
      <button
        type="button"
        (click)="paused.update((value) => !value)"
        class="rounded-full bg-primary px-6 py-2.5 text-label-large text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
      >
        {{ paused() ? 'Play spinner' : 'Pause spinner' }}
      </button>
    </div>
  `,
})
export class MotionLoopAngular {
  // A loop pauses while this is true, and plays again when it is false.
  protected readonly paused = signal(false);
}
