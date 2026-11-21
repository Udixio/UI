import { useState } from 'react';
import { Motion, Presence } from '@udixio/ui-react';
import '@udixio/motion/presets';

// The card is a Motion, so Presence keeps it rendered until its exit has played. The key is how Presence
// tells which child left.
export function Card() {
  const [open, setOpen] = useState(true);

  return (
    <>
      <button type="button" onClick={() => setOpen((value) => !value)}>
        Toggle the card
      </button>
      <Presence>
        {open && (
          <Motion key="card" as="section" name="slide">
            <h3>The card</h3>
            <p>It leaves with its exit, then React removes it.</p>
          </Motion>
        )}
      </Presence>
    </>
  );
}
