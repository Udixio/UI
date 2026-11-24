import { useEffect, useState } from 'react';
import { Button, Motion, Presence } from '@udixio/ui-react';
import '@udixio/motion/presets';

export function MotionPresenceReact() {
  const [toast, setToast] = useState(false);

  // The toast leaves by itself after four seconds.
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(false), 4000);
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
        {/* Keeps the toast until its exit has played. */}
        <Presence>
          {toast && (
            <Motion
              key="toast"
              name="slide"
              className="rounded bg-inverse-surface px-4 py-3.5 text-body-medium text-inverse-on-surface"
            >
              Saved to your library
            </Motion>
          )}
        </Presence>
      </div>
    </div>
  );
}
