import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TextField } from '@udixio/ui-angular';
import type { TextFieldOption } from '@udixio/core';

@Component({
  selector: 'docs-menu-select-field-angular',
  standalone: true,
  imports: [TextField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full max-w-sm">
      <udx-text-field
        label="Favorite fruit"
        name="fruit"
        type="select"
        [options]="options"
        [(value)]="fruit"
      />
    </div>
  `,
})
export class MenuSelectFieldAngular {
  protected readonly fruit = signal('apple');

  protected readonly options: TextFieldOption[] = [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'orange', label: 'Orange' },
  ];
}
