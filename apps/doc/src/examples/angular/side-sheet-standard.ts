import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SideSheet } from '@udixio/ui-angular';

@Component({
  selector: 'docs-side-sheet-standard-angular',
  standalone: true,
  imports: [SideSheet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="flex h-[36rem] w-full overflow-hidden rounded-xl border border-outline"
    >
      <div class="flex-1 overflow-y-auto p-4">
        <p class="text-title-medium">Page content</p>
        <p class="text-body-medium text-on-surface-variant">
          The standard side sheet is persistent layout chrome that spans the
          full height of the page next to the content it supports, the same
          way this documentation site's own navigation sidebar does.
        </p>
      </div>
      <udx-side-sheet title="Details" position="right">
        <p class="p-4 text-body-medium text-on-surface-variant">
          Side content
        </p>
      </udx-side-sheet>
    </div>
  `,
})
export class SideSheetStandardAngular {}
