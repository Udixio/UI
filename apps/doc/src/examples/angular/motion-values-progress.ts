import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MotionValue, Slider } from '@udixio/ui-angular';
import { defineValue } from '@udixio/motion/value';

// One value on both axes, in degrees: the pointer moves each channel between -8 and 8.
defineValue('tilt', { source: 'pointer', axis: 'both', range: [-8, 8], unit: 'deg' });
// The progress of the track: the slider sets it, and the bar follows it.
defineValue('progress', { source: 'state', range: [0, 1] });

@Component({
  selector: 'docs-motion-values-progress-angular',
  standalone: true,
  imports: [MotionValue, Slider],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex w-full max-w-72 flex-col gap-6">
      <!-- The vertical channel is negated, so the cover sinks under the pointer on both axes. -->
      <div
        udxMotionValue="tilt"
        class="rounded-3xl bg-primary-container p-5 text-on-primary-container [transform:perspective(600px)_rotateY(var(--udx-motion-value-tilt-x-deg,0deg))_rotateX(calc(var(--udx-motion-value-tilt-y-deg,0deg)_*_-1))] motion-reduce:[transform:none]"
      >
        <p class="text-title-large">Lowlands</p>
      </div>
      <udx-slider
        aria-label="Progress"
        [min]="0"
        [max]="1"
        [step]="0.01"
        [value]="progress()"
        (valueChange)="progress.set($event)"
      />
      <div class="h-3 overflow-hidden rounded-full bg-surface-container-highest">
        <data
          udxMotionValue="progress"
          [attr.value]="progress()"
          class="block h-full w-full origin-left rounded-full bg-primary [scale:var(--udx-motion-value-progress,0)_1]"
        ></data>
      </div>
    </div>
  `,
})
export class MotionValuesProgressAngular {
  protected readonly progress = signal(0.6);
}
