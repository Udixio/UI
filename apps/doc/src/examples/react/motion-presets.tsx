import { useState } from 'react';
import { Motion, useMotion } from '@udixio/ui-react';
import '@udixio/motion/presets';

export function MotionPresetsReact() {
  const [open, setOpen] = useState(true);
  // An emphasis replays with play(), from the Save button.
  const save = useMotion('press');

  return (
    <div className="flex flex-col items-start gap-4">
      {/* A preset is named, and needs no definition: `fade` enters and leaves. */}
      <Motion name="fade" present={open}>
        Fades in and out
      </Motion>
      <button type="button" onClick={() => setOpen((value) => !value)}>
        {open ? 'Hide' : 'Show'}
      </button>
      <button ref={save.ref} type="button" onClick={() => save.play()}>
        Save
      </button>
    </div>
  );
}
