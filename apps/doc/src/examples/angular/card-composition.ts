import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Button, Card } from '@udixio/ui-angular';

@Component({
  selector: 'docs-card-composition-angular',
  standalone: true,
  imports: [Button, Card],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <udx-card variant="filled" className="w-full max-w-96">
      <img
        class="h-40 w-full object-cover"
        src="https://picsum.photos/640/240"
        alt=""
      />
      <div class="space-y-2 p-4">
        <p class="text-title-medium">Project Aurora</p>
        <p class="text-body-medium text-on-surface-variant">
          Last updated 2 days ago
        </p>
        <div class="flex gap-2 pt-2">
          <udx-button label="Open" size="small" variant="filled" />
          <udx-button
            label="Share"
            size="small"
            variant="text"
            [edgeAligned]="false"
          />
        </div>
      </div>
    </udx-card>
  `,
})
export class CardCompositionAngular {}
