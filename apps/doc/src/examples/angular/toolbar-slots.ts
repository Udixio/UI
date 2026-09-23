import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Button, IconButton, Toolbar } from '@udixio/ui-angular';
import { iAdd } from '@udixio/icons-rounded-400/add';
import { iShare } from '@udixio/icons-rounded-400/share';

@Component({
  selector: 'docs-toolbar-slots-angular',
  standalone: true,
  imports: [Button, IconButton, Toolbar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <udx-toolbar accessibleLabel="Project actions">
      <udx-button
        label="Publish"
        variant="filled"
        size="small"
        class="min-h-12"
      />
      <udx-icon-button size="small" label="Add" [icon]="addIcon" />
      <udx-icon-button size="small" label="Share" [icon]="shareIcon" />
      <img
        class="size-12 rounded-full object-cover"
        src="https://picsum.photos/seed/udixio-toolbar/48/48"
        alt="Project avatar"
      />
    </udx-toolbar>
  `,
})
export class ToolbarSlotsAngular {
  protected readonly addIcon = iAdd;
  protected readonly shareIcon = iShare;
}
