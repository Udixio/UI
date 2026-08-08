import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TextField } from '@udixio/ui-angular';

@Component({
  selector: 'text-field-date-angular-example',
  standalone: true,
  imports: [TextField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<lib-text-field label="Birthday" name="birthday" type="date" />`,
})
export class TextFieldDateAngular {}
