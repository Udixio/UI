import { useState } from 'react';
import { useMotion } from '@udixio/ui-react';
import '@udixio/motion/presets';

export function MotionEmphasisReact() {
  const [count, setCount] = useState(0);
  // The press preset replays each time `state` changes: here, on each click.
  const button = useMotion<HTMLButtonElement>('press', { state: count });

  return (
    <button
      ref={button.ref}
      type="button"
      onClick={() => setCount((value) => value + 1)}
      className="rounded-full bg-primary px-6 py-2.5 text-label-large text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
    >
      Pressed {count} times
    </button>
  );
}
