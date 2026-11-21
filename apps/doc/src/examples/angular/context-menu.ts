import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  Button,
  ContextMenu,
  MenuGroup,
  MenuHeadline,
  MenuItem,
} from '@udixio/ui-angular';

@Component({
  selector: 'docs-context-menu-angular',
  standalone: true,
  imports: [Button, ContextMenu, MenuGroup, MenuHeadline, MenuItem],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-wrap gap-3">
      <udx-context-menu accessibleLabel="Simple document actions">
        <udx-button
          contextMenuTrigger
          variant="outlined"
          size="small"
          label="Simple actions"
        />
        <udx-menu-item label="Rename" />
        <udx-menu-item label="Duplicate" />
        <udx-menu-item label="Delete" />
      </udx-context-menu>

      <udx-context-menu accessibleLabel="Grouped document actions">
        <udx-button
          contextMenuTrigger
          variant="outlined"
          size="small"
          label="Grouped actions"
        />
        <udx-menu-group>
          <udx-menu-headline label="Document" />
          <udx-menu-item label="Rename" />
          <udx-menu-item label="Duplicate" />
        </udx-menu-group>
        <udx-menu-group label="View">
          <udx-menu-item label="Open preview" />
          <udx-menu-item label="Show details" />
        </udx-menu-group>
      </udx-context-menu>

      <udx-context-menu accessibleLabel="Many document actions">
        <udx-button
          contextMenuTrigger
          variant="outlined"
          size="small"
          label="Long actions"
        />
        @for (label of scrollableActions; track label) {
          <udx-menu-item [label]="label" />
        }
      </udx-context-menu>
    </div>
  `,
})
export class ContextMenuAngular {
  protected readonly scrollableActions = [
    'Rename',
    'Duplicate',
    'Move to folder',
    'Make available offline',
    'Add to favorites',
    'Share',
    'Download',
    'Archive',
    'Delete',
  ];
}
