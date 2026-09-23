import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconButton, Toolbar } from '@udixio/ui-angular';
import { iSettings } from '@udixio/icons-rounded-400/settings';
import { iShare } from '@udixio/icons-rounded-400/share';

@Component({
  selector: 'docs-toolbar-vibrant-angular',
  standalone: true,
  imports: [IconButton, Toolbar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <udx-toolbar
      variant="floating"
      color="vibrant"
      accessibleLabel="Presentation tools"
    >
      <udx-icon-button size="small" label="Share presentation" [icon]="shareIcon" />
      <udx-icon-button size="small" label="Presentation settings" [icon]="settingsIcon" />
    </udx-toolbar>
  `,
})
export class ToolbarVibrantAngular {
  protected readonly shareIcon = iShare;
  protected readonly settingsIcon = iSettings;
}
