import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Slider } from '@udixio/ui-angular';

const marks = [
  { value: 0, label: '0' },
  { value: 25, label: '25' },
  { value: 50, label: '50' },
  { value: 75, label: '75' },
  { value: 100, label: '100' },
];

@Component({
  selector: 'slider-marks-angular-example',
  standalone: true,
  imports: [Slider],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-72">
      <lib-slider
        name="percent"
        [defaultValue]="50"
        [marks]="marks"
        aria-label="Percent"
      />
    </div>
  `,
})
export class SliderMarksAngular {
  protected readonly marks = marks;
}
