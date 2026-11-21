import { useState } from 'react';
import { Motion } from '@udixio/ui-react';
import '@udixio/motion/presets';

// One card, and no Presence: present plays its entry and its exit.
export function Saved() {
  const [open, setOpen] = useState(true);

  return (
    <>
      <button type="button" onClick={() => setOpen((value) => !value)}>
        {open ? 'Hide' : 'Show'}
      </button>
      {/* Once its exit has played, the card is no longer rendered. */}
      <Motion name="slide" present={open}>
        Saved to your library
      </Motion>
    </>
  );
}
