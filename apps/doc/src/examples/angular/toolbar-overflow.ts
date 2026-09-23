import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Toolbar } from '@udixio/ui-angular';
import { iContentCopy } from '@udixio/icons-rounded-400/content_copy';
import { iDelete } from '@udixio/icons-rounded-400/delete';
import { iRedo } from '@udixio/icons-rounded-400/redo';
import { iSettings } from '@udixio/icons-rounded-400/settings';
import { iShare } from '@udixio/icons-rounded-400/share';
import { iUndo } from '@udixio/icons-rounded-400/undo';

const actions = [
  { id: 'undo', label: 'Undo', icon: iUndo },
  { id: 'redo', label: 'Redo', icon: iRedo },
  { id: 'copy', label: 'Copy formatting', icon: iContentCopy },
  { id: 'share', label: 'Share', icon: iShare },
  { id: 'settings', label: 'Editor settings', icon: iSettings },
  { id: 'delete', label: 'Delete draft', icon: iDelete },
];

@Component({
  selector: 'docs-toolbar-overflow-angular',
  standalone: true,
  imports: [Toolbar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <udx-toolbar
      variant="floating"
      accessibleLabel="Editing actions"
      [actions]="actions"
      [maxVisible]="3"
      [more]="moreOptions"
    />
  `,
})
export class ToolbarOverflowAngular {
  protected readonly actions = actions;
  protected readonly moreOptions = { label: 'More editing actions' };
}
