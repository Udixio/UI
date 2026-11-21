import { useState } from 'react';
import { Button, Motion, Presence } from '@udixio/ui-react';
import { defineMotion } from '@udixio/motion';

// Defined once, by name, before the first render: the card is attached to it by that name.
defineMotion('card-enter', {
  verb: 'appear',
  keyframes: [
    { opacity: 0, y: 24 },
    { opacity: 1, y: 0 },
  ],
  timing: 'spring.default.spatial',
});

export function MotionGettingStartedReact() {
  const [open, setOpen] = useState(true);

  return (
    <div className="flex flex-col items-start gap-4">
      {/* Presence keeps the card rendered until its exit has played: the key tells it which child leaves. */}
      <Presence>
        {open && (
          <Motion key="card" name="card-enter">
            Fades in and rises
          </Motion>
        )}
      </Presence>
      <Button size="small" label={open ? 'Hide' : 'Show'} onClick={() => setOpen((value) => !value)} />
    </div>
  );
}
