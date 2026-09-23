import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconButton, Toolbar } from '@udixio/ui-angular';
import { iAdd } from '@udixio/icons-rounded-400/add';
import { iSettings } from '@udixio/icons-rounded-400/settings';
import { iShare } from '@udixio/icons-rounded-400/share';

@Component({
  selector: 'docs-toolbar-vertical-angular',
  standalone: true,
  imports: [IconButton, Toolbar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="flex min-h-72 w-full items-center justify-end rounded-2xl border border-outline bg-surface-container-low p-6"
    >
      <div class="flex items-center gap-4">
        <div class="max-w-48">
          <p class="text-title-medium">Quick actions</p>
          <p class="text-body-small text-on-surface-variant">
            Use this spacious arrangement for contextual actions.
          </p>
        </div>
        <udx-toolbar
          variant="floating"
          orientation="vertical"
          accessibleLabel="Quick actions"
        >
          <udx-icon-button size="small" label="Add" [icon]="addIcon" />
          <udx-icon-button size="small" label="Share" [icon]="shareIcon" />
          <udx-icon-button size="small" label="Settings" [icon]="settingsIcon" />
        </udx-toolbar>
      </div>
    </div>
  `,
})
export class ToolbarVerticalAngular {
  protected readonly addIcon = iAdd;
  protected readonly shareIcon = iShare;
  protected readonly settingsIcon = iSettings;
}
