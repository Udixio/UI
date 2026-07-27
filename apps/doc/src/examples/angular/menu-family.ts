import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Menu, MenuGroup, MenuHeadline, MenuItem } from '@udixio/ui-angular';

@Component({
  selector: 'docs-menu-family-angular',
  standalone: true,
  imports: [Menu, MenuGroup, MenuHeadline, MenuItem],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <lib-menu accessibleLabel="Editor actions">
      <lib-menu-group>
        <lib-menu-headline label="Document" />
        <lib-menu-item label="Copy" />
        <lib-menu-item label="Paste" disabled />
      </lib-menu-group>
      <lib-menu-group label="View">
        <lib-menu-item
          label="Compact mode"
          selectionType="multiple"
          [selected]="compact()"
          (selectedChange)="compact.set($event)"
        />
      </lib-menu-group>
    </lib-menu>
  `,
})
export class MenuFamilyAngular {
  protected readonly compact = signal(false);
}
