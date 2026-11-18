import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Motion } from '@udixio/ui-angular';
import '@udixio/motion/presets';

@Component({
  selector: 'docs-motion-scrub-angular',
  standalone: true,
  imports: [Motion],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex w-full max-w-[22rem] flex-col gap-10">
      <!-- A scrub: the card moves against the scroll as it crosses the viewport. -->
      <article
        udxMotion="parallax"
        class="rounded-3xl bg-tertiary-container px-5 py-4 text-title-small text-on-tertiary-container"
      >
        Moves against the scroll
      </article>
      <article
        udxMotion="parallax"
        class="rounded-3xl bg-tertiary-container px-5 py-4 text-title-small text-on-tertiary-container"
      >
        Moves against the scroll, too
      </article>
    </div>
  `,
})
export class MotionScrubAngular {}
