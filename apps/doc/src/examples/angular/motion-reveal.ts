import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Motion } from '@udixio/ui-angular';
import '@udixio/motion/presets';

const TRACKS = [
  { title: 'Intro', length: '1:12' },
  { title: 'Night drive', length: '3:48' },
  { title: 'Glass city', length: '4:05' },
  { title: 'Low tide', length: '3:21' },
  { title: 'Harbour', length: '4:40' },
  { title: 'Afterglow', length: '3:55' },
  { title: 'Halfway', length: '2:58' },
  { title: 'Paper moon', length: '4:12' },
];

@Component({
  selector: 'docs-motion-reveal-angular',
  standalone: true,
  imports: [Motion],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ol
      tabindex="0"
      aria-label="Tracks"
      class="flex h-64 w-full max-w-88 flex-col gap-2 overflow-y-auto rounded-3xl bg-surface-container p-3"
    >
      <!-- Each track rises once, as it enters the view of the list: until then it waits in its first frame. -->
      @for (item of tracks; track item.title) {
        <li
          udxMotion="rise"
          class="flex items-center justify-between gap-3 rounded-2xl bg-surface-container-high px-4 py-3"
        >
          <span class="text-title-small text-on-surface">{{ item.title }}</span>
          <span class="text-body-medium text-on-surface-variant">{{ item.length }}</span>
        </li>
      }
    </ol>
  `,
})
export class MotionRevealAngular {
  protected readonly tracks = TRACKS;
}
