import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MotionValue, Slider } from '@udixio/ui-angular';
import { defineValue } from '@udixio/motion/value';

// Two pointer values, one per axis, and a state value that the range sets.
defineValue('tilt-x', {
  source: 'pointer',
  axis: 'x',
  range: [-8, 8],
});
defineValue('tilt-y', {
  source: 'pointer',
  axis: 'y',
  range: [6, -6],
});
defineValue('level', {
  source: 'state',
  range: [0, 1],
});

@Component({
  selector: 'docs-motion-pointer-angular',
  standalone: true,
  imports: [MotionValue, Slider],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex w-full max-w-72 flex-col gap-6">
      <div
        udxMotionValue="tilt-y"
        style="transform: rotateX(calc(var(--udx-motion-value-tilt-y, 0) * 1deg))"
      >
        <div
          udxMotionValue="tilt-x"
          class="rounded-3xl bg-primary-container p-5 text-on-primary-container"
          style="transform: rotateY(calc(var(--udx-motion-value-tilt-x, 0) * 1deg))"
        >
          <p class="text-title-large">Move over this card</p>
        </div>
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
export class MotionPointerAngular {
  protected readonly level = signal(0.6);
}
