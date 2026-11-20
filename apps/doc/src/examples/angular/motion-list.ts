import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { defineMotion } from '@udixio/motion';
import { Button, Motion } from '@udixio/ui-angular';
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
  imports: [Button, Motion],
  template: `
    <div class="flex w-full max-w-80 flex-col items-start gap-4">
      <udx-button size="small" label="Add three" (click)="addThree()" />
      <!-- out-of-flow takes a leaving message out of the flow: the list must be positioned. -->
      <ul class="relative flex w-full flex-col gap-2">
        @for (item of list(); track item.id) {
          <li udxMotion="inbox reflow">
            <div class="flex items-center justify-between gap-3 rounded-2xl bg-surface-container-high py-2 pl-4 pr-2">
              <span class="min-w-0 text-body-large text-on-surface">{{ item.text }}</span>
              <udx-button variant="text" size="small" label="Dismiss" (click)="dismiss(item.id)" />
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
    // Added in one change: the three cascade in, and past five the oldest leave.
    this.list.update((current) => [...three, ...current].slice(0, 5));
  }

  protected dismiss(id: number): void {
    // Angular keeps the element until its exit has played, then removes it.
    this.list.update((current) => current.filter((item) => item.id !== id));
  }
}
