import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Checkbox } from '@udixio/ui-angular';

@Component({
  selector: 'checkbox-states-angular-example',
  standalone: true,
  imports: [Checkbox],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid gap-3 sm:grid-cols-2">
      <div class="flex items-center gap-3">
        <lib-checkbox id="checkbox-angular-controlled" [(checked)]="checked" />
        <label for="checkbox-angular-controlled">Controlled</label>
      </div>
      <div class="flex items-center gap-3">
        <lib-checkbox id="checkbox-angular-default" defaultChecked />
        <label for="checkbox-angular-default">Default checked</label>
      </div>
      <div class="flex items-center gap-3">
        <lib-checkbox id="checkbox-angular-disabled" disabled />
        <label for="checkbox-angular-disabled">Disabled</label>
      </div>
      <div class="flex items-center gap-3">
        <lib-checkbox
          id="checkbox-angular-disabled-checked"
          defaultChecked
          disabled
        />
        <label for="checkbox-angular-disabled-checked">
          Disabled and checked
        </label>
      </div>
    </div>
  `,
})
export class CheckboxStatesAngular {
  protected checked = false;
}
