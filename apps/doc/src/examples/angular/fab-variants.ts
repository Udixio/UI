import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Fab } from '@udixio/ui-angular';
import { iAdd } from '@udixio/icons-rounded-400/add';

@Component({
  selector: 'docs-fab-variants-angular',
  standalone: true,
  imports: [Fab],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid grid-cols-3 items-end justify-items-end gap-4">
      <udx-fab label="Primary" [icon]="addIcon" variant="primary" extended />
      <udx-fab
        label="Secondary"
        [icon]="addIcon"
        variant="secondary"
        extended
      />
      <udx-fab label="Tertiary" [icon]="addIcon" variant="tertiary" extended />
      <udx-fab
        label="Primary container"
        [icon]="addIcon"
        variant="primaryContainer"
        extended
      />
      <udx-fab
        label="Secondary container"
        [icon]="addIcon"
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
  `,
})
export class FabVariantsAngular {
  protected readonly addIcon = iAdd;
}
