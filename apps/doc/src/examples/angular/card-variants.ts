import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Card } from '@udixio/ui-angular';

@Component({
  selector: 'docs-card-variants-angular',
  standalone: true,
  imports: [Card],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex w-full flex-wrap gap-4">
      <udx-card
        className="flex h-40 min-w-48 flex-1 items-center justify-center"
      >
        <p>Outlined</p>
      </udx-card>
      <udx-card
        variant="elevated"
        className="flex h-40 min-w-48 flex-1 items-center justify-center"
      >
        <p>Elevated</p>
      </udx-card>
      <udx-card
        variant="filled"
        className="flex h-40 min-w-48 flex-1 items-center justify-center"
      >
        <p>Filled</p>
      </udx-card>
    </div>
  `,
})
export class CardVariantsAngular {}
