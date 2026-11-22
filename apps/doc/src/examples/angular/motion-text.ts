import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Button, Motion } from '@udixio/ui-angular';
import { defineMotion } from '@udixio/motion';

// A reveal split into words: the words wait until the sentence enters the view, then play once.
defineMotion('headline', {
  verb: 'reveal',
  split: 'words',
  reduced: 'fade',
  keyframes: [
    { opacity: 0, y: 12 },
    { opacity: 1, y: 0 },
  ],
});

@Component({
  selector: 'docs-motion-text-angular',
  standalone: true,
  imports: [Button, Motion],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-start gap-4">
      <p
        udxMotion="headline"
        #headline="udxMotion"
        class="text-headline-medium text-on-surface"
      >
        Every word arrives in turn, and is read once.
      </p>
      <!-- play() on the directive replays the reveal from its first frame. -->
      <udx-button size="small" label="Replay" (click)="headline.play()" />
    </div>
  `,
})
export class MotionTextAngular {}
