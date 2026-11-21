import { useState } from 'react';
import { Button, Motion, Presence } from '@udixio/ui-react';
import { defineMotion } from '@udixio/motion';

// A spring token: the fast spatial spring moves the panel.
defineMotion('panel-in', {
  verb: 'appear',
  keyframes: [
    { opacity: 0, y: 24 },
    { opacity: 1, y: 0 },
  ],
  timing: 'spring.fast.spatial',
});

// A curve: a duration token and an easing token, in place of a spring.
defineMotion('banner-in', {
  verb: 'appear',
  keyframes: [{ opacity: 0 }, { opacity: 1 }],
  timing: { duration: 'duration.medium2', easing: 'easing.standard' },
});

export function MotionTokensReact() {
  const [open, setOpen] = useState(true);

  return (
    <div className="flex flex-col items-start gap-4">
      {/* Presence keeps each child until its exit has played: the key tells it which child leaves. */}
      <Presence>
        {open && (
          <Motion key="panel" name="panel-in">
            Moves on a spring
          </Motion>
        )}
        {open && (
          <Motion key="banner" name="banner-in">
            Fades on a curve
          </Motion>
        )}
      </Presence>
      <Button size="small" label={open ? 'Hide' : 'Show'} onClick={() => setOpen((value) => !value)} />
    </div>
  );
}
