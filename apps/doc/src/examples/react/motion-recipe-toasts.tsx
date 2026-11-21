import { useEffect, useRef, useState } from 'react';
import { defineMotion } from '@udixio/motion';
import { Button, IconButton, Motion, Presence } from '@udixio/ui-react';
import { iClose } from '@udixio/icons-rounded-400/close';
import '@udixio/motion/presets';

// A toast rises into place; a leaving toast is taken out of the flow, so the others close the gap at once.
defineMotion('toast', {
  verb: 'appear',
  keyframes: [
    { opacity: 0, y: 16, scale: 0.96 },
    { opacity: 1, y: 0, scale: 1 },
  ],
  exit: 'out-of-flow',
});

type Toast = { id: number; text: string };

const MESSAGES = ['Draft saved', 'Link copied', 'Photo uploaded', 'Invite sent'];
const LIFETIME = 6000;
const MAX = 3;

export function MotionRecipeToastsReact() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const lastId = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = (id: number) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    // The Presence keeps the toast rendered until its exit has played.
    setToasts((list) => list.filter((toast) => toast.id !== id));
  };

  const notify = () => {
    const id = ++lastId.current;
    const text = MESSAGES[(id - 1) % MESSAGES.length];
    // Past three, the oldest leaves as the new one enters.
    setToasts((list) => [...list, { id, text }].slice(-MAX));
    timers.current.set(id, setTimeout(() => dismiss(id), LIFETIME));
  };

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex min-h-54 w-full max-w-80 flex-col items-start gap-4">
      <Button size="small" label="Notify" onClick={notify} />
      {/* One live region, there from the start: each toast added to it is announced. */}
      <ol aria-live="polite" aria-label="Notifications" className="relative flex w-full flex-col gap-2">
        <Presence>
          {toasts.map((toast) => (
            <Motion
              key={toast.id}
              as="li"
              name="toast reflow"
              className="flex items-center justify-between gap-2 rounded-2xl bg-surface-container-highest py-1 pl-4 pr-1"
            >
              <span className="min-w-0 text-body-medium text-on-surface">{toast.text}</span>
              <IconButton size="small" label="Dismiss" icon={iClose} tooltip={false} onClick={() => dismiss(toast.id)} />
            </Motion>
          ))}
        </Presence>
      </ol>
    </div>
  );
}
