import { useRef, useState } from 'react';
import { useMotion } from '@udixio/ui-react';
import '@udixio/motion/presets';

export function MotionPolicyReact() {
  const [open, setOpen] = useState(true);
  const toggle = useRef<HTMLButtonElement>(null);
  // Where focus goes when the exit starts with focus inside the card (WCAG 2.4.3).
  const card = useMotion('slide', {
    present: open,
    restoreFocus: () => toggle.current,
  });
  // Under the reduced policy this card is shown at once: `--udx-motion: none` holds its end state.
  const still = useMotion('slide');

  return (
    <div className="flex flex-col items-start gap-4">
      <button ref={toggle} type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        {open ? 'Hide' : 'Show'}
      </button>
      {card.mounted && (
        <div ref={card.ref}>Saved</div>
      )}
      <div ref={still.ref} className="[--udx-motion:none]">
        Shown at once
      </div>
    </div>
  );
}
