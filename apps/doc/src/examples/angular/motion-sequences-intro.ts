import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Button, MotionSequence } from '@udixio/ui-angular';
import { defineSequence } from '@udixio/motion/sequence';

// The body starts one normal step after the title starts, so the two overlap.
defineSequence('intro-steps', {
  verb: 'appear',
  steps: {
    title: { keyframes: [{ opacity: 0, y: 12 }, { opacity: 1, y: 0 }] },
    body: { keyframes: [{ opacity: 0 }, { opacity: 1 }], at: '+=normal' },
  },
});

@Component({
  selector: 'docs-motion-sequences-intro-angular',
  standalone: true,
  imports: [Button, MotionSequence],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-start gap-4">
      <!-- The template reference gives the directive: its play() replays the sequence from its start. -->
      <div #intro="udxMotionSequence" udxMotionSequence="intro-steps" class="flex flex-col items-start gap-3">
        <h3 data-motion-step="title" class="text-title-large text-on-surface">Steps, in order</h3>
        <p data-motion-step="body" class="text-body-large text-on-surface-variant">The body starts after the title.</p>
      </div>
      <udx-button size="small" label="Replay" (click)="intro.play()" />
    </div>
  `,
})
export class MotionSequencesIntroAngular {}
