import { useState } from 'react';
import { defineGesture } from '@udixio/motion/gesture';
import { Motion } from '@udixio/ui-react';
import '@udixio/motion/presets';

// Reorder: the move is prevented, and the state moves the task, so React renders the new order and the layout animates it.
defineGesture('reorder', {
  kind: 'reorder',
  alternative: 'grab',
});
// Swipe: the card flies out and is aria-hidden; the state counts it. Delete does the same on the focused card.
defineGesture('complete', {
  kind: 'swipe',
  alternative: 'action',
});

const TASKS = ['Reply to the design review', 'Ship the release notes', 'Book the room for Friday'];

type Move = (from: number, to: number) => void;

export function MotionGestureReact() {
  const [tasks, setTasks] = useState(TASKS);
  const [round, setRound] = useState(0);
  const [swiped, setSwiped] = useState(0);

  const move: Move = (from, to) =>
    setTasks((list) => {
      const next = [...list];
      const [task] = next.splice(from, 1);
      next.splice(to, 0, task);
      return next;
    });

  return (
    <div className="flex w-full max-w-[22rem] flex-col items-start gap-4">
      <ul className="flex w-full flex-col gap-2">
        {tasks.map((label) => (
          // One element, two motions: the gesture moves it, and the layout motion lets its neighbours follow.
          <Motion
            key={label}
            as="li"
            name="reflow"
            gesture="reorder"
            onMotionReorder={(event) => {
              event.preventDefault();
              const { from, to } = event.detail;
              move(from, to);
            }}
            className="cursor-grab rounded-2xl bg-surface-container-highest py-2.5 pl-4 pr-4 text-body-large text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
          >
            {label}
          </Motion>
        ))}
      </ul>
      {/* A new round renders the card again: a swiped card stays aria-hidden until the page removes it. */}
      <Motion
        key={round}
        name={[]}
        gesture="complete"
        onMotionSwipe={() => setSwiped((count) => count + 1)}
        className="cursor-grab rounded-2xl bg-tertiary-container px-4 py-3 text-title-small text-on-tertiary-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
      >
        Send the invoice
      </Motion>
      <p className="text-body-medium text-on-surface-variant">Swiped away: {swiped}</p>
      <button
        type="button"
        onClick={() => {
          setTasks(TASKS);
          setRound((value) => value + 1);
          setSwiped(0);
        }}
        className="rounded-full bg-primary px-6 py-2.5 text-label-large text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
      >
        Restore
      </button>
    </div>
  );
}
