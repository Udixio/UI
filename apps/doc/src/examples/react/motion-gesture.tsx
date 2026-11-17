import { useState } from 'react';
import { defineGesture } from '@udixio/motion/gesture';
import { useMotionGesture } from '@udixio/ui-react';
import '@udixio/motion/presets';

// A swipe: released far or fast enough, the item flies out. Delete or Backspace does the same on the focused item.
defineGesture('notification-dismiss', { kind: 'swipe', alternative: 'action' });

function Notification({ label, onSwiped }: { label: string; onSwiped: () => void }) {
  // The handler is called when the item is swiped away; the item then stays out of sight, aria-hidden.
  const row = useMotionGesture<HTMLLIElement>('notification-dismiss', { onSwipe: onSwiped });

  return (
    <li
      ref={row.ref}
      className="rounded-xl bg-surface-container-high px-4 py-3 text-body-large text-on-surface"
    >
      {label}
    </li>
  );
}

export function MotionGestureReact() {
  const [round, setRound] = useState(0);
  const [swiped, setSwiped] = useState(0);

  return (
    <div className="flex flex-col items-start gap-4">
      <p className="text-body-large text-on-surface">Swiped away: {swiped}</p>
      {/* A new round renders the list again, so every item is bound again. */}
      <ul key={round} className="flex w-72 flex-col gap-2">
        {[1, 2, 3].map((n) => (
          <Notification key={n} label={`Notification ${n}`} onSwiped={() => setSwiped((count) => count + 1)} />
        ))}
      </ul>
      <button
        type="button"
        onClick={() => {
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
