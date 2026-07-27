import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ContextMenu, MenuItem } from '@udixio/ui-angular';

@Component({
  selector: 'docs-context-menu-angular',
  standalone: true,
  imports: [ContextMenu, MenuItem],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <lib-context-menu accessibleLabel="Document actions">
      <button
        contextMenuTrigger
        class="rounded-xl border border-outline px-6 py-4"
      >
        Right-click or press Shift+F10
      </button>
      <lib-menu-item label="Rename" />
      <lib-menu-item label="Duplicate" />
      <lib-menu-item label="Delete" />
    </lib-context-menu>
  `,
})
export class ContextMenuAngular {}
