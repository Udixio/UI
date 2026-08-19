import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Button, Fab } from '@udixio/ui-angular';
import { iEdit } from '@udixio/icons-rounded-400/edit';

@Component({
  selector: 'docs-fab-extended-angular',
  standalone: true,
  imports: [Button, Fab],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-end gap-6">
      <udx-button
        [label]="extended() ? 'Collapse the fab' : 'Extend the fab'"
        variant="outlined"
        (click)="extended.set(!extended())"
      />
      <udx-fab label="Compose" [icon]="editIcon" [extended]="extended()" />
    </div>
  `,
})
export class FabExtendedAngular {
  protected readonly extended = signal(true);
  protected readonly editIcon = iEdit;
}
