import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { defineMotion } from '@udixio/motion';
import { Button, IconButton, Motion } from '@udixio/ui-angular';
import { iClose } from '@udixio/icons-rounded-400/close';
import '@udixio/motion/presets';

// A toast rises into place; a leaving toast is taken out of the flow, so the others close the gap at once.
defineMotion('toast', {
  verb: 'appear',
  keyframes: [
    { opacity: 0, y: 16, scale: 0.96 },
    { opacity: 1, y: 0, scale: 1 },
  ],
  exit: 'out-of-flow',
});

type Toast = { id: number; text: string };

const MESSAGES = ['Draft saved', 'Link copied', 'Photo uploaded', 'Invite sent'];
const LIFETIME = 6000;
const MAX = 3;

@Component({
  selector: 'docs-motion-recipe-toasts-angular',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, IconButton, Motion],
  template: `
    <div class="flex min-h-54 w-full max-w-80 flex-col items-start gap-4">
      <udx-button size="small" label="Notify" (click)="notify()" />
      <!-- One live region, there from the start: each toast added to it is announced. -->
      <ol aria-live="polite" aria-label="Notifications" class="relative flex w-full flex-col gap-2">
        @for (toast of toasts(); track toast.id) {
          <li
            udxMotion="toast reflow"
            class="flex items-center justify-between gap-2 rounded-2xl bg-surface-container-highest py-1 pl-4 pr-1"
          >
            <span class="min-w-0 text-body-medium text-on-surface">{{ toast.text }}</span>
            <udx-icon-button size="small" label="Dismiss" [icon]="closeIcon" [tooltip]="false" (click)="dismiss(toast.id)" />
          </li>
        }
      </ol>
    </div>
  `,
})
export class MotionRecipeToastsAngular {
  protected readonly toasts = signal<Toast[]>([]);
  protected readonly closeIcon = iClose;
  private lastId = 0;
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();

  constructor() {
    inject(DestroyRef).onDestroy(() => this.timers.forEach(clearTimeout));
  }

  protected notify(): void {
    const id = ++this.lastId;
    const text = MESSAGES[(id - 1) % MESSAGES.length];
    // Past three, the oldest leaves as the new one enters.
    this.toasts.update((list) => [...list, { id, text }].slice(-MAX));
    this.timers.set(id, setTimeout(() => this.dismiss(id), LIFETIME));
  }

  protected dismiss(id: number): void {
    clearTimeout(this.timers.get(id));
    this.timers.delete(id);
    // Angular keeps the toast until its exit has played, then removes it.
    this.toasts.update((list) => list.filter((toast) => toast.id !== id));
  }
}
