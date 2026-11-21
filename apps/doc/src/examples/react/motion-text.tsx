import { defineMotion } from '@udixio/motion';
import { Button, useMotion } from '@udixio/ui-react';

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
      {/* The hook's play() replays an emphasis only: a reveal replays through its binding. */}
      <Button size="small" label="Replay" onClick={() => headline.getBinding('view')?.play()} />
    </div>
  );
}
