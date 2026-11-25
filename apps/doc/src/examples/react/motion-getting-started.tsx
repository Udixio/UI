import { useEffect, useState } from 'react';
import {
  Button,
  Motion,
  Presence,
} from '@udixio/ui-react';
import { defineMotion } from '@udixio/motion';

// Step 2: the motion, defined once by name.
defineMotion('toast', {
  verb: 'appear',
  keyframes: [
    { opacity: 0, y: 16, scale: 0.96 },
    { opacity: 1, y: 0, scale: 1 },
  ],
});

// The toast's look: an M3 snackbar with an action.
const toastClass = [
  'flex min-h-12 items-center gap-2 rounded',
  'bg-inverse-surface py-0.5 ps-4 pe-2',
  'text-body-medium text-inverse-on-surface',
].join(' ');

export function MotionGettingStartedReact() {
  const [toast, setToast] = useState(false);

  // The toast leaves by itself after four seconds.
  useEffect(() => {
    if (!toast) return;
    const leave = () => setToast(false);
    const timer = setTimeout(leave, 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <div className="flex flex-col items-center gap-6">
      <Button
        size="small"
        label="Save to library"
        onClick={() => setToast(true)}
      />
      {/* A live region: the toast is announced. */}
      <div role="status" className="h-12">
        {/* Presence keeps it until its exit ends. */}
        <Presence>
          {toast && (
            // Step 3: attached by its name.
            <Motion
              key="toast"
              name="toast"
              className={toastClass}
            >
              Saved to your library
              {/* Undo: the toast leaves at once. */}
              <Button
                variant="text"
                size="small"
                label="Undo"
                className="text-inverse-primary"
                stateColor="inverse-primary"
                onClick={() => setToast(false)}
              />
            </Motion>
          )}
        </Presence>
      </div>
    </div>
  );
}
