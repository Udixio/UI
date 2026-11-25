import { defineSequence } from '@udixio/motion/sequence';
import { Button, Motion, useMotionSequence } from '@udixio/ui-react';

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

export function MotionSequencesIntroReact() {
  // The ref binds the card; each <Motion step> is a step. play() replays the sequence from its start.
  const intro = useMotionSequence<HTMLDivElement>('intro-steps');

  return (
    <div className="flex w-full max-w-72 flex-col items-start gap-4">
      <div
        ref={intro.ref}
        className="flex w-full flex-col gap-2 rounded-3xl bg-primary-container p-5 text-on-primary-container"
      >
        <Motion as="p" step="kicker" className="text-label-large">
          Now playing
        </Motion>
        <Motion as="h3" step="title" className="text-title-large">
          Night Drive
        </Motion>
        <Motion as="p" step="body" className="text-body-medium">
          Lumen · Side B
        </Motion>
      </div>
      <Button size="small" label="Replay" onClick={() => intro.play()} />
    </div>
  );
}
