import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Menu, MenuHeadline, MenuItem } from '@udixio/ui-angular';
import { iContentCopy } from '@udixio/icons-rounded-400/content_copy';
import { iOpenInNew } from '@udixio/icons-rounded-400/open_in_new';

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
          label="Open API reference"
          href="/components/menu/api"
          target="_blank"
          [trailingIcon]="openInNewIcon"
        />
        <udx-menu-item label="Delete" disabled />
      </udx-menu>

      <udx-menu accessibleLabel="Vibrant actions" variant="vibrant">
        <udx-menu-headline label="Vibrant" />
        <udx-menu-item label="Copy" [leadingIcon]="copyIcon" />
        <udx-menu-item
          label="Open API reference"
          href="/components/menu/api"
          target="_blank"
          [trailingIcon]="openInNewIcon"
        />
        <udx-menu-item label="Delete" disabled />
      </udx-menu>
    </div>
  `,
})
export class MenuVariantsAngular {
  protected readonly copyIcon = iContentCopy;
  protected readonly openInNewIcon = iOpenInNew;
}
