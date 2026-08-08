import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TextField } from '@udixio/ui-angular';
import type { TextFieldOption } from '@udixio/core';

@Component({
  selector: 'text-field-select-angular-example',
  standalone: true,
  imports: [TextField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <lib-text-field
      label="Country"
      name="country"
      type="select"
      [options]="options"
    />
  `,
})
export class TextFieldSelectAngular {
  protected readonly options: TextFieldOption[] = [
    { value: 'fr', label: 'France' },
    { value: 'de', label: 'Germany' },
    { value: 'jp', label: 'Japan' },
  ];
}
