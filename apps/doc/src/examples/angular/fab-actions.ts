import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Fab } from '@udixio/ui-angular';
import { iAdd } from '@udixio/icons-rounded-400/add';
import { iShare } from '@udixio/icons-rounded-400/share';

@Component({
  selector: 'docs-fab-actions-angular',
  standalone: true,
  imports: [Fab],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-wrap items-end gap-4">
      <lib-fab label="Create" [icon]="addIcon" />
      <lib-fab label="Share" [icon]="shareIcon" extended variant="secondary" />
      <lib-fab label="Disabled action" [icon]="addIcon" disabled />
    </div>
  `,
})
export class FabActionsAngular {
  protected readonly addIcon = iAdd;
  protected readonly shareIcon = iShare;
}
