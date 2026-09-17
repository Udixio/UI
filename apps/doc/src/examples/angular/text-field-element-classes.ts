import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TextField } from '@udixio/ui-angular';

@Component({
  selector: 'text-field-element-classes-angular-example',
  standalone: true,
  imports: [TextField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-wrap items-end gap-6">
      <udx-text-field label="Name" name="name" class="w-72" />
      <udx-text-field
        label="Code"
        name="code"
        supportingText="Uppercase letters only"
        [classes]="{ input: 'uppercase tracking-widest', supportingText: 'italic' }"
      />
    </div>
  `,
})
export class TextFieldElementClassesAngular {}
