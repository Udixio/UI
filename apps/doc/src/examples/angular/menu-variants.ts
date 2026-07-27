import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Menu, MenuHeadline, MenuItem } from '@udixio/ui-angular';
import { iChevronRight } from '@udixio/icons-rounded-400/chevron_right';
import { iContentCopy } from '@udixio/icons-rounded-400/content_copy';
import { iDelete } from '@udixio/icons-rounded-400/delete';
import { iSettings } from '@udixio/icons-rounded-400/settings';

@Component({
  selector: 'docs-menu-variants-angular',
  standalone: true,
  imports: [Menu, MenuHeadline, MenuItem],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-wrap items-start justify-center gap-6">
      <lib-menu accessibleLabel="Standard actions">
        <lib-menu-headline label="Standard" />
        <lib-menu-item label="Copy" [leadingIcon]="copyIcon" />
        <lib-menu-item
          label="Settings"
          [leadingIcon]="settingsIcon"
          [trailingIcon]="chevronRightIcon"
        />
        <lib-menu-item label="Delete" [leadingIcon]="deleteIcon" disabled />
      </lib-menu>

      <lib-menu accessibleLabel="Vibrant actions" variant="vibrant">
        <lib-menu-headline label="Vibrant" />
        <lib-menu-item label="Copy" [leadingIcon]="copyIcon" />
        <lib-menu-item
          label="Settings"
          [leadingIcon]="settingsIcon"
          [trailingIcon]="chevronRightIcon"
        />
        <lib-menu-item label="Delete" [leadingIcon]="deleteIcon" disabled />
      </lib-menu>
    </div>
  `,
})
export class MenuVariantsAngular {
  protected readonly chevronRightIcon = iChevronRight;
  protected readonly copyIcon = iContentCopy;
  protected readonly deleteIcon = iDelete;
  protected readonly settingsIcon = iSettings;
}
