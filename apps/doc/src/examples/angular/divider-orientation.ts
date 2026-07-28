import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Divider } from '@udixio/ui-angular';

@Component({
  selector: 'docs-divider-orientation-angular',
  standalone: true,
  imports: [Divider],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center gap-4">
      <div>
        <p>Section A</p>
        <lib-divider />
        <p>Section B</p>
      </div>
      <lib-divider orientation="vertical" className="h-12" />
      <div>
        <p>Section C</p>
      </div>
    </div>
  `,
})
export class DividerOrientationAngular {}
