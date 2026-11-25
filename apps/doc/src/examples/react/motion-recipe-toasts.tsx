import { useEffect, useRef, useState } from 'react';
import { Button, Motion, Presence } from '@udixio/ui-react';
import '@udixio/motion/presets';

const LIFETIME = 4000;
const MAX = 3;

export function MotionRecipeToastsReact() {
  const [toasts, setToasts] = useState<number[]>([]);
  const lastId = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = (id: number) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    // The Presence keeps the toast rendered until its exit has played.
    setToasts((list) => list.filter((toast) => toast !== id));
  };

  const save = () => {
    const id = ++lastId.current;
    // Past three, the oldest leaves as the new one enters.
    setToasts((list) => [...list, id].slice(-MAX));
    timers.current.set(id, setTimeout(() => dismiss(id), LIFETIME));
  };

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex min-h-54 w-full max-w-80 flex-col items-start gap-4">
      <Button size="small" label="Save to library" onClick={save} />
      {/* One live region, there from the start: each toast added to it is announced. */}
      <ol aria-live="polite" aria-label="Notifications" className="relative flex w-full flex-col gap-2">
        <Presence>
          {toasts.map((id) => (
            <Motion
              key={id}
              as="li"
              name="slide reflow"
              className="flex min-h-12 items-center gap-2 rounded bg-inverse-surface py-0.5 ps-4 pe-2 text-body-medium text-inverse-on-surface"
            >
              Saved to your library
              {/* Undo: the toast leaves at once. */}
              <Button
                variant="text"
                size="small"
                label="Undo"
                className="text-inverse-primary"
                stateColor="inverse-primary"
                onClick={() => dismiss(id)}
              />
            </Motion>
          ))}
        </Presence>
      </ol>
    </div>
  );
}
