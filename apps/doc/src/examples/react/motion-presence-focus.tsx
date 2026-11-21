import { useRef, useState } from 'react';
import { Motion, Presence } from '@udixio/ui-react';
import '@udixio/motion/presets';

// A panel that leaves with focus inside it: its exit gives focus back to the button that opened it.
export function Filters() {
  const [open, setOpen] = useState(false);
  const opener = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button ref={opener} type="button" aria-expanded={open} onClick={() => setOpen(true)}>
        Filters
      </button>
      <Presence>
        {open && (
          // Focus is on Close: the exit moves it to the Filters button before the panel turns inert.
          <Motion key="filters" name="fade" restoreFocus={() => opener.current}>
            <button type="button" onClick={() => setOpen(false)}>
              Close
            </button>
          </Motion>
        )}
      </Presence>
    </>
  );
}
