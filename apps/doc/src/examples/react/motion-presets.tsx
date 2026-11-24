import { useState } from 'react';
import { Button, Motion, Presence } from '@udixio/ui-react';
import '@udixio/motion/presets';

export function MotionPresetsReact() {
  const [open, setOpen] = useState(true);
  // Each new value of the count replays the press.
  const [saves, setSaves] = useState(0);

  return (
    <div className="flex flex-col items-start gap-4">
      {/* A preset is named, and needs no definition: `fade` enters and leaves. */}
      <Presence>
        {open && (
          <Motion key="fade" name="fade">
            Fades in and out
          </Motion>
        )}
      </Presence>
      <Button size="small" label={open ? 'Hide' : 'Show'} onClick={() => setOpen((value) => !value)} />
      {/* The press goes on the Button itself, and moves its own <button>. */}
      <Motion
        as={Button}
        name="press"
        state={saves}
        size="small"
        variant="tonal"
        label="Save"
        onClick={() => setSaves((value) => value + 1)}
      />
    </div>
  );
}
