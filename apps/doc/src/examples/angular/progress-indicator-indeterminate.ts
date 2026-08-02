import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ProgressIndicator } from '@udixio/ui-angular';

@Component({
  selector: 'docs-progress-indicator-indeterminate-angular',
  standalone: true,
  imports: [ProgressIndicator],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center gap-6">
      <lib-progress-indicator
        variant="linear-indeterminate"
        aria-label="Loading"
        className="w-48"
      />
      <lib-progress-indicator
        variant="circular-indeterminate"
        aria-label="Loading"
      />
    </div>
  `,
})
export class ProgressIndicatorIndeterminateAngular {}
