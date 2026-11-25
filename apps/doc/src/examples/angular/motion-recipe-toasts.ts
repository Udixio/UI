import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { Button, Motion } from '@udixio/ui-angular';
import '@udixio/motion/presets';

const LIFETIME = 4000;
const MAX = 3;

@Component({
  selector: 'docs-motion-recipe-toasts-angular',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Motion],
  template: `
    <div class="flex min-h-54 w-full max-w-80 flex-col items-start gap-4">
      <udx-button size="small" label="Save to library" (click)="save()" />
      <!-- One live region, there from the start: each toast added to it is announced. -->
      <ol aria-live="polite" aria-label="Notifications" class="relative flex w-full flex-col gap-2">
        @for (toast of toasts(); track toast.id) {
          <li
            udxMotion="slide reflow"
            class="flex min-h-12 items-center gap-2 rounded bg-inverse-surface py-0.5 ps-4 pe-2 text-body-medium text-inverse-on-surface"
          >
            Saved to your library
            <!-- Undo: the toast leaves at once. -->
            <udx-button
              variant="text"
              size="small"
              label="Undo"
              class="text-inverse-primary"
              stateColor="inverse-primary"
              (click)="dismiss(toast.id)"
            />
          </li>
        }
      </ol>
    </div>
  `,
})
export class MotionRecipeToastsAngular {
  protected readonly toasts = signal<{ id: number }[]>([]);
  private lastId = 0;
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();

  constructor() {
    inject(DestroyRef).onDestroy(() => this.timers.forEach(clearTimeout));
  }

  protected save(): void {
    const id = ++this.lastId;
    // Past three, the oldest leaves as the new one enters.
    this.toasts.update((list) => [...list, { id }].slice(-MAX));
    this.timers.set(id, setTimeout(() => this.dismiss(id), LIFETIME));
  }

  protected dismiss(id: number): void {
    clearTimeout(this.timers.get(id));
    this.timers.delete(id);
    // Angular keeps the toast until its exit has played, then removes it.
    this.toasts.update((list) => list.filter((toast) => toast.id !== id));
  }
}
