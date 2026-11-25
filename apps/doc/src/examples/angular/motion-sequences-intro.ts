import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Button, MotionSequence } from '@udixio/ui-angular';
import { defineSequence } from '@udixio/motion/sequence';

// The kicker plays first; the title starts one normal step after it, and the artist one normal step after the title.
defineSequence('intro-steps', {
  verb: 'appear',
  steps: {
    kicker: { keyframes: [{ opacity: 0 }, { opacity: 1 }] },
    title: {
      keyframes: [{ opacity: 0, y: 12 }, { opacity: 1, y: 0 }],
      timing: { duration: 'duration.extraLong2', easing: 'easing.standard' },
      at: '+=normal',
    },
    body: { keyframes: [{ opacity: 0 }, { opacity: 1 }], at: '+=normal' },
  },
});

@Component({
  selector: 'docs-motion-sequences-intro-angular',
  standalone: true,
  imports: [Button, MotionSequence],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex w-full max-w-72 flex-col items-start gap-4">
      <!-- The template reference gives the directive: its play() replays the sequence from its start. -->
      <div
        #intro="udxMotionSequence"
        udxMotionSequence="intro-steps"
        udxMotionSequenceSettled
        class="flex w-full flex-col gap-2 rounded-3xl bg-primary-container p-5 text-on-primary-container"
      >
        <p data-motion-step="kicker" class="text-label-large">Now playing</p>
        <h3 data-motion-step="title" class="text-title-large">Night Drive</h3>
        <p data-motion-step="body" class="text-body-medium">Lumen · Side B</p>
      </div>
      <udx-button size="small" label="Replay" (click)="intro.play()" />
    </div>
  `,
})
export class MotionSequencesIntroAngular {}
