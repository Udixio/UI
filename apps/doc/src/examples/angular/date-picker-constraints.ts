import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DatePicker } from '@udixio/ui-angular';

@Component({
  selector: 'date-picker-constraints-angular-example',
  standalone: true,
  imports: [DatePicker],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-center gap-8">
      <udx-date-picker
        [minDate]="minDate"
        [maxDate]="maxDate"
        [defaultValue]="defaultDate"
      />
      <udx-date-picker
        [shouldDisableDate]="isWeekend"
        [defaultValue]="defaultDate"
      />
    </div>
  `,
})
export class DatePickerConstraintsAngular {
  protected minDate = new Date(2024, 0, 1);
  protected maxDate = new Date(2024, 11, 31);
  protected defaultDate = new Date(2024, 5, 1);

  protected isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6;
  }
}
