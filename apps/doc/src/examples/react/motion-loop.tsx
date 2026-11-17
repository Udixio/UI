import { useState } from 'react';
import { useMotion } from '@udixio/ui-react';
import '@udixio/motion/presets';

export function MotionLoopReact() {
  const [paused, setPaused] = useState(false);
  // The rotate preset is a loop with a pause control: `paused` holds it, and releasing it plays it again.
  const spinner = useMotion<HTMLSpanElement>('rotate', { paused });

  return (
    <div className="flex items-center gap-6">
      <span
        ref={spinner.ref}
        className="block size-8 rounded-full border-4 border-primary border-t-transparent"
      />
      <button
        type="button"
        onClick={() => setPaused((value) => !value)}
        className="rounded-full bg-primary px-6 py-2.5 text-label-large text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
      >
        {paused ? 'Play spinner' : 'Pause spinner'}
      </button>
    </div>
  );
}
