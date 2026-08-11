import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TextField } from '@udixio/ui-angular';

@Component({
  selector: 'text-field-multiline-angular-example',
  standalone: true,
  imports: [TextField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-4">
      <udx-text-field label="Description" name="desc1" multiline />
      <udx-text-field
        label="Notes"
        name="desc2"
        multiline
        defaultValue="Initial content"
      />
    </div>
  `,
})
export class TextFieldMultilineAngular {}
