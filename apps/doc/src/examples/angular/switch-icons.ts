import { ChangeDetectionStrategy, Component } from '@angular/core';
import { iDarkMode } from '@udixio/icons-rounded-400/dark_mode';
import { iLightMode } from '@udixio/icons-rounded-400/light_mode';
import { Switch } from '@udixio/ui-angular';

@Component({
  selector: 'switch-icons-angular-example',
  standalone: true,
  imports: [Switch],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <udx-switch
      aria-label="Theme"
      [(checked)]="checked"
      [activeIcon]="lightIcon"
      [inactiveIcon]="darkIcon"
    />
  `,
})
export class SwitchIconsAngular {
  protected checked = true;
  protected readonly lightIcon = iLightMode;
  protected readonly darkIcon = iDarkMode;
}
