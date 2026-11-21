import { useState } from 'react';
import { Motion } from '@udixio/ui-react';
import '@udixio/motion/presets';

// One card, and no Presence: present plays its entry and its exit, and the card stays in the page.
export function Saved() {
  const [open, setOpen] = useState(true);

  return (
    <>
      <button type="button" onClick={() => setOpen((value) => !value)}>
        {open ? 'Hide' : 'Show'}
      </button>
      {/* Once its exit has played, the card is hidden: it is still rendered, so its text is in the server HTML. */}
      <Motion name="slide" present={open}>
        Saved to your library
      </Motion>
    </>
  );
}
