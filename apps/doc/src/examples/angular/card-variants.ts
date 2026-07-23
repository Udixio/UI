import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Card } from '@udixio/ui-angular';

@Component({
  selector: 'docs-card-variants-angular',
  standalone: true,
  imports: [Card],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex w-full flex-wrap gap-4">
      <lib-card
        className="flex h-40 min-w-48 flex-1 items-center justify-center"
      >
        <p>Outlined</p>
      </lib-card>
      <lib-card
        variant="elevated"
        className="flex h-40 min-w-48 flex-1 items-center justify-center"
      >
        <p>Elevated</p>
      </lib-card>
      <lib-card
        variant="filled"
        className="flex h-40 min-w-48 flex-1 items-center justify-center"
      >
        <p>Filled</p>
      </lib-card>
    </div>
  `,
})
export class CardVariantsAngular {}
