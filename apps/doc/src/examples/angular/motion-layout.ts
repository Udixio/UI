import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Motion } from '@udixio/ui-angular';
import '@udixio/motion/presets';

@Component({
  selector: 'docs-motion-layout-angular',
  standalone: true,
  imports: [Motion],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div data-motion-scope class="flex w-full max-w-88 flex-col gap-3">
      <div
        udxMotion="reflow"
        [attr.data-wide]="wide() || null"
        class="w-[60%] rounded-3xl bg-primary-container px-5 py-4 text-on-primary-container data-[wide]:w-full"
      >
        Widen me
      </div>
      <div class="flex" [class.justify-end]="end()" [class.justify-start]="!end()">
        <span
          udxMotion="reflow"
          class="rounded-full bg-secondary-container px-4 py-2 text-label-large text-on-secondary-container"
        >
          Start · End
        </span>
      </div>
      <ul class="flex flex-col gap-2">
        @for (label of rows(); track label) {
          <li udxMotion="reflow" class="rounded-xl bg-surface-container-high px-4 py-3 text-body-large text-on-surface">
            {{ label }}
          </li>
        }
      </ul>
      <div class="flex flex-wrap gap-2">
        <button type="button" (click)="wide.update((value) => !value)" class="rounded-full bg-primary px-5 py-2 text-label-large text-on-primary">
          Widen
        </button>
        <button type="button" (click)="end.update((value) => !value)" class="rounded-full bg-secondary-container px-5 py-2 text-label-large text-on-secondary-container">
          Start · End
        </button>
        <button type="button" (click)="shuffle()" class="rounded-full bg-secondary-container px-5 py-2 text-label-large text-on-secondary-container">
          Shuffle
        </button>
      </div>
    </div>
  `,
})
export class MotionLayoutAngular {
  protected readonly wide = signal(false);
  protected readonly end = signal(false);
  protected readonly rows = signal(['Build', 'Review', 'Release']);

  protected shuffle(): void {
    this.rows.update((list) => [...list].sort(() => Math.random() - 0.5));
  }
}
