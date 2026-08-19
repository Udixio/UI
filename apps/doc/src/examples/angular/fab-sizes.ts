import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Fab } from '@udixio/ui-angular';
import { iEdit } from '@udixio/icons-rounded-400/edit';

@Component({
  selector: 'docs-fab-sizes-angular',
  standalone: true,
  imports: [Fab],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-wrap items-end justify-end gap-4">
      <udx-fab label="Small" [icon]="editIcon" size="small" />
      <udx-fab label="Medium" [icon]="editIcon" size="medium" />
      <udx-fab label="Large" [icon]="editIcon" size="large" />
    </div>
  `,
})
export class FabSizesAngular {
  protected readonly editIcon = iEdit;
}
