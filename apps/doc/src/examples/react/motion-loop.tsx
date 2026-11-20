import { useState } from 'react';
import { Button, Motion } from '@udixio/ui-react';
import '@udixio/motion/presets';

export function MotionLoopReact() {
  const [paused, setPaused] = useState(false);

  return (
    <div className="flex items-center gap-6">
      {/* The rotate preset is a loop with a pause control: `paused` holds it, and releasing it plays it again. */}
      <Motion
        as="span"
        name="rotate"
        paused={paused}
        className="block size-8 rounded-full border-4 border-primary border-t-transparent"
      />
      <Button
        size="small"
        label={paused ? 'Play spinner' : 'Pause spinner'}
        onClick={() => setPaused((value) => !value)}
      />
    </div>
  );
}
