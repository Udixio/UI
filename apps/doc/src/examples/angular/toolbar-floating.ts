import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconButton, Toolbar } from '@udixio/ui-angular';
import { iSettings } from '@udixio/icons-rounded-400/settings';
import { iShare } from '@udixio/icons-rounded-400/share';

@Component({
  selector: 'docs-toolbar-floating-angular',
  standalone: true,
  imports: [IconButton, Toolbar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <udx-toolbar variant="floating" accessibleLabel="Document tools">
      <udx-icon-button size="small" label="Share" [icon]="shareIcon" />
      <udx-icon-button size="small" label="Settings" [icon]="settingsIcon" />
    </udx-toolbar>
  `,
})
export class ToolbarFloatingAngular {
  protected readonly shareIcon = iShare;
  protected readonly settingsIcon = iSettings;
}
