import { useState } from 'react';
import { defineMotion } from '@udixio/motion';
import { Button, Motion } from '@udixio/ui-react';

// Each beat's cycle, in milliseconds.
const beats = [
  { name: 'beat-low', duration: 800 },
  { name: 'beat-mid', duration: 1100 },
  { name: 'beat-high', duration: 1400 },
];

// One definition, three beats. A loop restarts
// from its first keyframe: the last returns to it.
for (const { name, duration } of beats) {
  defineMotion(name, {
    verb: 'loop',
    keyframes: [
      { scaleY: 0.3 },
      { scaleY: 1 },
      { scaleY: 0.3 },
    ],
    timing: { duration, easing: 'easing.standard' },
    pause: 'control',
  });
}

export function MotionLoopReact() {
  const [paused, setPaused] = useState(false);

  return (
    <div className="flex flex-col items-start gap-6">
      {/* A bar per beat; the button holds them. */}
      <div className="flex h-16 items-end gap-2">
        {beats.map(({ name }) => (
          <Motion
            key={name}
            as="span"
            name={name}
            paused={paused}
            className="block h-full w-3 origin-bottom
              rounded-full bg-primary"
          />
        ))}
      </div>
      <Button
        size="small"
        label={paused ? 'Play' : 'Pause'}
        onClick={() => setPaused((value) => !value)}
      />
    </div>
  );
}
