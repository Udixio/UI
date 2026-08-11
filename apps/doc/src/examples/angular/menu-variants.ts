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
      <udx-menu accessibleLabel="Standard actions">
        <udx-menu-headline label="Standard" />
        <udx-menu-item label="Copy" [leadingIcon]="copyIcon" />
        <udx-menu-item
          label="Settings"
          [leadingIcon]="settingsIcon"
          [trailingIcon]="chevronRightIcon"
        />
        <udx-menu-item label="Delete" [leadingIcon]="deleteIcon" disabled />
      </udx-menu>

      <udx-menu accessibleLabel="Vibrant actions" variant="vibrant">
        <udx-menu-headline label="Vibrant" />
        <udx-menu-item label="Copy" [leadingIcon]="copyIcon" />
        <udx-menu-item
          label="Settings"
          [leadingIcon]="settingsIcon"
          [trailingIcon]="chevronRightIcon"
        />
        <udx-menu-item label="Delete" [leadingIcon]="deleteIcon" disabled />
      </udx-menu>
    </div>
  `,
})
export class MenuVariantsAngular {
  protected readonly chevronRightIcon = iChevronRight;
  protected readonly copyIcon = iContentCopy;
  protected readonly deleteIcon = iDelete;
  protected readonly settingsIcon = iSettings;
}
