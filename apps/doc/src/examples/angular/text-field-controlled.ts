import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TextField } from '@udixio/ui-angular';

@Component({
  selector: 'text-field-controlled-angular-example',
  standalone: true,
  imports: [TextField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-3">
      <udx-text-field label="Controlled" name="c1" [(value)]="value" />
      <udx-text-field
        label="Uncontrolled"
        name="u2"
        defaultValue="Initial value"
      />
    </div>
  `,
})
export class TextFieldControlledAngular {
  protected value = 'hello';
}
