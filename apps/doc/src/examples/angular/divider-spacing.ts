import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Divider } from '@udixio/ui-angular';

@Component({
  selector: 'docs-divider-spacing-angular',
  standalone: true,
  imports: [Divider],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <div>
        <p class="mb-2">Tight spacing</p>
        <udx-divider className="my-1" />
      </div>
      <div>
        <p class="mb-2">Wide spacing</p>
        <udx-divider className="my-6" />
      </div>
      <div class="flex items-center gap-4">
        <span>Left</span>
        <udx-divider orientation="vertical" className="h-8" />
        <span>Right</span>
      </div>
    </div>
  `,
})
export class DividerSpacingAngular {}
