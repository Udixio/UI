import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Button, Motion } from '@udixio/ui-angular';
import '@udixio/motion/presets';

@Component({
  selector: 'docs-motion-shared-angular',
  standalone: true,
  imports: [Button, Motion],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex w-full flex-col gap-4">
      <div class="grid grid-cols-3 gap-3">
        @for (id of photos; track id) {
          @if (open() !== id) {
            <button
              type="button"
              udxMotion="reflow"
              [udxMotionShared]="'photo-' + id"
              (click)="open.set(id)"
              class="rounded-2xl bg-primary-container p-6 text-label-large text-on-primary-container"
            >
              Photo {{ id }}
            </button>
          }
        }
      </div>
      @if (open(); as id) {
        <div
          udxMotion="reflow"
          [udxMotionShared]="'photo-' + id"
          class="flex flex-col items-start gap-3 rounded-3xl bg-primary p-6 text-on-primary"
        >
          <p class="text-headline-small">Photo {{ id }}</p>
          <udx-button size="small" variant="tonal" label="Close" (click)="open.set(null)" />
        </div>
      }
    </div>
  `,
})
export class MotionSharedAngular {
  protected readonly photos = [1, 2, 3];
  protected readonly open = signal<number | null>(null);
}
