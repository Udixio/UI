import '@angular/compiler';
import { Component } from '@angular/core';
import { ProgressIndicator } from '../../src/lib/progress-indicator/progress-indicator';

@Component({
  selector: 'progress-hydration-fixture',
  standalone: true,
  imports: [ProgressIndicator],
  template: `<span id="progress-name">Loading</span>
    <udx-progress-indicator
      variant="linear-indeterminate"
      aria-labelledby="progress-name"
    />
    <udx-progress-indicator
      variant="circular-indeterminate"
      aria-label="Loading circle"
    />`,
})
export class ProgressHydrationFixture {}
