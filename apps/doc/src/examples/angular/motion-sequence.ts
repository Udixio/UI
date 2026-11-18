import { ChangeDetectionStrategy, Component, ElementRef, ViewChild } from '@angular/core';
import { MotionSequence } from '@udixio/ui-angular';
import { defineSequence, getSequence } from '@udixio/motion/sequence';

// Two steps: the body starts a fixed step after the title, and the root names the sequence.
defineSequence('intro-steps', {
  verb: 'appear',
  steps: {
    title: {
      keyframes: [
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0 },
      ],
    },
    body: {
      keyframes: [{ opacity: 0 }, { opacity: 1 }],
      at: '+=normal',
    },
  },
});

@Component({
  selector: 'docs-motion-sequence-angular',
  standalone: true,
  imports: [MotionSequence],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-start gap-4">
      <div #intro udxMotionSequence="intro-steps" class="flex flex-col items-start gap-3">
        <h3 data-motion-step="title" class="text-title-large text-on-surface">Steps, in order</h3>
        <p data-motion-step="body" class="text-body-large text-on-surface-variant">The body starts after the title.</p>
      </div>
      <button
        type="button"
        (click)="replay()"
        class="rounded-full bg-primary px-6 py-2.5 text-label-large text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
      >
        Replay
      </button>
    </div>
  `,
})
export class MotionSequenceAngular {
  @ViewChild('intro', { static: true }) private readonly intro!: ElementRef<HTMLElement>;

  protected replay(): void {
    getSequence(this.intro.nativeElement)?.play();
  }
}
