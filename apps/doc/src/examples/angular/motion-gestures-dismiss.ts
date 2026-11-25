import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { defineGesture } from '@udixio/motion/gesture';
import { Motion, MotionGesture } from '@udixio/ui-angular';
import '@udixio/motion/presets';

// A swipe flies the track out, hidden from assistive
// technology. Keep afterFlyOut at its default, hide: the
// list removes the track, and Angular takes it out of the
// page. A focused track hands the focus to the next track
// as it flies out, by itself.
defineGesture('dismiss', { type: 'swipe' });

@Component({
  selector: 'app-track-list',
  standalone: true,
  imports: [Motion, MotionGesture],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul class="flex w-full max-w-88 flex-col gap-2">
      @for (track of tracks(); track track) {
        <!-- reflow closes the gap that a removed track leaves; the swipe removes the track, and (udxSwipe) removes it. -->
        <li
          udxMotion="reflow"
          udxMotionGesture="dismiss"
          (udxSwipe)="dismiss(track)"
          class="cursor-grab rounded-2xl bg-surface-container-highest py-2.5 pl-4 pr-4 text-body-large text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
        >
          {{ track }}
        </li>
      }
    </ul>
  `,
})
export class QueueList {
  protected readonly tracks = signal([
    'Night Drive',
    'Signal Fire',
    'Open Road',
  ]);

  protected dismiss(track: string): void {
    this.tracks.update((list) => list.filter((item) => item !== track));
  }
}
