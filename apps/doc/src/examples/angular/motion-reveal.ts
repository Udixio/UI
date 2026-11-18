import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Motion } from '@udixio/ui-angular';
import '@udixio/motion/presets';

const TITLES = ['Release notes', 'Design review', 'Build passed', 'New comment', 'Room booked', 'Invoice sent'];

@Component({
  selector: 'docs-motion-reveal-angular',
  standalone: true,
  imports: [Motion],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ol
      tabindex="0"
      aria-label="Feed"
      class="flex h-64 w-full max-w-[22rem] flex-col gap-2 overflow-y-auto rounded-2xl bg-surface-container p-3"
    >
      @for (title of titles; track title) {
        <!-- A card rises once, as it enters the view of the feed: until then it waits in its first frame. -->
        <li
          udxMotion="rise"
          class="rounded-2xl bg-surface-container-high px-4 py-3 text-title-small text-on-surface"
        >
          {{ title }}
        </li>
      }
    </ol>
  `,
})
export class MotionRevealAngular {
  protected readonly titles = TITLES;
}
