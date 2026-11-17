import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MotionGesture } from '@udixio/ui-angular';
import { defineGesture } from '@udixio/motion/gesture';

// A swipe: released far or fast enough, the item flies out. Delete or Backspace does the same on the focused item.
defineGesture('notification-dismiss', { kind: 'swipe', alternative: 'action' });

@Component({
  selector: 'docs-motion-gesture-angular',
  standalone: true,
  imports: [MotionGesture],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-start gap-4">
      <p class="text-body-large text-on-surface">Swiped away: {{ swiped() }}</p>
      <ul class="flex w-72 flex-col gap-2">
        @for (row of rows(); track row.id) {
          <li
            udxMotionGesture="notification-dismiss"
            (udxSwipe)="swiped.update((count) => count + 1)"
            class="rounded-xl bg-surface-container-high px-4 py-3 text-body-large text-on-surface"
          >
            {{ row.label }}
          </li>
        }
      </ul>
      <button
        type="button"
        (click)="restore()"
        class="rounded-full bg-primary px-6 py-2.5 text-label-large text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
      >
        Restore
      </button>
    </div>
  `,
})
export class MotionGestureAngular {
  protected readonly swiped = signal(0);
  private round = 0;
  protected readonly rows = signal(this.makeRows());

  // New ids render the list again, so every item is bound again.
  protected restore(): void {
    this.round += 1;
    this.swiped.set(0);
    this.rows.set(this.makeRows());
  }

  private makeRows() {
    return [1, 2, 3].map((n) => ({ id: `${this.round}-${n}`, label: `Notification ${n}` }));
  }
}
