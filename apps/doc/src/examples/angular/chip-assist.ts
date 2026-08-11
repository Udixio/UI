import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Chip } from '@udixio/ui-angular';
import { iAdd } from '@udixio/icons-rounded-400/add';

@Component({
  selector: 'docs-chip-assist-angular',
  standalone: true,
  imports: [Chip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <udx-chip label="Nouveau" [icon]="addIcon" (click)="createAction()" />
  `,
})
export class ChipAssistAngular {
  protected readonly addIcon = iAdd;

  protected createAction(): void {
    console.info('Nouvelle action');
  }
}
