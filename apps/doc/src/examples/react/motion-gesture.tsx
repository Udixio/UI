import { useState } from 'react';
import { defineGesture } from '@udixio/motion/gesture';
import { Button, Motion } from '@udixio/ui-react';
import '@udixio/motion/presets';

// Reorder: the move is prevented, and the state moves the track, so React renders the new order.
defineGesture('reorder', {
  type: 'reorder',
  alternative: 'grab',
});
// Swipe: the card flies out and is aria-hidden; the state counts it. Delete does the same on the focused card.
defineGesture('complete', {
  type: 'swipe',
  alternative: 'action',
});

const TRACKS = ['Night Drive', 'Signal Fire', 'Open Road'];

export function MotionGestureReact() {
  const [tracks, setTracks] = useState(TRACKS);
  const [round, setRound] = useState(0);
  const [swiped, setSwiped] = useState(0);

  const move = (from: number, to: number) =>
    setTracks((list) => {
      const next = [...list];
      const [track] = next.splice(from, 1);
      next.splice(to, 0, track!);
      return next;
    });

  return (
    <div className="flex w-full max-w-88 flex-col items-start gap-4">
      <ul className="flex w-full flex-col gap-2">
        {tracks.map((track) => (
          // One element, two motions: the gesture moves it, and the layout motion lets its neighbours follow.
          <Motion
            key={track}
            as="li"
            name="reflow"
            gesture="reorder"
            onMotionReorder={(event) => {
              event.preventDefault();
              move(event.detail.from, event.detail.to);
            }}
            className="cursor-grab rounded-2xl bg-surface-container-highest py-2.5 pl-4 pr-4 text-body-large text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
          >
            {track}
          </Motion>
        ))}
      </ul>
      {/* A new round renders the card again: a swiped card stays aria-hidden until the page removes it. */}
      <Motion
        key={round}
        gesture="complete"
        onMotionSwipe={() => setSwiped((count) => count + 1)}
        className="cursor-grab rounded-2xl bg-tertiary-container px-4 py-3 text-title-small text-on-tertiary-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
      >
        Suggested: Lantern
      </Motion>
      <p className="text-body-medium text-on-surface-variant">Swiped away: {swiped}</p>
      <Button
        size="small"
        label="Restore the queue"
        onClick={() => {
          setTracks(TRACKS);
          setRound((value) => value + 1);
          setSwiped(0);
        }}
      />
    </div>
  );
}
