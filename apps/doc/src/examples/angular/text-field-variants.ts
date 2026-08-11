import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TextField } from '@udixio/ui-angular';

@Component({
  selector: 'text-field-variants-angular-example',
  standalone: true,
  imports: [TextField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-wrap items-end gap-6">
      <udx-text-field label="Name" name="name" variant="filled" />
      <udx-text-field label="Name" name="name2" variant="outlined" />
    </div>
  `,
})
export class TextFieldVariantsAngular {}
