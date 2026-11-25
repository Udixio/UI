import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Button, Motion } from '@udixio/ui-angular';
import { defineMotion } from '@udixio/motion';

// Three bars on three beats: each beat is a loop of its own.
defineMotion('beat-low', {
  verb: 'loop',
  keyframes: [{ scaleY: 0.3 }, { scaleY: 1 }],
  timing: { duration: 'duration.medium4', easing: 'easing.standard' },
  pause: 'control',
});
defineMotion('beat-mid', {
  verb: 'loop',
  keyframes: [{ scaleY: 0.3 }, { scaleY: 1 }],
  timing: { duration: 'duration.long3', easing: 'easing.standard' },
  pause: 'control',
});
defineMotion('beat-high', {
  verb: 'loop',
  keyframes: [{ scaleY: 0.3 }, { scaleY: 1 }],
  timing: { duration: 'duration.extraLong1', easing: 'easing.standard' },
  pause: 'control',
});

@Component({
  selector: 'docs-motion-loop-angular',
  standalone: true,
  imports: [Button, Motion],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-start gap-6">
      <!-- The three bars play their beats, and the button holds them. -->
      <div class="flex h-16 items-end gap-2">
        <span
          udxMotion="beat-low"
          [udxMotionPaused]="paused()"
          class="block h-full w-3 origin-bottom rounded-full bg-primary"
        ></span>
        <span
          udxMotion="beat-mid"
          [udxMotionPaused]="paused()"
          class="block h-full w-3 origin-bottom rounded-full bg-primary"
        ></span>
        <span
          udxMotion="beat-high"
          [udxMotionPaused]="paused()"
          class="block h-full w-3 origin-bottom rounded-full bg-primary"
        ></span>
      </div>
      <udx-button
        size="small"
        [label]="paused() ? 'Play' : 'Pause'"
        (click)="paused.update((value) => !value)"
      />
    </div>
  `,
})
export class MotionLoopAngular {
  // The loops pause while this is true, and play again when it is false.
  protected readonly paused = signal(false);
}
