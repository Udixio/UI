import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MotionValue, Slider } from '@udixio/ui-angular';
import { defineValue } from '@udixio/motion/value';

// One value on both axes, in degrees: the card's CSS reads each channel with its unit.
defineValue('tilt', { source: 'pointer', axis: 'both', range: [-8, 8], unit: 'deg' });
// A state value: the slider sets it, and the gauge scales with it.
defineValue('level', { source: 'state', range: [0, 1] });

@Component({
  selector: 'docs-motion-values-pointer-angular',
  standalone: true,
  imports: [MotionValue, Slider],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex w-full max-w-72 flex-col gap-6">
      <!-- The vertical channel is negated, so the card sinks under the pointer on both axes. -->
      <div
        udxMotionValue="tilt"
        class="rounded-3xl bg-primary-container p-5 text-on-primary-container [transform:perspective(600px)_rotateY(var(--udx-motion-value-tilt-x-deg,0deg))_rotateX(calc(var(--udx-motion-value-tilt-y-deg,0deg)_*_-1))] motion-reduce:[transform:none]"
      >
        <p class="text-title-large">Move over this card</p>
      </div>
      <div class="flex w-full flex-col gap-2">
        <span class="text-label-large text-on-surface">Level</span>
        <udx-slider
          aria-label="Level"
          [min]="0"
          [max]="1"
          [step]="0.01"
          [value]="level()"
          (valueChange)="level.set($event)"
        />
      </div>
      <div class="h-3 overflow-hidden rounded-full bg-surface-container-highest">
        <data
          udxMotionValue="level"
          [attr.value]="level()"
          class="block h-full w-full origin-left rounded-full bg-primary [scale:var(--udx-motion-value-level,0)_1]"
        ></data>
      </div>
    </div>
  `,
})
export class MotionValuesPointerAngular {
  protected readonly level = signal(0.6);
}
