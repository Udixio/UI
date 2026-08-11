import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Chip } from '@udixio/ui-angular';

@Component({
  selector: 'docs-chip-editing-angular',
  standalone: true,
  imports: [Chip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <udx-chip [label]="label()" editable (editCommit)="label.set($event)" />
  `,
})
export class ChipEditingAngular {
  protected readonly label = signal('Double-cliquez pour modifier');
}
