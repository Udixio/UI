import { defineSequence } from '@udixio/motion/sequence';
import { useMotionSequence } from '@udixio/ui-react';

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

export function MotionSequenceReact() {
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
      <button
        type="button"
        onClick={() => intro.play()}
        className="rounded-full bg-primary px-6 py-2.5 text-label-large text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
      >
        Replay
      </button>
    </div>
  );
}
