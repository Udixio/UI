import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Checkbox } from '@udixio/ui-angular';

type Channel = 'email' | 'sms';

@Component({
  selector: 'checkbox-mixed-selection-angular-example',
  standalone: true,
  imports: [Checkbox],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-3">
      <div class="flex items-center gap-3">
        <lib-checkbox
          id="checkbox-angular-notifications"
          [checked]="allChecked"
          [indeterminate]="someChecked && !allChecked"
          (checkedChange)="setAll($event)"
        />
        <label for="checkbox-angular-notifications">Notifications</label>
      </div>
      <div class="ml-6 flex flex-col gap-3">
        <div class="flex items-center gap-3">
          <lib-checkbox
            id="checkbox-angular-email"
            [checked]="channels.email"
            (checkedChange)="setChannel('email', $event)"
          />
          <label for="checkbox-angular-email">Email</label>
        </div>
        <div class="flex items-center gap-3">
          <lib-checkbox
            id="checkbox-angular-sms"
            [checked]="channels.sms"
            (checkedChange)="setChannel('sms', $event)"
          />
          <label for="checkbox-angular-sms">SMS</label>
        </div>
      </div>
    </div>
  `,
})
export class CheckboxMixedSelectionAngular {
  protected channels: Record<Channel, boolean> = {
    email: true,
    sms: false,
  };

  protected get allChecked(): boolean {
    return Object.values(this.channels).every(Boolean);
  }

  protected get someChecked(): boolean {
    return Object.values(this.channels).some(Boolean);
  }

  protected setAll(checked: boolean): void {
    this.channels = { email: checked, sms: checked };
  }

  protected setChannel(channel: Channel, checked: boolean): void {
    this.channels = { ...this.channels, [channel]: checked };
  }
}
