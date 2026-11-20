import { useRef, useState } from 'react';
import { Button, Motion, Presence } from '@udixio/ui-react';
import '@udixio/motion/presets';

export function MotionPolicyReact() {
  const [open, setOpen] = useState(true);
  const toggle = useRef<HTMLButtonElement>(null);

  return (
    <div className="flex flex-col items-start gap-4">
      <Button
        ref={toggle}
        size="small"
        aria-expanded={open}
        label={open ? 'Hide' : 'Show'}
        onClick={() => setOpen((value) => !value)}
      />
      {/* Where focus goes when the exit starts with focus inside the card (WCAG 2.4.3). */}
      <Presence>
        {open && (
          <Motion key="saved" name="slide" restoreFocus={() => toggle.current}>
            Saved
          </Motion>
        )}
      </Presence>
      {/* Under the reduced policy this card is shown at once: `--udx-motion: none` holds its end state. */}
      <Motion name="slide" className="[--udx-motion:none]">
        Shown at once
      </Motion>
    </div>
  );
}
