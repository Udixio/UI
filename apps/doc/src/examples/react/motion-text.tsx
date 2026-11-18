import { defineMotion } from '@udixio/motion';
import { useMotion } from '@udixio/ui-react';

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

export function MotionTextReact() {
  const headline = useMotion('headline');

  return (
    <div className="flex flex-col items-start gap-4">
      <p
        ref={headline.ref}
        className="text-headline-medium text-on-surface"
      >
        Every word arrives in turn, and is read once.
      </p>
      <button
        type="button"
        onClick={headline.play}
        className="rounded-full bg-primary px-6 py-2.5 text-label-large text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
      >
        Replay
      </button>
    </div>
  );
}
