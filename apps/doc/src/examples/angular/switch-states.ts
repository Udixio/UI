import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Switch } from '@udixio/ui-angular';

@Component({
  selector: 'switch-states-angular-example',
  standalone: true,
  imports: [Switch],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-wrap items-center gap-6">
      <udx-switch aria-label="Controlled" [(checked)]="checked" />
      <udx-switch aria-label="Default checked" defaultChecked />
      <udx-switch aria-label="Disabled" disabled />
      <udx-switch aria-label="Disabled and checked" defaultChecked disabled />
    </div>
  `,
})
export class SwitchStatesAngular {
  protected checked = false;
}
