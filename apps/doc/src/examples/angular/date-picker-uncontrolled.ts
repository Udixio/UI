import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DatePicker } from '@udixio/ui-angular';
import type { DatePickerValue } from '@udixio/core';

@Component({
  selector: 'date-picker-uncontrolled-angular-example',
  standalone: true,
  imports: [DatePicker],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <udx-date-picker
      [defaultValue]="defaultDate"
      (valueChange)="log($event)"
    />
  `,
})
export class DatePickerUncontrolledAngular {
  protected defaultDate = new Date(2024, 5, 15);

  protected log(value: DatePickerValue): void {
    console.log('Selected:', value);
  }
}
