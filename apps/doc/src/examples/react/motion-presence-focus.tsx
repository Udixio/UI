import { useRef, useState } from 'react';
import { Button, Motion, Presence } from '@udixio/ui-react';
import '@udixio/motion/presets';

// A panel that leaves with focus inside it: its exit gives focus back to the button that opened it.
export function Filters() {
  const [open, setOpen] = useState(false);
  const opener = useRef<HTMLButtonElement>(null);

  return (
    <div className="flex flex-col items-start gap-4">
      <Button
        ref={opener}
        size="small"
        variant="tonal"
        label="Filters"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      />
      <Presence>
        {open && (
          // Focus is on Close: the exit moves it to the Filters button before the panel turns inert.
          <Motion key="filters" name="fade" restoreFocus={() => opener.current}>
            <Button size="small" variant="text" label="Close" onClick={() => setOpen(false)} />
          </Motion>
        )}
      </Presence>
    </div>
  );
}
