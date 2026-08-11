import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ContextMenu, MenuItem } from '@udixio/ui-angular';

@Component({
  selector: 'docs-context-menu-angular',
  standalone: true,
  imports: [ContextMenu, MenuItem],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <udx-context-menu accessibleLabel="Document actions">
      <button
        contextMenuTrigger
        class="rounded-xl border border-outline px-6 py-4"
      >
        Right-click or press Shift+F10
      </button>
      <udx-menu-item label="Rename" />
      <udx-menu-item label="Duplicate" />
      <udx-menu-item label="Delete" />
    </udx-context-menu>
  `,
})
export class ContextMenuAngular {}
