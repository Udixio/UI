import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Button, Motion } from '@udixio/ui-angular';
import '@udixio/motion/presets';

@Component({
  selector: 'docs-motion-loop-angular',
  standalone: true,
  imports: [Button, Motion],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center gap-6">
      <span
        udxMotion="rotate"
        [udxMotionPaused]="paused()"
        class="block size-8 rounded-full border-4 border-primary border-t-transparent"
      ></span>
      <udx-button
        size="small"
        [label]="paused() ? 'Play spinner' : 'Pause spinner'"
        (click)="paused.update((value) => !value)"
      />
    </div>
  `,
})
export class MotionLoopAngular {
  // A loop pauses while this is true, and plays again when it is false.
  protected readonly paused = signal(false);
}
