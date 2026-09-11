import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Badge, Icon, IconButton } from '@udixio/ui-angular';
import { iInbox } from '@udixio/icons-rounded-400/inbox';
import { iNotifications } from '@udixio/icons-rounded-400/notifications';

@Component({
  selector: 'docs-badge-basic-angular',
  standalone: true,
  imports: [Badge, Icon, IconButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-wrap items-center gap-10 p-8">
      <udx-badge description="Unread messages">
        <udx-icon [icon]="inbox" />
      </udx-badge>

      <udx-badge [label]="3" description="3 unread messages">
        <udx-icon [icon]="inbox" />
      </udx-badge>

      <udx-badge
        [label]="1000"
        [max]="999"
        description="999 or more notifications"
      >
        <udx-icon [icon]="notifications" />
      </udx-badge>

      <udx-badge [label]="7" description="7 unread messages">
        <udx-icon-button label="Inbox" [icon]="inbox" />
      </udx-badge>
    </div>
  `,
})
export class BadgeBasicAngular {
  protected readonly inbox = iInbox;
  protected readonly notifications = iNotifications;
}
