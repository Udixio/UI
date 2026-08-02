import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Slider } from '@udixio/ui-angular';

@Component({
  selector: 'slider-controlled-angular-example',
  standalone: true,
  imports: [Slider],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex w-72 flex-col gap-4">
      <lib-slider
        name="brightness"
        [(value)]="value"
        [step]="10"
        aria-label="Brightness"
      />
      <p class="text-body-medium">Value: {{ value }}</p>
    </div>
  `,
})
export class SliderControlledAngular {
  protected value = 50;
}
