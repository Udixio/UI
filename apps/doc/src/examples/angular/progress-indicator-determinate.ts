import {
  ChangeDetectionStrategy,
  Component,
  type OnDestroy,
  type OnInit,
  signal,
} from '@angular/core';
import { ProgressIndicator } from '@udixio/ui-angular';

@Component({
  selector: 'docs-progress-indicator-determinate-angular',
  standalone: true,
  imports: [ProgressIndicator],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center gap-6">
      <lib-progress-indicator
        variant="linear-determinate"
        [value]="value()"
        [transitionDuration]="300"
        aria-label="Download progress"
        className="w-48"
      />
      <lib-progress-indicator
        variant="circular-determinate"
        [value]="value()"
        [transitionDuration]="300"
        aria-label="Download progress"
      />
    </div>
  `,
})
export class ProgressIndicatorDeterminateAngular implements OnInit, OnDestroy {
  protected readonly value = signal(0);
  private intervalId?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.intervalId = setInterval(() => {
      this.value.update((previous) => (previous >= 100 ? 0 : previous + 20));
    }, 1000);
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalId);
  }
}
