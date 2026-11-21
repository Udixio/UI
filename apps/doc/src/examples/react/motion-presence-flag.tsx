import { useId, useState } from 'react';
import { Button, Motion } from '@udixio/ui-react';
import '@udixio/motion/presets';

// One card, and no Presence: present plays its entry and its exit, and the card stays in the page.
export function Saved() {
  const [open, setOpen] = useState(true);
  const id = useId();

  return (
    <div className="flex flex-col items-start gap-4">
      {/* aria-expanded and aria-controls tell assistive technology that the button shows and hides the card. */}
      <Button
        size="small"
        label={open ? 'Hide' : 'Show'}
        aria-expanded={open}
        aria-controls={`${id}-card`}
        onClick={() => setOpen((value) => !value)}
      />
      {/* Once its exit has played, the card is hidden: it is still rendered, so its text is in the server HTML. */}
      <Motion id={`${id}-card`} name="slide" present={open}>
        Saved to your library
      </Motion>
    </div>
  );
}
