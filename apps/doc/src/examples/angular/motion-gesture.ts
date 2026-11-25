import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Button, Motion, MotionGesture } from '@udixio/ui-angular';
import { defineGesture } from '@udixio/motion/gesture';
import '@udixio/motion/presets';

// Reorder: the move is prevented, and the state moves the track, so Angular renders the new order.
defineGesture('reorder', {
  type: 'reorder',
  alternative: 'grab',
});
// Swipe: the card flies out and is aria-hidden; the state counts it. Delete does the same on the focused card.
defineGesture('complete', {
  type: 'swipe',
  alternative: 'action',
});

const TRACKS = ['Night Drive', 'Signal Fire', 'Open Road'];

@Component({
  selector: 'docs-motion-gesture-angular',
  standalone: true,
  imports: [Button, Motion, MotionGesture],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex w-full max-w-88 flex-col items-start gap-4">
      <ul class="flex w-full flex-col gap-2">
        @for (track of tracks(); track track) {
          <li
            udxMotion="reflow"
            udxMotionGesture="reorder"
            (udxReorder)="reorder($event)"
            class="cursor-grab rounded-2xl bg-surface-container-highest py-2.5 pl-4 pr-4 text-body-large text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
          >
            {{ track }}
          </li>
        }
      </ul>
      <!-- Restore renders the card again: a swiped card stays aria-hidden until the page removes it. -->
      @if (visible()) {
        <div
          udxMotionGesture="complete"
          (udxSwipe)="swipe()"
          class="cursor-grab rounded-2xl bg-tertiary-container px-4 py-3 text-title-small text-on-tertiary-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
        >
          Suggested: Lantern
        </div>
      }
      <p class="text-body-medium text-on-surface-variant">Swiped away: {{ swiped() }}</p>
      <udx-button size="small" label="Restore the queue" (click)="restore()" />
    </div>
  `,
})
export class MotionGestureAngular {
  protected readonly tracks = signal(TRACKS);
  protected readonly visible = signal(true);
  protected readonly swiped = signal(0);

  protected reorder(event: CustomEvent<{ from: number; to: number }>): void {
    // Preventing the move keeps the DOM as it is: the state moves the track, and the template renders the new order.
    event.preventDefault();
    const { from, to } = event.detail;
    this.tracks.update((list) => {
      const next = [...list];
      const [track] = next.splice(from, 1);
      next.splice(to, 0, track!);
      return next;
    });
  }

  protected swipe(): void {
    this.swiped.update((count) => count + 1);
  }

  protected restore(): void {
    this.tracks.set(TRACKS);
    this.swiped.set(0);
    // The card leaves, then renders again in a new render of the page.
    this.visible.set(false);
    setTimeout(() => this.visible.set(true));
  }
}
