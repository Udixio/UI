import { Component, ElementRef, viewChild, viewChildren } from '@angular/core';
import { scrollTo } from '@udixio/motion/scroll';
import { Button } from '@udixio/ui-angular';

const TRACKS = [
  'Glass Harbour',
  'Low Tide',
  'Paper Moon',
  'Slow Current',
  'Afterglow',
  'Night Drive',
  'Signal Fire',
  'Open Road',
  'Dust and Sea',
  'Lantern',
];
const CURRENT = 5;

@Component({
  selector: 'docs-motion-scroll-angular',
  standalone: true,
  imports: [Button],
  template: `
    <div class="flex w-full max-w-72 flex-col items-start gap-4">
      <div
        #queue
        role="region"
        aria-label="Queue"
        tabindex="0"
        class="h-56 w-full overflow-y-auto rounded-3xl bg-surface-container p-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
      >
        <ol>
          @for (track of tracks; track track; let index = $index) {
            <li
              #row
              class="flex h-14 items-center justify-between gap-2 whitespace-nowrap rounded-2xl px-4 text-body-large"
              [class.bg-primary-container]="index === current"
              [class.text-on-primary-container]="index === current"
              [class.text-on-surface]="index !== current"
            >
              {{ track }}
              @if (index === current) {
                <span class="text-label-medium whitespace-nowrap">Now playing</span>
              }
            </li>
          }
        </ol>
      </div>
      <udx-button size="small" label="Go to the current track" (click)="toCurrent()" />
    </div>
  `,
})
export class MotionScrollAngular {
  private readonly queue = viewChild.required<ElementRef<HTMLElement>>('queue');
  private readonly rows = viewChildren<ElementRef<HTMLElement>>('row');
  protected readonly tracks = TRACKS;
  protected readonly current = CURRENT;

  // The queue scrolls to the current track, and the track takes the focus when it arrives.
  protected toCurrent(): void {
    scrollTo(this.rows()[CURRENT]!.nativeElement, {
      container: this.queue().nativeElement,
      focus: true,
    });
  }
}
