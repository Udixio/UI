import { defineSequence } from '@udixio/motion/sequence';
import { Button, useMotionSequence } from '@udixio/ui-react';

// The body starts one normal step after the title starts, so the two overlap.
defineSequence('intro-steps', {
  verb: 'appear',
  steps: {
    title: { keyframes: [{ opacity: 0, y: 12 }, { opacity: 1, y: 0 }] },
    body: { keyframes: [{ opacity: 0 }, { opacity: 1 }], at: '+=normal' },
  },
});

export function MotionSequencesIntroReact() {
  // The ref binds the root, and play() replays the sequence from its start.
  const intro = useMotionSequence<HTMLDivElement>('intro-steps');

  return (
    <div className="flex flex-col items-start gap-4">
      <div ref={intro.ref} className="flex flex-col items-start gap-3">
        <h3 data-motion-step="title" className="text-title-large text-on-surface">
          Steps, in order
        </h3>
        <p data-motion-step="body" className="text-body-large text-on-surface-variant">
          The body starts after the title.
        </p>
      </div>
      <Button size="small" label="Replay" onClick={() => intro.play()} />
    </div>
  );
}
