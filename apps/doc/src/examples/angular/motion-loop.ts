import {
  ChangeDetectionStrategy,
  Component,
  signal,
} from '@angular/core';
import { defineMotion } from '@udixio/motion';
import { Button, Motion } from '@udixio/ui-angular';

// Each beat's cycle, in milliseconds.
const beats = [
  { name: 'beat-low', duration: 800 },
  { name: 'beat-mid', duration: 1100 },
  { name: 'beat-high', duration: 1400 },
];

// One definition, three beats. A loop restarts
// from its first keyframe: the last returns to it.
for (const { name, duration } of beats) {
  defineMotion(name, {
    verb: 'loop',
    keyframes: [
      { scaleY: 0.3 },
      { scaleY: 1 },
      { scaleY: 0.3 },
    ],
    timing: { duration, easing: 'easing.standard' },
    pause: 'control',
  });
}

@Component({
  selector: 'docs-motion-loop-angular',
  imports: [Button, Motion],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-start gap-6">
      <!-- A bar per beat; the button holds them. -->
      <div class="flex h-16 items-end gap-2">
        @for (beat of beats; track beat.name) {
          <span
            [udxMotion]="beat.name"
            [udxMotionPaused]="paused()"
            class="block h-full w-3 origin-bottom
              rounded-full bg-primary"
          ></span>
        }
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
  protected readonly beats = beats;
  // The loops hold while this is true.
  protected readonly paused = signal(false);
}
