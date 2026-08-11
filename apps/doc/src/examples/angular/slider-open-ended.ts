import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Slider } from '@udixio/ui-angular';

const marks = [
  { value: -Infinity, label: 'Min' },
  { value: 0, label: '0' },
  { value: 100, label: '100' },
  { value: Infinity, label: 'Max' },
];

@Component({
  selector: 'slider-open-ended-angular-example',
  standalone: true,
  imports: [Slider],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-72">
      <udx-slider
        name="range"
        [defaultValue]="0"
        [min]="minValue"
        [max]="maxValue"
        [marks]="marks"
        aria-label="Open-ended range"
      />
    </div>
  `,
})
export class SliderOpenEndedAngular {
  protected readonly marks = marks;
  protected readonly minValue = -Infinity;
  protected readonly maxValue = Infinity;
}
