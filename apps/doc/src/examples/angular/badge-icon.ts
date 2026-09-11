import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Badge, Icon } from '@udixio/ui-angular';
import { iInbox } from '@udixio/icons-rounded-400/inbox';
import { iNotifications } from '@udixio/icons-rounded-400/notifications';

@Component({
  selector: 'docs-badge-icon-angular',
  standalone: true,
  imports: [Badge, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-wrap items-center gap-10 p-8">
      <udx-icon [icon]="inbox" udxBadge udxBadgeDescription="Unread messages" />

      <udx-icon
        [icon]="inbox"
        udxBadge="3"
        udxBadgeDescription="3 unread messages"
      />

      <udx-icon
        [icon]="notifications"
        udxBadge="1000"
        udxBadgeMax="999"
        udxBadgeDescription="999 or more notifications"
      />
    </div>
  `,
})
export class BadgeIconAngular {
  protected readonly inbox = iInbox;
  protected readonly notifications = iNotifications;
}
