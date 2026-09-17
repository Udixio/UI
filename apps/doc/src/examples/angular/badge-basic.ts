import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Fab, NavigationRail, NavigationRailItem } from '@udixio/ui-angular';
import { iAdd } from '@udixio/icons-rounded-400/add';
import { iHome } from '@udixio/icons-rounded-400/home';
import { iInbox } from '@udixio/icons-rounded-400/inbox';
import { iChat } from '@udixio/icons-rounded-400/chat';
import { iNotifications } from '@udixio/icons-rounded-400/notifications';

@Component({
  selector: 'docs-badge-basic-angular',
  standalone: true,
  imports: [Fab, NavigationRail, NavigationRailItem],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <udx-navigation-rail
      class="bg-surface-container-highest h-[420px]"
      [selectedItem]="selected()"
      (selectedItemChange)="view($event)"
    >
      <udx-fab label="New message" [icon]="add" (click)="receive()" />
      <udx-navigation-rail-item [icon]="home" [iconSelected]="home" label="Home" />
      <udx-navigation-rail-item
        [icon]="inbox"
        [iconSelected]="inbox"
        label="Inbox"
        [badge]="
          unread().inbox
            ? { label: unread().inbox, description: unread().inbox + ' unread messages' }
            : undefined
        "
      />
      <udx-navigation-rail-item
        [icon]="chat"
        [iconSelected]="chat"
        label="Chat"
        [badge]="unread().chat ? { description: 'New activity' } : undefined"
      />
      <udx-navigation-rail-item
        [icon]="notifications"
        [iconSelected]="notifications"
        label="Alerts"
        [badge]="
          unread().notifications
            ? {
                label: unread().notifications,
                max: 999,
                description: '999 or more notifications',
              }
            : undefined
        "
      />
    </udx-navigation-rail>
  `,
})
export class BadgeBasicAngular {
  protected readonly add = iAdd;
  protected readonly home = iHome;
  protected readonly inbox = iInbox;
  protected readonly chat = iChat;
  protected readonly notifications = iNotifications;

  protected readonly selected = signal<number | null>(0);
  // What each destination has waiting. Material recommends clearing a badge
  // once its destination has been viewed, so selecting an item removes it;
  // the badge animates out, and back in when a message arrives.
  protected readonly unread = signal({ inbox: 3, chat: true, notifications: 1000 });

  protected receive(): void {
    this.unread.update((u) => ({ ...u, inbox: u.inbox + 1 }));
  }

  protected view(index: number | null): void {
    this.selected.set(index);
    if (index === 1) this.unread.update((u) => ({ ...u, inbox: 0 }));
    if (index === 2) this.unread.update((u) => ({ ...u, chat: false }));
    if (index === 3) this.unread.update((u) => ({ ...u, notifications: 0 }));
  }
}
