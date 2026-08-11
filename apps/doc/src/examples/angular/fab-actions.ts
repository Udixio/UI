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
          <udx-fab label="Primary" [icon]="addIcon" variant="primary" />
          <udx-fab label="Secondary" [icon]="shareIcon" variant="secondary" />
          <udx-fab label="Tertiary" [icon]="addIcon" variant="tertiary" />
          <udx-fab
            label="Primary container"
            [icon]="addIcon"
            variant="primaryContainer"
            extended
          />
          <udx-fab
            label="Secondary container"
            [icon]="shareIcon"
            variant="secondaryContainer"
            extended
          />
          <udx-fab
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
          <udx-fab label="Small" [icon]="addIcon" size="small" />
          <udx-fab label="Medium" [icon]="addIcon" size="medium" />
          <udx-fab label="Large" [icon]="addIcon" size="large" />
          <udx-fab label="Disabled action" [icon]="addIcon" disabled extended />
        </div>
      </section>
    </div>
  `,
})
export class FabActionsAngular {
  protected readonly addIcon = iAdd;
  protected readonly shareIcon = iShare;
}
