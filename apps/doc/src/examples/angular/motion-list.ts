import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { defineMotion } from '@udixio/motion';
import { Motion } from '@udixio/ui-angular';
import '@udixio/motion/presets';

// Messages that enter in the same change start one step apart, from the first.
// A leaving message is taken out of the flow, so its neighbours close the gap.
defineMotion('inbox', {
  verb: 'appear',
  keyframes: [
    { opacity: 0, y: -16, scale: 0.96 },
    { opacity: 1, y: 0, scale: 1 },
  ],
  stagger: 'normal',
  origin: 'first',
  exit: 'out-of-flow',
});

type Message = { id: number; text: string };

const TEXTS = ['Mo: deploy finished', 'Ines: new comment', 'Kai: release is ready'];

@Component({
  selector: 'docs-motion-list-angular',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Motion],
  template: `
    <div class="flex flex-col items-start gap-4">
      <button
        type="button"
        (click)="addThree()"
        class="rounded-full bg-primary px-6 py-2.5 text-label-large text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
      >
        Add three
      </button>
      <!-- out-of-flow takes a leaving message out of the flow: the list must be positioned. -->
      <ul class="relative flex w-80 max-w-full flex-col gap-2">
        @for (item of list(); track item.id) {
          <li udxMotion="inbox reflow">
            <div class="flex items-center justify-between gap-3 rounded-2xl bg-surface-container-high py-2 pl-4 pr-2">
              <span class="text-body-large text-on-surface">{{ item.text }}</span>
              <button
                type="button"
                (click)="dismiss(item.id)"
                class="rounded-full px-3 py-2 text-label-large text-primary hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
              >
                Dismiss
              </button>
            </div>
          </li>
        }
      </ul>
    </div>
  `,
})
export class MotionListAngular {
  protected readonly list = signal<Message[]>([
    { id: 1, text: 'Ada: your build passed' },
    { id: 2, text: 'Lin: review requested' },
  ]);
  private lastId = 2;

  protected addThree(): void {
    const three = TEXTS.map((text) => ({ id: ++this.lastId, text }));
    // Added in one change: the three cascade in.
    this.list.update((current) => [...three, ...current]);
  }

  protected dismiss(id: number): void {
    // Angular keeps the element until its exit has played, then removes it.
    this.list.update((current) => current.filter((item) => item.id !== id));
  }
}
