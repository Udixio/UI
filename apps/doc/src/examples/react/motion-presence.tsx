import { useState } from 'react';
import { Motion, Presence } from '@udixio/ui-react';
import '@udixio/motion/presets';

export function MotionPresenceReact() {
  const [open, setOpen] = useState(true);

  return (
    <div className="flex flex-col items-start gap-4">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="rounded-full bg-primary px-6 py-2.5 text-label-large text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
      >
        Toggle React card
      </button>
      {/* The card enters when it is shown, and is removed once its exit has played. */}
      <Presence>
        {open && (
          <Motion
            key="card"
            name="slide"
            data-demo-card="react"
            className="rounded-2xl bg-surface-container-high p-6"
          >
            <h3 className="text-title-medium text-on-surface">React</h3>
            <p className="text-body-medium text-on-surface-variant">
              Mounted and unmounted by React.
            </p>
          </Motion>
        )}
      </Presence>
    </div>
  );
}
