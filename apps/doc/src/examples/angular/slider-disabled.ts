import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Slider } from '@udixio/ui-angular';

@Component({
  selector: 'slider-disabled-angular-example',
  standalone: true,
  imports: [Slider],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-72">
      <lib-slider
        name="volume"
        [defaultValue]="40"
        [step]="10"
        [disabled]="true"
        aria-label="Volume (disabled)"
      />
    </div>
  `,
})
export class SliderDisabledAngular {}
