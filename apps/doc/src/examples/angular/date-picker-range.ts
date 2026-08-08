import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DatePicker } from '@udixio/ui-angular';
import type { DateRange } from '@udixio/core';

@Component({
  selector: 'date-picker-range-angular-example',
  standalone: true,
  imports: [DatePicker],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-center gap-4">
      <lib-date-picker mode="range" [(value)]="range" />
      <p class="text-body-medium text-center">
        Start: {{ start()?.toLocaleDateString() ?? '-' }}
        <br />
        End: {{ end()?.toLocaleDateString() ?? '-' }}
      </p>
    </div>
  `,
})
export class DatePickerRangeAngular {
  protected range: DateRange | null = [
    new Date(2024, 5, 10),
    new Date(2024, 5, 20),
  ];

  protected start(): Date | null {
    return this.range?.[0] ?? null;
  }

  protected end(): Date | null {
    return this.range?.[1] ?? null;
  }
}
