import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Menu, MenuItem, MenuSubmenu } from '@udixio/ui-angular';
import { iContentCopy } from '@udixio/icons-rounded-400/content_copy';

@Component({
  selector: 'docs-menu-submenus-angular',
  standalone: true,
  imports: [Menu, MenuItem, MenuSubmenu],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <udx-menu accessibleLabel="Document actions">
      <udx-menu-item label="Duplicate" [leadingIcon]="copyIcon" />
      <udx-menu-item label="Rename" />
      <udx-menu-submenu label="Share">
        <udx-menu-item label="Copy link" />
        <udx-menu-item label="Send by email" />
        <udx-menu-submenu label="More options">
          <udx-menu-item label="Export" />
          <udx-menu-item label="Publish" />
        </udx-menu-submenu>
      </udx-menu-submenu>
      <udx-menu-item label="Move to trash" />
    </udx-menu>
  `,
})
export class MenuSubmenusAngular {
  protected readonly copyIcon = iContentCopy;
}
