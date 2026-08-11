import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Slider } from '@udixio/ui-angular';

@Component({
  selector: 'slider-basic-angular-example',
  standalone: true,
  imports: [Slider],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex w-72 flex-col gap-4">
      <udx-slider
        name="volume"
        [defaultValue]="30"
        [step]="10"
        (valueChange)="value = $event"
        aria-label="Volume"
      />
      <p class="text-body-medium">Value: {{ value }}</p>
    </div>
  `,
})
export class SliderBasicAngular {
  protected value = 30;
}
