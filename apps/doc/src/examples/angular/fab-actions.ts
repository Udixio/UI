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
    <div class="grid w-full gap-8">
      <section class="grid gap-3">
        <h3 class="text-title-medium">Color families</h3>
        <div class="flex flex-wrap items-end gap-4">
          <lib-fab label="Primary" [icon]="addIcon" variant="primary" />
          <lib-fab label="Secondary" [icon]="shareIcon" variant="secondary" />
          <lib-fab label="Tertiary" [icon]="addIcon" variant="tertiary" />
          <lib-fab
            label="Primary container"
            [icon]="addIcon"
            variant="primaryContainer"
            extended
          />
          <lib-fab
            label="Secondary container"
            [icon]="shareIcon"
            variant="secondaryContainer"
            extended
          />
          <lib-fab
            label="Tertiary container"
            [icon]="addIcon"
            variant="tertiaryContainer"
            extended
          />
        </div>
      </section>

      <section class="grid gap-3">
        <h3 class="text-title-medium">Sizes and states</h3>
        <div class="flex flex-wrap items-end gap-4">
          <lib-fab label="Small" [icon]="addIcon" size="small" />
          <lib-fab label="Medium" [icon]="addIcon" size="medium" />
          <lib-fab label="Large" [icon]="addIcon" size="large" />
          <lib-fab label="Disabled action" [icon]="addIcon" disabled extended />
        </div>
      </section>
    </div>
  `,
})
export class FabActionsAngular {
  protected readonly addIcon = iAdd;
  protected readonly shareIcon = iShare;
}
