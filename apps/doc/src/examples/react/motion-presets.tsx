import { useState } from 'react';
import { useMotion } from '@udixio/ui-react';
import '@udixio/motion/presets';

export function MotionPresetsReact() {
  const [open, setOpen] = useState(true);
  const [saves, setSaves] = useState(0);
  // A preset is named, and needs no definition: `fade` enters and leaves.
  const card = useMotion('fade', { present: open });
  // An emphasis replays each time `state` changes.
  const save = useMotion('press', { state: saves });

  return (
    <div className="flex flex-col items-start gap-4">
      {card.mounted && <div ref={card.ref}>Fades in and out</div>}
      <button type="button" onClick={() => setOpen((value) => !value)}>
        {open ? 'Hide' : 'Show'}
      </button>
      <button ref={save.ref} type="button" onClick={() => setSaves((value) => value + 1)}>
        Save
      </button>
    </div>
  );
}
