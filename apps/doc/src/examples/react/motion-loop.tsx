import { useState } from 'react';
import { defineMotion } from '@udixio/motion';
import { Button, Motion } from '@udixio/ui-react';

// Three bars on three beats: each beat is a loop of its own.
// It goes up and back down: a loop restarts from its
// first keyframe, so the last one returns to it.
defineMotion('beat-low', {
  verb: 'loop',
  keyframes: [
    { scaleY: 0.3 },
    { scaleY: 1 },
    { scaleY: 0.3 },
  ],
  timing: { duration: 'duration.medium4', easing: 'easing.standard' },
  pause: 'control',
});
defineMotion('beat-mid', {
  verb: 'loop',
  keyframes: [
    { scaleY: 0.3 },
    { scaleY: 1 },
    { scaleY: 0.3 },
  ],
  timing: { duration: 'duration.long3', easing: 'easing.standard' },
  pause: 'control',
});
defineMotion('beat-high', {
  verb: 'loop',
  keyframes: [
    { scaleY: 0.3 },
    { scaleY: 1 },
    { scaleY: 0.3 },
  ],
  timing: { duration: 'duration.extraLong1', easing: 'easing.standard' },
  pause: 'control',
});

export function MotionLoopReact() {
  const [paused, setPaused] = useState(false);

  return (
    <div className="flex flex-col items-start gap-6">
      {/* The three bars play their beats, and the button holds them. */}
      <div className="flex h-16 items-end gap-2">
        <Motion
          as="span"
          name="beat-low"
          paused={paused}
          className="block h-full w-3 origin-bottom rounded-full bg-primary"
        />
        <Motion
          as="span"
          name="beat-mid"
          paused={paused}
          className="block h-full w-3 origin-bottom rounded-full bg-primary"
        />
        <Motion
          as="span"
          name="beat-high"
          paused={paused}
          className="block h-full w-3 origin-bottom rounded-full bg-primary"
        />
      </div>
      <Button
        size="small"
        label={paused ? 'Play' : 'Pause'}
        onClick={() => setPaused((value) => !value)}
      />
    </div>
  );
}
