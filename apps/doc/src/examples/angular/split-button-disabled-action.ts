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
  selector: 'docs-split-button-disabled-action-angular',
  standalone: true,
  imports: [SplitButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-center gap-3">
      <p class="text-body-medium">
        Public links are disabled by this workspace’s administrator.
      </p>
      <udx-split-button
        label="Share project"
        [icon]="shareIcon"
        menuLabel="More project sharing options"
        [actions]="actions"
        variant="filled"
        size="medium"
        (primaryAction)="message.set('Share dialog requested')"
        (actionSelect)="selectAction($event)"
      />
      <p class="text-body-medium" aria-live="polite">{{ message() }}</p>
    </div>
  `,
})
export class SplitButtonDisabledActionAngular {
  protected readonly shareIcon = iShare;
  protected readonly actions: SplitButtonAction[] = [
    { id: 'copy-link', label: 'Copy public link', icon: iLink, disabled: true },
    { id: 'invite', label: 'Invite by email', icon: iMail },
    { id: 'manage', label: 'Manage access', icon: iManageAccounts },
  ];
  protected readonly message = signal('Choose how to share the project');

  protected selectAction(event: SplitButtonActionSelectEvent): void {
    this.message.set(`${event.action.label} selected`);
  }
}
