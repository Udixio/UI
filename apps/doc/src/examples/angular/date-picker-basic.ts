import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DatePicker } from '@udixio/ui-angular';

@Component({
  selector: 'date-picker-basic-angular-example',
  standalone: true,
  imports: [DatePicker],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-center gap-4">
      <udx-date-picker [(value)]="date" />
      <p class="text-body-medium">
        Selected: {{ date ? date.toLocaleDateString() : '-' }}
      </p>
    </div>
  `,
})
export class DatePickerBasicAngular {
  protected date: Date | null = new Date();
}
