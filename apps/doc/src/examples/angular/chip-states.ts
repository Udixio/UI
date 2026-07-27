import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Chip } from '@udixio/ui-angular';

@Component({
  selector: 'docs-chip-states-angular',
  standalone: true,
  imports: [Chip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<lib-chip
    label="Photos"
    [selected]="selected()"
    (selectedChange)="selected.set($event)"
  />`,
})
export class ChipStatesAngular {
  protected readonly selected = signal(false);
}
