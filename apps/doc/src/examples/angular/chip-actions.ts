import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Chip } from '@udixio/ui-angular';

@Component({
  selector: 'docs-chip-actions-angular',
  standalone: true,
  imports: [Chip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-wrap gap-3">
      <udx-chip label="Action" (click)="runAction()" />
      <udx-chip label="Documentation" href="/components/chip" />
    </div>
  `,
})
export class ChipActionsAngular {
  protected runAction(): void {
    console.info('Action');
  }
}
