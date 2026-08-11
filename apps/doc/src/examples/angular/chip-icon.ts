import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Chip } from '@udixio/ui-angular';
import { iAdd } from '@udixio/icons-rounded-400/add';

@Component({
  selector: 'docs-chip-icon-angular',
  standalone: true,
  imports: [Chip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<udx-chip label="Ajouter" [icon]="addIcon" />`,
})
export class ChipIconAngular {
  protected readonly addIcon = iAdd;
}
