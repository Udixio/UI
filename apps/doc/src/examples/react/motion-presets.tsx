import { useState } from 'react';
import { Button, Motion, Presence, useMotion } from '@udixio/ui-react';
import '@udixio/motion/presets';

export function MotionPresetsReact() {
  const [open, setOpen] = useState(true);
  // An emphasis replays with play(), from the Save button.
  const save = useMotion('press');

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
      {/* The motion sits on a plain wrapper around the button it presses. */}
      <span ref={save.ref} className="inline-flex">
        <Button size="small" variant="tonal" label="Save" onClick={() => save.play()} />
      </span>
    </div>
  );
}
