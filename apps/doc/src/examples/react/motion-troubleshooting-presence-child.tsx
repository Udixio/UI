import { useState } from 'react';
import { Button, Motion, Presence } from '@udixio/ui-react';
import '@udixio/motion/presets';

// The card is a Motion, so Presence keeps it rendered until its exit has played. The key is how Presence
// tells which child left.
export function Card() {
  const [open, setOpen] = useState(true);

  return (
    <div className="flex flex-col items-start gap-4">
      <Button size="small" label="Toggle the card" onClick={() => setOpen((value) => !value)} />
      <Presence>
        {open && (
          <Motion key="card" as="section" name="slide">
            <h3>The card</h3>
            <p>It leaves with its exit, then React removes it.</p>
          </Motion>
        )}
      </Presence>
    </div>
  );
}
