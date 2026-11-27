import {
  ChangeDetectionStrategy,
  Component,
  signal,
} from '@angular/core';
import type { MotionHandle } from '@udixio/motion';
import {
  defineSequence,
} from '@udixio/motion/sequence';
import {
  Button,
  MotionSequence,
  Slider,
} from '@udixio/ui-angular';

// The kicker plays first. The title starts one
// normal step after it, the artist one after that.
defineSequence('timeline-steps', {
  verb: 'appear',
  steps: {
    kicker: {
      keyframes: [{ opacity: 0 }, { opacity: 1 }],
    },
    title: {
      keyframes: [
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0 },
      ],
      timing: {
        duration: 'duration.extraLong2',
        easing: 'easing.standard',
      },
      at: '+=normal',
    },
    body: {
      keyframes: [{ opacity: 0 }, { opacity: 1 }],
      at: '+=normal',
    },
  },
});

// A play ends after its delay and its duration.
const endOf = (handle: MotionHandle) =>
  handle.delay + handle.duration;

@Component({
  selector: 'docs-motion-sequences-timeline-angular',
  imports: [Button, MotionSequence, Slider],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="flex w-full max-w-72 flex-col
        items-start gap-4"
    >
      <div
        #intro="udxMotionSequence"
        udxMotionSequence="timeline-steps"
        udxMotionSequenceSettled
        class="flex w-full flex-col gap-2 rounded-3xl
          bg-primary-container p-5
          text-on-primary-container"
      >
        <p
          data-motion-step="kicker"
          class="text-label-large"
        >
          Now playing
        </p>
        <h3
          data-motion-step="title"
          class="text-title-large"
        >
          Night Drive
        </h3>
        <p
          data-motion-step="body"
          class="text-body-medium"
        >
          Lumen · Side B
        </p>
      </div>
      <div class="flex w-full items-center gap-3">
        <udx-button
          size="small"
          [label]="playing() ? 'Pause' : 'Play'"
          (click)="toggle(intro)"
        />
        <udx-slider
          aria-label="Sequence time"
          [min]="0"
          [max]="1000"
          [step]="1"
          [value]="0"
          (valueChange)="seek(intro, $event)"
        />
      </div>
      <p
        class="flex items-baseline gap-2
          text-body-medium text-on-surface-variant"
      >
        <span
          class="text-label-large text-on-surface"
        >
          Sequence time
        </span>
        <output>{{ time() }} ms</output>
      </p>
    </div>
  `,
})
export class MotionSequencesTimelineAngular {
  protected readonly playing = signal(false);
  // The time reached, in whole milliseconds.
  protected readonly time = signal(0);

  // Play resumes a paused sequence, and replays a
  // finished one.
  protected toggle(intro: MotionSequence): void {
    if (this.playing()) {
      intro.handle?.pause();
      this.playing.set(false);
      return;
    }
    const handle = intro.handle;
    if (handle && this.time() < endOf(handle)) {
      handle.play();
    } else {
      intro.play();
    }
    this.playing.set(true);
    this.follow(intro);
  }

  // The slider seeks the sequence, in thousandths of
  // its length, and holds it there.
  protected seek(intro: MotionSequence, to: number) {
    const handle = intro.handle ?? intro.play();
    handle.pause();
    handle.seek((to / 1000) * endOf(handle));
    this.playing.set(false);
    this.time.set(Math.round(handle.currentTime));
  }

  // While the sequence plays, its time is read on
  // each frame, and the play stops at its end.
  private follow(intro: MotionSequence): void {
    const tick = () => {
      const handle = intro.handle;
      const now = handle?.currentTime ?? 0;
      this.time.set(Math.round(now));
      if (handle && now >= endOf(handle)) {
        this.playing.set(false);
      } else if (this.playing()) {
        requestAnimationFrame(tick);
      }
    };
    requestAnimationFrame(tick);
  }
}
