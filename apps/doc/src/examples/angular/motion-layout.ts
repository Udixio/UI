import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Motion } from '@udixio/ui-angular';
import '@udixio/motion/presets';

@Component({
  selector: 'docs-motion-layout-angular',
  standalone: true,
  imports: [Motion],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-start gap-4">
      <button
        type="button"
        (click)="rotate()"
        class="rounded-full bg-primary px-6 py-2.5 text-label-large text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
      >
        Move first to end
      </button>
      <ul class="flex w-64 flex-col gap-2">
        @for (label of rows(); track label) {
          <li udxMotion="reflow" class="rounded-xl bg-surface-container-high px-4 py-3 text-body-large text-on-surface">
            {{ label }}
          </li>
        }
      </ul>
    </div>
  `,
})
export class MotionLayoutAngular {
  protected readonly rows = signal(['One', 'Two', 'Three']);

  protected rotate(): void {
    this.rows.update(([first, ...rest]) => [...rest, first]);
  }
}
