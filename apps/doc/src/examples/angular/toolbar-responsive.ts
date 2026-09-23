import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Toolbar } from '@udixio/ui-angular';
import { iAdd } from '@udixio/icons-rounded-400/add';
import { iContentCopy } from '@udixio/icons-rounded-400/content_copy';
import { iDelete } from '@udixio/icons-rounded-400/delete';
import { iRedo } from '@udixio/icons-rounded-400/redo';
import { iSettings } from '@udixio/icons-rounded-400/settings';
import { iShare } from '@udixio/icons-rounded-400/share';
import { iUndo } from '@udixio/icons-rounded-400/undo';

const actions = [
  { id: 'undo', label: 'Undo', icon: iUndo },
  { id: 'redo', label: 'Redo', icon: iRedo },
  { id: 'copy', label: 'Copy', icon: iContentCopy },
  { id: 'share', label: 'Share', icon: iShare },
  { id: 'settings', label: 'Settings', icon: iSettings },
  { id: 'delete', label: 'Delete', icon: iDelete },
  { id: 'add', label: 'Add', icon: iAdd },
];

@Component({
  selector: 'docs-toolbar-responsive-angular',
  standalone: true,
  imports: [Toolbar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="w-full max-w-xs resize-x overflow-x-auto rounded-2xl border border-outline bg-surface-container-low"
    >
      <udx-toolbar
        accessibleLabel="Responsive editing actions"
        [actions]="actions"
        responsive
        [itemWidth]="48"
        [more]="moreOptions"
      />
      <p class="px-4 pb-3 text-body-small text-on-surface-variant">
        Resize this container to move actions into the overflow menu.
      </p>
    </div>
  `,
})
export class ToolbarResponsiveAngular {
  protected readonly actions = actions;
  protected readonly moreOptions = { label: 'More editing actions' };
}
