import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TextField } from '@udixio/ui-angular';

@Component({
  selector: 'text-field-controlled-angular-example',
  standalone: true,
  imports: [TextField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-3">
      <lib-text-field label="Controlled" name="c1" [(value)]="value" />
      <lib-text-field
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
