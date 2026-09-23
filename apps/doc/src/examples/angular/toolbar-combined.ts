import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconButton, Toolbar } from '@udixio/ui-angular';
import { iAdd } from '@udixio/icons-rounded-400/add';
import { iContentCopy } from '@udixio/icons-rounded-400/content_copy';
import { iDelete } from '@udixio/icons-rounded-400/delete';
import { iRedo } from '@udixio/icons-rounded-400/redo';
import { iSettings } from '@udixio/icons-rounded-400/settings';
import { iShare } from '@udixio/icons-rounded-400/share';
import { iUndo } from '@udixio/icons-rounded-400/undo';

@Component({
  selector: 'docs-toolbar-combined-angular',
  standalone: true,
  imports: [IconButton, Toolbar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="relative flex min-h-96 w-full flex-col overflow-hidden rounded-2xl border border-outline bg-surface-container-low"
    >
      <div class="relative flex flex-1 items-center justify-center p-6">
        <div class="max-w-72 text-center">
          <p class="text-title-medium">Document canvas</p>
          <p class="text-body-medium text-on-surface-variant">
            Keep each toolbar responsible for a distinct action group.
          </p>
        </div>
        <udx-toolbar
          variant="floating"
          class="absolute left-1/2 top-6 -translate-x-1/2"
          accessibleLabel="Selection actions"
        >
          <udx-icon-button size="small" label="Undo selection" [icon]="undoIcon" />
          <udx-icon-button size="small" label="Redo selection" [icon]="redoIcon" />
          <udx-icon-button size="small" label="Copy selection" [icon]="copyIcon" />
          <udx-icon-button size="small" label="Delete selection" [icon]="deleteIcon" />
        </udx-toolbar>
      </div>
      <udx-toolbar accessibleLabel="Document actions">
        <udx-icon-button size="small" label="Add page" [icon]="addIcon" />
        <udx-icon-button size="small" label="Share document" [icon]="shareIcon" />
        <udx-icon-button size="small" label="Document settings" [icon]="settingsIcon" />
        <udx-icon-button size="small" label="Delete page" [icon]="deleteIcon" />
      </udx-toolbar>
    </div>
  `,
})
export class ToolbarCombinedAngular {
  protected readonly addIcon = iAdd;
  protected readonly copyIcon = iContentCopy;
  protected readonly deleteIcon = iDelete;
  protected readonly redoIcon = iRedo;
  protected readonly settingsIcon = iSettings;
  protected readonly shareIcon = iShare;
  protected readonly undoIcon = iUndo;
}
