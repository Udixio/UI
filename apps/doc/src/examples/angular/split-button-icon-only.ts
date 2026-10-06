import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { iLink } from '@udixio/icons-rounded-400/link';
import { iMail } from '@udixio/icons-rounded-400/mail';
import { iManageAccounts } from '@udixio/icons-rounded-400/manage_accounts';
import { iShare } from '@udixio/icons-rounded-400/share';
import {
  SplitButton,
  type SplitButtonAction,
  type SplitButtonActionSelectEvent,
} from '@udixio/ui-angular';

@Component({
  selector: 'docs-split-button-icon-only-angular',
  standalone: true,
  imports: [SplitButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-center gap-3">
      <p class="text-body-medium">Project sharing</p>
      <udx-split-button
        [icon]="shareIcon"
        accessibleLabel="Share"
        menuLabel="More project sharing options"
        [actions]="actions"
        variant="tonal"
        size="medium"
        (primaryAction)="message.set('Share action requested')"
        (actionSelect)="selectAction($event)"
      />
      <p class="text-body-medium" aria-live="polite">
        {{ message() || 'Open the sharing dialog or choose a related action.' }}
      </p>
    </div>
  `,
})
export class SplitButtonIconOnlyAngular {
  protected readonly shareIcon = iShare;
  protected readonly actions: SplitButtonAction[] = [
    { id: 'copy-link', label: 'Copy project link', icon: iLink },
    { id: 'invite', label: 'Invite a teammate', icon: iMail },
    { id: 'manage', label: 'Manage project access', icon: iManageAccounts },
  ];
  protected readonly message = signal('');

  protected selectAction(event: SplitButtonActionSelectEvent): void {
    this.message.set(`${event.action.label} selected`);
  }
}
