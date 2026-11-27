import { useState } from 'react';
import {
  Button,
  Motion,
  Presence,
} from '@udixio/ui-react';
import './motion-toast'; // Step 2: the motion.

// Step 3: the toast, attached to its motion by name.
function Toast({ onUndo }: { onUndo: () => void }) {
  return (
    <Motion
      name="toast"
      className="flex min-h-12 items-center gap-2
        rounded bg-inverse-surface py-0.5 ps-4 pe-2
        text-body-medium text-inverse-on-surface"
    >
      Saved to your library
      {/* Undo: the toast leaves at once. */}
      <Button
        variant="text"
        size="small"
        label="Undo"
        className="text-inverse-primary"
        stateColor="inverse-primary"
        onClick={onUndo}
      />
    </Motion>
  );
}

export function MotionGettingStartedReact() {
  const [toast, setToast] = useState(false);

  return (
    <div
      className="flex flex-col items-center gap-6"
    >
      <Button
        size="small"
        label="Save to library"
        onClick={() => setToast(true)}
      />
      {/* A live region: the toast is announced. */}
      <div role="status" className="h-12">
        {/* Presence keeps it until its exit. */}
        <Presence>
          {toast && (
            <Toast
              key="toast"
              onUndo={() => setToast(false)}
            />
          )}
        </Presence>
      </div>
    </div>
  );
}
