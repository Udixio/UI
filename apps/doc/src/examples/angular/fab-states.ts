import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Fab } from '@udixio/ui-angular';
import { iAdd } from '@udixio/icons-rounded-400/add';

@Component({
  selector: 'docs-fab-states-angular',
  standalone: true,
  imports: [Fab],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-wrap items-end justify-end gap-4">
      <udx-fab label="Disabled action" [icon]="addIcon" disabled extended />
      <udx-fab
        label="Disabled link"
        [icon]="addIcon"
        href="/components/fab/overview"
        disabled
        extended
      />
      <udx-fab label="Disabled compact" [icon]="addIcon" disabled />
    </div>
  `,
})
export class FabStatesAngular {
  protected readonly addIcon = iAdd;
}
