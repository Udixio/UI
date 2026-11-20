import { useRef, useState } from 'react';
import { Motion } from '@udixio/ui-react';
import '@udixio/motion/presets';

export function MotionPolicyReact() {
  const [open, setOpen] = useState(true);
  const toggle = useRef<HTMLButtonElement>(null);

  return (
    <div className="flex flex-col items-start gap-4">
      <button ref={toggle} type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        {open ? 'Hide' : 'Show'}
      </button>
      {/* Where focus goes when the exit starts with focus inside the card (WCAG 2.4.3). */}
      <Motion name="slide" present={open} restoreFocus={() => toggle.current}>
        Saved
      </Motion>
      {/* Under the reduced policy this card is shown at once: `--udx-motion: none` holds its end state. */}
      <Motion name="slide" className="[--udx-motion:none]">
        Shown at once
      </Motion>
    </div>
  );
}
