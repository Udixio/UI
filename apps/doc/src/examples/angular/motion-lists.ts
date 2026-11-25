import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Button, Motion } from '@udixio/ui-angular';
import '@udixio/motion/presets';

const TRACKS = ['Night drive', 'Glass city', 'Low tide', 'Harbour', 'Afterglow', 'Halfway', 'Paper moon'];

type Track = { id: number; title: string };

@Component({
  selector: 'docs-motion-lists-angular',
  standalone: true,
  imports: [Button, Motion],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex w-full max-w-80 flex-col items-start gap-4">
      <udx-button size="small" label="Add three" (click)="addThree()" />
      <p class="text-title-small text-on-surface">Up next</p>
      <ul class="flex w-full flex-col gap-2">
        <!-- Angular keeps a leaving track on the page until its exit has played, then removes it. -->
        @for (item of queue(); track item.id) {
          <li
            udxMotion="cascade reflow"
            class="rounded-2xl bg-surface-container-high px-4 py-3 text-body-large text-on-surface"
          >
            {{ item.title }}
          </li>
        }
      </ul>
    </div>
  `,
})
export class MotionListsAngular {
  protected readonly queue = signal<Track[]>([
    { id: 1, title: 'Intro' },
    { id: 2, title: 'Morning' },
    { id: 3, title: 'Harbour' },
    { id: 4, title: 'Afterglow' },
    { id: 5, title: 'Halfway' },
  ]);
  private lastId = 5;

  protected addThree(): void {
    const three = [0, 1, 2].map(() => {
      this.lastId += 1;
      return { id: this.lastId, title: TRACKS[this.lastId % TRACKS.length] };
    });
    // Added in one change at the bottom: the three cascade in, and past five the oldest leave from the top.
    this.queue.update((list) => [...list, ...three].slice(-5));
  }
}
