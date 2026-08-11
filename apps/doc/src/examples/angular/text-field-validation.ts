import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TextField } from '@udixio/ui-angular';

@Component({
  selector: 'text-field-validation-angular-example',
  standalone: true,
  imports: [TextField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-2">
      <udx-text-field
        label="Username"
        name="u1"
        supportingText="Use 3–16 characters"
      />
      <udx-text-field
        label="Password"
        name="p1"
        type="password"
        errorText="Password is too short"
      />
    </div>
  `,
})
export class TextFieldValidationAngular {}
