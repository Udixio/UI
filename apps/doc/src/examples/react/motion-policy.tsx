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
      {/* `motion-none` sets `--udx-motion: none`: the card shows its end state whatever the policy. */}
      <Motion name="slide" className="motion-none">
        Shown at once
      </Motion>
    </div>
  );
}
