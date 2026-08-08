import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DatePicker } from '@udixio/ui-angular';

@Component({
  selector: 'date-picker-localization-angular-example',
  standalone: true,
  imports: [DatePicker],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-wrap justify-center gap-8">
      <lib-date-picker locale="en-US" [defaultValue]="defaultDate" />
      <lib-date-picker
        locale="fr-FR"
        [weekStartDay]="1"
        [defaultValue]="defaultDate"
      />
    </div>
  `,
})
export class DatePickerLocalizationAngular {
  protected defaultDate = new Date(2024, 5, 1);
}
