import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Menu, MenuGroup, MenuHeadline, MenuItem } from '@udixio/ui-angular';

@Component({
  selector: 'docs-menu-family-angular',
  standalone: true,
  imports: [Menu, MenuGroup, MenuHeadline, MenuItem],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <udx-menu accessibleLabel="Editor actions">
      <udx-menu-group>
        <udx-menu-headline label="Document" />
        <udx-menu-item label="Copy" />
        <udx-menu-item label="Paste" disabled />
      </udx-menu-group>
      <udx-menu-group label="View">
        <udx-menu-item
          label="Compact mode"
          selectionType="multiple"
          [selected]="compact()"
          (selectedChange)="compact.set($event)"
        />
      </udx-menu-group>
    </udx-menu>
  `,
})
export class MenuFamilyAngular {
  protected readonly compact = signal(false);
}
