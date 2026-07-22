import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Button } from '@udixio/ui-angular';

@Component({
  selector: 'docs-button-toggle-angular',
  standalone: true,
  imports: [Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <lib-button
      label="Notifications"
      toggleable
      [pressed]="pressed()"
      (pressedChange)="pressed.set($event)"
      variant="tonal"
    />
  `,
})
export class ButtonToggleAngular {
  protected readonly pressed = signal(false);
}
